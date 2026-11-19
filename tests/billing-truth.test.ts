// ============================================================
// Billing truth — what sellers read must match lib/billing/plans.ts
// ============================================================
// Each of these was wrong in production code at once: "R199/mo" and
// "less than R7/day" for a plan that costs R299, three different
// answers to "which plan is most popular", "Welcome to Pro!" for a
// Starter purchase, and Starter sellers told they had used "all 10
// free" AI listings and should buy Pro AI.
//
// The first block scans the source tree, so a price typed into a
// string fails here the day plans.ts changes — or the day someone
// types a new one.
// ============================================================

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import {
  PLANS,
  aiListingLimit,
  annualMonthlyEquivalent,
  annualSavings,
  cheapestUnlimitedAiPlan,
  cheapestUnlimitedProductsPlan,
  findPlan,
  getPlan,
  isPopularPlan,
  parsePlanSlug,
  planDailyCostCeiling,
  planLessThanPerDay,
  planPrice,
  planPricePerMonth,
} from "@/lib/billing/plans";
import {
  aiCreditsExhausted,
  billingHref,
  choosePlanDestination,
  choosePlanHref,
  parseHighlightPlan,
  paymentReturnCopy,
} from "@/lib/billing/upgrade-copy";

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf8");
const PAID_PLANS = PLANS.filter((p) => p.priceMonthly > 0);

// ── Source scan ──────────────────────────────────────────────

/** "R299/mo", "R2,999/year", "R9.83 a day", "R99 per month" … */
const PERIOD_PRICE = /R\s?(\d[\d,]*(?:\.\d+)?)\s*(?:\/|\bper\s+|\ba\s+)\s*(mo|month|yr|year|day)\b/gi;

/**
 * Files still allowed to type a plan price into a string. Their
 * numbers are checked against plans.ts below, so they cannot drift —
 * they just have not been moved onto the helpers yet. Keep this list
 * shrinking; do not add to it.
 */
const MAY_HARDCODE: Record<string, string> = {
  "lib/billing/plans.ts": "the source of truth; examples in its own comments",
  "app/sell/page.tsx": "legacy landing page, being replaced by the TF landing",
  "components/landing/custom-domain-section.tsx": "legacy landing section",
  "components/product/video-manager.tsx": "product-creation redesign in progress",
};

/** Period prices that are real but are not TradeFeed plan prices. */
const NOT_A_PLAN_PRICE: Record<string, string[]> = {
  // What a .co.za domain costs at a registrar.
  "components/landing/custom-domain-section.tsx": ["R60/year"],
  // Done-for-you growth service, quoted separately from the plans.
  "components/growth/growth-application-form.tsx": ["R3,500/month"],
};

interface Found {
  file: string;
  line: number;
  text: string;
  amount: number;
  unit: "month" | "year" | "day";
}

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(path.join(root, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(path.join(root, rel)).isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx|json)$/.test(name)) out.push(rel);
  }
  return out;
}

function findPeriodPrices(): Found[] {
  const found: Found[] = [];
  for (const file of ["app", "components", "lib", "messages"].flatMap((d) => sourceFiles(d))) {
    read(file)
      .split("\n")
      .forEach((lineText, index) => {
        for (const match of lineText.matchAll(PERIOD_PRICE)) {
          if (NOT_A_PLAN_PRICE[file]?.includes(match[0])) continue;
          const rawUnit = match[2]!.toLowerCase();
          found.push({
            file,
            line: index + 1,
            text: match[0],
            amount: Number(match[1]!.replace(/,/g, "")),
            unit: rawUnit.startsWith("mo") ? "month" : rawUnit.startsWith("y") ? "year" : "day",
          });
        }
      });
  }
  return found;
}

/** Is this figure something plans.ts actually says? */
function isTruePlanFigure({ amount, unit }: Found): boolean {
  if (unit === "month") {
    return PAID_PLANS.some((p) => p.priceMonthly === amount || annualMonthlyEquivalent(p) === amount);
  }
  if (unit === "year") {
    return PAID_PLANS.some((p) => p.priceAnnual === amount || annualSavings(p) === amount);
  }
  // Per day: at or above a plan's real daily cost (to the cent), and no
  // looser than the next whole rand ("less than R10/day" for R9.83).
  return PAID_PLANS.some((p) => {
    const dailyToTheCent = Math.floor(((p.priceMonthly * 12) / 365) * 100) / 100;
    return amount >= dailyToTheCent && amount <= planDailyCostCeiling(p.slug);
  });
}

