import { db } from "../lib/db";
async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  if (
    !["localhost", "127.0.0.1"].includes(url.hostname) ||
    !/test|quality/.test(url.pathname)
  )
    throw new Error("Fixtures require a local test database");
  const shop = await db.shop.upsert({
    where: { slug: "quality-fixture" },
    update: {},
    create: {
      name: "Quality Test Shop",
      slug: "quality-fixture",
      whatsappNumber: "27820000000",
      description: "A local test shop for buyer journey verification.",
      city: "Johannesburg",
      province: "Gauteng",
      returnPolicy: "Contact the seller for return assistance.",
      isVerified: true,
      isFeaturedShop: true,
    },
  });
  const category = await db.globalCategory.upsert({
    where: { slug: "quality-footwear" },
    update: {},
    create: { name: "Footwear", slug: "quality-footwear" },
  });
  await db.product.upsert({
    where: { id: "quality-fixture-sneakers" },
    update: {},
    create: {
      id: "quality-fixture-sneakers",
      shopId: shop.id,
      globalCategoryId: category.id,
      name: "Everyday Sneakers",
      slug: "everyday-sneakers",
      description:
        "Comfortable everyday sneakers. Choose your size and confirm delivery with the shop.",
      minPriceCents: 45000,
      maxPriceCents: 45000,
      images: { create: { url: "/landing/demo-sneakers.webp" } },
      variants: { create: { size: "M", priceInCents: 45000, stock: 30 } },
    },
  });
  const clothing = await db.globalCategory.upsert({
    where: {slug: "quality-clothing"}, update: {},
    create: {name: "Clothing", slug: "quality-clothing"},
  });
  for (const [id, name, prices] of [
    ["unconfirmed-polo", "Striped Polo S-XXL", [19900]],
    ["variable-polo", "Cotton Polo", [65000, 70000]],
  ] as const) {
    await db.product.upsert({
      where: {id: `quality-${id}`}, update: {},
      create: {
        id: `quality-${id}`, shopId: shop.id, globalCategoryId: clothing.id,
        slug: id, name, description: "Cotton clothing for everyday wear. Pairs well with sneakers. Ask about delivery.",
        minPriceCents: prices[0], maxPriceCents: prices[prices.length - 1],
        images: {create: {url: "/landing/demo-sneakers.webp"}},
        variants: {create: prices.map((price, index) => ({
          size: prices.length === 1 ? "Default" : index === 0 ? "M" : "L",
          priceInCents: 60000, retailPriceCents: price, stock: 20,
        }))},
      },
    });
  }
  console.log(
    "Local fixture ready: /catalog/quality-fixture/products/everyday-sneakers",
  );
}
main().finally(() => db.$disconnect());
