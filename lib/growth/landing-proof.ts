// ============================================================
// Landing-page proof — what we are allowed to show as evidence
// ============================================================
// The seller landing page shows three kinds of proof: platform
// counters, featured shops, and featured products. All three come
// from live data, so all three can make the business look fake:
// a counter that reads "73 orders", a "featured shop" that is the
// owner's own test shop, a product called "Dress" with one 5.0
// review. This module decides what is good enough to show.
//
// Pure functions only — no database, no environment access other
// than the deny-list reader, which takes its source as an argument.
// The queries that feed it live in lib/db/landing-proof.ts.
//
// The rule in every case is the same: when the evidence is weak,
// show nothing. An absent counter costs nothing; a small or
// obviously seeded one costs the visitor's trust in everything
// else on the page.
// ============================================================

// ── Counters ────────────────────────────────────────────────

/**
 * A counter is shown only at or above its threshold. Below it the
 * number reads as "nobody uses this", so it is hidden instead.
 * Raise these as the platform grows; never lower them to make a
 * counter appear.
 */
export const PROOF_COUNTER_THRESHOLDS = {
  shops: 100,
  products: 500,
  orders: 500,
  cities: 10,
} as const;

/** A lone statistic looks like the only good one. Show the block only with this many. */
export const MIN_COUNTERS_FOR_STATS_BLOCK = 2;

export type ProofCounterKey = keyof typeof PROOF_COUNTER_THRESHOLDS;

export interface PlatformStats {
  shopCount: number;
  productCount: number;
  orderCount: number;
  cityCount: number;
}

export interface ProofCounter {
  key: ProofCounterKey;
  value: number;
  label: string;
}

const COUNTER_FIELDS: readonly {
  key: ProofCounterKey;
  field: keyof PlatformStats;
  label: string;
}[] = [
  { key: "shops", field: "shopCount", label: "registered shops" },
  { key: "products", field: "productCount", label: "products listed" },
  { key: "orders", field: "orderCount", label: "orders created" },
  { key: "cities", field: "cityCount", label: "SA cities" },
];

/**
 * The counters that may be shown, in display order.
 * `null` stats mean the numbers are unknown (the database was
 * unreachable) — that yields no counters, never a row of zeros.
 */
export function visibleProofCounters(
  stats: PlatformStats | null | undefined,
): ProofCounter[] {
  if (!stats) return [];
  return COUNTER_FIELDS.flatMap(({ key, field, label }) => {
    const value = stats[field];
    return Number.isFinite(value) && value >= PROOF_COUNTER_THRESHOLDS[key]
      ? [{ key, value, label }]
      : [];
  });
}

/** One counter's value, or `null` when it must not be shown. */
export function proofCounterValue(
  stats: PlatformStats | null | undefined,
  key: ProofCounterKey,
): number | null {
  return visibleProofCounters(stats).find((c) => c.key === key)?.value ?? null;
}

/** Counters for the dedicated statistics block — empty unless enough of them qualify. */
export function statsBlockCounters(
  stats: PlatformStats | null | undefined,
): ProofCounter[] {
  const counters = visibleProofCounters(stats);
  return counters.length >= MIN_COUNTERS_FOR_STATS_BLOCK ? counters : [];
}

// ── Deny list ───────────────────────────────────────────────

/**
 * Shops that must never be used as proof: the owner's own shops,
 * staff shops, QA and demo shops. Slugs, lower case.
 *
 * Shops owned by a platform admin account (ADMIN_USER_IDS) are
 * excluded automatically and need not be listed. This list is for
 * everything that rule cannot see: shops opened under a personal
 * or second account, friends-and-family test shops, demo shops.
 *
 * TODO(owner): list those shops here, or set PROOF_SHOP_DENYLIST
 * (comma-separated slugs) in the environment — both are merged.
 */
export const OWNER_AND_TEST_SHOP_SLUGS: readonly string[] = [];

