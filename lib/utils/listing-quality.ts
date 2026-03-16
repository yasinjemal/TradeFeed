// ============================================================
// Listing Quality — Shared utility (server-safe)
// ============================================================
// Pure function to compute listing quality props from product data.
// Extracted from listing-quality-score.tsx so it can be called
// from server components (the component itself is "use client").
// ============================================================

export interface ListingQualityScoreProps {
  hasImage: boolean;
  hasPrice: boolean;
  hasStock: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  compact?: boolean;
}

/**
 * Compute quality score from raw product data.
 * Used by server components to derive props for ListingQualityScore.
 */
export function computeQualityProps(product: {
  images: { id: string }[];
  variants: { priceInCents: number; stock: number }[];
  description: string | null;
  categoryId: string | null;
  globalCategoryId: string | null;
}): ListingQualityScoreProps {
  const hasImage = product.images.length > 0;
  const hasPrice = product.variants.some((v) => v.priceInCents > 0);
  const hasStock = product.variants.some((v) => v.stock > 0);
  const hasDescription = !!product.description && product.description.trim().length > 0;
  const hasCategory = !!product.categoryId || !!product.globalCategoryId;

  return { hasImage, hasPrice, hasStock, hasDescription, hasCategory };
}
