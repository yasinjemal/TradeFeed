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
} from "@/lib/db/analytics";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

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

  const days = query.days === "7" ? 7 : 30;

  const [overview, daily, topProducts, uniqueVisitors] = await Promise.all([
    getAnalyticsOverview(access.shopId, days),
    getDailyAnalytics(access.shopId, days),
    getTopProducts(access.shopId, days),
    getUniqueVisitors(access.shopId, days),
  ]);

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
      <AnalyticsDashboard
        overview={overview}
        daily={daily}
        topProducts={topProducts}
        uniqueVisitors={uniqueVisitors}
        currentDays={days}
        shopSlug={slug}
      />
    </div>
  );
}
