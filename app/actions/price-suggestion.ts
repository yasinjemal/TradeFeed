// ============================================================
// Server Action — Price Suggestion (Phase 3)
// ============================================================
// Called from the product wizard when a seller picks a
// marketplace category. Returns a percentile-based price range
// from similar active listings. Flag-gated.
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { getPriceSuggestionForCategory } from "@/lib/db/price-suggestion";
import type { PriceSuggestion } from "@/lib/ai/price-suggestion";

type Result =
  | { success: true; suggestion: PriceSuggestion | null }
  | { success: false; error: string };

export async function getPriceSuggestionAction(
  shopSlug: string,
  globalCategoryId: string
): Promise<Result> {
  if (!FEATURE_FLAGS.PRICE_SUGGESTIONS) {
    return { success: true, suggestion: null };
  }

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Access denied." };
    }
    if (!globalCategoryId) {
      return { success: true, suggestion: null };
    }

    const suggestion = await getPriceSuggestionForCategory(
      globalCategoryId,
      access.shopId
    );
    return { success: true, suggestion };
  } catch {
    return { success: true, suggestion: null }; // hint is best-effort
  }
}
