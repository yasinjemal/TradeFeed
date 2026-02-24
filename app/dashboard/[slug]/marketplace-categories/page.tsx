// ============================================================
// Page — Marketplace Categories (/dashboard/[slug]/marketplace-categories)
// ============================================================
// Bulk mapping tool for assigning products to platform-wide
// global categories. Makes products discoverable on marketplace.
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import {
  getGlobalCategoryTree,
  getAllProductsForMapping,
} from "@/lib/db/global-categories";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BulkCategoryMapper } from "@/components/product/bulk-category-mapper";

interface MarketplaceCategoriesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MarketplaceCategoriesPage({
  params,
}: MarketplaceCategoriesPageProps) {
  const { slug } = await params;

  // Auth
  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const [globalCategories, products] = await Promise.all([
    getGlobalCategoryTree(),
    getAllProductsForMapping(shop.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Marketplace Categories
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Assign your products to marketplace categories so buyers can discover
          them on the{" "}
          <Link
            href="/marketplace"
            target="_blank"
            className="text-emerald-600 hover:text-emerald-700 underline"
          >
            TradeFeed Marketplace
          </Link>
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏪</span>
          <div>
            <h3 className="text-sm font-semibold text-emerald-800">
              Get discovered by more buyers
            </h3>
            <p className="text-sm text-emerald-700 mt-1">
              Products with marketplace categories appear in search results,
              category pages, and the main marketplace feed. Unmapped products
              are only visible on your direct catalog link.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Mapper */}
      <BulkCategoryMapper
        shopSlug={slug}
        products={products}
        globalCategories={globalCategories}
      />
    </div>
  );
}
