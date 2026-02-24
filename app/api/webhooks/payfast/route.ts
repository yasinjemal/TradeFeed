// ============================================================
// API Route — PayFast ITN Webhook (/api/webhooks/payfast)
// ============================================================
// Receives Instant Transaction Notifications from PayFast
// after a subscription or promotion payment succeeds/fails.
//
// FLOW:
// 1. PayFast POSTs form data to this endpoint
// 2. We validate the signature
// 3. Check m_payment_id prefix:
//    - "promo_..." → promotion payment → create PromotedListing
//    - anything else → subscription payment → activate subscription
// 4. If cancelled → cancel subscription (promotions are one-time, no cancel)
//
// SECURITY:
// - Signature validation prevents spoofing
// - Rate limited via middleware
// - No auth required (server-to-server)
// ============================================================

import { NextResponse } from "next/server";
import { validatePayFastITN } from "@/lib/payfast";
import { upgradeSubscription, cancelSubscription } from "@/lib/db/subscriptions";
import { parsePromotionPaymentId, calculatePromotionPrice } from "@/lib/config/promotions";
import { createPromotedListing } from "@/lib/db/promotions";

export async function POST(request: Request) {
  try {
    // PayFast sends form-encoded data
    const text = await request.text();
    const params = new URLSearchParams(text);
    const body: Record<string, string> = {};
    params.forEach((value, key) => {
      body[key] = value;
    });

    const paymentId = body["m_payment_id"] ?? "";
    const paymentStatus = body["payment_status"];

    console.log("[PayFast ITN] Received:", paymentStatus, paymentId);

    // Validate signature
    const validation = validatePayFastITN(body);
    if (!validation.valid) {
      console.error("[PayFast ITN] Validation failed:", validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing m_payment_id" },
        { status: 400 },
      );
    }

    // ── Route: Promotion payment ────────────────────────
    const promoData = parsePromotionPaymentId(paymentId);

    if (promoData) {
      return handlePromotionPayment(promoData, paymentStatus, body);
    }

    // ── Route: Subscription payment ─────────────────────
    return handleSubscriptionPayment(paymentId, paymentStatus, body);
  } catch (error) {
    console.error("[PayFast ITN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Promotion Payment Handler ────────────────────────────────

async function handlePromotionPayment(
  promoData: { shopId: string; productId: string; tier: "BOOST" | "FEATURED" | "SPOTLIGHT"; weeks: number },
  paymentStatus: string | undefined,
  body: Record<string, string>,
) {
  if (paymentStatus !== "COMPLETE") {
    console.log(`[PayFast ITN] Promotion payment not complete: ${paymentStatus}`);
    return NextResponse.json({ received: true });
  }

  const expectedAmount = calculatePromotionPrice(promoData.tier, promoData.weeks);

  // Verify payment amount matches expected
  const receivedAmountCents = Math.round(parseFloat(body["amount_gross"] ?? "0") * 100);
  if (Math.abs(receivedAmountCents - expectedAmount) > 100) {
    // Allow R1 tolerance for rounding
    console.error(
      `[PayFast ITN] Promotion amount mismatch: expected ${expectedAmount}, got ${receivedAmountCents}`
    );
    return NextResponse.json(
      { error: "Amount mismatch" },
      { status: 400 },
    );
  }

  // Create the promoted listing
  try {
    const listing = await createPromotedListing({
      shopId: promoData.shopId,
      productId: promoData.productId,
      tier: promoData.tier,
      weeks: promoData.weeks,
      amountPaidCents: receivedAmountCents,
      payfastPaymentId: body["pf_payment_id"],
    });

    console.log(
      `[PayFast ITN] Promotion created: ${listing.id} (${promoData.tier}, ${promoData.weeks}wk)`
    );
  } catch (err) {
    console.error("[PayFast ITN] Failed to create promotion:", err);
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ── Subscription Payment Handler ─────────────────────────────

async function handleSubscriptionPayment(
  shopId: string,
  paymentStatus: string | undefined,
  body: Record<string, string>,
) {
  const token = body["token"]; // PayFast subscription token

  switch (paymentStatus) {
    case "COMPLETE": {
      await upgradeSubscription(shopId, "pro", token);
      console.log(`[PayFast ITN] Subscription activated for shop ${shopId}`);
      break;
    }

    case "CANCELLED": {
      await cancelSubscription(shopId);
      console.log(`[PayFast ITN] Subscription cancelled for shop ${shopId}`);
      break;
    }

    default:
      console.log(`[PayFast ITN] Unhandled status: ${paymentStatus}`);
  }

  return NextResponse.json({ received: true });
}
