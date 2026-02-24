// ============================================================
// Component — Create Product Form (v2 — Smart Tiles)
// ============================================================
// One-tap product type tiles → auto-fills name. Minimal typing.
// After creation, redirects to detail page for images + variants.
// ============================================================

"use client";

import { useActionState, useState, useMemo } from "react";
import { createProductAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlobalCategoryPicker } from "@/components/product/global-category-picker";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";
import { suggestGlobalCategory } from "@/lib/db/global-categories";

/* ── Product Type Tiles ─────────────────────────────────── */
const PRODUCT_TYPES = [
  // Clothing
  { label: "T-Shirt", emoji: "👕" },
  { label: "Hoodie", emoji: "🧥" },
  { label: "Jacket", emoji: "🧥" },
  { label: "Jeans", emoji: "👖" },
  { label: "Dress", emoji: "👗" },
  { label: "Sneakers", emoji: "👟" },
  // Electronics
  { label: "Phone", emoji: "📱" },
  { label: "Earbuds", emoji: "🎧" },
  { label: "Charger", emoji: "🔌" },
  // Beauty
  { label: "Skincare", emoji: "🧴" },
  { label: "Fragrance", emoji: "🌸" },
  // Food
  { label: "Snack Pack", emoji: "🍿" },
  { label: "Beverage", emoji: "🥤" },
  // Home & General
  { label: "Home Decor", emoji: "🏠" },
  { label: "Accessory", emoji: "👜" },
  { label: "Other", emoji: "📦" },
] as const;

interface CreateProductFormProps {
  shopSlug: string;
  categories?: { id: string; name: string }[];
  globalCategories?: GlobalCategoryOption[];
}

export function CreateProductForm({ shopSlug, categories = [], globalCategories = [] }: CreateProductFormProps) {
  const boundAction = createProductAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // M8.3: Auto-suggest global category based on product name
  const suggestedSlug = useMemo(() => suggestGlobalCategory(name), [name]);

  const handleTypeSelect = (label: string) => {
    setSelectedType(label);
    if (!name || PRODUCT_TYPES.some((t) => t.label === name)) {
      setName(label);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* ── Step 1: Pick a Product Type ──────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-1">
          What are you selling?
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Tap a type to get started — or type a custom name below
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {PRODUCT_TYPES.map(({ label, emoji }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleTypeSelect(label)}
              className={`flex flex-col items-center gap-1 rounded-xl p-3 border-2 transition-all duration-200
                ${
                  selectedType === label
                    ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100 scale-105"
                    : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-[1.02]"
                }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[10px] font-medium text-stone-700 leading-tight text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 2: Product Details ──────────────────────── */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={formAction} className="space-y-5">
          {/* General error */}
          {state?.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {state.error}
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Your Product Name"
              required
              minLength={2}
              maxLength={200}
              disabled={isPending}
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-base"
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Material, fit, style notes..."
              maxLength={2000}
              rows={3}
              disabled={isPending}
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400"
            />
            {state?.fieldErrors?.description && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium">
                Category{" "}
                <span className="text-stone-400 font-normal">(optional)</span>
              </Label>
              <select
                id="categoryId"
                name="categoryId"
                disabled={isPending}
                className="flex h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 focus:border-emerald-400 focus:outline-none disabled:opacity-50"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Marketplace Category (M8.1 — Global Category Picker) */}
          {globalCategories.length > 0 && (
            <GlobalCategoryPicker
              categories={globalCategories}
              productName={name}
              suggestedSlug={suggestedSlug}
              disabled={isPending}
            />
          )}

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={true}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-10 h-6 rounded-full bg-stone-200 peer-checked:bg-emerald-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
              Show on public catalog
            </span>
          </label>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !name.trim()}
            className={`w-full rounded-xl h-12 text-base font-semibold transition-all duration-300
              ${
                name.trim()
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                  : ""
              }`}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              `Create ${name.trim() || "Product"} →`
            )}
          </Button>

          <p className="text-xs text-center text-stone-400">
            Next step: add photos and size/color variants
          </p>
        </form>
      </div>
    </div>
  );
}
