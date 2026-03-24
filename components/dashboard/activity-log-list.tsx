// ============================================================
// Component — Activity Log List
// ============================================================
// Displays a paginated, filterable list of shop activity logs.
// Human-readable messages with relative timestamps.
// ============================================================

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatActivityMessage } from "@/lib/config/activity-actions";

interface ActivityLog {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  metadata: string | null;
  createdAt: Date;
}

interface ActivityUser {
  userId: string;
  userName: string;
}

interface ActivityLogListProps {
  shopSlug: string;
  logs: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
  actionTypes: string[];
  users: ActivityUser[];
  currentAction?: string;
  currentUser?: string;
}

const ACTION_ICONS: Record<string, { icon: string; bg: string }> = {
  TEAM_MEMBER_INVITED: { icon: "✉️", bg: "bg-blue-100" },
  TEAM_MEMBER_REMOVED: { icon: "👤", bg: "bg-red-100" },
  TEAM_MEMBER_ROLE_CHANGED: { icon: "🔄", bg: "bg-purple-100" },
  TEAM_INVITE_ACCEPTED: { icon: "✅", bg: "bg-green-100" },
  TEAM_INVITE_REVOKED: { icon: "❌", bg: "bg-stone-100" },
  PRODUCT_CREATED: { icon: "📦", bg: "bg-emerald-100" },
  PRODUCT_UPDATED: { icon: "✏️", bg: "bg-amber-100" },
  PRODUCT_DELETED: { icon: "🗑️", bg: "bg-red-100" },
  ORDER_STATUS_CHANGED: { icon: "📋", bg: "bg-blue-100" },
};

const ACTION_LABELS: Record<string, string> = {
  TEAM_MEMBER_INVITED: "Team Invited",
  TEAM_MEMBER_REMOVED: "Team Removed",
  TEAM_MEMBER_ROLE_CHANGED: "Role Changed",
  TEAM_INVITE_ACCEPTED: "Invite Accepted",
  TEAM_INVITE_REVOKED: "Invite Revoked",
  PRODUCT_CREATED: "Product Created",
  PRODUCT_UPDATED: "Product Updated",
  PRODUCT_DELETED: "Product Deleted",
  ORDER_STATUS_CHANGED: "Order Status",
};

function relativeTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function parseMetadata(metadata: string | null): Record<string, unknown> | null {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}

export function ActivityLogList({
  shopSlug,
  logs,
  total,
  page,
  totalPages,
  actionTypes,
  users,
  currentAction,
  currentUser,
}: ActivityLogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`/dashboard/${shopSlug}/activity?${params.toString()}`);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`/dashboard/${shopSlug}/activity?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* ── Filters ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {/* Action filter */}
        <select
          value={currentAction ?? ""}
          onChange={(e) => updateFilter("action", e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        >
          <option value="">All actions</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action] ?? action}
            </option>
          ))}
        </select>

        {/* User filter */}
        <select
          value={currentUser ?? ""}
          onChange={(e) => updateFilter("user", e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        >
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.userName}
            </option>
          ))}
        </select>

        {/* Result count */}
        <span className="text-sm text-stone-400 self-center ml-auto">
          {total} event{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Log entries ─────────────────────────────── */}
      {logs.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-stone-600">No activity yet</p>
          <p className="text-xs text-stone-400 mt-1">
            Actions like creating products, managing orders, and inviting team members will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const meta = parseMetadata(log.metadata);
            const iconData = ACTION_ICONS[log.action] ?? { icon: "📝", bg: "bg-stone-100" };
            const message = formatActivityMessage(
              log.action,
              log.userName,
              log.entityName,
              meta,
            );

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50/80 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-full ${iconData.bg} flex items-center justify-center text-base flex-shrink-0 mt-0.5`}
                >
                  {iconData.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {message}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {relativeTime(log.createdAt)}
                  </p>
                </div>

                {/* Action badge */}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full flex-shrink-0 mt-1">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="text-sm px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
