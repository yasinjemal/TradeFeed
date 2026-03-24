// ============================================================
// Server Actions — Activity Logs
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import {
  getShopActivityLogs,
  getShopActivityActionTypes,
  getShopActivityUsers,
} from "@/lib/db/activity-logs";

export async function getActivityLogsAction(
  shopSlug: string,
  options?: {
    page?: number;
    action?: string;
    userId?: string;
  },
) {
  const access = await requireShopAccess(shopSlug);
  if (!access) return { logs: [], total: 0, page: 1, totalPages: 0 };

  // Only OWNER and MANAGER can view activity logs
  if (access.role === "STAFF") {
    return { logs: [], total: 0, page: 1, totalPages: 0 };
  }

  return getShopActivityLogs({
    shopId: access.shopId,
    page: options?.page ?? 1,
    action: options?.action,
    userId: options?.userId,
  });
}

export async function getActivityFiltersAction(shopSlug: string) {
  const access = await requireShopAccess(shopSlug);
  if (!access || access.role === "STAFF") {
    return { actionTypes: [], users: [] };
  }

  const [actionTypes, users] = await Promise.all([
    getShopActivityActionTypes(access.shopId),
    getShopActivityUsers(access.shopId),
  ]);

  return { actionTypes, users };
}
