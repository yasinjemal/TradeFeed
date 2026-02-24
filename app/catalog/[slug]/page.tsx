// ============================================================
// Page — Public Catalog Product Grid (/catalog/[slug])
// ============================================================
// The main storefront page. Buyers land here from a WhatsApp link.
//
// DESIGN: Mobile-first with:
// - Collapsible shop profile (map, hours, socials, trust bar)
// - Search bar + category filter + sort
// - Product card grid (filtered client-side)
//
// PERFORMANCE: Server-fetches data, then hands off to client
// components for interactive search/filter without round-trips.
// ============================================================

import {
  getCatalogProducts,
  getCatalogShop,
} from "@/lib/db/catalog";
import { trackEvent } from "@/lib/db/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShopProfile } from "@/components/catalog/shop-profile";
import { CatalogSearchFilter } from "@/components/catalog/catalog-search-filter";
import { RecentlyViewedStrip } from "@/components/catalog/recently-viewed-strip";

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const products = await getCatalogProducts(shop.id);

  // ── Track page view (fire-and-forget — don't block render) ──
  void trackEvent({ type: "PAGE_VIEW", shopId: shop.id });

  // ── Empty State ────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="space-y-5">
        {/* Still show shop profile even if no products */}
        <ShopProfile shop={shop} />

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-stone-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Coming Soon
          </h2>
          <p className="text-stone-500 text-sm text-center max-w-xs">
            {shop.name} is setting up their catalog. Check back soon for fresh
            stock!
          </p>
          <a
            href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Ask on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  // ── Extract unique categories ──────────────────────────
  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category !== null)
        .map((p) => [p.category!.id, p.category!])
    ).values()
  );

  return (
    <div className="space-y-5">
      {/* ── Shop Profile (collapsible trust section) ───── */}
      <ShopProfile shop={shop} />

      {/* ── Search, Filter & Product Grid ─────────────── */}
      <CatalogSearchFilter
        products={products}
        shopSlug={slug}
        shopId={shop.id}
        categories={categories}
      />

      {/* ── Recently Viewed ──────────────────────────────── */}
      <RecentlyViewedStrip shopSlug={slug} />

      {/* ── Marketplace Cross-Link ────────────────────── */}
      <div className="bg-gradient-to-r from-stone-50 to-emerald-50/30 rounded-2xl border border-stone-200/50 p-6 text-center">
        <p className="text-stone-500 text-sm mb-1">
          Want to see products from other sellers?
        </p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors group"
        >
          Browse more on TradeFeed Marketplace
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

