"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  PROMOTION_TIERS,
  PROMOTION_DURATIONS,
  calculatePromotionPrice,
  formatZAR,
  type PromotionTierKey,
} from "@/lib/config/promotions";
import { purchasePromotionAction, cancelPromotionAction } from "@/app/actions/promotions";
import type { PromotionWithProduct, PromotionStats } from "@/lib/db/promotions";

// ── Types ────────────────────────────────────────────────────

interface PromotableProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  minPriceCents: number;
  activePromotion: {
    id: string;
    tier: string;
    expiresAt: Date;
  } | null;
}

interface PromoteDashboardProps {
  shopSlug: string;
  products: PromotableProduct[];
  promotions: PromotionWithProduct[];
  stats: PromotionStats;
  status?: string;
}

// ── Tier Card ────────────────────────────────────────────────

const TIER_ICONS: Record<PromotionTierKey, string> = {
  BOOST: "🚀",
  FEATURED: "⭐",
  SPOTLIGHT: "💎",
};

const TIER_BORDERS: Record<PromotionTierKey, string> = {
  BOOST: "border-stone-300 hover:border-stone-500",
  FEATURED: "border-amber-300 hover:border-amber-500",
  SPOTLIGHT: "border-orange-300 hover:border-orange-500",
};

const TIER_SELECTED: Record<PromotionTierKey, string> = {
  BOOST: "border-stone-600 bg-stone-50 ring-2 ring-stone-200",
  FEATURED: "border-amber-500 bg-amber-50 ring-2 ring-amber-200",
  SPOTLIGHT: "border-orange-500 bg-orange-50 ring-2 ring-orange-200",
};

// ── Main Component ───────────────────────────────────────────

