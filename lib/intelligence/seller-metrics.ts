// ============================================================
// Seller Metrics — Structured Input for Health Score
// ============================================================
// Type definitions for the raw metrics that feed into the
// Seller Health Intelligence system.
//
// RULES:
// - These are pure data types — no Prisma, no DB imports
// - Populated by lib/db/shops.ts → getSellerHealthMetrics()
// - Consumed by seller-health.ts → computeSellerHealth()
// ============================================================

/**
 * Raw metrics fetched from the database for health scoring.
 * Each field maps to a specific Prisma aggregate or count.
 */
export interface SellerRawMetrics {
  // ── Product Completeness ─────────────────────────
  /** Total active products in the shop */
  totalProducts: number;
  /** Products that have at least one image */
  productsWithImages: number;
  /** Products that have a non-null description */
  productsWithDescription: number;
  /** Products that have at least one variant with priceInCents > 0 */
  productsWithPrice: number;
  /** Products that have at least one variant with stock > 0 */
  productsWithStock: number;

  // ── Inventory Health ─────────────────────────────
  /** Total active variants across all products */
  totalVariants: number;
  /** Variants with stock > 0 */
  variantsInStock: number;
  /** Variants with stock between 1–3 (low stock threshold) */
  variantsLowStock: number;

  // ── Order Reliability ────────────────────────────
  /** Total orders ever placed */
  totalOrders: number;
  /** Orders with status DELIVERED */
  deliveredOrders: number;
  /** Orders with status CANCELLED */
  cancelledOrders: number;
  /** Orders with status PENDING created more than 48 hours ago */
  stalePendingOrders: number;

  // ── Activity ─────────────────────────────────────
  /** Products created in the last 14 days */
  recentProductsAdded: number;
  /** Orders received in the last 14 days */
  recentOrdersReceived: number;

  // ── Catalog Size & Diversity ─────────────────────
  /** Number of active products (same as totalProducts) */
  activeProducts: number;
  /** Number of distinct categories with at least one product */
  categoryCount: number;
}

/**
 * Score breakdown by dimension (0–max for each).
 * Weights: completeness=25, inventory=20, reliability=20, activity=15, diversity=20
 */
export interface SellerHealthBreakdown {
  completeness: number; // 0–25
  inventory: number; // 0–20
  reliability: number; // 0–20
  activity: number; // 0–15
  diversity: number; // 0–20
}

/**
 * A single actionable suggestion with a link to the relevant page.
 */
export interface SellerSuggestion {
  /** Human-readable suggestion text */
  text: string;
  /** Dashboard-relative path, e.g. "orders" → /dashboard/[slug]/orders */
  href: string;
}

/**
 * Full health score result returned by computeSellerHealth().
 */
export interface SellerHealthResult {
  /** Overall score 0–100 */
  score: number;
  /** Per-dimension breakdown */
  breakdown: SellerHealthBreakdown;
  /** Actionable improvement suggestions with links (top 3) */
  suggestions: SellerSuggestion[];
}
