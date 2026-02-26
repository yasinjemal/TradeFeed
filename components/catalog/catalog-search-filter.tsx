// ============================================================
// Component — Catalog Search & Filter
// ============================================================
// Client-side search, category filter, and sort for instant results.
// No server round-trips — filters the product list in the browser.
// ============================================================

"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";
import { WishlistHeart } from "./wishlist-heart";

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: { id: string; name: string; slug: string } | null;
  images: { url: string; altText: string | null }[];
  variants: {
    id: string;
    size: string;
    color: string | null;
    priceInCents: number;
    stock: number;
  }[];
}

interface CatalogSearchFilterProps {
  products: CatalogProduct[];
  shopSlug: string;
  shopId: string;
  categories: { id: string; name: string }[];
}

type SortOption = "newest" | "price-low" | "price-high" | "name";

export function CatalogSearchFilter({
  products,
  shopSlug,
  shopId: _shopId,
  categories,
}: CatalogSearchFilterProps) {
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("newest");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  }, []);

  const clearSearch = useCallback(() => {
    setInputValue("");
    setSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  // ── Filter & Sort ───────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.variants.some(
            (v) =>
              v.size.toLowerCase().includes(q) ||
              v.color?.toLowerCase().includes(q),
          ),
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((p) => p.category?.id === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      const aMin = Math.min(...a.variants.map((v) => v.priceInCents));
      const bMin = Math.min(...b.variants.map((v) => v.priceInCents));

      switch (sort) {
        case "price-low":
          return aMin - bMin;
        case "price-high":
          return bMin - aMin;
        case "name":
          return a.name.localeCompare(b.name);
        default: // newest = original order (already sorted by createdAt desc from DB)
          return 0;
      }
    });

    return result;
  }, [products, search, selectedCategory, sort]);

  return (
    <div className="space-y-4">
      {/* ── Search + Sort Row ────────────────────────────── */}
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products, sizes, colors..."
            className="w-full rounded-xl border border-stone-200 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 hover:bg-stone-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low → High</option>
          <option value="price-high">Price: High → Low</option>
          <option value="name">A → Z</option>
        </select>
      </div>

      {/* ── Category Pills ───────────────────────────────── */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-stone-900 text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id,
                )
              }
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Results Count ────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-stone-700">
            {filtered.length}
          </span>{" "}
          {filtered.length === 1 ? "product" : "products"}
          {search && ` matching "${search}"`}
          {selectedCategory && (
            <>
              {" "}
              in{" "}
              <span className="font-medium text-stone-700">
                {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            </>
          )}
        </p>
      </div>

      {/* ── Product Grid ─────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-stone-500 text-sm">No products found</p>
          <p className="text-stone-400 text-xs mt-1">
            Try a different search or category
          </p>
          {(search || selectedCategory) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
              }}
              className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              shopSlug={shopSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// Product Card (client-side version with same design)
// ================================================================

function ProductCard({
  product,
  shopSlug,
}: {
  product: CatalogProduct;
  shopSlug: string;
}) {
  const prices = product.variants.map((v) => v.priceInCents);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const sizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const colors = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean)),
  ) as string[];
  const primaryImage = product.images[0];

  const formatZAR = (cents: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(cents / 100);

  return (
    <Link
      href={`/catalog/${shopSlug}/products/${product.id}`}
      className="group block"
    >
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm shadow-stone-200/70 ring-1 ring-stone-200/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-300/50 active:scale-[0.99]">
        <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
          <div className="absolute inset-0 shimmer" />
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.altText || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              placeholder="blur"
              blurDataURL={SHIMMER_LIGHT}
              className="relative object-cover transition-transform duration-500 ease-out group-hover:scale-105"
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

          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* Wishlist Heart */}
          <div className="absolute left-2.5 top-2.5 z-10">
            <WishlistHeart
              productId={product.id}
              productName={product.name}
              imageUrl={primaryImage?.url ?? null}
              priceInCents={minPrice}
            />
          </div>

          {totalStock === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-stone-900 text-white text-[11px] font-semibold px-3.5 py-1.5 rounded-full tracking-wide uppercase">
                Sold Out
              </span>
            </div>
          )}

          {colors.length > 1 && (
            <div className="absolute right-2.5 top-2.5 flex gap-1 rounded-full bg-white/85 px-1.5 py-1 backdrop-blur-sm shadow-sm">
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

          <div className="absolute bottom-3 left-3">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-extrabold tracking-tight text-stone-900 shadow-sm backdrop-blur-sm">
              {formatZAR(minPrice)}
              {minPrice !== maxPrice && (
                <span className="text-stone-400 font-normal"> +</span>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-2 p-3.5 sm:p-4">
          {product.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
              {product.category.name}
            </span>
          )}
          <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-stone-900 transition-colors group-hover:text-emerald-700 sm:text-[15px]">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {sizes.slice(0, 5).map((size) => (
              <span
                key={size}
                className="inline-flex items-center rounded-md bg-stone-50 px-2 py-1 text-[10px] font-medium text-stone-500"
              >
                {size}
              </span>
            ))}
            {sizes.length > 5 && (
              <span className="inline-flex items-center rounded-md bg-stone-50 px-2 py-1 text-[10px] font-medium text-stone-400">
                +{sizes.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function colorToHex(color: string): string {
  const colorMap: Record<string, string> = {
    black: "#1a1a1a", white: "#f5f5f5", red: "#dc2626", blue: "#2563eb",
    navy: "#1e3a5f", green: "#16a34a", yellow: "#eab308", pink: "#ec4899",
    purple: "#9333ea", orange: "#ea580c", grey: "#6b7280", gray: "#6b7280",
    brown: "#92400e", beige: "#d4b896", cream: "#fffdd0", maroon: "#800000",
    olive: "#556b2f", teal: "#0d9488", coral: "#f97316", khaki: "#bdb76b",
    gold: "#ca8a04", silver: "#a8a29e", charcoal: "#374151", burgundy: "#800020",
  };
  return colorMap[color.toLowerCase()] || "#9ca3af";
}
