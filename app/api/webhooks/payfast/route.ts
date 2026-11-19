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
// 4. If cancelled → record the cancellation (promotions are one-time, no cancel)
//
// Subscription notifications are matched on the PayFast token, because
// one shop can have two live subscriptions after an upgrade — see
// lib/billing/subscription-itn.ts.
//
// SECURITY:
// - Signature validation prevents spoofing
// - Rate limited via middleware
// - No auth required (server-to-server)
// ============================================================

import { NextResponse } from "next/server";
import { validatePayFastITN } from "@/lib/payfast";
import {
  upgradeSubscription,
  markSubscriptionCancelled,
  extendCancelledSubscription,
} from "@/lib/db/subscriptions";
import { cancelPayFastSubscription } from "@/lib/payfast-api";
import { decideSubscriptionItn } from "@/lib/billing/subscription-itn";
import { describePayFastFailure } from "@/lib/billing/cancel-subscription";
import { db } from "@/lib/db";
import { parsePromotionPaymentId, calculatePromotionPrice, parseShopBoostPaymentId, calculateShopBoostPrice } from "@/lib/config/promotions";
import { createPromotedListing } from "@/lib/db/promotions";
import { activateShopBoost } from "@/lib/db/shops";
import { reportError } from "@/lib/telemetry";
import { markOrderPaid, getOrderForWebhook } from "@/lib/db/orders";
import { createTransactionFee } from "@/lib/db/transaction-fees";
import { trackEvent } from "@/lib/db/analytics";

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

    // ── Idempotency: skip already-processed notifications ──
    // PayFast retries ITNs when a 200 is lost in transit, and a
    // captured ITN could be replayed. Each (pf_payment_id, status)
    // pair is processed exactly once; the record is written only
    // AFTER successful processing so a failed attempt (non-200)
    // still gets retried by PayFast.
    const pfPaymentId = body["pf_payment_id"];
    if (pfPaymentId && paymentStatus) {
      const seen = await db.payfastNotification.findUnique({
        where: { pfPaymentId_paymentStatus: { pfPaymentId, paymentStatus } },
        select: { id: true },
      });
      if (seen) {
        console.log(`[PayFast ITN] Duplicate ignored: ${pfPaymentId} (${paymentStatus})`);
        return NextResponse.json({ received: true, duplicate: true });
      }
    }

    // ── Route by payment type ───────────────────────────
    const promoData = parsePromotionPaymentId(paymentId);
    const boostData = promoData ? null : parseShopBoostPaymentId(paymentId);

    const response = promoData
      ? await handlePromotionPayment(promoData, paymentStatus, body)
      : boostData
        ? await handleShopBoostPayment(boostData, paymentStatus, body)
        : paymentId.startsWith("order_")
          ? await handleOrderPayment(paymentId, paymentStatus, body)
          : // paymentId format: "{shopId}:{planSlug}" — parsed inside the handler
            await handleSubscriptionPayment(paymentId, paymentStatus, body);

    // Record success so retries/replays of this notification are no-ops.
    if (response.ok && pfPaymentId && paymentStatus) {
      await db.payfastNotification
        .create({ data: { pfPaymentId, paymentStatus, mPaymentId: paymentId } })
        .catch(() => {
          // Unique violation from a concurrent retry — already recorded.
        });
    }

    return response;
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

  // Defense in depth: skip if this exact payment already produced a
  // listing (covers pre-ledger notifications and race windows).
  const pfId = body["pf_payment_id"];
  if (pfId) {
    const existing = await db.promotedListing.findFirst({
      where: { payfastPaymentId: pfId },
      select: { id: true },
    });
    if (existing) {
      console.log(`[PayFast ITN] Promotion already created for ${pfId} — skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }
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

// ── Shop Boost Payment Handler ───────────────────────────────

async function handleShopBoostPayment(
  boostData: { shopId: string; weeks: number },
  paymentStatus: string | undefined,
  body: Record<string, string>,
) {
  if (paymentStatus !== "COMPLETE") {
    console.log(`[PayFast ITN] Shop boost payment not complete: ${paymentStatus}`);
    return NextResponse.json({ received: true });
  }

  const expectedAmount = calculateShopBoostPrice(boostData.weeks);
  const receivedAmountCents = Math.round(parseFloat(body["amount_gross"] ?? "0") * 100);

  if (Math.abs(receivedAmountCents - expectedAmount) > 100) {
    await reportError(
      "payfast-itn-shopboost-amount-mismatch",
      new Error("Shop boost amount mismatch"),
      { expectedAmount, receivedAmountCents, paymentId: body["m_payment_id"] }
    );
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  try {
    await activateShopBoost(boostData.shopId, boostData.weeks);
    console.log(
      `[PayFast ITN] Shop boost activated: ${boostData.shopId} (${boostData.weeks}wk)`
    );
  } catch (err) {
    await reportError("payfast-itn-activate-shopboost", err, {
      shopId: boostData.shopId,
      weeks: boostData.weeks,
    });
    return NextResponse.json({ error: "Failed to activate shop boost" }, { status: 500 });
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

  // 1. Fetch order first so we can validate the amount before mutating state
  const order = await getOrderForWebhook(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Already paid → duplicate/replayed notification. Bail before
  // markOrderPaid, which would regress a SHIPPED order to CONFIRMED
  // and re-send WhatsApp notifications.
  if (order.paidAt) {
    console.log(`[PayFast ITN] Order ${orderId} already paid — skipping duplicate`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 2. Validate paid amount against stored order total
  const receivedCents = Math.round(parseFloat(body["amount_gross"] ?? "0") * 100);
  if (!Number.isSafeInteger(receivedCents) || receivedCents !== order.totalCents) {
    await reportError("payfast-itn-order-amount-mismatch", new Error("Order amount mismatch"), {
      orderId, expected: order.totalCents, received: receivedCents,
    });
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  try {
    // 3. Mark order as paid
    const payment = await markOrderPaid(orderId);
    if (payment.duplicate) return NextResponse.json({ received: true, duplicate: true });
    if (payment.reviewRequired) {
      await reportError("payfast-order-needs-review", new Error("Payment received for an order that cannot be fulfilled automatically"), { orderId });
      return NextResponse.json({ received: true, reviewRequired: true });
    }
    console.log(`[PayFast ITN] Order marked paid: ${orderId}`);

    // 4. Capture transaction fee
    try {
      // Track payment completion (fire-and-forget)
      void trackEvent({ type: "PAYMENT_COMPLETE", shopId: order.shopId });

      await createTransactionFee({
        orderId: order.id,
        shopId: order.shopId,
        orderAmountCents: order.totalCents,
        payfastPaymentId: body["pf_payment_id"],
      });
      console.log(`[PayFast ITN] Transaction fee captured for order ${orderId}`);

      // 5. Notify seller via WhatsApp
      try {
        const { sendOrderStatusUpdate, sendTextMessage } = await import("@/lib/whatsapp/business-api");
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

        // 6. Notify buyer via WhatsApp (payment confirmation)
        if (order.buyerPhone) {
          const trackUrl = `${appUrl}/track/${encodeURIComponent(order.orderNumber)}`;
          await sendTextMessage(
            order.buyerPhone,
            `✅ *Payment Received — ${order.orderNumber}*\n\n` +
            `Your payment to *${order.shop.name}* has been confirmed.\n\n` +
            `Track your order:\n${trackUrl}\n\n` +
            `The seller will prepare your order shortly.`,
          );
          console.log(`[PayFast ITN] Buyer notified: ${order.orderNumber}`);
        }
      } catch (notifyErr) {
        // Don't fail the webhook if notification fails
        console.error("[PayFast ITN] Notification failed:", notifyErr);
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
  paymentId: string,
  paymentStatus: string | undefined,
  body: Record<string, string>,
) {
  // m_payment_id format: "{shopId}:{planSlug}" (colon-delimited)
  // Legacy format (pre-hardening): plain shopId with no colon — handled gracefully
  const colonIdx = paymentId.lastIndexOf(":");
  const shopId = colonIdx !== -1 ? paymentId.slice(0, colonIdx) : paymentId;
  const planSlug = colonIdx !== -1 ? paymentId.slice(colonIdx + 1) : null;

  const token = body["token"]; // PayFast subscription token
  const incomingPlanSlug = planSlug ?? "pro";

  const [incomingPlan, current] = await Promise.all([
    db.plan.findUnique({ where: { slug: incomingPlanSlug }, select: { priceInCents: true } }),
    db.subscription.findUnique({
      where: { shopId },
      select: {
        status: true,
        payfastToken: true,
        plan: { select: { slug: true, priceInCents: true } },
      },
    }),
  ]);

  // Validate paid amount against the plan price
  if (paymentStatus === "COMPLETE" && planSlug && incomingPlan && incomingPlan.priceInCents > 0) {
    const receivedCents = Math.round(parseFloat(body["amount_gross"] ?? "0") * 100);
    if (Math.abs(receivedCents - incomingPlan.priceInCents) > 100) {
      await reportError("payfast-itn-subscription-amount-mismatch", new Error("Subscription amount mismatch"), {
        shopId, planSlug, expected: incomingPlan.priceInCents, received: receivedCents,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }
  }

  // A shop can have more than one PayFast subscription (an upgrade is a
  // second checkout), so the token decides what this notification means.
  // See lib/billing/subscription-itn.ts for the rules.
  const action = decideSubscriptionItn({
    paymentStatus,
    incomingPlanSlug,
    incomingPlanPriceCents: incomingPlan?.priceInCents ?? 0,
    incomingToken: token,
    current,
  });

  switch (action.type) {
    case "ACTIVATE": {
      await upgradeSubscription(shopId, action.planSlug, action.tokenToStore);
      console.log(`[PayFast ITN] Subscription activated: shop=${shopId} plan=${action.planSlug}`);

      // The seller upgraded through a new checkout, which left the
      // previous subscription billing. Stop it so they pay for one plan.
      // Runs after the upgrade so the CANCELLED ITN this triggers is
      // recognised as "superseded" and ignored.
      if (action.supersededToken) {
        const cancelled = await cancelPayFastSubscription(action.supersededToken);
        if (cancelled.ok) {
          console.log(`[PayFast ITN] Superseded subscription cancelled at PayFast for shop ${shopId}`);
        } else {
          // Non-fatal for the webhook, urgent for a human: the seller is
          // still being billed for the old plan as well as the new one.
          await reportError(
            "payfast-superseded-cancel-failed",
            new Error(
              `Old subscription is still billing after an upgrade — cancel it in the PayFast dashboard: ${describePayFastFailure(cancelled)}`,
            ),
            { shopId, planSlug: action.planSlug },
          );
        }
      }

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

    case "CHARGED_AFTER_CANCEL": {
      // They paid for another month, so they get it — but the
      // subscription stays cancelled and we stop PayFast again.
      await extendCancelledSubscription(shopId);
      const cancelled = await cancelPayFastSubscription(action.token);
      await reportError(
        "payfast-charged-after-cancel",
        new Error(
          `PayFast debited a subscription the seller had cancelled — a refund may be owed. Cancel at PayFast now: ${describePayFastFailure(cancelled)}`,
        ),
        { shopId, planSlug: incomingPlanSlug, paymentId: body["pf_payment_id"] },
      );
      break;
    }

    case "SUPERSEDED_SUBSCRIPTION_CHARGED": {
      // Plan is left exactly as it is; only the stale subscription is stopped.
      const cancelled = await cancelPayFastSubscription(action.staleToken);
      await reportError(
        "payfast-superseded-subscription-charged",
        new Error(
          `A replaced subscription was debited again — the seller paid for two plans and a refund may be owed. Cancel at PayFast now: ${describePayFastFailure(cancelled)}`,
        ),
        { shopId, planSlug: incomingPlanSlug, paymentId: body["pf_payment_id"] },
      );
      break;
    }

    case "MARK_CANCELLED": {
      await markSubscriptionCancelled(shopId);
      console.log(`[PayFast ITN] Subscription cancelled for shop ${shopId}`);
      break;
    }

    case "IGNORE":
      console.log(`[PayFast ITN] No action for shop ${shopId}: ${action.reason}`);
  }

  return NextResponse.json({ received: true });
}
