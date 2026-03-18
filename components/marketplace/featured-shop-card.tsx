// ============================================================
// Featured Shop Card — Compact shop card for marketplace
// ============================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";
import type { FeaturedShop } from "@/lib/db/marketplace";

interface FeaturedShopCardProps {
  shop: FeaturedShop;
}

export function FeaturedShopCard({ shop }: FeaturedShopCardProps) {
  return (
    <Link href={`/catalog/${shop.slug}`} className="group block shrink-0">
      <div className="w-[200px] sm:w-[240px] bg-white rounded-2xl border border-slate-200 p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-0.5">
        <div className="flex items-center gap-3 mb-3">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={40}
              height={40}
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-300 transition-colors"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition-colors">
              <span className="text-sm font-bold text-blue-600">
                {shop.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
              {shop.name}
            </h3>
            {shop.city && (
              <p className="text-[11px] text-slate-500 truncate">
                {shop.city}{shop.province ? `, ${shop.province}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {shop.productCount} {shop.productCount === 1 ? "product" : "products"}
          </span>
          <div className="flex items-center gap-1.5">
            {shop.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            {shop.hasSpotlight && (
              <span className="text-[10px] text-amber-500 font-medium">⭐</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
