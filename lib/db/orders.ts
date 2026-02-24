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
import type { OrderStatus } from "@prisma/client";

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
  whatsappMessage?: string;
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

/**
 * Create an order with line items in a single transaction.
 * Also decrements stock for each variant ordered.
 */
export async function createOrder(input: CreateOrderInput) {
  const totalCents = input.items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0,
  );
  const itemCount = input.items.reduce(
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
        totalCents,
        itemCount,
        whatsappMessage: input.whatsappMessage,
        items: {
          create: input.items.map((item) => ({
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
    for (const item of input.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return order;
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
    where: { id: orderId, shopId },
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

// ── Order Stats ─────────────────────────────────────────────

export async function getOrderStats(shopId: string) {
  const [total, pending, confirmed, shipped, delivered, cancelled, revenue] =
    await Promise.all([
      db.order.count({ where: { shopId } }),
      db.order.count({ where: { shopId, status: "PENDING" } }),
      db.order.count({ where: { shopId, status: "CONFIRMED" } }),
      db.order.count({ where: { shopId, status: "SHIPPED" } }),
      db.order.count({ where: { shopId, status: "DELIVERED" } }),
      db.order.count({ where: { shopId, status: "CANCELLED" } }),
      db.order.aggregate({
        where: { shopId, status: { not: "CANCELLED" } },
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
