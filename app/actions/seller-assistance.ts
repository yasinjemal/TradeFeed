"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/db/admin-audit";
import { approveSellerAssistance, cancelSellerAssistance } from "@/lib/db/seller-assistance";

const approval = z.object({ userId: z.string().cuid(), shopId: z.string().cuid(), fingerprint: z.string().regex(/^[a-f0-9]{64}$/) });

export async function approveSellerAssistanceAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const parsed = approval.parse(input);
    const campaign = await approveSellerAssistance(admin.id, parsed.userId, parsed.shopId, parsed.fingerprint);
    await logAdminAction({ adminId: admin.clerkId, adminEmail: admin.email, action: "seller_assistance_approved", entityType: "email_campaign", entityId: campaign.id });
    revalidatePath("/admin/activation");
    return { success: true, message: "Approved and queued. Delivery will recheck eligibility and sending settings." };
  } catch {
    return { success: false, message: "Unable to approve. Refresh: the message may have changed, already been queued, or become ineligible." };
  }
}

export async function cancelSellerAssistanceAction(campaignId: string) {
  try {
    const admin = await requireAdmin();
    z.string().cuid().parse(campaignId);
    const count = await cancelSellerAssistance(campaignId);
    if (!count) return { success: false, message: "This email has already been claimed or completed. Refresh its status." };
    await logAdminAction({ adminId: admin.clerkId, adminEmail: admin.email, action: "seller_assistance_cancelled", entityType: "email_campaign", entityId: campaignId });
    revalidatePath("/admin/activation");
    return { success: true, message: "Queued email cancelled." };
  } catch {
    return { success: false, message: "Unable to cancel this email." };
  }
}
