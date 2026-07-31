import assert from "node:assert/strict";
import test from "node:test";

import {
  reengagementEmailHtml,
  reengagementEmailPreheader,
  reengagementEmailSubject,
  reengagementEmailText,
  type ReengagementEmailData,
  type ReengagementSegment,
} from "../lib/email/templates/reengagement";

function emailData(
  overrides: Partial<ReengagementEmailData> = {},
): ReengagementEmailData {
  return {
    shopName: "Lerato's Store",
    sellerName: "Lerato",
    catalogUrl: "https://tradefeed.co.za/catalog/leratos-store",
    dashboardUrl: "https://tradefeed.co.za/dashboard/leratos-store",
    huntUrl: "https://tradefeed.co.za/hunt",
    growthUrl: "https://tradefeed.co.za/growth",
    unsubscribeUrl:
      "https://tradefeed.co.za/email/unsubscribe?token=signed-token",
    senderName: "TradeFeed Team",
    supportEmail: "support@tradefeed.co.za",
    segment: "zero",
    ...overrides,
  };
}

test("re-engagement subject and preheader are personalized and header-safe", () => {
  const subject = reengagementEmailSubject({
    shopName: "A Shop\r\nBcc: attacker@example.com",
  });

  assert.equal(
    subject,
    "A Shop Bcc: attacker@example.com is still here—and TradeFeed has changed",
  );
  assert.doesNotMatch(subject, /[\r\n]/);
  assert.match(
    reengagementEmailPreheader({ segment: "zero" }),
    /one product photo/i,
  );
});

test("HTML escapes every personalized and custom value", () => {
  const html = reengagementEmailHtml(
    emailData({
      shopName: `<img src=x onerror="alert(1)"> & Shop`,
      sellerName: `<script>alert("seller")</script>`,
      senderName: `TradeFeed <Admin>`,
      customMessage: `Welcome <script>alert("note")</script>\nSecond line & more`,
    }),
  );

  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;script&gt;alert\(&quot;seller&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Shop/);
  assert.match(
    html,
    /Welcome &lt;script&gt;alert\(&quot;note&quot;\)&lt;\/script&gt;<br>Second line &amp; more/,
  );
  assert.match(html, /TradeFeed &lt;Admin&gt;/);
});

test("unsafe link schemes and malformed support addresses are rejected", () => {
  assert.throws(
    () =>
      reengagementEmailHtml(
        emailData({ unsubscribeUrl: "javascript:alert(1)" }),
      ),
    /unsubscribeUrl must use HTTPS/,
  );
  assert.throws(
    () =>
      reengagementEmailText(
        emailData({ growthUrl: "http://example.com/growth" }),
      ),
    /growthUrl must use HTTPS/,
  );
  assert.throws(
    () =>
      reengagementEmailHtml(
        emailData({ supportEmail: "support@example.com\r\nBcc:x@y.co.za" }),
      ),
    /supportEmail must be a valid email address/,
  );
});

test("HTML and text include required campaign links and honest shipped-feature copy", () => {
  const data = emailData();
  const html = reengagementEmailHtml(data);
  const text = reengagementEmailText(data);

  for (const url of [
    data.catalogUrl,
    data.dashboardUrl,
    data.huntUrl,
    data.growthUrl,
  ]) {
    assert.ok(html.includes(url), `HTML should include ${url}`);
    assert.ok(text.includes(url), `text should include ${url}`);
  }

  assert.match(html, /Unsubscribe from TradeFeed product updates/);
  assert.match(text, new RegExp(data.unsubscribeUrl.replace(/[?]/g, "\\?")));
  assert.match(html, /20 products and 10 AI listings a month/);
  assert.match(html, /one organised order to your WhatsApp/);
  assert.match(html, /limited Johannesburg fashion and sneaker pilot/);
  assert.match(html, /does not guarantee a request, offer or sale/);
  assert.match(html, /paid done-for-you shop service/);
  assert.match(text, /support@tradefeed\.co\.za/);
  assert.match(text, /Sent by TradeFeed Team/);
  assert.match(text, /because you opted in to TradeFeed product updates/);
});

test("each segment receives the correct primary CTA label and deep link", () => {
  const expected: Record<
    ReengagementSegment,
    { label: string; href: string }
  > = {
    zero: {
      label: "Add my first product",
      href: "https://tradefeed.co.za/dashboard/leratos-store/products/new",
    },
    starter: {
      label: "Add another product",
      href: "https://tradefeed.co.za/dashboard/leratos-store/products/new",
    },
    stale: {
      label: "Refresh my catalogue",
      href: "https://tradefeed.co.za/dashboard/leratos-store/products",
    },
    active: {
      label: "Open my dashboard",
      href: "https://tradefeed.co.za/dashboard/leratos-store",
    },
  };

  for (const segment of Object.keys(expected) as ReengagementSegment[]) {
    const text = reengagementEmailText(emailData({ segment }));
    assert.match(text, new RegExp(expected[segment].label));
    assert.ok(text.includes(expected[segment].href));
  }
});

test("campaign contains no unsupported visibility multiplier or guaranteed outcome", () => {
  const html = reengagementEmailHtml(emailData());
  const text = reengagementEmailText(emailData());
  const rendered = `${html}\n${text}`;

  assert.doesNotMatch(rendered, /5\s*[x×]\s*more views/i);
  assert.doesNotMatch(rendered, /buyers can'?t find you/i);
  assert.doesNotMatch(rendered, /get your first sale/i);
  assert.doesNotMatch(rendered, /guaranteed? (?:request|offer|sale)/i);
});
