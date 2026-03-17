// ============================================================
// Page — Product List (v2 — Modern Cards)
// ============================================================

import Link from "next/link";
import Image from "next/image";
import { getShopBySlug } from "@/lib/db/shops";
import { getProducts } from "@/lib/db/products";
import { countUnmappedProducts } from "@/lib/db/global-categories";
import { checkProductLimit } from "@/lib/db/subscriptions";
import { notFound } from "next/navigation";
import { formatZAR } from "@/types";
import { IllustrationEmptyBox } from "@/components/ui/illustrations";
import { ListingQualityScore } from "@/components/product/listing-quality-score";
import { computeQualityProps } from "@/lib/utils/listing-quality";
import { ProductUsageMeter } from "@/components/billing/product-usage-meter";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const products = await getProducts(shop.id);
  const mappingStats = await countUnmappedProducts(shop.id);
  const limit = await checkProductLimit(shop.id);

  // Show upgrade nudge at 80%+ of free limit
  const showUpgradeNudge = !limit.unlimited && limit.current >= Math.floor(limit.limit * 0.8);
  const slotsLeft = limit.unlimited ? Infinity : limit.limit - limit.current;

  return (
    <div className="space-y-6">
      {/* ── Discoverability Nudge (M8.4) ─────────────── */}
      {mappingStats.unmapped > 0 && mappingStats.total > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-2xl flex-shrink-0">🔍</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {mappingStats.unmapped} of {mappingStats.total} product{mappingStats.total !== 1 ? "s" : ""}{" "}
              {mappingStats.unmapped === 1 ? "isn't" : "aren't"} discoverable on the marketplace
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Assign marketplace categories to help buyers find your products
            </p>
          </div>
          <Link
            href={`/dashboard/${slug}/marketplace-categories`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm"
          >
            Map Now →
          </Link>
        </div>
      )}

      {/* ── Pro Upgrade Nudge (at 80%+ of free limit) ──── */}
      {showUpgradeNudge && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
          <span className="text-2xl flex-shrink-0">🔥</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900">
              You&apos;re growing! {slotsLeft <= 0
                ? "You've hit your product limit."
                : `Only ${slotsLeft} product slot${slotsLeft !== 1 ? "s" : ""} left.`}
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Upgrade to Pro for unlimited products — that&apos;s less than R7/day
            </p>
          </div>
          <Link
            href={`/dashboard/${slug}/billing`}
            className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-emerald-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            ⚡ Go Pro
          </Link>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-stone-500">
            {products.length} product{products.length !== 1 ? "s" : ""} in your
            catalog
            <span className="mx-1.5 text-stone-300">·</span>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my products! 🛍️\n\nhttps://tradefeed.co.za/catalog/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Share catalog
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${slug}/products/import`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            📦 Bulk Import
          </Link>
          <Link
            href={`/dashboard/${slug}/products/new`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* ── Product Usage Meter (compact) ───────────────── */}
      {!limit.unlimited && (
        <ProductUsageMeter
          current={limit.current}
          limit={limit.limit}
          unlimited={limit.unlimited}
          planName={limit.planName}
          shopSlug={slug}
          compact
        />
      )}

      {/* ── Empty State ─────────────────────────────────── */}
      {products.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 p-6 sm:p-10">
          <div className="max-w-md mx-auto text-center">
            <IllustrationEmptyBox className="w-32 h-32 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              Create your first product in 60 seconds
            </h2>
            <p className="text-sm text-stone-500 mb-6">
              Upload a photo and let AI do the rest — or type it in manually. Buyers will see your products immediately.
            </p>

            {/* What a great listing looks like */}
            <div className="rounded-xl border border-stone-200 bg-white p-3 mb-5 max-w-xs mx-auto text-left">
              <div className="flex gap-3 items-center">
                <div className="w-14 h-14 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👕</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-800 truncate">Premium Cotton T-Shirt</p>
                  <p className="text-[10px] text-emerald-600 font-bold">R149.99</p>
                  <p className="text-[10px] text-stone-400">50 in stock · 📸 3 photos</p>
                </div>
              </div>
              <p className="text-[9px] text-stone-400 mt-2 text-center">↑ This is what a great listing looks like</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/dashboard/${slug}/products/new?wizard=true`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                🚀 Guided Setup
              </Link>
              <Link
                href={`/dashboard/${slug}/products/new?ai=true`}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
              >
                ✨ Create with AI
              </Link>
              <Link
                href={`/dashboard/${slug}/products/new?quick=true`}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
              >
                ⚡ Quick Sell
              </Link>
            </div>
            <div className="flex items-center justify-center gap-3 mt-3">
              <Link
                href={`/dashboard/${slug}/products/new`}
                className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-700 transition"
              >
                📝 Manual Entry
              </Link>
              <Link
                href={`/dashboard/${slug}/products/import`}
                className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-700 transition"
              >
                📦 Bulk Import
              </Link>
            </div>
            <p className="text-xs text-stone-400 mt-4">
              💡 Most sellers list their first product in under 60 seconds with AI
            </p>
          </div>
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
            const qualityProps = computeQualityProps(product);

            return (
              <Link
                key={product.id}
                href={`/dashboard/${slug}/products/${product.id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden transition-all duration-300 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-50 hover:-translate-y-0.5 h-full">
                  {/* Image */}
                  {product.images.length > 0 ? (
                    <div className="aspect-square bg-stone-100 overflow-hidden relative">
                      <Image
                        src={product.images[0]!.url}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-stone-50 flex flex-col items-center justify-center gap-2 relative">
                      <span className="text-4xl opacity-40">📷</span>
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Add photo
                      </span>
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
                          <p className="text-xs text-stone-400 mt-0.5 hidden sm:block">
                            {product.category.name}
                          </p>
                        )}
                        {product.globalCategory && (
                          <span className="hidden sm:inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 text-[9px] font-medium">
                            🏪 {product.globalCategory.name}
                          </span>
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
                    {product.source === "WHATSAPP" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-[9px] font-semibold">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        WhatsApp
                      </span>
                    )}

                    {/* Stock Status Badges */}
                    {totalStock === 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 border border-red-100">
                        <span className="text-xs">🚫</span>
                        <span className="text-[10px] font-semibold text-red-600">Sold out — add stock to sell</span>
                      </div>
                    )}
                    {totalStock > 0 && totalStock <= 5 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100">
                        <span className="text-xs">⚠️</span>
                        <span className="text-[10px] font-semibold text-amber-600">Low stock: {totalStock} left</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                      <span className="text-base sm:text-sm font-bold text-emerald-600">
                        {prices.length === 0
                          ? "No pricing"
                          : minPrice === maxPrice
                            ? formatZAR(minPrice)
                            : `${formatZAR(minPrice)} – ${formatZAR(maxPrice)}`}
                      </span>
                      <span className="text-xs text-stone-400">
                        <span className="hidden sm:inline">{product.variants.length} var · </span>
                        <span
                          className={
                            totalStock === 0 ? "text-red-500 font-medium" : totalStock <= 5 ? "text-amber-500 font-medium" : ""
                          }
                        >
                          {totalStock} stock
                        </span>
                      </span>
                    </div>

                    {/* Quality Score Mini Bar */}
                    <ListingQualityScore {...qualityProps} compact />
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
