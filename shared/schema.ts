import { z } from "zod";

// === TYPES & SCHEMAS ===

export const citySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  currencyCode: z.string(),
  timezone: z.string(),
});

export const transportModeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  iconUrl: z.string().nullable(),
});

export const pricingProfileSchema = z.object({
  id: z.string().uuid(),
  cityId: z.string().uuid(),
  modeId: z.string().uuid(),
  pricingStrategy: z.enum(['METERED', 'FIXED_ZONE', 'HYBRID']),
  active: z.boolean(),
  rulesConfig: z.record(z.any()),
});

export type City = z.infer<typeof citySchema>;
export type TransportMode = z.infer<typeof transportModeSchema>;
export type PricingProfile = z.infer<typeof pricingProfileSchema>;

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
