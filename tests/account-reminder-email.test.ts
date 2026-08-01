import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCOUNT_REMINDER_EMAIL_SUBJECT,
  accountReminderEmailHtml,
  accountReminderEmailPreheader,
  accountReminderEmailSubject,
  accountReminderEmailText,
  type AccountReminderEmailData,
} from "../lib/email/templates/account-reminder";

function reminderData(
  overrides: Partial<AccountReminderEmailData> = {},
): AccountReminderEmailData {
  return {
    sellerName: "Lerato",
    shopName: "Lerato's Store",
    continueShopUrl:
      "https://tradefeed.co.za/dashboard/leratos-store",
    stopRemindersUrl:
      "https://tradefeed.co.za/email/unsubscribe?token=signed-token",
    senderName: "TradeFeed Team",
    supportEmail: "support@tradefeed.co.za",
    ...overrides,
  };
}

test("uses the required factual subject and a restrained preheader", () => {
  assert.equal(
    ACCOUNT_REMINDER_EMAIL_SUBJECT,
    "Your TradeFeed shop is still here",
  );
  assert.equal(
    accountReminderEmailSubject(),
    "Your TradeFeed shop is still here",
  );
  assert.match(accountReminderEmailPreheader(), /once-only reminder/i);
});

test("identifies the existing account and presents one primary continuation CTA", () => {
  const html = accountReminderEmailHtml(reminderData());
  const text = accountReminderEmailText(reminderData());

  assert.match(
    html,
    /previously created <strong[^>]*>Lerato&#39;s Store<\/strong> through your TradeFeed account/,
  );
  assert.match(text, /previously created Lerato's Store through your TradeFeed account/);
  assert.equal((html.match(/data-primary-cta="true"/g) ?? []).length, 1);
  assert.match(html, />Continue my shop &rarr;<\/a>/);
  assert.match(
    text,
    /Continue my shop: https:\/\/tradefeed\.co\.za\/dashboard\/leratos-store/,
  );
});

test("does not claim prior marketing consent and includes support and stop links", () => {
  const data = reminderData();
  const html = accountReminderEmailHtml(data);
  const text = accountReminderEmailText(data);

  for (const output of [html, text]) {
    assert.match(
      output,
      /does not mean that you previously opted in to marketing/i,
    );
    assert.match(output, /support@tradefeed\.co\.za/);
    assert.match(output, /Manage non-essential TradeFeed emails/i);
    assert.ok(output.includes(data.stopRemindersUrl));
  }
});

test("escapes all personalized HTML and neutralizes header-style line breaks", () => {
  const html = accountReminderEmailHtml(
    reminderData({
      sellerName: `<script>alert("seller")</script>\r\nBcc: x@y.co.za`,
      shopName: `<img src=x onerror="alert(1)"> & Shop`,
      senderName: `TradeFeed <Admin>`,
    }),
  );

  assert.doesNotMatch(html, /<script>alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(
    html,
    /&lt;script&gt;alert\(&quot;seller&quot;\)&lt;\/script&gt; Bcc: x@y\.co\.za/,
  );
  assert.match(
    html,
    /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Shop/,
  );
  assert.match(html, /TradeFeed &lt;Admin&gt;/);
});

test("validates web URLs, URL credentials, and the support address", () => {
  assert.throws(
    () =>
      accountReminderEmailHtml(
        reminderData({ continueShopUrl: "javascript:alert(1)" }),
      ),
    /continueShopUrl must use HTTPS/,
  );
  assert.throws(
    () =>
      accountReminderEmailText(
        reminderData({
          stopRemindersUrl: "http://tradefeed.co.za/stop",
        }),
      ),
    /stopRemindersUrl must use HTTPS/,
  );
  assert.throws(
    () =>
      accountReminderEmailHtml(
        reminderData({
          continueShopUrl:
            "https://user:password@tradefeed.co.za/dashboard",
        }),
      ),
    /must not contain URL credentials/,
  );
  assert.throws(
    () =>
      accountReminderEmailHtml(
        reminderData({
          supportEmail: "support@example.com\r\nBcc:x@y.co.za",
        }),
      ),
    /supportEmail must be a valid email address/,
  );
});

test("escapes query separators inside HTML href attributes", () => {
  const html = accountReminderEmailHtml(
    reminderData({
      stopRemindersUrl:
        "https://tradefeed.co.za/email/unsubscribe?token=signed&source=reminder",
    }),
  );

  assert.match(
    html,
    /email\/unsubscribe\?token=signed&amp;source=reminder/,
  );
  assert.doesNotMatch(
    html,
    /href="[^"]*\?token=signed&source=reminder"/,
  );
});

test("contains no promotional feature, pricing, urgency, or outcome claims", () => {
  const rendered = [
    accountReminderEmailHtml(reminderData()),
    accountReminderEmailText(reminderData()),
  ].join("\n");

  for (const prohibited of [
    /\bHUNT\b/i,
    /TradeFeed Growth/i,
    /\bAI listings?\b/i,
    /\bmarketplace\b/i,
    /\bpricing\b/i,
    /\bdiscount\b/i,
    /\bsale\b/i,
    /\border on WhatsApp\b/i,
    /\blimited time\b/i,
    /\bact now\b/i,
    /\bguarantee/i,
  ]) {
    assert.doesNotMatch(rendered, prohibited);
  }
});
