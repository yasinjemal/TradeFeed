// ============================================================
// Data Access — Manual Payment Methods & Upgrade Requests
// ============================================================
// Admin-managed payment methods for manual upgrade flow.
// Sellers choose a method, submit payment proof, admin approves.
// ============================================================

import { db } from "@/lib/db";

// ══════════════════════════════════════════════════════════════
// Manual Payment Methods (Admin CRUD)
// ══════════════════════════════════════════════════════════════

/** Get all active payment methods (for seller-facing pages) */
export async function getActivePaymentMethods() {
  return db.manualPaymentMethod.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });
}

/** Get all payment methods including inactive (for admin) */
export async function getAllPaymentMethods() {
  return db.manualPaymentMethod.findMany({
    orderBy: { displayOrder: "asc" },
  });
}

/** Create a new payment method */
export async function createPaymentMethod(data: {
  name: string;
  description?: string;
  instructions: string;
  displayOrder?: number;
}) {
  return db.manualPaymentMethod.create({ data });
}

/** Update a payment method */
export async function updatePaymentMethod(
  id: string,
  data: {
    name?: string;
    description?: string;
    instructions?: string;
    isActive?: boolean;
    displayOrder?: number;
  },
) {
  return db.manualPaymentMethod.update({ where: { id }, data });
}

/** Delete a payment method */
export async function deletePaymentMethod(id: string) {
  return db.manualPaymentMethod.delete({ where: { id } });
}

/** Reorder payment methods */
export async function reorderPaymentMethods(
  orderedIds: string[],
) {
  const updates = orderedIds.map((id, index) =>
    db.manualPaymentMethod.update({
      where: { id },
      data: { displayOrder: index },
    }),
  );
  return db.$transaction(updates);
}

// ══════════════════════════════════════════════════════════════
// Upgrade Requests (Seller → Admin Review)
// ══════════════════════════════════════════════════════════════

/** Submit an upgrade request (seller action) */
export async function submitUpgradeRequest(
  shopId: string,
  data: {
    requestedPlanSlug: string;
    manualPaymentMethod: string;
    paymentReference: string;
    proofOfPaymentUrl?: string;
  },
) {
  return db.subscription.update({
    where: { shopId },
    data: {
      upgradeStatus: "UNDER_REVIEW",
      requestedPlanSlug: data.requestedPlanSlug,
      manualPaymentMethod: data.manualPaymentMethod,
      paymentReference: data.paymentReference,
      proofOfPaymentUrl: data.proofOfPaymentUrl ?? null,
      adminNote: null,
      approvedAt: null,
    },
  });
}

/** Get all pending upgrade requests (admin) */
export async function getPendingUpgradeRequests() {
  return db.subscription.findMany({
    where: { upgradeStatus: "UNDER_REVIEW" },
    include: {
      shop: { select: { id: true, name: true, slug: true, whatsappNumber: true } },
      plan: { select: { name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Get all upgrade requests (admin — all statuses except NONE) */
export async function getAllUpgradeRequests() {
  return db.subscription.findMany({
    where: { upgradeStatus: { not: "NONE" } },
    include: {
      shop: { select: { id: true, name: true, slug: true, whatsappNumber: true } },
      plan: { select: { name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

/** Approve an upgrade request (admin action) */
export async function approveUpgradeRequest(
  subscriptionId: string,
  adminNote?: string,
) {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    select: { requestedPlanSlug: true, shopId: true },
  });

  if (!subscription?.requestedPlanSlug) {
    throw new Error("No requested plan found on this subscription.");
  }

  const targetPlan = await db.plan.findUnique({
    where: { slug: subscription.requestedPlanSlug },
  });

  if (!targetPlan) {
    throw new Error(`Plan not found: ${subscription.requestedPlanSlug}`);
  }

  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return db.subscription.update({
    where: { id: subscriptionId },
    data: {
      // Activate the new plan
      planId: targetPlan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      // Mark upgrade as approved
      upgradeStatus: "APPROVED",
      adminNote: adminNote ?? null,
      approvedAt: now,
    },
    include: {
      shop: { select: { name: true, slug: true } },
      plan: { select: { name: true } },
    },
  });
}

/** Reject an upgrade request (admin action) */
export async function rejectUpgradeRequest(
  subscriptionId: string,
  adminNote?: string,
) {
  return db.subscription.update({
    where: { id: subscriptionId },
    data: {
      upgradeStatus: "REJECTED",
      adminNote: adminNote ?? null,
    },
    include: {
      shop: { select: { name: true, slug: true } },
    },
  });
}
