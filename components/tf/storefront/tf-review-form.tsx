"use client";

import * as React from "react";
import { Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { TfButton } from "@/components/tf/button";
import { TfInput } from "@/components/tf/input";
import { submitReviewAction } from "@/app/actions/reviews";

// ============================================================
// TfReviewForm — "Write a review" toggle + inline form. Same
// server action and fields as the legacy form (buyerName,
// buyerEmail, title, comment, rating); reviews appear after
// seller approval.
// ============================================================

interface TfReviewFormProps {
  shopId: string;
  shopSlug: string;
  productId: string;
}

// TfInput styles itself; only the textarea needs matching classes.
const textareaCls =
  "w-full rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 py-2 text-[15px] text-tf-ink placeholder:text-tf-stone-400 outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25";

export function TfReviewForm({ shopId, shopSlug, productId }: TfReviewFormProps) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [hovered, setHovered] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{ success: boolean; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.set("rating", String(rating));
    const res = await submitReviewAction(shopId, productId, shopSlug, formData);
    setResult(res);
    setSubmitting(false);
  };

  if (result?.success) {
    return (
      <div className="rounded-xl border border-tf-verified/25 bg-tf-verified-soft p-5 text-center">
        <p className="text-sm font-semibold text-tf-verified">Thank you for your review!</p>
        <p className="mt-1 text-xs text-tf-stone-600">It will appear after seller approval.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <TfButton variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Write a review
      </TfButton>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-tf-display text-base font-semibold text-tf-ink">Write a review</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close review form"
          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-tf-stone-500 outline-none hover:bg-tf-stone-100 hover:text-tf-ink focus-visible:ring-2 focus-visible:ring-tf-primary"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Star picker */}
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-tf-ink">Your rating</legend>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              aria-pressed={rating === star}
              className="flex size-10 cursor-pointer items-center justify-center rounded outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              <Star
                aria-hidden="true"
                className={cn(
                  "size-6 transition-colors motion-reduce:transition-none",
                  star <= (hovered || rating)
                    ? "fill-tf-accent text-tf-accent"
                    : "text-tf-stone-300",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="tf-review-name" className="mb-1 block text-sm font-medium text-tf-ink">
          Your name
        </label>
        <TfInput id="tf-review-name" name="buyerName" required />
      </div>

      <div>
        <label htmlFor="tf-review-email" className="mb-1 block text-sm font-medium text-tf-ink">
          Email <span className="font-normal text-tf-stone-500">(optional)</span>
        </label>
        <TfInput id="tf-review-email" name="buyerEmail" type="email" />
      </div>

      <div>
        <label htmlFor="tf-review-title" className="mb-1 block text-sm font-medium text-tf-ink">
          Review title <span className="font-normal text-tf-stone-500">(optional)</span>
        </label>
        <TfInput id="tf-review-title" name="title" maxLength={200} />
      </div>

      <div>
        <label htmlFor="tf-review-comment" className="mb-1 block text-sm font-medium text-tf-ink">
          Your review <span className="font-normal text-tf-stone-500">(optional)</span>
        </label>
        <textarea
          id="tf-review-comment"
          name="comment"
          rows={3}
          maxLength={2000}
          className={textareaCls}
        />
      </div>

      {result?.error && (
        <p role="alert" className="text-sm text-tf-error">
          {result.error}
        </p>
      )}

      <TfButton type="submit" disabled={submitting} fullWidth>
        {submitting ? "Submitting…" : "Submit review"}
      </TfButton>
    </form>
  );
}
