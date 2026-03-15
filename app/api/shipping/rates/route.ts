// ============================================================
// API — Shipping Rate Quotes (/api/shipping/rates)
// ============================================================
// Returns available shipping rates for a given origin → destination.
// Called from checkout to show shipping options to buyer.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getShippingRates, SA_PROVINCES } from "@/lib/shipping/rates";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const originProvince = params.get("originProvince");
  const destinationProvince = params.get("destinationProvince");
  const originCity = params.get("originCity") ?? undefined;
  const destinationCity = params.get("destinationCity") ?? undefined;

  if (!originProvince || !destinationProvince) {
    return NextResponse.json(
      { error: "originProvince and destinationProvince are required" },
      { status: 400 },
    );
  }

  // Validate provinces
  const validProvinces = SA_PROVINCES.map((p) => p.toLowerCase());
  if (
    !validProvinces.includes(originProvince.toLowerCase()) ||
    !validProvinces.includes(destinationProvince.toLowerCase())
  ) {
    return NextResponse.json(
      { error: "Invalid province name" },
      { status: 400 },
    );
  }

  const rates = getShippingRates({
    originProvince,
    destinationProvince,
    originCity,
    destinationCity,
  });

  return NextResponse.json({ rates });
}
