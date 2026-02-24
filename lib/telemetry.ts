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

  // Optional Sentry bridge: only used when package + DSN are configured.
  if (!process.env.SENTRY_DSN) return;

  try {
    const dynamicImport = new Function("m", "return import(m)") as (
      moduleName: string
    ) => Promise<{ captureException: (err: unknown, data?: unknown) => void }>;
    const sentry = await dynamicImport("@sentry/nextjs");
    sentry.captureException(error, {
      tags: { context },
      extra: meta,
    });
  } catch {
    // Keep telemetry best-effort only.
  }
}
