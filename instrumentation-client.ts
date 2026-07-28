import * as Sentry from "@sentry/nextjs";

import {
  getConsentManagedTelemetrySampling,
  readAnalyticsConsentCookie,
} from "@/lib/analytics/consent";
import { sanitizeSentryEvent } from "@/lib/telemetry-privacy";

const analyticsConsent = readAnalyticsConsentCookie(
  typeof document === "undefined" ? null : document.cookie,
);
const sampling = getConsentManagedTelemetrySampling(
  analyticsConsent,
  process.env.NODE_ENV === "development",
);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Browser performance traces are non-essential and opt-in. Replay remains
  // disabled because its DOM metadata includes unsanitizable full URLs.
  tracesSampleRate: sampling.tracesSampleRate,
  replaysSessionSampleRate: sampling.replaysSessionSampleRate,
  replaysOnErrorSampleRate: sampling.replaysOnErrorSampleRate,

  integrations: [],

  // Essential error telemetry is available regardless of analytics choice,
  // but identifying request data and arbitrary extras are stripped.
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  beforeSend: (event) => sanitizeSentryEvent(event),
  beforeSendTransaction: (event) => sanitizeSentryEvent(event),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
