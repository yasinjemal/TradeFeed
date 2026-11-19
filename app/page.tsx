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

async function loadHomeData() {
  const [result, categories, shops] = await Promise.all([
    getMarketplaceProducts({ pageSize: 24 }),
    getGlobalCategories(),
    getDiscoverableShops(),
  ]);
  return { products: result.products, categories, shops };
}

// Every route currently renders per request (the root layout reads request
// headers for the CSP nonce), so `revalidate` above does not stop these three
// queries running on each visit and each link prefetch. Cache the data itself
// for the same five minutes. All three are read-only.
//
// Production only: in development the page reads live data, so a row added
// straight to the database shows up at once. The Playwright suite relies on
// that (it runs against `npm run dev` and e2e/shop-gallery.spec.ts inserts
// shops, then expects them on "/").
const getHomeData =
  process.env.NODE_ENV === "production"
    ? unstable_cache(loadHomeData, ["home-storefront-data"], { revalidate: 300 })
    : loadHomeData;

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
