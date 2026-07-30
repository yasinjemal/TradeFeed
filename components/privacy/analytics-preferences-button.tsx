"use client";

import { SlidersHorizontal } from "lucide-react";

import { ANALYTICS_CONSENT_OPEN_EVENT } from "@/lib/analytics/consent";

export function AnalyticsPreferencesButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(new Event(ANALYTICS_CONSENT_OPEN_EVENT))
      }
      aria-haspopup="dialog"
      className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-700 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
    >
      <SlidersHorizontal className="size-4" aria-hidden="true" />
      Manage analytics preferences
    </button>
  );
}
