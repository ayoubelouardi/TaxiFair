import type { EstimateRequest, EstimateResponse } from "@shared/schema";
import { getPricingProfileBySlugs, getCities } from "@/data/pricing";

interface RouteResult {
  distanceMeters: number;
  durationSeconds: number;
}

const ROAD_FACTOR = 1.4;
const AVG_SPEED_MPS = 8.33;

function calculateRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): RouteResult {
  const R = 6371e3;
  const phi1 = (originLat * Math.PI) / 180;
  const phi2 = (destLat * Math.PI) / 180;
  const deltaPhi = ((destLat - originLat) * Math.PI) / 180;
  const deltaLambda = ((destLng - originLng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const straightLineDistance = R * c;
  const estimatedDistance = Math.ceil(straightLineDistance * ROAD_FACTOR);
  const estimatedDuration = Math.ceil(estimatedDistance / AVG_SPEED_MPS);

  return {
    distanceMeters: estimatedDistance,
    durationSeconds: estimatedDuration,
  };
}

function calculatePrice(
  distanceMeters: number,
  travelTime: Date,
  rules: Record<string, any>,
): { total: number; breakdown: any; isNight: boolean } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  if (rules.enabled_rules.includes("BASE_FARE")) {
    total += rules.base_fare;
    breakdown.baseFare = rules.base_fare;
  }

  if (rules.enabled_rules.includes("DISTANCE_STEP_CALC")) {
    const steps = Math.ceil(distanceMeters / rules.distance_step_meters);
    const distanceCost = steps * rules.price_per_step;
    total += distanceCost;
    breakdown.distanceFare = Number(distanceCost.toFixed(2));
  }

  let isNight = false;
  if (rules.enabled_rules.includes("NIGHT_MULTIPLIER")) {
    const hour = travelTime.getHours();
    const start = rules.night_start_hour;
    const end = rules.night_end_hour;

    if (start > end) {
      isNight = hour >= start || hour < end;
    } else {
      isNight = hour >= start && hour < end;
    }
  }

  if (rules.enabled_rules.includes("MINIMUM_CHECK")) {
    if (total < rules.minimum_fare) {
      const adjustment = rules.minimum_fare - total;
      breakdown.minimumFareAdjustment = Number(adjustment.toFixed(2));
      total = rules.minimum_fare;
    }
  }

  if (isNight && rules.enabled_rules.includes("NIGHT_MULTIPLIER")) {
    const surcharge = total * (rules.night_surcharge_percent / 100);
    breakdown.nightSurcharge = Number(surcharge.toFixed(2));
    total += surcharge;
  } else {
    breakdown.nightSurcharge = 0;
  }

  return { total: Number(total.toFixed(2)), breakdown, isNight };
}

function calculatePriceWithOverride(
  distanceMeters: number,
  rules: Record<string, any>,
  isNightOverride: boolean,
): { total: number; breakdown: any; isNight: boolean } {
  let total = 0;
  const breakdown: Record<string, number> = {};

  if (rules.enabled_rules.includes("BASE_FARE")) {
    total += rules.base_fare;
    breakdown.baseFare = rules.base_fare;
  }

  if (rules.enabled_rules.includes("DISTANCE_STEP_CALC")) {
    const steps = Math.ceil(distanceMeters / rules.distance_step_meters);
    const distanceCost = steps * rules.price_per_step;
    total += distanceCost;
    breakdown.distanceFare = Number(distanceCost.toFixed(2));
  }

  if (rules.enabled_rules.includes("MINIMUM_CHECK")) {
    if (total < rules.minimum_fare) {
      const adjustment = rules.minimum_fare - total;
      breakdown.minimumFareAdjustment = Number(adjustment.toFixed(2));
      total = rules.minimum_fare;
    }
  }

  if (isNightOverride && rules.enabled_rules.includes("NIGHT_MULTIPLIER")) {
    const surcharge = total * (rules.night_surcharge_percent / 100);
    breakdown.nightSurcharge = Number(surcharge.toFixed(2));
    total += surcharge;
  } else {
    breakdown.nightSurcharge = 0;
  }

  return { total: Number(total.toFixed(2)), breakdown, isNight: isNightOverride };
}

export function estimateFare(input: EstimateRequest): EstimateResponse {
  const profile = getPricingProfileBySlugs(
    input.citySlug,
    input.transportModeSlug,
  );

  if (!profile) {
    throw new Error("Pricing profile not found for this combination");
  }

  const city = getCities().find((item) => item.slug === input.citySlug);
  if (!city) {
    throw new Error("City not found");
  }

  const route = calculateRoute(
    input.originLat,
    input.originLng,
    input.destLat,
    input.destLng,
  );

  const travelTime = input.travelTime ? new Date(input.travelTime) : new Date();
  const { total, breakdown, isNight } = calculatePrice(
    route.distanceMeters,
    travelTime,
    profile.rulesConfig,
  );

  const finalIsNight =
    input.isNightOverride !== undefined ? input.isNightOverride : isNight;

  let finalTotal = total;
  let finalBreakdown = breakdown;

  if (input.isNightOverride !== undefined && input.isNightOverride !== isNight) {
    const reCalc = calculatePriceWithOverride(
      route.distanceMeters,
      profile.rulesConfig,
      input.isNightOverride,
    );
    finalTotal = reCalc.total;
    finalBreakdown = reCalc.breakdown;
  }

  return {
    estimatedPrice: finalTotal,
    currency: city.currencyCode,
    distanceKm: Number((route.distanceMeters / 1000).toFixed(2)),
    durationMin: Math.ceil(route.durationSeconds / 60),
    isNightFare: finalIsNight,
    breakdown: finalBreakdown,
  };
}
