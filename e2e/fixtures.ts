// ============================================================
// Shared Playwright fixtures
// ============================================================
// Import `test` and `expect` from here, not from "@playwright/test".
//
// The whole suite runs from one machine against one dev server. The app
// keys its rate limiter on the client address (x-forwarded-for) and, with
// no forwarding header, files every request under a single "unknown"
// client. The browsing limit is 60 requests a minute, which the suite
// exceeds, so unrelated page tests started receiving 429 responses.
//
// Each test (and each retry) therefore presents its own client address,
// the way separate buyers would. The limiter itself is untouched.
//
// The header is added only to requests for the app's own origin. Setting
// it with `extraHTTPHeaders` sends it to every host the page talks to,
// and that broke Clerk: its sign-up form never loaded.
// ============================================================

import { createHash } from "node:crypto";
import { test as base, expect } from "@playwright/test";

function clientAddressFor(testId: string, retry: number): string {
  const digest = createHash("sha256").update(`${testId}:${retry}`).digest();
  return `10.${digest[0]}.${digest[1]}.${digest[2]}`;
}

export const test = base.extend({
  // The second argument is Playwright's "use" callback. It is named `provide`
  // so react-hooks/rules-of-hooks does not mistake it for React's `use`.
  context: async ({ context, baseURL }, provide, testInfo) => {
    if (baseURL) {
      const appOrigin = new URL(baseURL).origin;
      const address = clientAddressFor(testInfo.testId, testInfo.retry);
      await context.route(
        (url) => url.origin === appOrigin,
        (route) =>
          route.continue({
            headers: { ...route.request().headers(), "x-forwarded-for": address },
          }),
      );
    }
    await provide(context);
  },
});

export { expect };
