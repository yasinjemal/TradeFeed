"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { MarketplaceProduct } from "@/lib/db/marketplace";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";
import { cn } from "@/lib/utils";
import { TrustBadge } from "@/components/ui/trust-badge";
import { trackMarketplaceClickAction, trackPromotedClickAction } from "@/app/actions/marketplace";

interface MarketplaceProductCardProps {
  product: MarketplaceProduct;
  compact?: boolean;
}

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

function formatZAR(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getPromotionLabel(tier: "BOOST" | "FEATURED" | "SPOTLIGHT") {
  switch (tier) {
    case "SPOTLIGHT":
      return "Spotlight";
    case "FEATURED":
      return "Featured";
    case "BOOST":
      return "Promoted";
  }
}

function getActivityLabel(product: MarketplaceProduct) {
  if (product.soldCount >= 25) return `${product.soldCount}+ sold`;
  if (product.soldCount > 0) return `${product.soldCount} sold`;
  if (Date.now() - product.createdAt.getTime() < ONE_WEEK_IN_MS) return "New this week";
  return product.shop.isVerified ? "Verified store" : "Fresh listing";
}

export function MarketplaceProductCard({ product, compact = false }: MarketplaceProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const isNewListing = Date.now() - product.createdAt.getTime() < ONE_WEEK_IN_MS;
  const showTopSellerBadge = (product.avgRating ?? 0) >= 4.7 && product.reviewCount >= 5;
  const locationLabel = product.shop.city ?? product.shop.province ?? "South Africa";

  const handleClick = () => {
    trackMarketplaceClickAction(product.shop.id, product.id);
    if (product.promotion) {
      trackPromotedClickAction(product.promotion.promotedListingId, product.shop.id, product.id);
    }
  };

  return (
    <Link
      href={`/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`}
      aria-label={`${product.name} from ${product.shop.name}`}
      onClick={handleClick}
      className="block h-full"
    >
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60 transition-all duration-300 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/70",
          compact ? "rounded-2xl" : ""
        )}
      >
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {product.imageUrl && !imageFailed ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes={compact ? "(max-width: 768px) 50vw, 220px" : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"}
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs font-medium">Image coming soon</span>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <div className="flex flex-wrap gap-2">
              {product.promotion ? (
                <TrustBadge
                  variant="promoted"
                  small
                  label={getPromotionLabel(product.promotion.tier)}
                  className="bg-white/90 backdrop-blur"
                />
              ) : null}
              {product.shop.isVerified ? (
                <TrustBadge variant="verified" small className="bg-white/90 backdrop-blur" />
              ) : null}
            </div>

            {product.sellerTier ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-700 backdrop-blur">
                <span aria-hidden="true">{product.sellerTier.emoji}</span>
                <span>{product.sellerTier.label}</span>
              </span>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/65 via-slate-950/25 to-transparent px-3 pb-3 pt-8 text-white">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">From</p>
                <p className={cn("font-bold tracking-tight", compact ? "text-base" : "text-xl")}>{formatZAR(product.minPriceCents)}</p>
                {product.minPriceCents !== product.maxPriceCents ? (
                  <p className="text-xs text-white/80">Up to {formatZAR(product.maxPriceCents)}</p>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-1">
                {product.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
                    <svg className="h-3.5 w-3.5 text-amber-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {(product.avgRating ?? 0).toFixed(1)}
                  </span>
                ) : null}

                {isNewListing ? (
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">New</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("flex flex-1 flex-col", compact ? "p-3.5" : "p-4")}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className={cn("line-clamp-2 font-semibold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700", compact ? "text-sm" : "text-base")}>
              {product.name}
            </h3>

            {showTopSellerBadge && !compact ? <TrustBadge variant="top-seller" small className="shrink-0" /> : null}
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            {product.shop.logoUrl ? (
              <Image
                src={product.shop.logoUrl}
                alt={product.shop.name}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-700">
                {product.shop.name.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-medium text-slate-700">{product.shop.name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="truncate">{locationLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {product.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <svg className="h-3.5 w-3.5 text-amber-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{(product.avgRating ?? 0).toFixed(1)}</span>
                <span className="text-slate-400">·</span>
                <span>{product.reviewCount} reviews</span>
              </span>
            ) : (
              <TrustBadge variant="new-seller" small label="No reviews yet" />
            )}

            {!compact ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{getActivityLabel(product)}</span>
              </span>
            ) : null}
          </div>

          {!compact ? (
            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Trust signal</p>
                  <p className="mt-1 font-medium text-slate-700">
                    {product.shop.isVerified ? "Phone-verified seller on TradeFeed" : "Order directly with a real seller"}
                  </p>
                </div>
                <svg className="h-5 w-5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          ) : null}
        </div>
      </motion.article>
    </Link>
  );
}

export function MarketplaceProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
      <div className="aspect-square animate-pulse bg-slate-100" />
      <div className={cn("space-y-3", compact ? "p-3.5" : "p-4")}>
        <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="flex items-center gap-2 pt-1">
          <div className="h-7 w-7 animate-pulse rounded-full bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
          {!compact ? <div className="h-7 w-28 animate-pulse rounded-full bg-slate-100" /> : null}
        </div>
      </div>
    </div>
  );
}
