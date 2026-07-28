// ============================================================
// Analytics visitor identity and request policy
// ============================================================
// Browser analytics use a random first-party identifier. The ID is
// deliberately independent of IP address and user-agent so it remains
// stable when a buyer changes networks without retaining network data.
// ============================================================

import {
  shouldLoadNonEssentialAnalytics,
  type AnalyticsConsent,
} from "@/lib/analytics/consent";
import type { Prisma } from "@prisma/client";

export const ANALYTICS_VISITOR_COOKIE = "tf_visitor_id";
export const ANALYTICS_VISITOR_HEADER = "x-tradefeed-visitor-id";
export const ANALYTICS_VISITOR_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const SYNTHETIC_MONITOR_HEADER = "x-tradefeed-synthetic";
export const SYNTHETIC_MONITOR_COOKIE = "tradefeed_synthetic";
export const SYNTHETIC_MONITOR_VALUE = "checkly";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Keep this deliberately conservative: these are recognisable crawlers,
// preview fetchers, synthetic monitors, or non-browser HTTP clients. Avoid a
// generic /bot/ match because legitimate low-cost CUBOT Android devices put
// "CUBOT" in their browser user-agent.
const OBVIOUS_BOT_PATTERN =
  /\b(?:googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|storebot-google|bingbot|bingpreview|yandexbot|baiduspider|duckduckbot|applebot|amazonbot|petalbot|bytespider|semrushbot|ahrefsbot|mj12bot|dotbot|gptbot|chatgpt-user|oai-searchbot|claudebot|facebookexternalhit|meta-externalagent|facebot|twitterbot|linkedinbot|pinterestbot|discordbot|slackbot|telegrambot|whatsapp|crawler|spider|slurp|headlesschrome|lighthouse|pagespeed|pingdom|uptimerobot|checkly)\b|(?:curl|wget|python-requests|postmanruntime|node-fetch|axios|go-http-client|java\/)/i;

export interface AnalyticsRequestContext {
  visitorId: string;
}

interface HeaderReader {
  get(name: string): string | null;
}

export const ACTIVATION_BUYER_VIEW_FILTER = {
  type: { in: ["PAGE_VIEW", "PRODUCT_VIEW"] },
  visitorId: { not: null },
} satisfies Prisma.AnalyticsEventWhereInput;

export function isValidAnalyticsVisitorId(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function resolveAnalyticsVisitorId(
  candidate: string | null | undefined,
  generate: () => string = () => crypto.randomUUID(),
): { visitorId: string; isNew: boolean } {
  if (isValidAnalyticsVisitorId(candidate)) {
    return { visitorId: candidate, isNew: false };
  }

  return { visitorId: generate(), isNew: true };
}

export function resolveConsentManagedVisitorId(
  consent: AnalyticsConsent | null,
  candidate: string | null | undefined,
  generate: () => string = () => crypto.randomUUID(),
): { visitorId: string; isNew: boolean } | null {
  if (!shouldLoadNonEssentialAnalytics(consent)) return null;
  return resolveAnalyticsVisitorId(candidate, generate);
}

export function analyticsVisitorCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    maxAge: ANALYTICS_VISITOR_MAX_AGE_SECONDS,
  };
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim() || null;
  }

  return null;
}

export function readAnalyticsVisitorId(headers: HeaderReader): string | null {
  const forwardedByProxy = headers.get(ANALYTICS_VISITOR_HEADER);
  return isValidAnalyticsVisitorId(forwardedByProxy) ? forwardedByProxy : null;
}

export function isSyntheticMonitorRequest(headers: HeaderReader): boolean {
  return (
    headers.get(SYNTHETIC_MONITOR_HEADER) === SYNTHETIC_MONITOR_VALUE ||
    readCookie(headers.get("cookie"), SYNTHETIC_MONITOR_COOKIE) ===
      SYNTHETIC_MONITOR_VALUE
  );
}

export function isObviousBot(userAgent: string | null | undefined): boolean {
  const value = userAgent?.trim();
  return !value || OBVIOUS_BOT_PATTERN.test(value);
}

export function buildAnalyticsRequestContext(
  headers: HeaderReader,
): AnalyticsRequestContext | null {
  if (isSyntheticMonitorRequest(headers)) return null;

  const visitorId = readAnalyticsVisitorId(headers);
  const userAgent = headers.get("user-agent");

  if (!visitorId || isObviousBot(userAgent)) return null;

  // User-Agent is used transiently for bot rejection only. Referrer and
  // User-Agent are deliberately not persisted in first-party analytics.
  return { visitorId };
}

export function shouldTrackBuyerView(
  context: AnalyticsRequestContext | null,
  isSignedInShopOwner: boolean,
): context is AnalyticsRequestContext {
  return context !== null && !isSignedInShopOwner;
}
