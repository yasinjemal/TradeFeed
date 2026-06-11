import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatZAR } from "./format";
import { TfRatingChip } from "./rating-chip";

// ============================================================
// TfProductCard — photo-first, square aspect, lazy image,
// price in tabular figures, seller identity row with verified
// tick, optional rating + location. Trust at the card level.
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

  return (
    <article
      data-slot="tf-product-card"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm",
        "transition-shadow motion-reduce:transition-none hover:shadow-tf-md",
        "focus-within:ring-2 focus-within:ring-tf-primary focus-within:ring-offset-2 focus-within:ring-offset-tf-surface",
        className,
      )}
      {...props}
    >
      <div className="relative aspect-square w-full bg-tf-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={priority ? "eager" : "lazy"}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-tf-stone-400">
            <ImageOff aria-hidden="true" className="size-7" />
          </div>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-full bg-tf-accent-soft px-2.5 py-1 text-xs font-medium leading-none text-tf-accent-ink">
            Sale
          </span>
        )}
        {promoted && (
          <span className="absolute right-2 top-2 rounded-full bg-tf-stone-100/95 px-2 py-0.5 text-[10px] font-medium leading-none text-tf-stone-600">
            Promoted
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm text-tf-ink">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">
            {title}
          </Link>
        </h3>

        <p className="flex items-baseline gap-1.5 tabular-nums">
          <span className="text-base font-semibold text-tf-ink">{formatZAR(price)}</span>
          {onSale && (
            <s className="text-xs text-tf-stone-400">{formatZAR(compareAtPrice)}</s>
          )}
        </p>

        {sellerName && (
          <p className="flex min-w-0 items-center gap-1 text-xs text-tf-stone-600">
            <span className="truncate">{sellerName}</span>
            {sellerVerified && (
              <>
                <BadgeCheck aria-hidden="true" className="size-3.5 shrink-0 text-tf-verified" />
                <span className="sr-only">Verified seller</span>
              </>
            )}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {rating != null ? (
            <TfRatingChip rating={rating} count={ratingCount} bare />
          ) : (
            <span />
          )}
          {location && (
            <span className="truncate rounded-full bg-tf-stone-100 px-2 py-0.5 text-[11px] text-tf-stone-600">
              {location}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export { TfProductCard };
