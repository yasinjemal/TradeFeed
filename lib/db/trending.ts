// ============================================================
// Data Access — Trending Products for Dashboard
// ============================================================
// Queries OrderItems to find best-selling products in last 30 days.
// Feeds into computeTrendingProducts() for momentum scoring.
// ============================================================

import { db } from "@/lib/db";
import { computeTrendingProducts, type TrendingProduct } from "@/lib/intelligence/trending";

/**
 * Get trending products for a shop based on order data.
 * Returns top `limit` products ranked by momentum (recent orders weighted higher).
 */
export async function getTrendingProducts(
  shopId: string,
  limit = 5
): Promise<TrendingProduct[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Aggregate order items grouped by productId for this shop
  const rows = await db.orderItem.groupBy({
    by: ["productId", "productName"],
    where: {
      order: {
        shopId,
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
    },
    _sum: { quantity: true, priceInCents: true },
    _count: { id: true },
    _max: { createdAt: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit * 2, // fetch extra for momentum ranking to reshuffle
  });

  if (rows.length === 0) return [];

  // Map to the shape computeTrendingProducts expects
  const data = rows.map((r) => ({
    productId: r.productId,
    productName: r.productName,
    shopId,
    orderCount: r._count.id,
    totalRevenueCents: r._sum.priceInCents ?? 0,
    lastOrderDate: r._max.createdAt ?? new Date(),
  }));

  return computeTrendingProducts(data, limit);
}
