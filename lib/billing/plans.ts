// ============================================================
// Canonical Plan Definitions — single source of truth
// ============================================================
// Every surface that renders pricing reads from here:
//   - app/page.tsx            (landing pricing section + comparison)
//   - components/tf/landing/tf-landing.tsx
//   - app/pricing/page.tsx
//   - scripts/seed-plans.ts   (Plan DB rows)
//
// Enforcement lives elsewhere but MUST agree with these numbers:
//   - lib/db/ai.ts            (reads aiGenerationsPerMonth from here)
//   - lib/db/subscriptions.ts (product limits)
//   - app/actions/domains.ts  (custom domain = above Starter)
// If you change a number here, change the enforcement too.
// ============================================================

export type PlanSlug = "free" | "starter" | "pro" | "pro-ai";

export interface PlanDef {
  slug: PlanSlug;
  name: string;
  /** Monthly price in rand (0 = free) */
  priceMonthly: number;
  /** Annual price in rand (null = no annual option) */
  priceAnnual: number | null;
  /** One-line positioning for pricing cards */
  blurb: string;
  /** Short marketing bullets for pricing cards */
  features: string[];
  /** Full feature list seeded into the Plan DB row */
  dbFeatures: string[];
  /** Max products (0 = unlimited) — mirrors Plan.productLimit */
  productLimit: number;
  /** AI listing generations per month (null = unlimited) */
  aiGenerationsPerMonth: number | null;
  popular: boolean;
}

export const PLANS: readonly PlanDef[] = [
  {
    slug: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: null,
    blurb: "Everything you need to start selling today.",
    features: [
      "20 products free — forever",
      "10 AI listings a month",
      "Your own catalogue link",
      "WhatsApp order messages",
      "Order tracking numbers",
    ],
    dbFeatures: [
      "Up to 20 products",
      "10 AI listings a month",
      "WhatsApp checkout",
      "Public catalog page",
      "Basic analytics",
    ],
    productLimit: 20,
    aiGenerationsPerMonth: 10,
    popular: false,
  },
  {
    slug: "starter",
    name: "Starter",
    priceMonthly: 99,
    priceAnnual: 999,
    blurb: "For shops outgrowing 20 products.",
    features: [
      "Unlimited products",
      "25 AI listings a month",
      "Revenue dashboard",
      "Instant order alerts",
      "Everything in Free",
    ],
    dbFeatures: [
      "Unlimited products",
      "25 AI listings a month",
      "WhatsApp checkout",
      "Public catalog page",
      "Revenue dashboard",
      "Bulk product upload",
      "Instant order alerts",
      "Buyer reviews & ratings",
    ],
    productLimit: 0,
    aiGenerationsPerMonth: 25,
    popular: false,
  },
  {
    slug: "pro",
    name: "Pro",
    priceMonthly: 299,
    priceAnnual: 2999,
    blurb: "For sellers doing daily volume.",
    features: [
      "Unlimited AI listings",
      "Custom domain (yourbrand.co.za)",
      "Team accounts (up to 3)",
      "Priority WhatsApp support",
      "Everything in Starter",
    ],
    dbFeatures: [
      "Unlimited products",
      "Unlimited AI listings",
      "Custom domain",
      "Priority WhatsApp support",
      "Enhanced promoted listings",
      "Advanced analytics",
      "Team accounts (up to 3)",
    ],
    productLimit: 0,
    aiGenerationsPerMonth: null,
    popular: true,
  },
  {
    slug: "pro-ai",
    name: "Pro AI",
    priceMonthly: 499,
    priceAnnual: 4999,
    blurb: "Full AI automation for serious shops.",
    features: [
      "AI auto title, description & SEO from photo",
      "Catalogue import",
      "Background removal",
      "Listing translations",
      "Everything in Pro",
    ],
    dbFeatures: [
      "Everything in Pro",
      "AI auto title from photo",
      "AI product description",
      "AI category suggestion",
      "AI SEO tags & meta",
      "Catalogue import",
      "Background removal",
      "Listing translations",
    ],
    productLimit: 0,
    aiGenerationsPerMonth: null,
    popular: false,
  },
] as const;

export function getPlan(slug: PlanSlug): PlanDef {
  // PLANS covers every PlanSlug, so this never actually returns undefined
  return PLANS.find((p) => p.slug === slug)!;
}

/**
 * Look up a plan by a slug we do not control (URL parameter, DB row,
 * API response). Returns undefined for anything that is not a plan.
 */
