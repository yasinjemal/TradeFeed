"use client";

import Link from "next/link";

interface ProductUsageMeterProps {
  current: number;
  limit: number;
  unlimited: boolean;
  planName: string;
  shopSlug: string;
  /** Show compact version (single line) */
  compact?: boolean;
}

/**
 * Visual progress bar showing product usage against plan limit.
 * Renders upgrade CTAs when approaching or hitting the limit.
 */
export function ProductUsageMeter({
  current,
  limit,
  unlimited,
  planName,
  shopSlug,
  compact = false,
}: ProductUsageMeterProps) {
  if (unlimited) {
    if (compact) return null; // No meter needed for unlimited plans
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-lg">∞</span>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Unlimited Products</p>
              <p className="text-xs text-emerald-600">{planName} plan · {current} products</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
            {planName}
          </span>
        </div>
      </div>
    );
  }

  const percent = Math.min((current / limit) * 100, 100);
  const atLimit = current >= limit;
  const nearLimit = current >= Math.floor(limit * 0.8);

  // Color states
  const barColor = atLimit
    ? "bg-red-500"
    : nearLimit
      ? "bg-amber-500"
      : "bg-emerald-500";
  const bgColor = atLimit
    ? "bg-red-50 border-red-200"
    : nearLimit
      ? "bg-amber-50 border-amber-200"
      : "bg-stone-50 border-stone-200";
  const textColor = atLimit
    ? "text-red-700"
    : nearLimit
      ? "text-amber-700"
      : "text-stone-700";

  if (compact) {
    return (
      <div className={`rounded-lg border p-3 ${bgColor}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-sm font-bold ${textColor}`}>
              {current}/{limit}
            </span>
            <span className="text-xs text-stone-500">products</span>
          </div>
          <div className="flex-1 max-w-[120px]">
            <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          {(atLimit || nearLimit) && (
            <Link
              href={`/dashboard/${shopSlug}/billing`}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap"
            >
              Upgrade →
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${textColor}`}>
            {atLimit
              ? "🚫 Product limit reached"
              : nearLimit
                ? "🔥 Almost at your limit"
                : "📦 Product Usage"}
          </p>
          <p className="text-xs text-stone-500 mt-0.5">
            {current} of {limit} products used · {planName} plan
          </p>
        </div>
        <span className={`text-2xl font-extrabold ${textColor}`}>
          {current}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-white/80 overflow-hidden border border-stone-200/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* CTA */}
      {atLimit && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-red-600">
            Upgrade to Pro for unlimited products + advanced analytics.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 whitespace-nowrap"
          >
            ⚡ Go Pro — R199/mo
          </Link>
        </div>
      )}
      {nearLimit && !atLimit && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-amber-600">
            Only {limit - current} product{limit - current === 1 ? "" : "s"} left. Upgrade for unlimited.
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold hover:bg-amber-200 transition-colors whitespace-nowrap"
          >
            ⚡ Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
