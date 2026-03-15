// ============================================================
// Data Access — Orders
// ============================================================
// All order queries scoped by shopId. Never call Prisma directly
// from actions — always go through this layer.
//
// ORDER FLOW:
//   Cart → validateStock() → createOrder() → WhatsApp
//   Seller: listOrders() → updateOrderStatus()
//
// ORDER NUMBER FORMAT: TF-YYYYMMDD-XXXX (e.g. TF-20260224-A1B2)
// ============================================================

import { db } from "@/lib/db";
import type { OrderStatus, Order, OrderItem } from "@prisma/client";

// ── Order Number Generator ──────────────────────────────────

function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  // 4-char random alphanumeric suffix
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0/O/1/I confusion
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TF-${y}${m}${d}-${suffix}`;
}

// ── Types ───────────────────────────────────────────────────

export interface CreateOrderInput {
  shopId: string;
  items: {
    productId: string;
    variantId: string;
    productName: string;
    option1Label: string;
    option1Value: string;
    option2Label: string;
    option2Value: string | null;
    priceInCents: number;
    quantity: number;
  }[];
  buyerName?: string;
  buyerPhone?: string;
  buyerNote?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  whatsappMessage?: string;
  marketingConsent?: boolean;
}

export interface StockValidationResult {
  valid: boolean;
  errors: { variantId: string; productName: string; requested: number; available: number }[];
}

// ── Stock Validation ────────────────────────────────────────

/**
 * Validate that all requested items have sufficient stock.
 * Returns errors for any items that are out of stock or insufficient.
 */
export async function validateStock(
  items: { variantId: string; productName: string; quantity: number }[],
): Promise<StockValidationResult> {
  const variantIds = items.map((i) => i.variantId);

  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    select: { id: true, stock: true },
  });

  const stockMap = new Map(variants.map((v) => [v.id, v.stock]));
  const errors: StockValidationResult["errors"] = [];

  for (const item of items) {
    const available = stockMap.get(item.variantId);
    if (available === undefined) {
      errors.push({
        variantId: item.variantId,
        productName: item.productName,
        requested: item.quantity,
        available: 0,
      });
    } else if (available < item.quantity) {
      errors.push({
        variantId: item.variantId,
        productName: item.productName,
        requested: item.quantity,
        available,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Create Order ────────────────────────────────────────────

export type CreateOrderResult =
  | { success: true; order: Order & { items: OrderItem[] } }
  | { success: false; error: string };

/**
 * Create an order with line items in a single transaction.
 * Also decrements stock for each variant ordered.
 * Prices are re-fetched from the DB to prevent client-side tampering.
 *
 * Returns a result object instead of throwing so callers get
 * actionable error messages (e.g. "variant no longer available").
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  // Re-fetch actual prices + stock inside a single read to minimise
  // the race window between validation and creation.
  const variantIds = input.items.map((i) => i.variantId);
  const variants = await db.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    select: { id: true, priceInCents: true, stock: true },
  });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Validate every variant is still available + has sufficient stock
  const errors: string[] = [];
  const verifiedItems = input.items.map((item) => {
    const dbVariant = variantMap.get(item.variantId);
    if (!dbVariant) {
      errors.push(`"${item.productName}" is no longer available.`);
      return { ...item, priceInCents: 0 };
    }
    if (dbVariant.stock < item.quantity) {
      errors.push(
        `"${item.productName}": only ${dbVariant.stock} left (you requested ${item.quantity}).`,
      );
    }
    return { ...item, priceInCents: dbVariant.priceInCents };
  });

  if (errors.length > 0) {
    return { success: false, error: errors.join(" ") };
  }

  const totalCents = verifiedItems.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0,
  );
  const itemCount = verifiedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  // Generate unique order number (retry on collision)
  let orderNumber = generateOrderNumber();
  let retries = 0;
  while (retries < 5) {
    const existing = await db.order.findUnique({
      where: { orderNumber },
      select: { id: true },
    });
    if (!existing) break;
    orderNumber = generateOrderNumber();
    retries++;
  }

  // Transaction: create order + decrement stock atomically
  const order = await db.$transaction(async (tx) => {
    // 1. Create order with items
    const created = await tx.order.create({
      data: {
        orderNumber,
        shopId: input.shopId,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        buyerNote: input.buyerNote,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryProvince: input.deliveryProvince,
        deliveryPostalCode: input.deliveryPostalCode,
        totalCents,
        itemCount,
        whatsappMessage: input.whatsappMessage,
        marketingConsent: input.marketingConsent ?? false,
        items: {
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            option1Label: item.option1Label,
            option1Value: item.option1Value,
            option2Label: item.option2Label,
            option2Value: item.option2Value,
            priceInCents: item.priceInCents,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // 2. Decrement stock for each variant
    for (const item of verifiedItems) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return { success: true, order };
}

// ── List Orders ─────────────────────────────────────────────

/**
 * List orders for a shop with optional status filter.
 * Sorted by newest first. Includes line items.
 */
export async function listOrders(
  shopId: string,
  options?: {
    status?: OrderStatus;
    limit?: number;
    cursor?: string;
  },
) {
  const { status, limit = 20, cursor } = options ?? {};

  return db.order.findMany({
    where: {
      shopId,
      deletedAt: null,
      ...(status ? { status } : {}),
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}

// ── Get Single Order ────────────────────────────────────────

export async function getOrder(orderId: string, shopId: string) {
  return db.order.findFirst({
    where: { id: orderId, shopId, deletedAt: null },
    include: { items: true },
  });
}

// ── Update Order Status ─────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  shopId: string,
  status: OrderStatus,
) {
  return db.order.update({
    where: { id: orderId, shopId },
    data: { status },
  });
}

// ── Mark Order Paid (webhook — no shopId scoping) ───────────

export async function markOrderPaid(orderId: string) {
  return db.order.update({
    where: { id: orderId },
    data: { paidAt: new Date(), status: "CONFIRMED" },
  });
}

/**
 * Fetch order with shop details for webhook processing.
 * No shopId scoping — webhook is server-to-server.
 */
export async function getOrderForWebhook(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      shopId: true,
      totalCents: true,
      buyerPhone: true,
      shop: {
        select: {
          name: true,
          slug: true,
          whatsappNumber: true,
        },
      },
    },
  });
}

// ── Mark payment link requested (seller sent link to buyer) ──

export async function markPaymentRequested(orderId: string, shopId: string) {
  return db.order.update({
    where: { id: orderId, shopId },
    data: { paymentRequestedAt: new Date() },
  });
}

// ── Order Stats ─────────────────────────────────────────────

export async function getOrderStats(shopId: string) {
  const [total, pending, confirmed, shipped, delivered, cancelled, revenue] =
    await Promise.all([
      db.order.count({ where: { shopId, deletedAt: null } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "PENDING" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "CONFIRMED" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "SHIPPED" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "DELIVERED" } }),
      db.order.count({ where: { shopId, deletedAt: null, status: "CANCELLED" } }),
      db.order.aggregate({
        where: { shopId, deletedAt: null, status: { not: "CANCELLED" } },
        _sum: { totalCents: true },
      }),
    ]);

  return {
    total,
    pending,
    confirmed,
    shipped,
    delivered,
    cancelled,
    revenueCents: revenue._sum.totalCents ?? 0,
  };
}

// ── Product Sold Count ──────────────────────────────────────

/**
 * Get total units sold for a single product (non-cancelled orders).
 */
export async function getProductSoldCount(productId: string): Promise<number> {
  const result = await db.orderItem.aggregate({
    where: {
      productId,
      order: { status: { not: "CANCELLED" } },
    },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}
