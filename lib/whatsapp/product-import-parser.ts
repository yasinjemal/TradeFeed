// ============================================================
// WhatsApp Product Import — Price & Size Parsers
// ============================================================
// Utility functions to extract price, size, and color data
// from free-text WhatsApp messages sent by sellers.
//
// Handles South African price formats:
//   "R250", "250", "R 250.00", "R1,250", "250-500"
//
// Handles size formats:
//   "S-XL", "S M L XL", "S, M, L", "size 6-12", "one size"
// ============================================================

/** Parsed price result in cents */
export interface ParsedPrice {
  minPriceCents: number;
  maxPriceCents: number | null;
}

/** Parsed sizes from text */
export interface ParsedSizes {
  sizes: string[];
}

/** Full parsed result from a WhatsApp product message */
export interface ParsedProductMessage {
  price: ParsedPrice | null;
  sizes: string[];
  colors: string[];
  rawText: string;
}

// ── Size Constants ──────────────────────────────────────────

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "2XL", "3XL", "4XL"];

/** Expand a letter size range like "S-XL" into individual sizes */
function expandLetterSizeRange(start: string, end: string): string[] {
  const startIdx = LETTER_SIZES.indexOf(start.toUpperCase());
  const endIdx = LETTER_SIZES.indexOf(end.toUpperCase());
  if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return [];
  return LETTER_SIZES.slice(startIdx, endIdx + 1);
}

/** Expand a numeric size range like "28-34" into individual sizes (even numbers) */
function expandNumericSizeRange(start: number, end: number): string[] {
  if (start >= end || end - start > 20) return [];
  const sizes: string[] = [];
  // Use step of 2 for typical clothing sizes (28, 30, 32, etc.)
  const step = end - start <= 6 && start >= 20 ? 2 : 1;
  for (let i = start; i <= end; i += step) {
    sizes.push(String(i));
  }
  return sizes;
}

// ── Price Parser ────────────────────────────────────────────

/**
 * Parse South African price from free text.
 *
 * Supports:
 *   "R250"        → { minPriceCents: 25000, maxPriceCents: null }
 *   "250"         → { minPriceCents: 25000, maxPriceCents: null }
 *   "R 250.00"    → { minPriceCents: 25000, maxPriceCents: null }
 *   "R1,250"      → { minPriceCents: 125000, maxPriceCents: null }
 *   "R1 250"      → { minPriceCents: 125000, maxPriceCents: null }
 *   "250-500"     → { minPriceCents: 25000, maxPriceCents: 50000 }
 *   "R250-R500"   → { minPriceCents: 25000, maxPriceCents: 50000 }
 *   "from R250"   → { minPriceCents: 25000, maxPriceCents: null }
 */
export function parsePrice(text: string): ParsedPrice | null {
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, " ").trim();

  // Pattern: Range "R250-R500" or "250-500" or "R250 - R500"
  const rangeMatch = normalized.match(
    /R?\s?(\d[\d\s,]*(?:\.\d{1,2})?)\s*[-–—to]\s*R?\s?(\d[\d\s,]*(?:\.\d{1,2})?)/i
  );
  if (rangeMatch) {
    const min = parseRandAmount(rangeMatch[1]!);
    const max = parseRandAmount(rangeMatch[2]!);
    if (min !== null && max !== null && max >= min) {
      return { minPriceCents: min, maxPriceCents: max };
    }
  }

  // Pattern: Single price "R250", "R 250.00", "from R250", "250", "R1,250"
  const singleMatch = normalized.match(
    /(?:from\s+)?R\s?(\d[\d\s,]*(?:\.\d{1,2})?)|(?:^|\s)(\d{2,6}(?:\.\d{1,2})?)(?:\s|$)/i
  );
  if (singleMatch) {
    const amount = parseRandAmount((singleMatch[1] || singleMatch[2])!);
    if (amount !== null) {
      return { minPriceCents: amount, maxPriceCents: null };
    }
  }

  return null;
}

/** Convert a rand amount string like "1,250.50" or "1 250" to cents */
function parseRandAmount(str: string): number | null {
  if (!str) return null;
  // Remove spaces and commas used as thousands separators
  const cleaned = str.replace(/[\s,]/g, "");
  const value = parseFloat(cleaned);
  if (isNaN(value) || value <= 0 || value > 999999) return null;
  return Math.round(value * 100);
}

// ── Size Parser ─────────────────────────────────────────────

/**
 * Parse sizes from free text.
 *
 * Supports:
 *   "S-XL"          → ["S", "M", "L", "XL"]
 *   "S M L XL"      → ["S", "M", "L", "XL"]
 *   "S, M, L"       → ["S", "M", "L"]
 *   "size 6-12"     → ["6", "8", "10", "12"]
 *   "28-34"         → ["28", "30", "32", "34"]
 *   "one size"      → ["One Size"]
 *   "free size"     → ["One Size"]
 */
export function parseSizes(text: string): string[] {
  const normalized = text.toUpperCase().trim();

  // Check for "one size" / "free size"
  if (/\b(ONE\s*SIZE|FREE\s*SIZE|OS|FREESIZE)\b/i.test(normalized)) {
    return ["One Size"];
  }

  // Check for letter size range: "S-XL", "S - XXL"
  const letterRange = normalized.match(
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL)\s*[-–—]\s*(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL)\b/
  );
  if (letterRange) {
    const expanded = expandLetterSizeRange(letterRange[1]!, letterRange[2]!);
    if (expanded.length > 0) return expanded;
  }

  // Check for numeric size range: "28-34", "size 6-12"
  const numRange = normalized.match(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/);
  if (numRange) {
    const start = parseInt(numRange[1]!, 10);
    const end = parseInt(numRange[2]!, 10);
    // Avoid matching price ranges (values > 50 are likely prices)
    if (start < 50 && end < 50) {
      const expanded = expandNumericSizeRange(start, end);
      if (expanded.length > 0) return expanded;
    }
  }

  // Check for explicit letter sizes listed: "S M L XL" or "S, M, L, XL"
  const letterSizes = normalized.match(
    /\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL)\b/g
  );
  if (letterSizes && letterSizes.length >= 2) {
    // Deduplicate and preserve order
    return [...new Set(letterSizes)];
  }

  // No sizes detected — return default
  return ["Default"];
}

// ── Color Parser ────────────────────────────────────────────

const COMMON_COLORS = [
  "black", "white", "red", "blue", "green", "yellow", "pink", "purple",
  "orange", "brown", "grey", "gray", "navy", "beige", "cream", "maroon",
  "burgundy", "teal", "coral", "gold", "silver", "khaki", "olive",
  "charcoal", "ivory", "tan", "peach", "mint", "lavender", "turquoise",
];

/**
 * Extract color mentions from text.
 */
export function parseColors(text: string): string[] {
  const lower = text.toLowerCase();
  const found = COMMON_COLORS.filter((color) =>
    new RegExp(`\\b${color}\\b`, "i").test(lower)
  );
  return found.map((c) => c.charAt(0).toUpperCase() + c.slice(1));
}

// ── Combined Parser ─────────────────────────────────────────

/**
 * Parse a full WhatsApp product message.
 * Extracts price, sizes, colors, and retains raw text for AI.
 */
export function parseProductMessage(text: string): ParsedProductMessage {
  return {
    price: parsePrice(text),
    sizes: parseSizes(text),
    colors: parseColors(text),
    rawText: text.trim(),
  };
}
