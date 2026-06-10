// ============================================================
// Admin — Seller Verification Queue (/admin/verifications)
// ============================================================
// Review pending verification requests; approve grants the
// Verified badge (Shop.isVerified kept in sync atomically).
// ============================================================

import { getVerificationQueue } from "@/lib/db/verification";
import { VerificationQueue } from "@/components/admin/verification-queue";
import type { VerificationStatus } from "@prisma/client";

export const metadata = {
  title: "Seller Verifications | Admin | TradeFeed",
};

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "REVOKED"] as const;

export default async function AdminVerificationsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const searchParams = await props.searchParams;
  const status: VerificationStatus = VALID_STATUSES.includes(
    searchParams.status as (typeof VALID_STATUSES)[number]
  )
    ? (searchParams.status as VerificationStatus)
    : "PENDING";

  const requests = await getVerificationQueue(status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Seller Verifications</h1>
        <p className="text-sm text-stone-400 mt-1">
          Approve or reject verification requests. Approval grants the Verified badge.
        </p>
      </div>
      <VerificationQueue requests={requests} currentStatus={status} />
    </div>
  );
}
