// ============================================================
// Component — Billing Dashboard (Client)
// ============================================================
// Plan comparison, current usage, and upgrade/cancel actions.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
  upgradeStatus?: string;
  requestedPlanSlug?: string | null;
  manualPaymentMethod?: string | null;
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
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {currentPlan?.name ?? "Free"} Plan
              </h2>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isFreePlan
                  ? "bg-slate-100 text-slate-500"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                {subscription?.status ?? "ACTIVE"}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isFreePlan
                ? "You're on the free plan with limited features."
                : `R${((currentPlan?.priceInCents ?? 0) / 100).toFixed(2)}/month`}
            </p>
          </div>
          {!isFreePlan && subscription?.currentPeriodEnd && (
            <p className="text-xs text-slate-400">
              Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-ZA", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Usage meter */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Product Usage</span>
            <span className="text-xs text-slate-500">
              {productLimit.current} / {productLimit.unlimited ? "∞" : productLimit.limit}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
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

      {/* ── Upgrade Request Status Banner ────────────────── */}
      {subscription?.upgradeStatus === "UNDER_REVIEW" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Upgrade Under Review</p>
            <p className="text-xs text-amber-700 mt-1">
              Your upgrade request to <span className="font-medium">{subscription.requestedPlanSlug}</span> is being reviewed.
              Payment via <span className="font-medium">{subscription.manualPaymentMethod}</span>.
            </p>
          </div>
        </div>
      )}

      {subscription?.upgradeStatus === "APPROVED" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Upgrade Approved! 🎉</p>
            <p className="text-xs text-emerald-700 mt-1">Your plan has been upgraded successfully.</p>
          </div>
        </div>
      )}

      {subscription?.upgradeStatus === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Upgrade Request Rejected</p>
            <p className="text-xs text-red-700 mt-1">
              Your upgrade request was not approved. Please contact support or try again.
            </p>
            <Link
              href={`/dashboard/${shopSlug}/billing/upgrade`}
              className="inline-block mt-2 text-xs text-red-600 hover:text-red-700 font-medium underline"
            >
              Submit a new request →
            </Link>
          </div>
        </div>
      )}

      {/* ── Pro Social Proof ─────────────────────────────── */}
      {isFreePlan && (
        <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl border border-amber-200/60 p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📈</span>
            <div>
              <p className="text-sm font-bold text-slate-800">Pro sellers earn 3× more on average</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Unlimited products, promoted listings, and the trusted ⭐ PRO badge help you sell more.
                For less than R7/day — one sale covers it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan Comparison ──────────────────────────────── */}
      <div className={`grid gap-4 ${
        plans.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
        plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
      }`}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={currentPlan?.id === plan.id}
            currentPlanPrice={currentPlan?.priceInCents ?? 0}
            shopSlug={shopSlug}
          />
        ))}
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
  currentPlanPrice,
  shopSlug,
}: {
  plan: Plan;
  isCurrent: boolean;
  currentPlanPrice: number;
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

  const canUpgrade = !isCurrent && plan.priceInCents > currentPlanPrice;
  const isAiPlan = plan.slug === "pro-ai";
  const isPopular = plan.slug === "starter";

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
      className={`bg-white rounded-2xl border-2 p-6 transition-all flex flex-col ${
        isCurrent
          ? "border-emerald-400 shadow-lg shadow-emerald-100/50"
          : isAiPlan
            ? "border-violet-200 hover:border-violet-300"
            : isPopular
              ? "border-emerald-200 hover:border-emerald-300"
              : "border-slate-200/60 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
        {isCurrent && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Current
          </span>
        )}
        {!isCurrent && isPopular && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
            Popular
          </span>
        )}
        {!isCurrent && isAiPlan && (
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
            ✨ AI
          </span>
        )}
      </div>

      <div className="mb-4">
        <span className="text-3xl font-bold text-slate-900">{priceDisplay}</span>
        {plan.priceInCents > 0 && (
          <span className="text-sm text-slate-400 ml-1">/month</span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500">
          {plan.productLimit === 0
            ? "Unlimited products"
            : `Up to ${plan.productLimit} products`}
        </p>
      </div>

      {features.length > 0 && (
        <ul className="space-y-2 mb-5 flex-1">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-xs text-slate-600">
              <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isAiPlan ? "text-violet-500" : "text-emerald-500"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      )}

      {canUpgrade && (
        <Link
          href={`/dashboard/${shopSlug}/billing/upgrade?plan=${plan.slug}`}
          className={`block w-full text-center text-white text-sm font-medium py-2.5 rounded-xl transition-all active:scale-[0.98] ${
            isAiPlan
              ? "bg-violet-600 hover:bg-violet-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          Upgrade to {plan.name}
        </Link>
      )}

      {isCurrent && plan.priceInCents === 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-slate-400">Your current plan</p>
        </div>
      )}

      {isCurrent && plan.priceInCents > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-emerald-600 font-medium">✓ Active</p>
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
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Cancel Subscription</h3>
      <p className="text-xs text-slate-500 mb-4">
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
            className="text-xs text-slate-500 hover:text-slate-700 px-4 py-2"
          >
            Keep plan
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
