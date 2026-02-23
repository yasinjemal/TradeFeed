// ============================================================
// Page — Product Detail (/dashboard/[slug]/products/[productId])
// ============================================================
// The powerhouse product management page. Features:
// - Image gallery with drag & drop upload
// - Smart variant creator (click-to-select sizes/colors)
// - Variant card grid with visual stock indicators
// - Collapsible manual add + danger zone
// ============================================================

import { getProduct } from "@/lib/db/products";
import { getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { formatZAR } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/product/image-upload";
import { SmartVariantCreator } from "@/components/product/smart-variant-creator";
import { VariantGrid } from "@/components/product/variant-grid";
import { AddVariantForm } from "@/components/product/add-variant-form";
import { DeleteProductButton } from "@/components/product/delete-product-button";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug, productId } = await params;

  // ── Auth + Access ────────────────────────────────────────
  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  // ── Fetch product ────────────────────────────────────────
  const product = await getProduct(productId, shop.id);
  if (!product) return notFound();

  // ── Computed stats ───────────────────────────────────────
  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const priceRange =
    minPrice !== null && maxPrice !== null
      ? minPrice === maxPrice
        ? formatZAR(minPrice)
        : `${formatZAR(minPrice)} – ${formatZAR(maxPrice)}`
      : "—";

  return (
    <div className="space-y-8">
      {/* ── Header Bar ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/${slug}/products`}
            className="text-sm text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>{" "}
            Products
          </Link>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">
            {product.name}
          </h1>
          {product.description && (
            <p className="text-stone-500 mt-0.5 text-sm">
              {product.description}
            </p>
          )}
        </div>
        <Badge
          variant={product.isActive ? "default" : "secondary"}
          className={
            product.isActive
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              : ""
          }
        >
          {product.isActive ? "● Active" : "Draft"}
        </Badge>
      </div>

      {/* ── Two Column: Images + Stats ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left: Image Gallery + Upload (3 cols) */}
        <div className="lg:col-span-3">
          <ImageUpload
            images={product.images.map((img) => ({
              id: img.id,
              url: img.url,
              altText: img.altText,
              position: img.position,
            }))}
            shopSlug={slug}
            productId={product.id}
          />
        </div>

        {/* Right: Stats + Info (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-stone-50 p-4 border border-stone-100">
              <p className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                Variants
              </p>
              <p className="text-2xl font-bold mt-1 text-stone-900">
                {product.variants.length}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
              <p className="text-[11px] uppercase tracking-wider text-emerald-600 font-semibold">
                Price
              </p>
              <p className="text-2xl font-bold mt-1 text-emerald-700">
                {priceRange}
              </p>
            </div>
            <div
              className={`rounded-xl p-4 border ${totalStock === 0 ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}
            >
              <p
                className={`text-[11px] uppercase tracking-wider font-semibold ${totalStock === 0 ? "text-red-500" : "text-blue-600"}`}
              >
                Stock
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${totalStock === 0 ? "text-red-600" : "text-blue-700"}`}
              >
                {totalStock}
              </p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Status</span>
              <span
                className={`font-medium ${product.isActive ? "text-emerald-600" : "text-stone-500"}`}
              >
                {product.isActive ? "Live on catalog" : "Hidden"}
              </span>
            </div>
            {product.category && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Category</span>
                <span className="font-medium text-stone-700">
                  {product.category.name}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Unique sizes</span>
              <span className="font-medium text-stone-700">
                {new Set(product.variants.map((v) => v.size)).size}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Colors</span>
              <span className="font-medium text-stone-700">
                {new Set(product.variants.map((v) => v.color).filter(Boolean))
                  .size || "—"}
              </span>
            </div>
            <div className="pt-2 border-t border-stone-100">
              <Link
                href={`/catalog/${slug}`}
                target="_blank"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
              >
                View in catalog ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="border-t border-stone-200" />

      {/* ── Smart Variant Creator ───────────────────────── */}
      <SmartVariantCreator
        shopSlug={slug}
        productId={product.id}
        existingVariants={product.variants.map((v) => ({
          size: v.size,
          color: v.color,
        }))}
      />

      {/* ── Variant Grid ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">
            All Variants{" "}
            <span className="text-stone-400 font-normal">
              ({product.variants.length})
            </span>
          </h2>
        </div>
        <VariantGrid
          variants={product.variants.map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            priceInCents: v.priceInCents,
            stock: v.stock,
            sku: v.sku,
          }))}
          shopSlug={slug}
          productId={product.id}
        />
      </div>

      {/* ── Manual Add (collapsible) ────────────────────── */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Add custom variant manually
        </summary>
        <div className="mt-3">
          <AddVariantForm shopSlug={slug} productId={product.id} />
        </div>
      </details>

      {/* ── Danger Zone (collapsible) ───────────────────── */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Danger Zone
        </summary>
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="text-sm text-stone-600 mb-3">
            Deleting this product removes all variants and images permanently.
          </p>
          <DeleteProductButton shopSlug={slug} productId={product.id} />
        </div>
      </details>
    </div>
  );
}
