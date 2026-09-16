import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CommerceHeader } from "@/components/commerce/header";
import { TfProductCard } from "@/components/tf/product-card";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import {
  getMarketplaceProducts,
  getGlobalCategories,
  getFeaturedShops,
} from "@/lib/db/marketplace";
export const revalidate = 300;
export const metadata: Metadata = {
  title: { absolute: "TradeFeed | Discover South African shops" },
  description:
    "Find products from independent South African businesses. Explore shops, compare products and arrange your order directly with the seller.",
  alternates: { canonical: "/" },
};
export default async function Home() {
  const [result, categories, shops] = await Promise.all([
    getMarketplaceProducts({ pageSize: 12 }),
    getGlobalCategories(),
    getFeaturedShops(4),
  ]);
  return (
    <div className="min-h-screen bg-tf-surface text-tf-ink">
      <CommerceHeader />
      <main

        className="mx-auto max-w-6xl space-y-12 px-5 py-8 sm:py-12"
      >
        <section className="grid gap-8 rounded-2xl border border-tf-stone-200 bg-tf-raised p-6 sm:p-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-tf-primary">
              Independent shops. South African stories.
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Good finds.
              <br />
              Closer to home.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-tf-stone-600">
              Discover products from local businesses, get to know the seller,
              and find something worth bringing home.
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-tf-primary px-6 font-semibold text-white"
            >
              Explore the marketplace →
            </Link>
          </div>
          {result.products[0]?.imageUrl && <Link href={"/catalog/"+result.products[0].shop.slug+"/products/"+(result.products[0].slug??result.products[0].id)} className="group relative block min-h-64 overflow-hidden rounded-xl bg-tf-stone-100"><Image src={result.products[0].imageUrl} alt={result.products[0].name} fill priority sizes="(min-width: 1024px) 35vw, 90vw" className="object-cover"/><span className="absolute inset-x-3 bottom-3 rounded-lg bg-tf-raised/95 p-3 text-sm font-semibold text-tf-ink">{result.products[0].name}<span className="mt-1 block font-normal">Explore the shop →</span></span></Link>}
        </section>
        <section aria-labelledby="categories-title">
          <h2
            id="categories-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Explore by category
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {categories
              .filter((c) => c.productCount > 0)
              .slice(0, 10)
              .map((c) => (
                <Link
                  key={c.id}
                  href={"/marketplace?category=" + encodeURIComponent(c.slug)}
                  className="rounded-xl border border-tf-stone-200 bg-tf-raised px-5 py-4 text-sm font-medium hover:border-tf-primary"
                >
                  {c.name}
                </Link>
              ))}
          </div>
        </section>
        <section aria-labelledby="products-title">
          <div className="flex items-center justify-between gap-4">
            <h2
              id="products-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Explore the collection
            </h2>
            <Link
              href="/marketplace"
              className="text-sm font-semibold text-tf-primary"
            >
              View all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result.products.map((p) => (
              <TfProductCard
                key={p.id}
                href={
                  "/catalog/" + p.shop.slug + "/products/" + (p.slug ?? p.id)
                }
                title={p.name}
                price={p.minPriceCents / 100}
                imageUrl={p.imageUrl}
                sellerName={p.shop.name}
                sellerVerified={p.shop.isVerified}
                rating={p.avgRating ?? undefined}
                ratingCount={p.reviewCount || undefined}
                location={p.shop.city ?? p.shop.province ?? undefined}
              />
            ))}
          </div>
          {result.products.length === 0 && (
            <p className="mt-5 text-tf-stone-600">
              New collections are on their way. Browse the marketplace for
              current availability.
            </p>
          )}
        </section>
        {shops.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold tracking-tight">
              Meet the shops
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {shops.map((s) => (
                <TfVerifiedSellerCard
                  key={s.id}
                  name={s.name}
                  verified={s.isVerified}
                  avatarUrl={s.logoUrl}
                  location={s.city ?? s.province ?? undefined}
                  href={"/catalog/" + s.slug}
                />
              ))}
            </div>
          </section>
        )}
        <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-tf-deep p-7 text-white">
          <div>
            <h2 className="text-2xl font-semibold">
              Your business belongs here.
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Create a shop and give customers one place to discover your
              products.
            </p>
          </div>
          <Link
            href="/sell"
            className="rounded-lg border border-white/40 px-5 py-3 font-semibold"
          >
            Start selling →
          </Link>
        </section>
      </main>
      <footer className="mt-10 border-t border-tf-stone-200 px-5 py-8">
        <nav
          aria-label="Footer"
          className="mx-auto flex max-w-6xl flex-wrap gap-6 text-sm text-tf-stone-600"
        >
          <span>TradeFeed · South Africa</span>
          <Link href="/support/order">Order help</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/sell">Sell with us</Link>
        </nav>
      </footer>
    </div>
  );
}
