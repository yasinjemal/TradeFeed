"use client";

// ============================================================
// Revenue Dashboard — Client Component
// ============================================================
// Displays revenue stats, trend chart, top products, and breakdowns.
// Pure CSS/SVG charts — no external chart library (mobile-first SA).
// ============================================================

import Link from "next/link";
import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type {
  RevenueOverview,
  DailyRevenue,
  TopProduct,
  RevenueByStatus,
} from "@/lib/db/revenue";
import { ExportButtons } from "@/components/export/export-buttons";
import {
  generateCsv,
  downloadFile,
  printReport,
  formatRandsPlain,
  formatDateShort,
} from "@/lib/export/reports";

interface RevenueDashboardProps {
  overview: RevenueOverview;
  daily: DailyRevenue[];
  topProducts: TopProduct[];
  byStatus: RevenueByStatus[];
  days: number;
  shopSlug: string;
}

function formatRands(cents: number): string {
  if (cents >= 100000_00) return `R${(cents / 100_00).toFixed(0)}k`;
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(cents: number): string {
  if (cents === 0) return "R0";
  if (cents >= 1_000_000_00) return `R${(cents / 1_000_00).toFixed(1)}M`;
  if (cents >= 100_000_00) return `R${(cents / 1_000_00).toFixed(0)}k`;
  if (cents >= 10_000_00) return `R${(cents / 100_00).toFixed(1)}k`;
  return `R${(cents / 100).toFixed(0)}`;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  SHIPPED: "#8b5cf6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
};

export function RevenueDashboard({
  overview,
  daily,
  topProducts,
  byStatus,
  days,
  shopSlug,
}: RevenueDashboardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Export Handlers ─────────────────────────────────────
  const handleExportCsv = useCallback(() => {
    // Sheet 1 data: Daily revenue
    const dailyCsv = generateCsv(
      [
        { key: "date", label: "Date" },
        { key: "revenue", label: "Revenue (ZAR)" },
        { key: "orders", label: "Orders" },
      ],
      daily.map((d) => ({
        date: formatDateShort(d.date),
        revenue: (d.revenueCents / 100).toFixed(2),
        orders: d.orders,
      })),
    );

    // Append top products section
    const productRows = topProducts.map((p) => ({
      rank: "",
      product: p.productName,
      revenue: (p.revenueCents / 100).toFixed(2),
      units: p.unitsSold,
    }));
    const productCsv = generateCsv(
      [
        { key: "rank", label: "" },
        { key: "product", label: "Product" },
        { key: "revenue", label: "Revenue (ZAR)" },
        { key: "units", label: "Units Sold" },
      ],
      productRows,
    );

    // Combine both sections
    const combined = dailyCsv + "\n\nTop Products by Revenue\n" + productCsv;
    downloadFile(combined, `tradefeed-revenue-${days}d-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [daily, topProducts, days]);

  const handleExportPdf = useCallback(() => {
    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-card"><div class="label">Revenue (${days}d)</div><div class="value">${formatRandsPlain(overview.periodRevenueCents)}</div></div>
        <div class="summary-card"><div class="label">Orders (${days}d)</div><div class="value">${overview.periodOrders}</div></div>
        <div class="summary-card"><div class="label">All-Time Revenue</div><div class="value">${formatRandsPlain(overview.totalRevenueCents)}</div></div>
        <div class="summary-card"><div class="label">Avg Order Value</div><div class="value">${formatRandsPlain(overview.averageOrderCents)}</div></div>
      </div>
    `;

    const dailyRows = daily
      .filter((d) => d.revenueCents > 0)
      .map(
        (d) => `
          <tr>
            <td>${formatDateShort(d.date)}</td>
            <td class="text-right font-bold">${formatRandsPlain(d.revenueCents)}</td>
            <td class="text-center">${d.orders}</td>
          </tr>`,
      )
      .join("");

    const productRows = topProducts
      .map(
        (p, i) => `
          <tr>
            <td class="text-center">${i + 1}</td>
            <td>${p.productName}</td>
            <td class="text-right font-bold">${formatRandsPlain(p.revenueCents)}</td>
            <td class="text-center">${p.unitsSold}</td>
          </tr>`,
      )
      .join("");

    const statusRows = byStatus
      .map(
        (s) => `
          <tr>
            <td style="text-transform:capitalize">${s.status.toLowerCase()}</td>
            <td class="text-right font-bold">${formatRandsPlain(s.revenueCents)}</td>
            <td class="text-center">${s.count}</td>
          </tr>`,
      )
      .join("");

    printReport(`Revenue Report — Last ${days} Days`, `
      <h1>Revenue Report — Last ${days} Days</h1>
      ${summaryHtml}
      <h2>Daily Revenue</h2>
      <table>
        <thead><tr><th>Date</th><th class="text-right">Revenue</th><th class="text-center">Orders</th></tr></thead>
        <tbody>${dailyRows || '<tr><td colspan="3" class="text-center">No data</td></tr>'}</tbody>
      </table>
      <h2>Top Products by Revenue</h2>
      <table>
        <thead><tr><th class="text-center">#</th><th>Product</th><th class="text-right">Revenue</th><th class="text-center">Units</th></tr></thead>
        <tbody>${productRows || '<tr><td colspan="4" class="text-center">No data</td></tr>'}</tbody>
      </table>
      <h2>Revenue by Status</h2>
      <table>
        <thead><tr><th>Status</th><th class="text-right">Revenue</th><th class="text-center">Orders</th></tr></thead>
        <tbody>${statusRows}</tbody>
      </table>
    `);
  }, [daily, topProducts, byStatus, overview, days]);

  // ── Period Toggle ─────────────────────────────────────
  const periods = [
    { label: "7d", value: "7" },
    { label: "30d", value: "30" },
    { label: "90d", value: "90" },
  ];

  // ── Revenue Trend Chart ───────────────────────────────
  const maxRevenue = Math.max(...daily.map((d) => d.revenueCents), 1);
  const chartHeight = 160;
  const chartWidth = daily.length > 0 ? Math.max(daily.length * 12, 300) : 300;

  return (
    <div className="space-y-6">
      {/* Period Toggle + Export */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {periods.map((p) => {
            const isActive = String(days) === p.value;
            const params = new URLSearchParams(searchParams.toString());
            params.set("days", p.value);
            return (
              <Link
                key={p.value}
                href={`${pathname}?${params.toString()}`}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
        <ExportButtons onExportCsv={handleExportCsv} onExportPdf={handleExportPdf} />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Revenue (${days}d)`}
          value={formatRands(overview.periodRevenueCents)}
          sub={
            overview.growthPercent !== 0
              ? `${overview.growthPercent > 0 ? "↑" : "↓"} ${Math.abs(overview.growthPercent)}% vs prev`
              : undefined
          }
          trend={overview.growthPercent >= 0 ? "up" : "down"}
        />
        <StatCard
          label={`Orders (${days}d)`}
          value={String(overview.periodOrders)}
          sub={
            overview.previousPeriodOrders > 0
              ? `${overview.previousPeriodOrders} prev period`
              : undefined
          }
        />
        <StatCard
          label="All-Time Revenue"
          value={formatCompact(overview.totalRevenueCents)}
          sub={`${overview.totalOrders} orders`}
        />
        <StatCard
          label="Avg Order Value"
          value={formatRands(overview.averageOrderCents)}
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Revenue Trend</h2>
        {daily.length === 0 ? (
          <p className="text-stone-400 text-sm py-8 text-center">No data for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
              className="w-full"
              style={{ minWidth: `${Math.min(chartWidth, 600)}px` }}
            >
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((frac) => (
                <g key={frac}>
                  <line
                    x1="0"
                    y1={chartHeight - frac * chartHeight}
                    x2={chartWidth}
                    y2={chartHeight - frac * chartHeight}
                    stroke="#e7e5e4"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x="2"
                    y={chartHeight - frac * chartHeight - 4}
                    fill="#a8a29e"
                    fontSize="9"
                  >
                    {formatCompact(Math.round(maxRevenue * frac))}
                  </text>
                </g>
              ))}

              {/* Bars */}
              {daily.map((d, i) => {
                const barHeight = (d.revenueCents / maxRevenue) * chartHeight;
                const x = i * (chartWidth / daily.length) + 2;
                const barWidth = Math.max(chartWidth / daily.length - 4, 4);
                return (
                  <g key={d.date}>
                    <rect
                      x={x}
                      y={chartHeight - barHeight}
                      width={barWidth}
                      height={Math.max(barHeight, 1)}
                      rx="3"
                      fill={d.revenueCents > 0 ? "#10b981" : "#e7e5e4"}
                      opacity={d.revenueCents > 0 ? 0.85 : 0.3}
                    />
                    {/* Date labels (show every Nth) */}
                    {(i === 0 || i === daily.length - 1 || i % Math.max(Math.floor(daily.length / 6), 1) === 0) && (
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight + 16}
                        fill="#a8a29e"
                        fontSize="8"
                        textAnchor="middle"
                      >
                        {new Date(d.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-stone-400 text-sm py-4 text-center">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, i) => {
                const percent = topProducts[0]
                  ? (product.revenueCents / topProducts[0].revenueCents) * 100
                  : 0;
                return (
                  <div key={product.productId} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-bold text-stone-400">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-stone-800 truncate">
                          {product.productName}
                        </span>
                        <span className="text-sm font-semibold text-stone-900 ml-2">
                          {formatRands(product.revenueCents)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-400 whitespace-nowrap">
                          {product.unitsSold} sold
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue by Status */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-4">Revenue by Status</h2>
          <div className="space-y-3">
            {byStatus.map((s) => {
              const total = byStatus.reduce((sum, b) => sum + b.revenueCents, 0) || 1;
              const percent = (s.revenueCents / total) * 100;
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#a8a29e" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-stone-700 capitalize">
                        {s.status.toLowerCase()}
                      </span>
                      <span className="text-sm font-medium text-stone-900">
                        {formatRands(s.revenueCents)}
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: STATUS_COLORS[s.status] ?? "#a8a29e",
                        }}
                      />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{s.count} order{s.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-stone-900 mt-1">{value}</p>
      {sub && (
        <p
          className={`text-xs mt-1 ${
            trend === "up"
              ? "text-emerald-600"
              : trend === "down"
                ? "text-red-500"
                : "text-stone-400"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
