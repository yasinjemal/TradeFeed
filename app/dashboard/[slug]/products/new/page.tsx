// ============================================================
// Page — Create New Product
// ============================================================
// ROUTE: /dashboard/[slug]/products/new
// ============================================================

import { CreateProductForm } from "@/components/product/create-product-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NewProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/${slug}/products`}>← Back to Products</Link>
      </Button>

      <CreateProductForm shopSlug={slug} />
    </div>
  );
}
