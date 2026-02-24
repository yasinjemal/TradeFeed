// ============================================================
// Featured Shop Card — Compact shop card for marketplace
// ============================================================

"use client";

import Link from "next/link";
import type { FeaturedShop } from "@/lib/db/marketplace";

interface FeaturedShopCardProps {
  shop: FeaturedShop;
}

export function FeaturedShopCard({ shop }: FeaturedShopCardProps) {
  return (
    <Link href={`/catalog/${shop.slug}`} className="group block shrink-0">
      <div className="w-[200px] sm:w-[220px] bg-stone-900 rounded-2xl border border-stone-800/50 p-4 transition-all duration-300 hover:border-stone-700 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5">
        <div className="flex items-center gap-3 mb-3">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-stone-700 group-hover:border-emerald-500/50 transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-stone-700 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
              <span className="text-sm font-bold text-emerald-400">
                {shop.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-stone-200 truncate group-hover:text-emerald-400 transition-colors">
              {shop.name}
            </h3>
            {shop.city && (
              <p className="text-[11px] text-stone-500 truncate">
                {shop.city}{shop.province ? `, ${shop.province}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            {shop.productCount} {shop.productCount === 1 ? "product" : "products"}
          </span>
          <div className="flex items-center gap-1.5">
            {shop.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 font-medium">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            {shop.hasSpotlight && (
              <span className="text-[10px] text-amber-400 font-medium">⭐</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