describe("no price in the source tree contradicts plans.ts", () => {
  const found = findPeriodPrices();

  test("the scan is looking at real files", () => {
    assert.ok(found.length > 0, "scan found nothing — the pattern or the paths are broken");
    assert.ok(found.some((f) => f.file === "lib/billing/plans.ts"));
  });

  test("every typed-in price is a real plan price", () => {
    const wrong = found.filter((f) => !isTruePlanFigure(f));
    assert.deepEqual(
      wrong.map((f) => `${f.file}:${f.line} says "${f.text}"`),
      [],
      "These prices do not match lib/billing/plans.ts",
    );
  });

  test("prices are derived from plans.ts, not typed into strings", () => {
    const typedIn = found.filter((f) => !(f.file in MAY_HARDCODE));
    assert.deepEqual(
      typedIn.map((f) => `${f.file}:${f.line} "${f.text}"`),
      [],
      "Use planPricePerMonth() / planLessThanPerDay() from lib/billing/plans.ts instead of typing the price",
    );
  });

  test("the scan catches the prices that were wrong before", () => {
    const catches = (text: string) =>
      [...text.matchAll(PERIOD_PRICE)].some(
        (m) =>
          !isTruePlanFigure({
            file: "x",
            line: 1,
            text: m[0],
            amount: Number(m[1]!.replace(/,/g, "")),
            unit: m[2]!.toLowerCase().startsWith("mo") ? "month" : m[2]!.toLowerCase().startsWith("y") ? "year" : "day",
          }),
      );
    assert.ok(catches("⚡ Upgrade to Pro — R199/mo"));
    assert.ok(catches("⚡ Go Pro — R199/mo"));
    assert.ok(catches("that's less than R7/day"));
    assert.ok(!catches(`Upgrade to Pro — ${planPricePerMonth("pro", "short")}`));
  });

  test("locale files carry the real Pro price", () => {
    for (const locale of ["en", "af", "zu", "xh", "st"]) {
      const messages = JSON.parse(read(`messages/${locale}.json`));
      assert.equal(messages.landing.pricing.proPlan.price, planPrice("pro"), `messages/${locale}.json`);
    }
  });
});

// ── Price helpers ────────────────────────────────────────────

describe("price helpers", () => {
  test("format straight from the plan table", () => {
    for (const plan of PAID_PLANS) {
      assert.equal(planPrice(plan.slug), `R${plan.priceMonthly}`);
      assert.equal(planPricePerMonth(plan.slug), `R${plan.priceMonthly}/month`);
      assert.equal(planPricePerMonth(plan.slug, "short"), `R${plan.priceMonthly}/mo`);
    }
  });

  test("'less than R{n}/day' is always true, and never loose by more than a rand", () => {
    for (const plan of PAID_PLANS) {
      const daily = (plan.priceMonthly * 12) / 365;
      const ceiling = planDailyCostCeiling(plan.slug);
      assert.ok(daily < ceiling, `${plan.name}: R${daily.toFixed(2)}/day is not less than R${ceiling}`);
      assert.ok(ceiling - daily <= 1, `${plan.name}: R${ceiling} overstates R${daily.toFixed(2)} by more than R1`);
      assert.equal(planLessThanPerDay(plan.slug), `less than R${ceiling}/day`);
    }
  });

  test("untrusted slugs are looked up safely", () => {
    assert.equal(findPlan("pro")?.name, "Pro");
    for (const junk of ["business", "", "PRO", null, undefined]) {
      assert.equal(findPlan(junk), undefined);
    }
    assert.equal(parsePlanSlug("pro-ai"), "pro-ai");
    assert.equal(parsePlanSlug(42), null);
    assert.equal(parsePlanSlug("<script>"), null);
  });
});

// ── "Most popular" ───────────────────────────────────────────

