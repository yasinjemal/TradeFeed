import { needsSizeConfirmation } from "@/lib/products/buyer-options";
export interface ListingSnapshot {
  isActive: boolean;
  isFlagged: boolean;
  minPriceCents: number;
  images: { url: string }[];
  variants: { size?: string; isActive: boolean; stock: number; priceInCents: number }[];
}

/** Editorial completeness target, distinct from the temporary discovery grace. */
export function listingQualityIssues(
  product: ListingSnapshot & {
    name?: string;
    description: string | null;
    globalCategoryId: string | null;
  },
): string[] {
  return [
    ...listingDiscoveryIssues(product),
    ...(product.name && needsSizeConfirmation(product.name, product.variants.filter(v => v.isActive).map(v => ({size: v.size ?? "Default"}))) ? ["Add the real sizes advertised in your product title and confirm stock for each option"] : []),
    ...((product.description?.trim().length ?? 0) < 40
      ? ["Describe the product and its condition in at least 40 characters"]
      : []),
    ...(!product.globalCategoryId ? ["Choose a marketplace category"] : []),
  ];
}

export function listingDiscoveryIssues(product: ListingSnapshot): string[] {
  const issues: string[] = [];
  if (!product.isActive) issues.push("Publish your product");
  if (product.isFlagged)
    issues.push("Contact support about the moderation flag");
  if (!product.images.some((image) => image.url !== ""))
    issues.push("Add a product photo");
  if (product.minPriceCents <= 0) issues.push("Add a price above R0");
  if (
    !product.variants.some(
      (variant) =>
        variant.isActive && variant.stock > 0 && variant.priceInCents > 0,
    )
  ) {
    issues.push("Add an available option with a price and stock");
  }
  return issues;
}
