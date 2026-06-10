// ============================================================
// Catalogue Import — ZAR Price Parsing (pure)
// ============================================================
// Parses prices the way SA sellers actually write them in
// WhatsApp captions:
//   "R280"  "280"  "R 1 500"  "R1,500"  "R280–350"  "R280-350"
//   "R280 - R350"  "from R99"
// Returns cents. Pure functions — unit tested.
// ============================================================

export interface PriceRange {
  minCents: number;
  maxCents: number;
}

/** Sanity bounds: 1 rand to 1 million rand. */
const MIN_CENTS = 100;
const MAX_CENTS = 100_000_000;

/**
 * Parse a single price token like "R 1 500", "1500", "R1,500.50"
 * into cents. Returns null when it doesn't look like a price.
 */
export function parseZarAmount(token: string): number | null {
  // Strip currency marker and spacing variants
  const cleaned = token
    .replace(/r/gi, "")
    .replace(/[,\s ]/g, "") // commas, spaces, non-breaking spaces as thousand separators
    .trim();

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const cents = Math.round(parseFloat(cleaned) * 100);
  if (!Number.isFinite(cents) || cents < MIN_CENTS || cents > MAX_CENTS) return null;
  return cents;
}

// Matches "R280", "R 1 500", "280" optionally followed by a range
// separator (– — - to) and a second amount.
const PRICE_PATTERN =
  /r?\s?(\d{1,3}(?:[,\s ]?\d{3})*(?:\.\d{1,2})?)(?:\s?(?:[–—-]|to)\s?r?\s?(\d{1,3}(?:[,\s ]?\d{3})*(?:\.\d{1,2})?))?/i;

/**
 * Extract the first price (or price range) from free text.
 * "Quality hoodies 🔥 R280, sizes S–XXL" → { minCents: 28000, maxCents: 28000 }
 * "R280–350" → { minCents: 28000, maxCents: 35000 }
 */
export function parseZarPriceRange(text: string): PriceRange | null {
  if (!text) return null;

  // Search with a global pass so "S–XXL" style ranges that aren't
  // prices don't poison the match: try each candidate until one parses.
  const globalPattern = new RegExp(PRICE_PATTERN.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = globalPattern.exec(text)) !== null) {
    const min = parseZarAmount(match[1] ?? "");
    if (min === null) continue;

    const max = match[2] ? parseZarAmount(match[2]) : null;
    if (max !== null && max >= min) {
      return { minCents: min, maxCents: max };
    }
    return { minCents: min, maxCents: min };
  }

  return null;
}
