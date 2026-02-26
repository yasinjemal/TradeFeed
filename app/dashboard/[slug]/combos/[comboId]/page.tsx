// ============================================================
// Page — Edit Combo (/dashboard/[slug]/combos/[comboId])
// ============================================================

import { ComboForm } from "@/components/combo/combo-form";
import { getCombo, getComboCategories } from "@/lib/db/combos";
import { getProducts } from "@/lib/db/products";
import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { DeleteComboButton } from "@/components/combo/delete-combo-button";

interface EditComboPageProps {
  params: Promise<{ slug: string; comboId: string }>;
}

export default async function EditComboPage({ params }: EditComboPageProps) {
  const { slug, comboId } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    redirect("/sign-in");
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const [combo, comboCategories, products] = await Promise.all([
    getCombo(comboId, shop.id),
    getComboCategories(shop.id),
    getProducts(shop.id),
  ]);

  if (!combo) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/${slug}/combos`}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Combos
        </Link>
        <DeleteComboButton shopSlug={slug} comboId={comboId} />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit Combo</h1>
        <p className="text-sm text-stone-500 mt-1">{combo.name}</p>
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
        combo={{
          id: combo.id,
          name: combo.name,
          description: combo.description,
          priceCents: combo.priceCents,
          retailPriceCents: combo.retailPriceCents,
          stock: combo.stock,
          isActive: combo.isActive,
          comboCategoryId: combo.comboCategoryId,
          comboCategory: combo.comboCategory,
          items: combo.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            variantId: i.variantId,
            productName: i.productName,
            variantLabel: i.variantLabel,
            quantity: i.quantity,
          })),
          images: combo.images.map((img) => ({
            id: img.id,
            url: img.url,
            key: img.key,
            position: img.position,
          })),
        }}
      />
    </div>
  );
}
