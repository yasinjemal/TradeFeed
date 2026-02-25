// ============================================================
// Admin Shop List — Client Component
// ============================================================
// Interactive shop management table with:
// - Search bar + filter tabs
// - Verify/unverify toggle
// - Activate/deactivate toggle
// - Pagination
// - Owner info, plan, product count
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  verifyShopAction,
  unverifyShopAction,
  deactivateShopAction,
  reactivateShopAction,
  toggleFeaturedShopAction,
} from "@/app/actions/admin";

interface AdminShop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  whatsappNumber: string;
  city: string | null;
  province: string | null;
  isActive: boolean;
  isVerified: boolean;
  isFeaturedShop: boolean;
  logoUrl: string | null;
  createdAt: Date;
  _count: { products: number };
  subscription: {
    status: string;
    plan: { name: string; slug: string };
  } | null;
  users: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }[];
}

interface AdminShopListProps {
  shops: AdminShop[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentFilter: string;
}

const FILTERS = [
  { key: "all", label: "All Shops" },
  { key: "unverified", label: "Unverified" },
  { key: "verified", label: "Verified" },
  { key: "inactive", label: "Inactive" },
] as const;

export function AdminShopList({
  shops,
  total,
  page,
  totalPages,
  currentSearch,
  currentFilter,
}: AdminShopListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Navigation helpers ──────────────────────────────────
  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // Reset to page 1 when search/filter changes
    if (!updates.page) params.delete("page");
    router.push(`/admin?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ search });
  }

  // ── Action handlers ─────────────────────────────────────
  async function handleAction(
    action: (shopId: string) => Promise<{ success: boolean; message?: string; error?: string }>,
    shopId: string
  ) {
    startTransition(async () => {
      const result = await action(shopId);
      if (result.success) {
        setToast({ type: "success", message: result.message || "Done" });
      } else {
        setToast({ type: "error", message: result.error || "Failed" });
      }
      setTimeout(() => setToast(null), 3000);
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Search + Filter ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shops by name, slug, or city..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-sm text-stone-300 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50"
            />
          </div>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-stone-900 rounded-xl p-1 border border-stone-800">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => updateParams({ filter: f.key === "all" ? "" : f.key })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentFilter === f.key
                  ? "bg-stone-700 text-white"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ────────────────────────────────── */}
      <p className="text-xs text-stone-600">
        {total} shop{total !== 1 ? "s" : ""} found
        {currentSearch && ` for "${currentSearch}"`}
      </p>

      {/* ── Shop Cards ───────────────────────────────────── */}
      {shops.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-600 text-sm">No shops match your criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => {
            const owner = shop.users[0]?.user;
            const planName = shop.subscription?.plan.name || "No plan";
            const planSlug = shop.subscription?.plan.slug || "";

            return (
              <div
                key={shop.id}
                className={`rounded-xl border p-4 transition-all ${
                  !shop.isActive
                    ? "bg-stone-900/50 border-red-900/30 opacity-70"
                    : shop.isVerified
                    ? "bg-stone-900 border-emerald-900/30"
                    : "bg-stone-900 border-stone-800"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-700 to-stone-800 flex items-center justify-center flex-shrink-0">
                    {shop.logoUrl ? (
                      <Image
                        src={shop.logoUrl}
                        alt={shop.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-stone-400 font-bold text-lg">
                        {shop.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-stone-200 text-sm">
                        {shop.name}
                      </h3>
                      {shop.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                      {shop.isFeaturedShop && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                      {!shop.isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          planSlug === "pro"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-stone-800 text-stone-500"
                        }`}
                      >
                        {planName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-stone-500">
                      <span className="font-mono">/{shop.slug}</span>
                      {shop.city && (
                        <span>📍 {shop.city}{shop.province ? `, ${shop.province}` : ""}</span>
                      )}
                      <span>{shop._count.products} products</span>
                      {owner && (
                        <span className="text-stone-600">
                          Owner: {owner.firstName || ""} {owner.lastName || ""} ({owner.email})
                        </span>
                      )}
                      <span className="text-stone-600">
                        Joined {new Date(shop.createdAt).toLocaleDateString("en-ZA")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Verify/Unverify */}
                    {shop.isVerified ? (
                      <button
                        onClick={() => handleAction(unverifyShopAction, shop.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-800 transition-all disabled:opacity-50"
                      >
                        Unverify
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(verifyShopAction, shop.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50"
                      >
                        Verify
                      </button>
                    )}

                    {/* M7.2 — Featured toggle */}
                    <button
                      onClick={() =>
                        handleAction(
                          (id: string) => toggleFeaturedShopAction(id, !shop.isFeaturedShop),
                          shop.id
                        )
                      }
                      disabled={isPending}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                        shop.isFeaturedShop
                          ? "border-amber-700 text-amber-400 hover:text-stone-400 hover:border-stone-700"
                          : "border-stone-700 text-stone-400 hover:text-amber-400 hover:border-amber-700"
                      }`}
                    >
                      {shop.isFeaturedShop ? "Unfeature" : "Feature"}
                    </button>

                    {/* Activate/Deactivate */}
                    {shop.isActive ? (
                      <button
                        onClick={() => handleAction(deactivateShopAction, shop.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-700 text-stone-400 hover:text-red-400 hover:border-red-800 transition-all disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(reactivateShopAction, shop.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}

                    {/* View catalog */}
                    <a
                      href={`/catalog/${shop.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-700 text-stone-400 hover:text-stone-200 transition-all"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => updateParams({ page: String(page - 1) })}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <span className="text-xs text-stone-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => updateParams({ page: String(page + 1) })}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-800 text-stone-400 hover:text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
