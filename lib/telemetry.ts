import * as Sentry from "@sentry/nextjs";

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
  key: string,
  limit: number
) {
  console.warn("[telemetry] rate_limit", {
    routeGroup,
    key,
    limit,
    timestamp: new Date().toISOString(),
  });

  Sentry.addBreadcrumb({
    category: "rate-limit",
    message: `Rate limit hit: ${routeGroup}`,
    data: { key, limit },
    level: "warning",
  });
}

export async function reportError(
  context: string,
  error: unknown,
  meta: TelemetryMeta = {}
) {
  console.error("[telemetry] error", {
    context,
    ...serializeError(error),
    meta,
    timestamp: new Date().toISOString(),
  });

  Sentry.captureException(error, {
    tags: { context },
    extra: meta,
  });
}
