// ============================================================
// Bulk Import — Upload Page (Server Component)
// ============================================================
// Lets sellers upload a CSV file to import products in bulk.
// Shows template download, drag-drop upload, validation preview.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { BulkImportForm } from "@/components/bulk-import/bulk-import-form";
import Link from "next/link";

interface ImportPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BulkImportPage({ params }: ImportPageProps) {
  const { slug } = await params;

  const access = await requireShopAccess(slug);
  if (!access) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Bulk Import Products</h1>
          <p className="text-sm text-stone-500 mt-1">
            Upload a CSV file to import products and variants at once
          </p>
        </div>
        <Link
          href={`/dashboard/${slug}/products`}
          className="inline-flex items-center gap-2 rounded-lg bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200 transition"
        >
          ← Back to Products
        </Link>
      </div>

      <BulkImportForm shopSlug={slug} />
    </div>
  );
}
