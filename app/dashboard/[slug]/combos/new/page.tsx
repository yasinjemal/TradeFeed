// ============================================================
// Page — Create New Combo (/dashboard/[slug]/combos/new)
// ============================================================

import { ComboForm } from "@/components/combo/combo-form";
import { getComboCategories } from "@/lib/db/combos";
import { getProducts } from "@/lib/db/products";
import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface NewComboPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewComboPage({ params }: NewComboPageProps) {
  const { slug } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const [comboCategories, products] = await Promise.all([
    getComboCategories(shop.id),
    getProducts(shop.id),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/${slug}/combos`}
        className="text-sm text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Combos
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Combo Deal</h1>
        <p className="text-sm text-stone-500 mt-1">
          Bundle products together at a special price
        </p>
      </div>

      <ComboForm
        shopSlug={slug}
        categories={comboCategories.map((c) => ({ id: c.id, name: c.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          variants: p.variants.map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            priceInCents: v.priceInCents,
            stock: v.stock,
          })),
          images: p.images.map((img) => ({ url: img.url })),
        }))}
      />
    </div>
  );
}
