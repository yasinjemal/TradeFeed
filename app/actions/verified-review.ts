// ============================================================
// Server Actions — Verified Review Submission (Phase 2)
// ============================================================
// Buyers land on /review/[token] from the post-delivery
// WhatsApp message. The token proves they placed the order,
// so the resulting review is marked isVerified.
// No auth required — the token IS the auth.
// ============================================================

"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { createReview } from "@/lib/db/reviews";
import { notifyNewReview } from "@/lib/notifications";
import { reportError } from "@/lib/telemetry";

type ActionResult = { success: true } | { success: false; error: string };

const verifiedReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional().or(z.literal("")),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  buyerName: z.string().trim().min(1, "Please enter your name").max(100),
});

export async function submitVerifiedReviewAction(
  token: string,
  input: {
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
    buyerName: string;
  }
): Promise<ActionResult> {
  try {
    const parsed = verifiedReviewSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    // ── Validate token ──────────────────────────────────
    const request = await db.reviewRequest.findUnique({
      where: { token },
      select: {
        id: true,
        shopId: true,
        respondedAt: true,
        order: { select: { items: { select: { productId: true } } } },
      },
    });

    if (!request) {
      return { success: false, error: "This review link is invalid." };
    }
    if (request.respondedAt) {
      return { success: false, error: "A review was already submitted for this order. Thank you!" };
    }

    // Token only allows reviewing products that were in the order
    const orderedProductIds = new Set(request.order.items.map((i) => i.productId));
    if (!orderedProductIds.has(parsed.data.productId)) {
      return { success: false, error: "That product wasn't part of this order." };
    }

    // ── Create the verified review ──────────────────────
    const review = await createReview({
      shopId: request.shopId,
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      comment: parsed.data.comment || undefined,
      buyerName: parsed.data.buyerName,
      isVerified: true,
    });

    await db.reviewRequest.update({
      where: { id: request.id },
      data: { respondedAt: new Date(), reviewId: review.id },
    });

    // Notify the seller (fire-and-forget)
    notifyNewReview({
      shopId: request.shopId,
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      buyerName: parsed.data.buyerName,
      comment: parsed.data.comment || undefined,
    }).catch(() => {});

    return { success: true };
  } catch (error) {
    await reportError("submitVerifiedReviewAction", error, { token });
    return { success: false, error: "Failed to submit review. Please try again." };
  }
}
