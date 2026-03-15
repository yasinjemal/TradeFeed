// ============================================================
// Shipping — Carrier Rate Engine
// ============================================================
// Provides shipping rate estimates for South African couriers.
// MVP uses distance-based flat rate tiers (no live API calls).
// Carriers: The Courier Guy, Pargo, PostNet, Aramex SA
//
// Phase 2 will add live API rate fetching.
// ============================================================

export interface ShippingRate {
  carrier: string;
  service: string;
  priceCents: number;
  estimatedDays: string; // e.g. "2-3" or "5-7"
  description: string;
}

export interface ShippingQuoteInput {
  originProvince: string;
  originCity?: string;
  destinationProvince: string;
  destinationCity?: string;
  weightKg?: number; // default 1kg
  itemCount?: number;
}

// ── SA Province list for validation ─────────────────────────
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

// ── Distance tier (same city, same province, neighbouring, far) ──
type DistanceTier = "local" | "regional" | "national" | "remote";

function getDistanceTier(
  origin: string,
  destination: string,
  originCity?: string,
  destCity?: string,
): DistanceTier {
  const o = origin.toLowerCase();
  const d = destination.toLowerCase();

  // Same city
  if (originCity && destCity && originCity.toLowerCase() === destCity.toLowerCase() && o === d) {
    return "local";
  }

  // Same province
  if (o === d) return "regional";

  // Neighbouring hubs (GP-NW-MP-LP-FS, WC-EC-NC, KZN-MP-FS)
  const neighbours: Record<string, string[]> = {
    gauteng: ["north west", "mpumalanga", "limpopo", "free state"],
    "north west": ["gauteng", "free state", "northern cape", "limpopo"],
    mpumalanga: ["gauteng", "limpopo", "kwazulu-natal", "free state"],
    limpopo: ["gauteng", "mpumalanga", "north west"],
    "free state": ["gauteng", "north west", "mpumalanga", "kwazulu-natal", "eastern cape", "northern cape"],
    "western cape": ["eastern cape", "northern cape"],
    "eastern cape": ["western cape", "free state", "kwazulu-natal", "northern cape"],
    "northern cape": ["western cape", "eastern cape", "free state", "north west"],
    "kwazulu-natal": ["mpumalanga", "free state", "eastern cape"],
  };

  if (neighbours[o]?.includes(d)) return "national";

  return "remote";
}

// ── Rate tables per carrier ─────────────────────────────────
// Prices in ZAR cents, based on ~1-5kg parcel
// These are competitive estimates based on published SA courier rates

interface CarrierRateTable {
  carrier: string;
  services: {
    name: string;
    description: string;
    rates: Record<DistanceTier, number>; // cents
    days: Record<DistanceTier, string>;
  }[];
}

const CARRIER_RATES: CarrierRateTable[] = [
  {
    carrier: "The Courier Guy",
    services: [
      {
        name: "Economy",
        description: "Standard door-to-door delivery",
        rates: { local: 6500, regional: 8500, national: 10500, remote: 14500 },
        days: { local: "2-3", regional: "3-4", national: "4-5", remote: "5-7" },
      },
      {
        name: "Express",
        description: "Next-day delivery to major centres",
        rates: { local: 9900, regional: 12500, national: 15900, remote: 19900 },
        days: { local: "1", regional: "1-2", national: "2-3", remote: "3-5" },
      },
    ],
  },
  {
    carrier: "Pargo",
    services: [
      {
        name: "Pickup Point",
        description: "Collect from nearest Pargo pickup point",
        rates: { local: 4900, regional: 5900, national: 6900, remote: 8900 },
        days: { local: "3-4", regional: "4-5", national: "5-7", remote: "7-10" },
      },
    ],
  },
  {
    carrier: "PostNet",
    services: [
      {
        name: "Counter to Counter",
        description: "Send & collect from PostNet branches",
        rates: { local: 5500, regional: 7000, national: 8500, remote: 11500 },
        days: { local: "2-3", regional: "3-5", national: "5-7", remote: "7-10" },
      },
    ],
  },
  {
    carrier: "Aramex",
    services: [
      {
        name: "Standard",
        description: "Reliable door-to-door delivery",
        rates: { local: 7500, regional: 9500, national: 12000, remote: 16000 },
        days: { local: "2-3", regional: "3-4", national: "4-6", remote: "5-8" },
      },
    ],
  },
];

/**
 * Platform markup on shipping rates (cents).
 * Revenue: ~R15 per shipment.
 */
const PLATFORM_MARKUP_CENTS = 1500;

/**
 * Get shipping rate quotes for a given origin → destination.
 * Returns all available carrier options sorted by price.
 */
export function getShippingRates(input: ShippingQuoteInput): ShippingRate[] {
  const tier = getDistanceTier(
    input.originProvince,
    input.destinationProvince,
    input.originCity,
    input.destinationCity,
  );

  // Weight multiplier for heavier parcels (simple linear)
  const weightMultiplier = Math.max(1, Math.min(input.weightKg ?? 1, 30));
  const weightFactor = weightMultiplier <= 5 ? 1 : 1 + (weightMultiplier - 5) * 0.1;

  const rates: ShippingRate[] = [];

  for (const carrier of CARRIER_RATES) {
    for (const service of carrier.services) {
      const baseCents = service.rates[tier];
      const totalCents = Math.round(baseCents * weightFactor) + PLATFORM_MARKUP_CENTS;

      rates.push({
        carrier: carrier.carrier,
        service: service.name,
        priceCents: totalCents,
        estimatedDays: service.days[tier],
        description: service.description,
      });
    }
  }

  return rates.sort((a, b) => a.priceCents - b.priceCents);
}

/**
 * Get a specific rate for a carrier + service combo.
 */
export function getSpecificRate(
  input: ShippingQuoteInput,
  carrier: string,
  service: string,
): ShippingRate | null {
  const rates = getShippingRates(input);
  return rates.find((r) => r.carrier === carrier && r.service === service) ?? null;
}

/**
 * Get the cheapest available rate.
 */
export function getCheapestRate(input: ShippingQuoteInput): ShippingRate | null {
  const rates = getShippingRates(input);
  return rates[0] ?? null;
}

/**
 * Format shipping cost for display.
 */
export function formatShippingCost(cents: number): string {
  if (cents === 0) return "Free";
  return `R${(cents / 100).toFixed(2)}`;
}
