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
  getShopReviewHighlights,
} from "@/lib/db/catalog";
import { getSellerTierData } from "@/lib/db/shops";
import { getShopDrops } from "@/lib/db/drops";
import { trackEvent } from "@/lib/db/analytics";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShopHero } from "@/components/catalog/shop-hero";
import { ShopAboutSection } from "@/components/catalog/shop-about-section";
import { ShopReviewHighlights } from "@/components/catalog/shop-review-highlights";
import { IllustrationRocket } from "@/components/ui/illustrations";

// ISR: revalidate catalog pages every 60 seconds for near-real-time updates
export const revalidate = 60;
import type { Metadata } from "next";
import { CatalogSearchFilter } from "@/components/catalog/catalog-search-filter";
import { ComboSection } from "@/components/catalog/combo-section";
import { RecentlyViewedStrip } from "@/components/catalog/recently-viewed-strip";
import { CatalogCacheManager } from "@/components/catalog/catalog-cache-manager";

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return { title: "Shop Not Found — TradeFeed" };

  const location = [shop.city, shop.province].filter(Boolean).join(", ");
  const locationTag = location ? ` in ${location}` : " South Africa";
  const productCount = shop._count?.products ?? 0;
  const productLabel = productCount === 1 ? "1 product" : `${productCount}+ products`;

  const title = `${shop.name}${locationTag} — ${productLabel} | TradeFeed Marketplace`;
  const description = shop.description
    ? `${shop.description.slice(0, 130)}. Browse ${productLabel} and order via WhatsApp on TradeFeed.`
    : `Shop ${shop.name}${locationTag}. Browse ${productLabel}, order directly on WhatsApp. Free online marketplace South Africa.`;

  const images = shop.bannerUrl
    ? [{ url: shop.bannerUrl, width: 1200, height: 630, alt: shop.name }]
    : shop.logoUrl
      ? [{ url: shop.logoUrl, width: 512, height: 512, alt: shop.name }]
      : [];

  return {
    title,
    description,
    keywords: [
      shop.name.toLowerCase(),
      `${shop.name.toLowerCase()} shop`,
      ...(shop.city ? [`buy online ${shop.city.toLowerCase()}`, `${shop.city.toLowerCase()} shops`] : []),
      "buy online South Africa",
      "WhatsApp shop",
      "online marketplace South Africa",
      "TradeFeed",
    ],
    openGraph: {
      title,
      description,
      url: `${APP_URL}/catalog/${shop.slug}`,
      siteName: "TradeFeed",
      type: "website",
      ...(images.length > 0 && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${shop.name} — ${productLabel} | TradeFeed`,
      description,
      ...(images.length > 0 && { images: [images[0]!.url] }),
    },
    alternates: {
      canonical: `${APP_URL}/catalog/${shop.slug}`,
    },
  };
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const [products, combos, tierData, recentDrops, reviewHighlights] = await Promise.all([
    getCatalogProducts(shop.id),
    getCatalogCombos(shop.id),
    getSellerTierData(shop.id, shop),
    getShopDrops(slug, 1),
    getShopReviewHighlights(shop.id),
  ]);

  // ── Detect viewer type (fire in parallel, lightweight) ──────
  // Possible states:
  //   isOwner       — viewing their own shop → show management CTAs
  //   isExistingSeller — has a shop elsewhere → hide recruitment CTAs
  //   (neither)     — new/anonymous visitor → show recruitment CTAs
  const { userId: clerkId } = await auth();
  let isOwner = false;
  let isExistingSeller = false;
  let ownerDashboardSlug: string | null = null;

  if (clerkId) {
    const viewer = await db.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        shops: {
          select: {
            role: true,
            shop: { select: { id: true, slug: true, isActive: true } },
          },
        },
      },
    });

    if (viewer) {
      const ownedShops = viewer.shops.filter((s) => s.shop.isActive);
      const thisShop = ownedShops.find((s) => s.shop.id === shop.id);

      if (thisShop) {
        isOwner = true;
        ownerDashboardSlug = thisShop.shop.slug;
      } else if (ownedShops.length > 0) {
        isExistingSeller = true;
        ownerDashboardSlug = ownedShops[0]!.shop.slug;
      }
    }
  }

  const showRecruitmentCTAs = !isOwner && !isExistingSeller;

  // ── Track page view (fire-and-forget — don't block render) ──
  void trackEvent({ type: "PAGE_VIEW", shopId: shop.id });

  // ── Empty State ────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="space-y-5">
        {/* Still show shop hero even if no products */}
        <ShopHero shop={shop} tierBadge={tierData.tier} />

        <div className="flex flex-col items-center justify-center py-16 px-4">
          <IllustrationRocket className="w-40 h-40 mb-4" />
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Coming Soon
          </h2>
          <p className="text-slate-500 text-sm text-center max-w-xs">
            {shop.name} is setting up their catalog. Check back soon for fresh
            stock!
          </p>
          <a
            href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
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

  // ── Map to offline-cache shapes for IndexedDB ──────────
  // NOTE: cachedAt is set client-side by the cache manager to avoid
  // impure Date.now() calls during server render.
  const cachedShop = {
    id: shop.id,
    slug,
    name: shop.name,
    description: shop.description ?? null,
    logoUrl: shop.logoUrl ?? null,
    bannerUrl: shop.bannerUrl ?? null,
    whatsappNumber: shop.whatsappNumber,
    cachedAt: 0,
  };

  const cachedProducts = products.map((p) => {
    const prices = p.variants.map((v) => v.priceInCents);
    return {
      id: p.id,
      shopId: shop.id,
      name: p.name,
      description: p.description ?? null,
      imageUrl: p.images[0]?.url ?? null,
      minPriceCents: prices.length > 0 ? Math.min(...prices) : 0,
      maxPriceCents: prices.length > 0 ? Math.max(...prices) : 0,
      variants: p.variants.map((v) => ({
        id: v.id,
        size: v.size,
        color: v.color ?? null,
        priceInCents: v.priceInCents,
        stock: v.stock,
      })),
      cachedAt: 0,
    };
  });

  return (
    <div className="space-y-5">
      {/* ── Hero — Trust-first above the fold ────────────── */}
      <ShopHero shop={shop} tierBadge={tierData.tier} />

      {/* ── Search, Filter & Product Grid ─────────────────── */}
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

      {/* ── Review Highlights (social proof) ─────────── */}
      <ShopReviewHighlights reviews={reviewHighlights} shopName={shop.name} />

      {/* ── About This Seller ──────────────────────────── */}
      <ShopAboutSection shop={shop} />

      {/* ── Recently Viewed / Popular from Seller ────────── */}
      <RecentlyViewedStrip shopSlug={slug} fallbackProducts={fallbackProducts} />

      {/* ── Context-Aware CTAs ─────────────────────────── */}
      {isOwner && ownerDashboardSlug && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 ring-1 ring-slate-200/60 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Your Shop</p>
              <p className="text-xs text-slate-500">This is how your customers see you</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/${ownerDashboardSlug}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Manage Shop
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my shop on TradeFeed! 🛍️\nhttps://tradefeed.co.za/catalog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-emerald-600" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share
            </a>
          </div>
        </div>
      )}

      {showRecruitmentCTAs && (
        <>
          {/* ── Start Your Own Shop — Premium Viral CTA ──────── */}
          <div className="group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-[1px]">
            <div className="relative overflow-hidden rounded-[19px] bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 px-6 py-8 sm:py-10">
              <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-6 -bottom-10 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shadow-lg">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 21 9.349m-18 0V6.999c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125V9.35" />
                  </svg>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-white tracking-tight sm:text-2xl">
                    Start Your Own Shop
                  </h3>
                  <p className="text-sm text-emerald-100/90 max-w-[280px] mx-auto leading-relaxed">
                    Join thousands of sellers. Set up in minutes, sell on WhatsApp.
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-[260px]">
                  {[
                    { text: "Upload your products", icon: "📸" },
                    { text: "Share your catalog link", icon: "🔗" },
                    { text: "Get orders on WhatsApp", icon: "💰" },
                  ].map((step) => (
                    <div key={step.text} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2.5 ring-1 ring-white/10">
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
                        {step.icon}
                      </span>
                      <span className="text-sm font-medium text-white/95">{step.text}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/create-shop"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-xl shadow-emerald-900/20 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/30 hover:scale-[1.03] active:scale-[0.98]"
                >
                  Create your free shop
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>

                <p className="text-[11px] text-emerald-100 font-medium">Free forever · No credit card needed</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Marketplace Browse ─────────────────────────────── */}
      <div className="flex justify-center py-1">
        <Link
          href="/marketplace"
          className="group inline-flex items-center gap-2 rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-500 ring-1 ring-slate-200/60 transition-all duration-300 hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-200 hover:shadow-md hover:shadow-emerald-100/50"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.125 7.125 0 1 0 6.575 6.575a7.125 7.125 0 0 0 10.075 10.075Z" />
          </svg>
          Browse TradeFeed Marketplace
          <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* ── Offline Cache Manager (silent — renders nothing) ── */}
      <CatalogCacheManager shop={cachedShop} products={cachedProducts} />
    </div>
  );
}

