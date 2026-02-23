// ============================================================
// Page — Create New Product (v2)
// ============================================================

import { CreateProductForm } from "@/components/product/create-product-form";
import Link from "next/link";

interface NewProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewProductPage({ params }: NewProductPageProps) {
  const { slug } = await params;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/${slug}/products`}
        className="text-sm text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">
          ←
        </span>{" "}
        Products
      </Link>

      <CreateProductForm shopSlug={slug} />
    </div>
  );
}
