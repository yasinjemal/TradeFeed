// ============================================================
// Component — Combo Category Manager
// ============================================================
// Inline add/delete for combo categories (e.g. "Double Combo").
// ============================================================

"use client";

import { useActionState, useState, useTransition } from "react";
import { createComboCategoryAction, deleteComboCategoryAction } from "@/app/actions/combo";
import { toast } from "sonner";

interface ComboCategoryManagerProps {
  categories: { id: string; name: string; _count: { combos: number } }[];
  shopSlug: string;
}

export function ComboCategoryManager({ categories, shopSlug }: ComboCategoryManagerProps) {
  const [state, formAction, pending] = useActionState(
    createComboCategoryAction.bind(null, shopSlug),
    null
  );
  const [deleting, setDeleting] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("Delete this combo category? Combos will be uncategorized.")) return;
    setDeleting(id);
    startTransition(async () => {
      const result = await deleteComboCategoryAction(shopSlug, id);
      if (!result.success) toast.error(result.error ?? "Failed to delete");
      else toast.success("Category deleted");
      setDeleting(null);
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/60 space-y-4">
      <h2 className="text-lg font-semibold text-stone-900">📂 Combo Categories</h2>
      <p className="text-xs text-stone-500">
        Organize your combos by type — e.g. &quot;Double Combo&quot;, &quot;Triple Combo&quot;, &quot;Summer Deals&quot;
      </p>

      {/* Category List */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-sm"
            >
              <span className="font-medium text-stone-700">{cat.name}</span>
              <span className="text-xs text-stone-400">({cat._count.combos})</span>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                disabled={deleting === cat.id}
                className="ml-0.5 text-stone-400 hover:text-red-500 transition-colors"
                title="Delete category"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && (
        <p className="text-sm text-stone-400 italic">No combo categories yet</p>
      )}

      {/* Add Form */}
      <form action={formAction} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="New category name..."
          className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          required
          minLength={2}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
      </form>

      {state?.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state?.fieldErrors?.name && (
        <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
      )}
    </div>
  );
}
