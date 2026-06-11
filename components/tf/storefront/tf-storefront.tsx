import * as React from "react";
import Link from "next/link";
import { MessageCircle, PackageOpen, Store } from "lucide-react";

import { FollowShopButton } from "@/components/catalog/follow-shop-button";
import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";
import { TfFonts } from "@/components/tf/tf-fonts";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";
import type { SellerTrustStats } from "@/lib/trust/seller-stats";
import { TfStorefrontGrid, type TfGridProduct } from "./tf-product-grid";
import { TfReviewsBlock, type TfReview } from "./tf-reviews";

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
    city: string | null;
    province: string | null;
    aboutText: string | null;
    description: string | null;
    whatsappNumber: string;
    createdAt: Date;
  };
  products: TfGridProduct[];
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

      {/* ── Hero: the Verified Seller card ─────────────── */}
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

      {/* Fulfilment proof, only when there's real data */}
      {trustStats && trustStats.ordersFulfilled > 0 && (
        <TfTrustBar ordersFulfilled={trustStats.ordersFulfilled} compact />
      )}

      {/* ── Products ───────────────────────────────────── */}
      {products.length === 0 ? (
        <TfEmptyState
          icon={<PackageOpen />}
          title={`${shop.name} is setting up`}
          description="Their catalogue is on its way. Ask on WhatsApp — they may have stock that isn't listed yet."
          action={
            <TfButton asChild variant="whatsapp">
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden="true" />
                Ask on WhatsApp
              </a>
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
        <section
          aria-label={`About ${shop.name}`}
          className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 shadow-tf-sm"
        >
          <h2 className="font-tf-display text-lg font-semibold text-tf-ink">
            About {shop.name}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-tf-stone-600">
            {about}
          </p>
        </section>
      )}

      {/* ── Reviews ────────────────────────────────────── */}
      <TfReviewsBlock
        reviews={reviews}
        avgRating={avgRating}
        reviewCount={reviewCount}
        shopName={shop.name}
      />

      {/* ── Owner / recruitment footers ────────────────── */}
      {isOwner && ownerDashboardSlug && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-4">
          <p className="text-sm text-tf-stone-600">
            This is how buyers see your shop.
          </p>
          <TfButton asChild variant="secondary" size="sm">
            <Link href={`/dashboard/${ownerDashboardSlug}`}>Manage shop</Link>
          </TfButton>
        </div>
      )}

      {showRecruitment && (
        <div className="rounded-xl bg-tf-deep p-6 text-center">
          <Store aria-hidden="true" className="mx-auto mb-2 size-6 text-emerald-300" />
          <h2 className="font-tf-display text-lg font-semibold text-tf-surface">
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
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden="true" />
              Message {shop.name} on WhatsApp
            </a>
          </TfButton>
        </div>
      )}
    </div>
  );
}
