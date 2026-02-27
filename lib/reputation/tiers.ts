// ============================================================
// Seller Reputation Tier System
// ============================================================
// Calculates a seller's tier based on measurable shop metrics.
// Tiers provide gamified motivation + buyer trust signals.
// ============================================================

export type SellerTier = "new" | "rising" | "established" | "top";

export interface TierDefinition {
  key: SellerTier;
  label: string;
  emoji: string;
  /** Minimum points needed to reach this tier */
  minPoints: number;
  /** Color classes for badge display */
  bgColor: string;
  textColor: string;
  borderColor: string;
  /** Short description shown to seller */
  description: string;
}

export const TIERS: TierDefinition[] = [
  {
    key: "new",
    label: "New Seller",
    emoji: "🌱",
    minPoints: 0,
    bgColor: "bg-stone-100",
    textColor: "text-stone-700",
    borderColor: "border-stone-200",
    description: "Welcome! Start adding products and completing your profile.",
  },
  {
    key: "rising",
    label: "Rising Seller",
    emoji: "🚀",
    minPoints: 30,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    description: "You're building momentum. Keep adding products and filling orders!",
  },
  {
    key: "established",
    label: "Established",
    emoji: "⭐",
    minPoints: 60,
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    description: "Buyers trust your shop. You're a reliable seller on TradeFeed.",
  },
  {
    key: "top",
    label: "Top Seller",
    emoji: "👑",
    minPoints: 85,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    description: "Elite status! You're one of the best sellers on TradeFeed.",
  },
];

/** Metrics used to calculate tier points */
export interface TierMetrics {
  /** Total active products */
  activeProducts: number;
  /** Total fulfilled orders (all time) */
  totalOrders: number;
  /** Average review rating (1-5, or null if no reviews) */
  avgRating: number | null;
  /** Total approved reviews */
  reviewCount: number;
  /** Days since shop was created */
  accountAgeDays: number;
  /** Profile completeness percentage (0-100) */
  profileCompletePct: number;
}

/**
 * Calculate reputation points (0-100) from seller metrics.
 *
 * Scoring weights:
 * - Products (0-20):    5+ active = full marks
 * - Orders   (0-25):    25+ orders = full marks
 * - Reviews  (0-20):    avg ≥ 4.0 with 5+ reviews = full
 * - Age      (0-15):    30+ days = full marks
 * - Profile  (0-20):    100% complete = full marks
 */
export function calculateTierPoints(m: TierMetrics): number {
  // Products: 0-20 pts (linear up to 5 products)
  const productPts = Math.min(m.activeProducts / 5, 1) * 20;

  // Orders: 0-25 pts (linear up to 25 orders)
  const orderPts = Math.min(m.totalOrders / 25, 1) * 25;

  // Reviews: 0-20 pts (rating quality × volume)
  let reviewPts = 0;
  if (m.avgRating !== null && m.reviewCount > 0) {
    // Rating quality: 0-1 scale (3.0 = 0, 5.0 = 1)
    const ratingQuality = Math.max(0, Math.min((m.avgRating - 3) / 2, 1));
    // Volume factor: 0-1 scale (5+ reviews = full)
    const volumeFactor = Math.min(m.reviewCount / 5, 1);
    reviewPts = ratingQuality * volumeFactor * 20;
  }

  // Account age: 0-15 pts (linear up to 30 days)
  const agePts = Math.min(m.accountAgeDays / 30, 1) * 15;

  // Profile completeness: 0-20 pts
  const profilePts = (m.profileCompletePct / 100) * 20;

  return Math.round(productPts + orderPts + reviewPts + agePts + profilePts);
}

/** Get the tier for a given point score */
export function getTierForPoints(points: number): TierDefinition {
  // Walk tiers in reverse to find the highest qualifying tier
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i]!.minPoints) {
      return TIERS[i]!;
    }
  }
  return TIERS[0]!;
}

/** Get the next tier (for progress display), or null if already at top */
export function getNextTier(
  currentTier: TierDefinition
): TierDefinition | null {
  const idx = TIERS.findIndex((t) => t.key === currentTier.key);
  if (idx < 0 || idx >= TIERS.length - 1) return null;
  return TIERS[idx + 1] ?? null;
}
