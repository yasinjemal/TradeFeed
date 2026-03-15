"use client";

// ============================================================
// Boost Dashboard — Shop featured listing purchase UI
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { purchaseShopBoostAction } from "@/app/actions/billing";

const BOOST_TIERS = [
  {
    weeks: 1,
    label: "1 Week",
    price: 19900,
    perWeek: 19900,
    savings: null,
  },
  {
    weeks: 2,
    label: "2 Weeks",
    price: 37810, // 5% off
    perWeek: 18905,
    savings: "Save 5%",
  },
  {
    weeks: 4,
    label: "4 Weeks",
    price: 67660, // 15% off
    perWeek: 16915,
    savings: "Save 15%",
    popular: true,
  },
] as const;

function formatRand(cents: number) {
  return `R${(cents / 100).toFixed(0)}`;
}

interface BoostDashboardProps {
  shopSlug: string;
  isBoosted: boolean;
  isAdminFeatured: boolean;
  daysRemaining: number;
  featuredUntil: string | null;
}

export function BoostDashboard({
  shopSlug,
  isBoosted,
  isAdminFeatured,
  daysRemaining,
  featuredUntil,
}: BoostDashboardProps) {
  const [selectedWeeks, setSelectedWeeks] = useState(4);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handlePurchase() {
    setError(null);
    startTransition(async () => {
      const result = await purchaseShopBoostAction(shopSlug, selectedWeeks);
      if (!result.success) {
        setError(result.error ?? "Failed to create checkout.");
        return;
      }
      if (result.checkoutUrl) {
        router.push(result.checkoutUrl);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <div className={`rounded-xl border p-6 ${
        isBoosted || isAdminFeatured
          ? "bg-amber-50 border-amber-200"
          : "bg-stone-50 border-stone-200"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            isBoosted || isAdminFeatured ? "bg-amber-100" : "bg-stone-200"
          }`}>
            {isBoosted || isAdminFeatured ? "⭐" : "💤"}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-stone-900">
              {isBoosted
                ? "Your shop is boosted!"
                : isAdminFeatured
                ? "Admin Featured"
                : "Not boosted"}
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {isBoosted && featuredUntil
                ? `Featured until ${new Date(featuredUntil).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} (${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining)`
                : isAdminFeatured
                ? "Your shop has been featured by the TradeFeed team."
                : "Boost your shop to appear in the Featured Shops section on the marketplace."}
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h3 className="font-semibold text-stone-900 mb-4">What you get</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: "🏪", text: "Featured in the marketplace shop showcase" },
            { icon: "📈", text: "Higher visibility to thousands of buyers" },
            { icon: "⭐", text: "Featured badge on your shop profile" },
            { icon: "🔝", text: "Priority placement in search results" },
          ].map((benefit) => (
            <div key={benefit.text} className="flex items-center gap-3 text-sm text-stone-700">
              <span className="text-lg">{benefit.icon}</span>
              {benefit.text}
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <h3 className="font-semibold text-stone-900 mb-4">Choose your boost duration</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {BOOST_TIERS.map((tier) => (
            <button
              key={tier.weeks}
              onClick={() => setSelectedWeeks(tier.weeks)}
              className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                selectedWeeks === tier.weeks
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              {"popular" in tier && tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Best Value
                </span>
              )}
              <div className="text-lg font-bold text-stone-900">{tier.label}</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-2">
                {formatRand(tier.price)}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {formatRand(tier.perWeek)}/week
              </div>
              {tier.savings && (
                <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  {tier.savings}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Button */}
      <div className="flex flex-col items-start gap-3">
        <button
          onClick={handlePurchase}
          disabled={isPending}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-lg ${
            isPending
              ? "bg-stone-300 text-stone-500 cursor-not-allowed"
              : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25"
          }`}
        >
          {isPending
            ? "Redirecting to payment..."
            : isBoosted
            ? `Extend Boost — ${formatRand(BOOST_TIERS.find((t) => t.weeks === selectedWeeks)?.price ?? 0)}`
            : `Boost My Shop — ${formatRand(BOOST_TIERS.find((t) => t.weeks === selectedWeeks)?.price ?? 0)}`}
        </button>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        <p className="text-xs text-stone-400">
          One-time payment via PayFast. No recurring charges.
          {isBoosted && " Purchasing again will extend your current boost."}
        </p>
      </div>
    </div>
  );
}
