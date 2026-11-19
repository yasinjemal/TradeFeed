// ============================================================
// Create listing — pure rules for the one-screen "Add product" flow
// ============================================================
// Everything the create screen and createProductAction need to
// agree on lives here, with no server-only imports, so the form
// can preview the outcome and the action can enforce it:
//
//   - what counts as a price, and which sizes become variants
//   - which uploaded photo may be attached
//   - whether the listing ends up live or as a draft, and why
//   - the marketplace readiness checklist ("4 of 5 ready")
//
// The rule that matters most: the action reports what actually
// happened. A listing is "live" only when it is active AND has a
// priced option buyers can order.
// ============================================================

import { variantCreateSchema } from "@/lib/validation/product";
import { isPlaceholderOption } from "@/lib/products/buyer-options";
import { isUploadThingUrl } from "@/lib/video/parse";
import { randsToCents, wasPriceProblem, WAS_PRICE_FORMAT_MESSAGE } from "@/lib/products/compare-at";
import { MIN_LISTING_DESCRIPTION_LENGTH } from "@/lib/marketplace/listing-readiness";

/** The single option a product gets when the seller adds no sizes. */
export const PLACEHOLDER_OPTION = "Default";
/** Most sizes one product can be created with from the create screen. */
export const MAX_CREATE_SIZES = 20;
/** Blank stock means "I have one", never an instant sold-out listing. */
export const DEFAULT_CREATE_STOCK = 1;
const MAX_STOCK = 999_999;
const MAX_SIZE_LABEL = 20;

// ── Pricing + sizes ─────────────────────────────────────────

export interface ListingVariantDraft {
  size: string;
  stock: number;
}

export interface ListingPricing {
  priceInCents: number;
  /** Optional "was" price for every option; always above the price. */
  compareAtPriceCents: number | null;
  /** One entry per real size, or a single placeholder option. */
  variants: ListingVariantDraft[];
  /** False when the only option is the placeholder. */
  hasRealSizes: boolean;
}

export type ListingPricingResult =
  | { ok: true; pricing: ListingPricing | null }
  | { ok: false; fieldErrors: Record<string, string[]> };

function parseStock(raw: unknown): number | null {
  if (typeof raw === "number") {
    return Number.isInteger(raw) && raw >= 0 && raw <= MAX_STOCK ? raw : null;
  }
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value === "") return DEFAULT_CREATE_STOCK;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 10);
  return parsed <= MAX_STOCK ? parsed : null;
}

/**
 * Turn the create screen's price, stock and size chips into the
 * variants that will be saved.
 *
 * - No price  → `pricing: null` (the caller saves a draft).
 * - Bad price → field errors; nothing should be saved.
 * - Sizes     → one variant per size, each with its own stock.
 * - No sizes  → one placeholder variant using the single stock field.
 */
export function parseListingPricing(raw: {
  priceInRands: string;
  stock: string;
  sizes: string;
  /** Optional "was" price. Blank means none. */
  compareAtPriceInRands?: string;
}): ListingPricingResult {
  const price = raw.priceInRands.trim();
  if (price === "") return { ok: true, pricing: null };

  // Strict on purpose: parseFloat would quietly read "149,99" as R149
  // and "12abc" as R12, and the seller would never know.
  if (!/^\d+(?:[.,]\d+)?$/.test(price)) {
    return { ok: false, fieldErrors: { priceInRands: ["Enter a price in rands, for example 149.99"] } };
  }
  const priced = variantCreateSchema
    .pick({ priceInRands: true })
    .safeParse({ priceInRands: price.replace(",", ".") });
  if (!priced.success) {
    return {
      ok: false,
      fieldErrors: { priceInRands: [priced.error.issues[0]?.message ?? "Enter a valid price"] },
    };
  }
  const priceInCents = priced.data.priceInRands;

  // -- Was-price (optional) --
  // It is shown to buyers crossed out, so one that is not above the
  // price is an error to fix here, never something to drop quietly.
  let compareAtPriceCents: number | null = null;
  const wasPrice = (raw.compareAtPriceInRands ?? "").trim();
  if (wasPrice !== "") {
    compareAtPriceCents = randsToCents(wasPrice);
    if (compareAtPriceCents === null) {
      return { ok: false, fieldErrors: { compareAtPriceInRands: [WAS_PRICE_FORMAT_MESSAGE] } };
    }
    const problem = wasPriceProblem(priceInCents, compareAtPriceCents);
    if (problem) {
      return { ok: false, fieldErrors: { compareAtPriceInRands: [problem] } };
    }
  }

  // ── Sizes (optional) ──────────────────────────────────────
  let rawSizes: unknown = [];
  if (raw.sizes.trim() !== "") {
    try {
      rawSizes = JSON.parse(raw.sizes);
    } catch {
      return { ok: false, fieldErrors: { sizes: ["Sizes could not be read. Add them again."] } };
    }
  }
  if (!Array.isArray(rawSizes)) {
    return { ok: false, fieldErrors: { sizes: ["Sizes could not be read. Add them again."] } };
  }
  if (rawSizes.length > MAX_CREATE_SIZES) {
    return {
      ok: false,
      fieldErrors: { sizes: [`Add up to ${MAX_CREATE_SIZES} sizes here. You can add more after publishing.`] },
    };
  }

  const variants: ListingVariantDraft[] = [];
  const seen = new Set<string>();
  for (const entry of rawSizes) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, fieldErrors: { sizes: ["Sizes could not be read. Add them again."] } };
    }
    const { size, stock } = entry as { size?: unknown; stock?: unknown };
    const label = typeof size === "string" ? size.trim() : "";
    if (label === "") continue;
    if (label.length > MAX_SIZE_LABEL) {
      return {
        ok: false,
        fieldErrors: { sizes: [`"${label.slice(0, MAX_SIZE_LABEL)}…" is too long. Keep each size under ${MAX_SIZE_LABEL} characters.`] },
      };
    }
    // "Default" is the placeholder buyers never see once real sizes exist.
    if (isPlaceholderOption(label)) {
      return { ok: false, fieldErrors: { sizes: [`"${label}" is not a size buyers can pick. Use the real size name.`] } };
    }
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const parsedStock = parseStock(stock);
    if (parsedStock === null) {
      return { ok: false, fieldErrors: { sizes: [`Stock for ${label} must be a whole number from 0 to ${MAX_STOCK.toLocaleString("en-ZA")}.`] } };
    }
    variants.push({ size: label, stock: parsedStock });
  }

  if (variants.length > 0) {
    return { ok: true, pricing: { priceInCents, compareAtPriceCents, variants, hasRealSizes: true } };
  }

  const singleStock = parseStock(raw.stock);
  if (singleStock === null) {
    return { ok: false, fieldErrors: { stock: [`Stock must be a whole number from 0 to ${MAX_STOCK.toLocaleString("en-ZA")}.`] } };
  }
  return {
    ok: true,
    pricing: {
      priceInCents,
      compareAtPriceCents,
      variants: [{ size: PLACEHOLDER_OPTION, stock: singleStock }],
      hasRealSizes: false,
    },
  };
}

