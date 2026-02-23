// ============================================================
// Page — Product List (v2 — Modern Cards)
// ============================================================

import Link from "next/link";
import { getShopBySlug } from "@/lib/db/shops";
import { getProducts } from "@/lib/db/products";
import { notFound } from "next/navigation";
import { formatZAR } from "@/types";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const products = await getProducts(shop.id);

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-stone-500">
            {products.length} product{products.length !== 1 ? "s" : ""} in your
            catalog
          </p>
        </div>
        <Link
          href={`/dashboard/${slug}/products/new`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          + Add Product
        </Link>
      </div>

      {/* ── Empty State ─────────────────────────────────── */}
      {products.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-16 text-center">
          <div className="text-5xl mb-4">👕</div>
          <h2 className="text-lg font-semibold text-stone-900">
            No products yet
          </h2>
          <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto">
            Add your first product to start building your catalog. Buyers will
            see them on your public page.
          </p>
          <Link
            href={`/dashboard/${slug}/products/new`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md mt-5 hover:bg-emerald-600 transition-colors"
          >
            Add Your First Product
          </Link>
        </div>
      )}

      {/* ── Product Grid ────────────────────────────────── */}
      {products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const prices = product.variants.map((v) => v.priceInCents);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
            const totalStock = product.variants.reduce(
              (sum, v) => sum + v.stock,
              0,
            );

            return (
              <Link
                key={product.id}
                href={`/dashboard/${slug}/products/${product.id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden transition-all duration-300 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-0.5 h-full">
                  {/* Image */}
                  {product.images.length > 0 ? (
                    <div className="aspect-square bg-stone-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.images[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-stone-50 flex items-center justify-center">
                      <span className="text-4xl opacity-40">📷</span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-stone-900 truncate">
                          {product.name}
                        </h3>
                        {product.category && (
                          <p className="text-xs text-stone-400 mt-0.5">
                            {product.category.name}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          product.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {product.isActive ? "● Live" : "Draft"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="text-sm font-bold text-emerald-600">
                        {prices.length === 0
                          ? "No pricing"
                          : minPrice === maxPrice
                            ? formatZAR(minPrice)
                            : `${formatZAR(minPrice)} – ${formatZAR(maxPrice)}`}
                      </span>
                      <span className="text-xs text-stone-400">
                        {product.variants.length} var ·{" "}
                        <span
                          className={
                            totalStock === 0 ? "text-red-500 font-medium" : ""
                          }
                        >
                          {totalStock} stock
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
