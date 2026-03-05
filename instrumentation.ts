import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // ── DB Health Check — auto-heal critical columns on startup ──
    // Runs once per cold start. Catches search_vector desync before
    // any product creation fails with P2022.
    try {
      const { runDbHealthCheck } = await import("./scripts/db-health-check");
      const result = await runDbHealthCheck({ autoFix: true, verbose: false });
      const fixed = result.checks.filter((c) => c.status === "fixed");
      if (fixed.length > 0) {
        console.warn(
          `[DB Health] Auto-fixed ${fixed.length} issue(s):`,
          fixed.map((c) => c.name).join(", ")
        );
      }
    } catch (err) {
      // Never block app startup — just log the failure
      console.error("[DB Health] Check failed (non-blocking):", err);
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors from Server Components, middleware, and proxies
export const onRequestError = Sentry.captureRequestError;
