// ============================================================
// Product Slug Generator
// ============================================================
// Generates SEO-friendly URL slugs from product names.
// Ensures uniqueness within a shop by appending a counter suffix
// if a slug collision is detected.
//
// Examples:
//   "Floral Summer Dress" → "floral-summer-dress"
//   "Men's Black Hoodie (XL)" → "mens-black-hoodie-xl"
//   Duplicate → "floral-summer-dress-2"
// ============================================================

import { db } from "@/lib/db";

/**
 * Convert a product name to a URL-safe slug.
 * Strips diacritics, special chars, collapses hyphens, trims to 80 chars.
 */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")                       // decompose diacritics
    .replace(/[\u0300-\u036f]/g, "")         // strip combining marks
    .toLowerCase()
    .replace(/[']/g, "")                     // remove apostrophes (men's → mens)
    .replace(/[^a-z0-9]+/g, "-")            // non-alphanumeric → hyphen
    .replace(/^-+|-+$/g, "")                // trim leading/trailing hyphens
    .slice(0, 80);                           // cap length for URLs
}

/**
 * Generate a unique product slug within a shop.
 * If "red-hoodie" is taken, tries "red-hoodie-2", "red-hoodie-3", etc.
 *
 * @param name     - Product name to slugify
 * @param shopId   - Shop ID to scope uniqueness
 * @param excludeProductId - Product ID to exclude (for updates)
 */
export async function generateUniqueProductSlug(
  name: string,
  shopId: string,
  excludeProductId?: string,
): Promise<string> {
  const base = slugify(name);
  if (!base) return `product-${Date.now()}`; // fallback for empty names

  let candidate = base;
  let attempt = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.product.findFirst({
      where: {
        shopId,
        slug: candidate,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return candidate;

    attempt++;
    candidate = `${base}-${attempt}`;
  }
}
