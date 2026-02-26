// ============================================================
// Admin Order List — Client Component
// ============================================================
// Cross-tenant order overview with stats cards, search,
// status filter, and CSV export.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalCents: number;
  itemCount: number;
  buyerName: string | null;
  buyerPhone: string | null;
  createdAt: Date;
  shop: { id: string; name: string; slug: string };
  items: { productName: string; option1Value: string; option2Value: string | null; priceInCents: number; quantity: number }[];
}

interface OrderStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  pending: number;
  totalRevenueCents: number;
}

interface AdminOrderListProps {
  orders: AdminOrder[];
  total: number;
  page: number;
  totalPages: number;
  stats: OrderStats;
  currentSearch: string;
  currentStatus: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  CONFIRMED: "bg-blue-500/15 text-blue-400",
  PROCESSING: "bg-purple-500/15 text-purple-400",
  SHIPPED: "bg-cyan-500/15 text-cyan-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

const STATUS_OPTIONS = ["all", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export function AdminOrderList({
  orders,
  total,
  page,
  totalPages,
  stats,
  currentSearch,
  currentStatus,
}: AdminOrderListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [exporting, setExporting] = useState(false);

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => router.push(`/admin/orders?${params.toString()}`));
  }

  function formatCurrency(cents: number) {
    return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/export/orders");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export orders.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Orders" value={stats.total} color="stone" />
        <StatCard label="Today" value={stats.today} color="blue" />
        <StatCard label="This Week" value={stats.thisWeek} color="purple" />
        <StatCard label="This Month" value={stats.thisMonth} color="cyan" />
        <StatCard label="Pending" value={stats.pending} color="amber" />
        <StatCard label="Revenue" value={formatCurrency(stats.totalRevenueCents)} color="emerald" />
      </div>

      {/* Search + Filters + Export */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search, page: "" });
          }}
          className="flex-1"
        >
          <input
            type="text"
            placeholder="Search order #, buyer name, phone, or shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
        </form>
        <select
          value={currentStatus}
          onChange={(e) => navigate({ status: e.target.value, page: "" })}
          className="px-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All Statuses" : s}
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {exporting ? "Exporting..." : "📥 Export CSV"}
        </button>
      </div>

      {/* Summary */}
      <p className="text-xs text-stone-600">{total} order{total !== 1 ? "s" : ""} found</p>

      {/* Order Table */}
      <div className="border border-stone-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-900/80 text-stone-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Shop</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Buyer</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-stone-600">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-900/40 transition-colors group">
                  <td className="px-4 py-3">
                    <span className="font-mono text-stone-200 text-xs">{order.orderNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-stone-300 text-sm">{order.shop.name}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div>
                      <p className="text-stone-300 text-sm">{order.buyerName}</p>
                      <p className="text-stone-600 text-xs">{order.buyerPhone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-stone-500 text-xs">{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-stone-200 font-medium text-sm">
                      {formatCurrency(order.totalCents)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[order.status] || "bg-stone-800 text-stone-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs hidden lg:table-cell">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(page - 1) })}
              disabled={page <= 1 || isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-stone-400 border border-stone-800 hover:border-stone-700 transition-colors disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => navigate({ page: String(page + 1) })}
              disabled={page >= totalPages || isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-stone-400 border border-stone-800 hover:border-stone-700 transition-colors disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    stone: "bg-stone-900 border-stone-800 text-stone-300",
    emerald: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/5 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/5 border-purple-500/20 text-purple-400",
    amber: "bg-amber-500/5 border-amber-500/20 text-amber-400",
    cyan: "bg-cyan-500/5 border-cyan-500/20 text-cyan-400",
    red: "bg-red-500/5 border-red-500/20 text-red-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.stone}`}>
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
