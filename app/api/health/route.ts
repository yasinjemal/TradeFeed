// ============================================================
// GET /api/health — Health Check Endpoint
// ============================================================
// Returns system health status. Used by uptime monitors
// (e.g. BetterUptime, UptimeRobot) and deployment checks.
//
// Checks:
// - Database connectivity (SELECT 1)
// - Response time
// ============================================================

import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Never cache health checks
export const runtime = "nodejs";

export async function GET() {
  const start = Date.now();

  try {
    // Verify database connectivity
    await db.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: {
          status: "connected",
          latencyMs: dbLatencyMs,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    const elapsed = Date.now() - start;

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        db: {
          status: "disconnected",
          latencyMs: elapsed,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
