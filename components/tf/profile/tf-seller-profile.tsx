import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, MessageCircle, Share2, Store } from "lucide-react";

import { RecentlyViewedStrip } from "@/components/catalog/recently-viewed-strip";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";
import { TfButton } from "@/components/tf/button";
import { TfHeroFont } from "@/components/tf/tf-fonts";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import { TfComboRail, type TfCombo } from "@/components/tf/storefront/tf-combo-rail";
import { TfReviewsBlock, type TfReview } from "@/components/tf/storefront/tf-reviews";
import type { TfGridProduct } from "@/components/tf/storefront/tf-product-grid";
import type { SellerTrustStats } from "@/lib/trust/seller-stats";

import { buildProofRail } from "@/lib/seller/proof-ladder";
import { hasConfirmedFulfilment } from "@/lib/seller/fulfilment-promise";
import {
  dominantCategoryName,
  resolveMonogramWord,
  resolveStageMode,
  stageProofPlacement,
  stageShowsAskDock,
} from "@/lib/seller/stage-mode";

import { TfAskDock } from "./tf-ask-dock";
import { TfInventoryBlock } from "./tf-inventory-block";
import { TfLightMediaProbe } from "./tf-light-media-probe";
import { TfNameplateHero } from "./tf-nameplate-hero";
import { TfOwnerNudges, buildOwnerNudges } from "./tf-owner-nudges";
import { TfProofRail } from "./tf-proof-rail";
import { TfPromiseDock } from "./tf-promise-dock";
import { TfSellerStory } from "./tf-seller-story";

// ============================================================
// TfSellerProfile — "The Counter"
// ============================================================
// A buyer arrives here from a WhatsApp link with intent already
// formed, on prepaid data, deciding exactly one thing: can I
// trust this stranger with my money before I tap.
//
// So the seller is the centre of the page the way a shopkeeper
// is the centre of a counter — a zero-byte typographic nameplate,
// a four-row fulfilment promise above the fold, and a rail of
// evidence rather than stock. The page is structurally complete
// before a single product exists, which matters because 90 of
// 116 live shops hold two products or fewer and 43 hold none.
//
// Inventory then renders in a density ladder that changes SHAPE
// at 1, 2, 3 and 8 — a grid of one looks broken, a plinth of one
// looks curated.
//
// Rules this file must not break:
//   1. No decorative image in the server-rendered hero, ever.
//   2. Nothing claims a fact the seller has not actually given.
//   3. Exactly one sticky order CTA, on every rung including zero.
// ============================================================

export interface TfSellerProfileProps {
  shop: {
    id: string;
    slug: string;
    name: string;
    isVerified: boolean;
    logoUrl: string | null;
    bannerUrl: string | null;
    city: string | null;
    province: string | null;
    /** Already POPIA-gated in getCatalogShop: null unless published. */
    address: string | null;
    aboutText: string | null;
    description: string | null;
    whatsappNumber: string;
    createdAt: Date;
    deliveryEnabled: boolean;
    collectionEnabled: boolean;
    dispatchWindow: string;
    deliveryNote: string | null;
    returnPolicy: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    website: string | null;
    whatsappGroupLink: string | null;
    gallery: { id: string; url: string; type: string; caption: string | null }[];
  };
  products: TfGridProduct[];
  combos: TfCombo[];
  drop: { id: string; title: string; itemCount: number } | null;
  fallbackProducts: {
    productId: string;
    productName: string;
    imageUrl: string | null;
    priceInCents: number;
  }[];
  shareUrl: string;
  trustStats: SellerTrustStats | null;
  reviews: TfReview[];
  avgRating: number | null;
  reviewCount: number;
  isOwner: boolean;
  ownerDashboardSlug: string | null;
  showRecruitment: boolean;
}

