// ============================================================
// Catalogue Import — Draft → Product Mapping (pure)
// ============================================================
// Converts an edited DraftListing into the data needed to
// create a Product + variants + images. Pure — unit tested.
// ============================================================

export interface PublishableDraft {
  aiTitle: string | null;
  aiDescription: string | null;
  aiPriceMinCents: number | null;
  aiAttributes: { sizes?: string[]; colours?: string[]; material?: string } | null;
  photoUrls: string[];
}

export interface ProductCreatePlan {
  name: string;
  description: string | null;
  variants: { size: string; color: string | null; priceInCents: number; stock: number }[];
  imageUrls: string[];
  minPriceCents: number;
  maxPriceCents: number;
}

export interface MappingError {
  error: "missing_title" | "missing_price";
}

const MAX_VARIANT_SIZES = 10;
const DEFAULT_STOCK = 1; // never publish instantly "sold out"

/**
 * Build the create plan for one draft. Returns an error object
 * (not a throw) when required fields are missing — the review
 * grid surfaces these inline.
 */
export function buildProductPlan(draft: PublishableDraft): ProductCreatePlan | MappingError {
  const name = draft.aiTitle?.trim();
  if (!name || name.length < 2) return { error: "missing_title" };

  const price = draft.aiPriceMinCents;
  if (!price || price <= 0) return { error: "missing_price" };

  const sizes = (draft.aiAttributes?.sizes ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 20)
    .slice(0, MAX_VARIANT_SIZES);

  // One variant per detected size; single colour applied if exactly
  // one was detected (size × colour explosion is left to the seller).
  const colours = (draft.aiAttributes?.colours ?? []).filter((c) => c.trim().length > 0);
  const colour = colours.length === 1 ? colours[0]!.trim() : null;

  const variants =
    sizes.length > 0
      ? sizes.map((size) => ({ size, color: colour, priceInCents: price, stock: DEFAULT_STOCK }))
      : [{ size: "Default", color: colour, priceInCents: price, stock: DEFAULT_STOCK }];

  return {
    name: name.slice(0, 200),
    description: draft.aiDescription?.trim() ? draft.aiDescription.trim().slice(0, 2000) : null,
    variants,
    imageUrls: draft.photoUrls.slice(0, 8),
    minPriceCents: price,
    maxPriceCents: price,
  };
}

export function isMappingError(
  plan: ProductCreatePlan | MappingError
): plan is MappingError {
  return "error" in plan;
}
