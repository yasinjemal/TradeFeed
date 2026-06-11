import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { TfFonts } from "@/components/tf/tf-fonts";
import { TfProductCard } from "@/components/tf/product-card";
import { TfRatingChip } from "@/components/tf/rating-chip";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TfReviewsBlock, type TfReview } from "@/components/tf/storefront/tf-reviews";
import type { SellerTrustStats } from "@/lib/trust/seller-stats";
import { TfGallery } from "./tf-gallery";
import { TfOrderPanel, type TfVariant } from "./tf-order-panel";

// ============================================================
// TfProductPage — gallery first, price in tabular figures,
// variant selectors, then the Verified Seller card inline so
// the buyer sees who they're buying from BEFORE ordering, plus
// the trust bar. CTA wording is identical everywhere:
// "Order on WhatsApp".
// ============================================================

export interface TfStripProduct {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  minPriceCents: number;
  shopName: string;
  shopSlug: string;
  shopVerified: boolean;
}

export interface TfProductPageProps {
  shop: {
    slug: string;
    name: string;
    isVerified: boolean;
    logoUrl: string | null;
    city: string | null;
    province: string | null;
    whatsappNumber: string;
    createdAt: Date;
  };
  product: {
    id: string;
    slug: string | null;
    name: string;
    description: string | null;
    categoryName: string | null;
    categorySlug: string | null;
    images: { id: string; url: string; altText: string | null }[];
    variants: TfVariant[];
    option1Label: string;
    option2Label: string;
  };
  productUrl: string;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  reviews: TfReview[];
  trustStats: SellerTrustStats | null;
  moreFromSeller: TfStripProduct[];
  similarProducts: TfStripProduct[];
}

function ProductStrip({ title, products }: { title: string; products: TfStripProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-label={title}>
      <h2 className="font-tf-display text-lg font-semibold text-tf-ink">{title}</h2>
      <ul className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {products.map((p) => (
          <li key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
            <TfProductCard
              href={`/catalog/${p.shopSlug}/products/${p.slug ?? p.id}`}
              title={p.name}
              price={p.minPriceCents / 100}
              imageUrl={p.imageUrl}
              sellerName={p.shopName}
              sellerVerified={p.shopVerified}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TfProductPage({
  shop,
  product,
  productUrl,
  soldCount,
  avgRating,
  reviewCount,
  reviews,
  trustStats,
  moreFromSeller,
  similarProducts,
}: TfProductPageProps) {
  const location = [shop.city, shop.province].filter(Boolean).join(", ") || undefined;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-28 lg:pb-6">
      <TfFonts />

      {/* Back to shop */}
      <Link
        href={`/catalog/${shop.slug}`}
        className="inline-flex items-center gap-1 rounded text-sm text-tf-stone-600 outline-none hover:text-tf-ink focus-visible:ring-2 focus-visible:ring-tf-primary"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {shop.name}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Gallery */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <TfGallery images={product.images} productName={product.name} soldOut={totalStock === 0} />
        </div>

        {/* Info + order */}
        <div className="space-y-5">
          <div>
            {product.categoryName && product.categorySlug && (
              <Link
                href={`/marketplace?category=${encodeURIComponent(product.categorySlug)}`}
                className="mb-2 inline-block rounded-full bg-tf-stone-100 px-2.5 py-1 text-xs font-medium text-tf-stone-600 outline-none hover:bg-tf-stone-200 focus-visible:ring-2 focus-visible:ring-tf-primary"
              >
                {product.categoryName}
              </Link>
            )}
            <h1 className="font-tf-display text-2xl font-semibold leading-tight text-tf-ink">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {avgRating > 0 && <TfRatingChip rating={avgRating} count={reviewCount} />}
              {soldCount > 0 && (
                <span className="text-sm font-medium tabular-nums text-tf-primary">
                  {soldCount >= 100 ? "100+" : soldCount} sold
                </span>
              )}
            </div>
          </div>

          <TfOrderPanel
            productName={product.name}
            productUrl={productUrl}
            shopName={shop.name}
            whatsappNumber={shop.whatsappNumber}
            variants={product.variants}
            option1Label={product.option1Label}
            option2Label={product.option2Label}
          />

          {/* Who you're buying from — before the fold of the order */}
          <TfVerifiedSellerCard
            name={shop.name}
            verified={shop.isVerified}
            avatarUrl={shop.logoUrl}
            ordersFulfilled={trustStats?.ordersFulfilled}
            memberSince={shop.createdAt.getFullYear()}
            location={location}
            href={`/catalog/${shop.slug}`}
          />

          <TfTrustBar ordersFulfilled={trustStats?.ordersFulfilled} compact />

          {product.description && (
            <section aria-label="Description">
              <h2 className="font-tf-display text-base font-semibold text-tf-ink">Details</h2>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-tf-stone-600">
                {product.description}
              </p>
            </section>
          )}
        </div>
      </div>

      <TfReviewsBlock
        reviews={reviews}
        avgRating={avgRating > 0 ? avgRating : null}
        reviewCount={reviewCount}
        shopName={shop.name}
      />

      <ProductStrip title={`More from ${shop.name}`} products={moreFromSeller} />
      <ProductStrip title="Related items" products={similarProducts} />
    </div>
  );
}
