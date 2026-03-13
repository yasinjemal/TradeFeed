// ============================================================
// Marketplace Server Actions
// ============================================================
// Server actions for marketplace interactions:
// - Loading more products (infinite scroll)
// - Tracking promoted clicks (fire-and-forget)
// - Tracking marketplace views
// ============================================================

"use server";

import {
  trackPromotedClick,
  trackPromotedImpressions,
  getMarketplaceProducts,
  interleavePromotedProducts,
  getPromotedProducts,
  type MarketplaceProduct,
  type MarketplaceSortBy,
} from "@/lib/db/marketplace";
import { trackEvent } from "@/lib/db/analytics";
import { reportError } from "@/lib/telemetry";

// ── Infinite Scroll — Load More Products ────────────────────

export interface LoadMoreResult {
  products: MarketplaceProduct[];
  hasMore: boolean;
  nextPage: number;
}

/**
 * Load the next page of marketplace products for infinite scroll.
 * Re-uses the same getMarketplaceProducts query with the given page.
 */
export async function loadMoreProducts(filters: {
  category?: string;
  search?: string;
  sortBy?: MarketplaceSortBy;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  page: number;
  pageSize?: number;
}): Promise<LoadMoreResult> {
  try {
    const pageSize = filters.pageSize ?? 24;
    const result = await getMarketplaceProducts({
      ...filters,
      sortBy: filters.sortBy ?? "newest",
      pageSize,
    });

    // Interleave promoted products into page 2+ as well
    const promoted = await getPromotedProducts(4);
    const products = interleavePromotedProducts(result.products, promoted);

    return {
      products,
      hasMore: result.page < result.totalPages,
      nextPage: result.page + 1,
    };
  } catch (error) {
    reportError("loadMoreProducts", error).catch(() => {});
    return { products: [], hasMore: false, nextPage: filters.page };
  }
}

/**
 * Track a click on a promoted listing.
 * Called client-side when a user clicks a "Sponsored" product card.
 */
export async function trackPromotedClickAction(
  promotedListingId: string,
  shopId: string,
  productId: string
) {
  try {
    await trackPromotedClick(promotedListingId, shopId, productId);
  } catch (error) {
    await reportError("trackPromotedClickAction", error, {
      promotedListingId,
      shopId,
      productId,
    });
  }
}

/**
 * Track impressions on promoted listings (batch).
 * Called client-side after promoted products are rendered.
 */
export async function trackPromotedImpressionsAction(
  promotedListingIds: string[]
) {
  try {
    await trackPromotedImpressions(promotedListingIds);
  } catch (error) {
    await reportError("trackPromotedImpressionsAction", error, {
      promotedListingCount: promotedListingIds.length,
    });
  }
}

/**
 * Track a marketplace page view.
 */
export async function trackMarketplaceViewAction() {
  try {
    await trackEvent({
      type: "MARKETPLACE_VIEW",
      shopId: "platform", // Platform-level event, not shop-specific
    });
  } catch (error) {
    await reportError("trackMarketplaceViewAction", error);
  }
}

/**
 * Track a click from marketplace to a product/shop.
 */
export async function trackMarketplaceClickAction(
  shopId: string,
  productId: string
) {
  try {
    await trackEvent({
      type: "MARKETPLACE_CLICK",
      shopId,
      productId,
    });
  } catch (error) {
    await reportError("trackMarketplaceClickAction", error, { shopId, productId });
  }
}
