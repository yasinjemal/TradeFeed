// ============================================================
// Data Access — Shop Activity Log
// ============================================================
// Centralized logging for all shop-level mutations.
// Every critical mutation should call logShopActivity().
//
// DESIGN: Fire-and-forget (async, non-blocking) so logs
// never slow down the main user action.
// ============================================================

import { db } from "@/lib/db";

/**
 * Log a shop-level activity for the audit trail.
 * This is fire-and-forget — failures are caught and logged,
 * never blocking the main action.
 */
export async function logShopActivity(params: {
  shopId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.shopActivityLog.create({
      data: {
        shopId: params.shopId,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName ?? null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });
  } catch (error) {
    // Never block main action — just log the failure
    console.error("[logShopActivity] Failed to write activity log:", error);
  }
}

/**
 * Get paginated activity logs for a shop with optional filtering.
 */
export async function getShopActivityLogs(options: {
  shopId: string;
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entityType?: string;
}) {
  const { shopId, page = 1, limit = 30, action, userId, entityType } = options;

  const where: Record<string, unknown> = { shopId };
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;

  const [logs, total] = await Promise.all([
    db.shopActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.shopActivityLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get distinct action types for filter dropdown (scoped to shop).
 */
export async function getShopActivityActionTypes(shopId: string): Promise<string[]> {
  const results = await db.shopActivityLog.findMany({
    where: { shopId },
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });
  return results.map((r: { action: string }) => r.action);
}

/**
 * Get distinct users who performed actions (scoped to shop).
 */
export async function getShopActivityUsers(shopId: string) {
  const results = await db.shopActivityLog.findMany({
    where: { shopId },
    distinct: ["userId"],
    select: { userId: true, userName: true },
    orderBy: { userName: "asc" },
  });
  return results;
}
