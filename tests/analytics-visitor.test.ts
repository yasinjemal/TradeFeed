import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVATION_BUYER_VIEW_FILTER,
  ANALYTICS_VISITOR_COOKIE,
  ANALYTICS_VISITOR_HEADER,
  analyticsVisitorCookieOptions,
  buildAnalyticsRequestContext,
  isObviousBot,
  isSyntheticMonitorRequest,
  readAnalyticsVisitorId,
  resolveAnalyticsVisitorId,
  shouldTrackBuyerView,
} from "@/lib/analytics/visitor";

const VISITOR_ID = "018f9028-8940-77c0-8df7-b159c06fc426";
const NEXT_VISITOR_ID = "123e4567-e89b-42d3-a456-426614174000";
const CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36";

test("visitor identity reuses a valid first-party ID", () => {
  let generated = false;
  const resolved = resolveAnalyticsVisitorId(VISITOR_ID, () => {
    generated = true;
    return NEXT_VISITOR_ID;
  });

  assert.deepEqual(resolved, { visitorId: VISITOR_ID, isNew: false });
  assert.equal(generated, false);
});

test("visitor identity replaces missing or attacker-controlled values", () => {
  assert.deepEqual(
    resolveAnalyticsVisitorId("not-a-valid-id", () => NEXT_VISITOR_ID),
    { visitorId: NEXT_VISITOR_ID, isNew: true },
  );
  assert.deepEqual(
    resolveAnalyticsVisitorId(undefined, () => NEXT_VISITOR_ID),
    { visitorId: NEXT_VISITOR_ID, isNew: true },
  );
});

test("production visitor cookie is httpOnly, secure, same-site, and durable", () => {
  const options = analyticsVisitorCookieOptions(true);

  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.ok(options.maxAge >= 365 * 24 * 60 * 60);
  assert.equal(analyticsVisitorCookieOptions(false).secure, false);
});

test("first request uses only the proxy-forwarded random visitor ID", () => {
  const requestHeaders = new Headers({
    [ANALYTICS_VISITOR_HEADER]: VISITOR_ID,
    "user-agent": CHROME_UA,
    referer: "https://www.google.com/search?q=private+phone+number",
    "x-forwarded-for": "203.0.113.42",
  });

  const context = buildAnalyticsRequestContext(requestHeaders);

  assert.deepEqual(context, { visitorId: VISITOR_ID });
  assert.equal("ip" in context!, false);
  assert.equal("userAgent" in context!, false);
  assert.equal("referrer" in context!, false);
});

test("raw analytics cookies are ignored unless the consent proxy forwards the ID", () => {
  const requestHeaders = new Headers({
    cookie: `another=value; ${ANALYTICS_VISITOR_COOKIE}=${VISITOR_ID}`,
  });

  assert.equal(readAnalyticsVisitorId(requestHeaders), null);
  assert.equal(buildAnalyticsRequestContext(requestHeaders), null);

  requestHeaders.set(ANALYTICS_VISITOR_HEADER, VISITOR_ID);
  assert.equal(readAnalyticsVisitorId(requestHeaders), VISITOR_ID);
});

test("obvious bots and non-browser clients are excluded", () => {
  assert.equal(isObviousBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isObviousBot("facebookexternalhit/1.1"), true);
  assert.equal(isObviousBot("meta-externalagent/1.1"), true);
  assert.equal(isObviousBot("curl/8.5.0"), true);
  assert.equal(
    isObviousBot("TradeFeed-Checkly/1.0 (+https://www.checklyhq.com/)"),
    true,
  );
  assert.equal(
    buildAnalyticsRequestContext(
      new Headers({
        [ANALYTICS_VISITOR_HEADER]: VISITOR_ID,
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
      }),
    ),
    null,
  );
});

test("CUBOT Android buyers are not mistaken for generic bots", () => {
  assert.equal(
    isObviousBot(
      "Mozilla/5.0 (Linux; Android 11; CUBOT X30) AppleWebKit/537.36 Chrome/109.0 Mobile Safari/537.36",
    ),
    false,
  );
});

test("synthetic monitor markers cannot enter buyer analytics", () => {
  const requestHeaders = new Headers({
    [ANALYTICS_VISITOR_HEADER]: VISITOR_ID,
    "x-tradefeed-synthetic": "checkly",
    "user-agent": CHROME_UA,
  });

  assert.equal(isSyntheticMonitorRequest(requestHeaders), true);
  assert.equal(buildAnalyticsRequestContext(requestHeaders), null);
  assert.equal(
    isSyntheticMonitorRequest(
      new Headers({ cookie: "tradefeed_synthetic=checkly" }),
    ),
    true,
  );
});

test("buyer-view policy excludes signed-in shop owners", () => {
  const context = {
    visitorId: VISITOR_ID,
  };

  assert.equal(shouldTrackBuyerView(context, false), true);
  assert.equal(shouldTrackBuyerView(context, true), false);
  assert.equal(shouldTrackBuyerView(null, false), false);
});

test("activation buyer views require an identified first-party visitor", () => {
  assert.deepEqual(ACTIVATION_BUYER_VIEW_FILTER, {
    type: { in: ["PAGE_VIEW", "PRODUCT_VIEW"] },
    visitorId: { not: null },
  });
});
