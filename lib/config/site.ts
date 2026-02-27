// ============================================================
// Site Configuration — Centralized URLs & Branding
// ============================================================
// Single source of truth for site URL, domain, and branding.
// Imported everywhere that needs the canonical URL — no more
// hardcoded "tradefeed.co.za" scattered across 20+ files.
//
// RULES:
// - SITE_URL: Full URL with protocol (https://www.tradefeed.co.za)
// - SITE_DOMAIN: Display domain without protocol (www.tradefeed.co.za)
// - Email addresses use the bare domain (tradefeed.co.za) — NOT www
// - Client components can import this file (no server-only deps)
// ============================================================

/**
 * Canonical site URL (with protocol).
 * Reads from NEXT_PUBLIC_APP_URL env var, falls back to production URL.
 *
 * Usage: `${SITE_URL}/catalog/${slug}`
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.tradefeed.co.za";

/**
 * Display domain (no protocol, no trailing slash).
 * Used in UI where we show the domain text to users.
 *
 * Usage: `${SITE_DOMAIN}/catalog/${slug}` → "www.tradefeed.co.za/catalog/my-shop"
 */
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "").replace(
  /\/$/,
  ""
);

/**
 * Bare email domain (no www prefix).
 * Email addresses should use the root domain, not www.
 */
export const EMAIL_DOMAIN = "tradefeed.co.za";
