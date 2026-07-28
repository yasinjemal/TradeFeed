// ============================================================
// Analytics and telemetry route policy
// ============================================================
// Measurement systems need route shape, never order numbers, invitation
// tokens, review tokens, tenant slugs, product IDs, or arbitrary URL payloads.
// Keep this shared so GA4 and Sentry apply one route-templating rule.
// ============================================================

const SINGLE_SECRET_SEGMENT_ROUTES: Record<string, string> = {
  invite: "[token]",
  pay: "[orderNumber]",
  review: "[token]",
  s: "[shop]",
  track: "[orderNumber]",
};

const DASHBOARD_RESOURCE_SEGMENTS: Record<string, string> = {
  orders: "order",
  products: "product",
  reviews: "review",
  team: "member",
};

function cleanPathname(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0] || "/";
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

/**
 * Convert a concrete application pathname into a stable, non-identifying
 * route shape. Unknown routes keep their static path unless a segment looks
 * like a token or generated identifier.
 */
export function sanitizeAnalyticsPathname(value: string): string {
  const pathname = cleanPathname(value);
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const first = segments[0]!.toLowerCase();
  const singleSecretLabel = SINGLE_SECRET_SEGMENT_ROUTES[first];
  if (singleSecretLabel && segments.length > 1) {
    return `/${segments[0]}/${singleSecretLabel}`;
  }

  if (first === "catalog" && segments.length > 1) {
    segments[1] = "[shop]";
    if (segments[2] === "products" && segments.length > 3) {
      segments[3] = "[product]";
    }
  } else if (first === "dashboard" && segments.length > 1) {
    segments[1] = "[shop]";
    for (let index = 2; index < segments.length - 1; index += 1) {
      const resourceLabel = DASHBOARD_RESOURCE_SEGMENTS[segments[index]!];
      if (resourceLabel) {
        segments[index + 1] = `[${resourceLabel}]`;
      }
    }
  }

  return `/${segments
    .map((segment) =>
      /@|^[0-9a-f]{8}-[0-9a-f-]{27,}$|^[A-Za-z0-9_-]{24,}$/i.test(segment)
        ? "[redacted]"
        : segment,
    )
    .join("/")}`;
}

export function sanitizeAnalyticsUrl(value: string | undefined):
  | string
  | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return `${url.origin}${sanitizeAnalyticsPathname(url.pathname)}`.slice(
      0,
      2048,
    );
  } catch {
    return undefined;
  }
}

export function sanitizeSentryTransaction(
  value: unknown,
): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  const methodMatch = trimmed.match(/^([A-Z]+)\s+(\/.*)$/);
  if (methodMatch) {
    return `${methodMatch[1]} ${sanitizeAnalyticsPathname(methodMatch[2]!)}`;
  }

  const absoluteMethodMatch = trimmed.match(/^([A-Z]+)\s+(https?:\/\/\S+)$/i);
  if (absoluteMethodMatch) {
    try {
      const url = new URL(absoluteMethodMatch[2]!);
      return `${absoluteMethodMatch[1]!.toUpperCase()} ${sanitizeAnalyticsPathname(url.pathname)}`;
    } catch {
      return undefined;
    }
  }

  if (trimmed.startsWith("/")) return sanitizeAnalyticsPathname(trimmed);
  // Custom/free-form transaction names can contain customer values. Only
  // recognised application path shapes are retained.
  return undefined;
}
