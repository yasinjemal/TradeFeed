// ============================================================
// Data Access — Price Suggestion (Phase 3)
// ============================================================
// Fetches price points from active listings in the same global
// category (excluding the seller's own shop so they don't
// anchor on themselves), then runs the pure percentile math.
// ============================================================

import { db } from "@/lib/db";
import {
  computePriceSuggestion,
  type PriceSuggestion,
} from "@/lib/ai/price-suggestion";

const MAX_SAMPLE = 500;

export async function getPriceSuggestionForCategory(
  globalCategoryId: string,
  excludeShopId?: string
): Promise<PriceSuggestion | null> {
  const variants = await db.productVariant.findMany({
    where: {
      isActive: true,
      priceInCents: { gt: 0 },
      product: {
        isActive: true,
        wholesaleOnly: false,
        globalCategoryId,
        ...(excludeShopId ? { shopId: { not: excludeShopId } } : {}),
        shop: { isActive: true },
      },
    },
    select: { priceInCents: true },
    take: MAX_SAMPLE,
    orderBy: { updatedAt: "desc" }, // freshest prices first
  });

  return computePriceSuggestion(variants.map((v) => v.priceInCents));
}