export function TfSellerProfile({
  shop,
  products,
  combos,
  drop,
  fallbackProducts,
  shareUrl,
  trustStats,
  reviews,
  avgRating,
  reviewCount,
  isOwner,
  ownerDashboardSlug,
  showRecruitment,
}: TfSellerProfileProps) {
  const mode = resolveStageMode(products.length);
  const proofPlacement = stageProofPlacement(mode);
  const firstName = shop.name.trim().split(/\s+/)[0] ?? shop.name;

  const waNumber = shop.whatsappNumber.replace(/[^0-9]/g, "");
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi ${shop.name}! I'm browsing your TradeFeed shop and I'd like to order.`,
  )}`;

  const confirmedFulfilment = hasConfirmedFulfilment(shop);

  // The tagline is the hero's one-line "what I sell". Until the
  // column exists it is derived — and only from prose the seller
  // actually wrote, never from a placeholder.
  const aboutSource = shop.aboutText?.trim() || shop.description?.trim() || null;
  const tagline = aboutSource
    ? aboutSource.length <= 80
      ? aboutSource
      : `${aboutSource.slice(0, 79).trimEnd()}…`
    : null;

  // Metadata line: facts only. An absent fact is simply not in it.
  const location = [shop.city, shop.province].filter(Boolean).join(", ");
  const facts: string[] = [];
  if (location) facts.push(location);
  facts.push(`since ${shop.createdAt.getFullYear()}`);
  if (trustStats && trustStats.ordersFulfilled > 0) {
    facts.push(
      `${trustStats.ordersFulfilled} order${trustStats.ordersFulfilled === 1 ? "" : "s"} fulfilled`,
    );
  }

  const proofCards = buildProofRail({
    shopName: shop.name,
    city: shop.city,
    province: shop.province,
    memberSinceYear: shop.createdAt.getFullYear(),
    aboutText: shop.aboutText ?? shop.description,
    tagline,
    deliveryEnabled: shop.deliveryEnabled,
    collectionEnabled: shop.collectionEnabled,
    fulfilmentConfirmed: confirmedFulfilment,
    ordersFulfilled: trustStats?.ordersFulfilled ?? null,
    reviews: reviews.map((review) => ({
      id: review.id,
      comment: review.comment,
      buyerName: review.buyerName,
      rating: review.rating,
    })),
    gallery: shop.gallery.map((item) => ({
      id: item.id,
      url: item.url,
      caption: item.caption,
      isVideo: item.type === "VIDEO",
    })),
    hoursSummary: null,
  });

  const proofRail = (
    <TfProofRail cards={proofCards} heading={`Why buyers trust ${firstName}`} />
  );

  const ownerNudges =
    isOwner && ownerDashboardSlug
      ? buildOwnerNudges({
          dashboardSlug: ownerDashboardSlug,
          hasReturnPolicy: Boolean(shop.returnPolicy?.trim()),
          hasConfirmedFulfilment: confirmedFulfilment,
          productCount: products.length,
          galleryCount: shop.gallery.length,
        })
      : [];

  // getCatalogShop already nulls address unless locationPublishedAt
  // is set, so joining it here cannot leak an unpublished address.
  const locationLine = [shop.address, location].filter(Boolean).join(", ") || null;

  return (
    <div className="space-y-8 pb-28">
      <TfHeroFont />
      <TfLightMediaProbe />

      {/* 1 ── The seller, set in type. No hero image, by design. */}
      <TfNameplateHero
        shopId={shop.id}
        name={shop.name}
        tagline={tagline}
        logoUrl={shop.logoUrl}
        verified={shop.isVerified}
        monogramWord={resolveMonogramWord(
          shop.name,
          dominantCategoryName(products),
          shop.city,
        )}
        facts={facts}
        waHref={waHref}
      />

      {/* 2 ── The four questions, answered above the fold. */}
      <TfPromiseDock
        shop={shop}
        shopId={shop.id}
        waHref={waHref}
        isOwner={isOwner}
        ownerSettingsHref={
          ownerDashboardSlug ? `/dashboard/${ownerDashboardSlug}/settings` : null
        }
      />

      {/* 3 ── The dead end, converted: a lead where there was none. */}
      {stageShowsAskDock(mode) && (
        <TfAskDock
          shopId={shop.id}
          shopName={shop.name}
          whatsappNumber={shop.whatsappNumber}
        />
      )}

      {/* 4 ── Proof sits above thin inventory, below real stock. */}
      {proofPlacement === "above" && proofRail}

      {/* 5 ── Latest drop */}
      {drop && (
        <TfReveal>
          <Link
            href={`/catalog/${shop.slug}/drops/${drop.id}`}
            className="tf-card-tactile group flex items-center gap-3 rounded-2xl border border-tf-accent/30 bg-tf-accent-soft px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tf-accent/15 text-tf-accent-ink">
              <Flame aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-tf-accent-ink">
                Latest drop
              </span>
              <span className="block truncate text-sm font-semibold text-tf-ink">
                {drop.title}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-5 shrink-0 text-tf-accent-ink transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </Link>
        </TfReveal>
      )}

      {combos.length > 0 && (
        <TfReveal>
          <TfComboRail combos={combos} shopSlug={shop.slug} />
        </TfReveal>
      )}

      {/* 6 ── Inventory, in whatever shape the seller has earned. */}
      <TfInventoryBlock
        mode={mode}
        products={products}
        shopId={shop.id}
        shopSlug={shop.slug}
        shopName={shop.name}
        shopVerified={shop.isVerified}
        whatsappNumber={shop.whatsappNumber}
      />

      {proofPlacement === "below" && proofRail}

      {/* 7 ── The seller in their own words. */}
      <TfSellerStory
        shopName={shop.name}
        aboutText={shop.aboutText ?? shop.description}
        locationLine={locationLine}
        instagram={shop.instagram}
        facebook={shop.facebook}
        tiktok={shop.tiktok}
        website={shop.website}
        whatsappGroupLink={shop.whatsappGroupLink}
      />

      <TfReveal>
        <div id="shop-reviews" />
        <TfReviewsBlock
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviewCount}
          shopName={shop.name}
        />
      </TfReveal>

      {/* 8 ── The banner, demoted. It is an enhancement, not a
             first-paint tax: 92 of 116 shops do not have one. */}
      {shop.bannerUrl && (
        <TfReveal>
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-stone-100 sm:aspect-[4/1]">
            <Image
              src={shop.bannerUrl}
              alt=""
              fill
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </TfReveal>
      )}

      <RecentlyViewedStrip shopSlug={shop.slug} fallbackProducts={fallbackProducts} />

      {/* 9 ── Owner surfaces. Server-gated, never CSS-hidden: this
             page is ISR-cached and must not leak seller nagging. */}
      {isOwner && <TfOwnerNudges nudges={ownerNudges} />}

      {isOwner && ownerDashboardSlug && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-4">
          <p className="text-sm text-tf-stone-600">Share your shop link.</p>
          <div className="flex gap-2">
            <TfButton asChild variant="secondary" size="sm">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out my shop on TradeFeed!\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Share2 aria-hidden="true" className="size-4" />
                Share
              </a>
            </TfButton>
            <TfButton asChild variant="secondary" size="sm">
              <Link href={`/dashboard/${ownerDashboardSlug}`}>Manage shop</Link>
            </TfButton>
          </div>
        </div>
      )}

      {showRecruitment && (
        <div className="rounded-xl bg-tf-deep p-6 text-center">
          <Store aria-hidden="true" className="mx-auto mb-2 size-6 text-emerald-300" />
          <h2 className="font-tf-display text-2xl font-semibold text-tf-surface">
            Sell on TradeFeed too
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-emerald-100/90">
            One photo, one link, orders on WhatsApp. 20 products free.
          </p>
          <TfButton asChild className="mt-4">
            <Link href="/create-shop">Create your free shop</Link>
          </TfButton>
        </div>
      )}

      {/* 10 ── One sticky order CTA, on every rung including zero.
              The old storefront gated this on products.length > 0,
              which left 43 shops with no persistent way to order. */}
      <div className="fixed inset-x-0 bottom-[3.5rem] z-30 px-4 pb-2 lg:hidden">
        <TfButton asChild variant="whatsapp" fullWidth size="lg" className="tf-slide-up shadow-tf-md">
          <TrackedWhatsAppLink
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            shopId={shop.id}
          >
            <MessageCircle aria-hidden="true" />
            Message {firstName} on WhatsApp
          </TrackedWhatsAppLink>
        </TfButton>
      </div>
    </div>
  );
}
