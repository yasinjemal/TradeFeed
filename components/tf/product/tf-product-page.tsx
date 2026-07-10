import * as React from "react";
import Link from "next/link";
import { ChevronLeft, Factory, FileText } from "lucide-react";

import { RestockAlert } from "@/components/catalog/restock-alert";
import { ShareProduct } from "@/components/catalog/share-product";
import { TfButton } from "@/components/tf/button";
import { TfFonts } from "@/components/tf/tf-fonts";
import { formatZAR } from "@/components/tf/format";
import { TfProductCard } from "@/components/tf/product-card";
import { TfRatingChip } from "@/components/tf/rating-chip";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TfReviewsBlock, type TfReview } from "@/components/tf/storefront/tf-reviews";
import { TfReviewForm } from "@/components/tf/storefront/tf-review-form";
import type { SellerTrustStats } from "@/lib/trust/seller-stats";
import type { BulkDiscountTier } from "@/lib/cart/pricing";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TfGallery } from "./tf-gallery";
import { TfOrderPanel, type TfVariant } from "./tf-order-panel";
import { TfFulfillmentPromise } from "@/components/tf/fulfillment-promise";

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
    id: string;
    slug: string;
    name: string;
    isVerified: boolean;
    logoUrl: string | null;
    city: string | null;
    province: string | null;
    whatsappNumber: string;
    createdAt: Date;
    deliveryEnabled: boolean;
    collectionEnabled: boolean;
    dispatchWindow: string;
    deliveryNote: string | null;
    returnPolicy: string | null;
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
    minWholesaleQty?: number;
    wholesaleOnly?: boolean;
    bulkDiscountTiers?: BulkDiscountTier[];
  };
  productUrl: string;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  reviews: TfReview[];
  reviewDistribution?: { rating: number; count: number }[];
  trustStats: SellerTrustStats | null;
  moreFromSeller: TfStripProduct[];
  similarProducts: TfStripProduct[];
}

