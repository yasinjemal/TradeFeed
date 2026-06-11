import * as React from "react";
import { BadgeCheck, Star } from "lucide-react";

import { cn } from "@/lib/utils";

// ============================================================
// TfReviewsBlock — designed to feel substantial even with one
// review: aggregate up top, each review rendered as a full
// card with the comment as the hero, never a thin "5.0 (1)".
// ============================================================

export interface TfReview {
  id: string;
  rating: number;
  comment: string | null;
  buyerName: string | null;
  isVerified: boolean;
  createdAt: Date;
}

interface TfReviewsBlockProps {
  reviews: TfReview[];
  avgRating: number | null;
  reviewCount: number;
  shopName: string;
  className?: string;
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < Math.round(rating) ? "fill-tf-accent text-tf-accent" : "text-tf-stone-300",
          )}
        />
      ))}
    </span>
  );
}

export function TfReviewsBlock({
  reviews,
  avgRating,
  reviewCount,
  shopName,
  className,
}: TfReviewsBlockProps) {
  if (reviewCount === 0 || avgRating == null) {
    return (
      <section aria-label="Reviews" className={cn("rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm", className)}>
        <h2 className="font-tf-display text-lg font-semibold text-tf-ink">Reviews</h2>
        <div className="mt-3 flex items-center gap-1" aria-hidden="true">
          <Star className="size-5 fill-tf-accent text-tf-accent" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Star key={i} className="size-5 text-tf-stone-300" />
          ))}
          <span className="ml-2 text-xs font-medium text-tf-stone-500">
            This seat is reserved for the first buyer
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-tf-stone-600">
          No reviews yet — {shopName} is just getting started. Every review here comes
          from a confirmed TradeFeed order, so the first one will mean something.
        </p>
      </section>
    );
  }

  const single = reviews.length === 1;

  return (
    <section aria-label="Reviews" className={cn("rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-tf-display text-lg font-semibold text-tf-ink">Reviews</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-tf-display text-3xl font-semibold tabular-nums text-tf-ink">
              {avgRating.toFixed(1)}
            </span>
            <div>
              <Stars rating={avgRating} />
              <p className="text-xs tabular-nums text-tf-stone-500">
                {reviewCount} review{reviewCount === 1 ? "" : "s"} · from confirmed orders
              </p>
            </div>
          </div>
        </div>
      </div>

      <ul className={cn("mt-4 grid gap-3", !single && "sm:grid-cols-2")}>
        {reviews.map((r) => (
          <li
            key={r.id}
            className={cn(
              "rounded-lg border border-tf-stone-200 bg-tf-stone-50 p-4",
              single && "border-l-4 border-l-tf-primary",
            )}
          >
            {r.comment && (
              <blockquote
                className={cn(
                  "text-tf-ink",
                  single ? "text-base leading-relaxed" : "line-clamp-4 text-sm leading-relaxed",
                )}
              >
                “{r.comment}”
              </blockquote>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-tf-stone-600">
              <Stars rating={r.rating} className="[&_svg]:size-3.5" />
              <span className="font-medium">{r.buyerName ?? "TradeFeed buyer"}</span>
              {r.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-tf-verified-soft px-2 py-0.5 font-medium leading-none text-tf-deep">
                  <BadgeCheck aria-hidden="true" className="size-3" />
                  Verified purchase
                </span>
              )}
              <span className="text-tf-stone-400">
                {new Intl.DateTimeFormat("en-ZA", { month: "short", year: "numeric" }).format(r.createdAt)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-tf-stone-500">
        Bought from {shopName}? You&apos;ll get a review link on WhatsApp once your order
        is delivered — it takes 30 seconds and helps the next buyer.
      </p>
    </section>
  );
}
