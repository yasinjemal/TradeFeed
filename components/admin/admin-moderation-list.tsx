// ============================================================
// Admin Moderation List — Client Component
// ============================================================
// Product moderation table with search, filters, flag/unflag
// functionality, and pagination.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { flagProductAction, unflagProductAction } from "@/app/actions/admin";

interface FlaggedProduct {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  flaggedAt: Date | null;
  createdAt: Date;
  imageUrl: string | null;
  shop: { id: string; name: string; slug: string };
  variantCount: number;
}

interface AdminModerationListProps {
  products: FlaggedProduct[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentFilter: string;
}

const FILTERS = [
  { key: "all", label: "All Products" },
  { key: "flagged", label: "🚩 Flagged" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

export function AdminModerationList({
  products,
  total,
  page,
  totalPages,
  currentSearch,
  currentFilter,
}: AdminModerationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [flagModal, setFlagModal] = useState<{ productId: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => router.push(`/admin/moderation?${params.toString()}`));
  }

  async function handleFlag() {
    if (!flagModal || !flagReason.trim()) return;
    const result = await flagProductAction(flagModal.productId, flagReason.trim());
    if (result.success) {
      showToast("success", result.message);
      setFlagModal(null);
      setFlagReason("");
      startTransition(() => router.refresh());
    } else {
      showToast("error", result.error);
    }
  }

  async function handleUnflag(productId: string) {
    const result = await unflagProductAction(productId);
    if (result.success) {
      showToast("success", result.message);
      startTransition(() => router.refresh());
    } else {
      showToast("error", result.error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search, page: "" });
          }}
          className="flex-1"
        >
          <input
            type="text"
            placeholder="Search by product name or shop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-red-500/50"
          />
        </form>
        <div className="flex gap-1 bg-stone-900 rounded-lg p-1 border border-stone-800">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => navigate({ filter: f.key === "all" ? "" : f.key, page: "" })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                (currentFilter || "all") === f.key
                  ? "bg-red-500/20 text-red-400"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-stone-600">{total} product{total !== 1 ? "s" : ""} found</p>

      {/* Product Grid */}
      <div className="grid gap-3">
        {products.length === 0 && (
          <div className="text-center py-12 text-stone-600">No products found.</div>
        )}
        {products.map((product) => (
          <div
            key={product.id}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
              product.isFlagged
                ? "bg-red-500/5 border-red-500/20"
                : "bg-stone-900/50 border-stone-800 hover:border-stone-700"
            }`}
          >
            {/* Image */}
            <div className="w-16 h-16 rounded-lg bg-stone-800 overflow-hidden flex-shrink-0">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-600 text-xl">
                  📦
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-stone-200 flex items-center gap-2">
                    {product.name}
                    {product.isFlagged && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-xs font-medium">
                        🚩 Flagged
                      </span>
                    )}
                    {!product.isActive && !product.isFlagged && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-800 text-stone-500 rounded text-xs">
                        Inactive
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {product.shop.name} · {product.variantCount} variant{product.variantCount !== 1 ? "s" : ""}
                  </p>
                  {product.description && (
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2">{product.description}</p>
                  )}
                  {product.isFlagged && product.flagReason && (
                    <p className="text-xs text-red-400/70 mt-1">
                      Reason: {product.flagReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {product.isFlagged ? (
                    <button
                      onClick={() => handleUnflag(product.id)}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      ✓ Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => setFlagModal({ productId: product.id, name: product.name })}
                      disabled={isPending}
                      className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      🚩 Flag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(page - 1) })}
              disabled={page <= 1 || isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-stone-400 border border-stone-800 hover:border-stone-700 transition-colors disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => navigate({ page: String(page + 1) })}
              disabled={page >= totalPages || isPending}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-stone-900 text-stone-400 border border-stone-800 hover:border-stone-700 transition-colors disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {flagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Flag Product</h3>
            <p className="text-stone-500 text-sm mb-4">
              Flag <span className="text-red-400">&ldquo;{flagModal.name}&rdquo;</span> for a policy violation. This will deactivate the listing.
            </p>
            <label className="block text-xs text-stone-500 mb-1.5">Reason (required)</label>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Prohibited item, misleading description, etc."
              rows={3}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setFlagModal(null);
                  setFlagReason("");
                }}
                className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFlag}
                disabled={!flagReason.trim() || isPending}
                className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isPending ? "Flagging..." : "🚩 Flag Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
