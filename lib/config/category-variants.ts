// ============================================================
// Category → Variant Label Presets
// ============================================================
// Maps GlobalCategory slugs to default variant option labels.
// Used by create-product-form to auto-fill option1Label / option2Label
// when a seller selects a marketplace category.
//
// WHY: Different product types have different axes:
// - Clothing: Size / Color
// - Phones: Storage / Color
// - Drones: Bundle / Color
// - Food: Weight / Flavor
// - Beauty: Size / Shade
// - Solar: Wattage / Type
// - Tools: Type / Size
//
// ~190 categories covered (25 top-level + ~145 subcategories).
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

// ── Device colors (electronics / tech) ─────────────────────

const DEVICE_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Red", hex: "#DC2626" },
  { name: "Green", hex: "#16A34A" },
  { name: "Grey", hex: "#808080" },
];

// ── Beauty shades ──────────────────────────────────────────

const BEAUTY_SHADES = [
  { name: "Light", hex: "#FDE8D0" },
  { name: "Medium", hex: "#D4A574" },
  { name: "Dark", hex: "#8B5E3C" },
  { name: "Natural", hex: "#DEB887" },
  { name: "Rose", hex: "#FF69B4" },
  { name: "Nude", hex: "#E8C4A2" },
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
  // ═══════════════════════════════════════════════════════════
  // CLOTHING (all use Size / Color)
  // ═══════════════════════════════════════════════════════════
  "mens-clothing": CLOTHING_PRESET,
  "mens-hoodies-sweaters": CLOTHING_PRESET,
  "mens-tshirts": CLOTHING_PRESET,
  "mens-jackets-coats": CLOTHING_PRESET,
  "mens-pants-joggers": CLOTHING_PRESET,
  "mens-track-sets": CLOTHING_PRESET,
  "mens-shorts": CLOTHING_PRESET,
  "mens-shirts-polos": CLOTHING_PRESET,
  "mens-underwear": CLOTHING_PRESET,
  "womens-clothing": CLOTHING_PRESET,
  "womens-dresses": CLOTHING_PRESET,
  "womens-tops-blouses": CLOTHING_PRESET,
  "womens-skirts": CLOTHING_PRESET,
  "womens-pants-leggings": CLOTHING_PRESET,
  "womens-activewear": CLOTHING_PRESET,
  "womens-hoodies-sweaters": CLOTHING_PRESET,
  "womens-jackets-coats": CLOTHING_PRESET,
  "womens-lingerie": CLOTHING_PRESET,
  "womens-swimwear": CLOTHING_PRESET,
  kids: CLOTHING_PRESET,
  "kids-boys": CLOTHING_PRESET,
  "kids-girls": CLOTHING_PRESET,
  "kids-baby": {
    option1Label: "Age",
    option2Label: "Color",
    option1Presets: [
      ["0–3m", "3–6m", "6–12m", "12–18m", "18–24m"],
      ["XS", "S", "M", "L", "XL"],
    ],
    option1PresetLabels: ["Baby Ages", "Letter"],
    option2Presets: SA_COLORS,
  },
  "kids-school-uniforms": CLOTHING_PRESET,
  "kids-shoes": {
    ...CLOTHING_PRESET,
    option1Presets: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"],
      ["28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38"],
    ],
    option1PresetLabels: ["UK Kids", "EU Kids"],
  },
  unisex: CLOTHING_PRESET,
  "unisex-streetwear": CLOTHING_PRESET,
  "unisex-basics": CLOTHING_PRESET,
  "unisex-loungewear": CLOTHING_PRESET,
  "formal-traditional": CLOTHING_PRESET,
  "suits-blazers": CLOTHING_PRESET,
  "traditional-wear": CLOTHING_PRESET,
  "formal-dresses": CLOTHING_PRESET,

  // ── Sports Apparel ───────────────────────────────────────
  "sports-apparel": CLOTHING_PRESET,

  // ── Maternity ────────────────────────────────────────────
  maternity: CLOTHING_PRESET,

  // ═══════════════════════════════════════════════════════════
  // FOOTWEAR (Size / Color — shoe-specific presets)
  // ═══════════════════════════════════════════════════════════
  footwear: {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },
  sneakers: {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },
  boots: {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },
  "sandals-slides": {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },
  "formal-shoes": {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },
  "safety-boots": {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, NUMBER_SIZES],
    option1PresetLabels: ["SA Sizes", "EU Sizes"],
  },

  // ═══════════════════════════════════════════════════════════
  // ACCESSORIES (Type / Color)
  // ═══════════════════════════════════════════════════════════
  accessories: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "One Size"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  "caps-hats": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "One Size", "Adjustable"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  "bags-backpacks": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  belts: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL", "28", "30", "32", "34", "36", "38", "40"]],
    option1PresetLabels: ["Waist Size"],
    option2Presets: SA_COLORS,
  },
  jewelry: {
    option1Label: "Type",
    option2Label: "Material",
    option1Presets: [["One Size", "S", "M", "L", "Adjustable"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: [
      { name: "Gold", hex: "#D4AF37" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Rose Gold", hex: "#B76E79" },
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
    ],
  },
  watches: {
    option1Label: "Style",
    option2Label: "Color",
    option1Presets: [["Men's", "Women's", "Unisex"]],
    option1PresetLabels: ["Style"],
    option2Presets: [
      { name: "Black", hex: "#000000" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Gold", hex: "#D4AF37" },
      { name: "Rose Gold", hex: "#B76E79" },
      { name: "Brown", hex: "#92400E" },
    ],
  },
  sunglasses: {
    option1Label: "Style",
    option2Label: "Color",
    option1Presets: [["One Size"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  "scarves-wraps": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["One Size", "S", "M", "L"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  wallets: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Bi-fold", "Tri-fold", "Long", "Card Holder", "Coin Purse"]],
    option1PresetLabels: ["Types"],
    option2Presets: SA_COLORS,
  },

  // ═══════════════════════════════════════════════════════════
  // PHONES & TABLETS (Storage / Color)
  // ═══════════════════════════════════════════════════════════
  "phones-tablets": {
    option1Label: "Storage",
    option2Label: "Color",
    option1Presets: [["64GB", "128GB", "256GB", "512GB", "1TB"]],
    option1PresetLabels: ["Storage"],
    option2Presets: DEVICE_COLORS,
  },
  phones: {
    option1Label: "Storage",
    option2Label: "Color",
    option1Presets: [["64GB", "128GB", "256GB", "512GB", "1TB"]],
    option1PresetLabels: ["Storage"],
    option2Presets: DEVICE_COLORS,
  },
  tablets: {
    option1Label: "Storage",
    option2Label: "Color",
    option1Presets: [["32GB", "64GB", "128GB", "256GB", "512GB"]],
    option1PresetLabels: ["Storage"],
    option2Presets: DEVICE_COLORS,
  },
  // Phone accessories — NOT storage-based!
  "phone-cases": {
    option1Label: "Model",
    option2Label: "Color",
    option1Presets: [
      ["iPhone 15", "iPhone 15 Pro", "iPhone 14", "iPhone 13", "iPhone 12"],
      ["Samsung S24", "Samsung S23", "Samsung A55", "Samsung A35", "Samsung A15"],
    ],
    option1PresetLabels: ["iPhone", "Samsung"],
    option2Presets: SA_COLORS,
  },
  "screen-protectors": {
    option1Label: "Model",
    option2Label: "Type",
    option1Presets: [
      ["iPhone 15", "iPhone 15 Pro", "iPhone 14", "iPhone 13"],
      ["Samsung S24", "Samsung S23", "Samsung A55", "Samsung A35"],
    ],
    option1PresetLabels: ["iPhone", "Samsung"],
  },
  "chargers-cables": {
    option1Label: "Type",
    option2Label: "Length",
    option1Presets: [["USB-C", "Lightning", "Micro USB", "USB-A", "Wireless"]],
    option1PresetLabels: ["Connector"],
  },
  "power-banks": {
    option1Label: "Capacity",
    option2Label: "Color",
    option1Presets: [["5000mAh", "10000mAh", "20000mAh", "30000mAh"]],
    option1PresetLabels: ["Capacity"],
    option2Presets: DEVICE_COLORS,
  },

  // ═══════════════════════════════════════════════════════════
  // COMPUTERS & LAPTOPS
  // ═══════════════════════════════════════════════════════════
  computers: {
    option1Label: "Spec",
    option2Label: "Color",
    option1Presets: [
      ["4GB/128GB", "8GB/256GB", "8GB/512GB", "16GB/512GB", "16GB/1TB"],
    ],
    option1PresetLabels: ["RAM / Storage"],
    option2Presets: DEVICE_COLORS,
  },
  laptops: {
    option1Label: "Spec",
    option2Label: "Color",
    option1Presets: [
      ["4GB/128GB", "8GB/256GB", "8GB/512GB", "16GB/512GB", "16GB/1TB"],
    ],
    option1PresetLabels: ["RAM / Storage"],
    option2Presets: DEVICE_COLORS,
  },
  desktops: {
    option1Label: "Spec",
    option2Label: "Color",
    option1Presets: [
      ["8GB/256GB", "8GB/512GB", "16GB/512GB", "16GB/1TB", "32GB/1TB"],
    ],
    option1PresetLabels: ["RAM / Storage"],
    option2Presets: DEVICE_COLORS,
  },
  monitors: {
    option1Label: "Size",
    option2Label: "Resolution",
    option1Presets: [["22\"", "24\"", "27\"", "32\"", "34\""]],
    option1PresetLabels: ["Screen Size"],
  },
  "computer-accessories": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Wired", "Wireless", "Bluetooth", "USB"]],
    option1PresetLabels: ["Connection"],
    option2Presets: DEVICE_COLORS,
  },
  printers: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Inkjet", "Laser", "All-in-One", "Photo"]],
    option1PresetLabels: ["Type"],
    option2Presets: DEVICE_COLORS,
  },
  "storage-memory": {
    option1Label: "Capacity",
    option2Label: "Type",
    option1Presets: [["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"]],
    option1PresetLabels: ["Capacity"],
  },

  // ═══════════════════════════════════════════════════════════
  // ELECTRONICS / GADGETS (Type / Color — sensible defaults)
  // ═══════════════════════════════════════════════════════════
  electronics: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default", "S", "M", "L"]],
    option1PresetLabels: ["Variant"],
    option2Presets: DEVICE_COLORS,
  },
  "electronics-accessories": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default", "S", "M", "L"]],
    option1PresetLabels: ["Variant"],
    option2Presets: DEVICE_COLORS,
  },
  audio: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["In-Ear", "Over-Ear", "On-Ear", "Wireless", "Wired"]],
    option1PresetLabels: ["Style"],
    option2Presets: DEVICE_COLORS,
  },
  speakers: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["Small", "Medium", "Large", "Portable"]],
    option1PresetLabels: ["Size"],
    option2Presets: DEVICE_COLORS,
  },
  cameras: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Body Only", "With Kit Lens", "With Bag"]],
    option1PresetLabels: ["Package"],
    option2Presets: DEVICE_COLORS,
  },
  drones: {
    option1Label: "Bundle",
    option2Label: "Color",
    option1Presets: [["Drone Only", "With Controller", "Full Kit", "Fly More Combo"]],
    option1PresetLabels: ["Package"],
    option2Presets: DEVICE_COLORS,
  },
  gaming: {
    option1Label: "Edition",
    option2Label: "Color",
    option1Presets: [["Standard", "Digital", "Disc", "Bundle"]],
    option1PresetLabels: ["Edition"],
    option2Presets: DEVICE_COLORS,
  },
  "smart-devices": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "One Size"]],
    option1PresetLabels: ["Size"],
    option2Presets: DEVICE_COLORS,
  },
  "tvs-projectors": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["32\"", "40\"", "43\"", "50\"", "55\"", "65\"", "75\""]],
    option1PresetLabels: ["Screen Size"],
  },
  networking: {
    option1Label: "Type",
    option2Label: "Speed",
    option1Presets: [["Router", "Range Extender", "Mesh", "Modem"]],
    option1PresetLabels: ["Type"],
  },
  "cables-adapters": {
    option1Label: "Type",
    option2Label: "Length",
    option1Presets: [["HDMI", "USB-C", "USB-A", "Ethernet", "Audio", "Extension"]],
    option1PresetLabels: ["Connector"],
  },
  batteries: {
    option1Label: "Type",
    option2Label: "Quantity",
    option1Presets: [["AA", "AAA", "C", "D", "9V", "CR2032", "Rechargeable"]],
    option1PresetLabels: ["Battery Type"],
  },

  // ═══════════════════════════════════════════════════════════
  // BEAUTY & HEALTH
  // ═══════════════════════════════════════════════════════════
  "beauty-health": {
    option1Label: "Size",
    option2Label: "Shade",
    option1Presets: [
      ["30ml", "50ml", "100ml", "200ml", "500ml"],
      ["S", "M", "L"],
    ],
    option1PresetLabels: ["Volume", "Sizes"],
    option2Presets: BEAUTY_SHADES,
  },
  skincare: {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["30ml", "50ml", "100ml", "200ml", "500ml"]],
    option1PresetLabels: ["Volume"],
  },
  haircare: {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["100ml", "200ml", "250ml", "500ml", "1L"]],
    option1PresetLabels: ["Volume"],
  },
  makeup: {
    option1Label: "Shade",
    option2Label: "Type",
    option1Presets: [["Light", "Fair", "Medium", "Tan", "Deep", "Dark"]],
    option1PresetLabels: ["Shade"],
    option2Presets: BEAUTY_SHADES,
  },
  fragrances: {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["30ml", "50ml", "100ml", "200ml"]],
    option1PresetLabels: ["Volume"],
  },
  nails: {
    option1Label: "Color",
    option2Label: "Type",
    option1Presets: [["Red", "Pink", "Nude", "Black", "White", "French", "Glitter"]],
    option1PresetLabels: ["Color"],
  },
  "personal-care": {
    option1Label: "Size",
    option2Label: "Scent",
    option1Presets: [["50ml", "100ml", "200ml", "400ml"]],
    option1PresetLabels: ["Volume"],
  },
  "health-wellness": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["30", "60", "90", "120", "180"], ["S", "M", "L"]],
    option1PresetLabels: ["Capsules", "Sizes"],
  },
  "wigs-extensions": {
    option1Label: "Length",
    option2Label: "Color",
    option1Presets: [["8\"", "10\"", "12\"", "14\"", "16\"", "18\"", "20\"", "22\"", "24\"", "26\"", "28\""]],
    option1PresetLabels: ["Length"],
    option2Presets: [
      { name: "Natural Black", hex: "#1B1B1B" },
      { name: "Jet Black", hex: "#000000" },
      { name: "Dark Brown", hex: "#3B2314" },
      { name: "Medium Brown", hex: "#6B4226" },
      { name: "Light Brown", hex: "#A0522D" },
      { name: "Blonde", hex: "#E8D44D" },
      { name: "Burgundy", hex: "#800020" },
      { name: "Red", hex: "#DC2626" },
      { name: "Ombre", hex: "#8B6914" },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FOOD & BEVERAGES
  // ═══════════════════════════════════════════════════════════
  "food-beverages": {
    option1Label: "Weight",
    option2Label: "Flavor",
    option1Presets: [["50g", "100g", "250g", "500g", "1kg", "2kg", "5kg"]],
    option1PresetLabels: ["Weight"],
  },
  snacks: {
    option1Label: "Weight",
    option2Label: "Flavor",
    option1Presets: [["50g", "100g", "250g", "500g", "1kg"]],
    option1PresetLabels: ["Weight"],
  },
  drinks: {
    option1Label: "Size",
    option2Label: "Flavor",
    option1Presets: [["250ml", "330ml", "440ml", "500ml", "750ml", "1L", "2L", "5L"]],
    option1PresetLabels: ["Volume"],
  },
  "fresh-produce": {
    option1Label: "Weight",
    option2Label: "Type",
    option1Presets: [["500g", "1kg", "2kg", "5kg", "10kg"]],
    option1PresetLabels: ["Weight"],
  },
  spices: {
    option1Label: "Weight",
    option2Label: "Type",
    option1Presets: [["50g", "100g", "200g", "500g"]],
    option1PresetLabels: ["Weight"],
  },
  "baked-goods": {
    option1Label: "Size",
    option2Label: "Flavor",
    option1Presets: [["Single", "Half Dozen", "Dozen", "Box"]],
    option1PresetLabels: ["Quantity"],
  },
  "meat-braai": {
    option1Label: "Weight",
    option2Label: "Cut",
    option1Presets: [["500g", "1kg", "2kg", "5kg"]],
    option1PresetLabels: ["Weight"],
  },
  "dairy-eggs": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["250ml", "500ml", "1L", "2L", "6-pack", "12-pack", "30-pack"]],
    option1PresetLabels: ["Size"],
  },
  pantry: {
    option1Label: "Weight",
    option2Label: "Type",
    option1Presets: [["500g", "1kg", "2kg", "2.5kg", "5kg", "10kg", "25kg"]],
    option1PresetLabels: ["Weight"],
  },

  // ═══════════════════════════════════════════════════════════
  // HOME & GARDEN
  // ═══════════════════════════════════════════════════════════
  "home-garden": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  furniture: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["Single", "Double", "Queen", "King", "S", "M", "L"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  decor: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  kitchen: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "Set"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  bedding: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["Single", "Three-Quarter", "Double", "Queen", "King"]],
    option1PresetLabels: ["Bed Size"],
    option2Presets: SA_COLORS,
  },
  bathroom: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  "garden-outdoor": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  lighting: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Warm White", "Cool White", "Daylight", "RGB"]],
    option1PresetLabels: ["Light Type"],
    option2Presets: SA_COLORS,
  },
  cleaning: {
    option1Label: "Size",
    option2Label: "Scent",
    option1Presets: [["500ml", "750ml", "1L", "2L", "5L"]],
    option1PresetLabels: ["Volume"],
  },
  "storage-org": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },

  // ═══════════════════════════════════════════════════════════
  // SPORTS & OUTDOORS
  // ═══════════════════════════════════════════════════════════
  "sports-outdoors": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },
  "gym-fitness": {
    option1Label: "Weight",
    option2Label: "Color",
    option1Presets: [["2kg", "5kg", "10kg", "15kg", "20kg", "25kg"]],
    option1PresetLabels: ["Weight"],
    option2Presets: SA_COLORS,
  },
  soccer: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["3", "4", "5"], ["S", "M", "L", "XL"]],
    option1PresetLabels: ["Ball Size", "Apparel"],
    option2Presets: SA_COLORS,
  },
  "rugby-cricket": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL", "3", "4", "5"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },
  running: {
    ...CLOTHING_PRESET,
    option1Presets: [SHOE_SIZES, LETTER_SIZES],
    option1PresetLabels: ["Shoe Size", "Apparel"],
  },
  camping: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["1-Person", "2-Person", "4-Person", "6-Person", "S", "M", "L"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },
  cycling: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["XS", "S", "M", "L", "XL"], ["24\"", "26\"", "27.5\"", "29\""]],
    option1PresetLabels: ["Apparel", "Wheel Size"],
    option2Presets: SA_COLORS,
  },
  "water-sports": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["XS", "S", "M", "L", "XL"]],
    option1PresetLabels: ["Sizes"],
    option2Presets: SA_COLORS,
  },

  // ═══════════════════════════════════════════════════════════
  // AUTO PARTS & ACCESSORIES
  // ═══════════════════════════════════════════════════════════
  "auto-parts": {
    option1Label: "Fitment",
    option2Label: "Type",
    option1Presets: [["Universal", "OEM", "Aftermarket"]],
    option1PresetLabels: ["Fitment"],
  },
  "auto-engine": {
    option1Label: "Fitment",
    option2Label: "Type",
    option1Presets: [["Universal", "OEM", "Aftermarket"]],
    option1PresetLabels: ["Fitment"],
  },
  "auto-body": {
    option1Label: "Fitment",
    option2Label: "Side",
    option1Presets: [["Universal", "OEM", "Aftermarket"]],
    option1PresetLabels: ["Fitment"],
  },
  "auto-electrical": {
    option1Label: "Fitment",
    option2Label: "Type",
    option1Presets: [["Universal", "OEM", "Aftermarket"]],
    option1PresetLabels: ["Fitment"],
  },
  tyres: {
    option1Label: "Size",
    option2Label: "Brand",
    option1Presets: [["155/80R13", "175/65R14", "195/55R15", "205/55R16", "225/45R17", "235/40R18"]],
    option1PresetLabels: ["Tyre Size"],
  },
  "car-accessories": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Universal", "Custom Fit"]],
    option1PresetLabels: ["Fitment"],
    option2Presets: SA_COLORS,
  },
  "car-care": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["250ml", "500ml", "1L", "5L"]],
    option1PresetLabels: ["Volume"],
  },
  "motorcycle-parts": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["XS", "S", "M", "L", "XL", "XXL"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },

  // ═══════════════════════════════════════════════════════════
  // TOOLS & HARDWARE
  // ═══════════════════════════════════════════════════════════
  "tools-hardware": {
    option1Label: "Type",
    option2Label: "Size",
    option1Presets: [["Default"]],
    option1PresetLabels: ["Variant"],
  },
  "power-tools": {
    option1Label: "Type",
    option2Label: "Voltage",
    option1Presets: [["Corded", "Cordless", "Battery + Charger", "Bare Tool"]],
    option1PresetLabels: ["Type"],
  },
  "hand-tools": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["S", "M", "L", "Set"]],
    option1PresetLabels: ["Size"],
  },
  plumbing: {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["15mm", "20mm", "22mm", "25mm", "32mm", "40mm", "50mm"]],
    option1PresetLabels: ["Pipe Size"],
  },
  "electrical-supplies": {
    option1Label: "Type",
    option2Label: "Rating",
    option1Presets: [["Default"]],
    option1PresetLabels: ["Variant"],
  },
  paint: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["500ml", "1L", "2.5L", "5L", "20L"]],
    option1PresetLabels: ["Volume"],
    option2Presets: SA_COLORS,
  },
  "building-materials": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["Default", "S", "M", "L"]],
    option1PresetLabels: ["Variant"],
  },
  "safety-equipment": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL", "XXL"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },
  fasteners: {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["M3", "M4", "M5", "M6", "M8", "M10", "M12"]],
    option1PresetLabels: ["Metric Size"],
  },

  // ═══════════════════════════════════════════════════════════
  // TOYS & GAMES
  // ═══════════════════════════════════════════════════════════
  "toys-games": {
    option1Label: "Age Group",
    option2Label: "Color",
    option1Presets: [["0–2", "3–5", "6–8", "9–12", "13+", "All Ages"]],
    option1PresetLabels: ["Ages"],
    option2Presets: SA_COLORS,
  },
  "action-figures": {
    option1Label: "Character",
    option2Label: "Size",
    option1Presets: [["Default"]],
    option1PresetLabels: ["Character"],
  },
  "building-toys": {
    option1Label: "Pieces",
    option2Label: "Theme",
    option1Presets: [["<100", "100–300", "300–500", "500+"]],
    option1PresetLabels: ["Piece Count"],
  },
  "board-games": {
    option1Label: "Players",
    option2Label: "Type",
    option1Presets: [["2", "2–4", "4–6", "6+", "Solo"]],
    option1PresetLabels: ["Players"],
  },
  "outdoor-play": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },
  "rc-toys": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["RTR", "Kit", "With Batteries"]],
    option1PresetLabels: ["Package"],
    option2Presets: SA_COLORS,
  },
  "educational-toys": {
    option1Label: "Age Group",
    option2Label: "Type",
    option1Presets: [["0–2", "3–5", "6–8", "9–12"]],
    option1PresetLabels: ["Ages"],
  },

  // ═══════════════════════════════════════════════════════════
  // BOOKS & STATIONERY
  // ═══════════════════════════════════════════════════════════
  "books-stationery": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default"]],
    option1PresetLabels: ["Variant"],
  },
  books: {
    option1Label: "Format",
    option2Label: "Language",
    option1Presets: [["Paperback", "Hardcover", "eBook"]],
    option1PresetLabels: ["Format"],
  },
  "school-stationery": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Single", "Pack", "Set"]],
    option1PresetLabels: ["Quantity"],
    option2Presets: SA_COLORS,
  },
  "office-supplies": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default", "Pack", "Box"]],
    option1PresetLabels: ["Quantity"],
  },
  "art-craft": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Single", "Set", "Kit"]],
    option1PresetLabels: ["Package"],
    option2Presets: SA_COLORS,
  },
  packaging: {
    option1Label: "Size",
    option2Label: "Quantity",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Size"],
  },

  // ═══════════════════════════════════════════════════════════
  // PETS
  // ═══════════════════════════════════════════════════════════
  pets: {
    option1Label: "Size",
    option2Label: "Flavor",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Size"],
  },
  dogs: {
    option1Label: "Size",
    option2Label: "Flavor",
    option1Presets: [
      ["S", "M", "L", "XL"],
      ["1kg", "2kg", "4kg", "8kg", "15kg", "20kg"],
    ],
    option1PresetLabels: ["Apparel", "Food Weight"],
  },
  cats: {
    option1Label: "Size",
    option2Label: "Flavor",
    option1Presets: [
      ["S", "M", "L"],
      ["500g", "1kg", "2kg", "4kg", "8kg"],
    ],
    option1PresetLabels: ["Apparel", "Food Weight"],
  },
  birds: {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["250g", "500g", "1kg", "2kg"]],
    option1PresetLabels: ["Weight"],
  },
  "fish-aquarium": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["S", "M", "L", "XL"]],
    option1PresetLabels: ["Tank Size"],
  },
  "pet-grooming": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["S", "M", "L"]],
    option1PresetLabels: ["Pet Size"],
  },

  // ═══════════════════════════════════════════════════════════
  // AGRICULTURE & FARMING
  // ═══════════════════════════════════════════════════════════
  agriculture: {
    option1Label: "Weight",
    option2Label: "Type",
    option1Presets: [["500g", "1kg", "5kg", "10kg", "25kg", "50kg"]],
    option1PresetLabels: ["Weight"],
  },
  "seeds-plants": {
    option1Label: "Quantity",
    option2Label: "Type",
    option1Presets: [["10 seeds", "50 seeds", "100 seeds", "500g", "1kg"]],
    option1PresetLabels: ["Pack Size"],
  },
  fertilizers: {
    option1Label: "Weight",
    option2Label: "Type",
    option1Presets: [["1kg", "2kg", "5kg", "10kg", "25kg", "50kg"]],
    option1PresetLabels: ["Weight"],
  },
  "animal-feed": {
    option1Label: "Weight",
    option2Label: "Type",
    option1Presets: [["5kg", "10kg", "25kg", "40kg", "50kg"]],
    option1PresetLabels: ["Weight"],
  },
  "farming-equipment": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["S", "M", "L", "Default"]],
    option1PresetLabels: ["Size"],
  },
  poultry: {
    option1Label: "Quantity",
    option2Label: "Type",
    option1Presets: [["1", "6", "12", "30", "Tray"]],
    option1PresetLabels: ["Count"],
  },

  // ═══════════════════════════════════════════════════════════
  // BABY & MATERNITY
  // ═══════════════════════════════════════════════════════════
  "baby-maternity": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["Newborn", "0–3m", "3–6m", "6–12m", "12–18m", "18–24m"]],
    option1PresetLabels: ["Baby Size"],
    option2Presets: SA_COLORS,
  },
  "baby-feeding": {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["150ml", "250ml", "300ml"]],
    option1PresetLabels: ["Bottle Size"],
    option2Presets: SA_COLORS,
  },
  diapers: {
    option1Label: "Size",
    option2Label: "Quantity",
    option1Presets: [["Newborn", "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6"]],
    option1PresetLabels: ["Diaper Size"],
  },
  "baby-gear": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default"]],
    option1PresetLabels: ["Variant"],
    option2Presets: SA_COLORS,
  },
  "baby-care": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["50ml", "100ml", "200ml", "400ml"]],
    option1PresetLabels: ["Volume"],
  },

  // ═══════════════════════════════════════════════════════════
  // CRAFTS & HANDMADE
  // ═══════════════════════════════════════════════════════════
  "crafts-handmade": {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default", "S", "M", "L"]],
    option1PresetLabels: ["Variant"],
    option2Presets: SA_COLORS,
  },
  "sewing-fabric": {
    option1Label: "Length",
    option2Label: "Color",
    option1Presets: [["0.5m", "1m", "2m", "3m", "5m", "Per meter"]],
    option1PresetLabels: ["Length"],
    option2Presets: SA_COLORS,
  },
  knitting: {
    option1Label: "Weight",
    option2Label: "Color",
    option1Presets: [["50g", "100g", "200g"]],
    option1PresetLabels: ["Ball Weight"],
    option2Presets: SA_COLORS,
  },
  beading: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["Pack", "Set", "Single"]],
    option1PresetLabels: ["Package"],
    option2Presets: SA_COLORS,
  },
  "candle-soap": {
    option1Label: "Size",
    option2Label: "Scent",
    option1Presets: [["S", "M", "L", "Set"]],
    option1PresetLabels: ["Size"],
  },
  handmade: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "Custom"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },

  // ═══════════════════════════════════════════════════════════
  // SOLAR & ENERGY
  // ═══════════════════════════════════════════════════════════
  "solar-energy": {
    option1Label: "Capacity",
    option2Label: "Type",
    option1Presets: [["100W", "200W", "300W", "400W", "500W", "1kW", "3kW", "5kW"]],
    option1PresetLabels: ["Wattage"],
  },
  "solar-panels": {
    option1Label: "Wattage",
    option2Label: "Type",
    option1Presets: [["100W", "200W", "300W", "400W", "450W", "550W"]],
    option1PresetLabels: ["Wattage"],
  },
  inverters: {
    option1Label: "Capacity",
    option2Label: "Type",
    option1Presets: [["1kW", "3kW", "5kW", "8kW", "10kW"]],
    option1PresetLabels: ["Capacity"],
  },
  "solar-batteries": {
    option1Label: "Capacity",
    option2Label: "Type",
    option1Presets: [["100Ah", "200Ah", "5kWh", "10kWh", "15kWh"]],
    option1PresetLabels: ["Capacity"],
  },
  "solar-kits": {
    option1Label: "Size",
    option2Label: "Type",
    option1Presets: [["Small", "Medium", "Large", "Complete"]],
    option1PresetLabels: ["Kit Size"],
  },
  generators: {
    option1Label: "Wattage",
    option2Label: "Fuel",
    option1Presets: [["1kW", "2kW", "3kW", "5kW", "8kW", "10kW"]],
    option1PresetLabels: ["Wattage"],
  },
  "ups-power": {
    option1Label: "Capacity",
    option2Label: "Type",
    option1Presets: [["600VA", "1000VA", "1500VA", "2000VA", "3000VA"]],
    option1PresetLabels: ["VA Rating"],
  },

  // ═══════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════
  security: {
    option1Label: "Type",
    option2Label: "Color",
    option1Presets: [["Default"]],
    option1PresetLabels: ["Variant"],
    option2Presets: DEVICE_COLORS,
  },
  cctv: {
    option1Label: "Channels",
    option2Label: "Resolution",
    option1Presets: [["4CH", "8CH", "16CH"], ["1", "2", "4", "8"]],
    option1PresetLabels: ["DVR/NVR", "Camera Count"],
  },
  alarms: {
    option1Label: "Zones",
    option2Label: "Type",
    option1Presets: [["4-Zone", "8-Zone", "16-Zone", "Wireless"]],
    option1PresetLabels: ["Size"],
  },
  locks: {
    option1Label: "Type",
    option2Label: "Finish",
    option1Presets: [["Padlock", "Deadbolt", "Gate Lock", "Smart Lock"]],
    option1PresetLabels: ["Type"],
  },
  "electric-fencing": {
    option1Label: "Length",
    option2Label: "Type",
    option1Presets: [["10m", "25m", "50m", "100m"]],
    option1PresetLabels: ["Length"],
  },

  // ═══════════════════════════════════════════════════════════
  // OTHER / GENERAL
  // ═══════════════════════════════════════════════════════════
  other: DEFAULT_VARIANT_PRESET,
  "gift-cards": {
    option1Label: "Value",
    option2Label: "Type",
    option1Presets: [["R50", "R100", "R200", "R500", "R1000"]],
    option1PresetLabels: ["Amount"],
  },
  custom: {
    option1Label: "Size",
    option2Label: "Color",
    option1Presets: [["S", "M", "L", "XL", "Custom"]],
    option1PresetLabels: ["Size"],
    option2Presets: SA_COLORS,
  },
  services: {
    option1Label: "Package",
    option2Label: "Duration",
    option1Presets: [["Basic", "Standard", "Premium"]],
    option1PresetLabels: ["Package"],
  },
  miscellaneous: DEFAULT_VARIANT_PRESET,
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
