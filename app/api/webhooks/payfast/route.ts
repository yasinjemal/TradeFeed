// ============================================================
// API Route — PayFast ITN Webhook (/api/webhooks/payfast)
// ============================================================
// Receives Instant Transaction Notifications from PayFast
// after a subscription payment succeeds/fails.
//
// FLOW:
// 1. PayFast POSTs form data to this endpoint
// 2. We validate the signature
// 3. If payment_status = COMPLETE → activate subscription
// 4. If cancelled → cancel subscription
//
// SECURITY:
// - Signature validation prevents spoofing
// - Rate limited via middleware
// - No auth required (server-to-server)
// ============================================================

import { NextResponse } from "next/server";
import { validatePayFastITN } from "@/lib/payfast";
import { upgradeSubscription, cancelSubscription } from "@/lib/db/subscriptions";

export async function POST(request: Request) {
  try {
    // PayFast sends form-encoded data
    const text = await request.text();
    const params = new URLSearchParams(text);
    const body: Record<string, string> = {};
    params.forEach((value, key) => {
      body[key] = value;
    });

    console.log("[PayFast ITN] Received:", body["payment_status"], body["m_payment_id"]);

    // Validate signature
    const validation = validatePayFastITN(body);
    if (!validation.valid) {
      console.error("[PayFast ITN] Validation failed:", validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const shopId = body["m_payment_id"];
    const paymentStatus = body["payment_status"];
    const token = body["token"]; // PayFast subscription token

    if (!shopId) {
      return NextResponse.json(
        { error: "Missing m_payment_id" },
        { status: 400 },
      );
    }

    switch (paymentStatus) {
      case "COMPLETE": {
        // Activate/renew Pro subscription
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

    // PayFast expects a 200 OK
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PayFast ITN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
