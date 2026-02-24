// ============================================================
// Component — Category Manager (Inline CRUD)
// ============================================================
// Add, rename, and delete categories inline.
// Shows product count per category.
// ============================================================

"use client";

import { useState, useActionState, useCallback, useRef, useEffect } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/actions/category";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface CategoryManagerProps {
  categories: Category[];
  shopSlug: string;
}

export function CategoryManager({ categories, shopSlug }: CategoryManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create action
  const boundCreate = createCategoryAction.bind(null, shopSlug);
  const [createState, createAction, isCreating] = useActionState(boundCreate, null);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Reset form after successful create
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (createState?.success) {
      formRef.current?.reset();
    }
  }, [createState]);

  const startEdit = useCallback((cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  }, []);

  const handleUpdate = useCallback(
    async (categoryId: string) => {
      if (!editName.trim()) return;
      const formData = new FormData();
      formData.set("name", editName);
      await updateCategoryAction(shopSlug, categoryId, null, formData);
      setEditingId(null);
    },
    [editName, shopSlug]
  );

  const handleDelete = useCallback(
    async (categoryId: string) => {
      setDeletingId(categoryId);
      await deleteCategoryAction(shopSlug, categoryId);
      setDeletingId(null);
    },
    [shopSlug]
  );

  return (
    <div className="space-y-6">
      {/* ── Add Category Form ─────────────────────────────── */}
      <form ref={formRef} action={createAction} className="flex items-start gap-3">
        <div className="flex-1 space-y-1">
          <Input
            name="name"
            placeholder="New category name..."
            required
            minLength={2}
            maxLength={100}
            disabled={isCreating}
            className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-11"
          />
          {createState?.fieldErrors?.name && (
            <p className="text-xs text-red-600">{createState.fieldErrors.name[0]}</p>
          )}
          {createState?.error && (
            <p className="text-xs text-red-600">{createState.error}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isCreating}
          className="rounded-xl h-11 px-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-md hover:shadow-emerald-200"
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            "Add Category"
          )}
        </Button>
      </form>

      {/* ── Category List ─────────────────────────────────── */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏷️</div>
          <h3 className="text-lg font-semibold text-stone-900">No categories yet</h3>
          <p className="text-sm text-stone-500 mt-1">
            Create categories to organize your products — buyers can filter by them
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`group flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200
                ${editingId === cat.id ? "border-emerald-400 bg-emerald-50/30" : "border-stone-200 bg-white hover:border-stone-300"} 
                ${deletingId === cat.id ? "opacity-40 scale-[0.98]" : ""}`}
            >
              {editingId === cat.id ? (
                /* ── Editing Mode ──────────────────────────── */
                <>
                  <Input
                    ref={inputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border-stone-300 h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUpdate(cat.id);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(cat.id)}
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-600 h-9"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg h-9 text-stone-500"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                /* ── Display Mode ──────────────────────────── */
                <>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-600 text-sm font-bold">
                      {cat.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {cat.name}
                    </p>
                    <p className="text-xs text-stone-400">
                      {cat._count.products} product{cat._count.products !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                      title="Rename"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deletingId !== null}
                      className="p-2 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
