// ============================================================
// Data Access — Reviews
// ============================================================
// CRUD + aggregation for product reviews.
// All queries scoped by shopId for multi-tenant safety.
// ============================================================

import { db } from "@/lib/db";

// ── Types ───────────────────────────────────────────────────

export interface CreateReviewInput {
  shopId: string;
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  buyerName: string;
  buyerEmail?: string;
}

export interface ReviewWithMeta {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  buyerName: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface ReviewAggregation {
  averageRating: number;
  totalReviews: number;
  distribution: { rating: number; count: number }[];
}

// ── Create Review ───────────────────────────────────────────

export async function createReview(input: CreateReviewInput) {
  return db.review.create({
    data: {
      shopId: input.shopId,
      productId: input.productId,
      rating: input.rating,
      title: input.title || null,
      comment: input.comment || null,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail || null,
      isApproved: false, // Always starts unapproved
      isVerified: false,
    },
  });
}

// ── Get Reviews for Product (public — approved only) ────────

export async function getProductReviews(
  productId: string,
  options?: { limit?: number; cursor?: string },
): Promise<ReviewWithMeta[]> {
  const { limit = 20, cursor } = options ?? {};

  return db.review.findMany({
    where: { productId, isApproved: true },
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      buyerName: true,
      isApproved: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}

// ── Get Reviews for Shop (seller dashboard — all reviews) ───

export async function getShopReviews(
  shopId: string,
  options?: { isApproved?: boolean; limit?: number; cursor?: string },
) {
  const { isApproved, limit = 50, cursor } = options ?? {};

  return db.review.findMany({
    where: {
      shopId,
      ...(isApproved !== undefined ? { isApproved } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });
}

// ── Approve / Reject Review ─────────────────────────────────

export async function approveReview(reviewId: string, shopId: string) {
  return db.review.updateMany({
    where: { id: reviewId, shopId },
    data: { isApproved: true },
  });
}

export async function deleteReview(reviewId: string, shopId: string) {
  return db.review.deleteMany({
    where: { id: reviewId, shopId },
  });
}

// ── Review Aggregation (for product display) ────────────────

export async function getReviewAggregation(
  productId: string,
): Promise<ReviewAggregation> {
  const [agg, dist] = await Promise.all([
    db.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    }),
    // Distribution: count per rating (1-5)
    Promise.all(
      [1, 2, 3, 4, 5].map(async (rating) => ({
        rating,
        count: await db.review.count({
          where: { productId, isApproved: true, rating },
        }),
      })),
    ),
  ]);

  return {
    averageRating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
    totalReviews: agg._count,
    distribution: dist,
  };
}

// ── Review Stats for Shop Dashboard ─────────────────────────

export async function getReviewStats(shopId: string) {
  const [total, pending, approved] = await Promise.all([
    db.review.count({ where: { shopId } }),
    db.review.count({ where: { shopId, isApproved: false } }),
    db.review.count({ where: { shopId, isApproved: true } }),
  ]);

  const avgRating = await db.review.aggregate({
    where: { shopId, isApproved: true },
    _avg: { rating: true },
  });

  return {
    total,
    pending,
    approved,
    averageRating: Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
  };
}