// ── Photo ───────────────────────────────────────────────────

export interface ListingPhoto {
  url: string;
  key: string;
  name: string;
}

export type ListingPhotoResult =
  | { ok: true; photo: ListingPhoto | null }
  | { ok: false; error: string };

/**
 * The photo the seller picked has already been uploaded to our CDN
 * by the time the form is submitted. Only a CDN file may be attached:
 * a client must not be able to store an arbitrary URL on a product.
 */
export function parseListingPhoto(raw: { url: string; key: string; name: string }): ListingPhotoResult {
  const url = raw.url.trim();
  if (url === "") return { ok: true, photo: null };

  const key = raw.key.trim();
  if (!isUploadThingUrl(url) || key === "" || key.length > 200 || url.length > 500) {
    return { ok: false, error: "That photo could not be attached. Remove it and add it again." };
  }
  const name = raw.name.trim().slice(0, 200) || "product-photo.jpg";
  return { ok: true, photo: { url, key, name } };
}

// ── Outcome ─────────────────────────────────────────────────

export type ListingStatus = "live" | "draft";

/**
 * Why a listing was saved as a draft instead of going live.
 * - missing_price:    no price was given, so buyers cannot order it
 * - hidden_by_seller: the seller switched "Show on catalogue" off
 * - publish_failed:   the price or the publish step did not save, so it stayed hidden
 */
export type DraftReason = "missing_price" | "hidden_by_seller" | "publish_failed";

/** Whether the picked photo ended up on the product. */
export type PhotoOutcome = "attached" | "none" | "failed";

export function resolveListingStatus(input: {
  wantsLive: boolean;
  hasPrice: boolean;
}): { status: ListingStatus; draftReason?: DraftReason } {
  if (!input.hasPrice) return { status: "draft", draftReason: "missing_price" };
  if (!input.wantsLive) return { status: "draft", draftReason: "hidden_by_seller" };
  return { status: "live" };
}

// ── Marketplace readiness ("4 of 5 ready") ──────────────────

export type ReadinessKey = "photo" | "price" | "stock" | "category" | "description";

export interface ReadinessItem {
  key: ReadinessKey;
  /** Short name of the requirement, e.g. "Photo". */
  label: string;
  done: boolean;
  /** What to do about it when it is missing. */
  missing: string;
}

export interface ListingReadiness {
  items: ReadinessItem[];
  doneCount: number;
  total: number;
  missing: ReadinessItem[];
  ready: boolean;
}

/**
 * The same five things the Products page counts as "ready" for
 * marketplace discovery, evaluated against a listing that has not
 * been saved yet.
 */
export function draftListingReadiness(input: {
  hasPhoto: boolean;
  priceInRands: string;
  totalStock: number;
  description: string;
  hasMarketplaceCategory: boolean;
}): ListingReadiness {
  const price = Number.parseFloat(input.priceInRands);
  const descriptionLength = input.description.trim().length;
  const remaining = Math.max(0, MIN_LISTING_DESCRIPTION_LENGTH - descriptionLength);

  const items: ReadinessItem[] = [
    { key: "photo", label: "Photo", done: input.hasPhoto, missing: "Add a photo" },
    {
      key: "price",
      label: "Price",
      done: Number.isFinite(price) && price > 0,
      missing: "Add a price above R0",
    },
    { key: "stock", label: "Stock", done: input.totalStock > 0, missing: "Add at least 1 in stock" },
    {
      key: "category",
      label: "Marketplace category",
      done: input.hasMarketplaceCategory,
      missing: "Choose a marketplace category",
    },
    {
      key: "description",
      label: "Description",
      done: descriptionLength >= MIN_LISTING_DESCRIPTION_LENGTH,
      missing:
        descriptionLength === 0
          ? `Describe it in at least ${MIN_LISTING_DESCRIPTION_LENGTH} characters`
          : `Add ${remaining} more character${remaining === 1 ? "" : "s"} to the description`,
    },
  ];

  const missing = items.filter((item) => !item.done);
  return {
    items,
    doneCount: items.length - missing.length,
    total: items.length,
    missing,
    ready: missing.length === 0,
  };
}
