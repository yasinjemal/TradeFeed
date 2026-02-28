// ============================================================
// Page — Upgrade Plan (/dashboard/[slug]/billing/upgrade)
// ============================================================
// Manual upgrade flow: seller selects payment method,
// enters reference, optionally uploads proof, submits request.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlans, getShopSubscription } from "@/lib/db/subscriptions";
import { getActivePaymentMethods } from "@/lib/db/manual-payments";
import { UpgradeForm } from "@/components/billing/upgrade-form";
import Link from "next/link";

interface UpgradePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}

export default async function UpgradePage({
  params,
  searchParams,
}: UpgradePageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return redirect("/sign-in");
  }
  if (!access) return redirect("/");

  // Only OWNER can upgrade
  if (access.role !== "OWNER") {
    return redirect(`/dashboard/${slug}/billing`);
  }

  const [plans, subscription, paymentMethods] = await Promise.all([
    getPlans(),
    getShopSubscription(access.shopId),
    getActivePaymentMethods(),
  ]);

  if (!subscription) return redirect(`/dashboard/${slug}/billing`);

  // If already has a pending request, show status instead
  if (subscription.upgradeStatus === "UNDER_REVIEW") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Link
            href={`/dashboard/${slug}/billing`}
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← Back to Billing
          </Link>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-amber-800">Upgrade Under Review</h2>
          <p className="text-sm text-amber-700 mt-2">
            Your upgrade request to <span className="font-semibold">{subscription.requestedPlanSlug}</span> is being reviewed.
            We&apos;ll activate your plan once payment is confirmed.
          </p>
          <div className="mt-4 space-y-1 text-xs text-amber-600">
            <p>Payment method: <span className="font-medium">{subscription.manualPaymentMethod}</span></p>
            <p>Reference: <span className="font-medium">{subscription.paymentReference}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Filter to only show paid plans the user isn't already on
  const upgradePlans = plans.filter(
    (p) => p.priceInCents > 0 && p.slug !== subscription.plan.slug,
  );

  // Pre-select plan from query param or default to first upgrade plan
  const selectedPlanSlug = query.plan ?? upgradePlans[0]?.slug ?? "";

  if (paymentMethods.length === 0) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Link
            href={`/dashboard/${slug}/billing`}
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← Back to Billing
          </Link>
        </div>

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
          <span className="text-3xl block mb-3">🔧</span>
          <h2 className="text-lg font-bold text-stone-800">Upgrades Coming Soon</h2>
          <p className="text-sm text-stone-500 mt-2">
            Manual payment methods are being configured. Please check back shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/dashboard/${slug}/billing`}
          className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          ← Back to Billing
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-3">Upgrade Your Plan</h1>
        <p className="text-sm text-stone-500 mt-1">
          Choose a plan, make payment, and submit your reference. We&apos;ll activate your upgrade within 24 hours.
        </p>
      </div>

      <UpgradeForm
        shopSlug={slug}
        plans={upgradePlans}
        paymentMethods={paymentMethods}
        defaultPlanSlug={selectedPlanSlug}
        currentPlanName={subscription.plan.name}
      />
    </div>
  );
}
