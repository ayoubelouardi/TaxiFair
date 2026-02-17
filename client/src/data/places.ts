import placesData from "./places.json";

export interface Place {
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
}

export type PlacesData = Record<string, Place[]>;

const data = placesData as PlacesData;

export function getPlacesByCity(citySlug: string): Place[] {
  return data[citySlug] ?? [];
}

export function getAllCitySlugs(): string[] {
  return Object.keys(data);
}
