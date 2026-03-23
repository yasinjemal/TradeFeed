"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { MarketplaceProduct } from "@/lib/db/marketplace";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";
import { cn } from "@/lib/utils";
import { trackMarketplaceClickAction, trackPromotedClickAction } from "@/app/actions/marketplace";

interface MarketplaceProductCardProps {
  product: MarketplaceProduct;
  compact?: boolean;
}

function formatZAR(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getPromotionLabelKey(tier: "BOOST" | "FEATURED" | "SPOTLIGHT") {
  switch (tier) {
    case "SPOTLIGHT":
      return "spotlight" as const;
    case "FEATURED":
      return "promoted" as const;
    case "BOOST":
      return "promoted" as const;
  }
}

export function MarketplaceProductCard({ product, compact = false }: MarketplaceProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const t = useTranslations("marketplace.card");
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
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/80",
          compact ? "rounded-xl" : ""
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          {product.imageUrl && !imageFailed ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes={compact ? "(max-width: 768px) 50vw, 220px" : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"}
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs font-medium">{t("imageSoon")}</span>
            </div>
          )}

          {/* Badges overlay — compact */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5">
            <div className="flex flex-wrap gap-1.5">
              {product.promotion ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  {t(getPromotionLabelKey(product.promotion.tier))}
                </span>
              ) : null}
              {product.shop.isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
                  <svg className="h-3 w-3 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {t("verified")}
                </span>
              ) : null}
            </div>
            {product.sellerTier ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                {product.sellerTier.emoji} {product.sellerTier.label}
              </span>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className={cn("flex flex-1 flex-col", compact ? "p-3" : "p-4")}>
          {/* Price — most prominent */}
          <div className="mb-1.5 flex items-baseline gap-2">
            <p className={cn("font-extrabold tracking-tight text-slate-900", compact ? "text-lg" : "text-xl")}>
              {formatZAR(product.minPriceCents)}
            </p>
            {product.minPriceCents !== product.maxPriceCents ? (
              <span className="text-xs font-medium text-slate-400">– {formatZAR(product.maxPriceCents)}</span>
            ) : null}
          </div>

          {/* Title — slightly smaller */}
          <h3 className={cn("line-clamp-2 leading-snug text-slate-700", compact ? "text-xs" : "text-sm")}>
            {product.name}
          </h3>

          {/* Seller row — inline with location + verified */}
          <div className={cn("mt-auto flex items-center gap-2 pt-3", compact ? "pt-2" : "")}>
            {product.shop.logoUrl ? (
              <Image
                src={product.shop.logoUrl}
                alt={product.shop.name}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                {product.shop.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-medium text-slate-600">{product.shop.name}</span>
                {product.shop.isVerified ? (
                  <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-0.5">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {locationLabel}
                </span>
                {product.reviewCount > 0 ? (
                  <span className="flex items-center gap-0.5">
                    <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {(product.avgRating ?? 0).toFixed(1)} ({product.reviewCount})
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* CTA — full-width product cards only */}
          {!compact ? (
            <div className="mt-3">
              <span className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-colors group-hover:bg-emerald-600">
                {t("viewProduct")}
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
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
