import pricingData from "./pricing.json";
import type { City, PricingProfile, TransportMode } from "@shared/schema";

export type LocalCity = Pick<City, "id" | "name" | "slug" | "currencyCode" | "timezone">;
export type LocalTransportMode = Pick<TransportMode, "id" | "name" | "slug" | "iconUrl">;
export type LocalPricingProfile = Pick<
  PricingProfile,
  "id" | "cityId" | "modeId" | "pricingStrategy" | "active" | "rulesConfig"
>;

export interface PricingData {
  cities: LocalCity[];
  transportModes: LocalTransportMode[];
  pricingProfiles: LocalPricingProfile[];
}

export const data = pricingData as PricingData;

export function getCities(): LocalCity[] {
  return data.cities;
}

export function getTransportModes(): LocalTransportMode[] {
  return data.transportModes;
}

export function getPricingProfileBySlugs(
  citySlug: string,
  modeSlug: string,
): LocalPricingProfile | undefined {
  const city = data.cities.find((item) => item.slug === citySlug);
  const mode = data.transportModes.find((item) => item.slug === modeSlug);
  if (!city || !mode) return undefined;

  return data.pricingProfiles.find(
    (profile) =>
      profile.cityId === city.id &&
      profile.modeId === mode.id &&
      profile.active,
  );
}
