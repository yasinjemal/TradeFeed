// ============================================================
// Product Quality Score — Pure Computation Engine
// ============================================================
// Calculates a Product Quality Score (0–100) for marketplace
// ranking. NO database access, NO side effects, NO Prisma.
//
// This is a pure function:
//   ProductRankingMetrics → ProductQualityResult
//
// Weights:
//   Engagement     25 pts  (views in last 30d)
//   Conversion     25 pts  (orders + WhatsApp clicks)
//   Rating         20 pts  (avg rating × review volume)
//   Freshness      15 pts  (recency with decay)
//   Seller Trust   15 pts  (seller tier points)
//
// DESIGN NOTES:
// - Cold-start boost: products < 7 days old get freshness bonus
// - Decay: products with no engagement lose score over time
// - Anti-gaming: score based on real signals, not re-listing
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface ProductRankingMetrics {
  /** Product views in the last 30 days */
  views30d: number;
  /** WhatsApp clicks in the last 30 days */
  whatsappClicks30d: number;
  /** Marketplace clicks in the last 30 days */
  marketplaceClicks30d: number;
  /** Total non-cancelled orders for this product */
  totalOrders: number;
  /** Average approved review rating (null if no reviews) */
  avgRating: number | null;
  /** Number of approved reviews */
  reviewCount: number;
  /** Days since product was created */
  ageDays: number;
  /** Days since product was last updated */
  daysSinceUpdate: number;
  /** Seller tier points (0–100 from reputation system) */
  sellerTierPoints: number;
}

export interface ProductQualityBreakdown {
  engagement: number;   // 0–25
  conversion: number;   // 0–25
  rating: number;       // 0–20
  freshness: number;    // 0–15
  sellerTrust: number;  // 0–15
}

export interface ProductQualityResult {
  score: number;
  breakdown: ProductQualityBreakdown;
}

// ── Weights ──────────────────────────────────────────────────

const WEIGHTS = {
  engagement: 25,
  conversion: 25,
  rating: 20,
  freshness: 15,
  sellerTrust: 15,
} as const;

// ── Thresholds (tuned for SA wholesale marketplace) ──────────

/** 50+ views / 30 days = full engagement score */
const VIEWS_FULL = 50;
/** 10+ WhatsApp clicks / 30 days = strong signal */
const WA_CLICKS_FULL = 10;
/** 5+ orders all-time = full conversion score */
const ORDERS_FULL = 5;
/** 5+ reviews = full review volume */
const REVIEW_VOLUME_FULL = 5;
/** 7 days = cold-start boost window */
const COLD_START_DAYS = 7;
/** 60 days = stale threshold (start losing freshness) */
const STALE_DAYS = 60;

// ── Helpers ──────────────────────────────────────────────────

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ── Dimension Scorers ────────────────────────────────────────

/**
 * Engagement (0–25)
 * Measures: product views (60%) + WhatsApp clicks (25%) + marketplace clicks (15%)
 */
function scoreEngagement(m: ProductRankingMetrics): number {
  const viewRate = clamp(m.views30d / VIEWS_FULL, 0, 1);
  const waRate = clamp(m.whatsappClicks30d / WA_CLICKS_FULL, 0, 1);
  const mkRate = clamp(m.marketplaceClicks30d / WA_CLICKS_FULL, 0, 1);

  const score = viewRate * 0.6 + waRate * 0.25 + mkRate * 0.15;
  return Math.round(score * WEIGHTS.engagement);
}

/**
 * Conversion (0–25)
 * Measures: orders (70%) + click-to-order ratio signal (30%)
 */
function scoreConversion(m: ProductRankingMetrics): number {
  const orderRate = clamp(m.totalOrders / ORDERS_FULL, 0, 1);

  // Click-to-order signal: if product gets clicks AND orders, it converts well
  const totalClicks = m.whatsappClicks30d + m.marketplaceClicks30d;
  const clickSignal = totalClicks > 0 && m.totalOrders > 0 ? 1 : 0;

  const score = orderRate * 0.7 + clickSignal * 0.3;
  return Math.round(score * WEIGHTS.conversion);
}

/**
 * Rating (0–20)
 * Measures: rating quality (60%) × review volume (40%)
 * Mirrors the reputation system's review scoring.
 */
function scoreRating(m: ProductRankingMetrics): number {
  if (m.avgRating === null || m.reviewCount === 0) return 0;

  // Rating quality: 3.0 = 0, 5.0 = 1.0
  const ratingQuality = clamp((m.avgRating - 3) / 2, 0, 1);
  // Volume factor: 0–5 reviews → 0–1.0
  const volumeFactor = clamp(m.reviewCount / REVIEW_VOLUME_FULL, 0, 1);

  const score = ratingQuality * 0.6 + volumeFactor * 0.4;
  return Math.round(score * WEIGHTS.rating);
}

/**
 * Freshness (0–15)
 * Cold-start boost for new products (< 7 days).
 * Gradual decay for stale products (> 60 days without update).
 */
function scoreFreshness(m: ProductRankingMetrics): number {
  // Cold-start boost: new products get full freshness
  if (m.ageDays <= COLD_START_DAYS) {
    return WEIGHTS.freshness;
  }

  // Decay based on time since last update
  if (m.daysSinceUpdate <= 7) return WEIGHTS.freshness;
  if (m.daysSinceUpdate <= 30) return Math.round(WEIGHTS.freshness * 0.8);
  if (m.daysSinceUpdate <= STALE_DAYS) return Math.round(WEIGHTS.freshness * 0.5);

  // Severely stale: > 60 days without update
  return Math.round(WEIGHTS.freshness * 0.2);
}

/**
 * Seller Trust (0–15)
 * Direct mapping from seller tier points (0–100 → 0–15).
 */
function scoreSellerTrust(m: ProductRankingMetrics): number {
  const rate = clamp(m.sellerTierPoints / 100, 0, 1);
  return Math.round(rate * WEIGHTS.sellerTrust);
}

// ── Main Computation ─────────────────────────────────────────

/**
 * Compute the Product Quality Score from ranking metrics.
 *
 * @param metrics - Structured metrics from the ranking cron
 * @returns ProductQualityResult with score and breakdown
 */
export function computeProductQuality(
  metrics: ProductRankingMetrics
): ProductQualityResult {
  const breakdown: ProductQualityBreakdown = {
    engagement: scoreEngagement(metrics),
    conversion: scoreConversion(metrics),
    rating: scoreRating(metrics),
    freshness: scoreFreshness(metrics),
    sellerTrust: scoreSellerTrust(metrics),
  };

  const score = clamp(
    breakdown.engagement +
      breakdown.conversion +
      breakdown.rating +
      breakdown.freshness +
      breakdown.sellerTrust,
    0,
    100
  );

  return { score, breakdown };
}
