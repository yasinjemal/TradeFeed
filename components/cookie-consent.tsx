// ============================================================
// Cookie and analytics preferences
// ============================================================
// Explicit opt-in for non-essential measurement. The preference is stored in
// its own cookie so middleware can gate first-party analytics on the very
// next request; changing it never clears authentication or other site data.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  readAnalyticsConsentCookie,
  serializeAnalyticsConsentCookie,
  type AnalyticsConsent,
} from "@/lib/analytics/consent";

const LEGACY_CONSENT_KEY = "tradefeed-cookie-consent";

interface CookieConsentProps {
  googleAnalyticsId: string;
}

function expireBrowserAnalyticsCookies(googleAnalyticsId: string) {
  const gaCookieSuffix = googleAnalyticsId.replace(/^G-/, "");
  const knownNames = new Set(["_ga", "_gid", "_gat", `_ga_${gaCookieSuffix}`]);

  for (const cookie of document.cookie.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    const name = cookie.slice(0, separator).trim();
    if (name.startsWith("_ga") || knownNames.has(name)) knownNames.add(name);
  }

  const hostname = window.location.hostname;
  const labels = hostname.split(".").filter(Boolean);
  const domainCandidates = new Set<string>([hostname]);
  // A cookie can be scoped to any parent selected by GA or by a custom-domain
  // deployment. Try every suffix; browsers safely reject public suffixes such
  // as "co.za", while the real registrable parent ("tradefeed.co.za") is
  // reliably covered.
  for (let index = 1; index < labels.length - 1; index += 1) {
    domainCandidates.add(labels.slice(index).join("."));
  }

  for (const name of knownNames) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    for (const domain of domainCandidates) {
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Domain=${domain}`;
    }
  }
}

export function CookieConsent({ googleAnalyticsId }: CookieConsentProps) {
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    // The old "Got it" acknowledgement did not represent informed opt-in,
    // so it is intentionally not migrated to granted consent.
    localStorage.removeItem(LEGACY_CONSENT_KEY);
    const savedConsent = readAnalyticsConsentCookie(document.cookie);
    if (savedConsent !== "granted") {
      Object.assign(window, {
        [`ga-disable-${googleAnalyticsId}`]: true,
      });
      expireBrowserAnalyticsCookies(googleAnalyticsId);
    }
    setConsent(savedConsent);
    setReady(true);
  }, [googleAnalyticsId]);

  function savePreference(nextConsent: AnalyticsConsent) {
    document.cookie = serializeAnalyticsConsentCookie(
      nextConsent,
      window.location.protocol === "https:",
    );

    if (nextConsent === "denied") {
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      Object.assign(window, {
        [`ga-disable-${googleAnalyticsId}`]: true,
      });
      expireBrowserAnalyticsCookies(googleAnalyticsId);
    }

    setConsent(nextConsent);
    setEditing(false);

    // A reload applies the preference to middleware-created visitor identity
    // and starts/stops consented performance measurement before new activity.
    window.location.reload();
  }

  if (!ready) return null;

  const showChoices = consent === null || editing;

  if (!showChoices) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="fixed bottom-20 left-4 z-[70] rounded-lg border border-stone-300 bg-white/95 px-3 py-2 text-xs font-medium text-stone-700 shadow-sm backdrop-blur transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:bottom-4"
      >
        Privacy choices
      </button>
    );
  }

  return (
    <div
      className="fixed inset-x-4 bottom-20 z-[70] mx-auto max-w-lg sm:bottom-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analytics-consent-title"
      aria-describedby="analytics-consent-description"
    >
      <div className="rounded-xl border border-stone-200 bg-white p-4 text-stone-700 shadow-xl shadow-stone-950/15">
        <h2
          id="analytics-consent-title"
          className="text-sm font-semibold text-stone-900"
        >
          Choose your analytics preference
        </h2>
        <p
          id="analytics-consent-description"
          className="mt-1 text-xs leading-relaxed text-stone-600"
        >
          Essential cookies keep sign-in and security working. With your
          permission, we also use first-party analytics, GA4, Vercel Analytics,
          Speed Insights, and Sentry browser performance tracing to improve
          TradeFeed.{" "}
          <Link
            href="/privacy"
            className="font-medium text-emerald-700 hover:underline"
          >
            Read the privacy policy
          </Link>
          .
        </p>

        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {consent !== null && (
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => savePreference("denied")}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 focus-visible:ring-offset-2"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => savePreference("granted")}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
