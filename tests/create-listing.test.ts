import test from "node:test";
import assert from "node:assert/strict";
import {
  draftListingReadiness,
  parseListingPhoto,
  parseListingPricing,
  resolveListingStatus,
  MAX_CREATE_SIZES,
} from "@/lib/products/create-listing";

const noSizes = { stock: "", sizes: "" };

// ── Pricing ─────────────────────────────────────────────────

test("a blank price means there is no pricing to save", () => {
  assert.deepEqual(parseListingPricing({ priceInRands: "", ...noSizes }), { ok: true, pricing: null });
});

test("a price becomes cents on a single default option", () => {
  const result = parseListingPricing({ priceInRands: "149.99", stock: "12", sizes: "" });
  assert.deepEqual(result, {
    ok: true,
    pricing: {
      priceInCents: 14999,
      variants: [{ size: "Default", stock: 12 }],
      hasRealSizes: false,
    },
  });
});

test("a comma decimal is read as cents, not silently truncated", () => {
  const result = parseListingPricing({ priceInRands: "149,99", ...noSizes });
  assert.equal(result.ok && result.pricing?.priceInCents, 14999);
});

test("prices that are not plain rand amounts are rejected", () => {
  for (const bad of ["0", "0.00", "-1", "R150", "12abc", "1e3", "1000000"]) {
    const result = parseListingPricing({ priceInRands: bad, ...noSizes });
    assert.equal(result.ok, false, `"${bad}" should be rejected`);
    assert.ok(!result.ok && result.fieldErrors.priceInRands?.[0]);
  }
});

test("stock must be a whole number when there are no sizes", () => {
  const result = parseListingPricing({ priceInRands: "50", stock: "2.5", sizes: "" });
  assert.ok(!result.ok && result.fieldErrors.stock?.[0]);
});

test("zero stock is allowed: the seller is told it shows as sold out", () => {
  const result = parseListingPricing({ priceInRands: "50", stock: "0", sizes: "" });
  assert.equal(result.ok && result.pricing?.variants[0]?.stock, 0);
});

test("sizes replace the default option and keep their own stock", () => {
  const result = parseListingPricing({
    priceInRands: "50",
    stock: "99",
    sizes: JSON.stringify([
      { size: "S", stock: "2" },
      { size: "M", stock: 5 },
      { size: "", stock: "4" }, // an empty chip is ignored
    ]),
  });
  assert.deepEqual(result, {
    ok: true,
    pricing: {
      priceInCents: 5000,
      variants: [
        { size: "S", stock: 2 },
        { size: "M", stock: 5 },
      ],
      hasRealSizes: true,
    },
  });
});

test("an empty sizes list falls back to the default option", () => {
  const result = parseListingPricing({ priceInRands: "50", stock: "4", sizes: "[]" });
  assert.equal(result.ok && result.pricing?.hasRealSizes, false);
  assert.equal(result.ok && result.pricing?.variants[0]?.stock, 4);
});

test("the placeholder name cannot be used as a real size", () => {
  const result = parseListingPricing({
    priceInRands: "50",
    stock: "",
    sizes: JSON.stringify([{ size: "default", stock: "1" }]),
  });
  assert.ok(!result.ok && /not a size buyers can pick/.test(result.fieldErrors.sizes?.[0] ?? ""));
});

test("bad size stock, long names and too many sizes are rejected", () => {
  const cases = [
    JSON.stringify([{ size: "S", stock: "-1" }]),
    JSON.stringify([{ size: "S", stock: "lots" }]),
    JSON.stringify([{ size: "A size name far longer than twenty characters", stock: "1" }]),
    JSON.stringify(Array.from({ length: MAX_CREATE_SIZES + 1 }, (_, i) => ({ size: `S${i}`, stock: "1" }))),
    JSON.stringify({ size: "S" }),
    JSON.stringify(["S", "M"]),
  ];
  for (const sizes of cases) {
    const result = parseListingPricing({ priceInRands: "50", stock: "", sizes });
    assert.ok(!result.ok && result.fieldErrors.sizes?.[0], `should reject ${sizes.slice(0, 40)}`);
  }
});

// ── Photo ───────────────────────────────────────────────────

test("no photo is a valid choice", () => {
  assert.deepEqual(parseListingPhoto({ url: "", key: "", name: "" }), { ok: true, photo: null });
});

