// ============================================================
// API — Search Autocomplete (/api/search/autocomplete)
// ============================================================
// Returns lightweight product name + category suggestions
// for the marketplace search typeahead. Uses trigram similarity
// for fuzzy matching and ILIKE fallback.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const rl = rateLimit(`autocomplete:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ products: [], categories: [] }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [] });
  }

  const safeQuery = q.replace(/[^\w\s-]/g, "").slice(0, 100);

  try {
    const [products, categories] = await Promise.all([
      // Top 6 product name matches via ILIKE (fast, index-friendly)
      db.product.findMany({
        where: {
          isActive: true,
          name: { contains: safeQuery, mode: "insensitive" },
          shop: { isActive: true },
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: 6,
      }),
      // Top 3 matching global categories
      db.globalCategory.findMany({
        where: {
          name: { contains: safeQuery, mode: "insensitive" },
        },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
        take: 3,
      }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({ name: p.name, slug: p.slug })),
      categories: categories.map((c) => ({ name: c.name, slug: c.slug })),
    });
  } catch {
    return NextResponse.json({ products: [], categories: [] });
  }
}
