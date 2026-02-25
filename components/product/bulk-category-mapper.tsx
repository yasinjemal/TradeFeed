// ============================================================
// Component — Bulk Category Mapper (M8.2)
// ============================================================
// Interactive table showing all products with inline global
// category assignment. Supports multi-select + bulk assign.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  setProductGlobalCategoryAction,
  bulkSetGlobalCategoryAction,
} from "@/app/actions/global-categories";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";

interface ProductForMapping {
  id: string;
  name: string;
  globalCategoryId: string | null;
  globalCategory: { name: string; slug: string } | null;
  images: { url: string }[];
  category: { name: string } | null;
}

interface BulkCategoryMapperProps {
  shopSlug: string;
  products: ProductForMapping[];
  globalCategories: GlobalCategoryOption[];
}

export function BulkCategoryMapper({
  shopSlug,
  products: initialProducts,
  globalCategories,
}: BulkCategoryMapperProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unmapped" | "mapped">("all");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredProducts = initialProducts.filter((p) => {
    if (filter === "unmapped") return !p.globalCategoryId;
    if (filter === "mapped") return !!p.globalCategoryId;
    return true;
  });

  const unmappedCount = initialProducts.filter((p) => !p.globalCategoryId).length;
  const mappedCount = initialProducts.filter((p) => !!p.globalCategoryId).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleSingleAssign = (productId: string, categoryId: string) => {
    startTransition(async () => {
      const result = await setProductGlobalCategoryAction(
        shopSlug,
        productId,
        categoryId || null
      );
      if (result.success) {
        setSuccessMessage("Category updated!");
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    });
  };

  const handleBulkAssign = () => {
    if (selectedIds.size === 0) return;
    startTransition(async () => {
      const result = await bulkSetGlobalCategoryAction(
        shopSlug,
        Array.from(selectedIds),
        bulkCategoryId || null
      );
      if (result.success) {
        setSuccessMessage(
          `Updated ${result.count} product${result.count !== 1 ? "s" : ""}!`
        );
        setSelectedIds(new Set());
        setBulkCategoryId("");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
  };

  // Build flat options for inline selects
  const flatOptions: { id: string; label: string }[] = [];
  for (const parent of globalCategories) {
    flatOptions.push({
      id: parent.id,
      label: `${parent.icon || ""} ${parent.name}`,
    });
    for (const child of parent.children) {
      flatOptions.push({
        id: child.id,
        label: `  ${child.icon || ""} ${parent.name} → ${child.name}`,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-top-2 duration-200">
          ✓ {successMessage}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-center">
          <p className="text-2xl font-bold text-stone-900">{initialProducts.length}</p>
          <p className="text-xs text-stone-500 mt-1">Total Products</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{mappedCount}</p>
          <p className="text-xs text-emerald-600 mt-1">Discoverable</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${unmappedCount > 0 ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-200"}`}>
          <p className={`text-2xl font-bold ${unmappedCount > 0 ? "text-amber-600" : "text-stone-400"}`}>{unmappedCount}</p>
          <p className={`text-xs mt-1 ${unmappedCount > 0 ? "text-amber-600" : "text-stone-400"}`}>Need Mapping</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(["all", "unmapped", "mapped"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f === "all" && `All (${initialProducts.length})`}
            {f === "unmapped" && `Unmapped (${unmappedCount})`}
            {f === "mapped" && `Mapped (${mappedCount})`}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <span className="text-sm font-medium text-emerald-700">
            {selectedIds.size} selected
          </span>
          <select
            value={bulkCategoryId}
            onChange={(e) => setBulkCategoryId(e.target.value)}
            className="flex-1 h-10 rounded-lg border border-emerald-200 bg-white px-3 text-sm text-stone-900 focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Remove category</option>
            {flatOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button
            onClick={handleBulkAssign}
            disabled={isPending}
            size="sm"
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 h-10 px-5"
          >
            {isPending ? "Applying..." : "Apply to All"}
          </Button>
        </div>
      )}

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
          <p className="text-stone-500 text-sm">
            {filter === "unmapped"
              ? "🎉 All products are mapped to marketplace categories!"
              : filter === "mapped"
                ? "No products mapped yet."
                : "No products found."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-stone-50 border-b border-stone-200">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-400"
            />
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex-1">
              Product
            </span>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider w-[280px] hidden sm:block">
              Marketplace Category
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-stone-100">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  selectedIds.has(product.id) ? "bg-emerald-50/50" : "hover:bg-stone-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-400"
                />

                {/* Product Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {product.images[0]?.url ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-300 text-sm">
                      📷
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-stone-400">{product.category.name}</p>
                    )}
                  </div>
                </div>

                {/* Category Select */}
                <select
                  value={product.globalCategoryId || ""}
                  onChange={(e) => handleSingleAssign(product.id, e.target.value)}
                  disabled={isPending}
                  className={`w-[280px] h-9 rounded-lg border px-2 text-sm focus:border-emerald-400 focus:outline-none disabled:opacity-50 ${
                    product.globalCategoryId
                      ? "border-emerald-200 bg-emerald-50/50 text-stone-700"
                      : "border-stone-200 bg-white text-stone-500"
                  }`}
                >
                  <option value="">— Not on marketplace —</option>
                  {flatOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
