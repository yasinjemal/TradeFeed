import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Storefront } from "@/components/storefront/storefront";
import {
  getMarketplaceProducts,
  getGlobalCategories,
} from "@/lib/db/marketplace";
import { getDiscoverableShops } from "@/lib/db/discover-shops";
export const revalidate = 300;
export const metadata: Metadata = {
  title: { absolute: "TradeFeed | Discover South African shops" },
  description:
    "Find products from independent South African businesses. Explore shops, compare products and arrange your order directly with the seller.",
  alternates: { canonical: "/" },
};

// Every route currently renders per request (the root layout reads request
// headers for the CSP nonce), so `revalidate` above does not stop these three
// queries running on each visit and each link prefetch. Cache the data itself
// for the same five minutes. All three are read-only.
const getHomeData = unstable_cache(
  async () => {
    const [result, categories, shops] = await Promise.all([
      getMarketplaceProducts({ pageSize: 24 }),
      getGlobalCategories(),
      getDiscoverableShops(),
    ]);
    return { products: result.products, categories, shops };
  },
  ["home-storefront-data"],
  { revalidate: 300 },
);

export default async function Home() {
  const { products, categories, shops } = await getHomeData();
  return (
    <Storefront
      // The cache stores JSON, so a cached product's createdAt arrives as a
      // string. Restore the Date the MarketplaceProduct type promises.
      products={products.map((p) => ({ ...p, createdAt: new Date(p.createdAt) }))}
      categories={categories}
      shops={shops}
    />
  );
}
