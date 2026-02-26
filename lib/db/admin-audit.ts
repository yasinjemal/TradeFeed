// ============================================================
// Data Access — Admin Audit Log
// ============================================================
// Centralized audit logging for all admin actions.
// Every admin mutation should call logAdminAction().
// ============================================================

import { db } from "@/lib/db";

/**
 * Log an admin action for audit trail.
 */
export async function logAdminAction(params: {
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: Record<string, unknown>;
}) {
  return db.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName ?? null,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}

/**
 * Get paginated audit log entries with filtering.
 */
export async function getAuditLog(options?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  adminId?: string;
}) {
  const { page = 1, limit = 30, action, entityType, adminId } = options || {};

  const where: Record<string, unknown> = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;
  if (adminId) where.adminId = adminId;

  const [logs, total] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.adminAuditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get distinct action types for filter dropdown.
 */
export async function getAuditActionTypes(): Promise<string[]> {
  const results = await db.adminAuditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });
  return results.map((r) => r.action);
}
