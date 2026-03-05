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
  getCatalogCombos,
} from "@/lib/db/catalog";
import { getSellerTierData } from "@/lib/db/shops";
import { getShopDrops } from "@/lib/db/drops";
import { trackEvent } from "@/lib/db/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShopProfile } from "@/components/catalog/shop-profile";
import { IllustrationRocket } from "@/components/ui/illustrations";

// ISR: revalidate catalog pages every 60 seconds for near-real-time updates
export const revalidate = 60;
import { CatalogSearchFilter } from "@/components/catalog/catalog-search-filter";
import { ComboSection } from "@/components/catalog/combo-section";
import { RecentlyViewedStrip } from "@/components/catalog/recently-viewed-strip";

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const [products, combos, tierData, recentDrops] = await Promise.all([
    getCatalogProducts(shop.id),
    getCatalogCombos(shop.id),
    getSellerTierData(shop.id, shop),
    getShopDrops(slug, 1),
  ]);

  // ── Track page view (fire-and-forget — don't block render) ──
  void trackEvent({ type: "PAGE_VIEW", shopId: shop.id });

  // ── Empty State ────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="space-y-5">
        {/* Still show shop profile even if no products */}
        <ShopProfile shop={shop} tierBadge={tierData.tier} />

        <div className="flex flex-col items-center justify-center py-16 px-4">
          <IllustrationRocket className="w-40 h-40 mb-4" />
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

  // ── Fallback products for new visitors (when recently-viewed is empty)
  const fallbackProducts = products.slice(0, 8).map((p) => ({
    productId: p.id,
    productName: p.name,
    imageUrl: p.images[0]?.url ?? null,
    priceInCents:
      p.variants.length > 0
        ? Math.min(...p.variants.map((v) => v.priceInCents))
        : 0,
  }));

  return (
    <div className="space-y-5">
      {/* ── Search, Filter & Product Grid (PRODUCTS FIRST) ── */}
      <CatalogSearchFilter
        products={products}
        shopSlug={slug}
        shopId={shop.id}
        categories={categories}
      />

      {/* ── Latest Stock Drop Banner ──────────────────── */}
      {recentDrops.length > 0 && recentDrops[0] && (
        <Link
          href={`/catalog/${slug}/drops/${recentDrops[0].id}`}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-4 py-3.5 shadow-md shadow-orange-200/40 transition-all hover:shadow-lg hover:shadow-orange-200/50 hover:scale-[1.01] active:scale-[0.99] group"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-lg">🔥</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Latest Drop</p>
            <p className="text-sm font-bold text-white truncate">{recentDrops[0].title}</p>
            <p className="text-[11px] text-white/70">{recentDrops[0]._count.items} product{recentDrops[0]._count.items !== 1 ? "s" : ""}</p>
          </div>
          <svg className="w-5 h-5 text-white/70 flex-shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}

      {/* ── Combo Deals ─────────────────────────────── */}
      <ComboSection combos={combos} shopSlug={slug} />

      {/* ── Shop Profile (collapsible trust section) ───── */}
      <ShopProfile shop={shop} tierBadge={tierData.tier} />

      {/* ── Recently Viewed / Popular from Seller ────────── */}
      <RecentlyViewedStrip shopSlug={slug} fallbackProducts={fallbackProducts} />

      {/* ── Start Your Own Shop — Premium Viral CTA ──────── */}
      <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 animate-gradient-shift p-[1px]">
        <div className="relative overflow-hidden rounded-[19px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 sm:py-10">
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-6 -bottom-10 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />
          <div className="pointer-events-none absolute right-12 bottom-4 h-20 w-20 rounded-full bg-emerald-300/15 blur-xl animate-float-slow" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 21 9.349m-18 0V6.999c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125V9.35" />
              </svg>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl">
                Start Your Own Shop
              </h3>
              <p className="text-sm text-emerald-100/90 max-w-[280px] mx-auto leading-relaxed">
                Join thousands of sellers. Set up in minutes, sell on WhatsApp.
              </p>
            </div>

            {/* Steps */}
            <div className="stagger-children flex flex-col gap-3 w-full max-w-[260px]">
              {[
                { num: "1", text: "Upload your products", icon: "📸" },
                { num: "2", text: "Share your catalog link", icon: "🔗" },
                { num: "3", text: "Get orders on WhatsApp", icon: "💰" },
              ].map((step) => (
                <div key={step.num} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2.5 ring-1 ring-white/10">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
                    {step.icon}
                  </span>
                  <span className="text-sm font-medium text-white/95">{step.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href="/create-shop"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-xl shadow-emerald-900/20 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/30 hover:scale-[1.03] active:scale-[0.98]"
            >
              Create your free shop
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <p className="text-[11px] text-emerald-200/70 font-medium">Free forever · No credit card needed</p>
          </div>
        </div>
      </div>

      {/* ── AI Feature — Sleek Showcase ───────────────────── */}
      <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 animate-gradient-shift p-[1px]">
        <div className="relative overflow-hidden rounded-[19px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-8 sm:py-10">
          {/* Background decoration */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-36 w-36 rounded-full bg-violet-300/15 blur-2xl" />
          <div className="pointer-events-none absolute left-1/2 top-1/4 h-24 w-24 rounded-full bg-purple-300/10 blur-xl animate-float-slow" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            {/* Icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl">
                AI-Powered Selling
              </h3>
              <p className="text-sm text-purple-100/90 max-w-[280px] mx-auto leading-relaxed">
                Snap a photo. AI does the rest. List products 10× faster.
              </p>
            </div>

            {/* Feature pills */}
            <div className="stagger-children flex flex-col gap-3 w-full max-w-[280px]">
              {[
                { icon: "📸", text: "Upload a photo", desc: "Just point & shoot" },
                { icon: "✨", text: "AI writes everything", desc: "Title, description, SEO" },
                { icon: "🏷️", text: "Auto-categorize & price", desc: "Smart suggestions" },
              ].map((feat) => (
                <div key={feat.text} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 ring-1 ring-white/10">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg">
                    {feat.icon}
                  </span>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-white">{feat.text}</p>
                    <p className="text-[11px] text-purple-200/80">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href="/create-shop"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-purple-700 shadow-xl shadow-purple-900/20 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30 hover:scale-[1.03] active:scale-[0.98]"
            >
              Try it free
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <p className="text-[11px] text-purple-200/70 font-medium">5 free AI credits included</p>
          </div>
        </div>
      </div>

      {/* ── Marketplace Browse ─────────────────────────────── */}
      <div className="flex justify-center py-1">
        <Link
          href="/marketplace"
          className="group inline-flex items-center gap-2 rounded-full bg-stone-50 px-5 py-2.5 text-sm font-semibold text-stone-500 ring-1 ring-stone-200/60 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200 hover:shadow-md hover:shadow-emerald-100/50"
        >
          <svg className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.125 7.125 0 1 0 6.575 6.575a7.125 7.125 0 0 0 10.075 10.075Z" />
          </svg>
          Browse TradeFeed Marketplace
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

