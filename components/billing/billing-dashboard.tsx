// ============================================================
// Component — Billing Dashboard (Client)
// ============================================================
// Plan comparison, current usage, and upgrade/cancel actions.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { createCheckoutAction, cancelSubscriptionAction } from "@/app/actions/billing";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceInCents: number;
  productLimit: number;
  features: string | null;
  isActive: boolean;
}

interface Subscription {
  id: string;
  status: string;
  planId: string;
  plan: Plan;
  currentPeriodEnd: Date | null;
}

interface ProductLimit {
  allowed: boolean;
  current: number;
  limit: number;
  unlimited: boolean;
  planName: string;
}

interface BillingDashboardProps {
  plans: Plan[];
  subscription: Subscription | null;
  productLimit: ProductLimit;
  shopSlug: string;
}

export function BillingDashboard({
  plans,
  subscription,
  productLimit,
  shopSlug,
}: BillingDashboardProps) {
  const currentPlan = subscription?.plan;
  const isFreePlan = !currentPlan || currentPlan.slug === "free";

  return (
    <div className="space-y-6">
      {/* ── Current Plan Card ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">
                {currentPlan?.name ?? "Free"} Plan
              </h2>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isFreePlan
                  ? "bg-stone-100 text-stone-500"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                {subscription?.status ?? "ACTIVE"}
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              {isFreePlan
                ? "You're on the free plan with limited features."
                : `R${((currentPlan?.priceInCents ?? 0) / 100).toFixed(2)}/month`}
            </p>
          </div>
          {!isFreePlan && subscription?.currentPeriodEnd && (
            <p className="text-xs text-stone-400">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Usage meter */}
        <div className="bg-stone-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-600">Product Usage</span>
            <span className="text-xs text-stone-500">
              {productLimit.current} / {productLimit.unlimited ? "∞" : productLimit.limit}
            </span>
          </div>
          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                !productLimit.allowed
                  ? "bg-red-500"
                  : productLimit.current / (productLimit.limit || 1) > 0.8
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: productLimit.unlimited
                  ? "10%"
                  : `${Math.min((productLimit.current / productLimit.limit) * 100, 100)}%`,
              }}
            />
          </div>
          {!productLimit.allowed && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              ⚠️ Product limit reached — upgrade to add more products.
            </p>
          )}
        </div>
      </div>

      {/* ── Plan Comparison ──────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentPlan?.id === plan.id}
            isFreePlan={isFreePlan}
            shopSlug={shopSlug}
          />
        ))}

        {/* If no Pro plan exists yet, show a placeholder */}
        {plans.length < 2 && (
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border-2 border-dashed border-emerald-200 p-6 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3">🚀</span>
            <h3 className="text-sm font-bold text-emerald-800">Pro Plan</h3>
            <p className="text-xs text-emerald-600 mt-1">R199/month</p>
            <p className="text-xs text-stone-500 mt-3">
              Coming soon — unlimited products, priority support, and more!
            </p>
          </div>
        )}
      </div>

      {/* ── Cancel Section ───────────────────────────────── */}
      {!isFreePlan && (
        <CancelSection shopSlug={shopSlug} />
      )}
    </div>
  );
}

// ================================================================
// Sub-Components
// ================================================================

function PlanCard({
  plan,
  isCurrent,
  isFreePlan,
  shopSlug,
}: {
  plan: Plan;
  isCurrent: boolean;
  isFreePlan: boolean;
  shopSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const features: string[] = plan.features
    ? JSON.parse(plan.features) as string[]
    : [];

  const priceDisplay =
    plan.priceInCents === 0
      ? "Free"
      : `R${(plan.priceInCents / 100).toFixed(0)}`;

  const canUpgrade = isFreePlan && plan.priceInCents > 0 && !isCurrent;

  const handleUpgrade = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutAction(shopSlug, plan.slug);
      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error ?? "Failed to create checkout.");
      }
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-6 transition-all ${
        isCurrent
          ? "border-emerald-400 shadow-lg shadow-emerald-100/50"
          : "border-stone-200/60 hover:border-stone-300"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-stone-900">{plan.name}</h3>
        {isCurrent && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Current
          </span>
        )}
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold text-stone-900">{priceDisplay}</span>
        {plan.priceInCents > 0 && (
          <span className="text-sm text-stone-400 ml-1">/month</span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-stone-500">
          {plan.productLimit === 0
            ? "Unlimited products"
            : `Up to ${plan.productLimit} products`}
        </p>
      </div>

      {features.length > 0 && (
        <ul className="space-y-2 mb-5">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-xs text-stone-600">
              <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {canUpgrade && (
        <>
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? "Loading..." : `Upgrade to ${plan.name}`}
          </button>
          {error && (
            <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
          )}
        </>
      )}

      {isCurrent && plan.priceInCents === 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-stone-400">Your current plan</p>
        </div>
      )}
    </div>
  );
}

function CancelSection({ shopSlug }: { shopSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscriptionAction(shopSlug);
      if (result.success) {
        window.location.reload();
      } else {
        setError(result.error ?? "Failed to cancel.");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6">
      <h3 className="text-sm font-semibold text-stone-800 mb-2">Cancel Subscription</h3>
      <p className="text-xs text-stone-500 mb-4">
        You&apos;ll keep Pro features until the end of your billing period.
        After that, you&apos;ll be downgraded to the Free plan.
      </p>

      {!showConfirm ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Cancel subscription...
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Cancelling..." : "Yes, cancel"}
          </button>
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="text-xs text-stone-500 hover:text-stone-700 px-4 py-2"
          >
            Keep plan
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
