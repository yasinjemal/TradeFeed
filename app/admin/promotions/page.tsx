// ============================================================
// Page — Admin Promotions (/admin/promotions)
// ============================================================
// M7.3 — Revenue dashboard + M7.4 — Moderation
// M7.6 — Content guidelines violations
// ============================================================

import {
  getPromotionRevenue,
  getAdminPromotions,
  getContentViolations,
} from "@/lib/db/admin";
import { AdminPromotionDashboard } from "@/components/admin/admin-promotion-dashboard";

interface AdminPromotionsPageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminPromotionsPage({
  searchParams,
}: AdminPromotionsPageProps) {
  const params = await searchParams;
  const status = (params.status || "all") as "ACTIVE" | "EXPIRED" | "CANCELLED" | "all";
  const page = parseInt(params.page || "1", 10);

  const [revenue, promotions, violations] = await Promise.all([
    getPromotionRevenue(),
    getAdminPromotions({ status, page }),
    getContentViolations(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Promotions & Revenue</h1>
        <p className="text-stone-500 text-sm mt-1">
          Monitor promotion revenue, moderate listings, and enforce content guidelines.
        </p>
      </div>

      <AdminPromotionDashboard
        revenue={revenue}
        promotions={promotions.promotions}
        promotionTotal={promotions.total}
        promotionPage={promotions.page}
        promotionTotalPages={promotions.totalPages}
        violations={violations}
        currentStatus={status}
      />
    </div>
  );
}
