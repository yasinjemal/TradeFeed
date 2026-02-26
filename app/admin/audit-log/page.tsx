// ============================================================
// Page — Admin Audit Log (/admin/audit-log)
// ============================================================
// Complete audit trail of all admin actions on the platform.
// ============================================================

import { getAuditLog, getAuditActionTypes } from "@/lib/db/admin-audit";
import { AdminAuditLog } from "@/components/admin/admin-audit-log";

interface AdminAuditLogPageProps {
  searchParams: Promise<{ action?: string; entityType?: string; page?: string }>;
}

export default async function AdminAuditLogPage({ searchParams }: AdminAuditLogPageProps) {
  const params = await searchParams;
  const action = params.action || "";
  const entityType = params.entityType || "";
  const page = parseInt(params.page || "1", 10);

  const [logData, actionTypes] = await Promise.all([
    getAuditLog({
      action: action || undefined,
      entityType: entityType || undefined,
      page,
      limit: 30,
    }),
    getAuditActionTypes(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-stone-500 text-sm mt-1">
          Complete record of every admin action on the platform.
        </p>
      </div>

      <AdminAuditLog
        entries={logData.logs}
        total={logData.total}
        page={logData.page}
        totalPages={logData.totalPages}
        actionTypes={actionTypes}
        currentAction={action}
        currentEntityType={entityType}
      />
    </div>
  );
}
