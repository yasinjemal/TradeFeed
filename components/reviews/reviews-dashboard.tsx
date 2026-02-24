"use client";

// ============================================================
// Reviews Dashboard — Seller Client Component
// ============================================================
// Displays review stats, filter tabs, and approval controls.
// ============================================================

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { approveReviewAction, deleteReviewAction } from "@/app/actions/reviews";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  buyerName: string;
  buyerEmail: string | null;
  productId: string;
  isApproved: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  averageRating: number;
}

interface ReviewsDashboardProps {
  reviews: Review[];
  stats: ReviewStats;
  shopSlug: string;
  currentFilter?: string;
}

export function ReviewsDashboard({
  reviews,
  stats,
  shopSlug,
  currentFilter,
}: ReviewsDashboardProps) {
  const pathname = usePathname();

  const filters = [
    { label: "All", value: undefined, count: stats.total },
    { label: "Pending", value: "pending", count: stats.pending },
    { label: "Approved", value: "approved", count: stats.approved },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total Reviews</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Approved</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.approved}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Avg Rating</p>
          <p className="text-2xl font-bold text-stone-900 mt-1">
            {stats.averageRating > 0 ? `${stats.averageRating} ★` : "—"}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((f) => {
          const isActive = currentFilter === f.value || (!currentFilter && !f.value);
          return (
            <Link
              key={f.label}
              href={f.value ? `${pathname}?filter=${f.value}` : pathname}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f.label} ({f.count})
            </Link>
          );
        })}
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <p className="text-stone-400 text-lg mb-1">No reviews yet</p>
          <p className="text-sm text-stone-400">Reviews will appear here as customers leave feedback.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} shopSlug={shopSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Review Card ─────────────────────────────────────────────

function ReviewCard({ review, shopSlug }: { review: Review; shopSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleApprove = () => {
    startTransition(async () => {
      await approveReviewAction(shopSlug, review.id);
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteReviewAction(shopSlug, review.id);
      setDismissed(true);
    });
  };

  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const starColor = review.rating >= 4 ? "text-amber-400" : review.rating >= 3 ? "text-amber-500" : "text-red-400";

  return (
    <div
      className={`rounded-xl border bg-white p-5 transition ${
        isPending ? "opacity-50" : ""
      } ${!review.isApproved ? "border-amber-200" : "border-stone-200"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-sm font-bold text-stone-600">
              {review.buyerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-medium text-stone-900">{review.buyerName}</span>
              {review.buyerEmail && (
                <span className="text-xs text-stone-400 ml-2">{review.buyerEmail}</span>
              )}
              <div className={`${starColor}`}>{stars}</div>
            </div>
          </div>

          {review.title && (
            <h4 className="text-sm font-semibold text-stone-800 mb-1">&ldquo;{review.title}&rdquo;</h4>
          )}
          {review.comment && (
            <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <time className="text-xs text-stone-400">
              {new Date(review.createdAt).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </time>
            {!review.isApproved && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Pending
              </span>
            )}
            {review.isApproved && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Approved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!review.isApproved && (
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              ✓ Approve
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
