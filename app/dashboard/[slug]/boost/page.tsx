// ============================================================
// Page — Boost Shop (/dashboard/[slug]/boost)
// ============================================================
// Sellers can purchase featured placement on the marketplace.
// Shows current boost status and pricing tiers.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getShopBoostStatus } from "@/lib/db/shops";
import { BoostDashboard } from "@/components/shop/boost-dashboard";

interface BoostPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function BoostPage({ params, searchParams }: BoostPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return redirect("/sign-in");
  }
  if (!access) return redirect("/");

  const boostStatus = await getShopBoostStatus(access.shopId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">
          Boost Your Shop
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Get featured on the TradeFeed Marketplace and reach more buyers.
        </p>
      </div>

      {query.status === "success" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          🎉 Payment successful! Your shop boost will be activated shortly.
        </div>
      )}
      {query.status === "cancelled" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Payment was cancelled. You can try again whenever you&apos;re ready.
        </div>
      )}

      <BoostDashboard
        shopSlug={slug}
        isBoosted={boostStatus?.isBoosted ?? false}
        isAdminFeatured={boostStatus?.isAdminFeatured ?? false}
        daysRemaining={boostStatus?.daysRemaining ?? 0}
        featuredUntil={boostStatus?.featuredUntil?.toISOString() ?? null}
      />
    </div>
  );
}
