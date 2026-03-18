// ============================================================
// Marketplace Product Card — Trust-driven design
// ============================================================
// Clean white card with clear hierarchy: Image → Price → Title
// → Seller (verified + location) → Rating → Social proof.
// Inspired by Amazon/Takealot product cards.
// ============================================================

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import type { MarketplaceProduct } from "@/lib/db/marketplace";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";
import { trackMarketplaceClickAction, trackPromotedClickAction } from "@/app/actions/marketplace";

interface MarketplaceProductCardProps {
  product: MarketplaceProduct;
  /** Compact mode for trending section (smaller card) */
  compact?: boolean;
}

const formatZAR = (cents: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);

export function MarketplaceProductCard({ product, compact = false }: MarketplaceProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    trackMarketplaceClickAction(product.shop.id, product.id);
    if (product.promotion) {
      trackPromotedClickAction(product.promotion.promotedListingId, product.shop.id, product.id);
    }
  };

  return (
    <Link
      href={`/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`}
      onClick={handleClick}
      aria-label={`${product.name} from ${product.shop.name}`}
      className="group block"
    >
      <motion.div
        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-colors duration-200 hover:border-blue-200"
        whileHover={{ y: -6, boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.15)" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Image */}
        <div className={`relative ${compact ? "aspect-square" : "aspect-[4/5]"} bg-slate-50 overflow-hidden`}>
          {product.imageUrl && !imgError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Top-left: Sponsored or Verified badge */}
          {product.promotion ? (
            <div className="absolute top-2 left-2">
              <SponsoredBadge tier={product.promotion.tier} />
            </div>
          ) : product.shop.isVerified ? (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-semibold shadow-sm">
                <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          ) : null}

          {/* Top-right: Seller tier */}
          {product.sellerTier && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[9px] font-bold text-slate-700 border border-slate-200 shadow-sm">
                {product.sellerTier.emoji} {product.sellerTier.label}
              </span>
            </div>
          )}

          {/* Bottom-right: Ranking badges */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end">
            {(product.avgRating ?? 0) >= 4.5 && product.reviewCount >= 3 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-bold shadow-sm">
                ⭐ Top Rated
              </span>
            )}
            {product.soldCount >= 10 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold shadow-sm">
                ⚡ Fast Seller
              </span>
            )}
          </div>
        </div>

        {/* Info — clear hierarchy */}
        <div className={`${compact ? "p-2.5" : "p-3.5 sm:p-4"}`}>
          {/* Price — most important, bold at top */}
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className={`font-bold text-slate-900 ${compact ? "text-sm" : "text-base sm:text-lg"}`}>
              {formatZAR(product.minPriceCents)}
            </span>
            {product.minPriceCents !== product.maxPriceCents && (
              <span className={`font-medium text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
                – {formatZAR(product.maxPriceCents)}
              </span>
            )}
          </div>

          {/* Product name */}
          <h3 className={`font-medium text-slate-700 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors ${compact ? "text-xs" : "text-[13px] sm:text-sm"}`}>
            {product.name}
          </h3>

          {/* Rating row */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex items-center gap-px">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (product.avgRating ?? 0) >= star;
                  const halfFilled = !filled && (product.avgRating ?? 0) >= star - 0.5;
                  return (
                    <svg
                      key={star}
                      className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} ${filled ? "text-amber-400" : halfFilled ? "text-amber-400/60" : "text-slate-200"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                    </svg>
                  );
                })}
              </div>
              <span className={`text-slate-600 font-semibold ${compact ? "text-[10px]" : "text-xs"}`}>
                {product.avgRating?.toFixed(1)}
              </span>
              <span className={`text-slate-400 ${compact ? "text-[10px]" : "text-xs"}`}>
                ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}

          {/* Seller info + location — trust row */}
          {!compact && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                {product.shop.logoUrl ? (
                  <Image
                    src={product.shop.logoUrl}
                    alt={product.shop.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-slate-200 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-blue-600">
                      {product.shop.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-slate-700 font-medium truncate">
                  {product.shop.name}
                </span>
                {product.shop.isVerified && (
                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
                {product.shop.subscription?.status === "ACTIVE" && product.shop.subscription.plan.slug !== "free" && (
                  <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 text-[8px] font-bold text-amber-700 uppercase tracking-wider flex-shrink-0">
                    PRO
                  </span>
                )}
              </div>
              {product.shop.city && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-[11px] text-slate-500">{product.shop.city}</span>
                </div>
              )}
            </div>
          )}

          {/* Social proof */}
          {product.soldCount > 0 && !compact && (
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-medium">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {product.soldCount >= 100 ? "100+" : product.soldCount} sold
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// ── Sponsored Badge ──────────────────────────────────────────

function SponsoredBadge({ tier }: { tier: "BOOST" | "FEATURED" | "SPOTLIGHT" }) {
  switch (tier) {
    case "SPOTLIGHT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-lg shadow-amber-500/30">
          ⭐ Spotlight
        </span>
      );
    case "FEATURED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold backdrop-blur-sm">
          Featured
        </span>
      );
    case "BOOST":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-600 text-[10px] font-medium backdrop-blur-sm border border-slate-200">
          Sponsored
        </span>
      );
  }
}
