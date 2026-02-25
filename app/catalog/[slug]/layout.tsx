// ============================================================
// Layout — Public Catalog (/catalog/[slug])
// ============================================================
// The public storefront layout. This is what buyers see when
// a seller shares their catalog link in WhatsApp groups.
//
// DESIGN GOALS:
// - Loads fast on SA mobile data (SSR, minimal JS)
// - Beautiful, trust-building shop header
// - WhatsApp badge for instant contact
// - Mobile-first — most buyers browse on phones
// ============================================================

import { getCatalogShop } from "@/lib/db/catalog";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { CartProvider } from "@/lib/cart/cart-context";
import { WishlistProvider } from "@/lib/wishlist/wishlist-context";
import { WishlistButton } from "@/components/catalog/wishlist-button";
import { generateShopJsonLd } from "@/lib/seo/json-ld";
import { BackToTop } from "@/components/ui/back-to-top";
import { ShareCatalog } from "@/components/catalog/share-catalog";
import { BottomNav } from "@/components/ui/bottom-nav";

interface CatalogLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

/**
 * Generate dynamic metadata for SEO.
 * Each shop gets a unique title/description — great for WhatsApp link previews.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);

  if (!shop) {
    return { title: "Shop Not Found — TradeFeed" };
  }

  const ogUrl = new URL("/api/og", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  ogUrl.searchParams.set("type", "shop");
  ogUrl.searchParams.set("name", shop.name);
  ogUrl.searchParams.set("description", shop.description || `Browse ${shop.name}'s catalog on TradeFeed`);
  if (shop.city) ogUrl.searchParams.set("city", shop.city);
  ogUrl.searchParams.set("productCount", String(shop._count.products));
  if (shop.isVerified) ogUrl.searchParams.set("verified", "true");

  return {
    title: `${shop.name} — TradeFeed`,
    description:
      shop.description || `Browse ${shop.name}'s catalog on TradeFeed`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://tradefeed.co.za"}/catalog/${slug}`,
    },
    openGraph: {
      title: `${shop.name} — TradeFeed`,
      description:
        shop.description || `Browse ${shop.name}'s catalog on TradeFeed`,
      type: "website",
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: shop.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${shop.name} — TradeFeed`,
      description: shop.description || `Browse ${shop.name}'s catalog on TradeFeed`,
      images: [ogUrl.toString()],
    },
  };
}

export default async function CatalogLayout({
  children,
  params,
}: CatalogLayoutProps) {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);

  if (!shop) return notFound();

  return (
    <CartProvider shopSlug={slug} shopId={shop.id} whatsappNumber={shop.whatsappNumber}>
    <WishlistProvider shopSlug={slug}>
      {/* JSON-LD Structured Data for SEO */}
      {generateShopJsonLd(shop).map((schema, i) => (
        <script
          key={`shop-ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="min-h-screen bg-[#fafaf9]">
      {/* ── Shop Header (WhatsApp-style compact) ─────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-stone-100">
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Shop Identity */}
            <Link
              href={`/catalog/${slug}`}
              className="flex items-center gap-2.5 min-w-0 group"
            >
              {/* Logo circle */}
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0 ring-2 ring-emerald-100">
                {shop.logoUrl ? (
                  <Image
                    src={shop.logoUrl}
                    alt={shop.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {shop.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <h1 className="font-semibold text-stone-900 truncate text-[15px] leading-tight group-hover:text-emerald-700 transition-colors">
                    {shop.name}
                  </h1>
                  {shop.isVerified && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center" title="Verified Seller">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                {/* Compact subtitle: city + product count */}
                <p className="text-[11px] text-stone-400 leading-tight mt-0.5 truncate">
                  {shop.city && <span>{shop.city} · </span>}
                  {shop._count.products} {shop._count.products === 1 ? "product" : "products"}
                </p>
              </div>
            </Link>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <ShareCatalog
                shopName={shop.name}
                shopSlug={slug}
                productCount={shop._count.products}
                variant="icon"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content (edge-to-edge mobile) ────────── */}
      <main className="px-3 sm:px-4 py-4 pb-24 max-w-5xl mx-auto">{children}</main>

      {/* ── Floating Wishlist Button ─────────────────────── */}
      <WishlistButton shopSlug={slug} />

      {/* ── Bottom Navigation (WhatsApp-style) ───────────── */}
      <BottomNav shopSlug={slug} whatsappNumber={shop.whatsappNumber} />

      {/* ── Footer (compact) ───────────────────────────── */}
      <footer className="border-t border-stone-100 bg-white/60 backdrop-blur-sm pb-20">
        <div className="px-4 py-4">
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-3 text-[11px] text-stone-400">
            {shop.isVerified && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            )}
            <span>{shop._count.products} products</span>
            {shop.city && <span>📍 {shop.city}</span>}
          </div>
          <div className="flex items-center justify-center gap-4 text-[10px] text-stone-400">
            <p className="flex items-center gap-1">
              Powered by{" "}
              <Link href="/" className="font-semibold text-stone-500 hover:text-emerald-600 transition-colors">
                TradeFeed
              </Link>
            </p>
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
    </WishlistProvider>
    </CartProvider>
  );
}
