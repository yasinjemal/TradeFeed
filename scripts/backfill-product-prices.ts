// ============================================================
// Script — Backfill Product Price Range
// ============================================================
// One-time script to populate minPriceCents/maxPriceCents
// on all existing products from their active variants.
//
// Run: npx tsx scripts/backfill-product-prices.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🔄 Backfilling product price ranges...\n");

  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      variants: {
        where: { isActive: true },
        select: { priceInCents: true },
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const prices = product.variants.map((v) => v.priceInCents);
    const minPriceCents = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPriceCents = prices.length > 0 ? Math.max(...prices) : 0;

    await db.product.update({
      where: { id: product.id },
      data: { minPriceCents, maxPriceCents },
    });

    if (prices.length > 0) {
      updated++;
      console.log(`  ✅ ${product.name}: R${(minPriceCents / 100).toFixed(2)} – R${(maxPriceCents / 100).toFixed(2)}`);
    } else {
      skipped++;
      console.log(`  ⚠ ${product.name}: no active variants (set to 0)`);
    }
  }

  console.log(`\n✅ Done! ${updated} products updated, ${skipped} had no variants.`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
