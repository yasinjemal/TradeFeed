// ============================================================
// Page — Activity Logs (/dashboard/[slug]/activity)
// ============================================================
// Audit trail showing all shop-level mutations with filters
// for action type, user, and pagination.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getShopActivityLogs, getShopActivityActionTypes, getShopActivityUsers } from "@/lib/db/activity-logs";
import { getShopBySlug } from "@/lib/db/shops";
import { ActivityLogList } from "@/components/dashboard/activity-log-list";

interface ActivityPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; action?: string; user?: string }>;
}

export default async function ActivityPage({ params, searchParams }: ActivityPageProps) {
  const { slug } = await params;
  const search = await searchParams;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  // Only OWNER and MANAGER can view activity logs
  if (access.role === "STAFF") return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const page = Math.max(1, parseInt(search.page ?? "1", 10) || 1);

  const [logsData, actionTypes, users] = await Promise.all([
    getShopActivityLogs({
      shopId: shop.id,
      page,
      action: search.action || undefined,
      userId: search.user || undefined,
    }),
    getShopActivityActionTypes(shop.id),
    getShopActivityUsers(shop.id),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ──────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track all changes made to your shop by team members.
        </p>
      </div>

      {/* ── Activity Log ────────────────────────────── */}
      <ActivityLogList
        shopSlug={slug}
        logs={logsData.logs}
        total={logsData.total}
        page={logsData.page}
        totalPages={logsData.totalPages}
        actionTypes={actionTypes}
        users={users}
        currentAction={search.action}
        currentUser={search.user}
      />
    </div>
  );
}
