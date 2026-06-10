// ============================================================
// Price Suggestion — From Similar Listings (Phase 3)
// ============================================================
// Suggests a price range for a new product based on active
// listings in the same marketplace (global) category.
// Percentile-based — robust to outliers, no AI call needed.
//
// Pure computation here; DB fetch in lib/db/price-suggestion.ts.
// ============================================================

export interface PriceSuggestion {
  /** 25th percentile — "competitive" price */
  p25Cents: number;
  /** Median — "typical" price */
  medianCents: number;
  /** 75th percentile — "premium" price */
  p75Cents: number;
  /** How many listings informed the suggestion */
  sampleSize: number;
}

/** Need at least this many price points for a meaningful suggestion. */
export const MIN_SAMPLE_SIZE = 5;

/**
 * Linear-interpolated percentile of a sorted array.
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return Math.round(sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo));
}

/**
 * Compute a price suggestion from raw price points (cents).
 * Returns null when there's not enough data — better no hint
 * than a misleading one.
 */
export function computePriceSuggestion(pricesCents: number[]): PriceSuggestion | null {
  const valid = pricesCents.filter((p) => Number.isFinite(p) && p > 0);
  if (valid.length < MIN_SAMPLE_SIZE) return null;

  const sorted = [...valid].sort((a, b) => a - b);

  return {
    p25Cents: percentile(sorted, 0.25),
    medianCents: percentile(sorted, 0.5),
    p75Cents: percentile(sorted, 0.75),
    sampleSize: sorted.length,
  };
}
