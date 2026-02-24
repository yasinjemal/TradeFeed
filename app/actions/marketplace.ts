// ============================================================
// Marketplace Server Actions
// ============================================================
// Server actions for marketplace interactions:
// - Tracking promoted clicks (fire-and-forget)
// - Loading more products (pagination)
// - Tracking marketplace views
// ============================================================

"use server";

import { trackPromotedClick, trackPromotedImpressions } from "@/lib/db/marketplace";
import { trackEvent } from "@/lib/db/analytics";
import { reportError } from "@/lib/telemetry";

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
