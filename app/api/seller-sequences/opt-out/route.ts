// ============================================================
// POST /api/seller-sequences/opt-out — Toggle sequence opt-out
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopSlug, optOut } = body as { shopSlug: string; optOut: boolean };

    if (!shopSlug || typeof optOut !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.sellerSequenceState.upsert({
      where: { shopId: access.shopId },
      create: { shopId: access.shopId, optedOut: optOut },
      update: { optedOut: optOut },
    });

    return NextResponse.json({ success: true, optedOut: optOut });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
