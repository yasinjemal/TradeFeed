import type { Prisma } from "@prisma/client";

/** Minimum buyer-facing discovery requirements; seller catalogues remain editable. */
export const MARKETPLACE_ELIGIBILITY = {
  isActive: true,
  isFlagged: false,
  minPriceCents: { gt: 0 },
  images: { some: { url: { not: "" } } },
  variants: { some: { isActive: true, stock: { gt: 0 }, priceInCents: { gt: 0 } } },
} satisfies Prisma.ProductWhereInput;

/** A repair window preserves existing shops while new listings meet the content standard. */
export function marketplaceContentStandard(now = new Date()): Prisma.ProductWhereInput {
  return { OR: [{ discoveryGraceUntil: { gt: now } }, {
    description: {not: ""}, NOT: {description: null}, globalCategoryId: {not: null},
    shop: {is: {returnPolicy: {not: ""}, NOT: {returnPolicy: null}, OR: [{deliveryEnabled:true},{collectionEnabled:true}]}}
  }] };
}
