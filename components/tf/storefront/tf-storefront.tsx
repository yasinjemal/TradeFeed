import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, MessageCircle, PackageOpen, Share2, Store } from "lucide-react";

import { FollowShopButton } from "@/components/catalog/follow-shop-button";
import { RecentlyViewedStrip } from "@/components/catalog/recently-viewed-strip";
import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import { TfReveal } from "@/components/tf/motion/tf-reveal";
import type { SellerTrustStats } from "@/lib/trust/seller-stats";
import { TfStorefrontGrid, type TfGridProduct } from "./tf-product-grid";
import { TfReviewsBlock, type TfReview } from "./tf-reviews";
import { TfComboRail, type TfCombo } from "./tf-combo-rail";
import { TfFulfillmentPromise } from "@/components/tf/fulfillment-promise";
import { TrackedWhatsAppLink } from "@/components/analytics/tracked-whatsapp-link";

// ============================================================
// TfStorefront — the Verified Seller card is the hero here.
// Avatar, name, tick, orders fulfilled, member-since, location,
// Follow — then the grid, about, and a reviews block that holds
// its own even with one review. Sticky WhatsApp CTA on mobile.
//
// POPIA: the seller's number is never printed on the page; the
// wa.me handoff only fires when the buyer taps the order CTA.
// ============================================================

export interface TfStorefrontProps {
  shop: {
    id: string;
    slug: string;
    name: string;
    isVerified: boolean;
    logoUrl: string | null;
    bannerUrl: string | null;
    city: string | null;
    province: string | null;
    aboutText: string | null;
    description: string | null;
    whatsappNumber: string;
    createdAt: Date;
    deliveryEnabled: boolean;
    collectionEnabled: boolean;
    dispatchWindow: string;
    deliveryNote: string | null;
    returnPolicy: string | null;
  };
  products: TfGridProduct[];
  combos: TfCombo[];
  /** Most recent stock drop, if any */
  drop: { id: string; title: string; itemCount: number } | null;
  /** Fallback products for the recently-viewed strip (new visitors) */
  fallbackProducts: {
    productId: string;
    productName: string;
    imageUrl: string | null;
    priceInCents: number;
  }[];
  /** Absolute share URL for the owner CTA (env-derived, never hardcoded) */
  shareUrl: string;
  trustStats: SellerTrustStats | null;
  reviews: TfReview[];
  avgRating: number | null;
  reviewCount: number;
  isOwner: boolean;
  ownerDashboardSlug: string | null;
  showRecruitment: boolean;
}

export function TfStorefront({
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
}: TfStorefrontProps) {
  const location = [shop.city, shop.province].filter(Boolean).join(", ") || undefined;
  const memberSince = shop.createdAt.getFullYear();
  const waNumber = shop.whatsappNumber.replace(/[^0-9]/g, "");
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi ${shop.name}! I'm browsing your TradeFeed shop and I'd like to order.`,
  )}`;
  const about = shop.aboutText ?? shop.description;

  return (
    <div className="space-y-5 pb-20">
      <TfFonts />

      {/* ── Shop banner, when the seller uploaded one ──── */}
      {shop.bannerUrl && (
        <TfReveal>
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-stone-100 sm:aspect-[4/1]">
            <Image
              src={shop.bannerUrl}
              alt={`${shop.name} banner`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </TfReveal>
      )}

      {/* ── Hero: the Verified Seller card ─────────────── */}
      <TfReveal>
      <TfVerifiedSellerCard
        variant="hero"
        name={shop.name}
        verified={shop.isVerified}
        avatarUrl={shop.logoUrl}
        ordersFulfilled={trustStats?.ordersFulfilled}
        memberSince={memberSince}
        location={location}
        action={<FollowShopButton shopId={shop.id} />}
      />
      </TfReveal>

      {/* Fulfilment proof, only when there's real data */}
      {trustStats && trustStats.ordersFulfilled > 0 && (
        <TfReveal delay={100}>
          <TfTrustBar ordersFulfilled={trustStats.ordersFulfilled} compact />
        </TfReveal>
      )}

      <TfReveal delay={130}>
        <TfFulfillmentPromise
          deliveryEnabled={shop.deliveryEnabled}
          collectionEnabled={shop.collectionEnabled}
          dispatchWindow={shop.dispatchWindow}
          deliveryNote={shop.deliveryNote}
          returnPolicy={shop.returnPolicy}
        />
      </TfReveal>

      {/* ── Latest stock drop ──────────────────────────── */}
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
              <span className="block truncate text-sm font-semibold text-tf-ink">{drop.title}</span>
              <span className="block text-[11px] text-tf-stone-600">
                {drop.itemCount} product{drop.itemCount === 1 ? "" : "s"}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-5 shrink-0 text-tf-accent-ink transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </Link>
        </TfReveal>
      )}

      {/* ── Combo deals ────────────────────────────────── */}
      {combos.length > 0 && (
        <TfReveal>
          <TfComboRail combos={combos} shopSlug={shop.slug} />
        </TfReveal>
      )}

      {/* ── Products ───────────────────────────────────── */}
      {products.length === 0 ? (
        <TfEmptyState
          icon={<PackageOpen />}
          title={`${shop.name} is setting up`}
          description="Their catalogue is on its way. Ask on WhatsApp — they may have stock that isn't listed yet."
          action={
            <TfButton asChild variant="whatsapp">
              <TrackedWhatsAppLink
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                shopId={shop.id}
              >
                <MessageCircle aria-hidden="true" />
                Ask on WhatsApp
              </TrackedWhatsAppLink>
            </TfButton>
          }
        />
      ) : (
        <TfStorefrontGrid
          products={products}
          shopSlug={shop.slug}
          sellerName={shop.name}
          sellerVerified={shop.isVerified}
        />
      )}

      {/* ── About ──────────────────────────────────────── */}
      {about && (
        <TfReveal as="section"
          aria-label={`About ${shop.name}`}
          className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm"
        >
          <h2 className="font-tf-display text-2xl font-semibold text-tf-ink">
            About {shop.name}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tf-stone-600">
            {about}
          </p>
        </TfReveal>
      )}

      {/* ── Reviews ────────────────────────────────────── */}
      <TfReveal>
      <TfReviewsBlock
        reviews={reviews}
        avgRating={avgRating}
        reviewCount={reviewCount}
        shopName={shop.name}
      />
      </TfReveal>

      {/* ── Recently viewed / popular from this seller ── */}
      <RecentlyViewedStrip shopSlug={shop.slug} fallbackProducts={fallbackProducts} />

      {/* ── Owner / recruitment footers ────────────────── */}
      {isOwner && ownerDashboardSlug && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-4">
          <p className="text-sm text-tf-stone-600">
            This is how buyers see your shop.
          </p>
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

      {/* ── Sticky WhatsApp CTA (mobile, above bottom nav) ── */}
      {products.length > 0 && (
        <div className="fixed inset-x-0 bottom-[3.5rem] z-30 px-4 pb-2 lg:hidden">
          <TfButton asChild variant="whatsapp" fullWidth size="lg" className="shadow-tf-md">
            <TrackedWhatsAppLink
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              shopId={shop.id}
            >
              <MessageCircle aria-hidden="true" />
              Message {shop.name} on WhatsApp
            </TrackedWhatsAppLink>
          </TfButton>
        </div>
      )}
    </div>
  );
}
