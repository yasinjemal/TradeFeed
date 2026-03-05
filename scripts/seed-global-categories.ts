// ============================================================
// Seed Script — Global Categories for Marketplace
// ============================================================
// Idempotent: safe to run multiple times (upserts by slug).
// Creates top-level categories + subcategories.
//
// NAMING: Generic, not clothing-specific. Works for any industry
// when we expand later. Clothing categories are just the first set.
//
// RUN: npm run seed:categories
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Category taxonomy ──────────────────────────────────────

interface CategoryDef {
  name: string;
  slug: string;
  icon: string;
  description: string;
  displayOrder: number;
  children?: Omit<CategoryDef, "children">[];
}

const CATEGORIES: CategoryDef[] = [
  // ═══════════════════════════════════════════════════════════
  // CLOTHING & FASHION
  // ═══════════════════════════════════════════════════════════
  {
    name: "Men's Clothing",
    slug: "mens-clothing",
    icon: "👔",
    description: "Hoodies, t-shirts, jackets, pants and more for men",
    displayOrder: 1,
    children: [
      { name: "Hoodies & Sweaters", slug: "mens-hoodies-sweaters", icon: "🧥", description: "Oversized hoodies, zip-ups, crewneck sweaters", displayOrder: 1 },
      { name: "T-Shirts", slug: "mens-tshirts", icon: "👕", description: "Graphic tees, plain tees, long sleeves", displayOrder: 2 },
      { name: "Jackets & Coats", slug: "mens-jackets-coats", icon: "🧥", description: "Denim jackets, puffer jackets, bombers, windbreakers", displayOrder: 3 },
      { name: "Pants & Joggers", slug: "mens-pants-joggers", icon: "👖", description: "Cargo pants, joggers, jeans, chinos", displayOrder: 4 },
      { name: "Track Sets", slug: "mens-track-sets", icon: "🏃", description: "Matching tracksuits, sweat sets, athleisure", displayOrder: 5 },
      { name: "Shorts", slug: "mens-shorts", icon: "🩳", description: "Cargo shorts, gym shorts, swim shorts", displayOrder: 6 },
      { name: "Shirts & Polos", slug: "mens-shirts-polos", icon: "👔", description: "Button-ups, polo shirts, formal shirts", displayOrder: 7 },
      { name: "Underwear & Socks", slug: "mens-underwear", icon: "🩲", description: "Boxers, briefs, socks, vests", displayOrder: 8 },
    ],
  },
  {
    name: "Women's Clothing",
    slug: "womens-clothing",
    icon: "👗",
    description: "Dresses, tops, skirts, activewear and more for women",
    displayOrder: 2,
    children: [
      { name: "Dresses", slug: "womens-dresses", icon: "👗", description: "Casual dresses, formal dresses, maxi, midi", displayOrder: 1 },
      { name: "Tops & Blouses", slug: "womens-tops-blouses", icon: "👚", description: "Crop tops, blouses, tank tops, bodysuits", displayOrder: 2 },
      { name: "Skirts", slug: "womens-skirts", icon: "🩱", description: "Mini skirts, midi skirts, pleated, denim", displayOrder: 3 },
      { name: "Pants & Leggings", slug: "womens-pants-leggings", icon: "👖", description: "Leggings, jeans, wide-leg pants, cargo", displayOrder: 4 },
      { name: "Activewear", slug: "womens-activewear", icon: "🏋️", description: "Sports bras, gym sets, yoga pants", displayOrder: 5 },
      { name: "Hoodies & Sweaters", slug: "womens-hoodies-sweaters", icon: "🧥", description: "Oversized hoodies, cardigans, knit sweaters", displayOrder: 6 },
      { name: "Jackets & Coats", slug: "womens-jackets-coats", icon: "🧥", description: "Blazers, puffer jackets, trench coats", displayOrder: 7 },
      { name: "Lingerie & Sleepwear", slug: "womens-lingerie", icon: "👙", description: "Bras, underwear, nightgowns, pajamas", displayOrder: 8 },
      { name: "Swimwear", slug: "womens-swimwear", icon: "👙", description: "Bikinis, one-pieces, cover-ups", displayOrder: 9 },
    ],
  },
  {
    name: "Unisex",
    slug: "unisex",
    icon: "🧑",
    description: "Gender-neutral clothing and streetwear",
    displayOrder: 3,
    children: [
      { name: "Streetwear", slug: "unisex-streetwear", icon: "🔥", description: "Oversized fits, graphic pieces, urban style", displayOrder: 1 },
      { name: "Basics", slug: "unisex-basics", icon: "⬜", description: "Plain tees, blank hoodies, essential pieces", displayOrder: 2 },
      { name: "Loungewear", slug: "unisex-loungewear", icon: "🛋️", description: "Sweatpants, pajamas, cozy sets", displayOrder: 3 },
    ],
  },
  {
    name: "Kids & Baby",
    slug: "kids",
    icon: "👶",
    description: "Clothing, shoes and accessories for children and babies",
    displayOrder: 4,
    children: [
      { name: "Boys Clothing", slug: "kids-boys", icon: "👦", description: "T-shirts, pants, jackets for boys", displayOrder: 1 },
      { name: "Girls Clothing", slug: "kids-girls", icon: "👧", description: "Dresses, tops, skirts for girls", displayOrder: 2 },
      { name: "Baby (0–2 yrs)", slug: "kids-baby", icon: "👶", description: "Onesies, rompers, baby sets", displayOrder: 3 },
      { name: "School Uniforms", slug: "kids-school-uniforms", icon: "🎒", description: "School shirts, pants, shoes, ties", displayOrder: 4 },
      { name: "Kids Shoes", slug: "kids-shoes", icon: "👟", description: "Sneakers, sandals, school shoes for kids", displayOrder: 5 },
    ],
  },
  {
    name: "Footwear",
    slug: "footwear",
    icon: "👟",
    description: "Sneakers, boots, sandals and all types of shoes",
    displayOrder: 5,
    children: [
      { name: "Sneakers", slug: "sneakers", icon: "👟", description: "Casual sneakers, running shoes, high-tops", displayOrder: 1 },
      { name: "Boots", slug: "boots", icon: "🥾", description: "Ankle boots, combat boots, Chelsea boots", displayOrder: 2 },
      { name: "Sandals & Slides", slug: "sandals-slides", icon: "🩴", description: "Flip-flops, slides, open-toe sandals", displayOrder: 3 },
      { name: "Formal Shoes", slug: "formal-shoes", icon: "👞", description: "Loafers, oxfords, dress shoes", displayOrder: 4 },
      { name: "Safety & Work Boots", slug: "safety-boots", icon: "🥾", description: "Steel toe boots, work shoes, safety footwear", displayOrder: 5 },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    icon: "🎒",
    description: "Caps, bags, belts, jewelry and more",
    displayOrder: 6,
    children: [
      { name: "Caps & Hats", slug: "caps-hats", icon: "🧢", description: "Snapbacks, bucket hats, beanies, fitted caps", displayOrder: 1 },
      { name: "Bags & Backpacks", slug: "bags-backpacks", icon: "🎒", description: "Crossbody bags, backpacks, totes, duffle bags", displayOrder: 2 },
      { name: "Belts", slug: "belts", icon: "🪢", description: "Leather belts, canvas belts, designer belts", displayOrder: 3 },
      { name: "Jewelry", slug: "jewelry", icon: "💍", description: "Chains, rings, bracelets, earrings", displayOrder: 4 },
      { name: "Watches", slug: "watches", icon: "⌚", description: "Casual watches, smart watches, luxury watches", displayOrder: 5 },
      { name: "Sunglasses", slug: "sunglasses", icon: "🕶️", description: "Fashion sunglasses, sports sunglasses", displayOrder: 6 },
      { name: "Scarves & Wraps", slug: "scarves-wraps", icon: "🧣", description: "Scarves, shawls, head wraps, durags", displayOrder: 7 },
      { name: "Wallets & Purses", slug: "wallets", icon: "👛", description: "Leather wallets, card holders, coin purses", displayOrder: 8 },
    ],
  },
  {
    name: "Formal & Traditional",
    slug: "formal-traditional",
    icon: "🎩",
    description: "Suits, traditional wear, and formal attire",
    displayOrder: 7,
    children: [
      { name: "Suits & Blazers", slug: "suits-blazers", icon: "🤵", description: "Business suits, blazers, waistcoats", displayOrder: 1 },
      { name: "Traditional Wear", slug: "traditional-wear", icon: "🪬", description: "African traditional clothing, cultural attire", displayOrder: 2 },
      { name: "Formal Dresses", slug: "formal-dresses", icon: "👗", description: "Evening gowns, cocktail dresses, matric dance", displayOrder: 3 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ELECTRONICS & TECHNOLOGY
  // ═══════════════════════════════════════════════════════════
  {
    name: "Phones & Tablets",
    slug: "phones-tablets",
    icon: "📱",
    description: "Smartphones, tablets, and mobile devices",
    displayOrder: 8,
    children: [
      { name: "Smartphones", slug: "phones", icon: "📱", description: "iPhones, Samsung, Huawei, Xiaomi, refurbished", displayOrder: 1 },
      { name: "Tablets", slug: "tablets", icon: "📲", description: "iPads, Android tablets, e-readers", displayOrder: 2 },
      { name: "Phone Cases & Covers", slug: "phone-cases", icon: "📱", description: "Silicone cases, clear cases, leather covers, flip covers", displayOrder: 3 },
      { name: "Screen Protectors", slug: "screen-protectors", icon: "🛡️", description: "Tempered glass, screen films, privacy screens", displayOrder: 4 },
      { name: "Chargers & Cables", slug: "chargers-cables", icon: "🔌", description: "USB-C, Lightning, fast chargers, wireless chargers", displayOrder: 5 },
      { name: "Power Banks", slug: "power-banks", icon: "🔋", description: "Portable chargers, solar power banks, fast-charge banks", displayOrder: 6 },
    ],
  },
  {
    name: "Computers & Laptops",
    slug: "computers",
    icon: "💻",
    description: "Laptops, desktops, components and peripherals",
    displayOrder: 9,
    children: [
      { name: "Laptops", slug: "laptops", icon: "💻", description: "Notebooks, MacBooks, Chromebooks, gaming laptops", displayOrder: 1 },
      { name: "Desktops", slug: "desktops", icon: "🖥️", description: "Desktop PCs, all-in-one, mini PCs", displayOrder: 2 },
      { name: "Monitors & Screens", slug: "monitors", icon: "🖥️", description: "LED monitors, curved screens, gaming monitors", displayOrder: 3 },
      { name: "Computer Accessories", slug: "computer-accessories", icon: "⌨️", description: "Keyboards, mice, webcams, USB hubs", displayOrder: 4 },
      { name: "Printers & Scanners", slug: "printers", icon: "🖨️", description: "Inkjet, laser, 3D printers, scanners", displayOrder: 5 },
      { name: "Storage & Memory", slug: "storage-memory", icon: "💾", description: "USB drives, external hard drives, SD cards, SSDs", displayOrder: 6 },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "🔌",
    description: "Audio, video, cameras, drones and gadgets",
    displayOrder: 10,
    children: [
      { name: "Earphones & Headphones", slug: "audio", icon: "🎧", description: "Earbuds, headphones, AirPods, noise-cancelling", displayOrder: 1 },
      { name: "Speakers & Soundbars", slug: "speakers", icon: "🔊", description: "Bluetooth speakers, soundbars, home audio", displayOrder: 2 },
      { name: "Cameras & Photography", slug: "cameras", icon: "📷", description: "Digital cameras, action cameras, lenses, tripods", displayOrder: 3 },
      { name: "Drones", slug: "drones", icon: "🚁", description: "Camera drones, racing drones, drone accessories", displayOrder: 4 },
      { name: "Gaming", slug: "gaming", icon: "🎮", description: "Consoles, controllers, gaming accessories, games", displayOrder: 5 },
      { name: "Smart Devices & Wearables", slug: "smart-devices", icon: "⌚", description: "Smart watches, fitness trackers, smart home devices", displayOrder: 6 },
      { name: "TVs & Projectors", slug: "tvs-projectors", icon: "📺", description: "LED TVs, smart TVs, projectors, streaming devices", displayOrder: 7 },
      { name: "Networking & WiFi", slug: "networking", icon: "📡", description: "Routers, range extenders, modems, ethernet", displayOrder: 8 },
      { name: "Cables & Adapters", slug: "cables-adapters", icon: "🔌", description: "HDMI, USB, converters, extension cords, surge protectors", displayOrder: 9 },
      { name: "Batteries & Chargers", slug: "batteries", icon: "🔋", description: "AA, AAA, rechargeable, battery chargers, car chargers", displayOrder: 10 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BEAUTY, HEALTH & PERSONAL CARE
  // ═══════════════════════════════════════════════════════════
  {
    name: "Beauty & Health",
    slug: "beauty-health",
    icon: "💄",
    description: "Skincare, haircare, makeup, fragrances and wellness",
    displayOrder: 11,
    children: [
      { name: "Skincare", slug: "skincare", icon: "🧴", description: "Moisturizers, serums, sunscreen, cleansers", displayOrder: 1 },
      { name: "Haircare", slug: "haircare", icon: "💇", description: "Shampoo, conditioner, treatments, wigs, weaves", displayOrder: 2 },
      { name: "Makeup", slug: "makeup", icon: "💄", description: "Foundation, lipstick, mascara, eyeshadow", displayOrder: 3 },
      { name: "Fragrances", slug: "fragrances", icon: "🌸", description: "Perfumes, colognes, body sprays", displayOrder: 4 },
      { name: "Nails", slug: "nails", icon: "💅", description: "Nail polish, gel nails, press-ons, nail tools", displayOrder: 5 },
      { name: "Personal Care", slug: "personal-care", icon: "🪥", description: "Toothbrushes, razors, deodorant, body wash", displayOrder: 6 },
      { name: "Health & Wellness", slug: "health-wellness", icon: "💊", description: "Supplements, vitamins, first aid, masks", displayOrder: 7 },
      { name: "Hair Extensions & Wigs", slug: "wigs-extensions", icon: "💇", description: "Human hair, synthetic wigs, weaves, braiding hair", displayOrder: 8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FOOD, DRINKS & GROCERY
  // ═══════════════════════════════════════════════════════════
  {
    name: "Food & Beverages",
    slug: "food-beverages",
    icon: "🍽️",
    description: "Snacks, drinks, fresh produce, spices and grocery",
    displayOrder: 12,
    children: [
      { name: "Snacks & Sweets", slug: "snacks", icon: "🍿", description: "Biltong, droëwors, chips, nuts, dried fruit, chocolate", displayOrder: 1 },
      { name: "Drinks", slug: "drinks", icon: "🥤", description: "Juices, cooldrinks, coffee, tea, energy drinks", displayOrder: 2 },
      { name: "Fresh Produce", slug: "fresh-produce", icon: "🥬", description: "Fruit, vegetables, organic produce", displayOrder: 3 },
      { name: "Spices & Sauces", slug: "spices", icon: "🌶️", description: "Spices, seasonings, chutneys, braai sauces", displayOrder: 4 },
      { name: "Baked Goods", slug: "baked-goods", icon: "🍞", description: "Bread, cakes, rusks, koeksisters, vetkoek", displayOrder: 5 },
      { name: "Meat & Braai", slug: "meat-braai", icon: "🥩", description: "Fresh meat, boerewors, braai packs, marinated meats", displayOrder: 6 },
      { name: "Dairy & Eggs", slug: "dairy-eggs", icon: "🥛", description: "Milk, cheese, yoghurt, butter, eggs", displayOrder: 7 },
      { name: "Pantry Essentials", slug: "pantry", icon: "🫙", description: "Rice, mealie meal, oil, sugar, canned goods", displayOrder: 8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // HOME, GARDEN & LIVING
  // ═══════════════════════════════════════════════════════════
  {
    name: "Home & Garden",
    slug: "home-garden",
    icon: "🏠",
    description: "Furniture, decor, kitchen, bedding and garden",
    displayOrder: 13,
    children: [
      { name: "Furniture", slug: "furniture", icon: "🪑", description: "Tables, chairs, shelves, beds, couches", displayOrder: 1 },
      { name: "Decor", slug: "decor", icon: "🖼️", description: "Wall art, candles, cushions, vases", displayOrder: 2 },
      { name: "Kitchen", slug: "kitchen", icon: "🍳", description: "Pots, pans, utensils, storage containers", displayOrder: 3 },
      { name: "Bedding & Linen", slug: "bedding", icon: "🛏️", description: "Sheets, duvets, pillows, blankets, towels", displayOrder: 4 },
      { name: "Bathroom", slug: "bathroom", icon: "🚿", description: "Shower accessories, toilet accessories, bathroom storage", displayOrder: 5 },
      { name: "Garden & Outdoor", slug: "garden-outdoor", icon: "🌱", description: "Plants, pots, garden tools, outdoor furniture, braais", displayOrder: 6 },
      { name: "Lighting", slug: "lighting", icon: "💡", description: "LED bulbs, lamps, fairy lights, solar lights", displayOrder: 7 },
      { name: "Cleaning Supplies", slug: "cleaning", icon: "🧹", description: "Detergent, bleach, mops, brooms, bins", displayOrder: 8 },
      { name: "Storage & Organisation", slug: "storage-org", icon: "📦", description: "Storage boxes, shelving, hooks, organisers", displayOrder: 9 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SPORTS, FITNESS & OUTDOORS
  // ═══════════════════════════════════════════════════════════
  {
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    icon: "⚽",
    description: "Sports equipment, gym gear, camping and outdoor",
    displayOrder: 14,
    children: [
      { name: "Gym & Fitness", slug: "gym-fitness", icon: "🏋️", description: "Dumbbells, resistance bands, yoga mats, weight plates", displayOrder: 1 },
      { name: "Soccer & Football", slug: "soccer", icon: "⚽", description: "Soccer balls, boots, jerseys, goalie gloves", displayOrder: 2 },
      { name: "Rugby & Cricket", slug: "rugby-cricket", icon: "🏉", description: "Rugby balls, cricket bats, pads, protective gear", displayOrder: 3 },
      { name: "Running & Athletics", slug: "running", icon: "🏃", description: "Running shoes, shorts, GPS watches, hydration", displayOrder: 4 },
      { name: "Camping & Hiking", slug: "camping", icon: "⛺", description: "Tents, sleeping bags, backpacks, camping stoves", displayOrder: 5 },
      { name: "Cycling", slug: "cycling", icon: "🚴", description: "Bicycles, helmets, lights, pumps, locks", displayOrder: 6 },
      { name: "Water Sports", slug: "water-sports", icon: "🏊", description: "Swim goggles, surfboards, wetsuits, inflatables", displayOrder: 7 },
      { name: "Sports Apparel", slug: "sports-apparel", icon: "👕", description: "Sports jerseys, compression wear, sports socks", displayOrder: 8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // AUTOMOTIVE
  // ═══════════════════════════════════════════════════════════
  {
    name: "Auto Parts & Accessories",
    slug: "auto-parts",
    icon: "🚗",
    description: "Car parts, accessories, tyres, and motoring essentials",
    displayOrder: 15,
    children: [
      { name: "Engine Parts", slug: "auto-engine", icon: "⚙️", description: "Filters, spark plugs, alternators, belts", displayOrder: 1 },
      { name: "Body Parts", slug: "auto-body", icon: "🚗", description: "Bumpers, fenders, mirrors, door panels", displayOrder: 2 },
      { name: "Electrical", slug: "auto-electrical", icon: "🔋", description: "Batteries, headlights, wiring, starters", displayOrder: 3 },
      { name: "Tyres & Wheels", slug: "tyres", icon: "🛞", description: "Tyres, rims, mags, wheel caps", displayOrder: 4 },
      { name: "Car Accessories", slug: "car-accessories", icon: "🚗", description: "Seat covers, phone holders, dash cams, air fresheners", displayOrder: 5 },
      { name: "Car Care", slug: "car-care", icon: "🧽", description: "Car wash, polish, wax, cleaning products", displayOrder: 6 },
      { name: "Motorcycle Parts", slug: "motorcycle-parts", icon: "🏍️", description: "Helmets, gloves, motorcycle parts, accessories", displayOrder: 7 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // TOOLS & HARDWARE
  // ═══════════════════════════════════════════════════════════
  {
    name: "Tools & Hardware",
    slug: "tools-hardware",
    icon: "🔧",
    description: "Power tools, hand tools, plumbing, electrical supplies",
    displayOrder: 16,
    children: [
      { name: "Power Tools", slug: "power-tools", icon: "🔌", description: "Drills, angle grinders, saws, sanders", displayOrder: 1 },
      { name: "Hand Tools", slug: "hand-tools", icon: "🔧", description: "Hammers, screwdrivers, wrenches, pliers, spanners", displayOrder: 2 },
      { name: "Plumbing", slug: "plumbing", icon: "🚰", description: "Pipes, fittings, taps, geysers, valves", displayOrder: 3 },
      { name: "Electrical Supplies", slug: "electrical-supplies", icon: "⚡", description: "Plugs, switches, wire, circuit breakers, conduit", displayOrder: 4 },
      { name: "Painting & Decorating", slug: "paint", icon: "🎨", description: "Paint, brushes, rollers, masking tape, primers", displayOrder: 5 },
      { name: "Building Materials", slug: "building-materials", icon: "🧱", description: "Cement, bricks, timber, roofing, insulation", displayOrder: 6 },
      { name: "Safety Equipment", slug: "safety-equipment", icon: "🦺", description: "Hard hats, safety glasses, gloves, reflective vests", displayOrder: 7 },
      { name: "Fasteners & Fixings", slug: "fasteners", icon: "🔩", description: "Screws, nails, bolts, nuts, anchors, hinges", displayOrder: 8 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // TOYS, BOOKS & STATIONERY
  // ═══════════════════════════════════════════════════════════
  {
    name: "Toys & Games",
    slug: "toys-games",
    icon: "🧸",
    description: "Toys, board games, puzzles, outdoor play",
    displayOrder: 17,
    children: [
      { name: "Action Figures & Dolls", slug: "action-figures", icon: "🧸", description: "Dolls, action figures, playsets, figurines", displayOrder: 1 },
      { name: "Building & Construction", slug: "building-toys", icon: "🧱", description: "Lego, blocks, magnetic tiles, model kits", displayOrder: 2 },
      { name: "Board Games & Puzzles", slug: "board-games", icon: "🎲", description: "Board games, card games, jigsaw puzzles", displayOrder: 3 },
      { name: "Outdoor Play", slug: "outdoor-play", icon: "🏃", description: "Trampolines, swings, water guns, balls", displayOrder: 4 },
      { name: "Remote Control", slug: "rc-toys", icon: "🚁", description: "RC cars, RC planes, RC boats, RC drones", displayOrder: 5 },
      { name: "Educational Toys", slug: "educational-toys", icon: "🧩", description: "Learning toys, science kits, STEM, flash cards", displayOrder: 6 },
    ],
  },
  {
    name: "Books & Stationery",
    slug: "books-stationery",
    icon: "📚",
    description: "Books, office supplies, art supplies, school stationery",
    displayOrder: 18,
    children: [
      { name: "Books", slug: "books", icon: "📖", description: "Fiction, non-fiction, textbooks, children's books", displayOrder: 1 },
      { name: "School Stationery", slug: "school-stationery", icon: "✏️", description: "Pens, pencils, rulers, notebooks, calculators", displayOrder: 2 },
      { name: "Office Supplies", slug: "office-supplies", icon: "📎", description: "Paper, files, staplers, ink, toner", displayOrder: 3 },
      { name: "Art & Craft Supplies", slug: "art-craft", icon: "🎨", description: "Paints, canvases, brushes, glue, craft paper", displayOrder: 4 },
      { name: "Packaging Materials", slug: "packaging", icon: "📦", description: "Boxes, tape, bubble wrap, courier bags, labels", displayOrder: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // PETS
  // ═══════════════════════════════════════════════════════════
  {
    name: "Pet Supplies",
    slug: "pets",
    icon: "🐾",
    description: "Food, accessories, grooming and health for pets",
    displayOrder: 19,
    children: [
      { name: "Dog Supplies", slug: "dogs", icon: "🐕", description: "Dog food, leashes, collars, beds, toys", displayOrder: 1 },
      { name: "Cat Supplies", slug: "cats", icon: "🐈", description: "Cat food, litter, scratching posts, toys", displayOrder: 2 },
      { name: "Bird Supplies", slug: "birds", icon: "🦜", description: "Bird food, cages, perches, toys", displayOrder: 3 },
      { name: "Fish & Aquarium", slug: "fish-aquarium", icon: "🐟", description: "Fish food, tanks, filters, decorations", displayOrder: 4 },
      { name: "Pet Grooming", slug: "pet-grooming", icon: "🛁", description: "Shampoo, brushes, nail clippers, flea treatment", displayOrder: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // AGRICULTURE & FARMING
  // ═══════════════════════════════════════════════════════════
  {
    name: "Agriculture & Farming",
    slug: "agriculture",
    icon: "🌾",
    description: "Seeds, fertilizers, livestock feed, farming equipment",
    displayOrder: 20,
    children: [
      { name: "Seeds & Plants", slug: "seeds-plants", icon: "🌱", description: "Vegetable seeds, herb seeds, seedlings, bulbs", displayOrder: 1 },
      { name: "Fertilizers & Soil", slug: "fertilizers", icon: "🪴", description: "Compost, fertilizer, potting soil, grow media", displayOrder: 2 },
      { name: "Animal Feed", slug: "animal-feed", icon: "🐄", description: "Cattle feed, chicken feed, horse feed, supplements", displayOrder: 3 },
      { name: "Farming Equipment", slug: "farming-equipment", icon: "🚜", description: "Irrigation, fencing, sprayers, hand tools", displayOrder: 4 },
      { name: "Poultry", slug: "poultry", icon: "🐔", description: "Chickens, eggs, incubators, coops, feeders", displayOrder: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // BABY & MATERNITY
  // ═══════════════════════════════════════════════════════════
  {
    name: "Baby & Maternity",
    slug: "baby-maternity",
    icon: "🍼",
    description: "Baby gear, feeding, diapering, maternity wear",
    displayOrder: 21,
    children: [
      { name: "Feeding & Nursing", slug: "baby-feeding", icon: "🍼", description: "Bottles, breast pumps, bibs, high chairs", displayOrder: 1 },
      { name: "Diapers & Wipes", slug: "diapers", icon: "🧷", description: "Disposable diapers, cloth diapers, wipes", displayOrder: 2 },
      { name: "Baby Gear", slug: "baby-gear", icon: "🚼", description: "Strollers, car seats, carriers, cots", displayOrder: 3 },
      { name: "Baby Bath & Care", slug: "baby-care", icon: "🧴", description: "Baby soap, lotion, cream, thermometers", displayOrder: 4 },
      { name: "Maternity Wear", slug: "maternity", icon: "🤰", description: "Maternity dresses, tops, belly bands, nursing bras", displayOrder: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // COLLECTIBLES & CRAFTS
  // ═══════════════════════════════════════════════════════════
  {
    name: "Crafts & Handmade",
    slug: "crafts-handmade",
    icon: "🧶",
    description: "Handmade goods, craft supplies, DIY materials",
    displayOrder: 22,
    children: [
      { name: "Sewing & Fabric", slug: "sewing-fabric", icon: "🧵", description: "Fabric, thread, patterns, sewing machines, buttons", displayOrder: 1 },
      { name: "Knitting & Crochet", slug: "knitting", icon: "🧶", description: "Yarn, needles, hooks, patterns", displayOrder: 2 },
      { name: "Beading & Jewelry Making", slug: "beading", icon: "📿", description: "Beads, wire, clasps, jewelry tools", displayOrder: 3 },
      { name: "Candle & Soap Making", slug: "candle-soap", icon: "🕯️", description: "Wax, moulds, fragrances, soap bases, essential oils", displayOrder: 4 },
      { name: "Handmade Goods", slug: "handmade", icon: "🎁", description: "Handmade gifts, custom items, artisan products", displayOrder: 5 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SOLAR & ENERGY
  // ═══════════════════════════════════════════════════════════
  {
    name: "Solar & Energy",
    slug: "solar-energy",
    icon: "☀️",
    description: "Solar panels, inverters, batteries, load shedding solutions",
    displayOrder: 23,
    children: [
      { name: "Solar Panels", slug: "solar-panels", icon: "☀️", description: "Monocrystalline, polycrystalline, flexible panels", displayOrder: 1 },
      { name: "Inverters", slug: "inverters", icon: "⚡", description: "Hybrid inverters, off-grid inverters, micro inverters", displayOrder: 2 },
      { name: "Batteries", slug: "solar-batteries", icon: "🔋", description: "Lithium, gel, lead-acid, battery banks", displayOrder: 3 },
      { name: "Solar Kits", slug: "solar-kits", icon: "📦", description: "Complete solar kits, loadshedding kits, camping solar", displayOrder: 4 },
      { name: "Generators", slug: "generators", icon: "🔌", description: "Petrol generators, diesel generators, silent generators", displayOrder: 5 },
      { name: "UPS & Power Stations", slug: "ups-power", icon: "🔋", description: "UPS systems, portable power stations, trolley systems", displayOrder: 6 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════
  {
    name: "Security & Surveillance",
    slug: "security",
    icon: "🔒",
    description: "CCTV, alarms, locks, access control",
    displayOrder: 24,
    children: [
      { name: "CCTV & Cameras", slug: "cctv", icon: "📹", description: "Security cameras, DVRs, NVRs, IP cameras", displayOrder: 1 },
      { name: "Alarms & Sensors", slug: "alarms", icon: "🚨", description: "Alarm systems, motion sensors, sirens", displayOrder: 2 },
      { name: "Locks & Access Control", slug: "locks", icon: "🔐", description: "Padlocks, gate locks, biometric locks, intercoms", displayOrder: 3 },
      { name: "Electric Fencing", slug: "electric-fencing", icon: "⚡", description: "Energizers, fencing wire, insulators", displayOrder: 4 },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // OTHER / GENERAL
  // ═══════════════════════════════════════════════════════════
  {
    name: "Other",
    slug: "other",
    icon: "📦",
    description: "Products that don't fit other categories",
    displayOrder: 99,
    children: [
      { name: "Gift Cards & Vouchers", slug: "gift-cards", icon: "🎁", description: "Store vouchers, gift cards, airtime", displayOrder: 1 },
      { name: "Custom & Personalised", slug: "custom", icon: "✨", description: "Custom printing, engraving, personalised items", displayOrder: 2 },
      { name: "Services", slug: "services", icon: "🛠️", description: "Installation, repair, delivery services", displayOrder: 3 },
      { name: "Miscellaneous", slug: "miscellaneous", icon: "📦", description: "Anything that doesn't fit elsewhere", displayOrder: 4 },
    ],
  },
];

// ── Seed function ──────────────────────────────────────────

async function seedGlobalCategories() {
  console.log("🌱 Seeding global categories...\n");

  let topCount = 0;
  let subCount = 0;

  for (const cat of CATEGORIES) {
    // Upsert top-level category
    const parent = await prisma.globalCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
        parentId: null,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        displayOrder: cat.displayOrder,
        isActive: true,
      },
    });
    topCount++;
    console.log(`  ✅ ${cat.icon} ${cat.name} (${cat.slug})`);

    // Upsert subcategories
    if (cat.children) {
      for (const child of cat.children) {
        await prisma.globalCategory.upsert({
          where: { slug: child.slug },
          update: {
            name: child.name,
            icon: child.icon,
            description: child.description,
            displayOrder: child.displayOrder,
            isActive: true,
            parentId: parent.id,
          },
          create: {
            name: child.name,
            slug: child.slug,
            icon: child.icon,
            description: child.description,
            displayOrder: child.displayOrder,
            isActive: true,
            parentId: parent.id,
          },
        });
        subCount++;
        console.log(`     └─ ${child.icon} ${child.name}`);
      }
    }
  }

  console.log(`\n🎉 Done! ${topCount} top-level + ${subCount} sub-categories seeded.`);
}

// ── Run ────────────────────────────────────────────────────

seedGlobalCategories()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
