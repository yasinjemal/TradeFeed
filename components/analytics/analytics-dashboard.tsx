// ============================================================
// Component — Analytics Dashboard (Client)
// ============================================================
// Interactive analytics display with period toggle, stat cards,
// daily trend mini bar chart, and top products list.
//
// DESIGN: No external chart library — pure CSS/SVG bar chart.
// Keeps the bundle tiny for SA mobile connections.
// ============================================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { formatZAR } from "@/types";
import type { PromotionStats, PromotionFunnelData } from "@/lib/db/promotions";
import type { ConversionFunnel, ProductPerformance } from "@/lib/db/analytics";

interface OverviewData {
  totalPageViews: number;
  totalProductViews: number;
  totalWhatsAppClicks: number;
  totalCheckouts: number;
  conversionRate: number;
  days: number;
}

interface DailyData {
  date: string;
  views: number;
  productViews: number;
  clicks: number;
  checkouts: number;
}

interface TopProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  totalEvents: number;
}

interface DailyRevenue {
  date: string;
  revenueCents: number;
  orders: number;
}

interface AnalyticsDashboardProps {
  overview: OverviewData;
  daily: DailyData[];
  topProducts: TopProduct[];
  uniqueVisitors: number;
  currentDays: number;
  shopSlug: string;
  promotionStats?: PromotionStats;
  promotionFunnel?: PromotionFunnelData;
  conversionFunnel?: ConversionFunnel;
  productPerformance?: ProductPerformance[];
  dailyRevenue?: DailyRevenue[];
}

