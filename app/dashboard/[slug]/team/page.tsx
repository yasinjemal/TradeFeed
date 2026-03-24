// ============================================================
// Page — Team (/dashboard/[slug]/team)
// ============================================================
// Dedicated team management page: access control center with
// operational table, plan usage bar, invite modal, and
// activity strip for accountability.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getShopBySlug } from "@/lib/db/shops";
import { getTeamData, checkTeamLimit } from "@/app/actions/staff";
import { getShopActivityLogs } from "@/lib/db/activity-logs";
import { TeamPage } from "@/components/dashboard/team-page";

interface TeamPageRouteProps {
  params: Promise<{ slug: string }>;
}

export default async function TeamPageRoute({ params }: TeamPageRouteProps) {
  const { slug } = await params;

  let access: Awaited<ReturnType<typeof requireShopAccess>>;
  try {
    access = await requireShopAccess(slug);
  } catch {
    return notFound();
  }
  if (!access) return notFound();

  const shop = await getShopBySlug(slug);
  if (!shop) return notFound();

  const [teamData, limitData, activityData] = await Promise.all([
    getTeamData(shop.id),
    checkTeamLimit(shop.id),
    access.role !== "STAFF"
      ? getShopActivityLogs({ shopId: shop.id, limit: 5 })
      : Promise.resolve({ logs: [], total: 0, page: 1, totalPages: 0 }),
  ]);

  return (
    <TeamPage
      shopSlug={slug}
      members={teamData.members}
      invites={teamData.invites}
      currentUserId={access.userId}
      currentRole={access.role}
      planName={limitData.planName}
      staffLimit={limitData.staffLimit}
      isPro={limitData.isPro}
      recentActivity={activityData.logs}
    />
  );
}
