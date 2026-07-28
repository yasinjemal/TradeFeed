// ============================================================
// Geoapify address-autocomplete adapter
// ============================================================
// Provider responses are normalized into a small, allowlisted
// shape before they reach browser code.
// ============================================================

import {
  normalizeCityName,
  normalizeProvinceName,
  provinceForCity,
  type SAProvince,
} from "@/lib/location/south-africa";

export interface LocationSuggestion {
  id: string;
  label: string;
  address: string;
  city: string;
  province: SAProvince;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface GeoapifyResult {
  place_id?: unknown;
  formatted?: unknown;
  address_line1?: unknown;
  city?: unknown;
  town?: unknown;
  village?: unknown;
  suburb?: unknown;
  state?: unknown;
  postcode?: unknown;
  lat?: unknown;
  lon?: unknown;
  country_code?: unknown;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function buildGeoapifyAutocompleteUrl(
  query: string,
  apiKey: string,
): URL {
  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", query.trim());
  url.searchParams.set("filter", "countrycode:za");
  url.searchParams.set("bias", "countrycode:za");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", apiKey);
  return url;
}

export function parseGeoapifySuggestions(payload: unknown): LocationSuggestion[] {
  if (!payload || typeof payload !== "object") return [];
  const rawResults = (payload as { results?: unknown }).results;
  if (!Array.isArray(rawResults)) return [];

  const suggestions: LocationSuggestion[] = [];
  const seen = new Set<string>();

  for (const raw of rawResults.slice(0, 10)) {
    if (!raw || typeof raw !== "object") continue;
    const result = raw as GeoapifyResult;

    if (asString(result.country_code).toLowerCase() !== "za") continue;

    const latitude = asFiniteNumber(result.lat);
    const longitude = asFiniteNumber(result.lon);
    if (latitude === null || longitude === null) continue;

    const rawCity =
      asString(result.city) ||
      asString(result.town) ||
      asString(result.village) ||
      asString(result.suburb);
    const city = normalizeCityName(rawCity);
    const province =
      normalizeProvinceName(asString(result.state)) || provinceForCity(city);
    if (!city || !province) continue;

    const label = asString(result.formatted);
    const address = asString(result.address_line1) || label;
    if (!label || !address) continue;

    const id =
      asString(result.place_id) ||
      `${latitude.toFixed(6)}:${longitude.toFixed(6)}`;
    if (seen.has(id)) continue;
    seen.add(id);

    suggestions.push({
      id,
      label,
      address,
      city,
      province,
      postalCode: asString(result.postcode),
      latitude,
      longitude,
    });

    if (suggestions.length === 5) break;
  }

  return suggestions;
}
