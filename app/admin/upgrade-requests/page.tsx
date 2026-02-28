// ============================================================
// Page — Admin Upgrade Requests (/admin/upgrade-requests)
// ============================================================
// Review pending manual upgrade requests from sellers.
// Approve or reject with admin notes.
// ============================================================

import { getAllUpgradeRequests } from "@/lib/db/manual-payments";
import { UpgradeRequestsPanel } from "@/components/admin/upgrade-requests-panel";

export default async function AdminUpgradeRequestsPage() {
  const requests = await getAllUpgradeRequests();

  const pendingCount = requests.filter((r) => r.upgradeStatus === "UNDER_REVIEW").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-stone-100">Upgrade Requests</h1>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-stone-400 mt-1">
          Review manual upgrade requests from sellers. Verify payment and approve or reject.
        </p>
      </div>

      <UpgradeRequestsPanel requests={requests} />
    </div>
  );
}
