"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import {
  readAnalyticsConsentCookie,
  shouldLoadNonEssentialAnalytics,
} from "@/lib/analytics/consent";
import {
  sanitizeAnalyticsPathname,
  sanitizeAnalyticsUrl,
} from "@/lib/analytics/path-policy";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

interface ConsentManagedAnalyticsProps {
  googleAnalyticsId?: string;
  nonce?: string;
}

export function ConsentManagedAnalytics({
  googleAnalyticsId,
  nonce,
}: ConsentManagedAnalyticsProps) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  useEffect(() => {
    const consent = readAnalyticsConsentCookie(document.cookie);
    setEnabled(shouldLoadNonEssentialAnalytics(consent));
  }, []);

  useEffect(() => {
    if (!enabled || !googleAnalyticsId) return;

    // gtag.js consumes commands queued in dataLayer. Define the queue and
    // command function ourselves so consent/configuration cannot be lost if
    // this effect runs before or while the external script is loading.
    window.dataLayer ??= [];
    window.gtag ??= (...args: unknown[]) => {
      window.dataLayer!.push(args);
    };

    const disableKey = `ga-disable-${googleAnalyticsId}`;
    Object.assign(window, { [disableKey]: false });

    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", googleAnalyticsId, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      anonymize_ip: true,
      send_page_view: false,
      page_location: `${window.location.origin}${sanitizeAnalyticsPathname(pathname)}`,
      page_referrer: sanitizeAnalyticsUrl(document.referrer) ?? "",
      page_title: sanitizeAnalyticsPathname(pathname),
    });
    setGoogleConfigured(true);
  }, [enabled, googleAnalyticsId, pathname]);

  useEffect(() => {
    if (!enabled || !googleConfigured || !window.gtag) return;

    // Never send URL query strings: search terms and campaign payloads may
    // contain names, phone numbers, or other user-entered information.
    // Dynamic route identifiers are templated for the same reason.
    const safePathname = sanitizeAnalyticsPathname(pathname);
    window.gtag("event", "page_view", {
      page_location: `${window.location.origin}${safePathname}`,
      page_path: safePathname,
      page_referrer: sanitizeAnalyticsUrl(document.referrer) ?? "",
      page_title: safePathname,
    });
  }, [enabled, googleConfigured, pathname]);

  if (!enabled) return null;

  return (
    <>
      {googleAnalyticsId && (
        <Script
          id="ga4-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
          strategy="afterInteractive"
          nonce={nonce}
        />
      )}
      <Analytics
        beforeSend={(event) => {
          const safeUrl = sanitizeAnalyticsUrl(event.url);
          return safeUrl ? { ...event, url: safeUrl } : null;
        }}
      />
      <SpeedInsights
        beforeSend={(event) => {
          const safeUrl = sanitizeAnalyticsUrl(event.url);
          if (!safeUrl) return null;
          return {
            ...event,
            url: safeUrl,
            ...(event.route
              ? { route: sanitizeAnalyticsPathname(event.route) }
              : {}),
          };
        }}
      />
    </>
  );
}
