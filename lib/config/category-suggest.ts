// ============================================================
// Category Suggestion Engine (M8.3) — Client-safe
// ============================================================
// Simple keyword-based matching. Maps product name keywords
// to global category slugs. No AI needed — just smart defaults.
//
// WHY THIS FILE EXISTS:
// This was originally in lib/db/global-categories.ts, but that file
// imports Prisma (server-only). Since this logic runs in client
// components (create-product-form), it must live in a file with
// NO server-side imports.
// ============================================================

const KEYWORD_MAP: Record<string, string[]> = {
  // ── Men's Clothing ───────────────────────────────────────
  "mens-tshirts": ["t-shirt", "tee", "tshirt", "t shirt", "graphic tee"],
  "mens-shirts-polos": ["shirt", "formal shirt", "button-down", "oxford", "polo"],
  "mens-hoodies-sweaters": ["hoodie", "sweater", "sweatshirt", "pullover", "fleece", "crewneck"],
  "mens-jackets-coats": ["jacket", "bomber", "windbreaker", "puffer", "denim jacket", "coat"],
  "mens-pants-joggers": ["jeans", "denim", "slim fit", "trousers", "chinos", "pants", "cargo", "joggers", "sweatpants"],
  "mens-shorts": ["shorts", "swim shorts", "board shorts", "gym shorts"],
  "mens-track-sets": ["tracksuit", "track suit", "matching set", "two piece", "sweat set"],

  // ── Women's Clothing ─────────────────────────────────────
  "womens-dresses": ["dress", "maxi dress", "mini dress", "sundress", "bodycon"],
  "womens-tops-blouses": ["top", "blouse", "crop top", "camisole", "tunic", "bodysuit"],
  "womens-skirts": ["skirt", "mini skirt", "maxi skirt", "pencil skirt", "pleated"],
  "womens-pants-leggings": ["women jeans", "ladies jeans", "skinny jeans", "mom jeans", "leggings", "tights", "yoga pants", "palazzo", "culottes", "wide leg"],
  "womens-jackets-coats": ["women jacket", "blazer", "cardigan", "women coat", "trench"],
  "womens-hoodies-sweaters": ["women hoodie", "women sweater", "women pullover"],
  "womens-activewear": ["activewear", "sportswear", "gym wear", "fitness", "workout", "sports bra"],

  // ── Unisex ───────────────────────────────────────────────
  "unisex-streetwear": ["streetwear", "unisex", "oversized", "urban"],
  "unisex-basics": ["unisex t-shirt", "unisex tee", "blank hoodie", "plain tee"],
  "unisex-loungewear": ["loungewear", "pajamas", "sleepwear", "nightwear"],

  // ── Kids ─────────────────────────────────────────────────
  "kids-boys": ["boys", "boy", "boys clothing"],
  "kids-girls": ["girls", "girl", "girls clothing"],
  "kids-baby": ["baby", "infant", "onesie", "romper", "babygrow", "newborn"],

  // ── Footwear ─────────────────────────────────────────────
  sneakers: ["sneaker", "sneakers", "trainers", "kicks", "running shoes"],
  "formal-shoes": ["formal shoes", "oxford shoes", "loafers", "brogues", "dress shoes"],
  "sandals-slides": ["sandals", "slides", "flip flops", "slippers"],
  boots: ["boots", "ankle boots", "chelsea boots", "combat boots", "work boots"],

  // ── Accessories ──────────────────────────────────────────
  "caps-hats": ["cap", "beanie", "bucket hat", "snapback", "trucker hat", "hat", "fitted cap"],
  "bags-backpacks": ["bag", "backpack", "handbag", "tote", "duffel", "sling bag", "crossbody"],
  belts: ["belt", "leather belt", "canvas belt"],
  sunglasses: ["sunglasses", "shades", "glasses"],
  jewelry: ["jewellery", "jewelry", "necklace", "bracelet", "ring", "earring", "chain", "pendant"],
  "scarves-wraps": ["scarf", "scarves", "wrap", "shawl", "hijab", "durag"],
  watches: ["watch", "watches", "timepiece", "smartwatch"],

  // ── Formal & Traditional ─────────────────────────────────
  "suits-blazers": ["suit", "blazer", "tuxedo", "two piece suit", "three piece", "waistcoat"],
  "traditional-wear": ["traditional", "african", "dashiki", "ankara", "shweshwe", "isicholo", "umqhele"],
  "formal-dresses": ["formal dress", "evening gown", "cocktail dress", "prom dress", "matric dance"],

  // ── Electronics ──────────────────────────────────────────
  phones: ["phone", "iphone", "samsung", "smartphone", "cellphone", "cell phone", "mobile"],
  laptops: ["laptop", "notebook", "macbook", "chromebook", "ultrabook"],
  "electronics-accessories": ["charger", "cable", "usb", "power bank", "adapter", "screen protector", "phone case"],
  audio: ["earphones", "headphones", "earbuds", "airpods", "speaker", "bluetooth speaker", "soundbar"],
  tablets: ["tablet", "ipad", "tab"],

  // ── Beauty & Health ──────────────────────────────────────
  skincare: ["skincare", "moisturizer", "moisturiser", "sunscreen", "face wash", "serum", "cleanser", "toner"],
  haircare: ["shampoo", "conditioner", "hair oil", "hair treatment", "wig", "weave", "braids"],
  makeup: ["makeup", "lipstick", "foundation", "mascara", "eyeshadow", "concealer", "primer"],
  fragrances: ["perfume", "cologne", "fragrance", "eau de toilette", "body spray", "deodorant"],

  // ── Food & Beverages ─────────────────────────────────────
  snacks: ["snack", "chips", "biltong", "droewors", "nuts", "dried fruit", "popcorn", "chocolate"],
  drinks: ["juice", "cooldrink", "soda", "energy drink", "water", "tea", "coffee", "rooibos"],
  "fresh-produce": ["fresh", "fruit", "vegetables", "organic", "farm"],
  spices: ["spice", "spices", "seasoning", "curry", "masala", "chutney", "sauce", "braai"],

  // ── Home & Garden ────────────────────────────────────────
  furniture: ["furniture", "table", "chair", "shelf", "desk", "couch", "sofa", "bed"],
  decor: ["decor", "decoration", "wall art", "candle", "vase", "cushion", "pillow", "throw"],
  kitchen: ["kitchen", "pot", "pan", "utensil", "plate", "cup", "mug", "cutlery", "tupperware"],
  tools: ["tool", "tools", "drill", "hammer", "screwdriver", "wrench", "pliers"],

  // ── Auto Parts ───────────────────────────────────────────
  "auto-engine": ["engine", "motor", "filter", "oil filter", "air filter", "spark plug", "alternator"],
  "auto-body": ["bumper", "fender", "door panel", "mirror", "grille", "hood"],
  "auto-electrical": ["car battery", "headlight", "tail light", "wiring", "fuse", "starter"],
  tyres: ["tyre", "tire", "tyres", "tires", "wheel", "rim", "mag"],
};

/**
 * Suggest a global category based on product name.
 *
 * WHAT: Simple keyword matching — finds best category for a product name.
 * WHY: Reduces friction when sellers add products. One-tap category assignment.
 *
 * ALGORITHM:
 * 1. Lowercase the product name
 * 2. Check each keyword list for matches
 * 3. Return the slug of the best match (longest keyword match wins)
 * 4. If no match, return null
 */
export function suggestGlobalCategory(
  productName: string
): string | null {
  const name = productName.toLowerCase().trim();
  if (!name) return null;

  let bestMatch: { slug: string; matchLength: number } | null = null;

  for (const [slug, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        if (!bestMatch || keyword.length > bestMatch.matchLength) {
          bestMatch = { slug, matchLength: keyword.length };
        }
      }
    }
  }

  return bestMatch?.slug ?? null;
}
