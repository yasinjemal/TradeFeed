// ============================================================
// Admin Category Manager — M7.1
// ============================================================
// Full CRUD for global categories with tree view.
// Create, edit, reorder, deactivate categories.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  reorderCategoriesAction,
  deleteCategoryAction,
} from "@/app/actions/admin";
import type { AdminCategory } from "@/lib/db/admin";

interface AdminCategoryManagerProps {
  categories: AdminCategory[];
}

type ModalMode = "create" | "edit" | null;

interface FormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentId: string;
  displayOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  parentId: "",
  displayOrder: 0,
  isActive: true,
};

export function AdminCategoryManager({ categories }: AdminCategoryManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function openCreate(parentId?: string) {
    setForm({ ...EMPTY_FORM, parentId: parentId ?? "" });
    setEditingId(null);
    setModalMode("create");
  }

  function openEdit(cat: AdminCategory) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon: cat.icon ?? "",
      parentId: cat.parentId ?? "",
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
    });
    setEditingId(cat.id);
    setModalMode("edit");
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      ...(modalMode === "create" ? { slug: generateSlug(name) } : {}),
    }));
  }

  function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      showToast("error", "Name and slug are required.");
      return;
    }

    startTransition(async () => {
      let result;
      if (modalMode === "create") {
        result = await createCategoryAction({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          icon: form.icon.trim() || undefined,
          parentId: form.parentId || undefined,
          displayOrder: form.displayOrder,
        });
      } else if (editingId) {
        result = await updateCategoryAction(editingId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          icon: form.icon.trim() || null,
          parentId: form.parentId || null,
          displayOrder: form.displayOrder,
          isActive: form.isActive,
        });
      }

      if (result?.success) {
        showToast("success", result.message);
        setModalMode(null);
      } else {
        showToast("error", result?.error ?? "Something went wrong.");
      }
    });
  }

  function handleDelete(categoryId: string, categoryName: string) {
    if (!confirm(`Delete "${categoryName}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);
      if (result.success) {
        showToast("success", result.message);
      } else {
        showToast("error", result.error);
      }
    });
  }

  function handleMoveUp(cat: AdminCategory, siblings: AdminCategory[]) {
    const idx = siblings.findIndex((s) => s.id === cat.id);
    if (idx <= 0) return;

    const updates = siblings.map((s, i) => {
      if (i === idx - 1) return { id: s.id, displayOrder: idx };
      if (i === idx) return { id: s.id, displayOrder: idx - 1 };
      return { id: s.id, displayOrder: i };
    });

    startTransition(async () => {
      const result = await reorderCategoriesAction(updates);
      if (result.success) showToast("success", "Reordered.");
      else showToast("error", result.error);
    });
  }

  function handleMoveDown(cat: AdminCategory, siblings: AdminCategory[]) {
    const idx = siblings.findIndex((s) => s.id === cat.id);
    if (idx < 0 || idx >= siblings.length - 1) return;

    const updates = siblings.map((s, i) => {
      if (i === idx) return { id: s.id, displayOrder: idx + 1 };
      if (i === idx + 1) return { id: s.id, displayOrder: idx };
      return { id: s.id, displayOrder: i };
    });

    startTransition(async () => {
      const result = await reorderCategoriesAction(updates);
      if (result.success) showToast("success", "Reordered.");
      else showToast("error", result.error);
    });
  }

  const totalProducts = categories.reduce((s, c) => s + c.productCount, 0);
  const totalChildren = categories.reduce((s, c) => s + c.children.length, 0);

  return (
    <div className="space-y-6">
      {/* ── Toast ──────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">Parent Categories</p>
          <p className="text-2xl font-bold text-stone-300">{categories.length}</p>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">Sub-categories</p>
          <p className="text-2xl font-bold text-stone-300">{totalChildren}</p>
        </div>
        <div className="rounded-xl border border-stone-800 bg-stone-900 p-4">
          <p className="text-[11px] uppercase tracking-wider text-stone-500 mb-1">Products Mapped</p>
          <p className="text-2xl font-bold text-stone-300">{totalProducts.toLocaleString()}</p>
        </div>
      </div>

      {/* ── Action Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-stone-600">
          Drag to reorder. Click to edit. Toggle to activate/deactivate.
        </p>
        <button
          type="button"
          onClick={() => openCreate()}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Category
        </button>
      </div>

      {/* ── Category Tree ──────────────────────────────── */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-stone-600">
          <p className="text-lg font-medium">No categories yet</p>
          <p className="text-sm mt-1">Create your first category to organize the marketplace.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((parent, idx) => (
            <div key={parent.id} className="rounded-xl border border-stone-800 bg-stone-900 overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center gap-3 p-4">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(parent, categories)}
                    disabled={isPending || idx === 0}
                    className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors"
                    title="Move up"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(parent, categories)}
                    disabled={isPending || idx === categories.length - 1}
                    className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors"
                    title="Move down"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {/* Icon */}
                <span className="text-2xl w-8 text-center">{parent.icon || "📁"}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-200">{parent.name}</h3>
                    <span className="text-[10px] font-mono text-stone-600">/{parent.slug}</span>
                    {!parent.isActive && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {parent.productCount} products · {parent.children.length} sub-categories
                    {parent.description && <span> · {parent.description}</span>}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openCreate(parent.id)}
                    disabled={isPending}
                    className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-stone-700 text-stone-400 hover:text-emerald-400 hover:border-emerald-800 transition-all"
                    title="Add sub-category"
                  >
                    + Sub
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(parent)}
                    disabled={isPending}
                    className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(parent.id, parent.name)}
                    disabled={isPending}
                    className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-800 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Children */}
              {parent.children.length > 0 && (
                <div className="border-t border-stone-800 bg-stone-950/50">
                  {parent.children.map((child, childIdx) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-stone-800/50 last:border-b-0"
                    >
                      {/* Indent + Reorder */}
                      <div className="w-6" />
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(child, parent.children)}
                          disabled={isPending || childIdx === 0}
                          className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(child, parent.children)}
                          disabled={isPending || childIdx === parent.children.length - 1}
                          className="text-stone-600 hover:text-stone-300 disabled:opacity-20 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>

                      <span className="text-lg w-6 text-center">{child.icon || "📄"}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-stone-300">{child.name}</p>
                          <span className="text-[10px] font-mono text-stone-600">/{child.slug}</span>
                          {!child.isActive && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600">{child.productCount} products</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(child)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-stone-700 text-stone-500 hover:text-stone-200 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(child.id, child.name)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-stone-700 text-stone-500 hover:text-red-400 hover:border-red-800 transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────── */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-white mb-4">
              {modalMode === "create" ? "New Category" : "Edit Category"}
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Hoodies & Sweaters"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="hoodies-sweaters"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 font-mono placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Icon */}
                <div>
                  <label className="text-xs font-semibold text-stone-400 block mb-1">Icon (emoji)</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="👕"
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="text-xs font-semibold text-stone-400 block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                </div>
              </div>

              {/* Parent */}
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  <option value="">None (top-level)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} disabled={cat.id === editingId}>
                      {cat.icon || "📁"} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active toggle (edit only) */}
              {modalMode === "edit" && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      form.isActive ? "bg-emerald-500" : "bg-stone-700"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.isActive ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-stone-400">
                    {form.isActive ? "Active" : "Inactive"} — {form.isActive ? "visible on marketplace" : "hidden from marketplace"}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || !form.name.trim() || !form.slug.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-stone-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                {isPending && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {modalMode === "create" ? "Create Category" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
