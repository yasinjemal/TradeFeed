import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  applyMarketingUnsubscribe,
  EMAIL_MARKETING_HMAC_SECRET_ENV,
  getEmailMarketingHmacSecret,
  type MarketingUnsubscribeDatabase,
} from "../lib/email/marketing-unsubscribe";
import { createMarketingUnsubscribeToken } from "../lib/email/marketing-preferences";
import * as unsubscribeRoute from "../app/api/email/unsubscribe/route";

const SECRET = "u".repeat(32);
const EMAIL_HASH = "a".repeat(64);
const NOW = new Date("2026-07-31T18:00:00.000Z");

test("marketing unsubscribe secret fails closed when missing or weak", () => {
  assert.equal(getEmailMarketingHmacSecret({}), null);
  assert.equal(
    getEmailMarketingHmacSecret({
      [EMAIL_MARKETING_HMAC_SECRET_ENV]: "too-short",
    }),
    null,
  );
  assert.equal(
    getEmailMarketingHmacSecret({
      [EMAIL_MARKETING_HMAC_SECRET_ENV]: `  ${SECRET}  `,
    }),
    SECRET,
  );
});

test("GET is not exported, so link scanners cannot mutate preferences", () => {
  assert.equal("GET" in unsubscribeRoute, false);
  assert.equal(typeof unsubscribeRoute.POST, "function");
});

test("unsubscribe activates suppression and opts out each resolved account once", async () => {
  const calls: {
    suppression?: Record<string, unknown>;
    recipient?: Record<string, unknown>;
    preferences: Array<Record<string, unknown>>;
  } = { preferences: [] };

  const database: MarketingUnsubscribeDatabase = {
    async $transaction(callback) {
      return callback({
        emailSuppression: {
          async upsert(args) {
            calls.suppression = args;
            return {};
          },
        },
        emailMarketingCampaignRecipient: {
          async findMany(args) {
            calls.recipient = args;
            return [
              { userId: "user_1" },
              { userId: "user_1" },
              { userId: "user_2" },
            ];
          },
        },
        emailMarketingPreference: {
          async upsert(args) {
            calls.preferences.push(args);
            return {};
          },
        },
      });
    },
  };

  const result = await applyMarketingUnsubscribe(
    {
      emailHash: EMAIL_HASH,
      source: "email_unsubscribe_form",
      now: NOW,
    },
    database,
  );

  assert.equal(result.preferenceCount, 2);
  assert.deepEqual(calls.suppression, {
    where: {
      normalizedEmailHash_reason: {
        normalizedEmailHash: EMAIL_HASH,
        reason: "UNSUBSCRIBED",
      },
    },
    create: {
      normalizedEmailHash: EMAIL_HASH,
      reason: "UNSUBSCRIBED",
      source: "email_unsubscribe_form",
      suppressedAt: NOW,
    },
    update: {
      source: "email_unsubscribe_form",
      suppressedAt: NOW,
      releasedAt: null,
    },
  });
  assert.deepEqual(calls.recipient, {
    where: { normalizedEmailHash: EMAIL_HASH },
    select: { userId: true },
    distinct: ["userId"],
  });
  assert.deepEqual(
    calls.preferences.map((call) => call.where),
    [{ userId: "user_1" }, { userId: "user_2" }],
  );
  for (const call of calls.preferences) {
    assert.deepEqual(call.create, {
      userId: (call.where as { userId: string }).userId,
      status: "OPTED_OUT",
      optedOutAt: NOW,
    });
    assert.deepEqual(call.update, {
      status: "OPTED_OUT",
      optedOutAt: NOW,
    });
  }
});

test("unsubscribe rejects raw or malformed address identities before persistence", async () => {
  let transactionCalled = false;
  const database: MarketingUnsubscribeDatabase = {
    async $transaction() {
      transactionCalled = true;
      throw new Error("Transaction must not run for invalid input.");
    },
  };

  await assert.rejects(
    () =>
      applyMarketingUnsubscribe(
        {
          emailHash: "seller@example.com",
          source: "email_unsubscribe_form",
          now: NOW,
        },
        database,
      ),
    /emailHash/,
  );
  assert.equal(transactionCalled, false);
});

test("invalid one-click tokens receive the same generic success without a mutation", async () => {
  const previousSecret = process.env[EMAIL_MARKETING_HMAC_SECRET_ENV];
  process.env[EMAIL_MARKETING_HMAC_SECRET_ENV] = SECRET;

  try {
    const request = new NextRequest(
      "https://tradefeed.co.za/api/email/unsubscribe?token=invalid-token",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: "List-Unsubscribe=One-Click",
      },
    );
    const response = await unsubscribeRoute.POST(request);
    const payload = (await response.json()) as {
      success: boolean;
      message: string;
    };

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(
      payload.message,
      "Your email preference request has been received.",
    );
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  } finally {
    if (previousSecret === undefined) {
      delete process.env[EMAIL_MARKETING_HMAC_SECRET_ENV];
    } else {
      process.env[EMAIL_MARKETING_HMAC_SECRET_ENV] = previousSecret;
    }
  }
});

test("valid tokens contain no raw email in the one-click URL", () => {
  const token = createMarketingUnsubscribeToken({
    email: "seller@example.com",
    secret: SECRET,
    issuedAt: NOW,
  });
  const url = new URL(
    "https://tradefeed.co.za/api/email/unsubscribe",
  );
  url.searchParams.set("token", token);

  assert.equal(url.toString().includes("seller@example.com"), false);
  assert.match(token, /^tfmu\.v1\./);
});
