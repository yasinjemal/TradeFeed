// ============================================================
// Featured Shop Card — Trust-driven seller card
// ============================================================

"use client";

import { motion } from "framer-motion";
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
      <motion.div
        className="w-[260px] sm:w-[300px] bg-white rounded-2xl border border-slate-200 p-5 transition-colors duration-200 hover:border-blue-300"
        whileHover={{ y: -4, boxShadow: "0 20px 40px -12px rgba(59, 130, 246, 0.12)" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header: Logo + Name + Verified */}
        <div className="flex items-center gap-3 mb-3">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={48}
              height={48}
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 group-hover:border-blue-300 transition-colors"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition-colors">
              <span className="text-lg font-bold text-blue-600">
                {shop.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {shop.name}
              </h3>
              {shop.isVerified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {shop.city && (
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {shop.city}{shop.province ? `, ${shop.province}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Stats row: Rating + Products + Featured badge */}
        <div className="flex items-center gap-2 mb-3">
          {/* Rating */}
          {shop.reviewCount > 0 && shop.avgRating != null ? (
            <span className="inline-flex items-center gap-1 text-xs">
              <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-slate-700">{shop.avgRating.toFixed(1)}</span>
              <span className="text-slate-400">({shop.reviewCount})</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">New seller</span>
          )}
          <span className="text-slate-200">|</span>
          <span className="text-[11px] text-slate-500">
            {shop.productCount} {shop.productCount === 1 ? "product" : "products"}
          </span>
          {shop.hasSpotlight && (
            <>
              <span className="text-slate-200">|</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                ⭐ Featured
              </span>
            </>
          )}
        </div>

        {/* Visit Shop CTA */}
        <div className="px-3 py-2.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-center transition-colors">
          <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
            Visit Shop &rarr;
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
