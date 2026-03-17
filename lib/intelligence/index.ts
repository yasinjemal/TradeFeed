// ============================================================
// Intelligence Module — Public API
// ============================================================
// Re-exports the Seller Health Intelligence system.
// Usage:
//   import { computeSellerHealth } from "@/lib/intelligence";
//   import type { SellerRawMetrics, SellerHealthResult } from "@/lib/intelligence";
// ============================================================

export { computeSellerHealth } from "./seller-health";
export type {
  SellerRawMetrics,
  SellerHealthBreakdown,
  SellerHealthResult,
  SellerSuggestion,
} from "./seller-metrics";
export { generateSuggestions } from "./seller-suggestions";
export { computeTrendingProducts } from "./trending";
export type { ProductOrderCount, TrendingProduct } from "./trending";
export { computeProductQuality } from "./product-quality";
export type {
  ProductRankingMetrics,
  ProductQualityBreakdown,
  ProductQualityResult,
} from "./product-quality";
