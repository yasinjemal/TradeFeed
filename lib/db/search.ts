// ============================================================
// Full-Text Search — PostgreSQL tsvector + pg_trgm
// ============================================================
// Provides ranked search results with:
// - Stemming (e.g. "running" matches "run")
// - Weight boosting (name matches rank higher than description)
// - Fuzzy fallback via pg_trgm when tsquery finds no results
// - Relevance scoring for result ordering
//
// Column weights:
//   A = product name (highest relevance)
//   B = product description
// ============================================================

import { db } from "@/lib/db";

interface SearchHit {
  id: string;
  rank: number;
}

/**
 * Sanitize user input for use in PostgreSQL tsquery.
 * Splits on whitespace, removes special chars, joins with '&' for AND semantics.
 */
function sanitizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => `${w}:*`)
    .join(" & ");
}

/**
 * Search products using PostgreSQL full-text search with relevance ranking.
 * Falls back to trigram similarity if tsquery yields no results.
 * Gracefully returns [] on any DB error (missing column/extension)
 * so marketplace always renders — ILIKE fallback in the caller still works.
 *
 * Returns product IDs sorted by relevance (highest first).
 */
export async function searchProductIds(
  query: string,
  limit: number = 100
): Promise<SearchHit[]> {
  const sanitized = sanitizeSearchQuery(query);
  if (sanitized.length === 0) return [];

  try {
    // Phase 1: tsvector full-text search with ranking
    const ftsResults = await db.$queryRawUnsafe<SearchHit[]>(
      `
      SELECT id, ts_rank("search_vector", to_tsquery('english', $1)) AS rank
      FROM "Product"
      WHERE "search_vector" @@ to_tsquery('english', $1)
        AND "isActive" = true
      ORDER BY rank DESC
      LIMIT $2
      `,
      sanitized,
      limit
    );

    if (ftsResults.length > 0) return ftsResults;

    // Phase 2: Fuzzy fallback via pg_trgm similarity
    const trimmed = query.trim();
    const fuzzyResults = await db.$queryRawUnsafe<SearchHit[]>(
      `
      SELECT id, similarity("name", $1) AS rank
      FROM "Product"
      WHERE similarity("name", $1) > 0.15
        AND "isActive" = true
      ORDER BY rank DESC
      LIMIT $2
      `,
      trimmed,
      limit
    );

    return fuzzyResults;
  } catch (error) {
    // If FTS / pg_trgm columns/extensions aren't available, return []
    // so the caller falls back to Prisma ILIKE search gracefully.
    console.error("[search] FTS query failed, falling back to ILIKE:", error);
    return [];
  }
}
