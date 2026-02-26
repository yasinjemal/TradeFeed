// ============================================================
// Admin Audit Log — Client Component
// ============================================================
// Filterable, paginated audit trail showing every admin action.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface AuditEntry {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  details: string | null;
  createdAt: Date;
}

interface AdminAuditLogProps {
  entries: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
  actionTypes: string[];
  currentAction: string;
  currentEntityType: string;
}

const ENTITY_TYPES = ["", "shop", "category", "promotion", "user", "product"];

const ACTION_ICONS: Record<string, string> = {
  SHOP_VERIFY: "✅",
  SHOP_UNVERIFY: "❌",
  SHOP_DEACTIVATE: "🔒",
  SHOP_REACTIVATE: "🔓",
  SHOP_FEATURE: "⭐",
  SHOP_UNFEATURE: "☆",
  CATEGORY_CREATE: "📂",
  CATEGORY_UPDATE: "✏️",
  CATEGORY_DELETE: "🗑️",
  CATEGORY_REORDER: "↕️",
  PROMOTION_CANCEL: "🚫",
  USER_BAN: "🔨",
  USER_UNBAN: "🔓",
  PRODUCT_FLAG: "🚩",
  PRODUCT_UNFLAG: "✓",
};

const ACTION_COLORS: Record<string, string> = {
  SHOP_VERIFY: "text-emerald-400",
  SHOP_UNVERIFY: "text-amber-400",
  SHOP_DEACTIVATE: "text-red-400",
  SHOP_REACTIVATE: "text-emerald-400",
  SHOP_FEATURE: "text-amber-400",
  SHOP_UNFEATURE: "text-stone-400",
  CATEGORY_CREATE: "text-blue-400",
  CATEGORY_UPDATE: "text-blue-400",
  CATEGORY_DELETE: "text-red-400",
  CATEGORY_REORDER: "text-purple-400",
  PROMOTION_CANCEL: "text-red-400",
  USER_BAN: "text-red-400",
  USER_UNBAN: "text-emerald-400",
  PRODUCT_FLAG: "text-red-400",
  PRODUCT_UNFLAG: "text-emerald-400",
};

export function AdminAuditLog({
  entries,
  total,
  page,
  totalPages,
  actionTypes,
  currentAction,
  currentEntityType,
}: AdminAuditLogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function navigate(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => router.push(`/admin/audit-log?${params.toString()}`));
  }

  function formatTime(date: Date) {
    const d = new Date(date);
    return d.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={currentAction}
          onChange={(e) => navigate({ action: e.target.value, page: "" })}
          className="px-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        >
          <option value="">All Actions</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {ACTION_ICONS[a] || "•"} {a.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={currentEntityType}
          onChange={(e) => navigate({ entityType: e.target.value, page: "" })}
          className="px-3 py-2.5 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-300 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        >
          <option value="">All Entity Types</option>
          {ENTITY_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <p className="text-xs text-stone-600">{total} log entr{total !== 1 ? "ies" : "y"}</p>

      {/* Log Entries */}
      <div className="space-y-2">
        {entries.length === 0 && (
          <div className="text-center py-12 text-stone-600">
            No audit log entries found. Admin actions will appear here as they happen.
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-4 p-4 bg-stone-900/50 border border-stone-800 rounded-xl hover:border-stone-700 transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center text-lg flex-shrink-0">
              {ACTION_ICONS[entry.action] || "📋"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-stone-200">
                    <span className={`font-medium ${ACTION_COLORS[entry.action] || "text-stone-300"}`}>
                      {entry.action.replace(/_/g, " ")}
                    </span>
                    {entry.entityName && (
                      <>
                        {" "}
                        <span className="text-stone-500">→</span>{" "}
                        <span className="text-stone-300">{entry.entityName}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    by {entry.adminEmail}
                  </p>
                  {entry.details && (
                    <details className="mt-1">
                      <summary className="text-xs text-stone-600 cursor-pointer hover:text-stone-400">
                        Details
                      </summary>
                      <pre className="text-xs text-stone-500 mt-1 bg-stone-950 p-2 rounded overflow-x-auto max-w-md">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(entry.details), null, 2);
                          } catch {
                            return entry.details;
                          }
                        })()}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-stone-600">{formatTime(entry.createdAt)}</p>
                  <p className="text-[10px] text-stone-700 mt-0.5 uppercase tracking-wider">
                    {entry.entityType}
                  </p>
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
    </div>
  );
}
