import test from "node:test";
import assert from "node:assert/strict";
import {
  FEATURED_PRODUCT_GATE,
  FEATURED_SHOP_GATE,
  MIN_COUNTERS_FOR_STATS_BLOCK,
  PROOF_COUNTER_THRESHOLDS,
  displayableRating,
  featuredProductIssues,
  featuredShopIssues,
  isFeaturableProduct,
  isFeaturableShop,
  isRealProductPhoto,
  parseShopDenylist,
  proofCounterValue,
  proofShopDenylist,
  selectFeaturedProducts,
  statsBlockCounters,
  visibleProofCounters,
  type PlatformStats,
  type ProductProofCandidate,
  type ShopProofCandidate,
} from "@/lib/growth/landing-proof";

const REAL_PHOTO = "https://utfs.io/f/abc123";
const STOCK_PHOTO = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400";

const atThreshold: PlatformStats = {
  shopCount: PROOF_COUNTER_THRESHOLDS.shops,
  productCount: PROOF_COUNTER_THRESHOLDS.products,
  orderCount: PROOF_COUNTER_THRESHOLDS.orders,
  cityCount: PROOF_COUNTER_THRESHOLDS.cities,
};

function shop(overrides: Partial<ShopProofCandidate> = {}): ShopProofCandidate {
  return {
    slug: "marble-tower-fashions",
    name: "Marble Tower Fashions",
    isActive: true,
    productImageUrls: Array(FEATURED_SHOP_GATE.minProductsWithPhotos).fill(REAL_PHOTO),
    ...overrides,
  };
}

function product(overrides: Partial<ProductProofCandidate> = {}): ProductProofCandidate {
  return {
    title: "Floral summer dress",
    imageUrl: REAL_PHOTO,
    priceCents: 28000,
    shopSlug: "marble-tower-fashions",
    ...overrides,
  };
}

// ── Counter thresholds ──────────────────────────────────────

test("a counter is shown at its threshold and hidden one below it", () => {
  assert.deepEqual(
    visibleProofCounters(atThreshold).map((c) => c.key),
    ["shops", "products", "orders", "cities"],
  );

  for (const [key, field] of [
    ["shops", "shopCount"],
    ["products", "productCount"],
    ["orders", "orderCount"],
    ["cities", "cityCount"],
  ] as const) {
    const justBelow = { ...atThreshold, [field]: PROOF_COUNTER_THRESHOLDS[key] - 1 };
    assert.equal(proofCounterValue(justBelow, key), null, `${key} below threshold`);
    assert.equal(
      proofCounterValue(atThreshold, key),
      PROOF_COUNTER_THRESHOLDS[key],
      `${key} at threshold`,
    );
  }
});

test("the audited live numbers hide the weak counters instead of printing them", () => {
  // 2026-11-19 audit: 116 shops, 273 products, 73 orders.
  const audited: PlatformStats = { shopCount: 116, productCount: 273, orderCount: 73, cityCount: 4 };
  assert.deepEqual(visibleProofCounters(audited), [
    { key: "shops", value: 116, label: "registered shops" },
  ]);
  assert.equal(proofCounterValue(audited, "orders"), null);
  assert.equal(proofCounterValue(audited, "products"), null);
});

test("unknown stats (database failure) never become zeros", () => {
  assert.deepEqual(visibleProofCounters(null), []);
  assert.deepEqual(visibleProofCounters(undefined), []);
  assert.deepEqual(statsBlockCounters(null), []);
  assert.equal(proofCounterValue(null, "shops"), null);

  const zeros: PlatformStats = { shopCount: 0, productCount: 0, orderCount: 0, cityCount: 0 };
  assert.deepEqual(visibleProofCounters(zeros), []);
});

test("the statistics block needs more than one qualifying counter", () => {
  assert.ok(MIN_COUNTERS_FOR_STATS_BLOCK >= 2);

  const onlyShops: PlatformStats = { shopCount: 5000, productCount: 1, orderCount: 1, cityCount: 1 };
  assert.equal(visibleProofCounters(onlyShops).length, 1);
  assert.deepEqual(statsBlockCounters(onlyShops), []);

  const shopsAndCities: PlatformStats = { ...onlyShops, cityCount: PROOF_COUNTER_THRESHOLDS.cities };
  assert.deepEqual(
    statsBlockCounters(shopsAndCities).map((c) => c.key),
    ["shops", "cities"],
  );
});

// ── Deny list ───────────────────────────────────────────────

test("parseShopDenylist accepts commas, spaces and newlines and normalises case", () => {
  assert.deepEqual(parseShopDenylist(" Owner-Shop, qa-shop\n demo-store ;owner-shop "), [
    "owner-shop",
    "qa-shop",
    "demo-store",
  ]);
  assert.deepEqual(parseShopDenylist(""), []);
  assert.deepEqual(parseShopDenylist(undefined), []);
  assert.deepEqual(proofShopDenylist("My-Shop"), ["my-shop"]);
  assert.deepEqual(proofShopDenylist(null), []);
});

// ── Featured-shop gate ──────────────────────────────────────

test("a shop with enough real product photos may be featured", () => {
  assert.deepEqual(featuredShopIssues(shop()), []);
  assert.equal(isFeaturableShop(shop()), true);
});

test("a deny-listed shop is never featured, however good it looks", () => {
  assert.equal(isFeaturableShop(shop(), ["marble-tower-fashions"]), false);
  assert.equal(isFeaturableShop(shop({ slug: "Marble-Tower-Fashions" }), ["marble-tower-fashions"]), false);
  assert.equal(isFeaturableShop(shop(), ["some-other-shop"]), true);
});

