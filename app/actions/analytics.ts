// ============================================================
// Server Actions — Analytics Event Tracking
// ============================================================
// Client-side events (WhatsApp clicks, checkouts) call these
// server actions. Catalog/product page views are tracked
// server-side directly in the page component.
//
// No auth required — these are public catalog actions.
// ============================================================

"use server";

import { trackEvent } from "@/lib/db/analytics";

/**
 * Track a WhatsApp enquiry button click on a product page.
 */
export async function trackWhatsAppClickAction(
  shopId: string,
  productId?: string,
): Promise<void> {
  // Fire-and-forget — don't block the UI
  void trackEvent({
    type: "WHATSAPP_CLICK",
    shopId,
    productId,
  });
}

/**
 * Track a WhatsApp cart checkout.
 */
export async function trackWhatsAppCheckoutAction(
  shopId: string,
): Promise<void> {
  void trackEvent({
    type: "WHATSAPP_CHECKOUT",
    shopId,
  });
}
