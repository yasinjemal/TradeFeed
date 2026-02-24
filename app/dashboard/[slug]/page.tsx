// ============================================================
// Page — Shop Dashboard Overview (Redesigned)
// ============================================================
// Beautiful, data-rich dashboard with:
// - Welcome hero with time-based greeting
// - Animated stat cards with real metrics
// - Profile completeness CTA
// - Recent products with thumbnails
// - Share catalog section
// - Quick actions grid
// ============================================================

import Link from "next/link";
import { getShopBySlug, getDashboardStats } from "@/lib/db/shops";
import { notFound } from "next/navigation";
import { formatZAR } from "@/types";
import { CopyButton } from "@/components/ui/copy-button";

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const stats = await getDashboardStats(shop.id);

  // Profile completeness
  const profileChecks = [
    { done: !!shop.description },
    { done: !!shop.aboutText },
    { done: !!shop.address },
    { done: !!shop.city },
    { done: shop.latitude !== null },
    { done: !!shop.businessHours },
    { done: !!shop.instagram || !!shop.facebook || !!shop.tiktok },
  ];
  const profileComplete = profileChecks.filter((c) => c.done).length;
  const profileTotal = profileChecks.length;
  const profilePct = Math.round((profileComplete / profileTotal) * 100);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Catalog URL for sharing
  const catalogUrl = `/catalog/${shop.slug}`;

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════ */}
      {/* Hero Welcome                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900 p-7 sm:p-10">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-400/5 rounded-full blur-2xl" />

        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          {/* Shop avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-900/30 flex-shrink-0">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{shop.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-emerald-300/80 text-sm font-medium">{greeting} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              {shop.name}
            </h1>
            {shop.description && (
              <p className="text-stone-400 text-sm mt-1.5 max-w-md truncate">{shop.description}</p>
            )}

            {/* Quick inline stats */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
              <span className="flex items-center gap-1.5 text-sm text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {stats.activeProductCount} active product{stats.activeProductCount !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-stone-300">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {stats.totalStock} units in stock
              </span>
              {shop.city && (
                <span className="flex items-center gap-1.5 text-sm text-stone-400">
                  📍 {shop.city}
                </span>
              )}
            </div>
          </div>

          {/* View Catalog CTA */}
          <Link
            href={catalogUrl}
            target="_blank"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-500/20 active:scale-[0.98] flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View Catalog
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Stat Cards                                          */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Products */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-lg hover:shadow-stone-200/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            {stats.inactiveProductCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                {stats.inactiveProductCount} hidden
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-stone-900">{stats.productCount}</p>
          <p className="text-sm text-stone-500 mt-0.5">Products</p>
        </div>

        {/* Total Stock */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-lg hover:shadow-stone-200/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25" />
              </svg>
            </div>
            {stats.outOfStockCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                {stats.outOfStockCount} out
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-stone-900">{stats.totalStock.toLocaleString()}</p>
          <p className="text-sm text-stone-500 mt-0.5">Units in stock</p>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-lg hover:shadow-stone-200/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-stone-900">{stats.variantCount}</p>
          <p className="text-sm text-stone-500 mt-0.5">Product variants</p>
        </div>

        {/* Price Range */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-lg hover:shadow-stone-200/50 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
          </div>
          {stats.minPrice !== null ? (
            <>
              <p className="text-2xl font-bold text-stone-900">
                {formatZAR(stats.minPrice)}
              </p>
              {stats.maxPrice !== null && stats.minPrice !== stats.maxPrice && (
                <p className="text-xs text-stone-400 mt-0.5">
                  up to {formatZAR(stats.maxPrice)}
                </p>
              )}
            </>
          ) : (
            <p className="text-2xl font-bold text-stone-400">—</p>
          )}
          <p className="text-sm text-stone-500 mt-0.5">Price range</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Profile Completeness CTA + Share Catalog            */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile CTA */}
        {profilePct < 100 ? (
          <Link
            href={`/dashboard/${slug}/settings`}
            className="group block rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-6 hover:shadow-lg hover:shadow-amber-100/50 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-stone-900">Complete Your Profile</h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                    {profilePct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-amber-200/50 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${profilePct}%` }}
                  />
                </div>
                <p className="text-xs text-amber-700/70">
                  Add your location, hours & socials to build buyer trust
                </p>
              </div>
              <svg className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">Profile Complete! 🎉</h3>
                <p className="text-xs text-emerald-700/70">Your shop looks professional and trustworthy</p>
              </div>
            </div>
          </div>
        )}

        {/* Share Catalog */}
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Share Your Catalog</h3>
              <p className="text-xs text-stone-500">Send this link to your WhatsApp groups</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-stone-50 rounded-xl px-4 py-2.5 border border-stone-200 font-mono text-sm text-stone-700 truncate">
              tradefeed.co.za{catalogUrl}
            </div>
            <CopyButton text={`https://tradefeed.co.za${catalogUrl}`} />
          </div>

          {/* WhatsApp share message */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Check out my shop on TradeFeed! 🛍️\n\nhttps://tradefeed.co.za${catalogUrl}\n\n${shop.name} — ${shop.description ?? "Browse our wholesale catalog"}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Recent Products                                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Recent Products</h2>
          <Link
            href={`/dashboard/${slug}/products`}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
          >
            View all →
          </Link>
        </div>

        {stats.recentProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-stone-600 font-medium mb-1">No products yet</p>
            <p className="text-xs text-stone-400 mb-4">Add your first product to get started</p>
            <Link
              href={`/dashboard/${slug}/products/new`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {stats.recentProducts.map((product) => {
              const prices = product.variants.map((v) => v.priceInCents);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const image = product.images[0];

              return (
                <Link
                  key={product.id}
                  href={`/dashboard/${slug}/products/${product.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-stone-50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image.url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-900 truncate group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </p>
                      {!product.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium flex-shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {product.category && (
                        <span className="text-[11px] text-emerald-600 font-medium">{product.category.name}</span>
                      )}
                      <span className="text-[11px] text-stone-400">
                        {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Price + Stock */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-stone-900">{formatZAR(minPrice)}</p>
                    <p className={`text-[11px] font-medium ${totalStock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Quick Actions Grid                                  */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href={`/dashboard/${slug}/products/new`}
          className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-stone-200/80 bg-white hover:shadow-lg hover:shadow-stone-200/50 hover:border-emerald-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors group-hover:scale-110">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-sm font-medium text-stone-700 group-hover:text-emerald-700 transition-colors text-center">
            Add Product
          </span>
        </Link>

        <Link
          href={`/dashboard/${slug}/products`}
          className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-stone-200/80 bg-white hover:shadow-lg hover:shadow-stone-200/50 hover:border-blue-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors group-hover:scale-110">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-stone-700 group-hover:text-blue-700 transition-colors text-center">
            All Products
          </span>
        </Link>

        <Link
          href={`/dashboard/${slug}/settings`}
          className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-stone-200/80 bg-white hover:shadow-lg hover:shadow-stone-200/50 hover:border-purple-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 group-hover:bg-purple-100 flex items-center justify-center transition-colors group-hover:scale-110">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-stone-700 group-hover:text-purple-700 transition-colors text-center">
            Settings
          </span>
        </Link>

        <Link
          href={catalogUrl}
          target="_blank"
          className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-stone-200/80 bg-white hover:shadow-lg hover:shadow-stone-200/50 hover:border-amber-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors group-hover:scale-110">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
          <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 transition-colors text-center">
            Public Catalog
          </span>
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* Tips / Getting Started                              */}
      {/* ═══════════════════════════════════════════════════ */}
      {stats.productCount < 5 && (
        <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-stone-50 to-white p-6 space-y-4">
          <h3 className="font-semibold text-stone-900 flex items-center gap-2">
            <span className="text-lg">💡</span> Getting Started Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-100">
              <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Add 5+ products</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Buyers trust shops with more variety</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-100">
              <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Upload clear photos</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Good images double your enquiries</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-100">
              <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <div>
                <p className="text-sm font-medium text-stone-800">Share on WhatsApp</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Post your catalog link in groups</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
