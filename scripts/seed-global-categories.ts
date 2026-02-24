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
    name: "Kids",
    slug: "kids",
    icon: "👶",
    description: "Clothing for children and babies",
    displayOrder: 4,
    children: [
      { name: "Boys", slug: "kids-boys", icon: "👦", description: "T-shirts, pants, jackets for boys", displayOrder: 1 },
      { name: "Girls", slug: "kids-girls", icon: "👧", description: "Dresses, tops, skirts for girls", displayOrder: 2 },
      { name: "Baby", slug: "kids-baby", icon: "👶", description: "Onesies, rompers, baby sets", displayOrder: 3 },
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

  // ── NEW INDUSTRIES ───────────────────────────────────────

  {
    name: "Electronics",
    slug: "electronics",
    icon: "📱",
    description: "Phones, laptops, audio equipment and accessories",
    displayOrder: 8,
    children: [
      { name: "Phones", slug: "phones", icon: "📱", description: "Smartphones, feature phones, refurbished phones", displayOrder: 1 },
      { name: "Laptops & Computers", slug: "laptops", icon: "💻", description: "Laptops, desktops, monitors", displayOrder: 2 },
      { name: "Accessories", slug: "electronics-accessories", icon: "🔌", description: "Chargers, cables, cases, power banks", displayOrder: 3 },
      { name: "Audio", slug: "audio", icon: "🎧", description: "Earphones, headphones, speakers, soundbars", displayOrder: 4 },
      { name: "Tablets", slug: "tablets", icon: "📲", description: "iPads, Android tablets, e-readers", displayOrder: 5 },
    ],
  },
  {
    name: "Beauty & Health",
    slug: "beauty-health",
    icon: "💄",
    description: "Skincare, haircare, makeup and fragrances",
    displayOrder: 9,
    children: [
      { name: "Skincare", slug: "skincare", icon: "🧴", description: "Moisturizers, serums, sunscreen, cleansers", displayOrder: 1 },
      { name: "Haircare", slug: "haircare", icon: "💇", description: "Shampoo, conditioner, treatments, wigs, weaves", displayOrder: 2 },
      { name: "Makeup", slug: "makeup", icon: "💄", description: "Foundation, lipstick, mascara, eyeshadow", displayOrder: 3 },
      { name: "Fragrances", slug: "fragrances", icon: "🌸", description: "Perfumes, colognes, body sprays", displayOrder: 4 },
    ],
  },
  {
    name: "Food & Beverages",
    slug: "food-beverages",
    icon: "🍽️",
    description: "Snacks, drinks, fresh produce and spices",
    displayOrder: 10,
    children: [
      { name: "Snacks", slug: "snacks", icon: "🍿", description: "Biltong, droëwors, chips, nuts, dried fruit", displayOrder: 1 },
      { name: "Drinks", slug: "drinks", icon: "🥤", description: "Juices, cooldrinks, coffee, tea, energy drinks", displayOrder: 2 },
      { name: "Fresh Produce", slug: "fresh-produce", icon: "🥬", description: "Fruit, vegetables, organic produce", displayOrder: 3 },
      { name: "Spices & Sauces", slug: "spices", icon: "🌶️", description: "Spices, seasonings, chutneys, braai sauces", displayOrder: 4 },
    ],
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    icon: "🏠",
    description: "Furniture, decor, kitchen and garden tools",
    displayOrder: 11,
    children: [
      { name: "Furniture", slug: "furniture", icon: "🪑", description: "Tables, chairs, shelves, beds, couches", displayOrder: 1 },
      { name: "Decor", slug: "decor", icon: "🖼️", description: "Wall art, candles, cushions, vases", displayOrder: 2 },
      { name: "Kitchen", slug: "kitchen", icon: "🍳", description: "Pots, pans, utensils, storage containers", displayOrder: 3 },
      { name: "Tools", slug: "tools", icon: "🔧", description: "Power tools, hand tools, garden equipment", displayOrder: 4 },
    ],
  },
  {
    name: "Auto Parts",
    slug: "auto-parts",
    icon: "🚗",
    description: "Engine parts, body panels, electrical and tyres",
    displayOrder: 12,
    children: [
      { name: "Engine Parts", slug: "auto-engine", icon: "⚙️", description: "Filters, spark plugs, alternators, belts", displayOrder: 1 },
      { name: "Body Parts", slug: "auto-body", icon: "🚗", description: "Bumpers, fenders, mirrors, door panels", displayOrder: 2 },
      { name: "Electrical", slug: "auto-electrical", icon: "🔋", description: "Batteries, headlights, wiring, starters", displayOrder: 3 },
      { name: "Tyres & Wheels", slug: "tyres", icon: "🛞", description: "Tyres, rims, mags, wheel caps", displayOrder: 4 },
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
