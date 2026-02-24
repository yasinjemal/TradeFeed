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

/**
 * Track a click on a promoted listing.
 * Called client-side when a user clicks a "Sponsored" product card.
 */
export async function trackPromotedClickAction(
  promotedListingId: string,
  shopId: string,
  productId: string
) {
  await trackPromotedClick(promotedListingId, shopId, productId);
}

/**
 * Track impressions on promoted listings (batch).
 * Called client-side after promoted products are rendered.
 */
export async function trackPromotedImpressionsAction(
  promotedListingIds: string[]
) {
  await trackPromotedImpressions(promotedListingIds);
}

/**
 * Track a marketplace page view.
 */
export async function trackMarketplaceViewAction() {
  await trackEvent({
    type: "MARKETPLACE_VIEW",
    shopId: "platform", // Platform-level event, not shop-specific
  });
}

/**
 * Track a click from marketplace to a product/shop.
 */
export async function trackMarketplaceClickAction(
  shopId: string,
  productId: string
) {
  await trackEvent({
    type: "MARKETPLACE_CLICK",
    shopId,
    productId,
  });
}
