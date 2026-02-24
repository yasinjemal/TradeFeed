// ============================================================
// Promotion Tiers — Configuration & Pricing
// ============================================================
// Centralised config for marketplace promoted listings.
// All prices in ZAR cents. Durations in weeks.
//
// TIERS:
// - BOOST   R49/wk — mixed into feed with "Sponsored" label
// - FEATURED R149/wk — carousel + priority feed + "Featured" badge
// - SPOTLIGHT R399/wk — top of marketplace + carousel + "⭐ Spotlight" badge
//
// Used by: promote page, PayFast checkout, webhook, badge component
// ============================================================

export type PromotionTierKey = "BOOST" | "FEATURED" | "SPOTLIGHT";

export interface PromotionTierConfig {
  key: PromotionTierKey;
  name: string;
  description: string;
  pricePerWeekCents: number;
  features: string[];
  badge: {
    label: string;
    color: string; // Tailwind classes
  };
}

export interface PromotionDuration {
  weeks: number;
  label: string;
  discount: number; // 0-1, e.g. 0.1 = 10% off
}

// ── Tier Definitions ─────────────────────────────────────────

export const PROMOTION_TIERS: Record<PromotionTierKey, PromotionTierConfig> = {
  BOOST: {
    key: "BOOST",
    name: "Boost",
    description: "Get your product mixed into the marketplace feed with a 'Sponsored' label.",
    pricePerWeekCents: 4900, // R49/week
    features: [
      "Mixed into marketplace feed",
      '"Sponsored" label on card',
      "Impression & click tracking",
    ],
    badge: {
      label: "Sponsored",
      color: "bg-stone-700 text-stone-200",
    },
  },
  FEATURED: {
    key: "FEATURED",
    name: "Featured",
    description: "Priority feed placement plus a spot in the Featured carousel.",
    pricePerWeekCents: 14900, // R149/week
    features: [
      "Everything in Boost",
      "Featured carousel placement",
      '"Featured" amber badge',
      "Higher feed priority",
    ],
    badge: {
      label: "Featured",
      color: "bg-amber-500 text-white",
    },
  },
  SPOTLIGHT: {
    key: "SPOTLIGHT",
    name: "Spotlight",
    description: "Maximum visibility — top of marketplace, carousel, and a premium badge.",
    pricePerWeekCents: 39900, // R399/week
    features: [
      "Everything in Featured",
      "Top of marketplace feed",
      '"⭐ Spotlight" gradient badge',
      "Premium visual treatment",
      "Best ROI for high-value products",
    ],
    badge: {
      label: "⭐ Spotlight",
      color: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    },
  },
};

// ── Duration Options ─────────────────────────────────────────

export const PROMOTION_DURATIONS: PromotionDuration[] = [
  { weeks: 1, label: "1 week", discount: 0 },
  { weeks: 2, label: "2 weeks", discount: 0.05 },  // 5% off
  { weeks: 4, label: "4 weeks", discount: 0.10 },   // 10% off
];

// ── Helpers ──────────────────────────────────────────────────

/**
 * Calculate the total price for a promotion.
 * @returns Total in ZAR cents, rounded to nearest cent.
 */
export function calculatePromotionPrice(
  tier: PromotionTierKey,
  weeks: number,
): number {
  const tierConfig = PROMOTION_TIERS[tier];
  const duration = PROMOTION_DURATIONS.find((d) => d.weeks === weeks);
  const discount = duration?.discount ?? 0;

  const basePrice = tierConfig.pricePerWeekCents * weeks;
  const discountedPrice = basePrice * (1 - discount);

  return Math.round(discountedPrice);
}

/**
 * Format cents as ZAR currency string.
 * e.g. 4900 → "R49.00", 14900 → "R149.00"
 */
export function formatZAR(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

/**
 * Get a human-readable summary for a promotion.
 * e.g. "Boost — 2 weeks — R93.10"
 */
export function getPromotionSummary(
  tier: PromotionTierKey,
  weeks: number,
): string {
  const tierConfig = PROMOTION_TIERS[tier];
  const total = calculatePromotionPrice(tier, weeks);
  const durationLabel = PROMOTION_DURATIONS.find((d) => d.weeks === weeks)?.label ?? `${weeks} week(s)`;

  return `${tierConfig.name} — ${durationLabel} — ${formatZAR(total)}`;
}

/**
 * Build the m_payment_id for PayFast.
 * Format: "promo_{shopId}_{productId}_{tier}_{weeks}"
 * This allows the webhook to distinguish promotion payments from subscriptions.
 */
export function buildPromotionPaymentId(
  shopId: string,
  productId: string,
  tier: PromotionTierKey,
  weeks: number,
): string {
  return `promo_${shopId}_${productId}_${tier}_${weeks}`;
}

/**
 * Parse a promotion m_payment_id back into its components.
 * Returns null if the ID is not a promotion payment.
 */
export function parsePromotionPaymentId(paymentId: string): {
  shopId: string;
  productId: string;
  tier: PromotionTierKey;
  weeks: number;
} | null {
  if (!paymentId.startsWith("promo_")) return null;

  const parts = paymentId.split("_");
  // promo_shopId_productId_TIER_weeks
  if (parts.length < 5) return null;

  const tier = parts[3] as PromotionTierKey;
  if (!PROMOTION_TIERS[tier]) return null;

  const weeks = parseInt(parts[4]!, 10);
  if (isNaN(weeks) || weeks <= 0) return null;

  return {
    shopId: parts[1]!,
    productId: parts[2]!,
    tier,
    weeks,
  };
}
