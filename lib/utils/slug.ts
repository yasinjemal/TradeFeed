// ============================================================
// Slug Utility
// ============================================================
// Converts human-readable names to URL-safe slugs.
// Used for shop URLs (/catalog/marble-tower-fashions) and
// category URLs.
//
// WHAT: "Marble Tower Fashions" → "marble-tower-fashions"
// WHY: Public catalog URLs must be clean, readable, and unique.
//
// UNIQUENESS: The data access layer handles uniqueness checks
// and appends a suffix (-1, -2) if a slug already exists.
// ============================================================

/**
 * Generate a URL-safe slug from a string.
 *
 * Rules:
 * - Lowercase
 * - Replace spaces and special chars with hyphens
 * - Remove consecutive hyphens
 * - Trim leading/trailing hyphens
 * - Remove non-alphanumeric characters (except hyphens)
 *
 * @example generateSlug("Marble Tower Fashions") → "marble-tower-fashions"
 * @example generateSlug("  Hello   World!!  ") → "hello-world"
 * @example generateSlug("Jeppe Street #1 Store") → "jeppe-street-1-store"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except spaces & hyphens)
    .replace(/[\s_]+/g, "-") // Replace spaces & underscores with hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Generate a unique slug by checking the DB for conflicts.
 * If "marble-tower-fashions" exists, tries "marble-tower-fashions-1", etc.
 *
 * WHAT: Ensures no two shops share a slug.
 * WHY: Slugs are public URL identifiers. Duplicates = broken catalog links.
 *
 * @param baseSlug - The initial slug to check
 * @param existsFn - Async function that returns true if the slug is taken
 * @returns A guaranteed-unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  existsFn: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  // Check if the base slug is available
  while (await existsFn(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety valve — prevent infinite loops (shouldn't happen in practice)
    if (counter > 100) {
      // Append timestamp for guaranteed uniqueness
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}
