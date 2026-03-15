"use client";

import Link from "next/link";

interface ProFeatureGateProps {
  /** Content to show blurred behind the overlay */
  children: React.ReactNode;
  /** Feature name shown in the CTA */
  feature: string;
  /** Shop slug for upgrade link */
  shopSlug: string;
  /** Whether the user has Pro access */
  hasAccess: boolean;
  /** Optional short description */
  description?: string;
}

/**
 * Wraps content in a blur overlay with an upgrade CTA when the user
 * is on the Free plan. Pro users see content normally.
 */
export function ProFeatureGate({
  children,
  feature,
  shopSlug,
  hasAccess,
  description,
}: ProFeatureGateProps) {
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-[6px] opacity-60" aria-hidden="true">
        {children}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] rounded-2xl">
        <div className="text-center px-6 py-8 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1">{feature}</h3>
          <p className="text-sm text-stone-600 mb-5">
            {description ?? "Upgrade to Pro to unlock this feature and grow your business."}
          </p>
          <Link
            href={`/dashboard/${shopSlug}/billing`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            ⚡ Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
