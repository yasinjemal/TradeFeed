import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const shops = await db.shop.findMany({
    include: { _count: { select: { products: true } } },
  });

  console.log("=== SHOPS ===");
  if (shops.length === 0) {
    console.log("(none — create one at http://localhost:3005)");
  }
  for (const s of shops) {
    console.log(
      `  ${s.name} | slug: ${s.slug} | WA: ${s.whatsappNumber} | products: ${s._count.products}`
    );
  }

  const products = await db.product.findMany({
    include: { variants: true, category: true },
  });

  console.log("\n=== PRODUCTS ===");
  if (products.length === 0) {
    console.log("(none)");
  }
  for (const p of products) {
    console.log(
      `  ${p.name} | cat: ${p.category?.name ?? "—"} | variants: ${p.variants.length} | active: ${p.isActive}`
    );
    for (const v of p.variants) {
      console.log(
        `    └─ ${v.size} / ${v.color ?? "—"} | R${(v.priceInCents / 100).toFixed(2)} | stock: ${v.stock}`
      );
    }
  }
}

main()
  .then(() => db.$disconnect())
  .catch((e) => {
    console.error(e);
    db.$disconnect();
  });
