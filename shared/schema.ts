import { pgTable, text, uuid, varchar, boolean, jsonb, timestamp, integer, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === ENUMS ===
export const pricingStrategyEnum = pgEnum("pricing_strategy", ['METERED', 'FIXED_ZONE', 'HYBRID']);

// === TABLE DEFINITIONS ===

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // Added slug for easier lookup
  currencyCode: varchar("currency_code", { length: 3 }).notNull(), // e.g. MAD
  timezone: varchar("timezone", { length: 255 }).notNull(), // e.g. Africa/Casablanca
});

export const transportModes = pgTable("transport_modes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // e.g. petit_taxi_red
  iconUrl: varchar("icon_url", { length: 500 }),
});

export const pricingProfiles = pgTable("pricing_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  cityId: uuid("city_id").references(() => cities.id).notNull(),
  modeId: uuid("mode_id").references(() => transportModes.id).notNull(),
  pricingStrategy: pricingStrategyEnum("pricing_strategy").notNull().default('METERED'),
  active: boolean("active").default(true).notNull(),
  // JSONB to store specific rules like base_fare, minimum_fare, night_surcharge_percent, etc.
  rulesConfig: jsonb("rules_config").$type<Record<string, any>>().notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const pricingProfilesRelations = relations(pricingProfiles, ({ one }) => ({
  city: one(cities, {
    fields: [pricingProfiles.cityId],
    references: [cities.id],
  }),
  mode: one(transportModes, {
    fields: [pricingProfiles.modeId],
    references: [transportModes.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertCitySchema = createInsertSchema(cities).omit({ id: true });
export const insertTransportModeSchema = createInsertSchema(transportModes).omit({ id: true });
export const insertPricingProfileSchema = createInsertSchema(pricingProfiles).omit({ id: true, createdAt: true });

// === API TYPES ===
export type City = typeof cities.$inferSelect;
export type TransportMode = typeof transportModes.$inferSelect;
export type PricingProfile = typeof pricingProfiles.$inferSelect;

// Request body for estimation
export const estimateRequestSchema = z.object({
  originLat: z.coerce.number(),
  originLng: z.coerce.number(),
  destLat: z.coerce.number(),
  destLng: z.coerce.number(),
  citySlug: z.string(),
  transportModeSlug: z.string(),
  travelTime: z.string().optional(), // ISO string, defaults to now
  isNightOverride: z.boolean().optional(),
});

export type EstimateRequest = z.infer<typeof estimateRequestSchema>;

export const estimateResponseSchema = z.object({
  estimatedPrice: z.number(),
  currency: z.string(),
  distanceKm: z.number(),
  durationMin: z.number(),
  isNightFare: z.boolean(),
  breakdown: z.object({
    baseFare: z.number(),
    distanceFare: z.number(),
    nightSurcharge: z.number(),
    minimumFareAdjustment: z.number().optional(),
  }),
});

export type EstimateResponse = z.infer<typeof estimateResponseSchema>;
