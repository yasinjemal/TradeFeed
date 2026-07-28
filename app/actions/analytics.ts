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
import { trackRequestEvent } from "@/lib/analytics/server";
import { checkRateLimit, getActionClientIp } from "@/lib/rate-limit-upstash";

const shopIdSchema = z.string().min(1).max(100);
const productIdSchema = z.string().min(1).max(100).optional();

/**
 * Track a WhatsApp enquiry button click on a product page.
 */
export async function trackWhatsAppClickAction(
  shopId: string,
  productId?: string,
): Promise<void> {
  // Rate limit: 100 analytics events/min per IP
  const ip = await getActionClientIp();
  const rl = await checkRateLimit("analytics", ip);
  if (!rl.allowed) return; // silently drop — don't error for analytics

  const parsedShop = shopIdSchema.safeParse(shopId);
  const parsedProduct = productIdSchema.safeParse(productId);
  if (!parsedShop.success) return;

  await trackRequestEvent({
    type: "WHATSAPP_CLICK",
    shopId: parsedShop.data,
    productId: parsedProduct.success ? parsedProduct.data : undefined,
  }, { excludeSignedInShopOwners: true });
}

/**
 * Track a WhatsApp cart checkout.
 */
export async function trackWhatsAppCheckoutAction(
  shopId: string,
): Promise<void> {
  // Rate limit: shares the analytics bucket (100/min per IP)
  const ip = await getActionClientIp();
  const rl = await checkRateLimit("analytics", ip);
  if (!rl.allowed) return;

  const parsedShop = shopIdSchema.safeParse(shopId);
  if (!parsedShop.success) return;

  await trackRequestEvent({
    type: "WHATSAPP_CHECKOUT",
    shopId: parsedShop.data,
  }, { excludeSignedInShopOwners: true });
}

/**
 * Track an add-to-cart event from the catalog product page.
 */
export async function trackAddToCartAction(
  shopId: string,
  productId: string,
): Promise<void> {
  const ip = await getActionClientIp();
  const rl = await checkRateLimit("analytics", ip);
  if (!rl.allowed) return;

  const parsedShop = shopIdSchema.safeParse(shopId);
  const parsedProduct = z.string().min(1).max(100).safeParse(productId);
  if (!parsedShop.success || !parsedProduct.success) return;

  await trackRequestEvent({
    type: "ADD_TO_CART",
    shopId: parsedShop.data,
    productId: parsedProduct.data,
  }, { excludeSignedInShopOwners: true });
}

/**
 * Track checkout start (order creation from cart).
 */
export async function trackCheckoutStartAction(
  shopId: string,
): Promise<void> {
  const ip = await getActionClientIp();
  const rl = await checkRateLimit("analytics", ip);
  if (!rl.allowed) return;

  const parsedShop = shopIdSchema.safeParse(shopId);
  if (!parsedShop.success) return;

  await trackRequestEvent({
    type: "CHECKOUT_START",
    shopId: parsedShop.data,
  }, { excludeSignedInShopOwners: true });
}
