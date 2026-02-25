// ============================================================
// Admin Promotion Dashboard — M7.3 + M7.4 + M7.6
// ============================================================
// Revenue stats, promotion moderation, content violations.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { adminCancelPromotionAction } from "@/app/actions/admin";
import type { PromotionRevenueStats, AdminPromotion, ContentViolation } from "@/lib/db/admin";

interface AdminPromotionDashboardProps {
  revenue: PromotionRevenueStats;
  promotions: AdminPromotion[];
  promotionTotal: number;
  promotionPage: number;
  promotionTotalPages: number;
  violations: ContentViolation[];
  currentStatus: string;
}

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "EXPIRED", label: "Expired" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

const TIER_STYLES: Record<string, string> = {
  BOOST: "bg-stone-500/10 text-stone-300",
  FEATURED: "bg-amber-500/10 text-amber-400",
  SPOTLIGHT: "bg-orange-500/10 text-orange-400",
};

function formatZAR(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

export function AdminPromotionDashboard({
  revenue,
  promotions,
  promotionTotal,
  promotionPage,
  promotionTotalPages,
  violations,
  currentStatus,
}: AdminPromotionDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
    }
    if (!updates.page) params.delete("page");
    router.push(`/admin/promotions?${params.toString()}`);
  }

  function handleCancelPromotion(promoId: string, productName: string) {
    if (!confirm(`Cancel promotion for "${productName}"? This action is immediate and cannot be undone.`)) return;
    startTransition(async () => {
      const result = await adminCancelPromotionAction(promoId);
      if (result.success) showToast("success", result.message);
      else showToast("error", result.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* M7.3 — Revenue Overview                             */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RevenueCard
          label="Total Revenue"
          value={formatZAR(revenue.totalRevenueCents)}
          sub={`${revenue.totalPromotions} promotions all-time`}
          color="emerald"
        />
        <RevenueCard
          label="Last 24h"
          value={formatZAR(revenue.revenueByPeriod.daily)}
          color="blue"
        />
        <RevenueCard
          label="Last 7 Days"
          value={formatZAR(revenue.revenueByPeriod.weekly)}
          color="purple"
        />
        <RevenueCard
          label="Last 30 Days"
          value={formatZAR(revenue.revenueByPeriod.monthly)}
          sub={`${revenue.activePromotions} active now`}
          color="amber"
        />
      </div>

      {/* Revenue by tier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Breakdown */}
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-4">Revenue by Tier</h3>
          {revenue.revenueByTier.length === 0 ? (
            <p className="text-xs text-stone-600">No promotion data yet.</p>
          ) : (
            <div className="space-y-3">
              {revenue.revenueByTier.map((t) => {
                const pct = revenue.totalRevenueCents > 0
                  ? (t.revenueCents / revenue.totalRevenueCents) * 100
                  : 0;
                return (
                  <div key={t.tier}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-semibold px-2 py-0.5 rounded-full ${TIER_STYLES[t.tier] ?? "text-stone-400"}`}>
                        {t.tier}
                      </span>
                      <span className="text-stone-400">
                        {formatZAR(t.revenueCents)} · {t.count} promos
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Spenders */}
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-4">Top Spenders</h3>
          {revenue.topSpenders.length === 0 ? (
            <p className="text-xs text-stone-600">No spenders yet.</p>
          ) : (
            <div className="space-y-2">
              {revenue.topSpenders.slice(0, 8).map((s, i) => (
                <div key={s.shopId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-stone-600 w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-300 truncate">{s.shopName}</p>
                    <p className="text-[10px] text-stone-600">{s.promotionCount} promotions</p>
                  </div>
                  <span className="text-sm font-bold text-stone-200">{formatZAR(s.totalSpentCents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top promoted categories */}
      {revenue.topCategories.length > 0 && (
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-3">Most Promoted Categories</h3>
          <div className="flex flex-wrap gap-2">
            {revenue.topCategories.map((c) => (
              <span
                key={c.categorySlug}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 text-xs text-stone-300"
              >
                {c.categoryName}
                <span className="text-stone-500">({c.promotionCount})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* M7.6 — Content Violations                           */}
      {/* ═══════════════════════════════════════════════════ */}
      {violations.length > 0 && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⚠️</span>
            <h3 className="text-sm font-bold text-red-400">
              Content Guideline Violations ({violations.length})
            </h3>
          </div>
          <p className="text-xs text-red-400/70 mb-3">
            These active promotions violate content guidelines. Consider cancelling them.
          </p>
          <div className="space-y-2">
            {violations.map((v) => (
              <div key={v.promotionId} className="flex items-center gap-3 p-3 rounded-lg bg-stone-900/80 border border-stone-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-200 truncate">{v.productName}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIER_STYLES[v.tier] ?? ""}`}>
                      {v.tier}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{v.shopName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {v.issues.map((issue, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelPromotion(v.promotionId, v.productName)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all disabled:opacity-50 flex-shrink-0"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* M7.4 — Promotion Moderation List                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-300">All Promotions</h3>

          {/* Status filter */}
          <div className="flex gap-1 bg-stone-800 rounded-lg p-0.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => updateParams({ status: f.key })}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  currentStatus === f.key
                    ? "bg-stone-700 text-white"
                    : "text-stone-500 hover:text-stone-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 text-xs text-stone-600 px-4">
          {promotionTotal} promotion{promotionTotal !== 1 ? "s" : ""} found
        </div>

        {/* Table */}
        {promotions.length === 0 ? (
          <div className="text-center py-12 text-stone-600 text-sm">
            No promotions match this filter.
          </div>
        ) : (
          <div className="divide-y divide-stone-800/50">
            {promotions.map((promo) => {
              const isActive = promo.status === "ACTIVE" && new Date(promo.expiresAt) > new Date();
              const ctr = promo.impressions > 0
                ? ((promo.clicks / promo.impressions) * 100).toFixed(1)
                : "0.0";
              const startDate = new Date(promo.startsAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
              const endDate = new Date(promo.expiresAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });

              return (
                <div key={promo.id} className="flex items-center gap-4 px-4 py-3">
                  {/* Product image */}
                  <div className="w-10 h-10 rounded-lg bg-stone-800 overflow-hidden flex-shrink-0">
                    {promo.product.imageUrl ? (
                      <Image src={promo.product.imageUrl} alt="" width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-600 text-[10px]">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-stone-200 truncate">{promo.product.name}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIER_STYLES[promo.tier] ?? ""}`}>
                        {promo.tier}
                      </span>
                      {isActive ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-700 text-stone-500">
                          {promo.status}
                        </span>
                      )}
                      {/* M7.6 — Inline guideline indicators */}
                      {!promo.product.hasImages && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">No image</span>
                      )}
                      {!promo.product.hasDescription && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">No desc</span>
                      )}
                      {!promo.product.hasActiveVariants && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">No variants</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {promo.shop.name} · {formatZAR(promo.amountPaidCents)} · {startDate} → {endDate}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5 text-center flex-shrink-0">
                    <div>
                      <p className="text-sm font-bold text-stone-200">{promo.impressions.toLocaleString()}</p>
                      <p className="text-[9px] text-stone-600 uppercase tracking-wider">Views</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-200">{promo.clicks.toLocaleString()}</p>
                      <p className="text-[9px] text-stone-600 uppercase tracking-wider">Clicks</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-200">{ctr}%</p>
                      <p className="text-[9px] text-stone-600 uppercase tracking-wider">CTR</p>
                    </div>
                  </div>

                  {/* Cancel action */}
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => handleCancelPromotion(promo.id, promo.product.name)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/20 border border-red-800/50 text-red-400 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 flex-shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {promotionTotalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-stone-800">
            <button
              type="button"
              onClick={() => updateParams({ page: String(promotionPage - 1), status: currentStatus })}
              disabled={promotionPage <= 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 transition-all"
            >
              ← Previous
            </button>
            <span className="text-xs text-stone-600">
              Page {promotionPage} of {promotionTotalPages}
            </span>
            <button
              type="button"
              onClick={() => updateParams({ page: String(promotionPage + 1), status: currentStatus })}
              disabled={promotionPage >= promotionTotalPages}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Revenue Stat Card ────────────────────────────────────────

function RevenueCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-950/50 border-emerald-900/50 text-emerald-400",
    blue: "bg-blue-950/50 border-blue-900/50 text-blue-400",
    purple: "bg-purple-950/50 border-purple-900/50 text-purple-400",
    amber: "bg-amber-950/50 border-amber-900/50 text-amber-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? colorMap.emerald}`}>
      <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
    </div>
  );
}
