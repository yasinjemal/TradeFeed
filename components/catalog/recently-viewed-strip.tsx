// ============================================================
// Component — Recently Viewed Products Strip
// ============================================================
// Horizontal scrollable strip of recently viewed products.
// Shows on the catalog page below the product grid.
// ============================================================

"use client";

import Link from "next/link";
import { useRecentlyViewed } from "@/lib/recently-viewed/recently-viewed";
import { formatZAR } from "@/types";

interface RecentlyViewedStripProps {
  shopSlug: string;
  /** Exclude this product ID (e.g. on product detail, hide the current one) */
  excludeProductId?: string;
}

export function RecentlyViewedStrip({
  shopSlug,
  excludeProductId,
}: RecentlyViewedStripProps) {
  const { items } = useRecentlyViewed(shopSlug);

  // Filter out current product + limit to 8
  const displayed = items
    .filter((i) => i.productId !== excludeProductId)
    .slice(0, 8);

  if (displayed.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recently Viewed
        </h3>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {displayed.map((item) => (
          <Link
            key={item.productId}
            href={`/catalog/${shopSlug}/products/${item.productId}`}
            className="flex-shrink-0 w-28 sm:w-32 group"
          >
            <div className="bg-white rounded-xl border border-stone-200/50 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              {/* Image */}
              <div className="aspect-square bg-stone-100 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2">
                <p className="text-[11px] font-medium text-stone-700 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {item.productName}
                </p>
                <p className="text-[11px] font-bold text-stone-900 mt-0.5">
                  {formatZAR(item.priceInCents)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
