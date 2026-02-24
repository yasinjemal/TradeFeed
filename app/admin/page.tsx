// ============================================================
// Page — Platform Admin Dashboard (/admin)
// ============================================================
// Cross-tenant admin view for seller verification,
// platform metrics, and shop management.
// ============================================================

import { getAdminStats, getAdminShops } from "@/lib/db/admin";
import { AdminShopList } from "@/components/admin/admin-shop-list";

interface AdminPageProps {
  searchParams: Promise<{ search?: string; page?: string; filter?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);
  const filter = (params.filter || "all") as "all" | "verified" | "unverified" | "inactive";

  const [stats, shopData] = await Promise.all([
    getAdminStats(),
    getAdminShops({ search, page, filter }),
  ]);

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════ */}
      {/* Header                                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
        <p className="text-stone-500 text-sm mt-1">
          Manage sellers, verify shops, and monitor platform health.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Stats Grid                                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Shops" value={stats.totalShops} color="stone" />
        <StatCard label="Active" value={stats.activeShops} color="emerald" />
        <StatCard label="Verified" value={stats.verifiedShops} color="blue" />
        <StatCard label="Products" value={stats.totalProducts} color="purple" />
        <StatCard label="Users" value={stats.totalUsers} color="amber" />
        <StatCard label="Pro Subs" value={stats.proSubscriptions} color="rose" />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Shop Management                                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <AdminShopList
        shops={shopData.shops}
        total={shopData.total}
        page={shopData.page}
        totalPages={shopData.totalPages}
        currentSearch={search}
        currentFilter={filter}
      />
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    stone: "bg-stone-900 border-stone-800 text-stone-300",
    emerald: "bg-emerald-950/50 border-emerald-900/50 text-emerald-400",
    blue: "bg-blue-950/50 border-blue-900/50 text-blue-400",
    purple: "bg-purple-950/50 border-purple-900/50 text-purple-400",
    amber: "bg-amber-950/50 border-amber-900/50 text-amber-400",
    rose: "bg-rose-950/50 border-rose-900/50 text-rose-400",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colorMap[color] || colorMap.stone}`}
    >
      <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
