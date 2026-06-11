"use client";

import * as React from "react";
import { PackageSearch, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { TfButton } from "@/components/tf/button";
import { TfEmptyState } from "@/components/tf/empty-state";
import { TfProductCard } from "@/components/tf/product-card";

// ============================================================
// TfStorefrontGrid — client-side search/filter/sort over the
// server-fetched catalogue. Lean: no round-trips, no deps.
// ============================================================

export interface TfGridProduct {
  id: string;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  imageAlt: string | null;
  minPriceCents: number;
  categoryId: string | null;
  categoryName: string | null;
  /** Original server order (newest first) — used for the default sort */
  position: number;
}

interface TfStorefrontGridProps {
  products: TfGridProduct[];
  shopSlug: string;
  /** Seller identity shown on each card */
  sellerName: string;
  sellerVerified: boolean;
}

type SortKey = "newest" | "price_asc" | "price_desc";

export function TfStorefrontGrid({
  products,
  shopSlug,
  sellerName,
  sellerVerified,
}: TfStorefrontGridProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortKey>("newest");

  const categories = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (p.categoryId && p.categoryName) map.set(p.categoryId, p.categoryName);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [products]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q)) &&
        (!category || p.categoryId === category),
    );
    return list.sort((a, b) => {
      if (sort === "price_asc") return a.minPriceCents - b.minPriceCents;
      if (sort === "price_desc") return b.minPriceCents - a.minPriceCents;
      return a.position - b.position;
    });
  }, [products, query, category, sort]);

  return (
    <section aria-label="Products">
      {/* Search + sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tf-stone-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${sellerName}'s products…`}
            aria-label="Search this shop"
            className="min-h-11 w-full rounded-full border border-tf-stone-300 bg-tf-raised pl-10 pr-4 text-[15px] text-tf-ink placeholder:text-tf-stone-400 outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort products"
          className="min-h-11 shrink-0 rounded-full border border-tf-stone-300 bg-tf-raised px-3 text-sm text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="mt-3 overflow-x-auto">
          <div className="flex w-max gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={!category}
              className={cn(
                "min-h-9 whitespace-nowrap rounded-full border px-3.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-tf-primary",
                !category
                  ? "border-tf-primary bg-tf-verified-soft font-medium text-tf-deep"
                  : "border-tf-stone-300 bg-tf-raised text-tf-stone-600",
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(category === c.id ? null : c.id)}
                aria-pressed={category === c.id}
                className={cn(
                  "min-h-9 whitespace-nowrap rounded-full border px-3.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-tf-primary",
                  category === c.id
                    ? "border-tf-primary bg-tf-verified-soft font-medium text-tf-deep"
                    : "border-tf-stone-300 bg-tf-raised text-tf-stone-600",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {visible.length === 0 ? (
        <TfEmptyState
          icon={<PackageSearch />}
          title="Nothing matches"
          description={
            query
              ? `No products match “${query}” in this shop.`
              : "No products in this category yet."
          }
          action={
            <TfButton
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory(null);
              }}
            >
              Show everything
            </TfButton>
          }
          className="mt-4"
        />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {visible.map((p) => (
            <li key={p.id}>
              <TfProductCard
                href={`/catalog/${shopSlug}/products/${p.slug ?? p.id}`}
                title={p.name}
                price={p.minPriceCents / 100}
                imageUrl={p.imageUrl}
                imageAlt={p.imageAlt ?? p.name}
                sellerName={sellerName}
                sellerVerified={sellerVerified}
                className="h-full"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
