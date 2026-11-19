// ============================================================
// Page — Billing Dashboard (/dashboard/[slug]/billing)
// ============================================================
// Shows current plan, usage, upgrade options, and billing status.
// Handles PayFast return URLs (?status=success/cancelled).
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlans, getShopSubscription, checkProductLimit } from "@/lib/db/subscriptions";
import { BillingDashboard } from "@/components/billing/billing-dashboard";
import { recordSellerMilestone } from "@/lib/analytics/seller-lifecycle";
import { hasPaidEntitlement } from "@/lib/billing/subscription-status";
import { cookies } from "next/headers";
import {
  PICKED_PLAN_COOKIE,
  parseHighlightPlan,
  paymentReturnCopy,
} from "@/lib/billing/upgrade-copy";

interface BillingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; plan?: string | string[] }>;
}

export default async function BillingPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return redirect("/sign-in");
  }
  if (!access) return redirect("/");

  const [plans, subscription, productLimit] = await Promise.all([
    getPlans(),
    getShopSubscription(access.shopId),
    checkProductLimit(access.shopId),
  ]);

  if (
    access.role === "OWNER" &&
    (!subscription || subscription.plan.slug === "free")
  ) {
    await recordSellerMilestone({
      userId: access.userId,
      step: "upgrade_viewed",
      source: "billing",
      shopId: access.shopId,
      shopSlug: slug,
    }).catch(() => false);
  }

  // ?plan= is set by whatever sent the seller here: an upgrade nudge,
  // the pricing page, or our own PayFast return URL. A seller who chose
  // a plan before they had a shop has it waiting in a cookie instead.
  const cookieStore = await cookies();
  const pickedPlan =
    parseHighlightPlan(query.plan) ??
    parseHighlightPlan(cookieStore.get(PICKED_PLAN_COOKIE)?.value);
  const paymentReturn = paymentReturnCopy({
    paidForPlan: pickedPlan,
    activePlanSlug: hasPaidEntitlement(subscription) ? subscription!.plan.slug : null,
    activePlanName: subscription?.plan.name ?? null,
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Billing</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage your subscription and view plan details
        </p>
      </div>

      {/* ── Status Banner (from PayFast return) ───────────── */}
      {query.status === "success" && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">{paymentReturn.title}</p>
            <p className="text-xs text-emerald-600">{paymentReturn.body}</p>
          </div>
        </div>
      )}
      {query.status === "cancelled" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Payment Cancelled</p>
            <p className="text-xs text-amber-600">No worries — you can upgrade anytime.</p>
          </div>
        </div>
      )}

      {/* ── Client Component ─────────────────────────────── */}
      <BillingDashboard
        plans={plans}
        subscription={subscription}
        productLimit={productLimit}
        shopSlug={slug}
        // After a payment the plan is theirs — nothing left to point at.
        highlightPlan={query.status === "success" ? null : pickedPlan}
      />
    </div>
  );
}
