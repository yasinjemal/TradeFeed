// ============================================================
// Server Actions — Orders
// ============================================================
// Handles order creation (from buyer cart checkout) and
// order status management (from seller dashboard).
//
// FLOW:
//   Buyer: checkout → validateStock → createOrder → WhatsApp
//   Seller: view orders → update status
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import {
  validateStock,
  createOrder,
  updateOrderStatus,
  getOrder,
  markPaymentRequested,
  type CreateOrderInput,
} from "@/lib/db/orders";
import { requireShopAccess } from "@/lib/auth";
import { notifyNewOrder, checkAndNotifyLowStock } from "@/lib/notifications";
import { reportError } from "@/lib/telemetry";
import { checkoutSchema } from "@/lib/validation/checkout";
import { checkRateLimit, getActionClientIp } from "@/lib/rate-limit-upstash";
import { sendOrderConfirmation, sendOrderStatusUpdate as sendStatusWhatsApp, sendBuyerPaymentLink } from "@/lib/whatsapp/business-api";
import { formatZAR } from "@/types";
import type { OrderStatus } from "@prisma/client";

type ActionResult = {
  success: boolean;
  error?: string;
  orderNumber?: string;
  trackingUrl?: string;
};

type PaymentLinkResult = {
  success: boolean;
  error?: string;
  paymentUrl?: string;
};

// ── Checkout Action (Buyer) ─────────────────────────────────

/**
 * Create an order from cart items.
 * Called right before opening WhatsApp — validates stock first.
 *
 * NOTE: No auth required — buyers aren't logged in.
 * The shopId comes from the public catalog context.
 */
