"use client";

// ============================================================
// Tracking Search Bar — client component with form submission
// ============================================================
// Allows buyers to enter an order number and navigate to the
// tracking page. Used on /track/[orderNumber] (not found state)
// and the tracking landing page.
// ============================================================

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function TrackingSearch() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim().toUpperCase();
    if (!trimmed) return;

    startTransition(() => {
      router.push(`/track/${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="e.g. TF-20260224-A1B2"
        className="flex-1 px-4 py-2.5 rounded-xl bg-stone-800/80 border border-stone-700/50 text-sm text-stone-200 placeholder:text-stone-600 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
        autoFocus
        required
      />
      <button
        type="submit"
        disabled={isPending || !orderNumber.trim()}
        className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
      >
        {isPending ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
        Track
      </button>
    </form>
  );
}
