import type { Prisma } from "@prisma/client";

/** Minimum buyer-facing discovery requirements; seller catalogues remain editable. */
export const MARKETPLACE_ELIGIBILITY = {
  isActive: true,
  isFlagged: false,
  minPriceCents: { gt: 0 },
  images: { some: { url: { not: "" } } },
  variants: { some: { isActive: true, stock: { gt: 0 }, priceInCents: { gt: 0 } } },
} satisfies Prisma.ProductWhereInput;
