// ============================================================
// Page — Promote Products (/dashboard/[slug]/promote)
// ============================================================
// Sellers buy promoted listings for their products.
// Shows active promotions, performance stats, and purchase flow.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getShopPromotions,
  getShopPromotionStats,
  getPromotableProducts,
  getPromotionPerformance,
  getPromotionComparison,
} from "@/lib/db/promotions";
import { PromoteDashboard } from "@/components/promotions/promote-dashboard";

interface PromotePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function PromotePage({
  params,
  searchParams,
}: PromotePageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return redirect("/sign-in");
  }
  if (!access) return redirect("/");

  // Fetch all data in parallel
  const [promotions, stats, products, performance, comparison] = await Promise.all([
    getShopPromotions(access.shopId),
    getShopPromotionStats(access.shopId),
    getPromotableProducts(access.shopId),
    getPromotionPerformance(access.shopId),
    getPromotionComparison(access.shopId),
  ]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Promote Your Products
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Get your products seen by more buyers on the TradeFeed Marketplace.
          Pay per week — cancel anytime.
        </p>
      </div>

      {/* ── Client Component ─────────────────────────────── */}
      <PromoteDashboard
        shopSlug={slug}
        products={products}
        promotions={promotions}
        stats={stats}
        performance={performance}
        comparison={comparison}
        status={query.status}
      />
    </div>
  );
}
