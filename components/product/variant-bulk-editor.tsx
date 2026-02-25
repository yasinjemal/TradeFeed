// ============================================================
// Component — Variant Bulk Editor
// ============================================================
// Spreadsheet-like table for batch editing variant price + stock.
// Tracks dirty state per row, saves all changes in one action.
// ============================================================

"use client";

import { useState, useTransition, useCallback } from "react";
import { bulkUpdateVariantsAction, deleteVariantAction } from "@/app/actions/product";
import { formatZAR } from "@/types";
import { toast } from "sonner";

interface Variant {
  id: string;
  size: string;
  color: string | null;
  priceInCents: number;
  stock: number;
  sku: string | null;
}

interface VariantBulkEditorProps {
  variants: Variant[];
  shopSlug: string;
  productId: string;
  option1Label?: string;
  option2Label?: string;
}

// ── Color hex map (shared with variant-grid) ──────────────

const COLOR_HEX: Record<string, string> = {
  Black: "#000000", White: "#FFFFFF", Navy: "#1B2A4A", Grey: "#808080",
  Charcoal: "#333333", Red: "#DC2626", Burgundy: "#800020", Blue: "#2563EB",
  "Royal Blue": "#1E40AF", "Sky Blue": "#7DD3FC", Green: "#16A34A",
  Olive: "#808000", Khaki: "#C3B091", Brown: "#92400E", Tan: "#D2B48C",
  Beige: "#F5F5DC", Cream: "#FFFDD0", Pink: "#EC4899", Purple: "#7C3AED",
  Orange: "#F97316", Yellow: "#FACC15", Coral: "#FF7F50", Teal: "#14B8A6",
  Maroon: "#800000",
};

const LIGHT_COLORS = new Set(["White", "Cream", "Beige", "Yellow", "Khaki", "Tan", "Sky Blue"]);

interface EditState {
  priceInRands: string;
  stock: string;
  sku: string;
}