export async function checkoutAction(
  shopId: string,
  shopSlug: string,
  items: CreateOrderInput["items"],
  whatsappMessage: string,
  buyerName?: string,
  buyerPhone?: string,
  buyerNote?: string,
  deliveryAddress?: string,
  deliveryCity?: string,
  deliveryProvince?: string,
  deliveryPostalCode?: string,
  marketingConsent?: boolean,
): Promise<ActionResult> {
  // Retry wrapper for transient DB connection failures (Neon cold starts)
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await _attemptCheckout(
      shopId, shopSlug, items, whatsappMessage,
      buyerName, buyerPhone, buyerNote,
      deliveryAddress, deliveryCity, deliveryProvince, deliveryPostalCode,
      marketingConsent,
    );

    // If it succeeded or was a business-logic error (not a DB connection error), return
    if (result.success || !result._retryable) {
      return result;
    }

    // Transient DB error — retry after a short delay
    if (attempt < MAX_RETRIES) {
      console.warn(`[checkoutAction] Retrying after transient error (attempt ${attempt + 1}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  return { success: false, error: "Connection issue — please try again in a moment." };
}

// ── Internal helper (not exported — called by retry wrapper) ──

type InternalResult = ActionResult & { _retryable?: boolean };

function isTransientDbError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return /connect|timeout|ECONNRESET|ECONNREFUSED|socket|EPIPE|fetch failed|terminated|Can't reach database/i.test(msg);
}

async function _attemptCheckout(
  shopId: string,
  shopSlug: string,
  items: CreateOrderInput["items"],
  whatsappMessage: string,
  buyerName?: string,
  buyerPhone?: string,
  buyerNote?: string,
  deliveryAddress?: string,
  deliveryCity?: string,
  deliveryProvince?: string,
  deliveryPostalCode?: string,
  marketingConsent?: boolean,
): Promise<InternalResult> {
  try {
    // Rate limit: 10 checkouts/min per IP
    const ip = await getActionClientIp();
    const rl = await checkRateLimit("checkout", ip);
    if (!rl.allowed) {
      return { success: false, error: "Too many checkout attempts. Please wait a moment." };
    }

    // 0. Validate & sanitize all inputs
    const parsed = checkoutSchema.safeParse({
      shopId,
      shopSlug,
      items,
      whatsappMessage,
      buyerName,
      buyerPhone,
      buyerNote,
      deliveryAddress,
      deliveryCity,
      deliveryProvince,
      deliveryPostalCode,
      marketingConsent,
    });

    if (!parsed.success) {
      console.error("[checkoutAction] Zod validation failed:", JSON.stringify(parsed.error.issues, null, 2));
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const input = parsed.data;

    // 1. Validate stock
    const stockCheck = await validateStock(
      input.items.map((i) => ({
        variantId: i.variantId,
        productName: i.productName,
        quantity: i.quantity,
      })),
    );

    if (!stockCheck.valid) {
      const outOfStock = stockCheck.errors
        .map(
          (e) =>
            `${e.productName}: only ${e.available} left (you requested ${e.requested})`,
        )
        .join("; ");
      return {
        success: false,
        error: `Some items are out of stock: ${outOfStock}`,
      };
    }

    // 2. Create order (prices are re-verified server-side in createOrder)
    const orderResult = await createOrder({
      shopId: input.shopId,
      items: input.items,
      buyerName: input.buyerName || undefined,
      buyerPhone: input.buyerPhone || undefined,
      buyerNote: input.buyerNote || undefined,
      deliveryAddress: input.deliveryAddress || undefined,
      deliveryCity: input.deliveryCity || undefined,
      deliveryProvince: input.deliveryProvince || undefined,
      deliveryPostalCode: input.deliveryPostalCode || undefined,
      whatsappMessage: input.whatsappMessage,
      marketingConsent: input.marketingConsent ?? false,
    });

    if (!orderResult.success) {
      return { success: false, error: orderResult.error };
    }

    const order = orderResult.order;

    // 3. Fire-and-forget notifications (don't block checkout)
    notifyNewOrder({
      orderNumber: order.orderNumber,
      shopId: input.shopId,
      buyerName: input.buyerName ?? null,
      buyerPhone: input.buyerPhone ?? null,
      deliveryAddress: input.deliveryAddress ?? null,
      deliveryCity: input.deliveryCity ?? null,
      deliveryProvince: input.deliveryProvince ?? null,
      deliveryPostalCode: input.deliveryPostalCode ?? null,
      totalCents: order.totalCents,
      itemCount: order.itemCount,
      items: order.items.map((i) => ({
        productName: i.productName,
        option1Label: i.option1Label,
        option1Value: i.option1Value,
        option2Label: i.option2Label,
        option2Value: i.option2Value,
        priceInCents: i.priceInCents,
        quantity: i.quantity,
      })),
    }).catch(() => {});

    checkAndNotifyLowStock(
      input.shopId,
      input.items.map((i) => i.variantId),
    ).catch(() => {});

    // 3b. Send WhatsApp order confirmation + payment link (fire-and-forget)
    if (input.buyerPhone) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tradefeed.co.za";
      const { db: prismaDb } = await import("@/lib/db");
      prismaDb.shop.findUnique({ where: { id: input.shopId }, select: { name: true } })
        .then((shop) => {
          if (!shop) return;
          const paymentUrl = `${appUrl}/pay/${encodeURIComponent(order.orderNumber)}`;
          // Send combined confirmation + payment link
          return sendBuyerPaymentLink(
            input.buyerPhone!,
            order.orderNumber,
            shop.name,
            formatZAR(order.totalCents),
            paymentUrl,
          );
        })
        .catch(() => {});
    }

    // 4. Revalidate the catalog (stock counts changed)
    revalidatePath(`/catalog/${input.shopSlug}`);

    return { success: true, orderNumber: order.orderNumber, trackingUrl: `/track/${encodeURIComponent(order.orderNumber)}` };
  } catch (error) {
    // Log for debugging (shows in Vercel function logs)
    console.error("[checkoutAction] Unexpected error:", error instanceof Error ? error.message : error);

    // Fire-and-forget — never let reportError block the error response
    reportError("checkoutAction", error, { shopId, itemCount: items?.length }).catch(() => {});

    const retryable = isTransientDbError(error);
    const message = retryable
      ? "Connection issue — please try again in a moment."
      : "Failed to place order. Please try again.";
    return { success: false, error: message, _retryable: retryable };
  }
}

// ── Update Order Status (Seller) ────────────────────────────

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Update order status. Only sellers with shop access can do this.
 */
export async function updateOrderStatusAction(
  shopSlug: string,
  orderId: string,
  newStatus: OrderStatus,
): Promise<ActionResult> {
  try {
    // 1. Verify seller access
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    // 2. Get current order to validate transition
    const { getOrder } = await import("@/lib/db/orders");
    const order = await getOrder(orderId, access.shopId);
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    // 3. Validate status transition
    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Cannot change from ${order.status} to ${newStatus}.`,
      };
    }

    // 4. Update
    await updateOrderStatus(orderId, access.shopId, newStatus);

    // 5. Send WhatsApp status update to buyer (fire-and-forget)
    if (order.buyerPhone) {
      const { db: prismaDb } = await import("@/lib/db");
      prismaDb.shop.findUnique({ where: { id: access.shopId }, select: { name: true } })
        .then((shop) => {
          if (!shop) return;
          const trackingUrl = `/track/${encodeURIComponent(order.orderNumber)}`;
          return sendStatusWhatsApp(
            order.buyerPhone!,
            order.orderNumber,
            shop.name,
            newStatus,
            trackingUrl,
          );
        })
        .catch(() => {});
    }

    // 6. Revalidate
    revalidatePath(`/dashboard/${shopSlug}/orders`);

    return { success: true };
  } catch (error) {
    await reportError("updateOrderStatusAction", error, { shopSlug, orderId, newStatus });
    return {
      success: false,
      error: "Failed to update order. Please try again.",
    };
  }
}

// ── Create Order Payment Link (Seller) ──────────────────────

/**
 * Generate a PayFast payment link for an order. Buyer can pay via this URL.
 * Marks the order as "payment requested" so the tracking timeline shows it.
 */
export async function createOrderPaymentLinkAction(
  shopSlug: string,
  orderId: string,
): Promise<PaymentLinkResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const order = await getOrder(orderId, access.shopId);
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (order.status === "CANCELLED") {
      return { success: false, error: "Cannot create payment link for a cancelled order." };
    }

    const { buildOrderPaymentUrl } = await import("@/lib/payfast");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tradefeed.co.za";
    const buyerEmail = ""; // PayFast allows empty; buyer enters at checkout
    const buyerName = order.buyerName ?? undefined;

    const paymentUrl = buildOrderPaymentUrl({
      orderId: order.id,
      orderNumber: order.orderNumber,
      shopSlug,
      amountInCents: order.totalCents,
      buyerEmail,
      buyerName,
    });

    await markPaymentRequested(orderId, access.shopId);

    revalidatePath(`/dashboard/${shopSlug}/orders`);

    return { success: true, paymentUrl };
  } catch (error) {
    await reportError("createOrderPaymentLinkAction", error, { shopSlug, orderId });
    return {
      success: false,
      error: "Failed to create payment link. Please try again.",
    };
  }
}
