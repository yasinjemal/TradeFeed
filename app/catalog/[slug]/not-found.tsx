// ============================================================
// Not Found — Catalog (/catalog/[slug])
// ============================================================
// Shown when a shop slug doesn't exist or is inactive.
// Keep it friendly — the buyer might have a stale link.
// ============================================================

import Link from "next/link";

export default function CatalogNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-stone-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v4.1"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-stone-800 mb-2">
          Shop Not Found
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed mb-6">
          This catalog link may be outdated or the shop may no longer be active.
          Double-check the link from your seller.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Go to TradeFeed home
        </Link>
      </div>
    </div>
  );
}
