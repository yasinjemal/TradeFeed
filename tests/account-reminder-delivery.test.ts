/* eslint-disable @typescript-eslint/no-explicit-any -- Mock database boundary; no real email or database access. */
import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { db } from "@/lib/db";
import { accountReminderTemplateHash, deliverLegacySellerAccountReminder } from "@/lib/email/account-reminder-delivery";
import { ACCOUNT_REMINDER_EMAIL_SUBJECT } from "@/lib/email/templates/account-reminder";
import { createMarketingEmailHash } from "@/lib/db/marketing-email-campaigns";

const secret = "test-reminder-secret-at-least-32-bytes";
function harness(t: TestContext, count: number) {
  const campaign: any = { id: "campaign", status: "DRAFT", subject: ACCOUNT_REMINDER_EMAIL_SUBJECT, templateHash: accountReminderTemplateHash() };
  const rows: any[] = Array.from({ length: count }, (_, i) => ({
    id: `recipient-${i}`, userId: `user-${i}`, shopId: "shop", status: "PENDING",
    normalizedEmailHash: createMarketingEmailHash(`seller${i}@example.com`, secret),
    user: { email: `seller${i}@example.com`, firstName: "Seller", isBanned: false, emailMarketingPreference: null },
  }));
  const state = { campaign, rows, failPersistence: false };
  const replace = (object: any, key: string, value: any) => {
    const old = object[key]; object[key] = value; t.after(() => { object[key] = old; });
  };
  replace(db, "$transaction", async (work: any) => {
    if (typeof work === "function") return work(db);
    // Persist operations only inside the mocked transaction, atomically.
    if (state.failPersistence) throw new Error("Database unavailable");
    return work.map((operation: any) => operation());
  });
  replace(db.emailMarketingCampaign, "findUnique", async () => campaign);
  replace(db.emailMarketingCampaign, "updateMany", async ({ where, data }: any) => {
    if (campaign.status !== where.status) return { count: 0 };
    Object.assign(campaign, data); return { count: 1 };
  });
  replace(db.emailMarketingCampaign, "update", ({ data }: any) => {
    const operation = () => Object.assign(campaign, data);
    // Support both Prisma's array transaction and awaited interactive updates.
    return Object.assign(operation, { then: (resolve: any) => resolve(operation()) });
  });
  replace(db.emailMarketingCampaignRecipient, "findMany", async () => rows.filter((row) => row.status === "PENDING"));
  replace(db.emailMarketingCampaignRecipient, "updateMany", async ({ where, data }: any) => {
    const matches = rows.filter((row) => where.id.in.includes(row.id) && row.status === where.status);
    matches.forEach((row) => Object.assign(row, data)); return { count: matches.length };
  });
  replace(db.emailMarketingCampaignRecipient, "update", ({ where, data }: any) => () => Object.assign(rows.find((row) => row.id === where.id), data));
  replace(db.shop, "findMany", async () => [{ id: "shop", name: "Test shop", slug: "test-shop" }]);
  replace(db.emailSuppression, "findMany", async () => []);
  return state;
}
const input = (expectedCount: number) => ({ adminId: "admin", expectedCount, hmacSecret: secret });

for (const count of [1, 100, 108, 201]) {
  test(`delivers ${count} recipients in bounded batches and blocks repeat sends`, async (t) => {
    const state = harness(t, count);
    const sizes: number[] = [], keys: string[] = [], emails: string[] = [];
    const send = async (messages: any, options: any) => {
      sizes.push(messages.length); keys.push(options.idempotencyKey);
      emails.push(...messages.map((message: any) => message.to));
      return { success: true as const, fallback: false, ids: messages.map((message: any) => `provider-${message.to}`) };
    };
    const result = await deliverLegacySellerAccountReminder(input(count), send);
    assert.equal(result.acceptedCount, count);
    assert.deepEqual(sizes, Array.from({ length: Math.ceil(count / 100) }, (_, i) => Math.min(100, count - i * 100)));
    assert.equal(new Set(keys).size, sizes.length);
    assert.equal(new Set(emails).size, count);
    assert.equal(state.campaign.status, "COMPLETED");
    assert.equal(state.campaign.sentCount, count);
    assert.ok(state.rows.every((row) => row.status === "SENT" && row.providerMessageId === `provider-${row.user.email}`));
    await assert.rejects(() => deliverLegacySellerAccountReminder(input(count), send), /already completed/);
    assert.equal(sizes.length, Math.ceil(count / 100));
  });
}

test("second batch failure preserves first batch and stops later batches without retries", async (t) => {
  const state = harness(t, 208); let calls = 0;
  const send = async (messages: any) => {
    if (++calls === 2) throw new Error("Provider timeout");
    return { success: true as const, fallback: false, ids: messages.map((message: any) => `provider-${message.to}`) };
  };
  await assert.rejects(() => deliverLegacySellerAccountReminder(input(208), send), /unknown/);
  assert.equal(calls, 2);
  assert.equal(state.campaign.sentCount, 100);
  assert.equal(state.campaign.failedCount, 108);
  assert.equal(state.rows.filter((row) => row.status === "SENT").length, 100);
  assert.equal(state.rows.filter((row) => row.status === "FAILED").length, 108);
  await assert.rejects(() => deliverLegacySellerAccountReminder(input(208), send), /already failed/);
  assert.equal(calls, 2);
});

test("incomplete provider results stop the campaign without claiming success", async (t) => {
  const state = harness(t, 108); let calls = 0;
  await assert.rejects(() => deliverLegacySellerAccountReminder(input(108), async () => {
    calls++; return { success: true, fallback: false, ids: ["only-one-id"] };
  }), /did not confirm/);
  assert.equal(calls, 1);
  assert.equal(state.campaign.sentCount, 0);
  assert.equal(state.campaign.status, "FAILED");
});

test("database failure after acceptance stops later batches and locks the campaign", async (t) => {
  const state = harness(t, 108); state.failPersistence = true; let calls = 0;
  await assert.rejects(() => deliverLegacySellerAccountReminder(input(108), async (messages) => {
    calls++; return { success: true, fallback: false, ids: messages.map((_, i) => `provider-${i}`) };
  }), /Do not send again/);
  assert.equal(calls, 1);
  assert.equal(state.campaign.status, "RUNNING");
  await assert.rejects(() => deliverLegacySellerAccountReminder(input(108), async () => {
    throw new Error("Must not send");
  }), /already running/);
});
