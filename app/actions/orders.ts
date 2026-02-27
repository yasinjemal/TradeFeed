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
  type CreateOrderInput,
} from "@/lib/db/orders";
import { requireShopAccess } from "@/lib/auth";
import { notifyNewOrder, checkAndNotifyLowStock } from "@/lib/notifications";
import type { OrderStatus } from "@prisma/client";

type ActionResult = {
  success: boolean;
  error?: string;
  orderNumber?: string;
  trackingUrl?: string;
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
  try {
    // 1. Validate stock
    const stockCheck = await validateStock(
      items.map((i) => ({
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

    // 2. Create order
    const order = await createOrder({
      shopId,
      items,
      buyerName,
      buyerPhone,
      buyerNote,
      deliveryAddress,
      deliveryCity,
      deliveryProvince,
      deliveryPostalCode,
      whatsappMessage,
      marketingConsent: marketingConsent ?? false,
    });

    // 3. Fire-and-forget notifications (don't block checkout)
    notifyNewOrder({
      orderNumber: order.orderNumber,
      shopId,
      buyerName: buyerName ?? null,
      buyerPhone: buyerPhone ?? null,
      deliveryAddress: deliveryAddress ?? null,
      deliveryCity: deliveryCity ?? null,
      deliveryProvince: deliveryProvince ?? null,
      deliveryPostalCode: deliveryPostalCode ?? null,
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
      shopId,
      items.map((i) => i.variantId),
    ).catch(() => {});

    // 4. Revalidate the catalog (stock counts changed)
    revalidatePath(`/catalog/${shopSlug}`);

    return { success: true, orderNumber: order.orderNumber, trackingUrl: `/track/${encodeURIComponent(order.orderNumber)}` };
  } catch (error) {
    console.error("[checkoutAction] Error:", error);
    return { success: false, error: "Failed to place order. Please try again." };
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

    // 5. Revalidate
    revalidatePath(`/dashboard/${shopSlug}/orders`);

    return { success: true };
  } catch (error) {
    console.error("[updateOrderStatusAction] Error:", error);
    return {
      success: false,
      error: "Failed to update order. Please try again.",
    };
  }
}
