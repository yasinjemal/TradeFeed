// ============================================================
// South Africa Location Data — SEO Landing Pages
// ============================================================
// Hardcoded provinces + top cities for SEO pages.
// Used by /marketplace/[province] and /marketplace/[province]/[city]
// routes to generate static params and rich metadata.
// ============================================================

export interface SAProvince {
  /** URL slug (e.g. "gauteng") */
  slug: string;
  /** Display name (e.g. "Gauteng") */
  name: string;
  /** Short copy for meta descriptions */
  description: string;
  /** Major cities for city sub-pages */
  cities: SACity[];
}

export interface SACity {
  /** URL slug (e.g. "johannesburg") */
  slug: string;
  /** Display name (e.g. "Johannesburg") */
  name: string;
  /** Alternate names / areas people search (for keyword matching) */
  aliases: string[];
}

// ── All 9 South African Provinces ───────────────────────────

export const SA_PROVINCES: SAProvince[] = [
  {
    slug: "gauteng",
    name: "Gauteng",
    description:
      "South Africa's economic hub. Browse wholesale clothing, fashion, electronics and more from suppliers in Johannesburg, Pretoria, and Ekurhuleni.",
    cities: [
      { slug: "johannesburg", name: "Johannesburg", aliases: ["Joburg", "JHB", "Jozi", "Jeppe Street", "Jeppe"] },
      { slug: "pretoria", name: "Pretoria", aliases: ["Tshwane", "PTA"] },
      { slug: "ekurhuleni", name: "Ekurhuleni", aliases: ["East Rand", "Germiston", "Boksburg", "Benoni"] },
      { slug: "soweto", name: "Soweto", aliases: [] },
      { slug: "sandton", name: "Sandton", aliases: [] },
      { slug: "midrand", name: "Midrand", aliases: ["Centurion"] },
    ],
  },
  {
    slug: "western-cape",
    name: "Western Cape",
    description:
      "From Cape Town's fashion scene to Stellenbosch and Paarl. Find wholesale suppliers, clothing, and local products across the Western Cape.",
    cities: [
      { slug: "cape-town", name: "Cape Town", aliases: ["CPT", "Mother City"] },
      { slug: "stellenbosch", name: "Stellenbosch", aliases: [] },
      { slug: "paarl", name: "Paarl", aliases: [] },
      { slug: "george", name: "George", aliases: [] },
    ],
  },
  {
    slug: "kwazulu-natal",
    name: "KwaZulu-Natal",
    description:
      "Browse suppliers in Durban, Pietermaritzburg and across KZN. Wholesale clothing, fashion, textiles, and more from KwaZulu-Natal sellers.",
    cities: [
      { slug: "durban", name: "Durban", aliases: ["eThekwini", "DBN"] },
      { slug: "pietermaritzburg", name: "Pietermaritzburg", aliases: ["PMB", "Msunduzi"] },
      { slug: "newcastle", name: "Newcastle", aliases: [] },
      { slug: "richards-bay", name: "Richards Bay", aliases: [] },
    ],
  },
  {
    slug: "eastern-cape",
    name: "Eastern Cape",
    description:
      "Find suppliers and sellers in Port Elizabeth, East London, and across the Eastern Cape. Wholesale and retail products available.",
    cities: [
      { slug: "port-elizabeth", name: "Port Elizabeth", aliases: ["Gqeberha", "PE", "Nelson Mandela Bay"] },
      { slug: "east-london", name: "East London", aliases: ["Buffalo City"] },
      { slug: "mthatha", name: "Mthatha", aliases: ["Umtata"] },
    ],
  },
  {
    slug: "free-state",
    name: "Free State",
    description:
      "Browse products from sellers in Bloemfontein and across the Free State. Wholesale clothing, retail goods, and local suppliers.",
    cities: [
      { slug: "bloemfontein", name: "Bloemfontein", aliases: ["Bloem", "Mangaung"] },
      { slug: "welkom", name: "Welkom", aliases: [] },
    ],
  },
  {
    slug: "mpumalanga",
    name: "Mpumalanga",
    description:
      "Find sellers in Nelspruit, Witbank, and across Mpumalanga. Wholesale and retail products from local SA suppliers.",
    cities: [
      { slug: "nelspruit", name: "Nelspruit", aliases: ["Mbombela"] },
      { slug: "witbank", name: "Witbank", aliases: ["eMalahleni"] },
      { slug: "secunda", name: "Secunda", aliases: [] },
    ],
  },
  {
    slug: "limpopo",
    name: "Limpopo",
    description:
      "Discover suppliers in Polokwane and across Limpopo. Wholesale clothing, products, and local sellers on TradeFeed.",
    cities: [
      { slug: "polokwane", name: "Polokwane", aliases: ["Pietersburg"] },
      { slug: "tzaneen", name: "Tzaneen", aliases: [] },
      { slug: "thohoyandou", name: "Thohoyandou", aliases: [] },
    ],
  },
  {
    slug: "north-west",
    name: "North West",
    description:
      "Browse suppliers and products in Rustenburg, Mahikeng, and the North West province. Wholesale and retail on TradeFeed.",
    cities: [
      { slug: "rustenburg", name: "Rustenburg", aliases: [] },
      { slug: "mahikeng", name: "Mahikeng", aliases: ["Mafikeng"] },
      { slug: "klerksdorp", name: "Klerksdorp", aliases: [] },
    ],
  },
  {
    slug: "northern-cape",
    name: "Northern Cape",
    description:
      "Find sellers and products in Kimberley and across the Northern Cape. South Africa's largest province on TradeFeed.",
    cities: [
      { slug: "kimberley", name: "Kimberley", aliases: ["Sol Plaatje"] },
      { slug: "upington", name: "Upington", aliases: [] },
    ],
  },
];