test("the operator's own shop is not independent proof", () => {
  // The live audit found the best-looking "featured" shop belonged to an
  // admin account, with half of all platform orders placed on it.
  const issues = featuredShopIssues(shop({ isOperatorOwned: true }));
  assert.deepEqual(issues, ["owned by a platform admin account"]);
  assert.equal(isFeaturableShop(shop({ isOperatorOwned: false })), true);
});

test("the gate counts products with real photos, not products", () => {
  const min = FEATURED_SHOP_GATE.minProductsWithPhotos;

  assert.equal(
    isFeaturableShop(shop({ productImageUrls: Array(min - 1).fill(REAL_PHOTO) })),
    false,
    "one short",
  );
  assert.equal(
    isFeaturableShop(shop({ productImageUrls: Array(min + 10).fill(null) })),
    false,
    "many products, no photos",
  );
  assert.equal(
    isFeaturableShop(shop({ productImageUrls: Array(min + 10).fill(STOCK_PHOTO) })),
    false,
    "stock photos only",
  );
  assert.equal(
    isFeaturableShop(
      shop({ productImageUrls: [...Array(min).fill(REAL_PHOTO), null, STOCK_PHOTO, ""] }),
    ),
    true,
    "enough real photos among weaker listings",
  );
});

test("inactive and test-named shops are rejected", () => {
  assert.equal(isFeaturableShop(shop({ isActive: false })), false);
  for (const name of ["Test Shop", "QA demo", "My Sample Store", "asdf", "Untitled"]) {
    assert.equal(isFeaturableShop(shop({ name })), false, name);
  }
  assert.equal(isFeaturableShop(shop({ slug: "test-shop-2", name: "Thandi's Boutique" })), false);
  // Whole words only — real names that merely contain the letters pass.
  for (const name of ["Contest Wear", "Demolition Tools", "Greatest Kicks"]) {
    assert.equal(isFeaturableShop(shop({ name })), true, name);
  }
});

test("isRealProductPhoto rejects missing, malformed, stock and placeholder URLs", () => {
  assert.equal(isRealProductPhoto(REAL_PHOTO), true);
  assert.equal(isRealProductPhoto("https://abc123.ufs.sh/f/xyz"), true);
  assert.equal(isRealProductPhoto(STOCK_PHOTO), false);
  assert.equal(isRealProductPhoto("https://placehold.co/400x400"), false);
  assert.equal(isRealProductPhoto("https://picsum.photos/400"), false);
  assert.equal(isRealProductPhoto(""), false);
  assert.equal(isRealProductPhoto(null), false);
  assert.equal(isRealProductPhoto("not a url"), false);
  // A look-alike host is not the stock host.
  assert.equal(isRealProductPhoto("https://notunsplash.com/a.jpg"), true);
});

// ── Featured-product gate ───────────────────────────────────

const featurable = new Set(["marble-tower-fashions", "kasi-kicks"]);

test("a described, photographed, priced product from a gated shop is showcased", () => {
  assert.deepEqual(featuredProductIssues(product(), featurable), []);
});

test("generic one-word titles from the audit are rejected", () => {
  for (const title of ["Charger", "Jacket", "Dress", "  Dress  "]) {
    assert.equal(isFeaturableProduct(product({ title }), featurable), false, title);
  }
  assert.equal(isFeaturableProduct(product({ title: "Denim jacket" }), featurable), true);
  assert.equal(isFeaturableProduct(product({ title: "Test product" }), featurable), false);
  // Real merchandise that happens to use a test-like word.
  assert.equal(isFeaturableProduct(product({ title: "Perfume tester 100ml" }), featurable), true);
});

test("a product is rejected without a real photo, a price, or a gated shop", () => {
  assert.equal(isFeaturableProduct(product({ imageUrl: null }), featurable), false);
  assert.equal(isFeaturableProduct(product({ imageUrl: STOCK_PHOTO }), featurable), false);
  assert.equal(isFeaturableProduct(product({ priceCents: 0 }), featurable), false);
  assert.equal(isFeaturableProduct(product({ shopSlug: "owner-test-shop" }), featurable), false);
});

test("selectFeaturedProducts keeps order, caps each shop, and respects the limit", () => {
  const candidates = [
    product({ title: "Summer dress one" }),
    product({ title: "Dress" }), // generic — skipped
    product({ title: "Summer dress two" }),
    product({ title: "Summer dress three" }), // third from the same shop — skipped
    product({ title: "Leather sneakers", shopSlug: "kasi-kicks" }),
    product({ title: "Canvas sneakers", shopSlug: "ungated-shop" }), // shop not gated — skipped
    product({ title: "Running sneakers", shopSlug: "kasi-kicks" }),
  ];

  assert.equal(FEATURED_PRODUCT_GATE.maxPerShop, 2);
  assert.deepEqual(
    selectFeaturedProducts(candidates, featurable).map((p) => p.title),
    ["Summer dress one", "Summer dress two", "Leather sneakers", "Running sneakers"],
  );
  assert.deepEqual(
    selectFeaturedProducts(candidates, featurable, 3).map((p) => p.title),
    ["Summer dress one", "Summer dress two", "Leather sneakers"],
  );
  assert.deepEqual(selectFeaturedProducts(candidates, new Set()), []);
});

test("a rating is only displayed once enough reviews back it", () => {
  const min = FEATURED_PRODUCT_GATE.minReviewsForRating;
  assert.equal(displayableRating(5, 1), null, "a single 5.0 review is not a rating");
  assert.equal(displayableRating(5, min - 1), null);
  assert.deepEqual(displayableRating(4.6, min), { rating: 4.6, ratingCount: min });
  assert.equal(displayableRating(null, 10), null);
  assert.equal(displayableRating(Number.NaN, 10), null);
});
