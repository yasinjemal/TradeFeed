// ============================================================
// Analytics consent policy
// ============================================================
// This cookie is intentionally readable by browser JavaScript so people can
// change their preference without clearing unrelated authentication data.
// It controls only non-essential measurement; authentication and security
// cookies are governed separately by the services that provide them.
// ============================================================

export const ANALYTICS_CONSENT_COOKIE = "tf_analytics_consent_v1";
export const ANALYTICS_CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const ANALYTICS_CONSENT_OPEN_EVENT =
  "tradefeed:open-analytics-preferences";

export type AnalyticsConsent = "granted" | "denied";

export function parseAnalyticsConsent(
  value: string | null | undefined,
): AnalyticsConsent | null {
  return value === "granted" || value === "denied" ? value : null;
}

function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;

    const rawValue = part.slice(separator + 1).trim();
    if (!rawValue) return null;

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return null;
    }
  }

  return null;
}

export function readAnalyticsConsentCookie(
  cookieHeader: string | null | undefined,
): AnalyticsConsent | null {
  if (!cookieHeader) return null;
  return parseAnalyticsConsent(readCookie(cookieHeader, ANALYTICS_CONSENT_COOKIE));
}

export function shouldLoadNonEssentialAnalytics(
  consent: AnalyticsConsent | null,
): boolean {
  return consent === "granted";
}

export function analyticsConsentCookieOptions(isProduction: boolean) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: ANALYTICS_CONSENT_MAX_AGE_SECONDS,
  };
}

export function serializeAnalyticsConsentCookie(
  consent: AnalyticsConsent,
  isSecure: boolean,
): string {
  const secure = isSecure ? "; Secure" : "";
  return [
    `${ANALYTICS_CONSENT_COOKIE}=${encodeURIComponent(consent)}`,
    "Path=/",
    `Max-Age=${ANALYTICS_CONSENT_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ") + secure;
}

export interface ConsentManagedTelemetrySampling {
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

export function getConsentManagedTelemetrySampling(
  consent: AnalyticsConsent | null,
  isDevelopment: boolean,
): ConsentManagedTelemetrySampling {
  if (!shouldLoadNonEssentialAnalytics(consent)) {
    return {
      tracesSampleRate: 0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    };
  }

  return {
    tracesSampleRate: isDevelopment ? 1 : 0.2,
    // Replay DOM metadata includes the full browser URL and cannot currently
    // be passed through our route sanitizer. Keep it disabled even with
    // analytics consent.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  };
}
