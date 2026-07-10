// ============================================================
// Cart pricing — single source of truth for bulk-tier discounts
// and wholesale/retail unit prices. Used by both the legacy
// AddToCart and the TF order panel so the two skins can never
// charge different prices for the same selection.
// ============================================================

export interface BulkDiscountTier {
  minQuantity: number;
  discountPercent: number;
}

export type OrderType = "wholesale" | "retail";

/** The tier that applies at a given quantity, or null. */
export function applicableTier(
  quantity: number,
  tiers: readonly BulkDiscountTier[],
): BulkDiscountTier | null {
  let best: BulkDiscountTier | null = null;
  for (const tier of tiers) {
    if (quantity >= tier.minQuantity && (best === null || tier.minQuantity > best.minQuantity)) {
      best = tier;
    }
  }
  return best;
}

/**
 * Unit price in cents after any bulk-tier discount. Bulk tiers are a
 * wholesale mechanic — retail orders always pay the undiscounted price.
 */
export function effectiveUnitPriceCents(args: {
  orderType: OrderType;
  wholesalePriceCents: number;
  retailPriceCents: number | null;
  quantity: number;
  bulkDiscountTiers?: readonly BulkDiscountTier[];
}): number {
  const { orderType, wholesalePriceCents, retailPriceCents, quantity, bulkDiscountTiers = [] } = args;

  if (orderType === "retail") {
    return retailPriceCents != null && retailPriceCents > 0 ? retailPriceCents : wholesalePriceCents;
  }

  const tier = applicableTier(quantity, bulkDiscountTiers);
  if (!tier) return wholesalePriceCents;
  return Math.round(wholesalePriceCents * (1 - tier.discountPercent / 100));
}

/**
 * "Add N more for X% off" nudge: the next tier the buyer hasn't
 * reached yet, or null when they're at the best tier already.
 */
export function nextTierNudge(
  quantity: number,
  tiers: readonly BulkDiscountTier[],
): { addMore: number; discountPercent: number } | null {
  const upcoming = tiers
    .filter((t) => t.minQuantity > quantity)
    .sort((a, b) => a.minQuantity - b.minQuantity)[0];
  if (!upcoming) return null;
  return { addMore: upcoming.minQuantity - quantity, discountPercent: upcoming.discountPercent };
}
