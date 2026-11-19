import test from "node:test";
import assert from "node:assert/strict";
import { randsToCents, resolveSale, wasPriceProblem } from "@/lib/products/compare-at";
import { buyerPriceCents, buyerPriceSummary } from "@/lib/products/buyer-price";
import { variantCreateSchema, variantUpdateSchema } from "@/lib/validation/product";

// ── The rule: when does a buyer see a was-price? ────────────

test("a was-price above the price is shown with the whole-percent saving", () => {
  assert.deepEqual(resolveSale(34999, 44999), { compareAt: 44999, percentOff: 22 });
  // Same answer in rands: the rule only depends on the ratio.
  assert.deepEqual(resolveSale(349.99, 449.99), { compareAt: 449.99, percentOff: 22 });
  assert.deepEqual(resolveSale(50, 100), { compareAt: 100, percentOff: 50 });
});

test("no was-price, or one at or below the price, shows the plain price", () => {
  assert.equal(resolveSale(100, null), null);
  assert.equal(resolveSale(100, undefined), null);
  assert.equal(resolveSale(100, 100), null);
  assert.equal(resolveSale(100, 80), null, "a price later raised past the was-price");
  assert.equal(resolveSale(0, 100), null, "an unpriced option has no saving to show");
  assert.equal(resolveSale(100, Number.NaN), null);
});

test("a saving that rounds to 0% is not shown, and it never reads as 100%", () => {
  assert.equal(resolveSale(9980, 10000), null, "0.2% would print as -0%");
  assert.deepEqual(resolveSale(9950, 10000), { compareAt: 10000, percentOff: 1 });
  assert.deepEqual(resolveSale(1, 100000), { compareAt: 100000, percentOff: 99 });
});

test("an unusable was-price is explained to the seller", () => {
  assert.equal(wasPriceProblem(10000, 15000), null);
  assert.match(wasPriceProblem(10000, 10000) ?? "", /must be higher than the price/);
  assert.match(wasPriceProblem(10000, 9000) ?? "", /must be higher than the price/);
  assert.match(wasPriceProblem(9980, 10000) ?? "", /under 1%/);
});

test("the seller's check and the buyer's display agree", () => {
  for (const [price, was] of [[10000, 15000], [10000, 10000], [9980, 10000], [9950, 10000], [1, 100000]] as const) {
    assert.equal(
      wasPriceProblem(price, was) === null,
      resolveSale(price, was) !== null,
      `price ${price}, was ${was}`,
    );
  }
});

// ── Reading what the seller typed ───────────────────────────

test("rand amounts are read as cents; anything else is refused", () => {
  assert.equal(randsToCents("199"), 19900);
  assert.equal(randsToCents("199.99"), 19999);
  assert.equal(randsToCents(" 199,99 "), 19999);
  assert.equal(randsToCents("0.5"), 50);
  for (const bad of ["", "0", "0.00", "-5", "R199", "12abc", "1e3", "1.2.3", "1000000"]) {
    assert.equal(randsToCents(bad), null, `"${bad}"`);
  }
});

test("a new option accepts an optional was-price", () => {
  const base = { size: "M", priceInRands: "150", stock: "2" };
  const without = variantCreateSchema.parse(base);
  assert.equal(without.compareAtPriceInRands, undefined);
  assert.equal(variantCreateSchema.parse({ ...base, compareAtPriceInRands: "" }).compareAtPriceInRands, undefined);
  assert.equal(variantCreateSchema.parse({ ...base, compareAtPriceInRands: "199,99" }).compareAtPriceInRands, 19999);
  assert.equal(variantCreateSchema.safeParse({ ...base, compareAtPriceInRands: "lots" }).success, false);
});

test("an option update can set, keep or remove the was-price", () => {
  assert.equal(variantUpdateSchema.parse({ stock: "3" }).compareAtPriceInRands, undefined, "omitted leaves it alone");
  assert.equal(variantUpdateSchema.parse({ compareAtPriceInRands: "" }).compareAtPriceInRands, null, "blank removes it");
  assert.equal(variantUpdateSchema.parse({ compareAtPriceInRands: null }).compareAtPriceInRands, null);
  assert.equal(variantUpdateSchema.parse({ compareAtPriceInRands: "250" }).compareAtPriceInRands, 25000);
  assert.equal(variantUpdateSchema.safeParse({ compareAtPriceInRands: "abc" }).success, false);
});

// ── What a product card shows ───────────────────────────────

const option = (
  size: string,
  priceInCents: number,
  compareAtPriceCents: number | null = null,
  retailPriceCents: number | null = null,
) => ({ size, priceInCents, retailPriceCents, compareAtPriceCents });

test("buyers pay the retail price when the seller set one", () => {
  assert.equal(buyerPriceCents(option("M", 10000)), 10000);
  assert.equal(buyerPriceCents(option("M", 10000, null, 14000)), 14000);
});

test("a single option's was-price goes on the card", () => {
  assert.deepEqual(buyerPriceSummary([option("Default", 15000, 20000)]), {
    minPriceCents: 15000,
    maxPriceCents: 15000,
    compareAtPriceCents: 20000,
  });
});

test("a product with no options has no price and no was-price", () => {
  assert.deepEqual(buyerPriceSummary([]), { minPriceCents: 0, maxPriceCents: 0, compareAtPriceCents: null });
});

test("the was-price is judged against what the buyer pays, not the wholesale price", () => {
  // Wholesale R100, retail R180, was R150: buyers pay R180, so R150 is no saving.
  assert.equal(buyerPriceSummary([option("M", 10000, 15000, 18000)]).compareAtPriceCents, null);
  // Was R220 is above the R180 they pay.
  assert.equal(buyerPriceSummary([option("M", 10000, 22000, 18000)]).compareAtPriceCents, 22000);
});

test("the card's was-price comes from the option whose price is shown", () => {
  // "From R100": only the R100 option's was-price is relevant.
  const summary = buyerPriceSummary([option("S", 10000, 13000), option("XL", 16000, 30000)]);
  assert.deepEqual(summary, { minPriceCents: 10000, maxPriceCents: 16000, compareAtPriceCents: 13000 });

  // The cheapest option has no was-price, so the card shows none,
  // even though a dearer option is marked down.
  assert.equal(
    buyerPriceSummary([option("S", 10000), option("XL", 16000, 30000)]).compareAtPriceCents,
    null,
  );
});

test("options sharing the shown price must all be marked down, and the lowest was-price wins", () => {
  assert.equal(
    buyerPriceSummary([option("S", 15000, 20000), option("M", 15000, 25000)]).compareAtPriceCents,
    20000,
    "never overstate the saving",
  );
  assert.equal(
    buyerPriceSummary([option("S", 15000, 20000), option("M", 15000)]).compareAtPriceCents,
    null,
    "one option at this price has no saving",
  );
});

test("the placeholder option is ignored once real sizes exist", () => {
  const summary = buyerPriceSummary([option("Default", 5000, 9000), option("M", 15000, 20000)]);
  assert.deepEqual(summary, { minPriceCents: 15000, maxPriceCents: 15000, compareAtPriceCents: 20000 });
});
