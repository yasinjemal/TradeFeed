// ============================================================
// Server Actions — Staff / Team Management
// ============================================================

"use server";

import { db } from "@/lib/db";
import { requireShopAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email/resend";
import { staffInviteEmailHtml, staffInviteEmailText } from "@/lib/email/templates/staff-invite";
import { getShopSubscription, isTrialActive } from "@/lib/db/subscriptions";

type ActionResult = {
  success: boolean;
  error?: string;
};

// ============================================================
// inviteStaffAction — Send a staff invitation (OWNER only)
// ============================================================

export async function inviteStaffAction(
  shopSlug: string,
  email: string,
  role: "MANAGER" | "STAFF",
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };
    if (access.role !== "OWNER") {
      return { success: false, error: "Only the shop owner can invite staff." };
    }

    // Normalize
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Check staff limit
    const subscription = await getShopSubscription(access.shopId);
    const isPro =
      (!!subscription?.plan.slug && subscription.plan.slug !== "free") ||
      isTrialActive(subscription).active;
    const staffLimit = subscription?.plan.staffLimit ?? 1;

    const currentStaffCount = await db.shopUser.count({
      where: { shopId: access.shopId },
    });

    if (!isPro || currentStaffCount >= staffLimit) {
      return {
        success: false,
        error: isPro
          ? `Staff limit reached (${staffLimit} members). Upgrade for more seats.`
          : "Multi-staff is a Pro feature. Upgrade to invite team members.",
      };
    }

    // Check not already a member
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      const existingMember = await db.shopUser.findUnique({
        where: {
          userId_shopId: { userId: existingUser.id, shopId: access.shopId },
        },
      });
      if (existingMember) {
        return { success: false, error: "This person is already a team member." };
      }
    }

    // Check not already invited (pending)
    const existingInvite = await db.staffInvite.findUnique({
      where: {
        shopId_email: { shopId: access.shopId, email: normalizedEmail },
      },
    });

    if (existingInvite && existingInvite.status === "pending") {
      return { success: false, error: "An invitation is already pending for this email." };
    }

    // Create / replace invite
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await db.staffInvite.upsert({
      where: {
        shopId_email: { shopId: access.shopId, email: normalizedEmail },
      },
      create: {
        shopId: access.shopId,
        email: normalizedEmail,
        role,
        invitedById: access.userId,
        expiresAt,
      },
      update: {
        role,
        status: "pending",
        invitedById: access.userId,
        expiresAt,
        acceptedAt: null,
      },
    });

    // Get shop name for email
    const shop = await db.shop.findUnique({
      where: { id: access.shopId },
      select: { name: true, slug: true },
    });

    // Send invite email
    const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://tradefeed.co.za"}/invite/${invite.token}`;
    await sendEmail({
      to: normalizedEmail,
      subject: `You're invited to join ${shop?.name ?? "a shop"} on TradeFeed`,
      html: staffInviteEmailHtml({
        shopName: shop?.name ?? "Shop",
        role,
        acceptUrl,
        expiresInDays: 7,
      }),
      text: staffInviteEmailText({
        shopName: shop?.name ?? "Shop",
        role,
        acceptUrl,
        expiresInDays: 7,
      }),
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[inviteStaffAction]", err);
    return { success: false, error: "Failed to send invitation." };
  }
}

// ============================================================
// acceptInviteAction — Accept a staff invitation by token
// ============================================================

