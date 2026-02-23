// ============================================================
// Page — Public Catalog Product Grid (/catalog/[slug])
// ============================================================
// The main storefront page. Buyers land here from a WhatsApp link.
//
// DESIGN: Mobile-first card grid with:
// - Product image (placeholder if none)
// - Product name
// - Price range from variants (e.g. "R 99.00 – R 199.00")
// - Available sizes as pills
// - Tap to view product detail
//
// PERFORMANCE: Server-rendered for instant load on SA mobile data.
// ============================================================

import {
  getCatalogProducts,
  getCatalogShop,
  getCatalogProductCount,
} from "@/lib/db/catalog";
import { formatZAR } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

interface CatalogPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const [products, productCount] = await Promise.all([
    getCatalogProducts(shop.id),
    getCatalogProductCount(shop.id),
  ]);

  // ── Empty State ────────────────────────────────────────
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-stone-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-stone-800 mb-2">
          Coming Soon
        </h2>
        <p className="text-stone-500 text-sm text-center max-w-xs">
          {shop.name} is setting up their catalog. Check back soon for fresh
          stock!
        </p>
        <a
          href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 fill-current"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Ask on WhatsApp
        </a>
      </div>
    );
  }

  // ── Catalog Header ─────────────────────────────────────
  // Get unique categories for future filtering
  const categories = Array.from(
    new Map(
      products
        .filter((p) => p.category !== null)
        .map((p) => [p.category!.id, p.category!])
    ).values()
  );

  return (
    <div className="space-y-5">
      {/* ── Summary Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-700">{productCount}</span>{" "}
            {productCount === 1 ? "product" : "products"} available
          </p>
        </div>

        {/* Category pills (scrollable on mobile) */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-stone-200/60 text-stone-600 text-xs font-medium whitespace-nowrap shadow-sm"
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Product Grid ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            shopSlug={slug}
          />
        ))}
      </div>
    </div>
  );
}

// ================================================================
// Product Card Component
// ================================================================

interface ProductCardProps {
  product: Awaited<ReturnType<typeof getCatalogProducts>>[number];
  shopSlug: string;
}

function ProductCard({ product, shopSlug }: ProductCardProps) {
  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Get unique sizes for pills
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));

  // Get unique colors
  const colors = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean))
  ) as string[];

  const primaryImage = product.images[0];

  return (
    <Link
      href={`/catalog/${shopSlug}/products/${product.id}`}
      className="group block"
    >
      <div className="bg-white rounded-2xl border border-stone-200/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-stone-200/60 hover:border-stone-200 hover:-translate-y-1 active:scale-[0.98]">
        {/* ── Image ─────────────────────────────────── */}
        <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
          {/* Shimmer placeholder */}
          <div className="absolute inset-0 shimmer" />

          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              className="relative w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 text-stone-300 bg-gradient-to-br from-stone-50 to-stone-100">
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <span className="text-xs font-medium">No image</span>
            </div>
          )}

          {/* Gradient overlay at bottom for readability */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

          {/* Out of stock overlay */}
          {totalStock === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-stone-900 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full tracking-wide uppercase">
                Sold Out
              </span>
            </div>
          )}

          {/* Color dots (top-right) */}
          {colors.length > 1 && (
            <div className="absolute top-2.5 right-2.5 flex gap-1 bg-white/80 backdrop-blur-sm rounded-full px-1.5 py-1 shadow-sm">
              {colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: colorToHex(color) }}
                  title={color}
                />
              ))}
              {colors.length > 4 && (
                <span className="w-3.5 h-3.5 rounded-full bg-stone-200 border border-white shadow-sm flex items-center justify-center text-[7px] font-bold text-stone-500">
                  +{colors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Quick price badge (bottom-left) */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="bg-white/90 backdrop-blur-sm text-stone-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
              {formatZAR(minPrice)}
              {minPrice !== maxPrice && (
                <span className="text-stone-400 font-normal"> +</span>
              )}
            </span>
          </div>
        </div>

        {/* ── Info ──────────────────────────────────── */}
        <div className="p-3 sm:p-3.5 space-y-1.5">
          {/* Category label */}
          {product.category && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">
              {product.category.name}
            </span>
          )}

          {/* Product name */}
          <h3 className="font-semibold text-stone-800 text-[13px] sm:text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Size pills */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {sizes.slice(0, 5).map((size) => (
              <span
                key={size}
                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-stone-50 border border-stone-100 text-stone-500 text-[10px] font-medium"
              >
                {size}
              </span>
            ))}
            {sizes.length > 5 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-stone-50 border border-stone-100 text-stone-400 text-[10px] font-medium">
                +{sizes.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ================================================================
// Helper: Color name → CSS hex (common clothing colors)
// ================================================================

function colorToHex(color: string): string {
  const colorMap: Record<string, string> = {
    black: "#1a1a1a",
    white: "#f5f5f5",
    red: "#dc2626",
    blue: "#2563eb",
    navy: "#1e3a5f",
    green: "#16a34a",
    yellow: "#eab308",
    pink: "#ec4899",
    purple: "#9333ea",
    orange: "#ea580c",
    grey: "#6b7280",
    gray: "#6b7280",
    brown: "#92400e",
    beige: "#d4b896",
    cream: "#fffdd0",
    maroon: "#800000",
    olive: "#556b2f",
    teal: "#0d9488",
    coral: "#f97316",
    khaki: "#bdb76b",
    gold: "#ca8a04",
    silver: "#a8a29e",
    charcoal: "#374151",
    burgundy: "#800020",
    tan: "#d2b48c",
    mint: "#a7f3d0",
    lavender: "#c4b5fd",
    peach: "#fdba74",
    rose: "#fb7185",
    sky: "#38bdf8",
    denim: "#1e40af",
  };

  return colorMap[color.toLowerCase()] || "#9ca3af";
}
