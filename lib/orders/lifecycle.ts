import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { CheckoutPolicyError } from "./checkout-policy";

export const RESERVATION_DURATION_MS = 24 * 60 * 60 * 1000;
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

async function lockOrder(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;
}

/** The row lock serializes seller updates, expiry and payment callbacks. */
export async function transitionOrder(input: {
  orderId: string;
  shopId: string;
  status: OrderStatus;
  expireBefore?: Date;
  shipping?: {
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
  };
}) {
  return db.$transaction(async (tx) => {
    await lockOrder(tx, input.orderId);
    const order = await tx.order.findFirst({
      where: { id: input.orderId, shopId: input.shopId, deletedAt: null },
      include: { items: true },
    });
    if (!order) throw new CheckoutPolicyError("Order not found.");
    if (
      input.expireBefore &&
      (order.status !== "PENDING" ||
        order.paidAt ||
        !order.reservationExpiresAt ||
        order.reservationExpiresAt > input.expireBefore)
    )
      return null;
    if (!ORDER_TRANSITIONS[order.status].includes(input.status)) {
      throw new CheckoutPolicyError(
        `Cannot change from ${order.status} to ${input.status}. Refresh this order.`,
      );
    }
    if (order.paymentReviewRequired) {
      throw new CheckoutPolicyError(
        "This payment needs administrator review before fulfilment can continue.",
      );
    }
    if (input.status === "CANCELLED" && order.paidAt) {
      throw new CheckoutPolicyError(
        "This order has a recorded payment. Open a support case to arrange cancellation and refund review.",
      );
    }
    const now = new Date();
    const release =
      input.status === "CANCELLED" &&
      order.stockReservedAt !== null &&
      order.stockReleasedAt === null;
    if (release) {
      const quantities = new Map<string, number>();
      for (const item of order.items) {
        if (item.variantId)
          quantities.set(
            item.variantId,
            (quantities.get(item.variantId) ?? 0) + item.quantity,
          );
      }
      for (const [variantId, quantity] of [...quantities].sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        await tx.productVariant.updateMany({
          where: { id: variantId, product: { shopId: order.shopId } },
          data: { stock: { increment: quantity } },
        });
      }
    }
    return tx.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        ...(input.status === "SHIPPED" ? input.shipping : {}),
        ...(release ? { stockReleasedAt: now } : {}),
        ...(input.status === "SHIPPED" ? { shippedAt: now } : {}),
        ...(input.status === "DELIVERED" ? { deliveredAt: now } : {}),
      },
    });
  });
}

/** Record actual money received, even after cancellation, without reviving stock. */
export async function recordOrderPayment(orderId: string) {
  return db.$transaction(async (tx) => {
    await lockOrder(tx, orderId);
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new CheckoutPolicyError("Order not found.");
    if (order.paidAt)
      return {
        duplicate: true,
        reviewRequired: order.paymentReviewRequired,
        order,
      };
    const reviewRequired =
      order.status === "CANCELLED" ||
      order.stockReleasedAt !== null ||
      order.deletedAt !== null ||
      order.paymentMethod !== "PAYFAST";
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        paidAt: new Date(),
        paymentReviewRequired: reviewRequired,
        ...(!reviewRequired && order.status === "PENDING"
          ? { status: "CONFIRMED" }
          : {}),
      },
    });
    return { duplicate: false, reviewRequired, order: updated };
  });
}

export async function expireOrderReservations(now = new Date()) {
  const orders = await db.order.findMany({
    where: {
      status: "PENDING",
      paidAt: null,
      stockReservedAt: { not: null },
      stockReleasedAt: null,
      reservationExpiresAt: { lte: now },
      deletedAt: null,
    },
    select: { id: true, shopId: true },
    orderBy: [{ reservationExpiresAt: "asc" }, { id: "asc" }],
    take: 100,
  });
  let expired = 0;
  for (const order of orders) {
    if (
      await transitionOrder({
        orderId: order.id,
        shopId: order.shopId,
        status: "CANCELLED",
        expireBefore: now,
      })
    )
      expired++;
  }
  return { expired, examined: orders.length };
}
