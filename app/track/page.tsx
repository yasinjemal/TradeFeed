// ============================================================
// Public Order Tracking Landing — /track
// ============================================================
// Search page where buyers enter their order number.
// ============================================================

import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TrackingSearch } from "@/components/tracking/tracking-search";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";

export const metadata: Metadata = {
  title: "Track Your Order | TradeFeed",
  description: "Enter your TradeFeed order number to check the status of your order in real-time.",
};

export default async function TrackingLandingPage() {
  const t = await getTranslations("tracking");
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="border-b border-stone-800/50 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/" className="flex items-center gap-2">
            <TradeFeedLogo size="sm" />
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
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">{t("title")}</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Search */}
        <TrackingSearch />

        {/* Help */}
        <div className="mt-10 rounded-2xl bg-stone-900/40 border border-stone-800/30 p-5">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{t("whereToFind")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-stone-400">1</span>
              </div>
              <p className="text-sm text-stone-400">
                {t("step1")}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-stone-400">2</span>
              </div>
              <p className="text-sm text-stone-400">
                {t("step2")}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-stone-400">3</span>
              </div>
              <p className="text-sm text-stone-400">
                {t("step3")}
              </p>
            </div>
          </div>
        </div>

        {/* Example preview */}
        <div className="mt-6 rounded-xl bg-stone-900/60 border border-stone-800/40 p-4">
          <p className="text-[10px] font-medium text-stone-600 uppercase tracking-wider mb-2">{t("exampleMessage")}</p>
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
            {t("browseMarketplace")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
