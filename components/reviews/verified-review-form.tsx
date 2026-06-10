// ============================================================
// Component — Verified Review Form
// ============================================================
// Star rating + optional title/comment for a product from the
// buyer's delivered order. Submits via the tokenized action.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitVerifiedReviewAction } from "@/app/actions/verified-review";

interface VerifiedReviewFormProps {
  token: string;
  defaultBuyerName: string;
  shopSlug: string;
  items: { productId: string; productName: string }[];
}

export function VerifiedReviewForm({
  token,
  defaultBuyerName,
  shopSlug,
  items,
}: VerifiedReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState(items[0]?.productId ?? "");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [buyerName, setBuyerName] = useState(defaultBuyerName);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-extrabold tracking-tight mb-2">Review submitted!</h2>
        <p className="text-stone-400 text-sm">Thanks for helping other buyers shop with confidence.</p>
        <Link
          href={`/catalog/${shopSlug}`}
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          Back to the shop
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    startTransition(async () => {
      const res = await submitVerifiedReviewAction(token, {
        productId,
        rating,
        title,
        comment,
        buyerName,
      });
      if (res.success) setDone(true);
      else setError(res.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Product picker (only when multiple products) */}
      {items.length > 1 && (
        <div>
          <label className="block text-xs font-semibold text-stone-400 mb-1.5">
            Which product are you reviewing?
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3 py-2.5 text-sm text-white"
          >
            {items.map((item) => (
              <option key={item.productId} value={item.productId}>
                {item.productName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Star rating */}
      <div>
        <label className="block text-xs font-semibold text-stone-400 mb-1.5">Your rating *</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              className="text-3xl transition-transform active:scale-110"
            >
              <span className={star <= (hovered || rating) ? "text-amber-400" : "text-stone-700"}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-400 mb-1.5">Your name *</label>
        <input
          type="text"
          required
          maxLength={100}
          value={buyerName}
          onChange={(e) => setBuyerName(e.target.value)}
          placeholder="Shown with your review"
          className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3 py-2.5 text-sm text-white placeholder:text-stone-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-400 mb-1.5">Title</label>
        <input
          type="text"
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Great quality, fast delivery"
          className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3 py-2.5 text-sm text-white placeholder:text-stone-600"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-400 mb-1.5">Your review</label>
        <textarea
          rows={4}
          maxLength={2000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you like? How was the seller?"
          className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3 py-2.5 text-sm text-white placeholder:text-stone-600 resize-none"
        />
      </div>

      {error && <p className="text-xs font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit verified review"}
      </button>
    </form>
  );
}
