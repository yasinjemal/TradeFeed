import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatZAR } from "./format";
import { TfRatingChip } from "./rating-chip";

// ============================================================
// TfProductCard — portrait 4:5 ratio, image zooms on hover,
// card lifts on hover. Trust visible at glance: verified tick
// in image corner, price bold and dominant, seller as muted
// metadata. Discount percentage on sale items.
// ============================================================

export interface TfProductCardProps extends React.ComponentProps<"article"> {
  href: string;
  title: string;
  /** Price in Rand */
  price: number;
  /** Original price when on sale */
  compareAtPrice?: number;
  imageUrl?: string | null;
  imageAlt?: string;
  sellerName?: string;
  sellerVerified?: boolean;
  rating?: number;
  ratingCount?: number;
  location?: string;
  /** Set on above-the-fold cards to skip lazy loading */
  priority?: boolean;
  /** Honest labelling for paid placements */
  promoted?: boolean;
}

function TfProductCard({
  href,
  title,
  price,
  compareAtPrice,
  imageUrl,
  imageAlt,
  sellerName,
  sellerVerified = false,
  rating,
  ratingCount,
  location,
  priority = false,
  promoted = false,
  className,
  ...props
}: TfProductCardProps) {
  const onSale = compareAtPrice != null && compareAtPrice > price;
  const discountPct = onSale
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <article
      data-slot="tf-product-card"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-tf-raised",
        "border border-tf-stone-200 shadow-tf-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-tf-md hover:border-tf-stone-300",
        "focus-within:ring-2 focus-within:ring-tf-primary focus-within:ring-offset-2 focus-within:ring-offset-tf-surface",
        className,
      )}
      {...props}
    >
      {/* ── Image — portrait 4:5 for editorial depth ──────── */}
      <div className="relative aspect-[4/5] overflow-hidden bg-tf-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-tf-stone-300">
            <ImageOff aria-hidden="true" className="size-8" />
          </div>
        )}

        {/* Top-left: sale + promoted badges */}
        {(onSale || promoted) && (
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {onSale && (
              <span className="rounded-full bg-tf-accent px-2 py-0.5 text-[11px] font-bold leading-none text-tf-ink shadow-sm">
                -{discountPct}%
              </span>
            )}
            {promoted && (
              <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium leading-none text-white">
                Ad
              </span>
            )}
          </div>
        )}

        {/* Top-right: verified seller badge */}
        {sellerVerified && (
          <span
            aria-label="Verified seller"
            className="absolute right-2.5 top-2.5 flex size-[22px] items-center justify-center rounded-full bg-white shadow-sm"
          >
            <BadgeCheck aria-hidden="true" className="size-3.5 text-tf-verified" />
          </span>
        )}
      </div>

      {/* ── Card body ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-tf-ink">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:content-['']"
          >
            {title}
          </Link>
        </h3>

        <div className="flex items-baseline gap-1.5 tabular-nums">
          <span className="font-tf-display text-[15px] font-bold text-tf-ink">
            {formatZAR(price)}
          </span>
          {onSale && (
            <s className="text-[11px] text-tf-stone-400">{formatZAR(compareAtPrice)}</s>
          )}
        </div>

        {/* Meta row: seller name + rating or location */}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-0.5">
          {sellerName && (
            <p className="min-w-0 truncate text-[11px] text-tf-stone-400">{sellerName}</p>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {rating != null ? (
              <TfRatingChip rating={rating} count={ratingCount} bare />
            ) : location ? (
              <span className="shrink-0 rounded-full bg-tf-stone-100 px-1.5 py-0.5 text-[10px] text-tf-stone-500">
                {location}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export { TfProductCard };
