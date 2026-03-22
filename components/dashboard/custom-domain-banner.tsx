"use client";

import Link from "next/link";

interface CustomDomainBannerProps {
  shopSlug: string;
  planSlug: string | null;
  hasCustomDomain: boolean;
}

/**
 * Dashboard upgrade CTA banner — shown to Free/Starter sellers
 * who don't have a custom domain yet. Promotes Pro plan.
 */
export function CustomDomainBanner({ shopSlug, planSlug, hasCustomDomain }: CustomDomainBannerProps) {
  // Don't show if already on Pro/Pro AI, or if they already have a domain
  const isPro = planSlug === "pro" || planSlug === "pro-ai";
  if (isPro || hasCustomDomain) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 sm:p-6 shadow-sm">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl -translate-y-10 translate-x-10" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <span className="text-2xl">🌐</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-base">
            Get your own domain
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Use <strong className="text-blue-700">shop.yourbrand.co.za</strong> instead of tradefeed.co.za — build trust and look professional.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              Free SSL certificate
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              5-min setup
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              SA registrar guides
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/dashboard/${shopSlug}/billing`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 transition-all flex-shrink-0"
        >
          Upgrade to Pro
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
