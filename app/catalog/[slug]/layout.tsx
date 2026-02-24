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
import type { Metadata } from "next";
import Link from "next/link";
import { CartProvider } from "@/lib/cart/cart-context";
import { WishlistProvider } from "@/lib/wishlist/wishlist-context";
import { CartButton } from "@/components/catalog/cart-button";
import { WishlistButton } from "@/components/catalog/wishlist-button";
import { generateShopJsonLd } from "@/lib/seo/json-ld";
import { BackToTop } from "@/components/ui/back-to-top";

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

  // Format WhatsApp number for display (e.g., +27 61 234 5678)
  const displayPhone = shop.whatsappNumber.replace(
    /^(\+27)(\d{2})(\d{3})(\d{4})$/,
    "$1 $2 $3 $4"
  );

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
      {/* ── Shop Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-stone-200/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Shop Identity */}
            <Link
              href={`/catalog/${slug}`}
              className="flex items-center gap-3 min-w-0 group"
            >
              {/* Logo circle — gradient fallback if no logo */}
              <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200/50 ring-2 ring-white">
                {shop.logoUrl ? (
                  <img
                    src={shop.logoUrl}
                    alt={shop.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-base">
                    {shop.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-stone-900 truncate text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
                    {shop.name}
                  </h1>
                  {/* Verified badge — only show if actually verified */}
                  {shop.isVerified && (
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center" title="Verified Seller">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                {shop.description && (
                  <p className="text-[11px] text-stone-400 truncate mt-0.5">
                    {shop.description}
                  </p>
                )}
                {/* City badge */}
                {shop.city && (
                  <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {shop.city}{shop.province ? `, ${shop.province}` : ""}
                  </p>
                )}
              </div>
            </Link>

            {/* WhatsApp Contact Button */}
            <a
              href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200 active:scale-95 flex-shrink-0"
            >
              {/* WhatsApp SVG icon */}
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-current"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="hidden sm:inline">WhatsApp</span>
              <span className="sm:hidden">Chat</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">{children}</main>

      {/* ── Floating Cart Button ─────────────────────────── */}
      <CartButton />

      {/* ── Floating Wishlist Button ─────────────────────── */}
      <WishlistButton shopSlug={slug} />

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-stone-100 bg-white/80 backdrop-blur-sm mt-12">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Trust indicators row */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mb-4 text-[11px] text-stone-400">
            {shop.isVerified && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified Seller
              </span>
            )}
            <span>
              Member since {new Date(shop.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
            </span>
            <span>{shop._count.products} {shop._count.products === 1 ? "product" : "products"} listed</span>
            {shop.city && <span>📍 {shop.city}</span>}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
            <p className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              Powered by{" "}
              <Link
                href="/"
                className="font-semibold text-stone-600 hover:text-emerald-600 transition-colors"
              >
                TradeFeed
              </Link>
            </p>
            <a
              href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-500 hover:text-emerald-600 transition-colors"
            >
              {displayPhone}
            </a>
          </div>
          {/* Legal links */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-stone-400">
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy</Link>
            <span>·</span>
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
