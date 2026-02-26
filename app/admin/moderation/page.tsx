// ============================================================
// Page — Admin Product Moderation (/admin/moderation)
// ============================================================
// Review and moderate products across all shops.
// Flag products for policy violations.
// ============================================================

import { getModerationProducts } from "@/lib/db/admin-moderation";
import { AdminModerationList } from "@/components/admin/admin-moderation-list";

interface AdminModerationPageProps {
  searchParams: Promise<{ search?: string; page?: string; filter?: string }>;
}

export default async function AdminModerationPage({ searchParams }: AdminModerationPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);
  const filter = (params.filter || "all") as "all" | "flagged" | "active" | "inactive";

  const productData = await getModerationProducts({ search, page, filter });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Product Moderation</h1>
        <p className="text-stone-500 text-sm mt-1">
          Review products across all shops. Flag policy violations to deactivate listings.
        </p>
      </div>

      <AdminModerationList
        products={productData.products}
        total={productData.total}
        page={productData.page}
        totalPages={productData.totalPages}
        currentSearch={search}
        currentFilter={filter}
      />
    </div>
  );
}
