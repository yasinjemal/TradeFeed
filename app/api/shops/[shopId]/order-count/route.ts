// ============================================================
// API — Order Count (for notification polling)
// ============================================================
// Returns the current order count for a shop.
// Used by the OrderNotificationSound component to detect new orders.
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface RouteParams {
  params: Promise<{ shopId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { shopId } = await params;

  try {
    const count = await db.order.count({
      where: { shopId },
    });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