export function VariantBulkEditor({
  variants,
  shopSlug,
  productId,
  option1Label = "Size",
  option2Label = "Color",
}: VariantBulkEditorProps) {
  const [isPending, startTransition] = useTransition();

  // Initialize editable state from server data
  const initEditState = useCallback(
    () =>
      Object.fromEntries(
        variants.map((v) => [
          v.id,
          {
            priceInRands: (v.priceInCents / 100).toFixed(2),
            stock: v.stock.toString(),
            sku: v.sku ?? "",
          },
        ])
      ) as Record<string, EditState>,
    [variants]
  );

  const [editState, setEditState] = useState<Record<string, EditState>>(initEditState);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  // Track which field is being edited for visual feedback
  const handleChange = (variantId: string, field: keyof EditState, value: string) => {
    setEditState((prev) => {
      const current = prev[variantId];
      if (!current) return prev;
      return {
        ...prev,
        [variantId]: { ...current, [field]: value } as EditState,
      };
    });
    setDirtyIds((prev) => new Set(prev).add(variantId));
  };

  // Check if a row differs from original
  const isDirty = (variantId: string) => dirtyIds.has(variantId);

  const dirtyCount = dirtyIds.size;

  // Save all changed variants
  const handleSaveAll = () => {
    const updates = Array.from(dirtyIds)
      .filter((id) => editState[id] != null)
      .map((id) => {
        const s = editState[id]!;
        return {
          variantId: id,
          priceInRands: s.priceInRands,
          stock: s.stock,
          sku: s.sku,
        };
      });

    if (updates.length === 0) return;

    startTransition(async () => {
      const result = await bulkUpdateVariantsAction(shopSlug, productId, updates);
      if (result.success) {
        toast.success(`${result.updatedCount} variant${result.updatedCount !== 1 ? "s" : ""} updated`);
        setDirtyIds(new Set());
      } else {
        toast.error(result.error ?? "Failed to update variants");
      }
    });
  };

  // Delete a single variant
  const handleDelete = (variantId: string) => {
    if (!confirm("Delete this variant? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteVariantAction(shopSlug, productId, variantId);
      if (result.success) {
        toast.success("Variant deleted");
        // Remove from dirty set
        setDirtyIds((prev) => {
          const next = new Set(prev);
          next.delete(variantId);
          return next;
        });
      } else {
        toast.error(result.error ?? "Failed to delete variant");
      }
    });
  };

  // Reset all edits
  const handleReset = () => {
    setEditState(initEditState());
    setDirtyIds(new Set());
  };

  const isOption2Color =
    option2Label.toLowerCase() === "color" || option2Label.toLowerCase() === "shade";

  if (variants.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-stone-200 py-12 text-center">
        <div className="text-4xl mb-3">📏</div>
        <p className="text-sm font-medium text-stone-500">No variants yet</p>
        <p className="text-xs text-stone-400 mt-1">
          Use the quick creator above to add {option1Label.toLowerCase()}s and{" "}
          {option2Label.toLowerCase()}s
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {dirtyCount > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-emerald-800">
            {dirtyCount} variant{dirtyCount !== 1 ? "s" : ""} changed
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-lg
                hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isPending}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg
                hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>Save All</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="text-left px-3 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">
                {option1Label}
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider">
                {option2Label}
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider w-32">
                Price (R)
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider w-24">
                Stock
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-stone-600 text-xs uppercase tracking-wider w-28">
                SKU
              </th>
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {variants.map((v, idx) => {
              const state = editState[v.id];
              if (!state) return null;

              const colorHex = v.color ? (COLOR_HEX[v.color] ?? null) : null;
              const isLight = LIGHT_COLORS.has(v.color ?? "");
              const dirty = isDirty(v.id);

              return (
                <tr
                  key={v.id}
                  className={`border-b border-stone-100 last:border-0 transition-colors ${
                    dirty ? "bg-amber-50/60" : idx % 2 === 0 ? "bg-white" : "bg-stone-50/30"
                  }`}
                >
                  {/* Option1 (Size) — read-only */}
                  <td className="px-3 py-2">
                    <span className="font-semibold text-stone-900">{v.size}</span>
                  </td>

                  {/* Option2 (Color) — read-only */}
                  <td className="px-3 py-2">
                    {v.color ? (
                      <div className="flex items-center gap-1.5">
                        {isOption2Color && colorHex ? (
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 ${isLight ? "border border-stone-300" : ""}`}
                            style={{ backgroundColor: colorHex }}
                          />
                        ) : null}
                        <span className="text-stone-700">{v.color}</span>
                      </div>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>

                  {/* Price — editable */}
                  <td className="px-3 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">R</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="999999"
                        value={state.priceInRands}
                        onChange={(e) => handleChange(v.id, "priceInRands", e.target.value)}
                        disabled={isPending}
                        className={`w-full pl-6 pr-2 py-1.5 text-sm rounded-lg border transition-colors
                          focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                          disabled:opacity-50
                          ${dirty ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}
                      />
                    </div>
                  </td>

                  {/* Stock — editable */}
                  <td className="px-3 py-1.5">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="999999"
                      value={state.stock}
                      onChange={(e) => handleChange(v.id, "stock", e.target.value)}
                      disabled={isPending}
                      className={`w-full px-2 py-1.5 text-sm rounded-lg border transition-colors
                        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                        disabled:opacity-50
                        ${dirty ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}
                        ${parseInt(state.stock) === 0 ? "text-red-600 font-medium" : ""}`}
                    />
                  </td>

                  {/* SKU — editable */}
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      maxLength={100}
                      value={state.sku}
                      onChange={(e) => handleChange(v.id, "sku", e.target.value)}
                      disabled={isPending}
                      placeholder="—"
                      className={`w-full px-2 py-1.5 text-sm rounded-lg border transition-colors
                        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                        disabled:opacity-50 placeholder:text-stone-300
                        ${dirty ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}
                    />
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={isPending}
                      title="Delete variant"
                      className="w-7 h-7 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50
                        transition-colors disabled:opacity-50 flex items-center justify-center mx-auto"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Summary footer */}
          <tfoot>
            <tr className="bg-stone-50 border-t border-stone-200">
              <td colSpan={2} className="px-3 py-2 text-xs font-medium text-stone-500">
                {variants.length} variant{variants.length !== 1 ? "s" : ""}
              </td>
              <td className="px-3 py-2 text-xs font-medium text-stone-500">
                {(() => {
                  const prices = variants.map((v) => v.priceInCents);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return min === max
                    ? formatZAR(min)
                    : `${formatZAR(min)} – ${formatZAR(max)}`;
                })()}
              </td>
              <td className="px-3 py-2 text-xs font-medium text-stone-500">
                {variants.reduce((sum, v) => sum + v.stock, 0).toLocaleString()} total
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
