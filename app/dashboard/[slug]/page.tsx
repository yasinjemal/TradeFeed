// ============================================================
// Page — Shop Dashboard Command Center
// ============================================================
// Minimal, focused dashboard with clear visual hierarchy:
// 1. Compact header — shop name + status + CTA
// 2. Metrics strip — 4 key numbers
// 3. Priority attention — actionable items with severity
// 4. Recent products — clean list
// 5. Quick actions — 2×2 grid
// 6. Shop health — score + thin progress bars
// 7. Total revenue summary
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { getShopBySlug, getDashboardStats, getSellerHealthMetrics } from "@/lib/db/shops";
import { getOrderStats } from "@/lib/db/orders";
import { computeSellerHealth } from "@/lib/intelligence";
import { getShopSubscription, isTrialActive } from "@/lib/db/subscriptions";
import { notFound } from "next/navigation";
import { formatZAR } from "@/types";
import { TrialBanner } from "@/components/billing/trial-banner";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const [stats, healthMetrics, orderStats, subscription] = await Promise.all([
    getDashboardStats(shop.id),
    getSellerHealthMetrics(shop.id),
    getOrderStats(shop.id),
    getShopSubscription(shop.id),
  ]);
  const health = computeSellerHealth(healthMetrics);
  const trial = isTrialActive(subscription);

  // Profile completeness
  const profileChecks = [
    !!shop.description,
    !!shop.aboutText,
    !!shop.address,
    !!shop.city,
    shop.latitude !== null,
    !!shop.businessHours,
    !!shop.instagram || !!shop.facebook || !!shop.tiktok,
  ];
  const profilePct = Math.round(
    (profileChecks.filter(Boolean).length / profileChecks.length) * 100
  );

  const catalogUrl = `/catalog/${shop.slug}`;

  // Build priority attention items (red = urgent, yellow = action needed)
  const priorities: { level: "red" | "yellow"; label: string; href: string }[] = [];
  if (stats.outOfStockCount > 0) {
    priorities.push({
      level: "red",
      label: `${stats.outOfStockCount} variant${stats.outOfStockCount !== 1 ? "s" : ""} out of stock`,
      href: `/dashboard/${slug}/notifications`,
    });
  }
  if (orderStats.awaitingPayment > 0) {
    priorities.push({
      level: "red",
      label: `${orderStats.awaitingPayment} order${orderStats.awaitingPayment !== 1 ? "s" : ""} awaiting payment`,
      href: `/dashboard/${slug}/orders`,
    });
  }
  if (orderStats.pending > 0) {
    priorities.push({
      level: "yellow",
      label: `${orderStats.pending} order${orderStats.pending !== 1 ? "s" : ""} to confirm`,
      href: `/dashboard/${slug}/orders`,
    });
  }
  if (profilePct < 100) {
    priorities.push({
      level: "yellow",
      label: `Shop profile ${profilePct}% complete`,
      href: `/dashboard/${slug}/settings`,
    });
  }
  if (stats.productCount === 0) {
    priorities.push({
      level: "yellow",
      label: "Add your first product to start selling",
      href: `/dashboard/${slug}/products/new`,
    });
  }

  return (
    <div className="space-y-8">
      {/* Trial Banner */}
      {trial.active && <TrialBanner daysLeft={trial.daysLeft} shopSlug={slug} />}

      {/* ── Header ──────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {shop.logoUrl ? (
            <Image src={shop.logoUrl} alt={shop.name} width={44} height={44} className="w-11 h-11 rounded-xl object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">{shop.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 truncate">{shop.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Active</span>
            {shop.city && (
              <>
                <span className="text-slate-300">&middot;</span>
                <span className="text-xs text-slate-500">{shop.city}</span>
              </>
            )}
          </div>
        </div>
        <Link
          href={catalogUrl}
          target="_blank"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          View Catalog
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Link>
        <Link
          href={catalogUrl}
          target="_blank"
          className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          aria-label="View Catalog"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </Link>
      </div>

      {/* ── Metrics Strip ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Orders today</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.ordersToday}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Revenue today</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{formatZAR(stats.revenueTodayCents)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Products</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{stats.productCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">Total revenue</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{formatZAR(orderStats.revenueCents)}</p>
        </div>
      </div>

      {/* ── Priority Attention ─────────────────────── */}
      {priorities.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Needs your attention</h2>
          <div className="space-y-2">
            {priorities.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors group"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.level === "red" ? "bg-red-500" : "bg-amber-400"
                  }`}
                />
                <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Products ────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-500">Recent products</h2>
          {stats.recentProducts.length > 0 && (
            <Link href={`/dashboard/${slug}/products`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View all &rarr;
            </Link>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {stats.recentProducts.length === 0 ? (
            <div className="flex flex-col items-center py-10 px-4">
              <p className="text-sm text-slate-500 mb-3">No products yet</p>
              <Link
                href={`/dashboard/${slug}/products/new`}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Add Product
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentProducts.map((product) => {
                const prices = product.variants.map((v) => v.priceInCents);
                const minPrice = prices.length ? Math.min(...prices) : 0;
                const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                const image = product.images[0];
                return (
                  <Link
                    key={product.id}
                    href={`/dashboard/${slug}/products/${product.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {image ? (
                        <Image src={image.url} alt={product.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                        {!product.isActive && " \u00B7 Hidden"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-slate-900">{formatZAR(minPrice)}</p>
                      <p className={`text-xs ${totalStock > 0 ? "text-slate-400" : "text-red-500 font-medium"}`}>
                        {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Actions (2\u00D72) ────────────────────── */}
      <div>
        <h2 className="text-sm font-medium text-slate-500 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/dashboard/${slug}/products/new`}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Add Product</span>
          </Link>
          <Link
            href={`/dashboard/${slug}/orders`}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Orders</span>
          </Link>
          <Link
            href={`/dashboard/${slug}/billing`}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Billing</span>
          </Link>
          <Link
            href={`/dashboard/${slug}/settings`}
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Settings</span>
          </Link>
        </div>
      </div>

      {/* ── Shop Health ────────────────────────────── */}
      <div>
        <h2 className="text-sm font-medium text-slate-500 mb-3">Shop health</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-slate-900">{health.score}</span>
              <span className="text-xs text-slate-400">/100</span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              health.score >= 75 ? "bg-emerald-50 text-emerald-700" :
              health.score >= 50 ? "bg-amber-50 text-amber-700" :
              "bg-red-50 text-red-700"
            }`}>
              {health.score >= 75 ? "Excellent" : health.score >= 50 ? "Good" : "Needs work"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                health.score >= 75 ? "bg-emerald-500" :
                health.score >= 50 ? "bg-amber-500" :
                "bg-red-500"
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: "Product quality", value: health.breakdown.completeness, max: 25 },
              { label: "Inventory", value: health.breakdown.inventory, max: 20 },
              { label: "Fulfillment", value: health.breakdown.reliability, max: 20 },
              { label: "Activity", value: health.breakdown.activity, max: 15 },
              { label: "Catalog breadth", value: health.breakdown.diversity, max: 20 },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 flex-shrink-0">{d.label}</span>
                <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-slate-400 transition-all"
                    style={{ width: `${d.max > 0 ? (d.value / d.max) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-10 text-right">{d.value}/{d.max}</span>
              </div>
            ))}
          </div>
          {health.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1.5">Suggestions</p>
              <ul className="space-y-1">
                {health.suggestions.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">&bull;</span>
                    <Link href={`/dashboard/${slug}/${s.href}`} className="hover:text-emerald-600 transition-colors">
                      {s.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
