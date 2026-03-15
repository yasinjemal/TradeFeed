// ============================================================
// Buyer Order History — /orders
// ============================================================
// Shows all orders placed by the signed-in buyer.
// Falls back to the order number search for guests.
// ============================================================

import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getBuyerOrders } from "@/lib/db/orders";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { TrackingSearch } from "@/components/tracking/tracking-search";
import { BuyerOrderList } from "@/components/orders/buyer-order-list";

export const metadata: Metadata = {
  title: "My Orders | TradeFeed",
  description:
    "View all your TradeFeed orders in one place. Track status, see order details, and reorder.",
};

export default async function BuyerOrdersPage() {
  const { userId } = await auth();

  // Signed-in buyer: show their order history
  if (userId) {
    const orders = await getBuyerOrders(userId);

    return (
      <div className="min-h-screen bg-stone-950 text-stone-100">
        <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
            <Link href="/" className="flex items-center gap-2">
              <TradeFeedLogo size="sm" />
            </Link>
            <Link
              href="/marketplace"
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              Marketplace →
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-5 py-10">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">
            My Orders
          </h1>
          <p className="text-stone-400 text-sm mb-8">
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
          </p>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-stone-900/60 border border-stone-800/40 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-stone-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <p className="text-stone-500 text-sm mb-4">
                Start shopping on the marketplace to see your orders here.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <BuyerOrderList orders={orders} />
          )}

          {/* Also show search for tracking by order number */}
          <div className="mt-12 pt-8 border-t border-stone-800/30">
            <h2 className="text-sm font-semibold text-stone-400 mb-4">
              Track a different order
            </h2>
            <TrackingSearch />
          </div>
        </main>
      </div>
    );
  }

  // Guest: redirect-style — show sign-in prompt + order number search
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/" className="flex items-center gap-2">
            <TradeFeedLogo size="sm" />
          </Link>
          <Link
            href="/marketplace"
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
          >
            Marketplace →
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-16">
        {/* Sign-in CTA */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">
            My Orders
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed mb-6">
            Sign in to see all your orders in one place, track deliveries, and
            reorder your favourites.
          </p>
          <Link
            href="/sign-in?redirect_url=/orders"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
          >
            Sign In to View Orders
          </Link>
        </div>

        {/* Order number search fallback */}
        <div className="rounded-2xl bg-stone-900/40 border border-stone-800/30 p-6">
          <h2 className="text-sm font-semibold text-stone-300 mb-1">
            Have an order number?
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            Track a specific order using the number from your WhatsApp
            confirmation.
          </p>
          <TrackingSearch />
        </div>
      </main>
    </div>
  );
}
