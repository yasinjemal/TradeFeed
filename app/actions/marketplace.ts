// ============================================================
// Marketplace Server Actions
// ============================================================
// Server actions for marketplace interactions:
// - Loading more products (infinite scroll)
// - Tracking promoted clicks (fire-and-forget)
// - Tracking marketplace views
// ============================================================

"use server";

import { z } from "zod";
import {
  trackPromotedClick,
  trackPromotedImpressions,
  getMarketplaceProducts,
  interleavePromotedProducts,
  getPromotedProducts,
  type MarketplaceProduct,
  type MarketplaceSortBy,
} from "@/lib/db/marketplace";
import {
  getAnalyticsRequestContext,
  trackRequestEvent,
} from "@/lib/analytics/server";
import {
  checkRateLimit,
  getActionClientIp,
} from "@/lib/rate-limit-upstash";
import { reportError } from "@/lib/telemetry";

const cuidSchema = z.string().cuid();
const promotedClickSchema = z.object({
  promotedListingId: cuidSchema,
  shopId: cuidSchema,
  productId: cuidSchema,
});
const marketplaceClickSchema = z.object({
  shopId: cuidSchema,
  productId: cuidSchema,
});
const MAX_PROMOTED_IMPRESSIONS_PER_BATCH = 24;
const promotedImpressionIdsSchema = z
  .array(cuidSchema)
  .max(MAX_PROMOTED_IMPRESSIONS_PER_BATCH)
  .transform((ids) => [...new Set(ids)]);

async function canTrackAnonymousAnalytics(): Promise<boolean> {
  const ip = await getActionClientIp();
  return (await checkRateLimit("analytics", ip)).allowed;
}

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
  const parsed = promotedClickSchema.safeParse({
    promotedListingId,
    shopId,
    productId,
  });
  if (!parsed.success) return;

  try {
    if (!(await canTrackAnonymousAnalytics())) return;
    const context = await getAnalyticsRequestContext();
    if (!context) return;
    await trackPromotedClick(
      parsed.data.promotedListingId,
      parsed.data.shopId,
      parsed.data.productId,
      context,
    );
  } catch (error) {
    await reportError("trackPromotedClickAction", error, {
      ...parsed.data,
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
  const parsed = promotedImpressionIdsSchema.safeParse(promotedListingIds);
  if (!parsed.success || parsed.data.length === 0) return;

  try {
    if (!(await canTrackAnonymousAnalytics())) return;
    // Do not increment billable-looking promotion metrics for obvious bots.
    const context = await getAnalyticsRequestContext();
    if (!context) return;
    await trackPromotedImpressions(parsed.data, context);
  } catch (error) {
    await reportError("trackPromotedImpressionsAction", error, {
      promotedListingCount: parsed.data.length,
    });
  }
}

/**
 * Track a marketplace page view.
 */
export async function trackMarketplaceViewAction() {
  try {
    if (!(await canTrackAnonymousAnalytics())) return;
    await trackRequestEvent({
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
  const parsed = marketplaceClickSchema.safeParse({ shopId, productId });
  if (!parsed.success) return;

  try {
    if (!(await canTrackAnonymousAnalytics())) return;
    await trackRequestEvent({
      type: "MARKETPLACE_CLICK",
      shopId: parsed.data.shopId,
      productId: parsed.data.productId,
    });
  } catch (error) {
    await reportError("trackMarketplaceClickAction", error, parsed.data);
  }
}
