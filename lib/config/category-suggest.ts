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
  "mens-shirts-polos": ["formal shirt", "button-down", "oxford", "polo shirt"],
  "mens-hoodies-sweaters": ["hoodie", "sweater", "sweatshirt", "pullover", "fleece", "crewneck"],
  "mens-jackets-coats": ["bomber", "windbreaker", "puffer", "denim jacket", "coat"],
  "mens-pants-joggers": ["jeans", "denim", "slim fit", "trousers", "chinos", "cargo", "joggers", "sweatpants"],
  "mens-shorts": ["shorts", "swim shorts", "board shorts", "gym shorts"],
  "mens-track-sets": ["tracksuit", "track suit", "matching set", "two piece", "sweat set"],
  "mens-underwear": ["boxers", "briefs", "underwear", "underpants", "vest"],

  // ── Women's Clothing ─────────────────────────────────────
  "womens-dresses": ["dress", "maxi dress", "mini dress", "sundress", "bodycon"],
  "womens-tops-blouses": ["top", "blouse", "crop top", "camisole", "tunic", "bodysuit"],
  "womens-skirts": ["skirt", "mini skirt", "maxi skirt", "pencil skirt", "pleated"],
  "womens-pants-leggings": ["women jeans", "ladies jeans", "skinny jeans", "mom jeans", "leggings", "tights", "yoga pants", "palazzo", "culottes", "wide leg"],
  "womens-jackets-coats": ["women jacket", "blazer", "cardigan", "women coat", "trench"],
  "womens-hoodies-sweaters": ["women hoodie", "women sweater", "women pullover"],
  "womens-activewear": ["activewear", "sportswear", "gym wear", "fitness wear", "workout", "sports bra"],
  "womens-lingerie": ["lingerie", "bra", "bralette", "panties", "underwear set"],
  "womens-swimwear": ["bikini", "swimsuit", "swimwear", "one piece swim"],

  // ── Unisex ───────────────────────────────────────────────
  "unisex-streetwear": ["streetwear", "unisex", "oversized", "urban"],
  "unisex-basics": ["unisex t-shirt", "unisex tee", "blank hoodie", "plain tee"],
  "unisex-loungewear": ["loungewear", "pajamas", "sleepwear", "nightwear"],

  // ── Kids ─────────────────────────────────────────────────
  "kids-boys": ["boys", "boy", "boys clothing"],
  "kids-girls": ["girls", "girl", "girls clothing"],
  "kids-baby": ["baby", "infant", "onesie", "romper", "babygrow", "newborn"],
  "kids-school-uniforms": ["school uniform", "school shirt", "school pants", "school dress"],
  "kids-shoes": ["kids shoes", "kids sneakers", "baby shoes", "school shoes"],

  // ── Footwear ─────────────────────────────────────────────
  sneakers: ["sneaker", "sneakers", "trainers", "kicks", "running shoes"],
  "formal-shoes": ["formal shoes", "oxford shoes", "loafers", "brogues", "dress shoes"],
  "sandals-slides": ["sandals", "slides", "flip flops", "slippers"],
  boots: ["boots", "ankle boots", "chelsea boots", "combat boots", "work boots"],
  "safety-boots": ["safety boots", "steel toe", "safety shoes", "work boots steel"],

  // ── Accessories ──────────────────────────────────────────
  "caps-hats": ["cap", "beanie", "bucket hat", "snapback", "trucker hat", "hat", "fitted cap"],
  "bags-backpacks": ["bag", "backpack", "handbag", "tote", "duffel", "sling bag", "crossbody"],
  belts: ["belt", "leather belt", "canvas belt"],
  sunglasses: ["sunglasses", "shades", "glasses"],
  jewelry: ["jewellery", "jewelry", "necklace", "bracelet", "ring", "earring", "chain", "pendant"],
  "scarves-wraps": ["scarf", "scarves", "wrap", "shawl", "hijab", "durag"],
  watches: ["watch", "watches", "timepiece", "smartwatch"],
  wallets: ["wallet", "purse", "card holder", "money clip"],

  // ── Formal & Traditional ─────────────────────────────────
  "suits-blazers": ["suit", "blazer", "tuxedo", "two piece suit", "three piece", "waistcoat"],
  "traditional-wear": ["traditional", "african", "dashiki", "ankara", "shweshwe", "isicholo", "umqhele"],
  "formal-dresses": ["formal dress", "evening gown", "cocktail dress", "prom dress", "matric dance"],

  // ── Phones & Tablets ─────────────────────────────────────
  phones: ["phone", "iphone", "samsung", "smartphone", "cellphone", "cell phone", "mobile phone"],
  tablets: ["tablet", "ipad", "tab", "kindle"],
  "phone-cases": ["phone case", "iphone case", "samsung case", "phone cover", "silicone case"],
  "screen-protectors": ["screen protector", "tempered glass", "screen guard"],
  "chargers-cables": ["charger", "cable", "usb cable", "lightning cable", "usb-c", "fast charger", "adapter"],
  "power-banks": ["power bank", "powerbank", "portable charger", "battery pack"],

  // ── Computers & Laptops ──────────────────────────────────
  laptops: ["laptop", "notebook", "macbook", "chromebook", "ultrabook"],
  desktops: ["desktop", "pc", "computer", "gaming pc", "all-in-one"],
  monitors: ["monitor", "screen", "display", "curved monitor"],
  "computer-accessories": ["keyboard", "mouse", "mousepad", "webcam", "usb hub", "docking station"],
  printers: ["printer", "scanner", "ink", "toner", "cartridge"],
  "storage-memory": ["hard drive", "ssd", "flash drive", "memory card", "sd card", "usb drive", "ram"],

  // ── Electronics / Gadgets ────────────────────────────────
  audio: ["earphones", "headphones", "earbuds", "airpods"],
  speakers: ["speaker", "bluetooth speaker", "soundbar", "subwoofer", "home theater"],
  cameras: ["camera", "dslr", "mirrorless", "gopro", "action camera", "dashcam"],
  drones: ["drone", "quadcopter", "fpv", "drone camera", "mavic", "dji"],
  gaming: ["console", "playstation", "xbox", "nintendo", "ps5", "controller", "gaming"],
  "smart-devices": ["smart watch", "fitness tracker", "smart band", "gps tracker", "smart home"],
  "tvs-projectors": ["tv", "television", "smart tv", "projector", "led tv", "oled"],
  networking: ["router", "wifi", "mesh", "range extender", "modem", "network switch"],
  "cables-adapters": ["hdmi", "ethernet cable", "extension cord", "power strip", "surge protector"],
  batteries: ["battery", "batteries", "rechargeable", "aa battery", "aaa"],

  // ── Beauty & Health ──────────────────────────────────────
  skincare: ["skincare", "moisturizer", "moisturiser", "sunscreen", "face wash", "serum", "cleanser", "toner"],
  haircare: ["shampoo", "conditioner", "hair oil", "hair treatment", "braids"],
  makeup: ["makeup", "lipstick", "foundation", "mascara", "eyeshadow", "concealer", "primer"],
  fragrances: ["perfume", "cologne", "fragrance", "eau de toilette", "body spray", "deodorant"],
  nails: ["nail polish", "gel nails", "acrylic nails", "nail kit", "press on nails", "nail art"],
  "personal-care": ["soap", "body wash", "lotion", "body cream", "hand sanitizer", "toothpaste"],
  "health-wellness": ["vitamins", "supplements", "protein", "first aid", "blood pressure", "thermometer"],
  "wigs-extensions": ["wig", "weave", "hair extension", "frontal", "closure", "lace wig", "bob wig"],

  // ── Food & Beverages ─────────────────────────────────────
  snacks: ["snack", "chips", "biltong", "droewors", "nuts", "dried fruit", "popcorn", "chocolate"],
  drinks: ["juice", "cooldrink", "soda", "energy drink", "water", "tea", "coffee", "rooibos"],
  "fresh-produce": ["fresh", "fruit", "vegetables", "organic", "farm produce"],
  spices: ["spice", "spices", "seasoning", "curry", "masala", "chutney", "sauce", "braai spice"],
  "baked-goods": ["cake", "cookies", "bread", "muffin", "pastry", "cupcake", "biscuit", "rusks"],
  "meat-braai": ["meat", "braai", "steak", "boerewors", "chicken", "ribs", "wors", "brisket"],
  "dairy-eggs": ["milk", "cheese", "yoghurt", "eggs", "butter", "cream"],
  pantry: ["rice", "flour", "sugar", "mealie meal", "pasta", "oil", "cooking oil", "maize"],

  // ── Home & Garden ────────────────────────────────────────
  furniture: ["furniture", "table", "chair", "shelf", "desk", "couch", "sofa", "bed frame"],
  decor: ["decor", "decoration", "wall art", "vase", "cushion", "pillow", "throw"],
  kitchen: ["kitchen", "pot", "pan", "utensil", "plate", "cup", "mug", "cutlery", "tupperware"],
  bedding: ["bedding", "duvet", "pillow", "sheets", "blanket", "comforter", "mattress protector"],
  bathroom: ["towel", "bath mat", "shower curtain", "toilet seat", "bathroom accessories"],
  "garden-outdoor": ["garden", "plant", "pot plant", "gardening", "hose", "lawn mower", "braai stand"],
  lighting: ["lamp", "light bulb", "led light", "fairy lights", "ceiling light", "chandelier", "spotlight"],
  cleaning: ["cleaning", "detergent", "bleach", "mop", "broom", "vacuum", "dishwash"],
  "storage-org": ["storage bin", "organizer", "shelf organizer", "container", "crate"],

  // ── Sports & Outdoors ────────────────────────────────────
  "gym-fitness": ["dumbbell", "weights", "gym equipment", "resistance band", "yoga mat", "kettlebell", "bench press"],
  soccer: ["soccer ball", "football", "soccer boots", "shin guards", "jersey", "soccer kit"],
  "rugby-cricket": ["rugby ball", "cricket bat", "cricket ball", "rugby jersey", "wicket"],
  running: ["running shoes", "running watch", "running belt", "trail shoes"],
  camping: ["tent", "sleeping bag", "camping chair", "cooler box", "headlamp", "camping stove", "gas bottle"],
  cycling: ["bicycle", "bike", "cycling helmet", "cycling shorts", "bike pump", "bike light"],
  "water-sports": ["surfboard", "wetsuit", "snorkel", "goggles", "inflatable", "pool"],
  "sports-apparel": ["sports jersey", "gym vest", "compression", "athletic wear"],

  // ── Auto Parts & Accessories ─────────────────────────────
  "auto-engine": ["engine", "motor", "filter", "oil filter", "air filter", "spark plug", "alternator"],
  "auto-body": ["bumper", "fender", "door panel", "mirror", "grille", "hood"],
  "auto-electrical": ["car battery", "headlight", "tail light", "wiring", "fuse", "starter"],
  tyres: ["tyre", "tire", "tyres", "tires", "wheel", "rim", "mag"],
  "car-accessories": ["car seat cover", "car mat", "steering cover", "car freshener", "dash cam"],
  "car-care": ["car wash", "wax", "polish", "car shampoo", "detailing", "car vacuum"],
  "motorcycle-parts": ["motorcycle", "motorbike", "helmet", "biker jacket", "exhaust"],

  // ── Tools & Hardware ─────────────────────────────────────
  "power-tools": ["drill", "grinder", "circular saw", "jigsaw", "sander", "impact driver"],
  "hand-tools": ["hammer", "screwdriver", "wrench", "pliers", "spanner", "tape measure", "level"],
  plumbing: ["pipe", "fitting", "tap", "valve", "geyser", "cistern", "drain"],
  "electrical-supplies": ["switch", "socket", "breaker", "cable ties", "conduit", "junction box"],
  paint: ["paint", "primer", "varnish", "wood stain", "spray paint", "brush", "roller"],
  "building-materials": ["cement", "bricks", "sand", "gravel", "tiles", "drywall", "roof sheets"],
  "safety-equipment": ["safety vest", "hard hat", "safety glasses", "ear plugs", "gloves", "harness"],
  fasteners: ["bolt", "nut", "screw", "nail", "anchor", "washer", "rivet"],

  // ── Toys & Games ─────────────────────────────────────────
  "action-figures": ["action figure", "figurine", "superhero toy", "doll"],
  "building-toys": ["lego", "blocks", "building blocks", "construction toy", "magnetic tiles"],
  "board-games": ["board game", "puzzle", "card game", "chess", "monopoly", "uno"],
  "outdoor-play": ["swing", "trampoline", "slide", "sandbox", "water gun", "ball pit"],
  "rc-toys": ["rc car", "remote control", "rc helicopter", "rc truck", "toy car"],
  "educational-toys": ["educational toy", "learning toy", "stem toy", "counting", "alphabet"],

  // ── Books & Stationery ───────────────────────────────────
  books: ["book", "novel", "textbook", "comic", "magazine", "ebook"],
  "school-stationery": ["pencil", "pen", "eraser", "ruler", "crayon", "notebook", "exercise book"],
  "office-supplies": ["paper", "folder", "stapler", "tape", "calculator", "whiteboard"],
  "art-craft": ["paint brush", "canvas", "sketch pad", "watercolor", "acrylic paint", "markers"],
  packaging: ["box", "bubble wrap", "packing tape", "mailer", "shipping bag"],

  // ── Pet Supplies ─────────────────────────────────────────
  dogs: ["dog food", "dog collar", "dog leash", "dog bed", "dog toy", "puppy", "dog treats"],
  cats: ["cat food", "cat litter", "cat toy", "scratching post", "cat bed", "kitten"],
  birds: ["bird cage", "bird food", "bird seed", "parrot", "budgie"],
  "fish-aquarium": ["fish tank", "aquarium", "fish food", "filter", "fish pump"],
  "pet-grooming": ["pet shampoo", "grooming", "pet brush", "flea treatment", "tick treatment"],

  // ── Agriculture & Farming ────────────────────────────────
  "seeds-plants": ["seeds", "seedling", "plant", "tree", "herb seeds", "vegetable seeds"],
  fertilizers: ["fertilizer", "compost", "manure", "soil", "potting soil", "mulch"],
  "animal-feed": ["animal feed", "livestock feed", "cattle feed", "horse feed", "pig feed"],
  "farming-equipment": ["farming", "tractor", "plough", "irrigation", "sprayer", "wheelbarrow"],
  poultry: ["chicken feed", "poultry", "egg tray", "incubator", "chicken coop", "layer mash"],

  // ── Baby & Maternity ─────────────────────────────────────
  "baby-feeding": ["baby bottle", "sippy cup", "breast pump", "formula", "baby food"],
  diapers: ["diaper", "nappy", "nappies", "wipes", "baby wipes", "changing mat"],
  "baby-gear": ["stroller", "pram", "car seat", "baby carrier", "baby walker", "high chair"],
  "baby-care": ["baby lotion", "baby oil", "baby shampoo", "baby powder", "rash cream"],
  maternity: ["maternity dress", "maternity wear", "nursing bra", "pregnancy", "belly band"],

  // ── Crafts & Handmade ────────────────────────────────────
  "sewing-fabric": ["fabric", "sewing machine", "thread", "needle", "zipper", "cotton fabric", "satin"],
  knitting: ["yarn", "knitting needle", "wool", "crochet", "crochet hook"],
  beading: ["beads", "beading wire", "jewelry making", "clasp", "charm"],
  "candle-soap": ["candle", "candle wax", "soap making", "essential oil", "fragrance oil", "mold"],
  handmade: ["handmade", "hand crafted", "artisan", "custom made"],

  // ── Solar & Energy ───────────────────────────────────────
  "solar-panels": ["solar panel", "solar", "pv panel", "monocrystalline", "polycrystalline"],
  inverters: ["inverter", "hybrid inverter", "off grid inverter", "microinverter"],
  "solar-batteries": ["solar battery", "lithium battery", "deep cycle", "gel battery", "lifepo4"],
  "solar-kits": ["solar kit", "solar system", "solar package", "loadshedding kit"],
  generators: ["generator", "petrol generator", "diesel generator", "silent generator", "genset"],
  "ups-power": ["ups", "uninterruptible", "backup power", "power supply"],

  // ── Security & Surveillance ──────────────────────────────
  cctv: ["cctv", "security camera", "ip camera", "dvr", "nvr", "surveillance"],
  alarms: ["alarm", "alarm system", "motion sensor", "panic button", "siren"],
  locks: ["lock", "padlock", "deadbolt", "gate lock", "smart lock", "safe"],
  "electric-fencing": ["electric fence", "energizer", "electric fencing", "fence wire"],

  // ── Other / General ──────────────────────────────────────
  "gift-cards": ["gift card", "voucher", "gift voucher", "store credit"],
  custom: ["custom", "personalised", "personalized", "engraved", "monogram"],
  services: ["service", "repair", "installation", "delivery", "consulting"],
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