export function findPlan(slug: string | null | undefined): PlanDef | undefined {
  return PLANS.find((p) => p.slug === slug);
}

/** Narrow an untrusted value to a real plan slug, or null. */
export function parsePlanSlug(value: unknown): PlanSlug | null {
  return typeof value === "string" ? (findPlan(value)?.slug ?? null) : null;
}

/** The plan every surface badges as "Most popular". */
export function isPopularPlan(slug: string | null | undefined): boolean {
  return findPlan(slug)?.popular ?? false;
}

// ── Price copy ───────────────────────────────────────────────
// Every price a seller reads must come from PLANS. Use these
// helpers instead of typing a number into a string —
// tests/billing-truth.test.ts fails the build on a typed-in price
// that no longer matches.

/** "R299" */
export function planPrice(slug: PlanSlug): string {
  return `R${getPlan(slug).priceMonthly}`;
}

/** "R299/month" (long) or "R299/mo" (short) */
export function planPricePerMonth(slug: PlanSlug, style: "long" | "short" = "long"): string {
  return `${planPrice(slug)}/${style === "long" ? "month" : "mo"}`;
}

/**
 * The smallest whole-rand amount the plan costs LESS than per day,
 * averaged over a year — Pro at R299 is R9.83 a day, so 10, as in
 * "less than R10/day". Always strictly greater than the real daily
 * cost, so the claim stays true.
 */
export function planDailyCostCeiling(slug: PlanSlug): number {
  return Math.floor((getPlan(slug).priceMonthly * 12) / 365) + 1;
}

/** "less than R10/day" */
export function planLessThanPerDay(slug: PlanSlug): string {
  return `less than R${planDailyCostCeiling(slug)}/day`;
}

// ── Limits ───────────────────────────────────────────────────

/**
 * AI listing allowance for a plan slug (null = unlimited).
 * Unknown slugs get the Free allowance — the safe default.
 */
export function aiListingLimit(slug: string | null | undefined): number | null {
  return (findPlan(slug) ?? getPlan("free")).aiGenerationsPerMonth;
}

/** Cheapest plan with no AI listing limit — the honest upgrade when credits run out. */
export function cheapestUnlimitedAiPlan(): PlanDef {
  return cheapestPlanWhere((p) => p.aiGenerationsPerMonth === null);
}

/** Cheapest plan with no product limit — the honest upgrade at the 20-product cap. */
export function cheapestUnlimitedProductsPlan(): PlanDef {
  return cheapestPlanWhere((p) => p.productLimit === 0);
}

function cheapestPlanWhere(predicate: (plan: PlanDef) => boolean): PlanDef {
  const match = [...PLANS].filter(predicate).sort((a, b) => a.priceMonthly - b.priceMonthly)[0];
  // The top plan removes every limit, so there is always a match.
  return match ?? PLANS[PLANS.length - 1]!;
}

/** Rand saved per year with annual billing (0 when no annual option) */
export function annualSavings(plan: PlanDef): number {
  if (plan.priceAnnual === null) return 0;
  return plan.priceMonthly * 12 - plan.priceAnnual;
}

/** Effective monthly price on annual billing, rounded to the rand */
export function annualMonthlyEquivalent(plan: PlanDef): number | null {
  if (plan.priceAnnual === null) return null;
  return Math.round(plan.priceAnnual / 12);
}

// ── Feature comparison table ─────────────────────────────────
// Values are ordered [free, starter, pro, pro-ai].

export interface ComparisonRow {
  feature: string;
  values: [string | boolean, string | boolean, string | boolean, string | boolean];
}

export const PLAN_COMPARISON: readonly ComparisonRow[] = [
  { feature: "Products", values: ["20", "∞", "∞", "∞"] },
  { feature: "AI listings / month", values: ["10", "25", "∞", "∞"] },
  { feature: "AI auto title, description & SEO", values: ["10/mo", "25/mo", true, true] },
  { feature: "WhatsApp checkout", values: [true, true, true, true] },
  { feature: "Marketplace listing", values: [true, true, true, true] },
  { feature: "Revenue dashboard", values: [false, true, true, true] },
  { feature: "Promoted listings", values: [false, true, true, true] },
  { feature: "Custom domain", values: [false, false, true, true] },
  { feature: "Team accounts", values: [false, false, "3 users", "3 users"] },
  { feature: "Priority support", values: [false, false, true, true] },
  { feature: "Catalogue import", values: [false, false, false, true] },
  { feature: "Background removal", values: [false, false, false, true] },
  { feature: "Listing translations", values: [false, false, false, true] },
] as const;
