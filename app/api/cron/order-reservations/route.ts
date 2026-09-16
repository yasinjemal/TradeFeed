import {revalidatePath} from "next/cache";
import { NextResponse } from "next/server";
import { expireOrderReservations } from "@/lib/orders/lifecycle";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await expireOrderReservations();
    if (result.expired) {revalidatePath("/marketplace");revalidatePath("/catalog/[slug]", "layout");}
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Reservation expiry failed" }, { status: 500 });
  }
}
