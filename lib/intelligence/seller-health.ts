// ============================================================
// Seller Health — Pure Computation Engine
// ============================================================
// Calculates a Seller Health Score (0–100) from structured
// metrics. NO database access, NO side effects, NO Prisma.
//
// This is a pure function:
//   SellerRawMetrics → SellerHealthResult
//
// Weights:
//   Completeness   25 pts  (product quality)
//   Inventory      20 pts  (stock health)
//   Reliability    20 pts  (order fulfillment)
//   Activity       15 pts  (recent engagement)
//   Diversity      20 pts  (catalog breadth)
//
// DESIGN NOTES:
// - Inspired by Etsy's simplicity + SaaS health scoring
// - Avoids punitive metrics (no account penalties)
// - Encourages improvement, not compliance
// - All thresholds tuned for SA wholesale context
// ============================================================

import type {
  SellerRawMetrics,
  SellerHealthBreakdown,
  SellerHealthResult,
} from "./seller-metrics";
import { generateSuggestions } from "./seller-suggestions";

// ── Dimension Weights ────────────────────────────────────
const WEIGHTS = {
  completeness: 25,
  inventory: 20,
  reliability: 20,
  activity: 15,
  diversity: 20,
} as const;

// ── Helpers ──────────────────────────────────────────────

/** Safe ratio — returns 0 if denominator is 0 */
function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.min(numerator / denominator, 1);
}

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Dimension Scorers ────────────────────────────────────

/**
 * Product Completeness (0–25)
 * Measures: % of products with image, description, price, stock.
 * Each attribute is equally weighted at 25% of the dimension.
 */
function scoreCompleteness(m: SellerRawMetrics): number {
  if (m.totalProducts === 0) return 0;

  const imageRate = ratio(m.productsWithImages, m.totalProducts);
  const descRate = ratio(m.productsWithDescription, m.totalProducts);
  const priceRate = ratio(m.productsWithPrice, m.totalProducts);
  const stockRate = ratio(m.productsWithStock, m.totalProducts);

  // Average of the 4 completion rates
  const avgRate = (imageRate + descRate + priceRate + stockRate) / 4;
  return Math.round(avgRate * WEIGHTS.completeness);
}

/**
 * Inventory Health (0–20)
 * Measures: in-stock rate (70%) + low-stock penalty (30%).
 * Wholesalers often have tight stock — so we're lenient.
 */
function scoreInventory(m: SellerRawMetrics): number {
  if (m.totalVariants === 0) return 0;

  // % of variants in stock
  const inStockRate = ratio(m.variantsInStock, m.totalVariants);

  // Low stock penalty: if >25% of in-stock variants are low (1–3), deduct
  const lowStockPenalty =
    m.variantsInStock > 0
      ? ratio(m.variantsLowStock, m.variantsInStock)
      : 0;

  // Weighted: 70% in-stock rate, 30% inverse of low-stock penalty
  const score = inStockRate * 0.7 + (1 - lowStockPenalty) * 0.3;
  return Math.round(score * WEIGHTS.inventory);
}

/**
 * Order Reliability (0–20)
 * Measures: delivery rate (60%), cancellation penalty (20%),
 * stale-pending penalty (20%).
 *
 * Shops with 0 orders get a baseline 10/20 (neutral — no data yet).
 */
function scoreReliability(m: SellerRawMetrics): number {
  if (m.totalOrders === 0) return Math.round(WEIGHTS.reliability * 0.5); // 10/20 baseline

  // Delivery rate
  const deliveryRate = ratio(m.deliveredOrders, m.totalOrders);

  // Cancellation penalty (inverse — 0 cancellations = 1.0)
  const cancelRate = 1 - ratio(m.cancelledOrders, m.totalOrders);

  // Stale pending penalty (inverse — 0 stale = 1.0)
  const staleRate = 1 - ratio(m.stalePendingOrders, m.totalOrders);

  const score = deliveryRate * 0.6 + cancelRate * 0.2 + staleRate * 0.2;
  return Math.round(score * WEIGHTS.reliability);
}

/**
 * Activity (0–15)
 * Measures: recent product additions (50%) + recent orders (50%).
 *
 * Thresholds tuned for SA wholesalers:
 * - Adding 3+ products in 14 days = full score
 * - Receiving 5+ orders in 14 days = full score
 */
function scoreActivity(m: SellerRawMetrics): number {
  // Product activity: 0–3 products in 14 days → 0–1.0
  const productActivity = clamp(m.recentProductsAdded / 3, 0, 1);

  // Order activity: 0–5 orders in 14 days → 0–1.0
  const orderActivity = clamp(m.recentOrdersReceived / 5, 0, 1);

  const score = (productActivity * 0.5 + orderActivity * 0.5);
  return Math.round(score * WEIGHTS.activity);
}

/**
 * Catalog Size & Diversity (0–20)
 * Measures: product count (50%) + category spread (50%).
 *
 * Thresholds:
 * - 10+ active products = full product score
 * - 3+ categories = full diversity score
 */
function scoreDiversity(m: SellerRawMetrics): number {
  // Product count: 0–10 products → 0–1.0
  const productScore = clamp(m.activeProducts / 10, 0, 1);

  // Category spread: 0–3 categories → 0–1.0
  const categoryScore = clamp(m.categoryCount / 3, 0, 1);

  const score = productScore * 0.5 + categoryScore * 0.5;
  return Math.round(score * WEIGHTS.diversity);
}

// ── Main Computation ─────────────────────────────────────

/**
 * Compute the Seller Health Score from raw metrics.
 *
 * @param metrics - Structured metrics from getSellerHealthMetrics()
 * @returns SellerHealthResult with score, breakdown, and suggestions
 */
export function computeSellerHealth(
  metrics: SellerRawMetrics
): SellerHealthResult {
  const breakdown: SellerHealthBreakdown = {
    completeness: scoreCompleteness(metrics),
    inventory: scoreInventory(metrics),
    reliability: scoreReliability(metrics),
    activity: scoreActivity(metrics),
    diversity: scoreDiversity(metrics),
  };

  const score = clamp(
    breakdown.completeness +
      breakdown.inventory +
      breakdown.reliability +
      breakdown.activity +
      breakdown.diversity,
    0,
    100
  );

  const suggestions = generateSuggestions(metrics, breakdown);

  return { score, breakdown, suggestions };
}
