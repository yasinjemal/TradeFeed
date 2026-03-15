// ============================================================
// Public Buyer Payment Page — /pay/[orderNumber]
// ============================================================
// No auth required. Buyer accesses via link from seller.
// Shows: order summary, items, total, and "Pay Now" button
// that redirects to PayFast hosted checkout.
// ============================================================

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { getOrderByNumber } from "@/lib/db/tracking";
import { buildOrderPaymentUrl } from "@/lib/payfast";

interface PayPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ status?: string }>;
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  const decoded = decodeURIComponent(orderNumber);
  return {
    title: `Pay for Order ${decoded} | TradeFeed`,
    description: `Complete payment for your TradeFeed order ${decoded}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PayPage({ params, searchParams }: PayPageProps) {
  const { orderNumber } = await params;
  const { status } = await searchParams;
  const decoded = decodeURIComponent(orderNumber);
  const order = await getOrderByNumber(decoded);

  if (!order) return notFound();

  const formatRand = (cents: number) => `R ${(cents / 100).toFixed(2)}`;
  const alreadyPaid = !!order.paidAt;
  const isCancelled = order.status === "CANCELLED";

  // Generate PayFast URL server-side (no client action needed)
  const paymentUrl =
    !alreadyPaid && !isCancelled
      ? buildOrderPaymentUrl({
          orderId: order.id,
          orderNumber: order.orderNumber,
          shopSlug: order.shop.slug,
          amountInCents: order.totalCents,
          buyerName: order.buyerName ?? undefined,
        })
      : null;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/" className="flex items-center gap-2">
            <TradeFeedLogo size="sm" />
          </Link>
          <span className="text-xs text-stone-500 font-mono">{order.orderNumber}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Success banner */}
        {status === "success" && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-emerald-400 mb-1">Payment Successful!</h2>
            <p className="text-sm text-stone-400">
              Your payment has been processed. The seller will confirm your order shortly.
            </p>
            <Link
              href={`/track/${encodeURIComponent(order.orderNumber)}`}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
            >
              Track Your Order →
            </Link>
          </div>
        )}

        {/* Cancelled banner */}
        {status === "cancelled" && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <p className="text-sm text-amber-300 font-medium">Payment was cancelled. You can try again below.</p>
          </div>
        )}

        {/* Already paid */}
        {alreadyPaid && !status && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-emerald-400 mb-1">Already Paid</h2>
            <p className="text-sm text-stone-400">This order has been paid. Thank you!</p>
            <Link
              href={`/track/${encodeURIComponent(order.orderNumber)}`}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-stone-800 text-stone-200 text-sm font-medium hover:bg-stone-700 transition-colors"
            >
              Track Your Order →
            </Link>
          </div>
        )}

        {/* Order cancelled */}
        {isCancelled && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 text-center">
            <h2 className="text-lg font-bold text-red-400 mb-1">Order Cancelled</h2>
            <p className="text-sm text-stone-400">This order has been cancelled and cannot be paid.</p>
          </div>
        )}

        {/* Shop info */}
        <div className="flex items-center gap-3 rounded-xl bg-stone-900/60 border border-stone-800/50 p-4">
          {order.shop.logoUrl ? (
            <img
              src={order.shop.logoUrl}
              alt={order.shop.name}
              className="w-10 h-10 rounded-full object-cover border border-stone-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {order.shop.name[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-stone-200 text-sm">{order.shop.name}</p>
            <p className="text-xs text-stone-500">
              {order.shop.isVerified && "✓ Verified · "}
              {[order.shop.city, order.shop.province].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>

        {/* Order items */}
        <div className="rounded-2xl bg-stone-900/60 border border-stone-800/50 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-800/50">
            <h2 className="text-sm font-semibold text-stone-300">
              Order Items ({order.itemCount})
            </h2>
          </div>
          <div className="divide-y divide-stone-800/30">
            {order.items.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-200 truncate">{item.productName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-stone-500">
                      {item.option1Label}: {item.option1Value}
                    </span>
                    {item.option2Value && (
                      <span className="text-[11px] text-stone-500">
                        · {item.option2Label}: {item.option2Value}
                      </span>
                    )}
                    <span className="text-[11px] text-stone-500">× {item.quantity}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-stone-200 flex-shrink-0">
                  {formatRand(item.priceInCents * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="px-5 py-4 border-t border-stone-700/50 bg-stone-900/80 flex items-center justify-between">
            <span className="text-sm font-semibold text-stone-300">Total</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {formatRand(order.totalCents)}
            </span>
          </div>
        </div>

        {/* Pay Now Button */}
        {paymentUrl && !alreadyPaid && !isCancelled && (
          <div className="space-y-3">
            <a
              href={paymentUrl}
              className="block w-full text-center px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-bold hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
            >
              Pay {formatRand(order.totalCents)} Now
            </a>
            <p className="text-center text-[11px] text-stone-600">
              Secure payment via PayFast · SSL encrypted
            </p>
          </div>
        )}

        {/* Track order link */}
        <div className="text-center pt-2">
          <Link
            href={`/track/${encodeURIComponent(order.orderNumber)}`}
            className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
          >
            ← Track this order
          </Link>
        </div>
      </main>
    </div>
  );
}
