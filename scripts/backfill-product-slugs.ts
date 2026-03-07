// ============================================================
// Backfill Product Slugs
// ============================================================
// One-off script to generate slugs for all existing products
// that don't have one yet. Safe to run multiple times.
//
// Usage: npx tsx scripts/backfill-product-slugs.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function main() {
  const products = await db.product.findMany({
    where: { slug: null },
    select: { id: true, name: true, shopId: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${products.length} products without slugs`);

  let updated = 0;
  let errors = 0;

  for (const product of products) {
    const base = slugify(product.name) || `product-${product.id.slice(-8)}`;
    let candidate = base;
    let attempt = 1;

    // Find unique slug within this shop
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.product.findFirst({
        where: {
          shopId: product.shopId,
          slug: candidate,
          id: { not: product.id },
        },
        select: { id: true },
      });

      if (!existing) break;
      attempt++;
      candidate = `${base}-${attempt}`;
    }

    try {
      await db.product.update({
        where: { id: product.id },
        data: { slug: candidate },
      });
      updated++;
      if (updated % 50 === 0) {
        console.log(`  Progress: ${updated}/${products.length}`);
      }
    } catch (err) {
      console.error(`  Error updating ${product.id}: ${err}`);
      errors++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
