// ============================================================
// Category → Variant Label Presets
// ============================================================
// Maps GlobalCategory slugs to default variant option labels.
// Used by create-product-form to auto-fill option1Label / option2Label
// when a seller selects a marketplace category.
//
// WHY: Different product types have different axes:
// - Clothing: Size / Color
// - Electronics: Storage / Color
// - Food: Weight / Flavor
// - Beauty: Size / Shade
//
// EXTENSIBLE: Add new categories as the marketplace grows.
// These are DEFAULTS — sellers can always override.
// ============================================================

export interface VariantPreset {
  option1Label: string;
  option2Label: string;
  /** Pre-built value chips for the smart variant creator */
  option1Presets?: string[][];  // Groups of preset values (e.g. letter sizes, number sizes)
  option1PresetLabels?: string[];  // Tab labels for each group
  option2Presets?: { name: string; hex: string }[];  // Color-style presets
}

// ── Default for unknown categories ─────────────────────────

export const DEFAULT_VARIANT_PRESET: VariantPreset = {
  option1Label: "Size",
  option2Label: "Color",
};

// ── Size presets (shared across clothing categories) ────────

const LETTER_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const NUMBER_SIZES = ["28", "30", "32", "34", "36", "38", "40", "42", "44"];
const SHOE_SIZES = ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

const SA_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Grey", hex: "#808080" },
  { name: "Charcoal", hex: "#333333" },
  { name: "Red", hex: "#DC2626" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Royal Blue", hex: "#1E40AF" },
  { name: "Sky Blue", hex: "#7DD3FC" },
  { name: "Green", hex: "#16A34A" },
  { name: "Olive", hex: "#808000" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Brown", hex: "#92400E" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Orange", hex: "#F97316" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Maroon", hex: "#800000" },
];

// ── Clothing preset (default) ──────────────────────────────

const CLOTHING_PRESET: VariantPreset = {
  option1Label: "Size",
  option2Label: "Color",
  option1Presets: [LETTER_SIZES, NUMBER_SIZES, SHOE_SIZES],
  option1PresetLabels: ["S / M / L", "28 – 44", "Shoes"],
  option2Presets: SA_COLORS,
};

// ── Category → Preset Map ──────────────────────────────────
// Keys are GlobalCategory slugs (from the global_categories table).
// Unknown slugs fall back to DEFAULT_VARIANT_PRESET.

const CATEGORY_VARIANT_MAP: Record<string, VariantPreset> = {
  // ── Clothing ─────────────────────────────────────────────
  "mens-clothing": CLOTHING_PRESET,
  "womens-clothing": CLOTHING_PRESET,
  "kids-clothing": CLOTHING_PRESET,
  footwear: {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },
  accessories: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "One Size"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },

  // ── Electronics ──────────────────────────────────────────
  electronics: {
    option1Label: "Storage",
    option2Label: "Color",
    option1Presets: [
      ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
      ["S", "M", "L"],
    ],
    option1PresetLabels: ["Storage", "Sizes"],
    option2Presets: [
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Gold", hex: "#D4AF37" },
      { name: "Blue", hex: "#2563EB" },
      { name: "Red", hex: "#DC2626" },
    ],
  },
  phones: {
    option1Label: "Storage",
    option2Label: "Color",
    option1Presets: [["64GB", "128GB", "256GB", "512GB", "1TB"]],
    option1PresetLabels: ["Storage"],
    option2Presets: [
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Gold", hex: "#D4AF37" },
      { name: "Blue", hex: "#2563EB" },
    ],
  },

  // ── Beauty & Personal Care ───────────────────────────────
  beauty: {
    option1Label: "Size",
    option2Label: "Shade",
    option1Presets: [
      ["30ml", "50ml", "100ml", "200ml", "500ml"],
      ["S", "M", "L"],
    ],
    option1PresetLabels: ["Volume", "Sizes"],
    option2Presets: [
      { name: "Light", hex: "#FDE8D0" },
      { name: "Medium", hex: "#D4A574" },
      { name: "Dark", hex: "#8B5E3C" },
      { name: "Natural", hex: "#DEB887" },
      { name: "Rose", hex: "#FF69B4" },
      { name: "Nude", hex: "#E8C4A2" },
    ],
  },

  // ── Food & Beverages ─────────────────────────────────────
  food: {
    option1Label: "Weight",
    option2Label: "Flavor",
    option1Presets: [
      ["50g", "100g", "250g", "500g", "1kg", "2kg", "5kg"],
    ],
    option1PresetLabels: ["Weight"],
  },
  beverages: {
    option1Label: "Size",
    option2Label: "Flavor",
    option1Presets: [
      ["250ml", "330ml", "440ml", "500ml", "750ml", "1L", "2L", "5L"],
    ],
    option1PresetLabels: ["Volume"],
  },

  // ── Home & Living ────────────────────────────────────────
  "home-decor": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
};

// ── Public API ─────────────────────────────────────────────

/**
 * Get the variant label preset for a given category slug.
 * Falls back to DEFAULT_VARIANT_PRESET for unknown categories.
 */
export function getVariantPreset(categorySlug: string | null | undefined): VariantPreset {
  if (!categorySlug) return DEFAULT_VARIANT_PRESET;
  return CATEGORY_VARIANT_MAP[categorySlug] ?? DEFAULT_VARIANT_PRESET;
}

/**
 * Get just the labels for a category (for quick access).
 */
export function getVariantLabels(categorySlug: string | null | undefined): {
  option1Label: string;
  option2Label: string;
} {
  const preset = getVariantPreset(categorySlug);
  return {
    option1Label: preset.option1Label,
    option2Label: preset.option2Label,
  };
}
