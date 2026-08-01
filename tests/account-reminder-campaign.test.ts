import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLegacySellerAccountReminderPreview,
  createAccountReminderIdempotencyKey,
  LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
  prepareLegacySellerAccountReminderCampaign,
  type AccountReminderCampaignDatabase,
  type AccountReminderOwnerCandidate,
} from "../lib/db/account-reminder-campaign";
import { createMarketingEmailHash } from "../lib/db/marketing-email-campaigns";

const SECRET = "r".repeat(32);
const NOW = new Date("2026-08-01T08:00:00.000Z");
const TEMPLATE_HASH = "b".repeat(64);
const SUBJECT = "Your TradeFeed shop is ready for you";

function candidate(
  overrides: Partial<AccountReminderOwnerCandidate> = {},
): AccountReminderOwnerCandidate {
  return {
    userId: "user-eligible",
    email: "seller@example.com",
    isBanned: false,
    marketingPreferenceStatus: null,
    shopId: "shop-eligible",
    shopCreatedAt: new Date("2026-01-01T00:00:00.000Z"),
    shopUpdatedAt: new Date("2026-07-01T00:00:00.000Z"),
    ...overrides,
  };
}

test("legacy reminder preview reconciles every exclusion without exposing identities", () => {
  const suppressedHash = createMarketingEmailHash(
    "suppressed@example.com",
    SECRET,
  );
  const priorHash = createMarketingEmailHash(
    "prior-hash@example.com",
    SECRET,
  );
  const candidates = [
    candidate({
      shopId: "shop-eligible-old",
      shopUpdatedAt: new Date("2026-06-01T00:00:00.000Z"),
    }),
    candidate({
      shopId: "shop-eligible-new",
      shopCreatedAt: new Date("2026-02-01T00:00:00.000Z"),
      shopUpdatedAt: new Date("2026-07-31T00:00:00.000Z"),
    }),
    candidate({
      userId: "user-unknown",
      email: "unknown@example.com",
      marketingPreferenceStatus: "UNKNOWN",
      shopId: "shop-unknown",
    }),
    candidate({
      userId: "user-opted-out",
      email: "opted-out@example.com",
      marketingPreferenceStatus: "OPTED_OUT",
      shopId: "shop-opted-out",
    }),
    candidate({
      userId: "user-banned",
      email: "banned@example.com",
      isBanned: true,
      shopId: "shop-banned",
    }),
    candidate({
      userId: "user-invalid",
      email: "not-an-email",
      shopId: "shop-invalid",
    }),
    candidate({
      userId: "user-shared-a",
      email: "Shared@Example.com",
      shopId: "shop-shared-a",
    }),
    candidate({
      userId: "user-shared-b",
      email: "shared@example.com",
      shopId: "shop-shared-b",
    }),
    candidate({
      userId: "user-suppressed",
      email: "suppressed@example.com",
      shopId: "shop-suppressed",
    }),
    candidate({
      userId: "user-prior",
      email: "prior-user@example.com",
      shopId: "shop-prior-user",
    }),
    candidate({
      userId: "user-prior-hash",
      email: "prior-hash@example.com",
      shopId: "shop-prior-hash",
    }),
  ];

  const preview = buildLegacySellerAccountReminderPreview(
    candidates,
    new Set([suppressedHash]),
    [
      {
        userId: "user-prior",
        normalizedEmailHash: "e".repeat(64),
      },
      {
        userId: "some-old-user-id",
        normalizedEmailHash: priorHash,
      },
    ],
    SECRET,
    NOW,
  );

  assert.deepEqual(preview, {
    campaignKey: LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
    generatedAt: NOW.toISOString(),
    counts: {
      ownerMemberships: 11,
      uniqueOwners: 10,
      duplicateShopMemberships: 1,
      eligible: 2,
      excluded: {
        banned: 1,
        invalidEmail: 1,
        duplicateEmail: 2,
        optedOut: 1,
        activeSuppression: 1,
        priorReminder: 2,
      },
    },
  });

  const serialized = JSON.stringify(preview);
  assert.equal(serialized.includes("seller@example.com"), false);
  assert.equal(serialized.includes("user-eligible"), false);
  assert.equal(serialized.includes("shop-eligible"), false);
});

test("reminder idempotency keys are stable and contain no account identity", () => {
  const first = createAccountReminderIdempotencyKey("user-secret-id");
  const second = createAccountReminderIdempotencyKey(
    " user-secret-id ",
  );

  assert.equal(first, second);
  assert.match(first, /^tf-account-reminder-v1:[a-f0-9]{64}$/);
  assert.equal(first.includes("user-secret-id"), false);
});

