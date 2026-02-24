// ============================================================
// Page — Categories (/dashboard/[slug]/categories)
// ============================================================
// Manage product categories — add, rename, delete.
// Categories help buyers filter products in the catalog.
// ============================================================

import { getCategories } from "@/lib/db/categories";
import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { CategoryManager } from "@/components/category/category-manager";

interface CategoriesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { slug } = await params;

  // Auth
  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const categories = await getCategories(shop.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-stone-500 text-sm mt-1">
          Organize your products — buyers can filter by category in your catalog
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
          <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">
            Total
          </p>
          <p className="text-2xl font-bold mt-1 text-emerald-700">
            {categories.length}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
          <p className="text-[11px] uppercase tracking-wider text-blue-600 font-semibold">
            With Products
          </p>
          <p className="text-2xl font-bold mt-1 text-blue-700">
            {categories.filter((c) => c._count.products > 0).length}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
            Empty
          </p>
          <p className="text-2xl font-bold mt-1 text-stone-700">
            {categories.filter((c) => c._count.products === 0).length}
          </p>
        </div>
      </div>

      {/* Manager */}
      <CategoryManager
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          _count: { products: c._count.products },
        }))}
        shopSlug={slug}
      />
    </div>
  );
}
