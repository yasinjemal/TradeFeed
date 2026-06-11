// ============================================================
// Catalogue Import — WhatsApp Text-Dump Splitting (pure)
// ============================================================
// Regex fallback for Flow B: splits a pasted block of WhatsApp
// captions into per-product seeds without AI. Used when the
// seller has no AI credits, when OpenAI is down, and as the
// pre-splitter that tells us how many products a dump contains.
//
// Spec rule: never merge two products into one row.
// ============================================================

import { parseZarPriceRange } from "@/lib/imports/parse-prices";

export interface CaptionSeed {
  title: string;
  description: string | null;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  sizes: string[];
  originalCaption: string;
}

const MAX_ITEMS = 50;

// Common SA clothing size tokens, longest first so XXL wins over XL/L.
const SIZE_TOKEN = "(?:XXXL|2XL|3XL|XXL|XL|XS|S|M|L|\\d{2})";
const SIZE_LIST_PATTERN = new RegExp(
  `sizes?\\s*:?\\s*(${SIZE_TOKEN}(?:\\s*(?:[,/–—-]|to|\\s)\\s*${SIZE_TOKEN})*)`,
  "i"
);

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL"];

/** Extract a sizes list like "S–XXL", "S/M/L", "sizes: S, M, L". */
export function extractSizes(text: string): string[] {
  const match = SIZE_LIST_PATTERN.exec(text);
  if (!match?.[1]) return [];

  const raw = match[1].toUpperCase();
  const tokens = raw.split(/[\s,/]+|(?:TO)/).filter(Boolean);

  // Range form "S–XXL" → expand using the standard order
  const rangeMatch = raw.match(new RegExp(`^(${SIZE_TOKEN})\\s*[–—-]\\s*(${SIZE_TOKEN})$`, "i"));
  if (rangeMatch) {
    const from = SIZE_ORDER.indexOf(rangeMatch[1]!.toUpperCase());
    const to = SIZE_ORDER.indexOf(rangeMatch[2]!.toUpperCase());
    if (from >= 0 && to >= from) return SIZE_ORDER.slice(from, to + 1);
  }

  // List form — keep unique, valid tokens in given order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokens) {
    const t = token.replace(/[–—-]/g, "").trim();
    if (!t || seen.has(t)) continue;
    if (new RegExp(`^${SIZE_TOKEN}$`, "i").test(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out.slice(0, 10);
}

/** Strip emoji/decoration and price tokens to derive a clean title. */
function cleanTitle(line: string): string {
  return line
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "") // emoji
    .replace(/r?\s?\d[\d,\s]*(\.\d{1,2})?(\s?[–—-]\s?r?\s?\d[\d,\s]*(\.\d{1,2})?)?/gi, "") // prices
    .replace(/\b(dm|inbox|whatsapp|order now|to order)\b.*/gi, "")
    .replace(/[|•·~_*]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.:;!-]+|[\s,.:;!-]+$/g, "")
    .trim();
}

/**
 * Split a pasted dump into product blocks. Strategy:
 * 1. Split on blank lines (how people separate WhatsApp posts).
 * 2. If that yields one giant block with several priced lines,
 *    split on single newlines instead.
 */
export function splitTextDump(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  let blocks = trimmed
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (blocks.length === 1) {
    const lines = blocks[0]!.split("\n").map((l) => l.trim()).filter(Boolean);
    const pricedLines = lines.filter((l) => parseZarPriceRange(l) !== null);
    if (pricedLines.length >= 2) {
      blocks = lines; // one product per line
    }
  }

  return blocks.slice(0, MAX_ITEMS);
}

/**
 * Convert one caption block into a draft seed.
 * Returns null for blocks that clearly aren't products
 * (no letters, or just a sign-off line).
 */
export function captionToSeed(block: string): CaptionSeed | null {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const price = parseZarPriceRange(block);
  const sizes = extractSizes(block);

  // Title: first line that yields something readable after cleaning
  let title = "";
  for (const line of lines) {
    const cleaned = cleanTitle(line);
    if (cleaned.length >= 3) {
      title = cleaned.slice(0, 120);
      break;
    }
  }
  if (!title) return null;

  const description = lines.length > 1 ? lines.slice(1).join(" ").slice(0, 500) : null;

  return {
    title,
    description,
    priceMinCents: price?.minCents ?? null,
    priceMaxCents: price?.maxCents ?? null,
    sizes,
    originalCaption: block.slice(0, 1500),
  };
}

/** Full regex-only pipeline: dump → seeds. */
export function parseTextDump(text: string): CaptionSeed[] {
  return splitTextDump(text)
    .map(captionToSeed)
    .filter((s): s is CaptionSeed => s !== null);
}
