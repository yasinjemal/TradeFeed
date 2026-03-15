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
//    - "order_..." → buyer order payment → mark order as paid
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
import { reportError } from "@/lib/telemetry";
import { markOrderPaid, getOrderForWebhook } from "@/lib/db/orders";
import { createTransactionFee } from "@/lib/db/transaction-fees";

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
      await reportError("payfast-itn-validation", new Error(validation.error ?? "Unknown validation error"), {
        paymentId,
        paymentStatus,
      });
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

    // ── Route: Order payment ────────────────────────────
    if (paymentId.startsWith("order_")) {
      return handleOrderPayment(paymentId, paymentStatus, body);
    }

    // ── Route: Subscription payment ─────────────────────
    return handleSubscriptionPayment(paymentId, paymentStatus, body);
  } catch (error) {
    await reportError("payfast-itn-post", error);
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
    await reportError(
      "payfast-itn-promotion-amount-mismatch",
      new Error("Promotion amount mismatch"),
      { expectedAmount, receivedAmountCents, paymentId: body["m_payment_id"] }
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
    await reportError("payfast-itn-create-promotion", err, {
      shopId: promoData.shopId,
      productId: promoData.productId,
      tier: promoData.tier,
      weeks: promoData.weeks,
    });
    return NextResponse.json(
      { error: "Failed to create promotion" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}

// ── Order Payment Handler ────────────────────────────────────

async function handleOrderPayment(
  paymentId: string,
  paymentStatus: string | undefined,
  body: Record<string, string>,
) {
  const orderId = paymentId.replace("order_", "");

  if (paymentStatus !== "COMPLETE") {
    console.log(`[PayFast ITN] Order payment not complete: ${paymentStatus} (${orderId})`);
    return NextResponse.json({ received: true });
  }

  try {
    // 1. Mark order as paid
    await markOrderPaid(orderId);
    console.log(`[PayFast ITN] Order marked paid: ${orderId}`);

    // 2. Capture transaction fee
    try {
      const order = await getOrderForWebhook(orderId);
      if (order) {
        await createTransactionFee({
          orderId: order.id,
          shopId: order.shopId,
          orderAmountCents: order.totalCents,
          payfastPaymentId: body["pf_payment_id"],
        });
        console.log(`[PayFast ITN] Transaction fee captured for order ${orderId}`);

        // 3. Notify seller via WhatsApp
        try {
          const { sendOrderStatusUpdate } = await import("@/lib/whatsapp/business-api");
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tradefeed.co.za";
          if (order.shop.whatsappNumber) {
            await sendOrderStatusUpdate(
              order.shop.whatsappNumber,
              order.orderNumber,
              order.shop.name,
              "PAID",
              `${appUrl}/dashboard/${order.shop.slug}/orders`,
            );
            console.log(`[PayFast ITN] Seller notified: ${order.shop.slug}`);
          }
        } catch (notifyErr) {
          // Don't fail the webhook if notification fails
          console.error("[PayFast ITN] Seller notification failed:", notifyErr);
        }
      }
    } catch (feeErr) {
      // Don't fail the webhook if fee capture fails — order is already paid
      console.error("[PayFast ITN] Transaction fee capture failed:", feeErr);
      await reportError("payfast-itn-transaction-fee", feeErr, { orderId });
    }
  } catch (err) {
    await reportError("payfast-itn-order-payment", err, { orderId });
    return NextResponse.json(
      { error: "Failed to mark order as paid" },
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

      // Apply referral reward: if this shop was referred, extend referrer's sub
      try {
        const { applyReferralReward } = await import("@/lib/db/referrals");
        const result = await applyReferralReward(shopId);
        if (result.applied) {
          console.log(`[PayFast ITN] Referral reward applied to ${result.referrerSlug}`);
        }
      } catch (err) {
        // Non-fatal — subscription is already activated
        console.error("[PayFast ITN] Referral reward failed:", err);
      }
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