export async function acceptInviteAction(token: string): Promise<ActionResult> {
  try {
    // requireAuth is called inside requireShopAccess, but here we need the
    // user directly since there's no shopSlug yet
    const { requireAuth } = await import("@/lib/auth");
    const user = await requireAuth();

    const invite = await db.staffInvite.findUnique({
      where: { token },
      include: { shop: { select: { slug: true, name: true } } },
    });

    if (!invite) return { success: false, error: "Invitation not found." };
    if (invite.status !== "pending") {
      return { success: false, error: `This invitation has already been ${invite.status}.` };
    }
    if (invite.expiresAt < new Date()) {
      await db.staffInvite.update({
        where: { id: invite.id },
        data: { status: "expired" },
      });
      return { success: false, error: "This invitation has expired." };
    }

    // Check email matches
    if (user.email.toLowerCase() !== invite.email) {
      return {
        success: false,
        error: "This invitation was sent to a different email address.",
      };
    }

    // Check not already a member
    const existing = await db.shopUser.findUnique({
      where: {
        userId_shopId: { userId: user.id, shopId: invite.shopId },
      },
    });

    if (existing) {
      await db.staffInvite.update({
        where: { id: invite.id },
        data: { status: "accepted", acceptedAt: new Date() },
      });
      return { success: true }; // Already a member — just mark accepted
    }

    // Create membership + mark accepted in a transaction
    await db.$transaction([
      db.shopUser.create({
        data: {
          userId: user.id,
          shopId: invite.shopId,
          role: invite.role,
        },
      }),
      db.staffInvite.update({
        where: { id: invite.id },
        data: { status: "accepted", acceptedAt: new Date() },
      }),
    ]);

    revalidatePath(`/dashboard/${invite.shop.slug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[acceptInviteAction]", err);
    return { success: false, error: "Failed to accept invitation." };
  }
}

// ============================================================
// revokeInviteAction — Revoke a pending invite (OWNER only)
// ============================================================

export async function revokeInviteAction(
  shopSlug: string,
  inviteId: string,
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };
    if (access.role !== "OWNER") {
      return { success: false, error: "Only the shop owner can revoke invitations." };
    }

    // Verify invite belongs to this shop
    const invite = await db.staffInvite.findFirst({
      where: { id: inviteId, shopId: access.shopId, status: "pending" },
    });
    if (!invite) return { success: false, error: "Invitation not found." };

    await db.staffInvite.update({
      where: { id: invite.id },
      data: { status: "revoked" },
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[revokeInviteAction]", err);
    return { success: false, error: "Failed to revoke invitation." };
  }
}

// ============================================================
// removeStaffAction — Remove a staff member (OWNER only)
// ============================================================

export async function removeStaffAction(
  shopSlug: string,
  targetUserId: string,
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };
    if (access.role !== "OWNER") {
      return { success: false, error: "Only the shop owner can remove staff." };
    }

    // Can't remove yourself
    if (targetUserId === access.userId) {
      return { success: false, error: "You can't remove yourself from the shop." };
    }

    // Verify target is a member of this shop
    const membership = await db.shopUser.findUnique({
      where: {
        userId_shopId: { userId: targetUserId, shopId: access.shopId },
      },
    });
    if (!membership) return { success: false, error: "Member not found." };
    if (membership.role === "OWNER") {
      return { success: false, error: "Cannot remove the shop owner." };
    }

    await db.shopUser.delete({
      where: {
        userId_shopId: { userId: targetUserId, shopId: access.shopId },
      },
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[removeStaffAction]", err);
    return { success: false, error: "Failed to remove member." };
  }
}

// ============================================================
// updateStaffRoleAction — Change a member's role (OWNER only)
// ============================================================

export async function updateStaffRoleAction(
  shopSlug: string,
  targetUserId: string,
  newRole: "MANAGER" | "STAFF",
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };
    if (access.role !== "OWNER") {
      return { success: false, error: "Only the shop owner can change roles." };
    }

    if (targetUserId === access.userId) {
      return { success: false, error: "You can't change your own role." };
    }

    const membership = await db.shopUser.findUnique({
      where: {
        userId_shopId: { userId: targetUserId, shopId: access.shopId },
      },
    });
    if (!membership) return { success: false, error: "Member not found." };
    if (membership.role === "OWNER") {
      return { success: false, error: "Cannot change the owner's role." };
    }

    await db.shopUser.update({
      where: {
        userId_shopId: { userId: targetUserId, shopId: access.shopId },
      },
      data: { role: newRole },
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true };
  } catch (err) {
    console.error("[updateStaffRoleAction]", err);
    return { success: false, error: "Failed to update role." };
  }
}

// ============================================================
// getTeamData — Fetch staff members + pending invites for a shop
// ============================================================

export async function getTeamData(shopId: string) {
  const [members, invites] = await Promise.all([
    db.shopUser.findMany({
      where: { shopId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // OWNER first
        { createdAt: "asc" },
      ],
    }),
    db.staffInvite.findMany({
      where: { shopId, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { members, invites };
}