function ProductStrip({ title, products }: { title: string; products: TfStripProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section aria-label={title}>
      <TfReveal>
        <h2 className="font-tf-display text-lg font-semibold text-tf-ink">{title}</h2>
      </TfReveal>
      <TfReveal as="ul" stagger className="tf-rail mt-3 flex snap-x gap-3 overflow-x-auto pb-1 pr-6 scrollbar-hide">
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
      </TfReveal>
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
  reviewDistribution,
  trustStats,
  moreFromSeller,
  similarProducts,
}: TfProductPageProps) {
  const location = [shop.city, shop.province].filter(Boolean).join(", ") || undefined;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
  const soldOut = totalStock === 0;
  const minPriceCents =
    product.variants.length > 0 ? Math.min(...product.variants.map((v) => v.priceInCents)) : 0;
  const tiers = product.bulkDiscountTiers ?? [];
  const minWholesaleQty = product.minWholesaleQty ?? 1;
  const showRfq = Boolean(product.wholesaleOnly) || tiers.length > 0 || minWholesaleQty > 1;

  // Structured wholesale quote request — mirrors the legacy RFQ message
  const rfqMessage = [
    `*Wholesale Inquiry — ${product.name}*`,
    "",
    "I'd like to request a wholesale quote.",
    "",
    `Product: ${product.name}`,
    `Listed price: ${formatZAR(minPriceCents / 100)}/unit`,
    minWholesaleQty > 1 ? `Min. order: ${minWholesaleQty} units` : null,
    tiers.length > 0
      ? `Volume tiers: ${tiers.map((t) => `${t.minQuantity}+ → ${t.discountPercent}% off`).join(", ")}`
      : null,
    "",
    "Please share:",
    "• Bulk pricing for larger quantities",
    "• Lead times & availability",
    "• Delivery options",
    "",
    "Thank you!",
  ]
    .filter((l) => l !== null)
    .join("\n");
  const rfqHref = `https://wa.me/${shop.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(rfqMessage)}`;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-28 lg:pb-6">
      <TfFonts />

      {/* Back to shop */}
      <Link
        href={`/catalog/${shop.slug}`}
        className="inline-flex items-center gap-1 rounded text-sm text-tf-stone-500 outline-none hover:text-tf-ink focus-visible:ring-2 focus-visible:ring-tf-primary"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {shop.name}
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Gallery — sticky offset accounts for catalog header (~64px) */}
        <TfReveal className="lg:sticky lg:top-[72px] lg:self-start">
          <TfGallery images={product.images} productName={product.name} soldOut={totalStock === 0} />
        </TfReveal>

        {/* Info + order */}
        <div className="space-y-5">
          {/* Wholesale-only banner */}
          {product.wholesaleOnly && (
            <TfReveal>
              <div className="flex items-start gap-3 rounded-xl border border-tf-accent/30 bg-tf-accent-soft px-4 py-3">
                <Factory aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-tf-accent-ink" />
                <div>
                  <p className="text-sm font-semibold text-tf-ink">Wholesale only</p>
                  <p className="mt-0.5 text-xs text-tf-stone-600">
                    This product is exclusive to registered wholesale buyers.{" "}
                    <Link
                      href="/marketplace/wholesale-register"
                      className="font-semibold text-tf-accent-ink underline underline-offset-2 hover:opacity-80"
                    >
                      Register as a wholesale buyer
                    </Link>
                  </p>
                </div>
              </div>
            </TfReveal>
          )}

          <TfReveal delay={80}>
            {product.categoryName && product.categorySlug && (
              <Link
                href={`/marketplace?category=${encodeURIComponent(product.categorySlug)}`}
                className="mb-3 inline-flex items-center rounded-full border border-tf-verified/25 bg-tf-verified-soft px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-tf-verified outline-none hover:border-tf-verified/40 focus-visible:ring-2 focus-visible:ring-tf-primary"
              >
                {product.categoryName}
              </Link>
            )}
            <h1
              className="font-tf-hero text-tf-ink"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: "1.06", letterSpacing: "-0.03em", fontWeight: 700 }}
            >
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
          </TfReveal>

          <TfReveal delay={140}>
          <TfOrderPanel
            productId={product.id}
            productName={product.name}
            productUrl={productUrl}
            shopId={shop.id}
            shopName={shop.name}
            whatsappNumber={shop.whatsappNumber}
            variants={product.variants}
            option1Label={product.option1Label}
            option2Label={product.option2Label}
            imageUrl={product.images[0]?.url ?? null}
            minWholesaleQty={product.minWholesaleQty}
            bulkDiscountTiers={tiers}
          />
          </TfReveal>

          {/* Sold out → capture demand instead of losing the buyer */}
          {soldOut && (
            <TfReveal>
              <RestockAlert productId={product.id} productName={product.name} shopId={shop.id} />
            </TfReveal>
          )}

          {/* Custom quote for bulk buyers */}
          {showRfq && (
            <TfReveal>
              <div className="rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-tf-ink">
                  <FileText aria-hidden="true" className="size-4 text-tf-primary" />
                  Need a custom quote?
                </p>
                <p className="mb-3 mt-1 text-xs text-tf-stone-600">
                  Ordering larger quantities? Ask {shop.name} for volume pricing, lead times and
                  delivery options.
                </p>
                <TfButton asChild variant="secondary" size="sm">
                  <a href={rfqHref} target="_blank" rel="noopener noreferrer">
                    Request wholesale quote
                  </a>
                </TfButton>
              </div>
            </TfReveal>
          )}

          {/* Share */}
          <ShareProduct
            productName={product.name}
            productUrl={productUrl}
            price={formatZAR(minPriceCents / 100)}
            shopName={shop.name}
          />

          {/* Who you're buying from — before the fold of the order */}
          <TfReveal delay={200}>
          <TfVerifiedSellerCard
            name={shop.name}
            verified={shop.isVerified}
            avatarUrl={shop.logoUrl}
            ordersFulfilled={trustStats?.ordersFulfilled}
            memberSince={shop.createdAt.getFullYear()}
            location={location}
            href={`/catalog/${shop.slug}`}
          />
          </TfReveal>

          <TfReveal>
            <TfTrustBar ordersFulfilled={trustStats?.ordersFulfilled} compact />
          </TfReveal>

          <TfReveal>
            <TfFulfillmentPromise
              compact
              deliveryEnabled={shop.deliveryEnabled}
              collectionEnabled={shop.collectionEnabled}
              dispatchWindow={shop.dispatchWindow}
              deliveryNote={shop.deliveryNote}
              returnPolicy={shop.returnPolicy}
            />
          </TfReveal>

          {product.description && (
            <TfReveal as="section" aria-label="Description">
              <h2 className="flex items-center gap-2 font-tf-display text-base font-semibold text-tf-ink">
                <span aria-hidden="true" className="h-4 w-1 rounded-full bg-tf-primary" />
                Details
              </h2>
              <p className="mt-2 whitespace-pre-line border-l-2 border-tf-stone-200 pl-3.5 text-sm leading-relaxed text-tf-stone-600">
                {product.description}
              </p>
            </TfReveal>
          )}
        </div>
      </div>

      <TfReveal>
      <TfReviewsBlock
        reviews={reviews}
        avgRating={avgRating > 0 ? avgRating : null}
        reviewCount={reviewCount}
        shopName={shop.name}
        distribution={reviewDistribution}
        action={<TfReviewForm shopId={shop.id} shopSlug={shop.slug} productId={product.id} />}
      />
      </TfReveal>

      <ProductStrip title={`More from ${shop.name}`} products={moreFromSeller} />
      <ProductStrip title="Related items" products={similarProducts} />
    </div>
  );
}
