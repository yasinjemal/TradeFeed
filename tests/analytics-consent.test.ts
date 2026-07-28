import test from "node:test";
import assert from "node:assert/strict";

import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_CONSENT_MAX_AGE_SECONDS,
  analyticsConsentCookieOptions,
  getConsentManagedTelemetrySampling,
  parseAnalyticsConsent,
  readAnalyticsConsentCookie,
  serializeAnalyticsConsentCookie,
  shouldLoadNonEssentialAnalytics,
} from "@/lib/analytics/consent";
import { resolveConsentManagedVisitorId } from "@/lib/analytics/visitor";

const VISITOR_ID = "123e4567-e89b-42d3-a456-426614174000";

test("analytics is denied unless the persisted value is explicitly granted", () => {
  assert.equal(parseAnalyticsConsent("granted"), "granted");
  assert.equal(parseAnalyticsConsent("denied"), "denied");
  assert.equal(parseAnalyticsConsent("accepted"), null);
  assert.equal(parseAnalyticsConsent("GRANTED"), null);
  assert.equal(parseAnalyticsConsent(undefined), null);

  assert.equal(shouldLoadNonEssentialAnalytics(null), false);
  assert.equal(shouldLoadNonEssentialAnalytics("denied"), false);
  assert.equal(shouldLoadNonEssentialAnalytics("granted"), true);
});

test("analytics choice is read from its dedicated cookie and persists", () => {
  assert.equal(
    readAnalyticsConsentCookie(
      `session=essential; ${ANALYTICS_CONSENT_COOKIE}=denied; theme=light`,
    ),
    "denied",
  );
  assert.equal(
    readAnalyticsConsentCookie(`${ANALYTICS_CONSENT_COOKIE}=invalid`),
    null,
  );

  const serialized = serializeAnalyticsConsentCookie("denied", true);
  assert.match(serialized, new RegExp(`^${ANALYTICS_CONSENT_COOKIE}=denied`));
  assert.match(serialized, /Max-Age=31536000/);
  assert.match(serialized, /SameSite=Lax/);
  assert.match(serialized, /Path=\//);
  assert.match(serialized, /Secure/);

  const options = analyticsConsentCookieOptions(true);
  assert.equal(options.httpOnly, false);
  assert.equal(options.secure, true);
  assert.equal(options.maxAge, ANALYTICS_CONSENT_MAX_AGE_SECONDS);
});

test("missing or denied consent cannot create a first-party visitor identity", () => {
  let generated = false;
  const generate = () => {
    generated = true;
    return VISITOR_ID;
  };

  assert.equal(resolveConsentManagedVisitorId(null, undefined, generate), null);
  assert.equal(
    resolveConsentManagedVisitorId("denied", undefined, generate),
    null,
  );
  assert.equal(generated, false);

  assert.deepEqual(
    resolveConsentManagedVisitorId("granted", undefined, generate),
    { visitorId: VISITOR_ID, isNew: true },
  );
  assert.equal(generated, true);
});

test("browser tracing and Replay sampling stay off until opt-in", () => {
  assert.deepEqual(getConsentManagedTelemetrySampling(null, false), {
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
  assert.deepEqual(getConsentManagedTelemetrySampling("denied", true), {
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
  assert.deepEqual(getConsentManagedTelemetrySampling("granted", false), {
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
});
