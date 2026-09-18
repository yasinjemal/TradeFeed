import { db } from "@/lib/db";

// Count published listings, not variants. Hidden and flagged products never
// qualify a shop, and the same predicate supplies its preview images.
const publishedProduct = { isActive: true, isFlagged: false } as const;

export async function getDiscoverableShops() {
  const counts = await db.product.groupBy({
    by: ["shopId"],
    where: { ...publishedProduct, shop: { isActive: true } },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
  });
  if (!counts.length) return [];
  const countByShop = new Map(counts.map(row => [row.shopId, row._count.id]));
  const shops = await db.shop.findMany({
    where: { id: { in: counts.map(row => row.shopId) }, isActive: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true, slug: true, name: true, logoUrl: true, city: true,
      province: true, isVerified: true,
      products: {
        where: { ...publishedProduct, images: { some: {} } },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        take: 3,
        select: {
          id: true, name: true,
          images: { orderBy: [{ position: "asc" }, { id: "asc" }], take: 1, select: { url: true } },
        },
      },
    },
  });
  return shops.map(({ products, ...shop }) => ({
    ...shop,
    productCount: countByShop.get(shop.id)!,
    previews: products.flatMap(product => product.images[0] ? [{ id: product.id, name: product.name, imageUrl: product.images[0].url }] : []),
  }));
}

export type DiscoverableShop = Awaited<ReturnType<typeof getDiscoverableShops>>[number];
