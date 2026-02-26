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
import { CartButton } from "@/components/catalog/cart-button";
import { generateShopJsonLd } from "@/lib/seo/json-ld";
import { ShareCatalog } from "@/components/catalog/share-catalog";
import { BottomNav } from "@/components/ui/bottom-nav";
import { CatalogAppShell } from "@/components/ui/catalog-app-shell";

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
      <CatalogAppShell
        header={
          <div className="px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
              <Link
                href={`/catalog/${slug}`}
                className="group flex min-w-0 items-center gap-2.5"
              >
                <div className="relative h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-700 ring-2 ring-emerald-100">
                  {shop.logoUrl ? (
                    <Image
                      src={shop.logoUrl}
                      alt={shop.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full">
                      <span className="text-sm font-bold text-white">
                        {shop.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h1 className="truncate text-[15px] font-semibold leading-tight text-stone-900 transition-colors group-hover:text-emerald-700">
                      {shop.name}
                    </h1>
                    {shop.isVerified && (
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500" title="Verified Seller">
                        <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] leading-tight text-stone-400">
                    {shop.city && <span>{shop.city} · </span>}
                    {shop._count.products} {shop._count.products === 1 ? "product" : "products"}
                  </p>
                </div>
              </Link>

              <div className="flex flex-shrink-0 items-center gap-1">
                <ShareCatalog
                  shopName={shop.name}
                  shopSlug={slug}
                  productCount={shop._count.products}
                  variant="icon"
                />
              </div>
            </div>
          </div>
        }
        bottomNav={<BottomNav shopSlug={slug} />}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-4">
          {children}

          <footer className="rounded-2xl bg-stone-50 px-4 py-4 text-center">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
              {shop.isVerified && (
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              <span>{shop._count.products} products</span>
              {shop.city && <span>📍 {shop.city}</span>}
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] text-stone-400">
              <Link href="/" className="font-semibold text-stone-500 transition-colors hover:text-emerald-600">
                TradeFeed
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-emerald-600">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-emerald-600">Terms</Link>
            </div>
          </footer>
        </div>

        <CartButton />
        <WishlistButton shopSlug={slug} />
      </CatalogAppShell>
    </WishlistProvider>
    </CartProvider>
  );
}
