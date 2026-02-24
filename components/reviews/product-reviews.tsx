"use client";

// ============================================================
// Product Reviews — Public Display Component
// ============================================================
// Shows approved reviews, star ratings, and review form.
// Used on product detail pages in the public catalog.
// ============================================================

import { useState } from "react";
import { submitReviewAction } from "@/app/actions/reviews";
import type { ReviewWithMeta, ReviewAggregation } from "@/lib/db/reviews";

interface ProductReviewsProps {
  shopId: string;
  shopSlug: string;
  productId: string;
  reviews: ReviewWithMeta[];
  aggregation: ReviewAggregation;
}

export function ProductReviews({
  shopId,
  shopSlug,
  productId,
  reviews,
  aggregation,
}: ProductReviewsProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-stone-900">
            {aggregation.averageRating > 0 ? aggregation.averageRating.toFixed(1) : "—"}
          </div>
          <StarRating rating={Math.round(aggregation.averageRating)} size="md" />
          <p className="text-sm text-stone-500 mt-1">
            {aggregation.totalReviews} review{aggregation.totalReviews !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-1 min-w-0">
          {[5, 4, 3, 2, 1].map((rating) => {
            const entry = aggregation.distribution.find((d) => d.rating === rating);
            const count = entry?.count ?? 0;
            const percent = aggregation.totalReviews > 0 ? (count / aggregation.totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-xs text-stone-500 w-3">{rating}</span>
                <StarRating rating={rating} size="xs" />
                <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-stone-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition whitespace-nowrap"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          shopId={shopId}
          shopSlug={shopSlug}
          productId={productId}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-6">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-stone-200 bg-white p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm font-bold text-stone-600">
                    {review.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-900">
                        {review.buyerName}
                      </span>
                      {review.isVerified && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>
                <time className="text-xs text-stone-400">
                  {new Date(review.createdAt).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              {review.title && (
                <h4 className="text-sm font-semibold text-stone-800 mb-1">{review.title}</h4>
              )}
              {review.comment && (
                <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Star Rating ─────────────────────────────────────────────

function StarRating({ rating, size = "md" }: { rating: number; size?: "xs" | "sm" | "md" }) {
  const sizeClasses = { xs: "text-xs", sm: "text-sm", md: "text-lg" };
  return (
    <div className={`flex ${sizeClasses[size]} text-amber-400`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-amber-400" : "text-stone-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── Review Form ─────────────────────────────────────────────

function ReviewForm({
  shopId,
  shopSlug,
  productId,
  onClose,
}: {
  shopId: string;
  shopSlug: string;
  productId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("rating", String(rating));

    const res = await submitReviewAction(shopId, productId, shopSlug, formData);
    setResult(res);
    setSubmitting(false);

    if (res.success) {
      setTimeout(onClose, 2000);
    }
  };

  if (result?.success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-emerald-800 font-semibold">✅ Thank you for your review!</p>
        <p className="text-sm text-emerald-600 mt-1">It will appear after seller approval.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-stone-200 bg-stone-50 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Write a Review</h3>
        <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600">
          ✕
        </button>
      </div>

      {/* Star picker */}
      <div>
        <label className="text-sm font-medium text-stone-700 block mb-2">Your Rating</label>
        <div className="flex text-2xl cursor-pointer">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className={`transition ${
                star <= (hoveredRating || rating) ? "text-amber-400" : "text-stone-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="buyerName" className="text-sm font-medium text-stone-700 block mb-1">
          Your Name *
        </label>
        <input
          id="buyerName"
          name="buyerName"
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="buyerEmail" className="text-sm font-medium text-stone-700 block mb-1">
          Email <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="buyerEmail"
          name="buyerEmail"
          type="email"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium text-stone-700 block mb-1">
          Review Title <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          maxLength={200}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="comment" className="text-sm font-medium text-stone-700 block mb-1">
          Your Review <span className="text-stone-400">(optional)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {result?.error && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
