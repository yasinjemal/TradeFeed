// ============================================================
// Data Access — Public Order Tracking
// ============================================================
// Public lookup by orderNumber — no auth required.
// This projection is deliberately capability-safe: never add buyer identity,
// contact, notes, or delivery-address fields to the public response.
// ============================================================

import { db } from "@/lib/db";

/**
 * Fetch order by its public order number.
 * Returns order status/commerce data only; all buyer PII stays private.
 */
export async function getOrderByNumber(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase().trim() },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentRequestedAt: true,
      paymentLinkExpiresAt: true,
      paidAt: true,
      totalCents: true,
      itemCount: true,
      createdAt: true,
      updatedAt: true,
      shippingMethod: true,
      shippingCostCents: true,
      courierName: true,
      trackingNumber: true,
      trackingUrl: true,
      shippedAt: true,
      deliveredAt: true,
      estimatedDelivery: true,
      paymentMethod: true,
      codConfirmedAt: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          productName: true,
          option1Label: true,
          option1Value: true,
          option2Label: true,
          option2Value: true,
          priceInCents: true,
          quantity: true,
        },
      },
      shop: {
        select: {
          name: true,
          slug: true,
          logoUrl: true,
          whatsappNumber: true,
          city: true,
          province: true,
          isVerified: true,
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentRequestedAt: order.paymentRequestedAt,
    paymentLinkExpiresAt: order.paymentLinkExpiresAt,
    paidAt: order.paidAt,
    totalCents: order.totalCents,
    itemCount: order.itemCount,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    // Shipping info
    shippingMethod: order.shippingMethod,
    shippingCostCents: order.shippingCostCents,
    courierName: order.courierName,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    estimatedDelivery: order.estimatedDelivery,
    // Payment method
    paymentMethod: order.paymentMethod,
    codConfirmedAt: order.codConfirmedAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      option1Label: item.option1Label,
      option1Value: item.option1Value,
      option2Label: item.option2Label,
      option2Value: item.option2Value,
      priceInCents: item.priceInCents,
      quantity: item.quantity,
    })),
    shop: order.shop,
  };
}

export type TrackedOrder = NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>;
