// ============================================================
// Upgrade copy & links — what we say when a seller hits a limit
// ============================================================
// Two rules, both learned from getting them wrong:
//   1. Name the seller's REAL plan and its REAL limit. A Starter
//      seller was told they had used "all 10 free" AI generations.
//   2. Recommend the CHEAPEST plan that removes the limit. Running
//      out of AI listings was pitched as "Upgrade to Pro AI" (R499)
//      when Pro (R299) already has unlimited AI listings.
// Everything here is derived from lib/billing/plans.ts.
// ============================================================

import {
  aiListingLimit,
  cheapestUnlimitedAiPlan,
  findPlan,
  getPlan,
  parsePlanSlug,
  planPricePerMonth,
  type PlanSlug,
} from "@/lib/billing/plans";

/**
 * Billing page URL. Pass the plan the seller was just pitched so the
 * billing page can highlight it instead of making them find it again.
 */
export function billingHref(shopSlug: string, plan?: PlanSlug | null): string {
  const base = `/dashboard/${shopSlug}/billing`;
  return plan ? `${base}?plan=${plan}` : base;
}

/**
 * Read the `?plan=` parameter. Only real, paid plans are worth
 * highlighting; anything else (missing, unknown, "free") is ignored.
 */
export function parseHighlightPlan(value: string | string[] | undefined): PlanSlug | null {
  const slug = parsePlanSlug(Array.isArray(value) ? value[0] : value);
  if (!slug || getPlan(slug).priceMonthly === 0) return null;
  return slug;
}

// ── Choosing a plan before you have an account ──────────────
// "Choose Pro" on a public page has to survive sign-up and
// onboarding. The route /choose-plan (app/choose-plan/route.ts) is
// the single entry point: Clerk brings the visitor back to it after
// sign-up or sign-in, and it sends them on with the plan intact.

/** Route that resolves a chosen plan for whoever is signed in. */
export const CHOOSE_PLAN_PATH = "/choose-plan";

/**
 * Cookie that remembers the chosen plan across onboarding, for a
 * seller who has no shop yet (nowhere to send them with ?plan=).
 * Lasts as long as the free trial.
 */
export const PICKED_PLAN_COOKIE = "tf_plan";
export const PICKED_PLAN_COOKIE_MAX_AGE = 14 * 24 * 60 * 60;

/** Where a "Choose {plan}" button on a public page should point. */
export function choosePlanHref(plan: PlanSlug): string {
  if (getPlan(plan).priceMonthly === 0) return "/sign-up";
  const resume = `${CHOOSE_PLAN_PATH}?plan=${plan}`;
  // Clerk returns to redirect_url after sign-up, after sign-in from the
  // sign-up screen, and straight away if the visitor is already signed in.
  return `/sign-up?redirect_url=${encodeURIComponent(resume)}`;
}

/**
 * Where /choose-plan sends a signed-in visitor.
 *   has a shop → its billing page, plan highlighted
 *   no shop    → onboarding first; the plan waits in a cookie
 */
export function choosePlanDestination(input: {
  plan: PlanSlug | null;
  shopSlug: string | null;
}): { path: string; rememberPlan: PlanSlug | null } {
  if (input.shopSlug) {
    return { path: billingHref(input.shopSlug, input.plan), rememberPlan: null };
  }
  // /create-shop is the long-standing onboarding entry and forwards to
  // whichever onboarding flow is current.
  return { path: "/create-shop", rememberPlan: input.plan };
}

/**
 * Copy for the banner shown when PayFast sends the seller back after
 * paying. Two things can be wrong with a hard-coded "Welcome to Pro!":
 * the plan (they may have bought Starter), and the timing (PayFast's
 * confirmation reaches us separately and can land a few seconds after
 * the seller does, so the plan may not be active yet).
 */
export function paymentReturnCopy(input: {
  /** Plan named in our own return URL (?plan=), if valid */
  paidForPlan: PlanSlug | null;
  /** Slug of the paid plan the shop is entitled to right now, or null */
  activePlanSlug: string | null;
  /** Display name of that plan */
  activePlanName: string | null;
}): { title: string; body: string } {
  const { paidForPlan, activePlanSlug, activePlanName } = input;
  const paidForName = paidForPlan ? getPlan(paidForPlan).name : null;

  // Activated, and it is the plan they just paid for (or we were not
  // told which plan, and a paid plan is active).
  if (activePlanSlug && activePlanName && (!paidForPlan || paidForPlan === activePlanSlug)) {
    return {
      title: "Payment successful!",
      body: `Your ${activePlanName} plan is active. Welcome to ${activePlanName}! 🎉`,
    };
  }

  // Paid, but PayFast's confirmation has not reached us yet.
  return {
    title: "Payment received",
    body:
      `We're activating your ${paidForName ? `${paidForName} plan` : "plan"} — ` +
      "this usually takes less than a minute. Refresh this page if it hasn't updated.",
  };
}

export interface AiCreditsExhausted {
  /** Seller-facing sentence */
  message: string;
  /** The allowance they have used up */
  creditLimit: number;
  /** Cheapest plan with unlimited AI listings */
  recommendedPlan: PlanSlug;
}

/**
 * Copy for "you are out of AI listings", for the plan the seller is
 * actually on. `planSlug` is the effective plan (Free when a paid
 * plan has lapsed).
 */
export function aiCreditsExhausted(planSlug: string): AiCreditsExhausted {
  const plan = findPlan(planSlug) ?? getPlan("free");
  // Only limited plans can run out; fall back to the Free allowance
  // rather than print "all null".
  const creditLimit = aiListingLimit(plan.slug) ?? aiListingLimit("free") ?? 0;
  const recommended = cheapestUnlimitedAiPlan();

  return {
    message:
      `You've used all ${creditLimit} AI listings included in the ${plan.name} plan. ` +
      `Upgrade to ${recommended.name} (${planPricePerMonth(recommended.slug)}) for unlimited AI listings.`,
    creditLimit,
    recommendedPlan: recommended.slug,
  };
}
