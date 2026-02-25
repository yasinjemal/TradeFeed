// ============================================================
// GET /api/cron/data-retention — POPIA Data Retention
// ============================================================
// Scheduled job to purge old buyer PII from orders.
// South Africa's POPIA requires data minimisation — we don't
// keep personal data longer than necessary.
//
// Schedule: Monthly via Vercel Cron (vercel.json)
// Auth: Protected by CRON_SECRET header (Vercel sets this)
//
// What it does:
// - Orders older than 24 months: NULL-out buyerName, buyerPhone
// - Orders older than 36 months: NULL-out buyerNote, delivery address
// - Returns count of affected records for audit logging
// ============================================================

import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60s for large datasets

export async function GET(request: NextRequest) {
  // ── Verify cron secret (Vercel injects this header) ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
    };

    console.log("[data-retention] Purge complete:", JSON.stringify(summary));

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("[data-retention] Error:", error);

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
