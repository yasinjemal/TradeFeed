import type { Prisma } from "@prisma/client";

/** Minimum buyer-facing discovery requirements; seller catalogues remain editable. */
export const MARKETPLACE_ELIGIBILITY = {
  isActive: true,
  isFlagged: false,
  minPriceCents: { gt: 0 },
  images: { some: { url: { not: "" } } },
  variants: { some: { isActive: true, stock: { gt: 0 }, priceInCents: { gt: 0 } } },
} satisfies Prisma.ProductWhereInput;

/**
 * A repair window preserves existing shops while new listings meet the content standard.
 *
 * The standard is deliberately PRODUCT-level: a description and a category are
 * things a seller can fix from their own dashboard, so a failing listing has an
 * obvious repair path.
 *
 * A saved shop return policy is intentionally NOT required for discovery. It was
 * part of this gate until 2026-10-21: because only 1 of 114 active shops had ever
 * filled the field in, the lapse of the first repair window on 2026-10-16 hid 226
 * of 230 otherwise-sellable products and left the marketplace showing four items
 * from a single shop. A bar that essentially no seller can clear is an outage with
 * a timer on it, not a quality standard. Return policies are now chased through
 * seller activation and merchandising prompts instead of by hiding live inventory.
 */
export function marketplaceContentStandard(now = new Date()): Prisma.ProductWhereInput {
  return {
    OR: [
      { discoveryGraceUntil: { gt: now } },
      {
        description: { not: "" },
        NOT: { description: null },
        globalCategoryId: { not: null },
        shop: { is: { OR: [{ deliveryEnabled: true }, { collectionEnabled: true }] } },
      },
    ],
  };
}
