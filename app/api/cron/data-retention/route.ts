// ============================================================
// GET /api/cron/data-retention — POPIA Data Retention
// ============================================================
// Scheduled job to purge old buyer PII from orders.
// South Africa's POPIA requires data minimisation — we don't
// keep personal data longer than necessary.
//
// Schedule: Daily via Vercel Cron (vercel.json)
// Auth: Protected by CRON_SECRET header (Vercel sets this)
//
// What it does:
// - Orders older than 24 months: NULL-out buyerName, buyerPhone
// - Orders older than 36 months: NULL-out buyerNote, delivery address
// - Returns count of affected records for audit logging
// ============================================================

import { db } from "@/lib/db";
import { cleanupExpiredHuntRateLimitBuckets } from "@/lib/db/hunt-rate-limit";
import { processQueuedHuntMediaDeletions } from "@/lib/hunt/media-deletion";
import { queueCronHeartbeat } from "@/lib/monitoring/better-stack";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for large datasets

export async function GET(request: NextRequest) {
  // ── Verify cron secret (Vercel injects this header) ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    // CRON_SECRET not set — reject in production, warn in dev
    if (process.env.NODE_ENV === "production") {
      console.error("[data-retention] CRON_SECRET is not set — rejecting request");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    console.warn("[data-retention] ⚠ No CRON_SECRET — running unprotected (dev only)");
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();

    // 24 months ago — remove buyer contact info
    const piiCutoff = new Date(now);
    piiCutoff.setMonth(piiCutoff.getMonth() - 24);

    // 36 months ago — remove delivery details + notes
    const deepCutoff = new Date(now);
    deepCutoff.setMonth(deepCutoff.getMonth() - 36);

    // ── Phase 1: Purge buyer PII (24+ months) ──
    const piiResult = await db.order.updateMany({
      where: {
        createdAt: { lt: piiCutoff },
        OR: [
          { buyerName: { not: null } },
          { buyerPhone: { not: null } },
        ],
      },
      data: {
        buyerName: null,
        buyerPhone: null,
      },
    });

    // ── Phase 2: Purge delivery + notes (36+ months) ──
    const deepResult = await db.order.updateMany({
      where: {
        createdAt: { lt: deepCutoff },
        OR: [
          { buyerNote: { not: null } },
          { deliveryAddress: { not: null } },
          { deliveryCity: { not: null } },
          { deliveryProvince: { not: null } },
          { deliveryPostalCode: { not: null } },
        ],
      },
      data: {
        buyerNote: null,
        deliveryAddress: null,
        deliveryCity: null,
        deliveryProvince: null,
        deliveryPostalCode: null,
      },
    });

    // ── Phase 3: Purge old analytics events (90+ days) ──
    const analyticsCutoff = new Date(now);
    analyticsCutoff.setDate(analyticsCutoff.getDate() - 90);

    const analyticsResult = await db.analyticsEvent.deleteMany({
      where: {
        createdAt: { lt: analyticsCutoff },
      },
    });

    // â”€â”€ Phase 4: Expire elapsed Hunts and purge due HUNT records â”€â”€
    // HUNT uses a per-request purgeAfter timestamp so requester PII, anonymous
    // participant identifiers, operational records, offers, and reference
    // media share one reviewable retention boundary.
    const expiredHunts = await db.hunt.updateMany({
      where: {
        status: "LIVE",
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    const huntsDueForPurge = await db.hunt.findMany({
      where: {
        privateData: { is: { purgeAfter: { lte: now } } },
      },
      select: {
        id: true,
        publicImageKey: true,
      },
      orderBy: { createdAt: "asc" },
      take: 1_000,
    });

    let huntsPurged = 0;
    let huntPurgeFailures = 0;
    for (const hunt of huntsDueForPurge) {
      try {
        await db.$transaction(async (tx) => {
          if (hunt.publicImageKey) {
            await tx.huntMediaDeletionJob.upsert({
              where: { fileKey: hunt.publicImageKey },
              create: {
                fileKey: hunt.publicImageKey,
                reason: "hunt-retention",
              },
              update: {
                reason: "hunt-retention",
                nextAttemptAt: now,
              },
            });
          }
          // Deleting the Hunt cascades requester PII and operational records.
          // It must not wait for an external storage provider to be available.
          await tx.hunt.delete({ where: { id: hunt.id } });
        });
        huntsPurged += 1;
      } catch (error) {
        huntPurgeFailures += 1;
        console.error(
          `[data-retention] Failed to purge HUNT ${hunt.id}:`,
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    const huntMedia = await processQueuedHuntMediaDeletions(200);

    const huntAuditCutoff = new Date(
      now.getTime() - 180 * 24 * 60 * 60 * 1_000,
    );
    const huntAuditResult = await db.adminAuditLog.deleteMany({
      where: {
        action: { startsWith: "HUNT_" },
        createdAt: { lte: huntAuditCutoff },
      },
    });
    const huntRateLimitBucketsDeleted =
      await cleanupExpiredHuntRateLimitBuckets(now);

    const summary = {
      status: "ok",
      timestamp: now.toISOString(),
      piiPurged: {
        cutoffDate: piiCutoff.toISOString(),
        ordersAffected: piiResult.count,
        fields: ["buyerName", "buyerPhone"],
      },
      deepPurged: {
        cutoffDate: deepCutoff.toISOString(),
        ordersAffected: deepResult.count,
        fields: ["buyerNote", "deliveryAddress", "deliveryCity", "deliveryProvince", "deliveryPostalCode"],
      },
      analyticsPurged: {
        cutoffDate: analyticsCutoff.toISOString(),
        eventsDeleted: analyticsResult.count,
      },
      hunts: {
        expired: expiredHunts.count,
        due: huntsDueForPurge.length,
        purged: huntsPurged,
        failures: huntPurgeFailures,
        media: huntMedia,
        auditRowsDeleted: huntAuditResult.count,
        rateLimitBucketsDeleted: huntRateLimitBucketsDeleted,
      },
    };

    console.log("[data-retention] Purge complete:", JSON.stringify(summary));
    queueCronHeartbeat("data-retention", "success");

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("[data-retention] Error:", error);
    queueCronHeartbeat("data-retention", "failure");

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
