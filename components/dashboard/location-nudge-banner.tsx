// ============================================================
// Component — Location Nudge Banner
// ============================================================
// Shown on the dashboard overview when a shop has no city set.
// ~74 sellers pre-date the required-location signup (June 2026);
// until they add a city they are invisible on the marketplace
// city/province pages, so this is a discovery problem for them
// and a thin-content problem for TradeFeed SEO.
// Disappears on its own once the seller saves a city.
// ============================================================

import Link from "next/link";

export function LocationNudgeBanner({ shopSlug }: { shopSlug: string }) {
  return (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-4">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">
        📍
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-900">
          Buyers near you can&apos;t find your shop yet
        </p>
        <p className="text-xs text-sky-700 mt-0.5">
          Add your city so your shop appears when buyers browse their area — it takes 20 seconds.
        </p>
      </div>
      <Link
        href={`/dashboard/${shopSlug}/settings`}
        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm"
      >
        Add City →
      </Link>
    </div>
  );
}
