// ============================================================
// Intelligence — Trending Products
// ============================================================
// Pure computation: determines trending products based on
// order frequency within a time window.
//
// NO database access — takes pre-fetched order data as input.
// This is a pure function like seller-health.ts.
//
// Usage:
//   import { computeTrendingProducts } from "@/lib/intelligence/trending";
// ============================================================

/**
 * Raw order-product data point for trending calculation.
 */
export interface ProductOrderCount {
  productId: string;
  productName: string;
  shopId: string;
  orderCount: number;
  totalRevenueCents: number;
  lastOrderDate: Date;
}

/**
 * Trending product result with rank and momentum.
 */
export interface TrendingProduct {
  rank: number;
  productId: string;
  productName: string;
  shopId: string;
  orderCount: number;
  totalRevenueCents: number;
  lastOrderDate: Date;
  /** Momentum score (0–100): higher = faster-growing demand */
  momentum: number;
}

/**
 * Compute trending products from raw order counts.
 *
 * Algorithm:
 *   1. Sort by order count (primary) + recency (secondary)
 *   2. Assign momentum score based on relative position
 *   3. Return top N products
 *
 * @param data - Pre-fetched order counts per product
 * @param limit - Max results (default 10)
 */
export function computeTrendingProducts(
  data: ProductOrderCount[],
  limit: number = 10
): TrendingProduct[] {
  if (data.length === 0) return [];

  // Sort: most orders first, then most recent
  const sorted = [...data].sort((a, b) => {
    if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
    return b.lastOrderDate.getTime() - a.lastOrderDate.getTime();
  });

  const maxOrders = sorted[0]!.orderCount;

  return sorted.slice(0, limit).map((item, index) => ({
    rank: index + 1,
    productId: item.productId,
    productName: item.productName,
    shopId: item.shopId,
    orderCount: item.orderCount,
    totalRevenueCents: item.totalRevenueCents,
    lastOrderDate: item.lastOrderDate,
    // Momentum: percentage of max orders (leader = 100)
    momentum: maxOrders > 0 ? Math.round((item.orderCount / maxOrders) * 100) : 0,
  }));
}
