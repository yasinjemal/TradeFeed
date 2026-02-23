// ============================================================
// Script — Seed demo products for visual testing
// ============================================================
// Creates sample clothing products with variants for the
// first shop so we can test the full buyer flow.
// Run: npx tsx scripts/seed-products.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Get first shop
  const shop = await db.shop.findFirst();
  if (!shop) {
    console.error("No shops found. Create one first at http://localhost:3005");
    return;
  }

  console.log(`Seeding products for: ${shop.name} (${shop.slug})\n`);

  // ── Product 1: T-Shirt ─────────────────────────────────
  const tshirt = await db.product.create({
    data: {
      name: "Premium Cotton T-Shirt",
      description:
        "Heavyweight 200gsm cotton tee. Pre-shrunk, double-stitched hems. Perfect for everyday wear or bulk resale.",
      isActive: true,
      shopId: shop.id,
      variants: {
        create: [
          { size: "S", color: "Black", priceInCents: 8500, stock: 25 },
          { size: "M", color: "Black", priceInCents: 8500, stock: 40 },
          { size: "L", color: "Black", priceInCents: 8500, stock: 35 },
          { size: "XL", color: "Black", priceInCents: 9000, stock: 20 },
          { size: "S", color: "White", priceInCents: 8500, stock: 30 },
          { size: "M", color: "White", priceInCents: 8500, stock: 50 },
          { size: "L", color: "White", priceInCents: 8500, stock: 30 },
          { size: "XL", color: "White", priceInCents: 9000, stock: 15 },
          { size: "M", color: "Navy", priceInCents: 9000, stock: 20 },
          { size: "L", color: "Navy", priceInCents: 9000, stock: 25 },
        ],
      },
    },
  });
  console.log(`  ✓ ${tshirt.name} (10 variants)`);

  // ── Product 2: Hoodie ──────────────────────────────────
  const hoodie = await db.product.create({
    data: {
      name: "Fleece-Lined Hoodie",
      description:
        "Warm 300gsm fleece-lined pullover hoodie. Kangaroo pocket, ribbed cuffs. Best seller for winter.",
      isActive: true,
      shopId: shop.id,
      variants: {
        create: [
          { size: "S", color: "Charcoal", priceInCents: 22000, stock: 15 },
          { size: "M", color: "Charcoal", priceInCents: 22000, stock: 30 },
          { size: "L", color: "Charcoal", priceInCents: 22000, stock: 25 },
          { size: "XL", color: "Charcoal", priceInCents: 23500, stock: 10 },
          { size: "M", color: "Burgundy", priceInCents: 22000, stock: 20 },
          { size: "L", color: "Burgundy", priceInCents: 22000, stock: 15 },
          { size: "XL", color: "Burgundy", priceInCents: 23500, stock: 8 },
        ],
      },
    },
  });
  console.log(`  ✓ ${hoodie.name} (7 variants)`);

  // ── Product 3: Cargo Pants ─────────────────────────────
  const cargo = await db.product.create({
    data: {
      name: "Relaxed Fit Cargo Pants",
      description:
        "Durable twill cargo pants with 6 pockets. Relaxed fit, elastic waistband. Streetwear staple.",
      isActive: true,
      shopId: shop.id,
      variants: {
        create: [
          { size: "30", color: "Khaki", priceInCents: 18000, stock: 20 },
          { size: "32", color: "Khaki", priceInCents: 18000, stock: 35 },
          { size: "34", color: "Khaki", priceInCents: 18000, stock: 30 },
          { size: "36", color: "Khaki", priceInCents: 19500, stock: 15 },
          { size: "30", color: "Black", priceInCents: 18000, stock: 25 },
          { size: "32", color: "Black", priceInCents: 18000, stock: 40 },
          { size: "34", color: "Black", priceInCents: 18000, stock: 30 },
          { size: "36", color: "Black", priceInCents: 19500, stock: 12 },
          { size: "32", color: "Olive", priceInCents: 18000, stock: 20 },
          { size: "34", color: "Olive", priceInCents: 18000, stock: 18 },
        ],
      },
    },
  });
  console.log(`  ✓ ${cargo.name} (10 variants)`);

  // ── Product 4: Cap ─────────────────────────────────────
  const cap = await db.product.create({
    data: {
      name: "Structured Snapback Cap",
      description:
        "6-panel structured cap with flat brim. Adjustable snapback closure. Blank — perfect for embroidery.",
      isActive: true,
      shopId: shop.id,
      variants: {
        create: [
          { size: "One Size", color: "Black", priceInCents: 4500, stock: 100 },
          { size: "One Size", color: "White", priceInCents: 4500, stock: 80 },
          { size: "One Size", color: "Navy", priceInCents: 4500, stock: 60 },
          { size: "One Size", color: "Red", priceInCents: 4500, stock: 45 },
          { size: "One Size", color: "Grey", priceInCents: 4500, stock: 50 },
        ],
      },
    },
  });
  console.log(`  ✓ ${cap.name} (5 variants)`);

  // ── Product 5: Tracksuit Set ───────────────────────────
  const tracksuit = await db.product.create({
    data: {
      name: "Two-Piece Tracksuit Set",
      description:
        "Matching zip-up jacket and jogger pants. Polyester blend, breathable. Popular for gym and casual wear.",
      isActive: true,
      shopId: shop.id,
      variants: {
        create: [
          { size: "S", color: "Black", priceInCents: 32000, stock: 12 },
          { size: "M", color: "Black", priceInCents: 32000, stock: 25 },
          { size: "L", color: "Black", priceInCents: 32000, stock: 20 },
          { size: "XL", color: "Black", priceInCents: 34500, stock: 10 },
          { size: "M", color: "Grey", priceInCents: 32000, stock: 18 },
          { size: "L", color: "Grey", priceInCents: 32000, stock: 15 },
        ],
      },
    },
  });
  console.log(`  ✓ ${tracksuit.name} (6 variants)`);

  // ── Product 6: Sold Out Example ────────────────────────
  const soldOut = await db.product.create({
    data: {
      name: "Limited Edition Bomber Jacket",
      description:
        "Satin bomber jacket, quilted lining. This drop sold out in 2 hours. Restock coming soon.",
      isActive: true,
      shopId: shop.id,
      variants: {
        create: [
          { size: "M", color: "Black", priceInCents: 45000, stock: 0 },
          { size: "L", color: "Black", priceInCents: 45000, stock: 0 },
          { size: "XL", color: "Black", priceInCents: 48000, stock: 0 },
        ],
      },
    },
  });
  console.log(`  ✓ ${soldOut.name} (3 variants, SOLD OUT)`);

  console.log(`\nDone! 6 products seeded.`);
  console.log(`View catalog: http://localhost:3005/catalog/${shop.slug}`);
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
  });
