// ============================================================
// Server Actions — Seller Verification (Trust System, Phase 2)
// ============================================================
// Seller: submit/resubmit a verification request.
// Admin: approve or reject from the verification queue.
//
// Gated behind FEATURE_FLAGS.TRUST_SYSTEM.
// ============================================================

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireShopAccess } from "@/lib/auth";
import { requireAdmin } from "@/lib/auth/admin";
import { logAdminAction } from "@/lib/db/admin-audit";
import { reportError } from "@/lib/telemetry";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import {
  submitVerification,
  decideVerification,
} from "@/lib/db/verification";

type ActionResult = { success: true; message?: string } | { success: false; error: string };

const submissionSchema = z.object({
  legalName: z.string().trim().min(2, "Legal name is required").max(200),
  registrationNumber: z.string().trim().max(50).optional().or(z.literal("")),
  vatNumber: z.string().trim().max(20).optional().or(z.literal("")),
  sellerNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

// ── Seller: submit verification request ─────────────────────

export async function submitVerificationAction(
  shopSlug: string,
  input: {
    legalName: string;
    registrationNumber?: string;
    vatNumber?: string;
    sellerNote?: string;
  }
): Promise<ActionResult> {
  if (!FEATURE_FLAGS.TRUST_SYSTEM) {
    return { success: false, error: "Not available" };
  }

  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Shop not found or access denied." };
    }

    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
      };
    }

    await submitVerification(access.shopId, {
      legalName: parsed.data.legalName,
      registrationNumber: parsed.data.registrationNumber || null,
      vatNumber: parsed.data.vatNumber || null,
      sellerNote: parsed.data.sellerNote || null,
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return {
      success: true,
      message: "Verification request submitted. We'll review it within 2 business days.",
    };
  } catch (error) {
    await reportError("submitVerificationAction", error, { shopSlug });
    return { success: false, error: "Failed to submit. Please try again." };
  }
}

// ── Admin: decide ────────────────────────────────────────────

export async function decideVerificationAction(
  shopId: string,
  approve: boolean,
  decisionNote?: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const verification = await decideVerification({
      shopId,
      approve,
      adminId: admin.id,
      adminEmail: admin.email,
      decisionNote: decisionNote || null,
    });

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: approve ? "VERIFICATION_APPROVE" : "VERIFICATION_REJECT",
      entityType: "shop",
      entityId: shopId,
      entityName: verification.legalName,
      details: decisionNote ? { decisionNote } : undefined,
    });

    revalidatePath("/admin/verifications");
    revalidatePath("/admin");
    return {
      success: true,
      message: approve ? "Shop verified." : "Verification rejected.",
    };
  } catch (error) {
    await reportError("decideVerificationAction", error, { shopId, approve });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update verification.",
    };
  }
}