test("campaign preparation reserves one deterministic shop with hashes only", async () => {
  const calls: {
    isolationLevel?: string;
    suppressionQuery?: Record<string, unknown>;
    priorQuery?: Record<string, unknown>;
    campaignUpsert?: unknown;
    recipientCreate?: unknown;
    campaignUpdate?: unknown;
    shopQuery?: Record<string, unknown>;
  } = {};
  let storedRecipientCount = 0;

  const database: AccountReminderCampaignDatabase = {
    async $transaction(callback, options) {
      calls.isolationLevel = options?.isolationLevel;
      return callback({
        shop: {
          async findMany(args) {
            calls.shopQuery = args;
            return [
              {
                id: "shop-old",
                createdAt: new Date(
                  "2026-01-01T00:00:00.000Z",
                ),
                updatedAt: new Date(
                  "2026-06-01T00:00:00.000Z",
                ),
                users: [
                  {
                    user: {
                      id: "user-1",
                      email: "Seller@Example.com",
                      isBanned: false,
                      emailMarketingPreference: null,
                    },
                  },
                ],
              },
              {
                id: "shop-new",
                createdAt: new Date(
                  "2026-02-01T00:00:00.000Z",
                ),
                updatedAt: new Date(
                  "2026-07-31T00:00:00.000Z",
                ),
                users: [
                  {
                    user: {
                      id: "user-1",
                      email: "Seller@Example.com",
                      isBanned: false,
                      emailMarketingPreference: null,
                    },
                  },
                ],
              },
            ];
          },
        },
        emailSuppression: {
          async findMany(args) {
            calls.suppressionQuery = args;
            return [];
          },
        },
        emailMarketingCampaignRecipient: {
          async findMany(args) {
            calls.priorQuery = args;
            return [];
          },
          async createMany(args) {
            calls.recipientCreate = args;
            storedRecipientCount += args.data.length;
            return { count: args.data.length };
          },
          async count() {
            return storedRecipientCount;
          },
        },
        emailMarketingCampaign: {
          async upsert(args) {
            calls.campaignUpsert = args;
            return {
              id: "campaign-1",
              campaignKey:
                LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
              kind: "OTHER",
              status: "DRAFT",
              subject: SUBJECT,
              templateHash: TEMPLATE_HASH,
            };
          },
          async update(args) {
            calls.campaignUpdate = args;
            return {};
          },
        },
      });
    },
  };

  const result =
    await prepareLegacySellerAccountReminderCampaign(
      {
        createdById: "admin-1",
        subject: SUBJECT,
        templateHash: TEMPLATE_HASH,
        hmacSecret: SECRET,
        now: NOW,
      },
      database,
    );

  assert.equal(calls.isolationLevel, "RepeatableRead");
  assert.equal(result.createdRecipientCount, 1);
  assert.equal(result.recipientCount, 1);
  assert.equal(result.audienceFrozen, false);
  assert.equal(result.preview.counts.ownerMemberships, 2);
  assert.equal(result.preview.counts.uniqueOwners, 1);
  assert.deepEqual(
    (
      (
        (
          calls.shopQuery as {
            select: {
              users: {
                select: {
                  user: {
                    select: Record<string, unknown>;
                  };
                };
              };
            };
          }
        ).select.users.select.user.select
      ).emailMarketingPreference
    ),
    { select: { status: true } },
  );

  const recipientCreate = calls.recipientCreate as {
    data: Array<Record<string, unknown>>;
    skipDuplicates: boolean;
  };
  assert.equal(recipientCreate.skipDuplicates, true);
  assert.equal(recipientCreate.data.length, 1);
  assert.deepEqual(recipientCreate.data[0], {
    campaignId: "campaign-1",
    userId: "user-1",
    shopId: "shop-new",
    normalizedEmailHash: createMarketingEmailHash(
      "seller@example.com",
      SECRET,
    ),
    idempotencyKey:
      createAccountReminderIdempotencyKey("user-1"),
    status: "PENDING",
  });

  const serializedPersistenceCalls = JSON.stringify({
    campaignUpsert: calls.campaignUpsert,
    recipientCreate: calls.recipientCreate,
    campaignUpdate: calls.campaignUpdate,
  });
  assert.equal(
    serializedPersistenceCalls.includes("Seller@Example.com"),
    false,
  );
  assert.equal(
    serializedPersistenceCalls.includes("seller@example.com"),
    false,
  );

  const priorWhere = (
    calls.priorQuery as {
      where: {
        campaign: Record<string, unknown>;
      };
    }
  ).where;
  assert.deepEqual(priorWhere.campaign, {
    campaignKey:
      LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
    kind: "OTHER",
  });
  assert.equal("status" in priorWhere, false);
});

test("a non-draft fixed campaign is reused without appending recipients", async () => {
  let createManyCalled = false;
  let campaignUpdateCalled = false;

  const database: AccountReminderCampaignDatabase = {
    async $transaction(callback) {
      return callback({
        shop: {
          async findMany() {
            return [
              {
                id: "shop-1",
                createdAt: NOW,
                updatedAt: NOW,
                users: [
                  {
                    user: {
                      id: "user-1",
                      email: "seller@example.com",
                      isBanned: false,
                      emailMarketingPreference: null,
                    },
                  },
                ],
              },
            ];
          },
        },
        emailSuppression: {
          async findMany() {
            return [];
          },
        },
        emailMarketingCampaignRecipient: {
          async findMany() {
            return [];
          },
          async createMany() {
            createManyCalled = true;
            return { count: 1 };
          },
          async count() {
            return 7;
          },
        },
        emailMarketingCampaign: {
          async upsert() {
            return {
              id: "campaign-1",
              campaignKey:
                LEGACY_SELLER_ACCOUNT_REMINDER_CAMPAIGN_KEY,
              kind: "OTHER",
              status: "APPROVED",
              subject: SUBJECT,
              templateHash: TEMPLATE_HASH,
            };
          },
          async update() {
            campaignUpdateCalled = true;
            return {};
          },
        },
      });
    },
  };

  const result =
    await prepareLegacySellerAccountReminderCampaign(
      {
        createdById: "admin-1",
        subject: SUBJECT,
        templateHash: TEMPLATE_HASH,
        hmacSecret: SECRET,
        now: NOW,
      },
      database,
    );

  assert.equal(result.audienceFrozen, true);
  assert.equal(result.createdRecipientCount, 0);
  assert.equal(result.recipientCount, 7);
  assert.equal(createManyCalled, false);
  assert.equal(campaignUpdateCalled, false);
});
