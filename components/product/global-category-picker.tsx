// ============================================================
// Component — Global Category Picker (Marketplace)
// ============================================================
// Hierarchical dropdown for platform-wide categories.
// Shows parent → child structure: "Men's Clothing → Hoodies"
// Includes auto-suggest based on product name (M8.3).
// ============================================================

"use client";

import { useState, useEffect } from "react";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";

interface GlobalCategoryPickerProps {
  categories: GlobalCategoryOption[];
  defaultValue?: string | null;
  productName?: string;
  suggestedSlug?: string | null;
  disabled?: boolean;
}

export function GlobalCategoryPicker({
  categories,
  defaultValue,
  productName,
  suggestedSlug,
  disabled = false,
}: GlobalCategoryPickerProps) {
  const [value, setValue] = useState(defaultValue || "");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const [suggestedCategoryName, setSuggestedCategoryName] = useState<string | null>(null);

  // Resolve suggested slug to category ID
  useEffect(() => {
    if (!suggestedSlug || value) {
      setShowSuggestion(false);
      return;
    }

    // Find category by slug in the tree
    for (const parent of categories) {
      if (parent.slug === suggestedSlug) {
        setSuggestedCategoryId(parent.id);
        setSuggestedCategoryName(parent.name);
        setShowSuggestion(true);
        return;
      }
      for (const child of parent.children) {
        if (child.slug === suggestedSlug) {
          setSuggestedCategoryId(child.id);
          setSuggestedCategoryName(`${parent.name} → ${child.name}`);
          setShowSuggestion(true);
          return;
        }
      }
    }
    setShowSuggestion(false);
  }, [suggestedSlug, categories, value]);

  const handleSuggestionAccept = () => {
    if (suggestedCategoryId) {
      setValue(suggestedCategoryId);
      setShowSuggestion(false);
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="globalCategoryId"
        className="text-sm font-medium text-stone-700"
      >
        Marketplace Category{" "}
        <span className="text-stone-400 font-normal">(optional)</span>
      </label>

      {/* Suggestion Banner (M8.3) */}
      {showSuggestion && suggestedCategoryName && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm">
          <span className="text-emerald-700">💡</span>
          <span className="text-emerald-700 flex-1">
            Suggested: <strong>{suggestedCategoryName}</strong>
          </span>
          <button
            type="button"
            onClick={handleSuggestionAccept}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowSuggestion(false)}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hierarchical Select */}
      <select
        id="globalCategoryId"
        name="globalCategoryId"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="flex h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 focus:border-emerald-400 focus:outline-none disabled:opacity-50"
      >
        <option value="">Not listed on marketplace</option>
        {categories.map((parent) => (
          <optgroup key={parent.id} label={`${parent.icon || ""} ${parent.name}`}>
            {/* Parent itself as an option */}
            <option value={parent.id}>
              {parent.icon || ""} {parent.name} (General)
            </option>
            {/* Children */}
            {parent.children.map((child) => (
              <option key={child.id} value={child.id}>
                &nbsp;&nbsp;{child.icon || ""} {child.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <p className="text-xs text-stone-400">
        Assigning a marketplace category makes your product discoverable on the{" "}
        <a href="/marketplace" target="_blank" className="text-emerald-500 hover:text-emerald-600 underline">
          TradeFeed Marketplace
        </a>
      </p>
    </div>
  );
}
