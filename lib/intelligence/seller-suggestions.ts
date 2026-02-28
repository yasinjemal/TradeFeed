// ============================================================
// Seller Suggestions — Plain-Language Improvement Tips
// ============================================================
// Generates actionable, prioritized suggestions based on
// the seller's raw metrics and computed breakdown scores.
//
// DESIGN PRINCIPLES:
// - Max 3 suggestions at a time (cognitive load)
// - Plain language, not technical jargon
// - Each suggestion is specific and actionable
// - Prioritized by impact on health score
// - Encouraging tone — no shaming
// ============================================================

import type {
  SellerRawMetrics,
  SellerHealthBreakdown,
} from "./seller-metrics";

interface Suggestion {
  priority: number; // lower = more important
  text: string;
}

/**
 * Generate up to 3 prioritized suggestions.
 * Returns plain-language strings sorted by impact.
 */
export function generateSuggestions(
  metrics: SellerRawMetrics,
  breakdown: SellerHealthBreakdown
): string[] {
  const suggestions: Suggestion[] = [];

  // ── No products at all — highest priority ──────────
  if (metrics.totalProducts === 0) {
    return [
      "Add your first product to get started — even one product activates your health score.",
      "Upload a product photo, set a price, and add stock to make it visible in the marketplace.",
      "Organize products into categories to help buyers find what they need.",
    ];
  }

  // ── Product Completeness ───────────────────────────
  const missingImages =
    metrics.totalProducts - metrics.productsWithImages;
  if (missingImages > 0) {
    suggestions.push({
      priority: 1,
      text: `Add photos to ${missingImages} product${missingImages > 1 ? "s" : ""} — listings with images get 3× more views.`,
    });
  }

  const missingDesc =
    metrics.totalProducts - metrics.productsWithDescription;
  if (missingDesc > 0) {
    suggestions.push({
      priority: 3,
      text: `Write descriptions for ${missingDesc} product${missingDesc > 1 ? "s" : ""} — buyers need to know sizes, materials, and details.`,
    });
  }

  const missingStock =
    metrics.totalProducts - metrics.productsWithStock;
  if (missingStock > 0 && missingStock < metrics.totalProducts) {
    suggestions.push({
      priority: 2,
      text: `${missingStock} product${missingStock > 1 ? "s have" : " has"} zero stock — update stock levels so buyers can order.`,
    });
  }

  // ── Inventory Health ───────────────────────────────
  if (
    metrics.variantsLowStock > 0 &&
    metrics.variantsInStock > 0 &&
    metrics.variantsLowStock / metrics.variantsInStock > 0.3
  ) {
    suggestions.push({
      priority: 4,
      text: `${metrics.variantsLowStock} variant${metrics.variantsLowStock > 1 ? "s are" : " is"} running low (1–3 units) — restock soon to avoid missed sales.`,
    });
  }

  const outOfStockVariants = metrics.totalVariants - metrics.variantsInStock;
  if (outOfStockVariants > 0 && metrics.totalVariants > 0) {
    const outPct = Math.round(
      (outOfStockVariants / metrics.totalVariants) * 100
    );
    if (outPct >= 40) {
      suggestions.push({
        priority: 2,
        text: `${outPct}% of your variants are out of stock — restocking will improve your health score.`,
      });
    }
  }

  // ── Order Reliability ──────────────────────────────
  if (metrics.stalePendingOrders > 0) {
    suggestions.push({
      priority: 1,
      text: `You have ${metrics.stalePendingOrders} pending order${metrics.stalePendingOrders > 1 ? "s" : ""} older than 48 hours — confirm or update them.`,
    });
  }

  if (
    metrics.totalOrders >= 5 &&
    metrics.cancelledOrders / metrics.totalOrders > 0.2
  ) {
    suggestions.push({
      priority: 5,
      text: `Your cancellation rate is high — try to confirm orders quickly and keep stock accurate.`,
    });
  }

  // ── Activity ───────────────────────────────────────
  if (
    metrics.recentProductsAdded === 0 &&
    metrics.totalProducts < 10
  ) {
    suggestions.push({
      priority: 6,
      text: `Add more products to grow your catalog — aim for at least 10 active listings.`,
    });
  }

  if (
    metrics.recentProductsAdded === 0 &&
    metrics.totalProducts >= 10
  ) {
    suggestions.push({
      priority: 7,
      text: `Keep your catalog fresh — adding new products regularly attracts repeat buyers.`,
    });
  }

  // ── Catalog Diversity ──────────────────────────────
  if (metrics.categoryCount === 0 && metrics.totalProducts > 0) {
    suggestions.push({
      priority: 3,
      text: `Create categories and organize your products — it helps buyers browse and boosts your score.`,
    });
  } else if (
    metrics.categoryCount === 1 &&
    metrics.totalProducts >= 5
  ) {
    suggestions.push({
      priority: 8,
      text: `You only have 1 category — adding more helps buyers find products faster.`,
    });
  }

  // ── All good! ──────────────────────────────────────
  if (suggestions.length === 0) {
    return ["Your shop is in great shape! Keep adding products and fulfilling orders to maintain your score."];
  }

  // Sort by priority (lowest number = highest impact) and take top 3
  return suggestions
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((s) => s.text);
}
