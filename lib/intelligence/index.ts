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
} from "./seller-metrics";
export { generateSuggestions } from "./seller-suggestions";
