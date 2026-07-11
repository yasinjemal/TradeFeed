import * as React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, Factory, FileText, LockKeyhole, RotateCcw, ShieldCheck } from "lucide-react";

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
import { TfProductFavourite } from "./tf-product-favourite";
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
        <h2 className="font-tf-editorial text-2xl font-medium tracking-[-0.02em] text-tf-ink sm:text-3xl">{title}</h2>
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

function Assurance({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center text-tf-primary sm:flex-row sm:text-left">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-tf-verified-soft">
        {icon}
      </span>
      <span className="text-[10px] font-semibold leading-tight text-tf-stone-600 sm:text-[11px]">
        {label}
      </span>
    </div>
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
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-28 lg:pb-8">
      <TfFonts />

      {/* Back to shop */}
      <Link
        href={`/catalog/${shop.slug}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-tf-stone-200/80 bg-tf-raised px-3 py-2 text-xs font-semibold text-tf-stone-500 shadow-tf-sm outline-none transition hover:border-tf-primary/25 hover:text-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {shop.name}
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-14 xl:gap-16">
        {/* Gallery — sticky offset accounts for catalog header (~64px) */}
        <TfReveal className="lg:sticky lg:top-[72px] lg:self-start">
          <TfGallery images={product.images} productName={product.name} soldOut={totalStock === 0} />
        </TfReveal>

        {/* Info + order */}
        <div className="space-y-6 lg:pt-2">
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
            <div className="mb-5 flex items-center justify-between gap-3">
              {product.categoryName && product.categorySlug ? (
                <Link
                  href={`/marketplace?category=${encodeURIComponent(product.categorySlug)}`}
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-tf-primary outline-none hover:text-tf-primary-hover focus-visible:ring-2 focus-visible:ring-tf-primary"
                >
                  <span className="h-px w-7 bg-tf-primary/55" aria-hidden="true" />
                  {product.categoryName}
                </Link>
              ) : <span />}
              <TfProductFavourite
                productId={product.id}
                productName={product.name}
                imageUrl={product.images[0]?.url ?? null}
                priceInCents={minPriceCents}
              />
            </div>
            <h1 className="max-w-[15ch] font-tf-editorial text-[2.65rem] font-medium leading-[0.94] tracking-[-0.035em] text-tf-ink sm:text-[3.5rem] lg:text-[4rem]">
              {product.name}
            </h1>
            <p className="mt-4 max-w-xl font-tf-display text-sm leading-6 text-tf-stone-500">
              Offered by <Link href={`/catalog/${shop.slug}`} className="font-semibold text-tf-ink underline decoration-tf-primary/30 underline-offset-4 hover:text-tf-primary">{shop.name}</Link>
              {location ? ` in ${location}` : ""}.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-tf-stone-200/70 py-3">
              {shop.isVerified && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tf-verified"><BadgeCheck className="size-4" /> Verified seller</span>}
              {avgRating > 0 && <TfRatingChip rating={avgRating} count={reviewCount} />}
              {soldCount > 0 && (
                <span className="text-xs font-semibold tabular-nums text-tf-stone-500">
                  {soldCount >= 100 ? "100+" : soldCount} sold
                </span>
              )}
            </div>
          </TfReveal>

          <TfReveal delay={140}>
          <div className="rounded-[1.75rem] border border-tf-stone-200/80 bg-tf-raised p-5 shadow-[0_24px_70px_rgba(20,20,16,0.08)] sm:p-6">
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
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-tf-stone-200/70 pt-4">
              <Assurance icon={<LockKeyhole className="size-4" />} label="Secure payment" />
              <Assurance icon={<ShieldCheck className="size-4" />} label="Verified seller" />
              <Assurance icon={<RotateCcw className="size-4" />} label="Clear policies" />
            </div>
          </div>
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
              <div className="rounded-2xl border border-tf-accent/25 bg-gradient-to-br from-tf-accent-soft/70 to-tf-raised p-5">
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
            <TfReveal as="section" aria-label="Description" className="rounded-[1.5rem] border border-tf-stone-200/70 bg-tf-stone-50/60 p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tf-primary">The piece</p>
              <h2 className="mt-2 font-tf-editorial text-3xl font-medium tracking-[-0.02em] text-tf-ink">
                Product details
              </h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-tf-stone-600">
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
