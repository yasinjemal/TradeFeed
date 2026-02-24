// ============================================================
// Public Order Tracking Landing — /track
// ============================================================
// Search page where buyers enter their order number.
// ============================================================

import { Metadata } from "next";
import Link from "next/link";
import { TrackingSearch } from "@/components/tracking/tracking-search";

export const metadata: Metadata = {
  title: "Track Your Order | TradeFeed",
  description: "Enter your TradeFeed order number to check the status of your order in real-time.",
};

export default function TrackingLandingPage() {
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

      <main className="max-w-lg mx-auto px-5 py-20">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Track Your Order</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Enter the order number from your WhatsApp confirmation message
            to check the current status of your order.
          </p>
        </div>

        {/* Search */}
        <TrackingSearch />

        {/* Help */}
        <div className="mt-10 rounded-2xl bg-stone-900/40 border border-stone-800/30 p-5">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Where to find your order number?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-stone-400">1</span>
              </div>
              <p className="text-sm text-stone-400">
                Open the <span className="text-stone-300">WhatsApp message</span> you sent to the seller when you placed your order.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-stone-400">2</span>
              </div>
              <p className="text-sm text-stone-400">
                Look for the order number at the top of the message. It looks like{" "}
                <span className="font-mono text-emerald-400/80 text-xs">TF-20260224-A1B2</span>.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-stone-400">3</span>
              </div>
              <p className="text-sm text-stone-400">
                Paste it above and tap <span className="text-stone-300">Track</span> to see the latest status.
              </p>
            </div>
          </div>
        </div>

        {/* Example preview */}
        <div className="mt-6 rounded-xl bg-stone-900/60 border border-stone-800/40 p-4">
          <p className="text-[10px] font-medium text-stone-600 uppercase tracking-wider mb-2">Example WhatsApp message</p>
          <div className="font-mono text-[11px] text-stone-500 leading-relaxed space-y-1">
            <p className="text-emerald-400/70 font-bold">🛍️ New Order #TF-20260224-A1B2</p>
            <p>─────────────────</p>
            <p>1× Oversized Hoodie (L, Black)</p>
            <p>2× Graphic Tee Pack (M, White)</p>
            <p>─────────────────</p>
            <p>Total: R 580.00</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/30 py-6 px-5 mt-auto">
        <div className="max-w-lg mx-auto flex items-center justify-between">
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