export function AnalyticsDashboard({
  overview,
  daily,
  topProducts,
  uniqueVisitors,
  currentDays,
  shopSlug,
  promotionStats,
  promotionFunnel,
  conversionFunnel,
  productPerformance,
  dailyRevenue,
}: AnalyticsDashboardProps) {
  const pathname = usePathname();

  const hasData =
    overview.totalPageViews > 0 ||
    overview.totalProductViews > 0 ||
    overview.totalWhatsAppClicks > 0;

  return (
    <div className="space-y-6">
      {/* ── Period Toggle ────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <PeriodButton
          days={7}
          currentDays={currentDays}
          pathname={pathname}
        />
        <PeriodButton
          days={30}
          currentDays={currentDays}
          pathname={pathname}
        />
        <PeriodButton
          days={90}
          currentDays={currentDays}
          pathname={pathname}
        />
      </div>

      {/* ── Stat Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Catalog Views"
          value={overview.totalPageViews}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          label="Product Views"
          value={overview.totalProductViews}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          label="WhatsApp Taps"
          value={overview.totalWhatsAppClicks + overview.totalCheckouts}
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          }
          color="emerald"
        />
        <StatCard
          label="Unique Visitors"
          value={uniqueVisitors}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          color="amber"
        />
        <StatCard
          label="Conversion"
          value={`${overview.conversionRate}%`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
          color="rose"
          subtitle="views → WhatsApp"
        />
      </div>

      {/* ── Daily Trend Chart ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-5">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">
          Daily Views — Last {currentDays} days
        </h2>
        {hasData ? (
          <MiniBarChart data={daily} />
        ) : (
          <EmptyChart shopSlug={shopSlug} />
        )}
      </div>

      {/* ── Top Products ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/60 p-5">
        <h2 className="text-sm font-semibold text-stone-800 mb-4">
          🔥 Top Products
        </h2>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div
                key={product.productId}
                className="flex items-center gap-3"
              >
                <span className="text-xs font-bold text-stone-400 w-5 text-right">
                  {i + 1}
                </span>
                <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {product.name}
                  </p>
                </div>
                <span className="text-sm font-semibold text-stone-600 tabular-nums">
                  {product.totalEvents} <span className="text-xs text-stone-400 font-normal">events</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 text-center py-6">
            No product data yet. Share your catalog to start tracking!
          </p>
        )}
      </div>

      {/* ── Conversion Funnel ────────────────────────────── */}
      {conversionFunnel && conversionFunnel.pageViews > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-800">
            🔄 Conversion Funnel — Last {currentDays} days
          </h2>
          <div className="space-y-1.5">
            <FunnelBar label="Page Views" value={conversionFunnel.pageViews} pct={100} color="bg-blue-400" />
            <FunnelBar
              label="Product Views"
              value={conversionFunnel.productViews}
              pct={conversionFunnel.pageViews > 0 ? (conversionFunnel.productViews / conversionFunnel.pageViews) * 100 : 0}
              color="bg-purple-400"
            />
            <FunnelBar
              label="Add to Cart"
              value={conversionFunnel.addToCart}
              pct={conversionFunnel.pageViews > 0 ? (conversionFunnel.addToCart / conversionFunnel.pageViews) * 100 : 0}
              color="bg-amber-400"
            />
            <FunnelBar
              label="Checkout"
              value={conversionFunnel.checkoutStart}
              pct={conversionFunnel.pageViews > 0 ? (conversionFunnel.checkoutStart / conversionFunnel.pageViews) * 100 : 0}
              color="bg-orange-400"
            />
            <FunnelBar
              label="Paid"
              value={conversionFunnel.paymentComplete}
              pct={conversionFunnel.pageViews > 0 ? (conversionFunnel.paymentComplete / conversionFunnel.pageViews) * 100 : 0}
              color="bg-emerald-500"
            />
          </div>
          {conversionFunnel.productViews > 0 && (
            <p className="text-[10px] text-stone-400 pt-1">
              Cart rate: {((conversionFunnel.addToCart / conversionFunnel.productViews) * 100).toFixed(1)}% · Checkout rate: {((conversionFunnel.checkoutStart / Math.max(conversionFunnel.addToCart, 1)) * 100).toFixed(1)}% · Payment rate: {((conversionFunnel.paymentComplete / Math.max(conversionFunnel.checkoutStart, 1)) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      )}

      {/* ── Revenue Trend ────────────────────────────────── */}
      {dailyRevenue && dailyRevenue.some((d) => d.revenueCents > 0) && (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5">
          <h2 className="text-sm font-semibold text-stone-800 mb-4">
            💰 Revenue Trend — Last {currentDays} days
          </h2>
          <RevenueBarChart data={dailyRevenue} />
        </div>
      )}

      {/* ── Product Performance Table ────────────────────── */}
      {productPerformance && productPerformance.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-800">
            📊 Product Performance — Top {Math.min(productPerformance.length, 10)}
          </h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left font-medium text-stone-500 pb-2 pl-2">Product</th>
                  <th className="text-right font-medium text-stone-500 pb-2 px-2">Views</th>
                  <th className="text-right font-medium text-stone-500 pb-2 px-2">Cart</th>
                  <th className="text-right font-medium text-stone-500 pb-2 px-2">Orders</th>
                  <th className="text-right font-medium text-stone-500 pb-2 pr-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.slice(0, 10).map((p) => (
                  <tr key={p.productId} className="border-b border-stone-50 last:border-0">
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-stone-100 overflow-hidden flex-shrink-0">
                          {p.imageUrl ? (
                            <Image src={p.imageUrl} alt={p.name} width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-stone-800 truncate max-w-[120px] sm:max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums text-stone-600 px-2">{p.views.toLocaleString()}</td>
                    <td className="text-right tabular-nums text-stone-600 px-2">{p.cartAdds.toLocaleString()}</td>
                    <td className="text-right tabular-nums text-stone-600 px-2">{p.orders.toLocaleString()}</td>
                    <td className="text-right tabular-nums font-semibold text-emerald-700 pr-2">{formatZAR(p.revenueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Promotion Summary ────────────────────────────── */}
      {promotionStats && promotionStats.totalImpressions > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-800">
              📣 Promotion Performance
            </h2>
            <Link
              href={`/dashboard/${shopSlug}/promote`}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Full analytics
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Promo stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <p className="text-lg font-bold text-stone-900">{promotionStats.activeCount}</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Active</p>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <p className="text-lg font-bold text-stone-900">{promotionStats.totalImpressions.toLocaleString()}</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Impressions</p>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <p className="text-lg font-bold text-stone-900">{promotionStats.totalClicks.toLocaleString()}</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Clicks</p>
            </div>
            <div className="text-center p-3 bg-stone-50 rounded-xl">
              <p className="text-lg font-bold text-emerald-600">
                {promotionStats.totalImpressions > 0
                  ? ((promotionStats.totalClicks / promotionStats.totalImpressions) * 100).toFixed(1)
                  : "0.0"}%
              </p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">CTR</p>
            </div>
          </div>

          {/* Mini conversion funnel */}
          {promotionFunnel && promotionFunnel.impressions > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-stone-600">Conversion Funnel (30 days)</p>
              <div className="space-y-1.5">
                <FunnelBar label="Impressions" value={promotionFunnel.impressions} pct={100} color="bg-stone-300" />
                <FunnelBar
                  label="Clicks"
                  value={promotionFunnel.clicks}
                  pct={promotionFunnel.impressions > 0 ? (promotionFunnel.clicks / promotionFunnel.impressions) * 100 : 0}
                  color="bg-blue-400"
                />
                <FunnelBar
                  label="Product Views"
                  value={promotionFunnel.productViews}
                  pct={promotionFunnel.impressions > 0 ? (promotionFunnel.productViews / promotionFunnel.impressions) * 100 : 0}
                  color="bg-purple-400"
                />
                <FunnelBar
                  label="WhatsApp Orders"
                  value={promotionFunnel.whatsappOrders}
                  pct={promotionFunnel.impressions > 0 ? (promotionFunnel.whatsappOrders / promotionFunnel.impressions) * 100 : 0}
                  color="bg-emerald-500"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ================================================================
// Sub-Components
// ================================================================

function PeriodButton({
  days,
  currentDays,
  pathname,
}: {
  days: number;
  currentDays: number;
  pathname: string;
}) {
  const isActive = days === currentDays;
  return (
    <Link
      href={`${pathname}?days=${days}`}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isActive
          ? "bg-stone-900 text-white shadow-sm"
          : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
      }`}
    >
      {days === 7 ? "7 days" : days === 90 ? "90 days" : "30 days"}
    </Link>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "emerald" | "amber" | "rose";
  subtitle?: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  const formatted =
    typeof value === "number"
      ? value.toLocaleString("en-ZA")
      : value;

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-stone-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900 tabular-nums">
        {formatted}
      </p>
      {subtitle && (
        <p className="text-[10px] text-stone-400">{subtitle}</p>
      )}
    </div>
  );
}

function MiniBarChart({ data }: { data: DailyData[] }) {
  const maxViews = Math.max(...data.map((d) => d.views + d.productViews), 1);

  return (
    <div className="flex items-end gap-[2px] h-32">
      {data.map((day) => {
        const total = day.views + day.productViews;
        const heightPercent = Math.max((total / maxViews) * 100, 2);
        const hasClicks = day.clicks + day.checkouts > 0;
        const dateObj = new Date(day.date);
        const dayLabel = dateObj.toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "short",
        });

        return (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
          >
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-stone-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                <p className="font-semibold">{dayLabel}</p>
                <p>{total} views</p>
                {hasClicks && (
                  <p className="text-emerald-300">
                    {day.clicks + day.checkouts} WhatsApp
                  </p>
                )}
              </div>
            </div>

            {/* Click indicator dot */}
            {hasClicks && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
            )}

            {/* Bar */}
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer min-h-[2px]"
              style={{ height: `${heightPercent}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function EmptyChart({ shopSlug }: { shopSlug: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-stone-700 mb-1">
        No data yet
      </h3>
      <p className="text-xs text-stone-400 max-w-xs">
        Share your catalog link to start seeing visitor analytics here.
      </p>
      <Link
        href={`/catalog/${shopSlug}`}
        target="_blank"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700"
      >
        View your catalog
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </Link>
    </div>
  );
}

function RevenueBarChart({ data }: { data: DailyRevenue[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenueCents), 1);

  return (
    <div className="flex items-end gap-[2px] h-32">
      {data.map((day) => {
        const heightPercent = Math.max((day.revenueCents / maxRevenue) * 100, 2);
        const dateObj = new Date(day.date);
        const dayLabel = dateObj.toLocaleDateString("en-ZA", {
          day: "numeric",
          month: "short",
        });

        return (
          <div
            key={day.date}
            className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative"
          >
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
              <div className="bg-stone-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                <p className="font-semibold">{dayLabel}</p>
                <p>{formatZAR(day.revenueCents)}</p>
                {day.orders > 0 && (
                  <p className="text-emerald-300">{day.orders} order{day.orders !== 1 ? "s" : ""}</p>
                )}
              </div>
            </div>

            {/* Order indicator dot */}
            {day.orders > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mb-0.5" />
            )}

            {/* Bar */}
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400 hover:from-emerald-600 hover:to-emerald-500 transition-colors cursor-pointer min-h-[2px]"
              style={{ height: `${heightPercent}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function FunnelBar({ label, value, pct, color }: {
  label: string; value: number; pct: number; color: string;
}) {
  const barWidth = Math.max(pct, 3);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-stone-500 w-24 text-right shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-stone-50 rounded overflow-hidden">
        <div
          className={`h-full ${color} rounded transition-all duration-500`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-stone-700 w-14 text-right tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  );
}
