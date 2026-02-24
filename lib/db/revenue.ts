// ============================================================
// Data Access — Revenue Analytics
// ============================================================
// All revenue-related queries for the seller dashboard.
// Aggregates order data into actionable revenue insights.
// ============================================================

import { db } from "@/lib/db";

// ── Revenue Overview ────────────────────────────────────────

export interface RevenueOverview {
  totalRevenueCents: number;
  totalOrders: number;
  averageOrderCents: number;
  periodRevenueCents: number;
  periodOrders: number;
  previousPeriodRevenueCents: number;
  previousPeriodOrders: number;
  growthPercent: number;
}

export async function getRevenueOverview(
  shopId: string,
  days: number = 30,
): Promise<RevenueOverview> {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const [allTime, period, previousPeriod] = await Promise.all([
    // All-time revenue (non-cancelled orders)
    db.order.aggregate({
      where: { shopId, status: { not: "CANCELLED" } },
      _sum: { totalCents: true },
      _count: true,
    }),
    // Current period
    db.order.aggregate({
      where: {
        shopId,
        status: { not: "CANCELLED" },
        createdAt: { gte: periodStart },
      },
      _sum: { totalCents: true },
      _count: true,
    }),
    // Previous period (for growth comparison)
    db.order.aggregate({
      where: {
        shopId,
        status: { not: "CANCELLED" },
        createdAt: { gte: previousPeriodStart, lt: periodStart },
      },
      _sum: { totalCents: true },
      _count: true,
    }),
  ]);

  const totalRevenueCents = allTime._sum.totalCents ?? 0;
  const totalOrders = allTime._count;
  const periodRevenueCents = period._sum.totalCents ?? 0;
  const periodOrders = period._count;
  const previousPeriodRevenueCents = previousPeriod._sum.totalCents ?? 0;
  const previousPeriodOrders = previousPeriod._count;

  const growthPercent =
    previousPeriodRevenueCents > 0
      ? ((periodRevenueCents - previousPeriodRevenueCents) / previousPeriodRevenueCents) * 100
      : periodRevenueCents > 0
        ? 100
        : 0;

  return {
    totalRevenueCents,
    totalOrders,
    averageOrderCents: totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0,
    periodRevenueCents,
    periodOrders,
    previousPeriodRevenueCents,
    previousPeriodOrders,
    growthPercent: Math.round(growthPercent * 10) / 10,
  };
}

// ── Daily Revenue Trend ─────────────────────────────────────

export interface DailyRevenue {
  date: string; // YYYY-MM-DD
  revenueCents: number;
  orders: number;
}

export async function getDailyRevenue(
  shopId: string,
  days: number = 30,
): Promise<DailyRevenue[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      shopId,
      status: { not: "CANCELLED" },
      createdAt: { gte: since },
    },
    select: { totalCents: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dayMap = new Map<string, { revenueCents: number; orders: number }>();

  // Initialize all days in range
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0]!;
    dayMap.set(key, { revenueCents: 0, orders: 0 });
  }

  // Fill in actual data
  for (const order of orders) {
    const key = order.createdAt.toISOString().split("T")[0]!;
    const existing = dayMap.get(key) ?? { revenueCents: 0, orders: 0 };
    existing.revenueCents += order.totalCents;
    existing.orders += 1;
    dayMap.set(key, existing);
  }

  return Array.from(dayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Top Products by Revenue ─────────────────────────────────

export interface TopProduct {
  productId: string;
  productName: string;
  revenueCents: number;
  unitsSold: number;
}

export async function getTopProductsByRevenue(
  shopId: string,
  days: number = 30,
  limit: number = 10,
): Promise<TopProduct[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get order items from non-cancelled orders in this period
  const items = await db.orderItem.findMany({
    where: {
      order: {
        shopId,
        status: { not: "CANCELLED" },
        createdAt: { gte: since },
      },
    },
    select: {
      productId: true,
      productName: true,
      priceInCents: true,
      quantity: true,
    },
  });

  // Aggregate by product
  const productMap = new Map<string, TopProduct>();

  for (const item of items) {
    const existing = productMap.get(item.productId) ?? {
      productId: item.productId,
      productName: item.productName,
      revenueCents: 0,
      unitsSold: 0,
    };
    existing.revenueCents += item.priceInCents * item.quantity;
    existing.unitsSold += item.quantity;
    productMap.set(item.productId, existing);
  }

  return Array.from(productMap.values())
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
}

// ── Revenue by Status ───────────────────────────────────────

export interface RevenueByStatus {
  status: string;
  revenueCents: number;
  count: number;
}

export async function getRevenueByStatus(shopId: string): Promise<RevenueByStatus[]> {
  const statuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

  const results = await Promise.all(
    statuses.map(async (status) => {
      const agg = await db.order.aggregate({
        where: { shopId, status },
        _sum: { totalCents: true },
        _count: true,
      });
      return {
        status,
        revenueCents: agg._sum.totalCents ?? 0,
        count: agg._count,
      };
    }),
  );

  return results;
}
