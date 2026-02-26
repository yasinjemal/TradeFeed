// ============================================================
// Admin User List — Client Component
// ============================================================
// Interactive user management table with search, filters,
// ban/unban functionality, and pagination.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { banUserAction, unbanUserAction } from "@/app/actions/admin";

interface AdminUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  bannedAt: Date | null;
  createdAt: Date;
  shopCount: number;
  shops: { id: string; name: string; slug: string }[];
}

interface AdminUserListProps {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
  currentSearch: string;
  currentFilter: string;
}

const FILTERS = [
  { key: "all", label: "All Users" },
  { key: "active", label: "Active" },
  { key: "banned", label: "Banned" },
] as const;

export function AdminUserList({
  users,
  total,
  page,
  totalPages,
  currentSearch,
  currentFilter,
}: AdminUserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [banModal, setBanModal] = useState<{ userId: string; email: string } | null>(null);
  const [banReason, setBanReason] = useState("");

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
    startTransition(() => router.push(`/admin/users?${params.toString()}`));
  }

  async function handleBan() {
    if (!banModal || !banReason.trim()) return;
    const result = await banUserAction(banModal.userId, banReason.trim());
    if (result.success) {
      showToast("success", result.message);
      setBanModal(null);
      setBanReason("");
      startTransition(() => router.refresh());
    } else {
      showToast("error", result.error);
    }
  }

  async function handleUnban(userId: string) {
    const result = await unbanUserAction(userId);
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
            placeholder="Search by email, name, or Clerk ID..."
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
      <p className="text-xs text-stone-600">{total} user{total !== 1 ? "s" : ""} found</p>

      {/* User Table */}
      <div className="border border-stone-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-900/80 text-stone-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Shops</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/50">
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-stone-600">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-stone-900/40 transition-colors">
                  {/* Name + Avatar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-400 overflow-hidden">
                        {user.imageUrl ? (
                          <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-stone-200 font-medium text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-stone-600 text-xs font-mono truncate max-w-[140px]">
                          {user.clerkId}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3 text-stone-400 text-sm">{user.email}</td>
                  {/* Shops */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {user.shopCount > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.shops.map((s) => (
                          <span
                            key={s.id}
                            className="inline-block px-2 py-0.5 bg-stone-800 text-stone-400 rounded text-xs"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-stone-600 text-xs">No shops</span>
                    )}
                  </td>
                  {/* Joined */}
                  <td className="px-4 py-3 text-stone-600 text-xs hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    {user.isBanned ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 rounded text-xs font-medium">
                          🚫 Banned
                        </span>
                        {user.bannedReason && (
                          <p className="text-stone-600 text-xs mt-1 truncate max-w-[150px]" title={user.bannedReason}>
                            {user.bannedReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-xs font-medium">
                        ✓ Active
                      </span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {user.isBanned ? (
                      <button
                        onClick={() => handleUnban(user.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => setBanModal({ userId: user.id, email: user.email })}
                        disabled={isPending}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Ban User</h3>
            <p className="text-stone-500 text-sm mb-4">
              Ban <span className="text-red-400">{banModal.email}</span> from the platform.
            </p>
            <label className="block text-xs text-stone-500 mb-1.5">Reason (required)</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Policy violation, spam, etc."
              rows={3}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-red-500/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setBanModal(null);
                  setBanReason("");
                }}
                className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={!banReason.trim() || isPending}
                className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
              >
                {isPending ? "Banning..." : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
