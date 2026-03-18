// ============================================================
// Marketplace Product Card
// ============================================================
// Product card for marketplace grid. Dark theme, shows shop name,
// location, price range, "Sponsored" badge for promoted items.
// ============================================================

"use client";

import { useState } from "react";
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
    // Track marketplace click
    trackMarketplaceClickAction(product.shop.id, product.id);
    // Track promoted click if sponsored
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
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40 hover:-translate-y-1 active:scale-[0.98]">
        {/* Image */}
        <div className={`relative ${compact ? "aspect-square" : "aspect-[3/4]"} bg-slate-100 overflow-hidden`}>
          {product.imageUrl && !imgError ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Sponsored badge */}
          {product.promotion && (
            <div className="absolute top-2 left-2">
              <SponsoredBadge tier={product.promotion.tier} />
            </div>
          )}

          {/* Verified badge */}
          {product.shop.isVerified && !product.promotion && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-semibold shadow-sm">
                <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          )}

          {/* Seller tier badge */}
          {product.sellerTier && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[9px] font-bold text-slate-700 border border-slate-200 shadow-sm">
                {product.sellerTier.emoji} {product.sellerTier.label}
              </span>
            </div>
          )}

          {/* Price badge */}
          <div className="absolute bottom-2 left-2">
            <span className="bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md border border-slate-200/50">
              {formatZAR(product.minPriceCents)}
              {product.minPriceCents !== product.maxPriceCents && (
                <span className="text-slate-400 font-normal"> +</span>
              )}
            </span>
          </div>

          {/* Ranking badges */}
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

        {/* Info */}
        <div className={`${compact ? "p-2.5" : "p-3.5 sm:p-4"} space-y-1.5`}>
          {/* Category tag */}
          {product.globalCategory && !compact && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600">
              {product.globalCategory.name}
            </span>
          )}

          {/* Product name */}
          <h3 className={`font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors ${compact ? "text-xs" : "text-[13px] sm:text-sm"}`}>
            {product.name}
          </h3>

          {/* Star rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-px">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (product.avgRating ?? 0) >= star;
                  const halfFilled = !filled && (product.avgRating ?? 0) >= star - 0.5;
                  return (
                    <svg
                      key={star}
                      className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"} ${filled ? "text-amber-400" : halfFilled ? "text-amber-400/60" : "text-slate-200"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                    </svg>
                  );
                })}
              </div>
              <span className={`text-slate-600 font-medium ${compact ? "text-[9px]" : "text-[10px]"}`}>
                {product.avgRating?.toFixed(1)}
              </span>
              <span className={`text-slate-400 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Sold count badge */}
          {product.soldCount > 0 && (
            <span className={`inline-flex items-center gap-0.5 text-green-600 font-medium ${compact ? "text-[9px]" : "text-[10px]"}`}>
              <svg className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {product.soldCount >= 100 ? "100+" : product.soldCount} sold
            </span>
          )}

          {/* Shop info */}
          {!compact && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {product.shop.logoUrl ? (
                <Image
                  src={product.shop.logoUrl}
                  alt={product.shop.name}
                  width={16}
                  height={16}
                  className="w-4 h-4 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-500">
                    {product.shop.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-[11px] text-slate-500 truncate">
                {product.shop.name}
              </span>
              {product.shop.subscription?.status === "ACTIVE" && product.shop.subscription.plan.slug !== "free" && (
                <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 text-[8px] font-bold text-amber-700 uppercase tracking-wider flex-shrink-0">
                  PRO
                </span>
              )}
              {product.shop.city && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-400 truncate">
                    {product.shop.city}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
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
