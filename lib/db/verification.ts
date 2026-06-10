// ============================================================
// Data Access — Seller Verification (Trust System, Phase 2)
// ============================================================
// The SellerVerification record is the audit trail behind the
// Shop.isVerified flag. Admins approve/reject; the flag is kept
// in sync here so all reads stay fast and denormalised.
//
// POPIA: document URLs are PII — only return them from the
// admin-scoped functions, never to public UI.
// ============================================================

import { db } from "@/lib/db";
import type { VerificationStatus } from "@prisma/client";

export interface VerificationSubmission {
  legalName: string;
  registrationNumber?: string | null;
  vatNumber?: string | null;
  idDocumentUrl?: string | null;
  proofOfAddressUrl?: string | null;
  sellerNote?: string | null;
}

/**
 * Seller submits (or resubmits after rejection) a verification
 * request. Resubmission resets the record to PENDING.
 */
export async function submitVerification(shopId: string, data: VerificationSubmission) {
  return db.sellerVerification.upsert({
    where: { shopId },
    create: { shopId, ...data },
    update: {
      ...data,
      status: "PENDING",
      submittedAt: new Date(),
      reviewedBy: null,
      reviewedByEmail: null,
      decisionNote: null,
      rejectedAt: null,
    },
  });
}

/** Seller-facing view of their own verification state. */
export async function getVerificationForShop(shopId: string) {
  return db.sellerVerification.findUnique({ where: { shopId } });
}

/** Admin queue — pending first, newest submissions on top. */
export async function getVerificationQueue(status: VerificationStatus = "PENDING") {
  return db.sellerVerification.findMany({
    where: { status },
    orderBy: { submittedAt: "desc" },
    include: {
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          province: true,
          createdAt: true,
          _count: { select: { products: true, orders: true } },
        },
      },
    },
  });
}

/**
 * Admin decision. Keeps Shop.isVerified in sync atomically.
 */
export async function decideVerification(opts: {
  shopId: string;
  approve: boolean;
  adminId: string;
  adminEmail: string;
  decisionNote?: string | null;
}) {
  const now = new Date();
  const [verification] = await db.$transaction([
    db.sellerVerification.update({
      where: { shopId: opts.shopId },
      data: {
        status: opts.approve ? "APPROVED" : "REJECTED",
        reviewedBy: opts.adminId,
        reviewedByEmail: opts.adminEmail,
        decisionNote: opts.decisionNote ?? null,
        verifiedAt: opts.approve ? now : null,
        rejectedAt: opts.approve ? null : now,
      },
    }),
    db.shop.update({
      where: { id: opts.shopId },
      data: { isVerified: opts.approve },
    }),
  ]);
  return verification;
}

/**
 * Admin verifies a shop directly (from the shop list) without a
 * seller submission. Creates a minimal APPROVED record so the
 * badge is always backed by an audit trail.
 */
export async function adminDirectVerify(opts: {
  shopId: string;
  shopName: string;
  adminId: string;
  adminEmail: string;
}) {
  const now = new Date();
  await db.$transaction([
    db.sellerVerification.upsert({
      where: { shopId: opts.shopId },
      create: {
        shopId: opts.shopId,
        legalName: opts.shopName,
        sellerNote: "Verified directly by platform admin",
        status: "APPROVED",
        reviewedBy: opts.adminId,
        reviewedByEmail: opts.adminEmail,
        verifiedAt: now,
      },
      update: {
        status: "APPROVED",
        reviewedBy: opts.adminId,
        reviewedByEmail: opts.adminEmail,
        verifiedAt: now,
        rejectedAt: null,
      },
    }),
    db.shop.update({ where: { id: opts.shopId }, data: { isVerified: true } }),
  ]);
}

/**
 * Revoke a previously granted badge (admin). Also used when an
 * admin unverifies a shop directly from the shop list.
 */
export async function revokeVerification(opts: {
  shopId: string;
  adminId: string;
  adminEmail: string;
  decisionNote?: string | null;
}) {
  const existing = await db.sellerVerification.findUnique({ where: { shopId: opts.shopId } });

  const ops = [];
  if (existing) {
    ops.push(
      db.sellerVerification.update({
        where: { shopId: opts.shopId },
        data: {
          status: "REVOKED",
          reviewedBy: opts.adminId,
          reviewedByEmail: opts.adminEmail,
          decisionNote: opts.decisionNote ?? null,
        },
      })
    );
  }
  ops.push(db.shop.update({ where: { id: opts.shopId }, data: { isVerified: false } }));

  await db.$transaction(ops);
}
