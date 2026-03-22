// ============================================================
// Data Access — Public Order Tracking
// ============================================================
// Public lookup by orderNumber — no auth required.
// Only returns safe, non-PII data for display.
// ============================================================

import { db } from "@/lib/db";

/**
 * Fetch order by its public order number (e.g. TF-20260224-A1B2).
 * Returns non-sensitive data only — buyer phone is masked.
 */
export async function getOrderByNumber(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.toUpperCase().trim() },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
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

  // Mask phone number for privacy (POPIA) — show last 4 digits only
  const maskedPhone = order.buyerPhone
    ? `***${order.buyerPhone.slice(-4)}`
    : null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentRequestedAt: order.paymentRequestedAt,
    paymentLinkExpiresAt: order.paymentLinkExpiresAt,
    paidAt: order.paidAt,
    buyerName: order.buyerName,
    buyerPhone: maskedPhone,
    buyerNote: order.buyerNote,
    deliveryAddress: order.deliveryAddress,
    deliveryCity: order.deliveryCity,
    deliveryProvince: order.deliveryProvince,
    deliveryPostalCode: order.deliveryPostalCode,
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
