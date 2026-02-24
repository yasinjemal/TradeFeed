// ============================================================
// Page — Admin Categories (/admin/categories)
// ============================================================
// M7.1 — Global category CRUD with tree view.
// ============================================================

import { getAdminCategories } from "@/lib/db/admin";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Global Categories</h1>
        <p className="text-stone-500 text-sm mt-1">
          Manage marketplace categories. Products are mapped to these for discovery.
        </p>
      </div>

      <AdminCategoryManager categories={categories} />
    </div>
  );
}
