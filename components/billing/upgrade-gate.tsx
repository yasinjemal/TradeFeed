"use client";

import Link from "next/link";

interface UpgradeGateProps {
  current: number;
  limit: number;
  shopSlug: string;
  /** "soft" shows a dismissible warning, "hard" blocks with no dismiss */
  mode: "soft" | "hard";
}

/**
 * Upgrade gate shown when sellers approach or hit their product limit.
 * - Soft gate (80%+): amber warning banner, dismissible, CTA to upgrade
 * - Hard gate (100%): red blocker, no dismiss, action buttons
 */
export function UpgradeGate({ current, limit, shopSlug, mode }: UpgradeGateProps) {
  const slotsLeft = limit - current;

  if (mode === "hard") {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-900 mb-2">Product limit reached</h2>
        <p className="text-sm text-red-700 mb-1">
          You&apos;ve used all <span className="font-bold">{limit}</span> product slots on the Free plan.
        </p>
        <p className="text-xs text-red-600/70 mb-6">
          Upgrade to Pro for unlimited products, AI listings, and analytics — that&apos;s less than R7/day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            ⚡ Upgrade to Pro
          </Link>
          <Link
            href={`/dashboard/${shopSlug}/products`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Soft gate — dismissible amber banner
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          {slotsLeft <= 0
            ? "You've hit your product limit!"
            : `Only ${slotsLeft} product slot${slotsLeft !== 1 ? "s" : ""} left on the Free plan`}
        </p>
        <p className="text-xs text-amber-700 mt-1">
          You&apos;re using <span className="font-bold">{current}</span> of{" "}
          <span className="font-bold">{limit}</span> products.
          Upgrade to Pro for unlimited products and grow your business without limits.
        </p>
        <Link
          href={`/dashboard/${shopSlug}/billing`}
          className="inline-flex items-center gap-1.5 mt-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          ⚡ Go Pro — Unlimited Products
        </Link>
      </div>
    </div>
  );
}
