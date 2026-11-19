import Link from "next/link";
import { getPlan, planPricePerMonth, type PlanSlug } from "@/lib/billing/plans";
import { billingHref } from "@/lib/billing/upgrade-copy";

/**
 * Shown on the dashboard to a seller who chose a paid plan on the
 * pricing page before they had a shop. Onboarding comes first, so
 * this is where the choice they made resurfaces.
 */
export function PickedPlanReminder({ shopSlug, plan }: { shopSlug: string; plan: PlanSlug }) {
  const { name } = getPlan(plan);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-900">
          You picked {name} — {planPricePerMonth(plan)}
        </p>
        <p className="mt-0.5 text-xs text-emerald-700">
          Nothing has been charged yet. Finish upgrading whenever you&apos;re ready.
        </p>
      </div>
      <Link
        href={billingHref(shopSlug, plan)}
        className="inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Continue with {name}
      </Link>
    </div>
  );
}
