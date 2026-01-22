import { db } from "./db";
import { 
  cities, 
  transportModes, 
  pricingProfiles, 
  type City, 
  type TransportMode, 
  type PricingProfile 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Config getters
  getCities(): Promise<City[]>;
  getTransportModes(): Promise<TransportMode[]>;
  getCityBySlug(slug: string): Promise<City | undefined>;
  getTransportModeBySlug(slug: string): Promise<TransportMode | undefined>;
  
  // Profile lookup
  getPricingProfile(cityId: string, modeId: string): Promise<PricingProfile | undefined>;
  
  // Seeding
  seedCasablancaPilot(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getCities(): Promise<City[]> {
    return await db.select().from(cities);
  }

  async getTransportModes(): Promise<TransportMode[]> {
    return await db.select().from(transportModes);
  }

  async getCityBySlug(slug: string): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.slug, slug));
    return city;
  }

  async getTransportModeBySlug(slug: string): Promise<TransportMode | undefined> {
    const [mode] = await db.select().from(transportModes).where(eq(transportModes.slug, slug));
    return mode;
  }

  async getPricingProfile(cityId: string, modeId: string): Promise<PricingProfile | undefined> {
    const [profile] = await db.select().from(pricingProfiles).where(
      and(
        eq(pricingProfiles.cityId, cityId),
        eq(pricingProfiles.modeId, modeId),
        eq(pricingProfiles.active, true)
      )
    );
    return profile;
  }

  async seedCasablancaPilot(): Promise<void> {
    // Check if data exists
    const existingCities = await this.getCities();
    if (existingCities.length > 0) return;

    // 1. Create Casablanca
    const [casa] = await db.insert(cities).values({
      name: "Casablanca",
      slug: "casablanca",
      currencyCode: "MAD",
      timezone: "Africa/Casablanca"
    }).returning();

    // 2. Create Transport Modes
    const [petitTaxi] = await db.insert(transportModes).values({
      name: "Small Red Taxi",
      slug: "petit_taxi_red",
      iconUrl: "taxi-icon.png" // Placeholder
    }).returning();

    // 3. Create Pricing Profile
    await db.insert(pricingProfiles).values({
      cityId: casa.id,
      modeId: petitTaxi.id,
      pricingStrategy: 'METERED',
      active: true,
      rulesConfig: {
        base_fare: 2.00,
        minimum_fare: 7.50,
        distance_step_meters: 80,
        price_per_step: 0.20,
        night_surcharge_percent: 50,
        night_start_hour: 20,
        night_end_hour: 6,
        enabled_rules: ["BASE_FARE", "DISTANCE_STEP_CALC", "MINIMUM_CHECK", "NIGHT_MULTIPLIER"]
      }
    });

    console.log("Seeded Casablanca Pilot data.");
  }
}

export const storage = new DatabaseStorage();