describe("most popular plan", () => {
  test("exactly one plan is popular, and it is a paid plan", () => {
    const popular = PLANS.filter((p) => p.popular);
    assert.equal(popular.length, 1);
    assert.ok(popular[0]!.priceMonthly > 0);
    assert.equal(isPopularPlan(popular[0]!.slug), true);
    assert.equal(isPopularPlan("not-a-plan"), false);
  });

  test("the billing dashboard asks plans.ts instead of naming a plan", () => {
    const source = read("components/billing/billing-dashboard.tsx");
    assert.match(source, /isPopularPlan\(plan\.slug\)/);
    assert.doesNotMatch(source, /isPopular\s*=\s*plan\.slug\s*===/);
  });

  test("the legacy /sell page badges whichever plan plans.ts says", () => {
    const source = read("app/sell/page.tsx");
    assert.match(source, /isPopularPlan\(/);
    // The label exists once, inside the component that checks plans.ts —
    // not pasted onto a particular plan's card.
    assert.equal(source.split("MOST POPULAR").length - 1, 1);
    for (const slug of ["starter", "pro"]) {
      assert.ok(source.includes(`<MostPopularBadge slug="${slug}" />`), `${slug} card`);
    }
  });
});

// ── Limits: enforcement and copy read the same numbers ───────

describe("AI listing allowance", () => {
  test("comes from the plan table", () => {
    assert.equal(aiListingLimit("free"), getPlan("free").aiGenerationsPerMonth);
    assert.equal(aiListingLimit("starter"), getPlan("starter").aiGenerationsPerMonth);
    assert.equal(aiListingLimit("pro"), null);
    assert.equal(aiListingLimit("pro-ai"), null);
  });

  test("an unknown or missing plan gets the Free allowance, never unlimited", () => {
    assert.equal(aiListingLimit("mystery"), aiListingLimit("free"));
    assert.equal(aiListingLimit(null), aiListingLimit("free"));
    assert.notEqual(aiListingLimit("mystery"), null);
  });

  test("the enforcement code reads the plan table rather than keeping its own numbers", () => {
    const source = read("lib/db/ai.ts");
    assert.match(source, /aiListingLimit\(planSlug\)/);
    assert.doesNotMatch(source, /_AI_CREDITS\s*=\s*\d/);
  });

  test("the cheapest plan that removes each limit", () => {
    assert.equal(cheapestUnlimitedAiPlan().slug, "pro");
    assert.equal(cheapestUnlimitedProductsPlan().slug, "starter");
  });
});

// ── Messages name the seller's real plan ─────────────────────

describe("out of AI listings", () => {
  test("a Starter seller is told about Starter's 25 — not 'all 10 free'", () => {
    const { message, creditLimit, recommendedPlan } = aiCreditsExhausted("starter");
    assert.equal(creditLimit, 25);
    assert.match(message, /all 25 AI listings included in the Starter plan/);
    assert.doesNotMatch(message, /\bfree\b/i);
    assert.equal(recommendedPlan, "pro");
  });

  test("a Free seller is told about Free's 10", () => {
    const { message, creditLimit } = aiCreditsExhausted("free");
    assert.equal(creditLimit, 10);
    assert.match(message, /all 10 AI listings included in the Free plan/);
  });

  test("recommends the cheapest plan with unlimited AI — Pro, not Pro AI — at its real price", () => {
    for (const slug of ["free", "starter"]) {
      const { message } = aiCreditsExhausted(slug);
      assert.match(message, new RegExp(`Upgrade to Pro \\(${planPricePerMonth("pro")}\\) for unlimited AI listings`));
      assert.doesNotMatch(message, /Pro AI/);
    }
  });

  test("a lapsed or unknown plan falls back to Free wording", () => {
    assert.match(aiCreditsExhausted("mystery").message, /Free plan/);
  });

  test("the API route sends this copy and the seller's own allowance", () => {
    const source = read("app/api/ai/generate-product/route.ts");
    assert.match(source, /aiCreditsExhausted\(planSlug\)/);
    assert.match(source, /total: creditLimit/);
    assert.doesNotMatch(source, /FREE_AI_CREDITS/);
    assert.doesNotMatch(source, /Upgrade to Pro AI/);
  });
});

describe("back from PayFast", () => {
  test("names the plan that was bought — Starter is not 'Pro'", () => {
    const copy = paymentReturnCopy({ paidForPlan: "starter", activePlanSlug: "starter", activePlanName: "Starter" });
    assert.equal(copy.title, "Payment successful!");
    assert.match(copy.body, /Your Starter plan is active\. Welcome to Starter!/);
    assert.doesNotMatch(copy.body, /\bPro\b/);
  });

  test("does not claim the plan is active before PayFast has confirmed it", () => {
    const copy = paymentReturnCopy({ paidForPlan: "pro", activePlanSlug: null, activePlanName: null });
    assert.equal(copy.title, "Payment received");
    assert.match(copy.body, /activating your Pro plan/);
    assert.doesNotMatch(copy.body, /is active|Welcome/);
  });

  test("an upgrade still shows 'activating' while the old plan is the active one", () => {
    const copy = paymentReturnCopy({ paidForPlan: "pro", activePlanSlug: "starter", activePlanName: "Starter" });
    assert.match(copy.body, /activating your Pro plan/);
  });

  test("with no plan in the URL it reports whatever is active", () => {
    const copy = paymentReturnCopy({ paidForPlan: null, activePlanSlug: "pro-ai", activePlanName: "Pro AI" });
    assert.match(copy.body, /Welcome to Pro AI!/);
  });

  test("the billing page no longer hard-codes the welcome", () => {
    assert.doesNotMatch(read("app/dashboard/[slug]/billing/page.tsx"), /Welcome to Pro/);
  });

  test("the PayFast return URL carries the plan that was bought", () => {
    assert.match(read("lib/payfast.ts"), /billing\?status=success&plan=\$\{encodeURIComponent\(params\.planSlug\)\}/);
  });
});

// ── The chosen plan is carried through ───────────────────────

describe("carrying the chosen plan", () => {
  test("billing links carry the plan as a query parameter", () => {
    assert.equal(billingHref("my-shop"), "/dashboard/my-shop/billing");
    assert.equal(billingHref("my-shop", null), "/dashboard/my-shop/billing");
    assert.equal(billingHref("my-shop", "pro"), "/dashboard/my-shop/billing?plan=pro");
  });

  test("only real, paid plans are highlighted", () => {
    assert.equal(parseHighlightPlan("starter"), "starter");
    assert.equal(parseHighlightPlan(["pro", "starter"]), "pro");
    for (const ignored of [undefined, "", "free", "business", "PRO", "../admin"]) {
      assert.equal(parseHighlightPlan(ignored), null, String(ignored));
    }
  });

  test("'Choose Pro' on the pricing page comes back to /choose-plan after sign-up", () => {
    const href = choosePlanHref("pro");
    const url = new URL(href, "https://tradefeed.co.za");
    assert.equal(url.pathname, "/sign-up");
    assert.equal(url.searchParams.get("redirect_url"), "/choose-plan?plan=pro");
    assert.equal(choosePlanHref("free"), "/sign-up", "the Free plan has nothing to carry");
  });

  test("a seller with a shop goes straight to billing with the plan highlighted", () => {
    assert.deepEqual(choosePlanDestination({ plan: "starter", shopSlug: "my-shop" }), {
      path: "/dashboard/my-shop/billing?plan=starter",
      rememberPlan: null,
    });
  });

  test("a seller without a shop is onboarded first, and the plan is remembered", () => {
    assert.deepEqual(choosePlanDestination({ plan: "starter", shopSlug: null }), {
      path: "/create-shop",
      rememberPlan: "starter",
    });
  });

  test("the pricing page and the upgrade nudges use these links", () => {
    assert.match(read("app/pricing/page.tsx"), /choosePlanHref\(plan\.slug\)/);
    for (const file of [
      "components/billing/trial-banner.tsx",
      "components/billing/product-usage-meter.tsx",
      "components/billing/upgrade-gate.tsx",
      "app/dashboard/[slug]/products/page.tsx",
    ]) {
      const source = read(file);
      assert.match(source, /billingHref\(/, file);
      assert.doesNotMatch(source, /\/billing`\}/, `${file} still links to the bare billing page`);
    }
  });
});
