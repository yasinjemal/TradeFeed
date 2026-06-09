// ============================================================
// GET /api/cron/subscription-expiry — Expire paid subscriptions
// ============================================================
// Runs daily and downgrades any paid subscription whose
// currentPeriodEnd has passed back to the Free plan.
//
// WHO THIS AFFECTS:
//   - Admin-approved manual upgrades (no PayFast token):
//     downgraded as soon as currentPeriodEnd passes.
//   - PayFast recurring subscriptions (payfastToken set):
//     given a 3-day grace period (PayFast may be slow to
//     send the renewal COMPLETE webhook). After 3 days with
//     no renewal, downgraded to Free.
//     Note: if PayFast later sends a COMPLETE webhook the
//     subscription is automatically re-upgraded via the
//     normal ITN flow.
//
// Schedule: Daily at 01:00 UTC (vercel.json)
// Auth: CRON_SECRET bearer token (Vercel injects this)
// ============================================================

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[subscription-expiry] CRON_SECRET not set — rejecting");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    console.warn("[subscription-expiry] No CRON_SECRET — running unprotected (dev only)");
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Grace period for PayFast subscriptions: 3 days past period end.
    // Manual/admin subscriptions (no token) get no grace — expire immediately.
    const graceCutoff = new Date(now);
    graceCutoff.setDate(graceCutoff.getDate() - 3);

    // ── Find the free plan (target for downgrade) ─────────────
    const freePlan = await db.plan.findUnique({
      where: { slug: "free" },
      select: { id: true },
    });

    if (!freePlan) {
      console.error("[subscription-expiry] Free plan not found in DB — aborting");
      return NextResponse.json({ error: "Free plan missing" }, { status: 500 });
    }

    // ── Find expired subscriptions ────────────────────────────
    // Two groups:
    //   1. No PayFast token (admin-granted): expired if currentPeriodEnd < now
    //   2. PayFast token (recurring): expired if currentPeriodEnd < 3 days ago
    const expired = await db.subscription.findMany({
      where: {
        status: "ACTIVE",
        plan: { slug: { not: "free" } }, // only paid plans need downgrading
        OR: [
          // Manual/admin-approved — no grace period
          {
            payfastToken: null,
            currentPeriodEnd: { lt: now },
          },
          // PayFast recurring — 3-day grace period
          {
            payfastToken: { not: null },
            currentPeriodEnd: { lt: graceCutoff },
          },
        ],
      },
      select: {
        id: true,
        shopId: true,
        payfastToken: true,
        currentPeriodEnd: true,
        plan: { select: { name: true } },
        shop: { select: { name: true, slug: true } },
      },
    });

    if (expired.length === 0) {
      console.log("[subscription-expiry] No expired subscriptions found");
      return NextResponse.json({ status: "ok", expired: 0, timestamp: now.toISOString() });
    }

    // ── Downgrade each expired subscription to Free ───────────
    const results = await Promise.allSettled(
      expired.map((sub) =>
        db.subscription.update({
          where: { id: sub.id },
          data: {
            planId: freePlan.id,
            status: "ACTIVE", // still active — just on the Free plan now
            payfastToken: null,
            currentPeriodEnd: null, // free plan has no period end
          },
        }).then(() => {
          console.log(
            `[subscription-expiry] Downgraded: ${sub.shop.name} (${sub.shop.slug}) ` +
            `from ${sub.plan.name} — expired ${sub.currentPeriodEnd?.toISOString()}`
          );
          return sub.shop.slug;
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    if (failed > 0) {
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => r.reason);
      console.error("[subscription-expiry] Some downgrades failed:", errors);
    }

    const summary = {
      status: "ok",
      timestamp: now.toISOString(),
      expired: expired.length,
      succeeded,
      failed,
      shops: expired.map((s) => ({
        slug: s.shop.slug,
        fromPlan: s.plan.name,
        periodEnd: s.currentPeriodEnd?.toISOString(),
        wasPayFast: !!s.payfastToken,
      })),
    };

    console.log("[subscription-expiry] Done:", JSON.stringify(summary));
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("[subscription-expiry] Error:", error);
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString(), error: String(error) },
      { status: 500 }
    );
  }
}
