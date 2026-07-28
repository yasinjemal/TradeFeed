// ============================================================
// South African location normalization
// ============================================================
// Shared by validation, local suggestions, and the optional
// Geoapify autocomplete adapter. Keep provider-specific parsing
// out of this file so the local fallback always works.
// ============================================================

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export type SAProvince = (typeof SA_PROVINCES)[number];

/**
 * Common SA cities → province auto-map.
 * Free-text towns remain valid; this map only improves normalization.
 */
export const CITY_PROVINCE_MAP: Record<string, SAProvince> = {
  Johannesburg: "Gauteng",
  Pretoria: "Gauteng",
  Tshwane: "Gauteng",
  Sandton: "Gauteng",
  Soweto: "Gauteng",
  Midrand: "Gauteng",
  Centurion: "Gauteng",
  Ekurhuleni: "Gauteng",
  "Cape Town": "Western Cape",
  Stellenbosch: "Western Cape",
  Paarl: "Western Cape",
  George: "Western Cape",
  Durban: "KwaZulu-Natal",
  Pietermaritzburg: "KwaZulu-Natal",
  "Gqeberha": "Eastern Cape",
  "East London": "Eastern Cape",
  Komani: "Eastern Cape",
  Makhanda: "Eastern Cape",
  Bloemfontein: "Free State",
  Welkom: "Free State",
  Mbombela: "Mpumalanga",
  Polokwane: "Limpopo",
  Kimberley: "Northern Cape",
  Rustenburg: "North West",
  Mahikeng: "North West",
};

const PROVINCE_ALIASES: Record<string, SAProvince> = {
  "eastern cape": "Eastern Cape",
  "free state": "Free State",
  gauteng: "Gauteng",
  "kwazulu natal": "KwaZulu-Natal",
  "kwazulu-natal": "KwaZulu-Natal",
  kzn: "KwaZulu-Natal",
  limpopo: "Limpopo",
  mpumalanga: "Mpumalanga",
  "north west": "North West",
  "north-west": "North West",
  "northern cape": "Northern Cape",
  "western cape": "Western Cape",
};

const CITY_ALIASES: Record<string, string> = {
  "port elizabeth": "Gqeberha",
  pe: "Gqeberha",
  queenstown: "Komani",
  grahamstown: "Makhanda",
  nelspruit: "Mbombela",
  mafikeng: "Mahikeng",
};

function comparisonKey(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-ZA");
}

function titleCaseLocation(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-ZA")
    .replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("en-ZA"));
}

export function normalizeProvinceName(
  value: string | null | undefined,
): SAProvince | null {
  if (!value) return null;
  return PROVINCE_ALIASES[comparisonKey(value)] ?? null;
}

export function normalizeCityName(value: string): string {
  const key = comparisonKey(value);
  if (!key) return "";

  const alias = CITY_ALIASES[key];
  if (alias) return alias;

  const known = Object.keys(CITY_PROVINCE_MAP).find(
    (city) => comparisonKey(city) === key,
  );
  return known ?? titleCaseLocation(value);
}

export function provinceForCity(value: string): SAProvince | null {
  return CITY_PROVINCE_MAP[normalizeCityName(value)] ?? null;
}
