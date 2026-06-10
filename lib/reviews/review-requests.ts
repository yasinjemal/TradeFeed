// ============================================================
// Review Requests — Automated ask after delivery (Phase 2)
// ============================================================
// When an order is marked DELIVERED, we create a ReviewRequest
// (idempotent — one per order) and send the buyer a WhatsApp
// message with a tokenized link to /review/[token]. Reviews
// submitted through the token are marked isVerified.
//
// Eligibility rules (pure, unit-tested):
// - order must have a buyer phone
// - order must not already have a request
// - buyer must have consented to WhatsApp updates (POPIA)
// ============================================================

import { db } from "@/lib/db";
import { sendReviewRequest } from "@/lib/whatsapp/business-api";

// ── Pure logic (testable) ────────────────────────────────────

export interface ReviewRequestCandidate {
  buyerPhone: string | null;
  marketingConsent: boolean;
  status: string;
  hasExistingRequest: boolean;
}

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: "no_phone" | "no_consent" | "not_delivered" | "already_requested" };

/**
 * POPIA-safe eligibility check for sending a review request.
 */
export function checkReviewRequestEligibility(
  order: ReviewRequestCandidate
): EligibilityResult {
  if (order.status !== "DELIVERED") return { eligible: false, reason: "not_delivered" };
  if (order.hasExistingRequest) return { eligible: false, reason: "already_requested" };
  if (!order.buyerPhone) return { eligible: false, reason: "no_phone" };
  if (!order.marketingConsent) return { eligible: false, reason: "no_consent" };
  return { eligible: true };
}

/**
 * Build the buyer-facing review URL for a token.
 */
export function buildReviewUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/review/${token}`;
}

// ── Orchestration ────────────────────────────────────────────

/**
 * Create + send a review request for a delivered order.
 * Idempotent: a second call for the same order is a no-op.
 * Never throws — designed to be fire-and-forget from the
 * order status action.
 */
export async function requestReviewForOrder(orderId: string, shopId: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId, shopId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        buyerPhone: true,
        marketingConsent: true,
        shopId: true,
        reviewRequest: { select: { id: true } },
        shop: { select: { name: true } },
      },
    });
    if (!order) return;

    const eligibility = checkReviewRequestEligibility({
      buyerPhone: order.buyerPhone,
      marketingConsent: order.marketingConsent,
      status: order.status,
      hasExistingRequest: order.reviewRequest !== null,
    });
    if (!eligibility.eligible) return;

    // Create the request first (idempotency anchor)
    const request = await db.reviewRequest.create({
      data: { orderId: order.id, shopId: order.shopId },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const reviewUrl = buildReviewUrl(baseUrl, request.token);

    const result = await sendReviewRequest(
      order.buyerPhone!,
      order.orderNumber,
      order.shop.name,
      reviewUrl
    );

    if (result.success) {
      await db.reviewRequest.update({
        where: { id: request.id },
        data: { sentAt: new Date() },
      });
    }
  } catch (error) {
    // Unique constraint (P2002) = concurrent duplicate — safe to ignore
    console.error("[review-requests] failed for order", orderId, error);
  }
}
