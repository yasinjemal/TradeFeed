import { NextResponse } from "next/server";
import { deliverApprovedSellerAssistance } from "@/lib/db/seller-assistance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await deliverApprovedSellerAssistance();
    return NextResponse.json(result, { status: result.failed > 0 ? 500 : 200 });
  } catch {
    return NextResponse.json({ error: "Assistance delivery needs attention." }, { status: 500 });
  }
}
