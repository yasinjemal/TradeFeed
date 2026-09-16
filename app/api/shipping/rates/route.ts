import { NextResponse } from "next/server";
/** Estimates are not purchasable quotes. No courier booking adapter is currently enabled. */
export async function GET() {
  return NextResponse.json({ rates: [], message: "Arrange delivery and its cost with the seller, or choose collection." });
}