export function PromoteDashboard({
  shopSlug,
  products,
  promotions,
  stats,
  status,
}: PromoteDashboardProps) {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<PromotionTierKey>("BOOST");
  const [selectedWeeks, setSelectedWeeks] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const totalPrice = calculatePromotionPrice(selectedTier, selectedWeeks);
  const product = products.find((p) => p.id === selectedProduct);
  const promotableProducts = products.filter((p) => !p.activePromotion);

  function handleCheckout() {
    if (!selectedProduct) {
      setError("Please select a product to promote.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await purchasePromotionAction(
        shopSlug,
        selectedProduct,
        selectedTier,
        selectedWeeks,
      );

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleCancel(promotionId: string) {
    if (!confirm("Cancel this promotion? It will stop immediately with no refund.")) return;

    startTransition(async () => {
      const result = await cancelPromotionAction(shopSlug, promotionId);
      if (!result.success) {
        setError(result.error ?? "Failed to cancel.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* ── Status Banners ────────────────────────────── */}
      {status === "success" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Payment Successful!</p>
            <p className="text-xs text-emerald-600">Your promotion is now live on the marketplace! 🚀</p>
          </div>
        </div>
      )}
      {status === "cancelled" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Payment Cancelled</p>
            <p className="text-xs text-amber-600">No worries — you can promote your products anytime.</p>
          </div>
        </div>
      )}

      {/* ── Performance Stats ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Promotions" value={String(stats.activeCount)} icon="📢" />
        <StatCard label="Total Spent" value={formatZAR(stats.totalSpentCents)} icon="💰" />
        <StatCard label="Total Impressions" value={stats.totalImpressions.toLocaleString()} icon="👁️" />
        <StatCard
          label="Total Clicks"
          value={stats.totalClicks.toLocaleString()}
          icon="🖱️"
          sub={
            stats.totalImpressions > 0
              ? `${((stats.totalClicks / stats.totalImpressions) * 100).toFixed(1)}% CTR`
              : undefined
          }
        />
      </div>

      {/* ── New Promotion Form ────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Promote a Product</h2>
          <p className="text-sm text-stone-500 mt-1">
            Get more eyes on your products in the TradeFeed Marketplace.
          </p>
        </div>

        {promotableProducts.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <p className="text-lg font-medium">No products available to promote</p>
            <p className="text-sm mt-1">
              Products need at least one image and an active variant.
              {products.length > 0 && products.every((p) => p.activePromotion) && (
                <span> All your eligible products already have active promotions!</span>
              )}
            </p>
          </div>
        ) : (
          <>
            {/* Step 1: Pick a product */}
            <div>
              <label className="text-sm font-semibold text-stone-700 block mb-2">
                1. Select a product
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {promotableProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProduct(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      selectedProduct === p.id
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-900 truncate">{p.name}</p>
                      <p className="text-xs text-stone-500">
                        From {formatZAR(p.minPriceCents)}
                      </p>
                    </div>
                    {selectedProduct === p.id && (
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Pick a tier */}
            <div>
              <label className="text-sm font-semibold text-stone-700 block mb-2">
                2. Choose a promotion tier
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(Object.keys(PROMOTION_TIERS) as PromotionTierKey[]).map((tierKey) => {
                  const tier = PROMOTION_TIERS[tierKey];
                  const isSelected = selectedTier === tierKey;

                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setSelectedTier(tierKey)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected ? TIER_SELECTED[tierKey] : TIER_BORDERS[tierKey]
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{TIER_ICONS[tierKey]}</span>
                        <span className="text-lg font-bold text-stone-900">
                          {formatZAR(tier.pricePerWeekCents)}
                          <span className="text-xs font-normal text-stone-500">/wk</span>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-stone-900">{tier.name}</h3>
                      <p className="text-xs text-stone-500 mt-1 mb-3">{tier.description}</p>
                      <ul className="space-y-1">
                        {tier.features.map((f, i) => (
                          <li key={i} className="text-xs text-stone-600 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Pick duration */}
            <div>
              <label className="text-sm font-semibold text-stone-700 block mb-2">
                3. Select duration
              </label>
              <div className="flex gap-3">
                {PROMOTION_DURATIONS.map((d) => (
                  <button
                    key={d.weeks}
                    type="button"
                    onClick={() => setSelectedWeeks(d.weeks)}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                      selectedWeeks === d.weeks
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <p className="text-sm font-bold text-stone-900">{d.label}</p>
                    {d.discount > 0 && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">
                        Save {Math.round(d.discount * 100)}%
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Summary + Checkout */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-stone-500">Total</p>
                  <p className="text-2xl font-bold text-stone-900">
                    {formatZAR(totalPrice)}
                  </p>
                  {selectedWeeks > 1 && (
                    <p className="text-xs text-stone-500">
                      {formatZAR(Math.round(totalPrice / selectedWeeks))}/week
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-stone-500">
                  <p>{PROMOTION_TIERS[selectedTier].name} tier</p>
                  <p>{PROMOTION_DURATIONS.find((d) => d.weeks === selectedWeeks)?.label}</p>
                  {product && <p className="font-medium text-stone-700 mt-1">{product.name}</p>}
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isPending || !selectedProduct}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirecting to PayFast…
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    Pay {formatZAR(totalPrice)} via PayFast
                  </>
                )}
              </button>

              <p className="text-center text-xs text-stone-400 mt-2">
                Secure payment via PayFast. Your promotion starts immediately after payment.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Active & Past Promotions ──────────────────── */}
      {promotions.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Your Promotions</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {promotions.map((promo) => {
              const prices = promo.product.variants.map((v) => v.priceInCents);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const isActive = promo.status === "ACTIVE" && new Date(promo.expiresAt) > new Date();
              const daysLeft = isActive
                ? Math.max(0, Math.ceil((new Date(promo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : 0;
              const ctr = promo.impressions > 0
                ? ((promo.clicks / promo.impressions) * 100).toFixed(1)
                : "0.0";

              return (
                <div key={promo.id} className="p-4 flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-14 h-14 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                    {promo.product.images[0]?.url ? (
                      <Image
                        src={promo.product.images[0].url}
                        alt={promo.product.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {promo.product.name}
                      </p>
                      <TierBadge tier={promo.tier as PromotionTierKey} />
                      <StatusBadge status={promo.status} isActive={isActive} />
                    </div>
                    <p className="text-xs text-stone-500">
                      {formatZAR(promo.amountPaidCents)} paid
                      {isActive && ` · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
                    </p>
                  </div>

                  {/* Performance */}
                  <div className="hidden sm:flex items-center gap-6 text-center">
                    <div>
                      <p className="text-sm font-bold text-stone-900">{promo.impressions.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">Views</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{promo.clicks.toLocaleString()}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">Clicks</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{ctr}%</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">CTR</p>
                    </div>
                  </div>

                  {/* Cancel */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleCancel(promo.id)}
                      disabled={isPending}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium flex-shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-Components ───────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-stone-500">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-xl font-bold text-stone-900">{value}</p>
      {sub && <p className="text-xs text-emerald-600 font-medium mt-0.5">{sub}</p>}
    </div>
  );
}

function TierBadge({ tier }: { tier: PromotionTierKey }) {
  const config = PROMOTION_TIERS[tier];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.badge.color}`}>
      {config.badge.label}
    </span>
  );
}

function StatusBadge({ status, isActive }: { status: string; isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
        Live
      </span>
    );
  }

  if (status === "EXPIRED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-500">
        Expired
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">
      Cancelled
    </span>
  );
}