test("only files on the upload CDN can be attached", () => {
  assert.deepEqual(
    parseListingPhoto({ url: "https://utfs.io/f/abc", key: "abc", name: "shoe.jpg" }),
    { ok: true, photo: { url: "https://utfs.io/f/abc", key: "abc", name: "shoe.jpg" } },
  );
  assert.equal(
    parseListingPhoto({ url: "https://app123.ufs.sh/f/abc", key: "abc", name: "" }).ok,
    true,
  );
  for (const url of [
    "https://example.com/a.jpg",
    "http://utfs.io/f/abc",
    "data:image/png;base64,AAAA",
    "https://utfs.io.evil.com/f/abc",
  ]) {
    assert.equal(parseListingPhoto({ url, key: "abc", name: "a.jpg" }).ok, false, url);
  }
  assert.equal(parseListingPhoto({ url: "https://utfs.io/f/abc", key: "", name: "a.jpg" }).ok, false);
});

// ── Outcome ─────────────────────────────────────────────────

test("a listing is live only with a price and the seller's go-ahead", () => {
  assert.deepEqual(resolveListingStatus({ wantsLive: true, hasPrice: true }), { status: "live" });
  assert.deepEqual(resolveListingStatus({ wantsLive: true, hasPrice: false }), {
    status: "draft",
    draftReason: "missing_price",
  });
  assert.deepEqual(resolveListingStatus({ wantsLive: false, hasPrice: true }), {
    status: "draft",
    draftReason: "hidden_by_seller",
  });
  // With neither, the missing price is the thing to fix first.
  assert.deepEqual(resolveListingStatus({ wantsLive: false, hasPrice: false }), {
    status: "draft",
    draftReason: "missing_price",
  });
});

// ── Readiness ───────────────────────────────────────────────

const complete = {
  hasPhoto: true,
  priceInRands: "150",
  totalStock: 3,
  description: "Soft fleece hoodie with a kangaroo pocket, barely worn.",
  hasMarketplaceCategory: true,
};

test("a complete listing is 5 of 5 ready", () => {
  const readiness = draftListingReadiness(complete);
  assert.equal(readiness.doneCount, 5);
  assert.equal(readiness.total, 5);
  assert.equal(readiness.ready, true);
  assert.deepEqual(readiness.missing, []);
});

test("readiness names exactly what is missing", () => {
  const readiness = draftListingReadiness({ ...complete, hasMarketplaceCategory: false });
  assert.equal(readiness.doneCount, 4);
  assert.equal(readiness.ready, false);
  assert.deepEqual(
    readiness.missing.map((item) => [item.key, item.missing]),
    [["category", "Choose a marketplace category"]],
  );
});

test("an empty form is 0 of 5 with every requirement listed in order", () => {
  const readiness = draftListingReadiness({
    hasPhoto: false,
    priceInRands: "",
    totalStock: 0,
    description: "",
    hasMarketplaceCategory: false,
  });
  assert.equal(readiness.doneCount, 0);
  assert.deepEqual(
    readiness.missing.map((item) => item.key),
    ["photo", "price", "stock", "category", "description"],
  );
});

test("a short description says how many characters are left", () => {
  const readiness = draftListingReadiness({ ...complete, description: "Nice hoodie, barely worn" });
  const description = readiness.missing.find((item) => item.key === "description");
  assert.equal(description?.missing, "Add 16 more characters to the description");
});

test("a zero or unreadable price is not a price", () => {
  for (const priceInRands of ["0", "abc", "-4"]) {
    const readiness = draftListingReadiness({ ...complete, priceInRands });
    assert.equal(readiness.items.find((item) => item.key === "price")?.done, false, priceInRands);
  }
});

// ── Shop-level gate ─────────────────────────────────────────

test("the shop-level marketplace rule is read from the live gate", async () => {
  const { shopLevelMarketplaceStandard } = await import("@/lib/marketplace/shop-eligibility");
  const { marketplaceContentStandard } = await import("@/lib/marketplace/eligibility");

  const standard = shopLevelMarketplaceStandard();
  // If this fails, the gate no longer has a shop-level condition where the
  // Add product screen looks for one: update shop-eligibility.ts with it.
  assert.ok(standard, "the marketplace gate has a shop-level condition");

  const now = new Date("2026-11-19T00:00:00Z");
  const strict = marketplaceContentStandard(now).OR?.find((branch) => "shop" in branch);
  assert.deepEqual(shopLevelMarketplaceStandard(now), (strict?.shop as { is: unknown }).is);
});
