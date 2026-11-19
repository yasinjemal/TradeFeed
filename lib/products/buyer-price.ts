// ============================================================
// Buyer price summary — what a product card shows
// ============================================================
// Every catalogue and marketplace card shows one price for a
// product ("R 150" or "From R 150") and, when the seller set
// one, a crossed-out was-price. This is the one place that
// works those out from a product's options.
// ============================================================

import { buyerOptions } from "@/lib/products/buyer-options";
import { resolveSale } from "@/lib/products/compare-at";

export interface BuyerPricedVariant {
  size: string;
  priceInCents: number;
  retailPriceCents: number | null;
  compareAtPriceCents?: number | null;
}

/** The price a buyer pays for one option: the retail price when the seller set one. */
export function buyerPriceCents(variant: Pick<BuyerPricedVariant, "priceInCents" | "retailPriceCents">): number {
  return variant.retailPriceCents ?? variant.priceInCents;
}

export interface BuyerPriceSummary {
  minPriceCents: number;
  maxPriceCents: number;
  /** A was-price that really applies to the price shown, or null. */
  compareAtPriceCents: number | null;
}

/**
 * Price range across the options a buyer can pick, plus the was-price
 * for the cheapest one.
 *
 * The was-price comes only from options that sell at the price on the
 * card, and only when every one of them has a valid was-price. The
 * lowest is used, so the card never overstates the saving or implies
 * a saving on an option that has none.
 */
export function buyerPriceSummary(variants: readonly BuyerPricedVariant[]): BuyerPriceSummary {
  const options = buyerOptions(variants);
  if (options.length === 0) {
    return { minPriceCents: 0, maxPriceCents: 0, compareAtPriceCents: null };
  }

  const prices = options.map(buyerPriceCents);
  const minPriceCents = Math.min(...prices);
  const maxPriceCents = Math.max(...prices);

  let compareAtPriceCents: number | null = null;
  for (const option of options) {
    if (buyerPriceCents(option) !== minPriceCents) continue;
    const sale = resolveSale(minPriceCents, option.compareAtPriceCents);
    if (!sale) {
      compareAtPriceCents = null;
      break;
    }
    if (compareAtPriceCents === null || sale.compareAt < compareAtPriceCents) {
      compareAtPriceCents = sale.compareAt;
    }
  }

  return { minPriceCents, maxPriceCents, compareAtPriceCents };
}
