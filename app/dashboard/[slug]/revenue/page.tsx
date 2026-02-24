// ============================================================
// Dashboard — Revenue Page (Server Component)
// ============================================================
// Shows revenue overview, trends, top products, and breakdowns.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import {
  getRevenueOverview,
  getDailyRevenue,
  getTopProductsByRevenue,
  getRevenueByStatus,
} from "@/lib/db/revenue";
import { RevenueDashboard } from "@/components/revenue/revenue-dashboard";

interface RevenuePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ days?: string }>;
}

export default async function RevenuePage({ params, searchParams }: RevenuePageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const access = await requireShopAccess(slug);
  if (!access) notFound();

  const days = query.days === "7" ? 7 : query.days === "90" ? 90 : 30;

  const [overview, daily, topProducts, byStatus] = await Promise.all([
    getRevenueOverview(access.shopId, days),
    getDailyRevenue(access.shopId, days),
    getTopProductsByRevenue(access.shopId, days),
    getRevenueByStatus(access.shopId),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Revenue</h1>
        <p className="text-sm text-stone-500 mt-1">
          Track your sales, revenue trends, and top-performing products
        </p>
      </div>

      <RevenueDashboard
        overview={overview}
        daily={daily}
        topProducts={topProducts}
        byStatus={byStatus}
        days={days}
        shopSlug={slug}
      />
    </div>
  );
}
