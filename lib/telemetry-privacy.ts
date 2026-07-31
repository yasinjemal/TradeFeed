import {
  sanitizeAnalyticsUrl,
  sanitizeSentryTransaction,
} from "@/lib/analytics/path-policy";

const SAFE_TELEMETRY_META_KEYS = new Set([
  "approve",
  "clerkUserId",
  "draftId",
  "expected",
  "expectedAmount",
  "huntMediaKey",
  "itemCount",
  "jobId",
  "newStatus",
  "orderId",
  "paymentId",
  "paymentStatus",
  "planSlug",
  "productId",
  "productImageId",
  "received",
  "receivedAmountCents",
  "reviewId",
  "route",
  "shopId",
  "shopSlug",
  "status",
  "tier",
  "weeks",
]);

type TelemetryMeta = Record<string, unknown>;

const SAFE_CONTEXT_KEYS: Record<string, ReadonlySet<string>> = {
  trace: new Set([
    "trace_id",
    "span_id",
    "parent_span_id",
    "op",
    "status",
    "origin",
    "sampled",
  ]),
  runtime: new Set(["name", "version", "raw_description"]),
  os: new Set(["name", "version", "build", "kernel_version"]),
  browser: new Set(["name", "version"]),
  device: new Set(["arch", "brand", "family", "model"]),
  app: new Set([
    "app_name",
    "app_version",
    "app_build",
    "build_type",
    "app_identifier",
    "app_start_time",
    "app_memory",
    "in_foreground",
  ]),
};

function safePrimitive(value: unknown): string | number | boolean | null | undefined {
  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") return value.slice(0, 200);
  return undefined;
}

export function sanitizeTelemetryMeta(meta: TelemetryMeta): TelemetryMeta {
  const sanitized: TelemetryMeta = {};

  for (const [key, value] of Object.entries(meta)) {
    if (!SAFE_TELEMETRY_META_KEYS.has(key)) continue;
    const safeValue = safePrimitive(value);
    if (safeValue !== undefined) sanitized[key] = safeValue;
  }

  return sanitized;
}

function sanitizeContexts(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [contextName, allowedKeys] of Object.entries(SAFE_CONTEXT_KEYS)) {
    const context = (value as Record<string, unknown>)[contextName];
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      continue;
    }

    const safeContext: Record<string, unknown> = {};
    for (const [key, rawValue] of Object.entries(
      context as Record<string, unknown>,
    )) {
      if (!allowedKeys.has(key)) continue;
      const safeValue = safePrimitive(rawValue);
      if (safeValue !== undefined) safeContext[key] = safeValue;
    }

    if (Object.keys(safeContext).length > 0) {
      sanitized[contextName] = safeContext;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function sanitizeSpans(value: unknown): unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value
    .filter((span) => span && typeof span === "object" && !Array.isArray(span))
    .map((span) => {
      const sanitized = { ...(span as Record<string, unknown>) };
      // Span descriptions and data commonly contain full URLs, SQL values,
      // request payloads, or custom attributes. Timing and trace identifiers
      // remain available without those free-form fields.
      delete sanitized.data;
      delete sanitized.description;
      return sanitized;
    });
}

function sanitizeStacktrace(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const frames = (value as { frames?: unknown }).frames;
  if (!Array.isArray(frames)) return undefined;

  const safeFrames = frames
    .filter((frame) => frame && typeof frame === "object" && !Array.isArray(frame))
    .map((frame) => {
      const source = frame as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      for (const key of [
        "function",
        "module",
        "lineno",
        "colno",
        "in_app",
        "package",
        "instruction_addr",
        "addr_mode",
        "platform",
      ]) {
        const safeValue = safePrimitive(source[key]);
        if (safeValue !== undefined) sanitized[key] = safeValue;
      }

      if (typeof source.filename === "string") {
        sanitized.filename =
          sanitizeAnalyticsUrl(source.filename) ??
          source.filename.split(/[?#]/, 1)[0];
      }
      if (typeof source.abs_path === "string") {
        sanitized.abs_path =
          sanitizeAnalyticsUrl(source.abs_path) ??
          source.abs_path.split(/[?#]/, 1)[0];
      }

      return sanitized;
    });

  return safeFrames.length > 0 ? { frames: safeFrames } : undefined;
}

function sanitizeException(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const values = (value as { values?: unknown }).values;
  if (!Array.isArray(values)) return undefined;

  const safeValues = values
    .filter(
      (exception) =>
        exception && typeof exception === "object" && !Array.isArray(exception),
    )
    .map((exception) => {
      const source = exception as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      // Free-form exception values frequently contain customer input, tokens,
      // phone numbers, or payment references. Error class + code location are
      // enough to group and debug an incident without forwarding that text.
      if (typeof source.type === "string") {
        sanitized.type = source.type.slice(0, 200);
      }

      const stacktrace = sanitizeStacktrace(source.stacktrace);
      if (stacktrace) sanitized.stacktrace = stacktrace;

      if (
        source.mechanism &&
        typeof source.mechanism === "object" &&
        !Array.isArray(source.mechanism)
      ) {
        const mechanism = source.mechanism as Record<string, unknown>;
        sanitized.mechanism = {
          ...(typeof mechanism.type === "string"
            ? { type: mechanism.type.slice(0, 200) }
            : {}),
          ...(typeof mechanism.handled === "boolean"
            ? { handled: mechanism.handled }
            : {}),
          ...(typeof mechanism.synthetic === "boolean"
            ? { synthetic: mechanism.synthetic }
            : {}),
        };
      }

      return sanitized;
    });

  return safeValues.length > 0 ? { values: safeValues } : undefined;
}

/**
 * Keep operational error context while removing browser identity, cookies,
 * headers, request bodies, query strings, and arbitrary extras.
 */
export function sanitizeSentryEvent<T>(event: T): T {
  const source = event as Record<string, unknown>;
  const sanitized: Record<string, unknown> = { ...source };
  delete sanitized.user;
  delete sanitized.breadcrumbs;
  delete sanitized.tags;
  delete sanitized.fingerprint;
  delete sanitized.message;
  delete sanitized.logentry;
  delete sanitized.culprit;

  const request =
    source.request && typeof source.request === "object"
      ? (source.request as { method?: string; url?: string })
      : undefined;
  if (request) {
    sanitized.request = {
      method: request.method,
      url: sanitizeAnalyticsUrl(request.url),
    };
  }

  const transaction = sanitizeSentryTransaction(source.transaction);
  if (transaction) sanitized.transaction = transaction;
  else delete sanitized.transaction;

  const extra =
    source.extra && typeof source.extra === "object"
      ? (source.extra as TelemetryMeta)
      : undefined;
  if (extra) {
    sanitized.extra = sanitizeTelemetryMeta(extra);
  }

  const contexts = sanitizeContexts(source.contexts);
  if (contexts) sanitized.contexts = contexts;
  else delete sanitized.contexts;

  const spans = sanitizeSpans(source.spans);
  if (spans) sanitized.spans = spans;
  else delete sanitized.spans;

  const exception = sanitizeException(source.exception);
  if (exception) sanitized.exception = exception;
  else delete sanitized.exception;

  return sanitized as T;
}
