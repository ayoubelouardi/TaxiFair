import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { EstimateRequest, EstimateResponse } from "@shared/schema";

// === ROUTING SERVICE (MOCK/SIMPLE) ===
// In a real app, this would call OSRM, Mapbox, or Google Maps.
// For this pilot, we'll use a straight-line distance * road factor fallback
// to ensure it works without API keys.
async function calculateRoute(
  originLat: number, 
  originLng: number, 
  destLat: number, 
  destLng: number
): Promise<{ distanceMeters: number; durationSeconds: number }> {
  
  // Haversine formula
  const R = 6371e3; // metres
  const φ1 = originLat * Math.PI/180; // φ, λ in radians
  const φ2 = destLat * Math.PI/180;
  const Δφ = (destLat-originLat) * Math.PI/180;
  const Δλ = (destLng-originLng) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const straightLineDistance = R * c; // in meters

  // "Road Factor": Real roads are rarely straight. 1.4 is a common urban multiplier.
  const ROAD_FACTOR = 1.4;
  const estimatedDistance = Math.ceil(straightLineDistance * ROAD_FACTOR);

  // Estimate duration: Avg urban speed ~30 km/h = 8.33 m/s
  const AVG_SPEED_MPS = 8.33;
  const estimatedDuration = Math.ceil(estimatedDistance / AVG_SPEED_MPS);

  return {
    distanceMeters: estimatedDistance,
    durationSeconds: estimatedDuration
  };
}

// === PRICING ENGINE ===
// This implements the Strategy Pattern logic described in the PRD
function calculatePrice(
  distanceMeters: number, 
  travelTime: Date, 
  rules: any
): { total: number; breakdown: any; isNight: boolean } {
  
  let total = 0;
  const breakdown: any = {};
  
  // 1. Base Fare
  if (rules.enabled_rules.includes("BASE_FARE")) {
    total += rules.base_fare;
    breakdown.baseFare = rules.base_fare;
  }

  // 2. Distance Calculation (Step-based)
  if (rules.enabled_rules.includes("DISTANCE_STEP_CALC")) {
    const steps = Math.ceil(distanceMeters / rules.distance_step_meters);
    const distanceCost = steps * rules.price_per_step;
    total += distanceCost;
    breakdown.distanceFare = Number(distanceCost.toFixed(2));
  }

  // 3. Minimum Check (Partial application - we check total at the end, but logic flows here)
  let subtotalBeforeNight = total;

  // 4. Night Surcharge
  let isNight = false;
  if (rules.enabled_rules.includes("NIGHT_MULTIPLIER")) {
    const hour = travelTime.getHours();
    const start = rules.night_start_hour;
    const end = rules.night_end_hour;
    
    // Check if time is in night window (e.g., 20:00 to 06:00)
    // Complex logic: if start > end (crosses midnight), then (hour >= start OR hour < end)
    // If start < end (e.g. 00:00 to 06:00), then (hour >= start AND hour < end)
    
    if (start > end) {
      isNight = (hour >= start || hour < end);
    } else {
      isNight = (hour >= start && hour < end);
    }

    if (isNight) {
      // PRD says: "+50% on the final calculated fare (including the minimum)"
      // BUT "If Day Fare = 6 MAD (bumped to 7.50 min), Night Fare = 7.50 * 1.5"
      // So we must apply Min Fare logic FIRST, then Night Surcharge.
      
      // Let's check min fare on the subtotal first?
      // "If Day Fare = 10 MAD, Night Fare = 15 MAD" -> 10 * 1.5
      // "If Day Fare = 6 MAD (bumped to 7.50 min), Night Fare = 7.50 * 1.5"
      // So Min Fare rule applies to the Base + Distance first.
    }
  }

  // Apply Minimum Fare Logic
  if (rules.enabled_rules.includes("MINIMUM_CHECK")) {
    if (total < rules.minimum_fare) {
      const adjustment = rules.minimum_fare - total;
      breakdown.minimumFareAdjustment = Number(adjustment.toFixed(2));
      total = rules.minimum_fare;
    }
  }

  // Apply Night Surcharge Logic (After Min Fare as per PRD example)
  if (isNight && rules.enabled_rules.includes("NIGHT_MULTIPLIER")) {
    const surcharge = total * (rules.night_surcharge_percent / 100);
    breakdown.nightSurcharge = Number(surcharge.toFixed(2));
    total += surcharge;
  } else {
    breakdown.nightSurcharge = 0;
  }

  return { total: Number(total.toFixed(2)), breakdown, isNight };
}


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed data on startup
  await storage.seedCasablancaPilot();

  // Config endpoints
  app.get(api.config.getCities.path, async (_req, res) => {
    const cities = await storage.getCities();
    res.json(cities);
  });

  app.get(api.config.getModes.path, async (_req, res) => {
    const modes = await storage.getTransportModes();
    res.json(modes);
  });

  // Estimation Endpoint
  app.post(api.estimate.calculate.path, async (req, res) => {
    try {
      const input = api.estimate.calculate.input.parse(req.body);
      
      // 1. Fetch Profile
      const city = await storage.getCityBySlug(input.citySlug);
      const mode = await storage.getTransportModeBySlug(input.transportModeSlug);

      if (!city || !mode) {
        return res.status(404).json({ message: "City or Transport Mode not found" });
      }

      const profile = await storage.getPricingProfile(city.id, mode.id);
      if (!profile) {
        return res.status(404).json({ message: "Pricing profile not found for this combination" });
      }

      // 2. Route
      const route = await calculateRoute(
        input.originLat, 
        input.originLng, 
        input.destLat, 
        input.destLng
      );

      // 3. Parse Time
      const travelTime = input.travelTime ? new Date(input.travelTime) : new Date();

      // 4. Execute Pricing Pipeline
      const { total, breakdown, isNight } = calculatePrice(
        route.distanceMeters, 
        travelTime, 
        profile.rulesConfig
      );

      const response: EstimateResponse = {
        estimatedPrice: total,
        currency: city.currencyCode,
        distanceKm: Number((route.distanceMeters / 1000).toFixed(2)),
        durationMin: Math.ceil(route.durationSeconds / 60),
        isNightFare: isNight,
        breakdown: breakdown
      };

      res.json(response);

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Estimation error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
