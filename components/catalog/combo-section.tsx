// ============================================================
// Component — Combo Section (Catalog)
// ============================================================
// Shows combo deals in the public catalog with category tabs.
// ============================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { SHIMMER_LIGHT } from "@/lib/image-placeholder";
import { formatZAR } from "@/types";

interface CatalogCombo {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  retailPriceCents: number | null;
  stock: number;
  comboCategory: { id: string; name: string; slug: string } | null;
  items: { id: string; productName: string; variantLabel: string | null; quantity: number }[];
  images: { url: string; altText: string | null }[];
}

interface ComboSectionProps {
  combos: CatalogCombo[];
  shopSlug: string;
}

export function ComboSection({ combos, shopSlug }: ComboSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract unique combo categories
  const categories = useMemo(() => {
    return Array.from(
      new Map(
        combos
          .filter((c) => c.comboCategory !== null)
          .map((c) => [c.comboCategory!.id, c.comboCategory!])
      ).values()
    );
  }, [combos]);

  // Filter by selected category
  const filtered = useMemo(() => {
    if (!selectedCategory) return combos;
    return combos.filter((c) => c.comboCategory?.id === selectedCategory);
  }, [combos, selectedCategory]);

  if (combos.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl">📦</span>
        <h2 className="text-lg font-bold text-stone-900">Combo Deals</h2>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {combos.length} {combos.length === 1 ? "deal" : "deals"}
        </span>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === null
                ? "bg-emerald-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat.id
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Combo Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filtered.map((combo) => {
          const image = combo.images[0];
          return (
            <Link
              key={combo.id}
              href={`/catalog/${shopSlug}/combos/${combo.id}`}
              className="group rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/60 overflow-hidden hover:shadow-md hover:ring-stone-300/60 transition-all"
            >
              {/* Image */}
              <div className="relative aspect-square bg-stone-100">
                {image ? (
                  <Image
                    src={image.url}
                    alt={image.altText ?? combo.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(min-width: 640px) 33vw, 50vw"
                    placeholder="blur"
                    blurDataURL={SHIMMER_LIGHT}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-4xl">📦</span>
                  </div>
                )}

                {/* Combo badge */}
                <div className="absolute top-2 left-2">
                  <span className="rounded-full bg-orange-500/90 backdrop-blur px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    COMBO
                  </span>
                </div>

                {/* Price overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 px-2.5">
                  <span className="rounded-full bg-white/95 backdrop-blur-sm px-2 py-0.5 text-xs font-bold text-stone-900 shadow-sm">
                    {formatZAR(combo.priceCents)}
                  </span>
                  {combo.retailPriceCents && (
                    <span className="ml-1 rounded-full bg-emerald-50/95 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Retail {formatZAR(combo.retailPriceCents)}
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-1">
                <h3 className="text-sm font-semibold text-stone-900 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                  {combo.name}
                </h3>
                {combo.comboCategory && (
                  <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                    {combo.comboCategory.name}
                  </span>
                )}
                <p className="text-[11px] text-stone-400">
                  {combo.items.length} item{combo.items.length !== 1 ? "s" : ""} · {combo.stock} available
                </p>
                {/* Items preview */}
                <div className="flex flex-wrap gap-0.5 pt-0.5">
                  {combo.items.slice(0, 2).map((item, i) => (
                    <span key={i} className="text-[10px] text-stone-500 truncate max-w-full">
                      {item.quantity > 1 ? `${item.quantity}× ` : ""}{item.productName}
                      {i < Math.min(combo.items.length, 2) - 1 ? " + " : ""}
                    </span>
                  ))}
                  {combo.items.length > 2 && (
                    <span className="text-[10px] text-stone-400">+{combo.items.length - 2} more</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
