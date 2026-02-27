// ============================================================
// Marketplace Product Card
// ============================================================
// Product card for marketplace grid. Dark theme, shows shop name,
// location, price range, "Sponsored" badge for promoted items.
// ============================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import type { MarketplaceProduct } from "@/lib/db/marketplace";
import { SHIMMER_DARK } from "@/lib/image-placeholder";
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
      href={`/catalog/${product.shop.slug}/products/${product.id}`}
      onClick={handleClick}
      className="group block"
    >
      <div className="bg-stone-900 rounded-2xl border border-stone-800/50 overflow-hidden transition-all duration-300 hover:border-stone-700 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 active:scale-[0.98]">
        {/* Image */}
        <div className={`relative ${compact ? "aspect-square" : "aspect-[3/4]"} bg-stone-800 overflow-hidden`}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={SHIMMER_DARK}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-600">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs">No image</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-900/80 to-transparent pointer-events-none" />

          {/* Sponsored badge */}
          {product.promotion && (
            <div className="absolute top-2 left-2">
              <SponsoredBadge tier={product.promotion.tier} />
            </div>
          )}

          {/* Verified badge */}
          {product.shop.isVerified && !product.promotion && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/90 text-white text-[10px] font-semibold backdrop-blur-sm">
                <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          )}

          {/* Price badge */}
          <div className="absolute bottom-2 left-2">
            <span className="bg-stone-950/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              {formatZAR(product.minPriceCents)}
              {product.minPriceCents !== product.maxPriceCents && (
                <span className="text-stone-400 font-normal"> +</span>
              )}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className={`${compact ? "p-2.5" : "p-3 sm:p-3.5"} space-y-1`}>
          {/* Category tag */}
          {product.globalCategory && !compact && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500">
              {product.globalCategory.name}
            </span>
          )}

          {/* Product name */}
          <h3 className={`font-semibold text-stone-200 leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors ${compact ? "text-xs" : "text-[13px] sm:text-sm"}`}>
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
                      className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"} ${filled ? "text-amber-400" : halfFilled ? "text-amber-400/60" : "text-stone-700"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                    </svg>
                  );
                })}
              </div>
              <span className={`text-stone-500 font-medium ${compact ? "text-[9px]" : "text-[10px]"}`}>
                {product.avgRating?.toFixed(1)}
              </span>
              <span className={`text-stone-600 ${compact ? "text-[9px]" : "text-[10px]"}`}>
                ({product.reviewCount})
              </span>
            </div>
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
                  className="w-4 h-4 rounded-full object-cover border border-stone-700"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-stone-500">
                    {product.shop.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-[11px] text-stone-500 truncate">
                {product.shop.name}
              </span>
              {product.shop.subscription?.status === "ACTIVE" && product.shop.subscription.plan.slug !== "free" && (
                <span className="inline-flex items-center px-1 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-[8px] font-bold text-amber-400 uppercase tracking-wider flex-shrink-0">
                  PRO
                </span>
              )}
              {product.sellerTier && (
                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-stone-800 border border-stone-700/50 text-[8px] font-semibold text-stone-300 flex-shrink-0">
                  {product.sellerTier.emoji} {product.sellerTier.label}
                </span>
              )}
              {product.shop.city && (
                <>
                  <span className="text-stone-700">·</span>
                  <span className="text-[11px] text-stone-600 truncate">
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-700/90 text-stone-300 text-[10px] font-medium backdrop-blur-sm">
          Sponsored
        </span>
      );
  }
}
