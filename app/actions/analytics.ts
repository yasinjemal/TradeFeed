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

import { z } from "zod";
import { trackEvent } from "@/lib/db/analytics";

const shopIdSchema = z.string().min(1).max(100);
const productIdSchema = z.string().min(1).max(100).optional();

/**
 * Track a WhatsApp enquiry button click on a product page.
 */
export async function trackWhatsAppClickAction(
  shopId: string,
  productId?: string,
): Promise<void> {
  const parsedShop = shopIdSchema.safeParse(shopId);
  const parsedProduct = productIdSchema.safeParse(productId);
  if (!parsedShop.success) return;

  void trackEvent({
    type: "WHATSAPP_CLICK",
    shopId: parsedShop.data,
    productId: parsedProduct.success ? parsedProduct.data : undefined,
  });
}

/**
 * Track a WhatsApp cart checkout.
 */
export async function trackWhatsAppCheckoutAction(
  shopId: string,
): Promise<void> {
  const parsedShop = shopIdSchema.safeParse(shopId);
  if (!parsedShop.success) return;

  void trackEvent({
    type: "WHATSAPP_CHECKOUT",
    shopId: parsedShop.data,
  });
}
