// ============================================================
// SKU Generator — Auto-generate meaningful SKUs
// ============================================================
// Generates structured SKUs from product name + variant options.
// Format: {PREFIX}-{OPTION1}-{OPTION2}
//
// Examples:
//   "Floral Summer Dress" + "M" + "Red"   → FSD-M-RED
//   "iPhone 15 Case"      + "Black"        → I15C-BLK
//   "Nike Air Max"        + "42" + "White" → NAM-42-WHT
//
// Used by variant creation to auto-fill SKU when not provided.
// ============================================================

/**
 * Extract a short uppercase prefix from a product name.
 * Takes the first letter of each significant word (up to 4).
 * Falls back to first 3 chars of the name if < 2 words.
 */
function extractPrefix(productName: string): string {
  const cleaned = productName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();

  const STOP_WORDS = new Set(["the", "a", "an", "for", "and", "or", "of", "in", "with", "to"]);

  const words = cleaned
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w.toLowerCase()));

  if (words.length >= 2) {
    // Take first letter of each word (up to 4 words), include numbers
    return words
      .slice(0, 4)
      .map((w) => {
        // For words starting with numbers, take more chars (e.g., "15" → "15")
        if (/^\d/.test(w)) return w.replace(/[^0-9]/g, "").slice(0, 3);
        return w[0];
      })
      .join("")
      .toUpperCase();
  }

  // Single long word — take first 3 chars
  return cleaned.slice(0, 3).toUpperCase() || "SKU";
}

/**
 * Abbreviate a variant option value for SKU usage.
 * Common color names get 3-letter codes. Others get first 3 uppercase chars.
 */
function abbreviateOption(value: string): string {
  if (!value || value === "Default") return "";

  const upper = value.toUpperCase().trim();

  // Common color abbreviations
  const COLOR_MAP: Record<string, string> = {
    BLACK: "BLK",
    WHITE: "WHT",
    RED: "RED",
    BLUE: "BLU",
    GREEN: "GRN",
    NAVY: "NVY",
    GREY: "GRY",
    GRAY: "GRY",
    PINK: "PNK",
    PURPLE: "PRP",
    ORANGE: "ORG",
    YELLOW: "YLW",
    BROWN: "BRN",
    BEIGE: "BGE",
    CREAM: "CRM",
    CHARCOAL: "CHR",
    BURGUNDY: "BRG",
    MAROON: "MRN",
    TEAL: "TEL",
    CORAL: "CRL",
    OLIVE: "OLV",
    KHAKI: "KHK",
    TAN: "TAN",
    "SKY BLUE": "SKB",
    "ROYAL BLUE": "RBL",
  };

  if (COLOR_MAP[upper]) return COLOR_MAP[upper];

  // Already short (sizes like S, M, L, XL, 2XL, 32, etc.)
  if (upper.length <= 3) return upper;

  // Take first 3 chars for longer values
  return upper.replace(/[^A-Z0-9]/g, "").slice(0, 3);
}

/**
 * Generate a full SKU for a product variant.
 *
 * @param productName - The product's display name
 * @param option1     - First variant axis value (e.g., "M", "42")
 * @param option2     - Second variant axis value (e.g., "Red", "Blue"), optional
 * @returns A structured SKU string like "FSD-M-RED"
 */
export function generateSku(
  productName: string,
  option1: string,
  option2?: string | null
): string {
  const prefix = extractPrefix(productName);
  const opt1 = abbreviateOption(option1);
  const opt2 = option2 ? abbreviateOption(option2) : "";

  const parts = [prefix, opt1, opt2].filter(Boolean);
  return parts.join("-");
}
