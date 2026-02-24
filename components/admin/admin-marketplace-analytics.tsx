// ============================================================
// Admin Marketplace Analytics — M7.5
// ============================================================
// Platform-wide analytics: views, clicks, geographic data,
// category popularity, daily trends.
// ============================================================

"use client";

import type { MarketplaceAnalytics } from "@/lib/db/admin";

interface AdminMarketplaceAnalyticsProps {
  analytics: MarketplaceAnalytics;
}

export function AdminMarketplaceAnalytics({ analytics }: AdminMarketplaceAnalyticsProps) {
  const { overview, dailyViews, topCategories, topProvinces } = analytics;

  const maxDailyViews = Math.max(...dailyViews.map((d) => d.views), 1);

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════ */}
      {/* Overview Stats                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsCard
          label="Marketplace Views"
          value={overview.totalViews.toLocaleString()}
          sub="Last 30 days"
          color="blue"
        />
        <AnalyticsCard
          label="Product Clicks"
          value={overview.totalClicks.toLocaleString()}
          sub={overview.totalViews > 0
            ? `${((overview.totalClicks / overview.totalViews) * 100).toFixed(1)}% CTR`
            : undefined}
          color="emerald"
        />
        <AnalyticsCard
          label="Promoted Impressions"
          value={overview.totalPromotedImpressions.toLocaleString()}
          color="amber"
        />
        <AnalyticsCard
          label="Promoted Clicks"
          value={overview.totalPromotedClicks.toLocaleString()}
          sub={overview.totalPromotedImpressions > 0
            ? `${((overview.totalPromotedClicks / overview.totalPromotedImpressions) * 100).toFixed(1)}% CTR`
            : undefined}
          color="purple"
        />
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Daily Views Chart                                   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
        <h3 className="text-sm font-bold text-stone-300 mb-4">Daily Marketplace Traffic (30 days)</h3>

        {dailyViews.every((d) => d.views === 0 && d.clicks === 0) ? (
          <div className="text-center py-8 text-stone-600 text-sm">
            No marketplace traffic data yet. Traffic will appear as users visit the marketplace.
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <div className="flex items-end gap-[2px] h-32 mb-3">
              {dailyViews.map((day, i) => {
                const viewPct = (day.views / maxDailyViews) * 100;
                const clickPct = maxDailyViews > 0 ? (day.clicks / maxDailyViews) * 100 : 0;
                const promoClickPct = maxDailyViews > 0 ? (day.promotedClicks / maxDailyViews) * 100 : 0;
                const dayLabel = new Date(day.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-[1px] group relative"
                    title={`${dayLabel}: ${day.views} views, ${day.clicks} clicks, ${day.promotedClicks} promoted clicks`}
                  >
                    <div
                      className="w-full bg-blue-500/30 rounded-t-sm min-h-[1px] transition-all group-hover:bg-blue-500/50"
                      style={{ height: `${Math.max(viewPct, 2)}%` }}
                    />
                    <div
                      className="w-full bg-emerald-500/50 min-h-[1px] transition-all group-hover:bg-emerald-500/70"
                      style={{ height: `${Math.max(clickPct, 1)}%` }}
                    />
                    {promoClickPct > 0 && (
                      <div
                        className="w-full bg-amber-500/50 rounded-b-sm min-h-[1px]"
                        style={{ height: `${Math.max(promoClickPct, 1)}%` }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 text-[10px] text-stone-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/30" />
                Views ({overview.totalViews.toLocaleString()})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/50" />
                Clicks ({overview.totalClicks.toLocaleString()})
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/50" />
                Promoted Clicks ({overview.totalPromotedClicks.toLocaleString()})
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Category Popularity + Geographic Distribution       */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Popularity */}
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-4">Category Popularity</h3>
          {topCategories.length === 0 ? (
            <p className="text-xs text-stone-600">No category data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topCategories.map((cat, i) => {
                const maxViews = topCategories[0]?.views ?? 1;
                const pct = (cat.views / maxViews) * 100;
                return (
                  <div key={cat.slug}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-300 font-medium">
                        <span className="text-stone-600 mr-1.5">{i + 1}.</span>
                        {cat.name}
                      </span>
                      <span className="text-stone-500 font-mono">{cat.views} products</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Geographic Distribution */}
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
          <h3 className="text-sm font-bold text-stone-300 mb-4">Geographic Distribution</h3>
          {topProvinces.length === 0 ? (
            <p className="text-xs text-stone-600">No geographic data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProvinces.map((prov) => {
                const maxShops = topProvinces[0]?.shopCount ?? 1;
                const pct = (prov.shopCount / maxShops) * 100;
                return (
                  <div key={prov.province}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-stone-300 font-medium flex items-center gap-1.5">
                        <span className="text-base">📍</span>
                        {prov.province}
                      </span>
                      <span className="text-stone-500">
                        {prov.shopCount} shop{prov.shopCount !== 1 ? "s" : ""} · {prov.productCount} products
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Search Terms (future — placeholder)                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-stone-800 bg-stone-900 p-5">
        <h3 className="text-sm font-bold text-stone-300 mb-2">Search Terms</h3>
        <p className="text-xs text-stone-500">
          Search term tracking will be available in a future update. When active, you&apos;ll see
          what buyers are searching for on the marketplace — helping sellers stock the right products.
        </p>
      </div>
    </div>
  );
}

// ── Analytics Stat Card ──────────────────────────────────────

function AnalyticsCard({
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
    blue: "bg-blue-950/50 border-blue-900/50 text-blue-400",
    emerald: "bg-emerald-950/50 border-emerald-900/50 text-emerald-400",
    amber: "bg-amber-950/50 border-amber-900/50 text-amber-400",
    purple: "bg-purple-950/50 border-purple-900/50 text-purple-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? colorMap.blue}`}>
      <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-0.5">{sub}</p>}
    </div>
  );
}
