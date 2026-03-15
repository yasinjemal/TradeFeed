"use client";

import Link from "next/link";

interface TrialBannerProps {
  daysLeft: number;
  shopSlug: string;
}

/**
 * Shows a countdown banner during Pro trial. Urgency increases as the trial
 * nears expiry. Hidden once trial ends (server handles that check).
 */
export function TrialBanner({ daysLeft, shopSlug }: TrialBannerProps) {
  const urgent = daysLeft <= 3;
  const ending = daysLeft <= 7;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 ${
        urgent
          ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
          : ending
            ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
            : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
            urgent ? "bg-red-100" : ending ? "bg-amber-100" : "bg-emerald-100"
          }`}
        >
          {urgent ? "⏰" : ending ? "⚡" : "🎉"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-bold text-sm ${
                urgent ? "text-red-900" : ending ? "text-amber-900" : "text-emerald-900"
              }`}
            >
              {urgent
                ? `Pro trial expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}!`
                : ending
                  ? `${daysLeft} days left on your Pro trial`
                  : `You're on a free Pro trial — ${daysLeft} days left`}
            </h3>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                urgent ? "bg-red-500" : ending ? "bg-amber-500" : "bg-emerald-500"
              }`}
            >
              PRO TRIAL
            </span>
          </div>
          <p
            className={`text-[11px] mt-1 ${
              urgent ? "text-red-600" : ending ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {urgent
              ? "Keep unlimited products, analytics, and all Pro features — upgrade before the trial ends."
              : "You have full access to unlimited products, analytics, revenue insights, and customer CRM."}
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className={`inline-flex items-center gap-1.5 mt-3 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all ${
              urgent
                ? "bg-gradient-to-r from-red-500 to-rose-600"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600"
            }`}
          >
            {urgent ? "⚡ Upgrade Now — Keep Pro" : "⚡ Upgrade to Pro — R199/mo"}
          </Link>
        </div>
      </div>
    </div>
  );
}
