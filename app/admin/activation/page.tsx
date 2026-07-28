// ============================================================
// Page — Activation Funnel Dashboard (/admin/activation)
// ============================================================
// Shows the 6-step seller activation funnel:
//   Signups → Shop Created → Product Added →
//   Catalog Shared → First Buyer View → WhatsApp Intent
//
// The headline metric is "Active Sellers" — the proxy for the
// 1,000-seller goal (≥3 products + buyer view in last 30d).
// ============================================================

import Link from "next/link";
import { getActivationStats, type FunnelPeriod } from "@/lib/db/activation";
import { BulkEmailPanel } from "./bulk-email-panel";

export const dynamic = "force-dynamic";

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  shop_created:     { label: "Shop Created",      color: "text-slate-400",   bg: "bg-slate-800" },
  product_added:    { label: "Product Added",     color: "text-blue-400",    bg: "bg-blue-900/40" },
  catalog_shared:   { label: "Catalog Shared",    color: "text-violet-400",  bg: "bg-violet-900/40" },
  first_buyer_view: { label: "First Buyer View",  color: "text-emerald-400", bg: "bg-emerald-900/40" },
  first_whatsapp_intent: { label: "WhatsApp Intent", color: "text-rose-400", bg: "bg-rose-900/40" },
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function formatDaysAgo(d: Date) {
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatMedianHours(hours: number | null) {
  if (hours === null) return "Not enough data";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 48) {
    return `${hours.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} hr`;
  }
  return `${(hours / 24).toLocaleString("en-ZA", { maximumFractionDigits: 1 })} days`;
}

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function ActivationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const period = (["7d", "30d", "all"].includes(params.period ?? "") ? params.period : "30d") as FunnelPeriod;

  const stats = await getActivationStats(period);
  const {
    funnel,
    timing,
    cohorts,
    productSources,
    monetization,
    recentSellers,
    activeSellers,
  } = stats;

  const maxCount = Math.max(...funnel.map((s) => s.count), 1);

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Activation Funnel</h1>
          <p className="text-stone-500 text-sm mt-1">
            Signup → identifiable WhatsApp intent. The path to 1,000 active sellers.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 rounded-xl p-1">
          {(["7d", "30d", "all"] as const).map((p) => (
            <Link
              key={p}
              href={`/admin/activation?period=${p}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? "bg-stone-700 text-white"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {p === "all" ? "All time" : `Last ${p}`}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Headline metric ───────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="col-span-2 md:col-span-1 rounded-2xl bg-emerald-900/20 border border-emerald-500/20 p-5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Active Sellers</p>
          <p className="text-4xl font-extrabold text-white">{activeSellers.toLocaleString()}</p>
          <p className="text-xs text-stone-500 mt-1">≥3 products + buyer view (30d)</p>
          <div className="mt-3 h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min((activeSellers / 1000) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-stone-600 mt-1">{activeSellers} / 1,000 goal</p>
        </div>

        {funnel.slice(0, 3).map((step) => (
          <div key={step.key} className="rounded-2xl bg-stone-900 border border-stone-800 p-5">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 truncate">{step.label}</p>
            <p className="text-3xl font-extrabold text-white">{step.count.toLocaleString()}</p>
            <p className="text-xs text-stone-500 mt-1">
              {step.key === "signups" ? `in ${period === "all" ? "all time" : `last ${period}`}` : `${step.pctOfPrev}% of prev step`}
            </p>
          </div>
        ))}
      </div>

      {/* ── Funnel visualization ──────────────────────────── */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6">
        <h2 className="text-sm font-bold text-stone-300 mb-6">
          Funnel — {period === "all" ? "All time" : `Last ${period}`}
        </h2>

        <div className="space-y-3">
          {funnel.map((step, i) => (
            <div key={step.key} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-stone-600 w-4">{i + 1}</span>
                  <span className="text-sm font-semibold text-stone-300">{step.label}</span>
                  <span className="text-xs text-stone-600">{step.description}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-white tabular-nums">
                    {step.count.toLocaleString()}
                  </span>
                  {i > 0 && (
                    <span className={`font-semibold tabular-nums w-16 text-right ${
                      step.pctOfPrev >= 70 ? "text-emerald-400" :
                      step.pctOfPrev >= 40 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {step.pctOfPrev}% ↓
                    </span>
                  )}
                </div>
              </div>

              <div className="h-7 bg-stone-800 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg transition-all duration-500 ${
                    i === 0 ? "bg-stone-600" :
                    i === 1 ? "bg-blue-600/60" :
                    i === 2 ? "bg-violet-600/60" :
                    i === 3 ? "bg-amber-600/60" :
                    i === 4 ? "bg-emerald-600/60" :
                    "bg-rose-600/60"
                  }`}
                  style={{ width: `${Math.max((step.count / maxCount) * 100, step.count > 0 ? 2 : 0)}%` }}
                />
                {step.count > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-stone-400">
                    {step.pctOfTop}% of signups
                  </span>
                )}
              </div>

              {/* Drop-off annotation */}
              {i > 0 && i < funnel.length && funnel[i - 1]!.count > step.count && (
                <p className="text-[10px] text-stone-700 mt-0.5 ml-6">
                  {(funnel[i - 1]!.count - step.count).toLocaleString()} dropped off here
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent sellers table ──────────────────────────── */}
      <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800">
          <h2 className="text-sm font-bold text-stone-300">Signup-week cohorts</h2>
          <p className="text-xs text-stone-600 mt-1">
            Each row follows people who signed up that week through the
            canonical, sequential activation path.
          </p>
        </div>
        {cohorts.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-stone-600">
            No signup cohorts in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-800 text-stone-500">
                  <th className="px-6 py-3 text-left">Week of</th>
                  <th className="px-3 py-3 text-right">Signups</th>
                  <th className="px-3 py-3 text-right">Shop</th>
                  <th className="px-3 py-3 text-right">Product</th>
                  <th className="px-3 py-3 text-right">Share</th>
                  <th className="px-3 py-3 text-right">Buyer view</th>
                  <th className="px-3 py-3 text-right">WA intent</th>
                  <th className="px-6 py-3 text-right">Paid start</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {cohorts.map((cohort) => {
                  const cell = (count: number) =>
                    `${count.toLocaleString()} (${cohort.signups > 0 ? Math.round((count / cohort.signups) * 100) : 0}%)`;
                  return (
                    <tr key={cohort.weekStart.toISOString()} className="text-stone-400">
                      <td className="px-6 py-3 font-medium text-stone-300">
                        {formatDate(cohort.weekStart)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-white">
                        {cohort.signups.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{cell(cohort.shopCreated)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{cell(cohort.productAdded)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{cell(cohort.catalogShared)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{cell(cohort.buyerView)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{cell(cohort.whatsappIntent)}</td>
                      <td className="px-6 py-3 text-right tabular-nums">{cell(cohort.paidStarted)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-stone-300">Median Activation Speed</h2>
          <p className="text-xs text-stone-600 mt-1">
            Time from signup to each milestone for completed journeys in this cohort.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {timing.map((metric) => (
            <div key={metric.key} className="rounded-xl bg-stone-950/60 border border-stone-800 p-4">
              <p className="text-xs text-stone-500">{metric.label}</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatMedianHours(metric.medianHours)}
              </p>
              <p className="text-[11px] text-stone-700 mt-1">
                {metric.sampleSize.toLocaleString()} completed {metric.sampleSize === 1 ? "journey" : "journeys"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-stone-300">Upgrade Conversion</h2>
          <p className="text-xs text-stone-600 mt-1">
            First shop-scoped upgrade view and paid-start events for this signup cohort.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-4">
            <p className="text-xs text-stone-500">Upgrade viewed</p>
            <p className="text-2xl font-bold text-white mt-1">
              {monetization.upgradeViewed.toLocaleString()}
            </p>
            <p className="text-[11px] text-stone-700 mt-1">unique shops</p>
          </div>
          <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-4">
            <p className="text-xs text-stone-500">Paid subscription started</p>
            <p className="text-2xl font-bold text-white mt-1">
              {monetization.subscriptionStarted.toLocaleString()}
            </p>
            <p className="text-[11px] text-stone-700 mt-1">unique shops</p>
          </div>
          <div className="rounded-xl bg-stone-950/60 border border-stone-800 p-4">
            <p className="text-xs text-stone-500">Converted after view</p>
            <p className="text-2xl font-bold text-white mt-1">
              {monetization.convertedAfterView.toLocaleString()}
            </p>
            <p className="text-[11px] text-stone-700 mt-1">
              paid start on or after first view
            </p>
          </div>
          <div className="rounded-xl bg-emerald-950/30 border border-emerald-500/20 p-4">
            <p className="text-xs text-emerald-400">View-to-paid conversion</p>
            <p className="text-2xl font-bold text-white mt-1">
              {monetization.conversionRate}%
            </p>
            <p className="text-[11px] text-stone-600 mt-1">
              {monetization.medianSampleSize > 0
                ? `Median ${formatMedianHours(monetization.medianHoursFromUpgradeView)} · ${monetization.medianSampleSize.toLocaleString()} completed`
                : "No completed view-to-paid journeys yet"}
            </p>
          </div>
        </div>
        <div
          className={`mt-4 rounded-xl border p-4 ${
            monetization.reconciliationStatus === "healthy"
              ? "border-emerald-500/20 bg-emerald-950/20"
              : "border-amber-500/30 bg-amber-950/20"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-stone-300">
                Paid-event reconciliation
              </p>
              <p className="mt-1 text-[11px] text-stone-600">
                Durable current paid subscriptions are authoritative;
                lifecycle events provide timing and attribution.
              </p>
            </div>
            <p
              className={`text-sm font-bold ${
                monetization.reconciliationStatus === "healthy"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {monetization.eventCoverageRate}% covered
            </p>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {monetization.authoritativePaidShops.toLocaleString()} currently
            paid · {monetization.missingStartEvents.toLocaleString()} missing
            paid-start {monetization.missingStartEvents === 1 ? "event" : "events"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-stone-900 border border-stone-800 p-6">
        <h2 className="text-sm font-bold text-stone-300">
          First-product activation source
        </h2>
        <p className="mt-1 text-xs text-stone-600">
          Durable Product.source and aiGenerated fields separate normal forms,
          WhatsApp, CSV, catalogue import, API, and AI-assisted creation.
        </p>
        {productSources.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">
            No activated products in this cohort.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {productSources.map((source) => (
              <div
                key={`${source.source}:${source.aiGenerated}`}
                className="rounded-xl border border-stone-800 bg-stone-950/60 p-4"
              >
                <p className="text-xs text-stone-500">
                  {source.source}
                  {source.aiGenerated ? " + AI" : ""}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {source.sellers.toLocaleString()}
                </p>
                <p className="mt-1 text-[11px] text-stone-700">sellers</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-300">Recent Sellers</h2>
          <span className="text-xs text-stone-600">{recentSellers.length} shown</span>
        </div>

        {recentSellers.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-600 text-sm">
            No sellers in this period yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-800">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Shop</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider hidden sm:table-cell">Owner</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">City</th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Products</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Stage</th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {recentSellers.map((seller) => {
                  const stageInfo = STAGE_LABELS[seller.stage]!;
                  return (
                    <tr key={seller.shopId} className="hover:bg-stone-800/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {seller.isActive && (
                            <span title="Active seller" className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          )}
                          <div>
                            <Link
                              href={`/catalog/${seller.shopSlug}`}
                              target="_blank"
                              className="font-semibold text-stone-200 hover:text-white transition-colors"
                            >
                              {seller.shopName}
                            </Link>
                            <p className="text-[11px] text-stone-600">/{seller.shopSlug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-stone-400 hidden sm:table-cell">
                        {seller.ownerName ?? <span className="text-stone-700">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-stone-500 hidden md:table-cell text-xs">
                        {seller.city ?? <span className="text-stone-700">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-sm font-bold ${seller.productCount >= 3 ? "text-emerald-400" : seller.productCount > 0 ? "text-amber-400" : "text-stone-600"}`}>
                          {seller.productCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${stageInfo.bg} ${stageInfo.color}`}>
                          {stageInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right hidden md:table-cell">
                        <span className="text-xs text-stone-600" title={formatDate(seller.createdAt)}>
                          {formatDaysAgo(seller.createdAt)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bulk re-engagement email ──────────────────────── */}
      <BulkEmailPanel />
    </div>
  );
}
