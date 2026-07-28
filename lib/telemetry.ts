import * as Sentry from "@sentry/nextjs";
import { sanitizeTelemetryMeta } from "@/lib/telemetry-privacy";

type TelemetryMeta = Record<string, unknown>;

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { error };
}

export function reportRateLimitEvent(
  routeGroup: "catalog" | "api",
  _key: string,
  limit: number
) {
  console.warn("[telemetry] rate_limit", {
    routeGroup,
    limit,
    timestamp: new Date().toISOString(),
  });

  Sentry.addBreadcrumb({
    category: "rate-limit",
    message: `Rate limit hit: ${routeGroup}`,
    // `key` is commonly an IP address. It is intentionally excluded from
    // third-party telemetry and structured application logs.
    data: { limit },
    level: "warning",
  });
}

export async function reportError(
  context: string,
  error: unknown,
  meta: TelemetryMeta = {}
) {
  const safeMeta = sanitizeTelemetryMeta(meta);

  console.error("[telemetry] error", {
    context,
    ...serializeError(error),
    meta: safeMeta,
    timestamp: new Date().toISOString(),
  });

  Sentry.captureException(error, {
    tags: { context },
    extra: safeMeta,
  });
}
