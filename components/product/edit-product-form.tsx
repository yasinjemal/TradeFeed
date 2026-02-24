// ============================================================
// Component — Edit Product Form (Inline)
// ============================================================
// Inline edit for product name, description, category, status.
// Toggle between view and edit modes.
// ============================================================

"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import { updateProductAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlobalCategoryPicker } from "@/components/product/global-category-picker";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";

interface Category {
  id: string;
  name: string;
}

interface EditProductFormProps {
  shopSlug: string;
  productId: string;
  product: {
    name: string;
    description: string | null;
    isActive: boolean;
    categoryId: string | null;
    globalCategoryId: string | null;
    option1Label: string;
    option2Label: string;
  };
  categories: Category[];
  globalCategories?: GlobalCategoryOption[];
}

export function EditProductForm({
  shopSlug,
  productId,
  product,
  categories,
  globalCategories = [],
}: EditProductFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const boundAction = updateProductAction.bind(null, shopSlug, productId);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Close edit mode on success
  useEffect(() => {
    if (state?.success) {
      setIsEditing(false);
    }
  }, [state]);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="group w-full text-left rounded-xl border-2 border-stone-200 bg-white p-4 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              Product Details
            </p>
            <p className="text-sm font-semibold text-stone-900 truncate">
              {product.name}
            </p>
            {product.description && (
              <p className="text-xs text-stone-500 line-clamp-2">
                {product.description}
              </p>
            )}
            {product.globalCategoryId && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-medium">
                🏪 Marketplace
              </span>
            )}
          </div>
          <span className="text-stone-300 group-hover:text-emerald-500 transition-colors flex-shrink-0 ml-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-white p-5 shadow-sm shadow-emerald-50">
      <form ref={formRef} action={formAction} className="space-y-4">
        {/* General error */}
        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            ⚠️ {state.error}
          </div>
        )}

        {/* Product Name */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-name" className="text-xs font-medium text-stone-600">
            Product Name
          </Label>
          <Input
            id="edit-name"
            name="name"
            defaultValue={product.name}
            required
            minLength={2}
            maxLength={200}
            disabled={isPending}
            className="rounded-lg border-stone-200 focus:border-emerald-400 h-10"
          />
          {state?.fieldErrors?.name && (
            <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-description" className="text-xs font-medium text-stone-600">
            Description
          </Label>
          <Textarea
            id="edit-description"
            name="description"
            defaultValue={product.description ?? ""}
            maxLength={2000}
            rows={2}
            disabled={isPending}
            className="rounded-lg border-stone-200 focus:border-emerald-400"
          />
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="edit-categoryId" className="text-xs font-medium text-stone-600">
              Category
            </Label>
            <select
              id="edit-categoryId"
              name="categoryId"
              defaultValue={product.categoryId ?? ""}
              disabled={isPending}
              className="flex h-10 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:border-emerald-400 focus:outline-none disabled:opacity-50"
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

        {/* Marketplace Category (M8.1) */}
        {globalCategories.length > 0 && (
          <div className="space-y-1.5">
            <GlobalCategoryPicker
              categories={globalCategories}
              defaultValue={product.globalCategoryId}
              disabled={isPending}
            />
          </div>
        )}

        {/* Variant Labels (preserved) */}
        <input type="hidden" name="option1Label" value={product.option1Label} />
        <input type="hidden" name="option2Label" value={product.option2Label} />

        {/* Active Toggle */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product.isActive}
              disabled={isPending}
              className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-stone-200 peer-checked:bg-emerald-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-sm text-stone-600">Show on public catalog</span>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={isPending}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 h-9 px-4"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="rounded-lg h-9 text-stone-500"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
