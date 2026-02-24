// ============================================================
// Public Order Tracking — /track/[orderNumber]
// ============================================================
// No auth required. Buyers access this via their order number.
// Shows: order status timeline, line items, shop info, WhatsApp CTA.
// ============================================================

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByNumber } from "@/lib/db/tracking";
import { OrderTimeline } from "@/components/tracking/order-timeline";
import { TrackingSearch } from "@/components/tracking/tracking-search";

interface TrackingPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: TrackingPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Track Order ${decodeURIComponent(orderNumber)} | TradeFeed`,
    description: `Track the status of your TradeFeed order ${decodeURIComponent(orderNumber)}.`,
    robots: { index: false, follow: false },
  };
}

export default async function TrackingPage({ params }: TrackingPageProps) {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  const order = await getOrderByNumber(decoded);

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100">
        {/* Header */}
        <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-extrabold text-[10px]">T</span>
              </div>
              <span className="font-bold text-sm">Trade<span className="text-emerald-400">Feed</span></span>
            </Link>
            <Link href="/marketplace" className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
              Marketplace →
            </Link>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-5 py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <p className="text-stone-400 text-sm mb-1">
            We couldn&apos;t find an order with number:
          </p>
          <p className="font-mono text-base text-stone-300 bg-stone-900 border border-stone-800 rounded-lg px-4 py-2 inline-block mb-8">
            {decoded}
          </p>
          <div className="space-y-3">
            <p className="text-xs text-stone-500">Double-check your order number and try again:</p>
            <TrackingSearch />
          </div>
        </main>
      </div>
    );
  }

  // Format helpers
  const formatRand = (cents: number) => `R ${(cents / 100).toFixed(2)}`;
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // WhatsApp contact link
  const waNumber = order.shop.whatsappNumber.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi, I'd like to enquire about my order ${order.orderNumber}.`
  )}`;

  // Status config
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
    PENDING: {
      label: "Pending",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    CONFIRMED: {
      label: "Confirmed",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    SHIPPED: {
      label: "Shipped",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
    },
    DELIVERED: {
      label: "Delivered",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
    },
    CANCELLED: {
      label: "Cancelled",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  };

  const currentStatus = statusConfig[order.status] ?? statusConfig["PENDING"]!;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-[10px]">T</span>
            </div>
            <span className="font-bold text-sm">Trade<span className="text-emerald-400">Feed</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-stone-600 font-mono">{order.orderNumber}</span>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Contact Seller
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* ── Status Hero Card ────────────────────────────── */}
        <div className={`relative rounded-2xl ${currentStatus.bgColor} border ${currentStatus.borderColor} p-6 sm:p-8 overflow-hidden`}>
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-stone-500 font-medium uppercase tracking-wider mb-1">Order Status</p>
                <div className="flex items-center gap-2.5">
                  <span className={currentStatus.color}>{currentStatus.icon}</span>
                  <h1 className={`text-2xl sm:text-3xl font-extrabold ${currentStatus.color}`}>
                    {currentStatus.label}
                  </h1>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-sm font-bold text-stone-200">{order.orderNumber}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {order.status === "PENDING" && (
              <p className="text-sm text-stone-400 leading-relaxed">
                Your order has been placed and is waiting for the seller to confirm. You&apos;ll see updates here.
              </p>
            )}
            {order.status === "CONFIRMED" && (
              <p className="text-sm text-stone-400 leading-relaxed">
                Great news! The seller has confirmed your order and is preparing it for dispatch.
              </p>
            )}
            {order.status === "SHIPPED" && (
              <p className="text-sm text-stone-400 leading-relaxed">
                Your order is on its way! It has been dispatched or is ready for collection.
              </p>
            )}
            {order.status === "DELIVERED" && (
              <p className="text-sm text-stone-400 leading-relaxed">
                Your order has been delivered. Thank you for shopping with {order.shop.name}!
              </p>
            )}
            {order.status === "CANCELLED" && (
              <p className="text-sm text-stone-400 leading-relaxed">
                This order has been cancelled. Contact the seller on WhatsApp if you have questions.
              </p>
            )}
          </div>
        </div>

        {/* ── Status Timeline ─────────────────────────────── */}
        <div className="rounded-2xl bg-stone-900/60 border border-stone-800/50 p-6">
          <h2 className="text-sm font-semibold text-stone-300 mb-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
            Order Progress
          </h2>
          <OrderTimeline
            currentStatus={order.status}
            createdAt={order.createdAt.toISOString()}
            updatedAt={order.updatedAt.toISOString()}
          />
        </div>

        {/* ── Order Items ─────────────────────────────────── */}
        <div className="rounded-2xl bg-stone-900/60 border border-stone-800/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-800/50">
            <h2 className="text-sm font-semibold text-stone-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Items ({order.itemCount})
            </h2>
          </div>
          <div className="divide-y divide-stone-800/30">
            {order.items.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-200 text-sm truncate">{item.productName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-800 text-[11px] text-stone-400 border border-stone-700/50">
                      {item.option1Label}: {item.option1Value}
                    </span>
                    {item.option2Value && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-800 text-[11px] text-stone-400 border border-stone-700/50">
                        {item.option2Label}: {item.option2Value}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-500">
                      × {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm text-stone-200">
                    {formatRand(item.priceInCents * item.quantity)}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatRand(item.priceInCents)} each
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="px-6 py-4 border-t border-stone-700/50 bg-stone-900/80 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-400">Order Total</span>
            <span className="text-lg font-extrabold text-emerald-400">{formatRand(order.totalCents)}</span>
          </div>
        </div>

        {/* ── Buyer & Shop Info Row ───────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Buyer Info */}
          <div className="rounded-2xl bg-stone-900/60 border border-stone-800/50 p-5">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Buyer Details</h3>
            <div className="space-y-2">
              {order.buyerName && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-stone-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                  <span className="text-sm text-stone-300">{order.buyerName}</span>
                </div>
              )}
              {order.buyerPhone && (
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-stone-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                  <span className="text-sm text-stone-300 font-mono">{order.buyerPhone}</span>
                  <span className="text-[10px] text-stone-600">(masked)</span>
                </div>
              )}
              {order.buyerNote && (
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  <span className="text-sm text-stone-400 italic">&ldquo;{order.buyerNote}&rdquo;</span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-stone-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                  <span className="text-sm text-stone-300">
                    {order.deliveryAddress}
                    {order.deliveryCity ? `, ${order.deliveryCity}` : ""}
                    {order.deliveryProvince ? `, ${order.deliveryProvince}` : ""}
                    {order.deliveryPostalCode ? ` ${order.deliveryPostalCode}` : ""}
                  </span>
                </div>
              )}
              {!order.buyerName && !order.buyerPhone && !order.buyerNote && !order.deliveryAddress && (
                <p className="text-sm text-stone-600">No buyer details provided.</p>
              )}
            </div>
          </div>

          {/* Shop Info */}
          <div className="rounded-2xl bg-stone-900/60 border border-stone-800/50 p-5">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Seller</h3>
            <div className="flex items-center gap-3 mb-3">
              {order.shop.logoUrl ? (
                <img
                  src={order.shop.logoUrl}
                  alt={order.shop.name}
                  className="w-10 h-10 rounded-lg object-cover ring-1 ring-stone-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-600/20">
                  {order.shop.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-stone-200">{order.shop.name}</span>
                  {order.shop.isVerified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20">✓</span>
                  )}
                </div>
                {(order.shop.city || order.shop.province) && (
                  <p className="text-[11px] text-stone-500">
                    📍 {[order.shop.city, order.shop.province].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${order.shop.slug}`}
                className="flex-1 text-center px-3 py-2 rounded-lg bg-stone-800 border border-stone-700/50 text-xs font-medium text-stone-300 hover:bg-stone-700/80 hover:text-white transition-all"
              >
                View Catalog
              </Link>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* ── Help section ────────────────────────────────── */}
        <div className="rounded-2xl bg-stone-900/40 border border-stone-800/30 p-5 text-center">
          <p className="text-xs text-stone-500 mb-2">
            Need help? Contact the seller directly on WhatsApp.
          </p>
          <p className="text-xs text-stone-600">
            Bookmark this page to check your order status anytime.
          </p>
        </div>

        {/* ── Track Another Order ─────────────────────────── */}
        <div className="rounded-2xl bg-stone-900/40 border border-stone-800/30 p-5">
          <p className="text-xs text-stone-500 mb-3 text-center">Track another order</p>
          <TrackingSearch />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/30 py-6 px-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
            © {new Date().getFullYear()} TradeFeed
          </Link>
          <Link href="/marketplace" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
            Browse Marketplace
          </Link>
        </div>
      </footer>
    </div>
  );
}
