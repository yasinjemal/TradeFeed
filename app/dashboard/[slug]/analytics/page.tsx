// ============================================================
// Page — Analytics Dashboard (/dashboard/[slug]/analytics)
// ============================================================
// Seller-facing analytics showing catalog views, WhatsApp clicks,
// conversion rate, top products, and a daily trend chart.
//
// DESIGN: Clean stat cards + mini bar chart + top products list.
// Data comes from the lightweight AnalyticsEvent table.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAnalyticsOverview,
  getDailyAnalytics,
  getTopProducts,
  getUniqueVisitors,
  getConversionFunnel,
  getProductPerformance,
} from "@/lib/db/analytics";
import { getDailyRevenue } from "@/lib/db/revenue";
import { getShopSubscription, isTrialActive } from "@/lib/db/subscriptions";
import { getShopPromotionStats, getPromotionFunnel } from "@/lib/db/promotions";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { ProFeatureGate } from "@/components/billing/pro-feature-gate";

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ days?: string }>;
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: AnalyticsPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return redirect("/sign-in");
  }
  if (!access) return redirect("/");

  const days = query.days === "7" ? 7 : query.days === "90" ? 90 : 30;

  const [overview, daily, topProducts, uniqueVisitors, subscription, promotionStats, promotionFunnel, conversionFunnel, productPerformance, dailyRevenue] = await Promise.all([
    getAnalyticsOverview(access.shopId, days),
    getDailyAnalytics(access.shopId, days),
    getTopProducts(access.shopId, days),
    getUniqueVisitors(access.shopId, days),
    getShopSubscription(access.shopId),
    getShopPromotionStats(access.shopId),
    getPromotionFunnel(access.shopId),
    getConversionFunnel(access.shopId, days),
    getProductPerformance(access.shopId, days),
    getDailyRevenue(access.shopId, days),
  ]);

  const isPro = (!!subscription?.plan.slug && subscription.plan.slug !== "free") || isTrialActive(subscription).active;

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-sm text-stone-500 mt-1">
          Track your catalog performance and buyer engagement
        </p>
      </div>

      {/* ── Client Component (handles period toggle + charts) */}
      <ProFeatureGate
        hasAccess={isPro}
        feature="Advanced Analytics"
        description="Get detailed insights on views, clicks, conversions, and top products. Upgrade to Pro to unlock."
        shopSlug={slug}
      >
        <AnalyticsDashboard
          overview={overview}
          daily={daily}
          topProducts={topProducts}
          uniqueVisitors={uniqueVisitors}
          currentDays={days}
          shopSlug={slug}
          promotionStats={promotionStats}
          promotionFunnel={promotionFunnel}
          conversionFunnel={conversionFunnel}
          productPerformance={productPerformance}
          dailyRevenue={dailyRevenue}
        />
      </ProFeatureGate>
    </div>
  );
}
