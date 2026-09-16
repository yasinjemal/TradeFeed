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
  console.log(
    "Local fixture ready: /catalog/quality-fixture/products/everyday-sneakers",
  );
}
main().finally(() => db.$disconnect());