// ── Lookup helpers ──────────────────────────────────────────

/** Find a province by its URL slug */
export function getProvince(slug: string): SAProvince | undefined {
  return SA_PROVINCES.find((p) => p.slug === slug);
}

/** Find a city within a province by its URL slug */
export function getCity(
  provinceSlug: string,
  citySlug: string,
): { province: SAProvince; city: SACity } | undefined {
  const province = getProvince(provinceSlug);
  if (!province) return undefined;
  const city = province.cities.find((c) => c.slug === citySlug);
  if (!city) return undefined;
  return { province, city };
}

/** All province slugs — used by generateStaticParams */
export function getAllProvinceSlugs(): string[] {
  return SA_PROVINCES.map((p) => p.slug);
}

/** All province + city slug pairs — used by generateStaticParams */
export function getAllCityParams(): { province: string; city: string }[] {
  return SA_PROVINCES.flatMap((p) =>
    p.cities.map((c) => ({ province: p.slug, city: c.slug })),
  );
}

/**
 * Map a province slug to the Prisma `province` field value.
 * Shops in the DB store province as display name (e.g. "Gauteng"),
 * so we need to convert from the URL slug.
 */
export function provinceSlugToDbValue(slug: string): string | undefined {
  return getProvince(slug)?.name;
}

/**
 * Map a city slug to the Prisma `city` field value.
 * Shops in the DB store city as display name (e.g. "Johannesburg"),
 * so we convert from slug. Also checks aliases to match DB variants.
 */
export function citySlugToDbValue(
  provinceSlug: string,
  citySlug: string,
): string | undefined {
  const result = getCity(provinceSlug, citySlug);
  return result?.city.name;
}

/** Top cities for marketplace "Popular Cities" section — 12 most searched */
export const POPULAR_CITIES: { province: SAProvince; city: SACity }[] = [
  "gauteng/johannesburg",
  "western-cape/cape-town",
  "kwazulu-natal/durban",
  "gauteng/pretoria",
  "eastern-cape/port-elizabeth",
  "gauteng/soweto",
  "gauteng/ekurhuleni",
  "kwazulu-natal/pietermaritzburg",
  "free-state/bloemfontein",
  "mpumalanga/nelspruit",
  "limpopo/polokwane",
  "north-west/rustenburg",
].map((key) => {
  const [pSlug, cSlug] = key.split("/");
  return getCity(pSlug!, cSlug!)!;
}).filter(Boolean);