/** Parse a comma/space/newline separated list of shop slugs. */
export function parseShopDenylist(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((slug) => slug.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/** The effective deny list: the checked-in slugs plus PROOF_SHOP_DENYLIST. */
export function proofShopDenylist(
  envValue: string | null | undefined = process.env.PROOF_SHOP_DENYLIST,
): string[] {
  return [
    ...new Set([
      ...OWNER_AND_TEST_SHOP_SLUGS.map((slug) => slug.toLowerCase()),
      ...parseShopDenylist(envValue),
    ]),
  ];
}

// ── Photos ──────────────────────────────────────────────────

// Hosts that serve stock or placeholder imagery. A product whose
// only picture comes from one of these was seeded, not photographed.
const STOCK_IMAGE_HOSTS = [
  "unsplash.com",
  "pexels.com",
  "pixabay.com",
  "picsum.photos",
  "placehold.co",
  "placehold.it",
  "placeholder.com",
  "placekitten.com",
  "dummyimage.com",
  "loremflickr.com",
  "istockphoto.com",
  "shutterstock.com",
  "gettyimages.com",
];

/** True when the URL is a seller-uploaded picture, not stock or a placeholder. */
export function isRealProductPhoto(url: string | null | undefined): boolean {
  if (!url) return false;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return !STOCK_IMAGE_HOSTS.some(
    (stock) => host === stock || host.endsWith(`.${stock}`),
  );
}

// ── Featured shops ──────────────────────────────────────────

export const FEATURED_SHOP_GATE = {
  /** Published products that each carry a real photo. */
  minProductsWithPhotos: 5,
} as const;

// Whole-word match, so "Contest Wear" and "Demolition Tools" pass.
const TEST_NAME_PATTERN =
  /\b(test|tests|testing|tester|demo|sample|dummy|example|placeholder|asdf|qwerty|lorem|untitled|delete|do not use)\b/i;

// Narrower for product titles: "perfume tester" and "sample pack"
// are real things to sell.
const TEST_TITLE_PATTERN =
  /\b(test|tests|testing|dummy|placeholder|asdf|qwerty|lorem|untitled)\b/i;

export interface ShopProofCandidate {
  slug: string;
  name: string;
  isActive: boolean;
  /**
   * True when the shop's owner is a platform admin (ADMIN_USER_IDS).
   * The operator's own shop is not independent proof, whatever it sells.
   */
  isOperatorOwned?: boolean;
  /** Primary image URL of every published product (null when it has none). */
  productImageUrls: readonly (string | null | undefined)[];
}

/** Why a shop may not be featured. Empty means it may. */
export function featuredShopIssues(
  shop: ShopProofCandidate,
  denylist: readonly string[] = [],
): string[] {
  const issues: string[] = [];
  if (denylist.includes(shop.slug.toLowerCase())) {
    issues.push("on the owner/test deny list");
  }
  if (shop.isOperatorOwned) issues.push("owned by a platform admin account");
  if (!shop.isActive) issues.push("shop is not active");
  if (TEST_NAME_PATTERN.test(shop.name) || TEST_NAME_PATTERN.test(shop.slug.replace(/-/g, " "))) {
    issues.push("name looks like a test shop");
  }
  const withPhotos = shop.productImageUrls.filter(isRealProductPhoto).length;
  if (withPhotos < FEATURED_SHOP_GATE.minProductsWithPhotos) {
    issues.push(
      `needs ${FEATURED_SHOP_GATE.minProductsWithPhotos} products with real photos (has ${withPhotos})`,
    );
  }
  return issues;
}

export function isFeaturableShop(
  shop: ShopProofCandidate,
  denylist: readonly string[] = [],
): boolean {
  return featuredShopIssues(shop, denylist).length === 0;
}

// ── Featured products ───────────────────────────────────────

export const FEATURED_PRODUCT_GATE = {
  /** "Dress" is a category, not a listing. "Floral summer dress" is a listing. */
  minTitleWords: 2,
  minTitleLength: 6,
  /** Stop one shop filling the whole showcase. */
  maxPerShop: 2,
  /** One 5.0 review is not a rating. Below this the stars are not shown. */
  minReviewsForRating: 3,
} as const;

export interface ProductProofCandidate {
  title: string;
  imageUrl: string | null | undefined;
  priceCents: number;
  shopSlug: string;
}

/** Why a product may not be showcased. Empty means it may. */
export function featuredProductIssues(
  product: ProductProofCandidate,
  featurableShopSlugs: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  if (!featurableShopSlugs.has(product.shopSlug)) {
    issues.push("its shop does not pass the featured-shop gate");
  }
  if (!isRealProductPhoto(product.imageUrl)) issues.push("no real photo");
  if (!(product.priceCents > 0)) issues.push("no price");
  const title = product.title.trim();
  const words = title.split(/\s+/).filter(Boolean).length;
  if (
    words < FEATURED_PRODUCT_GATE.minTitleWords ||
    title.length < FEATURED_PRODUCT_GATE.minTitleLength
  ) {
    issues.push("title is too generic");
  }
  if (TEST_TITLE_PATTERN.test(title)) issues.push("title looks like test data");
  return issues;
}

export function isFeaturableProduct(
  product: ProductProofCandidate,
  featurableShopSlugs: ReadonlySet<string>,
): boolean {
  return featuredProductIssues(product, featurableShopSlugs).length === 0;
}

/**
 * Pick the showcase: gated products in their incoming (quality)
 * order, at most `maxPerShop` from any one shop, up to `limit`.
 */
export function selectFeaturedProducts<T extends ProductProofCandidate>(
  candidates: readonly T[],
  featurableShopSlugs: ReadonlySet<string>,
  limit = 8,
): T[] {
  const perShop = new Map<string, number>();
  const picked: T[] = [];
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    if (!isFeaturableProduct(candidate, featurableShopSlugs)) continue;
    const used = perShop.get(candidate.shopSlug) ?? 0;
    if (used >= FEATURED_PRODUCT_GATE.maxPerShop) continue;
    perShop.set(candidate.shopSlug, used + 1);
    picked.push(candidate);
  }
  return picked;
}

/**
 * The rating to print on a showcased product, or `null` when there
 * are too few reviews for an average to mean anything.
 */
export function displayableRating(
  avgRating: number | null | undefined,
  reviewCount: number,
): { rating: number; ratingCount: number } | null {
  if (
    avgRating == null ||
    !Number.isFinite(avgRating) ||
    reviewCount < FEATURED_PRODUCT_GATE.minReviewsForRating
  ) {
    return null;
  }
  return { rating: avgRating, ratingCount: reviewCount };
}
