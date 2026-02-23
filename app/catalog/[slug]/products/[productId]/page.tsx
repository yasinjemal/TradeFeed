// ============================================================
// Page — Public Product Detail (/catalog/[slug]/products/[productId])
// ============================================================
// The product page buyers see when they tap a card in the grid.
//
// DESIGN: Mobile-first, smooth, trust-building:
// - Large product image with gallery dots
// - Clear product name + description
// - Variant table: size, color, price, stock
// - AddToCart picker: size → color → quantity → add
// - WhatsApp enquiry link (secondary, or primary when sold out)
// - Back to catalog link
// ============================================================

import { getCatalogProduct, getCatalogShop } from "@/lib/db/catalog";
import { formatZAR } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AddToCart } from "@/components/catalog/add-to-cart";
import { ProductImageGallery } from "@/components/catalog/product-image-gallery";

interface ProductDetailPageProps {
  params: Promise<{ slug: string; productId: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return { title: "Not Found" };

  const product = await getCatalogProduct(productId, shop.id);
  if (!product) return { title: "Not Found" };

  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = prices.length > 0 ? formatZAR(Math.min(...prices)) : "";

  return {
    title: `${product.name} — ${shop.name}`,
    description: product.description || `${product.name} from ${minPrice} at ${shop.name}`,
    openGraph: {
      title: `${product.name} — ${shop.name}`,
      description: product.description || `${product.name} from ${minPrice}`,
      type: "website",
      images: product.images[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug, productId } = await params;
  const shop = await getCatalogShop(slug);
  if (!shop) return notFound();

  const product = await getCatalogProduct(productId, shop.id);
  if (!product) return notFound();

  // ── Derive data ────────────────────────────────────────
  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Group variants by size for structured display
  const uniqueSizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const uniqueColors = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean))
  ) as string[];

  // Build the WhatsApp enquiry message
  const waMessage = encodeURIComponent(
    `Hi! I'm interested in *${product.name}*\n\n` +
      `Available sizes: ${uniqueSizes.join(", ")}\n` +
      (uniqueColors.length > 0
        ? `Colors: ${uniqueColors.join(", ")}\n`
        : "") +
      `\nPlease let me know availability and pricing. Thank you! 🙏`
  );
  const waLink = `https://wa.me/${shop.whatsappNumber.replace("+", "")}?text=${waMessage}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Back Link ─────────────────────────────────────── */}
      <Link
        href={`/catalog/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4 group"
      >
        <svg
          className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back to catalog
      </Link>

      {/* ── Product Card ──────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-200/50 overflow-hidden shadow-sm shadow-stone-200/50">
        {/* ── Image Gallery (interactive) ─────────────── */}
        <ProductImageGallery
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            altText: img.altText,
          }))}
          productName={product.name}
          soldOut={totalStock === 0}
        />

        {/* ── Product Info ───────────────────────────────── */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Category + Name */}
          <div>
            {product.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] uppercase tracking-wider font-semibold mb-2">
                {product.category.name}
              </span>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-stone-500 text-sm mt-2.5 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Price Range */}
          <div className="flex items-baseline gap-2 bg-stone-50 rounded-2xl px-4 py-3 border border-stone-100">
            <span className="text-2xl sm:text-3xl font-bold text-stone-900">
              {formatZAR(minPrice)}
            </span>
            {minPrice !== maxPrice && (
              <span className="text-base text-stone-400 font-medium">
                – {formatZAR(maxPrice)}
              </span>
            )}
            <span className="text-xs text-stone-400 ml-auto">per unit</span>
          </div>

          {/* ── Divider ─────────────────────────────── */}
          <div className="border-t border-stone-100" />

          {/* ── Available Sizes ────────────────────────── */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2.5">
              Available Sizes
            </h3>
            <div className="flex flex-wrap gap-2">
              {uniqueSizes.map((size) => {
                const sizeVariants = product.variants.filter(
                  (v) => v.size === size
                );
                const sizeStock = sizeVariants.reduce(
                  (sum, v) => sum + v.stock,
                  0
                );
                const inStock = sizeStock > 0;

                return (
                  <span
                    key={size}
                    className={`inline-flex items-center justify-center min-w-[2.5rem] px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      inStock
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-400 line-through"
                    }`}
                  >
                    {size}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ── Colors ────────────────────────────────── */}
          {uniqueColors.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2.5">
                Colors
              </h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200 text-sm text-stone-700"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-stone-300"
                      style={{ backgroundColor: colorToHex(color) }}
                    />
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Variant Table ──────────────────────────── */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-xs uppercase tracking-wider font-semibold text-stone-500 mb-2.5 select-none">
              <span>Stock & Pricing</span>
              <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="bg-stone-50 rounded-2xl border border-stone-200/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-stone-200/60">
                    <th className="px-4 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">
                      Size
                    </th>
                    {uniqueColors.length > 0 && (
                      <th className="px-4 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">
                        Color
                      </th>
                    )}
                    <th className="px-4 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider text-right">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/40">
                  {product.variants.map((variant) => (
                    <tr
                      key={variant.id}
                      className={
                        variant.stock === 0 ? "text-stone-400" : "text-stone-700"
                      }
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {variant.size}
                      </td>
                      {uniqueColors.length > 0 && (
                        <td className="px-4 py-2.5">
                          {variant.color || "—"}
                        </td>
                      )}
                      <td className="px-4 py-2.5 font-semibold">
                        {formatZAR(variant.priceInCents)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {variant.stock > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {variant.stock}
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs font-medium">
                            Out of stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* ── Divider ─────────────────────────────── */}
          <div className="border-t border-stone-100" />

          {/* ── Add to Cart / Sold Out ────────────────── */}
          <div className="pt-2">
            {totalStock > 0 ? (
              <AddToCart
                productId={product.id}
                productName={product.name}
                variants={product.variants.map((v) => ({
                  id: v.id,
                  size: v.size,
                  color: v.color,
                  priceInCents: v.priceInCents,
                  stock: v.stock,
                }))}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 py-3">
                <p className="text-stone-500 text-sm font-medium">
                  This product is currently sold out
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Ask about restock on WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* ── WhatsApp Enquiry (secondary) ──────────── */}
          {totalStock > 0 && (
            <div className="flex items-center justify-center pt-1">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-emerald-600 transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-current"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Or ask a question on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Helper: Color name → CSS hex
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
