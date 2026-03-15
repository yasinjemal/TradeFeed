// ============================================================
// GET /api/cron/seller-sequences — WhatsApp Follow-Up Sequences
// ============================================================
// Daily cron job that processes seller onboarding sequences.
// Sends contextual WhatsApp messages based on seller activity:
//  Day 0  → Welcome + catalog link
//  Day 3  → "Add your first product" (if 0 products)
//  Day 7  → "Share your catalog" (if no orders)
//  Day 14 → "Your shop needs attention" (if inactive)
//  Monthly → Activity summary
//
// Schedule: Daily at 09:00 SAST via Vercel Cron (vercel.json)
// Auth: Protected by CRON_SECRET header (Vercel sets this)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { processSellerSequences } from "@/lib/whatsapp/seller-sequences";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120; // Allow 2 min for large seller base

export async function GET(request: NextRequest) {
  // ── Verify cron secret ──
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[seller-sequences] CRON_SECRET is not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }
    console.warn("[seller-sequences] ⚠ No CRON_SECRET — running unprotected (dev only)");
  } else if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processSellerSequences();

    console.log("[seller-sequences] Complete:", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[seller-sequences] Failed:", error);
    return NextResponse.json(
      { error: "Sequence processing failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
