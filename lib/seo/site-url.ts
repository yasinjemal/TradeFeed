// ============================================================
// Canonical site origin for crawler-facing output
// ============================================================
// sitemap.xml, robots.txt and JSON-LD are read by machines that
// take every URL literally. If NEXT_PUBLIC_APP_URL is missing (or
// was left pointing at a developer machine) a production build
// must still emit the real origin — a sitemap full of
// http://localhost:3000 URLs silently de-indexes the site.
//
// Development keeps the localhost fallback so local previews link
// to themselves.
// ============================================================

export const PRODUCTION_ORIGIN = "https://tradefeed.co.za";
const DEVELOPMENT_ORIGIN = "http://localhost:3000";

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/i;

function normalise(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

function isLocal(origin: string): boolean {
  return LOCAL_HOST.test(new URL(origin).hostname);
}

export function resolveSiteUrl(env: {
  NEXT_PUBLIC_APP_URL?: string;
  NODE_ENV?: string;
}): string {
  const configured = normalise(env.NEXT_PUBLIC_APP_URL);
  if (env.NODE_ENV === "production") {
    return configured && !isLocal(configured) ? configured : PRODUCTION_ORIGIN;
  }
  return configured ?? DEVELOPMENT_ORIGIN;
}

/** Origin (no trailing slash) for sitemap, robots and structured data. */
export const SITE_ORIGIN = resolveSiteUrl({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
});
