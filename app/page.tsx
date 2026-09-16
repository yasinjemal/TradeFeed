import type { Metadata } from "next";
import { Storefront } from "@/components/storefront/storefront";
import {
  getMarketplaceProducts,
  getGlobalCategories,
  getFeaturedShops,
} from "@/lib/db/marketplace";
export const revalidate = 300;
export const metadata: Metadata = {
  title: { absolute: "TradeFeed | Discover South African shops" },
  description:
    "Find products from independent South African businesses. Explore shops, compare products and arrange your order directly with the seller.",
  alternates: { canonical: "/" },
};
export default async function Home() {
  const [result, categories, shops] = await Promise.all([
    getMarketplaceProducts({ pageSize: 24 }),
    getGlobalCategories(),
    getFeaturedShops(4),
  ]);
  return (
    <Storefront
      products={result.products}
      categories={categories}
      shops={shops}
    />
  );
}
