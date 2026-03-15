// ============================================================
// Component — Trending Products Widget (Dashboard)
// ============================================================
// Server component — fetches trending products and renders
// a ranked list with momentum indicators. Matches the
// existing dashboard card styling.
// ============================================================

import Link from "next/link";
import { getTrendingProducts } from "@/lib/db/trending";
import type { TrendingProduct } from "@/lib/intelligence/trending";

interface TrendingProductsWidgetProps {
  shopId: string;
  shopSlug: string;
}

export async function TrendingProductsWidget({ shopId, shopSlug }: TrendingProductsWidgetProps) {
  const trending = await getTrendingProducts(shopId, 5);

  if (trending.length === 0) return null; // Don't render if no order data

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <h2 className="font-semibold text-stone-900">Trending Products</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
            Last 30 days
          </span>
        </div>
        <Link
          href={`/dashboard/${shopSlug}/analytics`}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          Analytics →
        </Link>
      </div>

      <div className="divide-y divide-stone-100">
        {trending.map((item, index) => (
          <TrendingRow key={item.productId} item={item} rank={index + 1} shopSlug={shopSlug} />
        ))}
      </div>
    </div>
  );
}

function TrendingRow({
  item,
  rank,
  shopSlug,
}: {
  item: TrendingProduct;
  rank: number;
  shopSlug: string;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <Link
      href={`/dashboard/${shopSlug}/products/${item.productId}`}
      className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50 transition-colors group"
    >
      {/* Rank */}
      <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center flex-shrink-0 text-sm font-bold text-stone-400 group-hover:bg-stone-100 transition-colors">
        {medal ?? rank}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-900 truncate group-hover:text-emerald-700 transition-colors">
          {item.productName}
        </p>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {item.orderCount} order{item.orderCount !== 1 ? "s" : ""} · R{Math.round(item.totalRevenueCents / 100).toLocaleString()} revenue
        </p>
      </div>

      {/* Momentum bar */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-16 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400 transition-all"
            style={{ width: `${Math.min(item.momentum, 100)}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-stone-500 w-8 text-right">
          {item.momentum}%
        </span>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}
