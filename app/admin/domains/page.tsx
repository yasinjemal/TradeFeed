// ============================================================
// Page — Admin Custom Domains (/admin/domains)
// ============================================================
// Platform admin overview of all custom domains.
// Shows active, pending, error states with SSL status.
// Allows quick troubleshooting and domain management.
// ============================================================

import { db } from "@/lib/db";

export default async function AdminDomainsPage() {
  const shops = await db.shop.findMany({
    where: { customDomain: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      customDomain: true,
      domainStatus: true,
      domainVerifiedAt: true,
      isActive: true,
      subscription: {
        select: { plan: { select: { name: true, slug: true } } },
      },
    },
    orderBy: { customDomain: "asc" },
  });

  const activeCount = shops.filter((s) => s.domainStatus === "ACTIVE").length;
  const pendingCount = shops.filter((s) => s.domainStatus === "PENDING").length;
  const errorCount = shops.filter((s) => s.domainStatus === "ERROR").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Custom Domains</h1>
        <p className="text-stone-500 text-sm mt-1">
          Monitor and manage custom domains across all Pro sellers.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DomainStat label="Total" value={shops.length} color="stone" />
        <DomainStat label="Active" value={activeCount} color="emerald" />
        <DomainStat label="Pending" value={pendingCount} color="amber" />
        <DomainStat label="Errors" value={errorCount} color="red" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-stone-800 bg-stone-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-800">
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Domain</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Shop</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Verified</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Shop Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {shops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-600">
                    No custom domains configured yet.
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <a
                        href={`https://${shop.customDomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {shop.customDomain}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-stone-300">{shop.name}</span>
                      <span className="text-stone-600 text-xs ml-2">/{shop.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-stone-400">
                        {shop.subscription?.plan?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <DomainStatusBadge status={shop.domainStatus} />
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {shop.domainVerifiedAt
                        ? new Date(shop.domainVerifiedAt).toLocaleDateString("en-ZA")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {shop.isActive ? (
                        <span className="text-xs text-emerald-500">✓</span>
                      ) : (
                        <span className="text-xs text-red-500">✗</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DomainStat({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    stone: "text-stone-300 border-stone-800",
    emerald: "text-emerald-400 border-emerald-900/50",
    amber: "text-amber-400 border-amber-900/50",
    red: "text-red-400 border-red-900/50",
  };
  return (
    <div className={`rounded-xl border bg-stone-900/50 p-4 ${colorMap[color] ?? colorMap.stone}`}>
      <p className="text-xs text-stone-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorMap[color]?.split(" ")[0]}`}>{value}</p>
    </div>
  );
}

function DomainStatusBadge({ status }: { status: string | null }) {
  if (status === "ACTIVE") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">🟢 Active</span>;
  }
  if (status === "PENDING") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full">🟡 Pending</span>;
  }
  if (status === "ERROR") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full">🔴 Error</span>;
  }
  return <span className="text-xs text-stone-600">—</span>;
}
