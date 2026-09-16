/* eslint-disable @typescript-eslint/no-explicit-any -- In-memory Prisma boundary; no live database or email calls. */
import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/lib/db";
import { approveSellerAssistance, cancelSellerAssistance, deliverApprovedSellerAssistance, getSellerAssistanceReview } from "@/lib/db/seller-assistance";
import { GET } from "@/app/api/cron/seller-assistance/route";
import { POST } from "@/app/api/webhooks/resend/route";
import { applyAssistanceDeliveryEvent } from "@/lib/email/seller-assistance-webhook";
import { ASSISTANCE_CONSENT_VERSION } from "@/lib/email/assistance-consent";
import { Webhook } from "svix";

function harness(t: TestContext) {
  const env = { EMAIL_MARKETING_HMAC_SECRET: "test-secret-with-at-least-32-bytes-long", EMAIL_MARKETING_PROVIDER_READY: "true", EMAIL_MARKETING_NCC_CLEANSED_AT: new Date().toISOString(), EMAIL_MARKETING_SEND_ENABLED: "true", SELLER_ASSISTANCE_SEND_ENABLED: "true", RESEND_API_KEY: "test-key-never-used", RESEND_WEBHOOK_SECRET: `whsec_${Buffer.alloc(32, 1).toString("base64")}`, CRON_SECRET: "test-cron" };
  for (const [key, value] of Object.entries(env)) {
    const original = process.env[key]; process.env[key] = value;
    t.after(() => { if (original === undefined) delete process.env[key]; else process.env[key] = original; });
  }
  const replace = (object: any, key: string, value: any) => { const original = object[key]; object[key] = value; t.after(() => { object[key] = original; }); };
  const old = new Date(Date.now() - 4 * 86400000);
  const state: any = {
    member: { userId: "user", shopId: "shop", user: { email: "seller@example.com", isBanned: false, emailMarketingPreference: { status: "OPTED_IN", consentVersion: ASSISTANCE_CONSENT_VERSION } }, shop: { id: "shop", slug: "seller", name: "Seller shop", createdAt: old, isActive: true, products: [] } },
    recipient: null, campaign: null, suppression: false, recent: false, shared: false, locks: 0,
  };
  replace(db, "$queryRaw", async () => { state.locks++; return []; });
  replace(db, "$transaction", async (work: any) => typeof work === "function" ? work(db) : Promise.all(work));
  replace(db.shopUser, "findFirst", async () => state.member);
  replace(db.shopUser, "findMany", async () => [{ userId: "user", shopId: "shop" }]);
  replace(db.user, "count", async () => 0);
  replace(db.onboardingEvent, "findMany", async () => state.shared ? [{ metadata: { shopId: "shop" } }] : []);
  replace(db.emailSuppression, "findFirst", async () => state.suppression ? { id: "suppression" } : null);
  replace(db.emailSuppression, "upsert", async () => { state.suppression = true; return {}; });
  replace(db.emailMarketingCampaignRecipient, "findFirst", async ({ where }: any) => {
    if (where.OR?.some((clause: any) => clause.providerMessageId)) return state.recipient;
    if (where.id?.not && where.id.not === state.recipient?.id) return null;
    if (where.campaign?.campaignKey) return state.campaign?.campaignKey === where.campaign.campaignKey ? state.recipient : null;
    return state.recent || state.recipient ? { id: "existing" } : null;
  });
  replace(db.emailMarketingCampaignRecipient, "findMany", async ({ where }: any) => {
    if (!state.recipient) return [];
    if (where.status && state.recipient.status !== where.status) return [];
    return [{ ...state.recipient, campaign: state.campaign }];
  });
  replace(db.emailMarketingCampaignRecipient, "updateMany", async ({ where, data }: any) => {
    const row = state.recipient;
    if (!row) return { count: 0 };
    if (typeof where.status === "string" && row.status !== where.status) return { count: 0 };
    if (where.status?.in && !where.status.in.includes(row.status)) return { count: 0 };
    if (where.status?.notIn?.includes(row.status)) return { count: 0 };
    if (where.campaign?.status && where.campaign.status !== state.campaign.status) return { count: 0 };
    Object.assign(row, data, { attempts: data.attempts?.increment ? row.attempts + data.attempts.increment : row.attempts });
    return { count: 1 };
  });
  replace(db.emailMarketingCampaign, "create", async ({ data }: any) => {
    state.campaign = { ...data, id: "campaign" };
    state.recipient = { ...data.recipients.create, id: "recipient", campaignId: "campaign", createdAt: new Date(), status: "PENDING", attempts: 0 };
    return { id: "campaign" };
  });
  replace(db.emailMarketingCampaign, "update", async ({ data }: any) => { Object.assign(state.campaign, data); return state.campaign; });
  return state;
}

async function approveFirst() {
  const review = await getSellerAssistanceReview();
  assert.equal(review.suggestions.length, 1);
  const item = review.suggestions[0]!;
  await approveSellerAssistance("admin", item.userId, item.shopId, item.fingerprint);
  return item;
}

test("approval reserves once, sends only the reviewed email and does not send again", async (t) => {
  const state = harness(t);
  const item = await approveFirst();
  await assert.rejects(() => approveSellerAssistance("admin", item.userId, item.shopId, item.fingerprint));
  let calls = 0;
  const send = async (message: any) => {
    calls++;
    assert.equal(message.to, "seller@example.com");
    assert.match(message.text, /Add my first product/);
    assert.match(message.headers["List-Unsubscribe"], /api\/email\/unsubscribe\?token=tfmu/);
    assert.equal(message.tags[1].value, "recipient");
    return { success: true, id: "provider-1" };
  };
  assert.equal((await deliverApprovedSellerAssistance(send)).sent, 1);
  assert.equal((await deliverApprovedSellerAssistance(send)).sent, 0);
  assert.equal(calls, 1);
  assert.equal(state.recipient.status, "SENT");
  assert.ok(state.locks >= 2);
});

test("resolved situation, withdrawn consent and suppression cancel approved emails", async (t) => {
  for (const change of ["resolved", "consent", "suppression"]) {
    await t.test(change, async (child) => {
      const state = harness(child); await approveFirst();
      if (change === "resolved") state.member.shop.products = [{ id: "draft", isActive: false, isFlagged: false }];
      if (change === "consent") state.member.user.emailMarketingPreference.status = "OPTED_OUT";
      if (change === "suppression") state.suppression = true;
      const result = await deliverApprovedSellerAssistance(async () => { assert.fail("Must not send"); });
      assert.equal(result.skipped, 1);
      assert.equal(state.recipient.status, "SUPPRESSED");
    });
  }
});

test("weekly cap and unknown consent exclude preview suggestions", async (t) => {
  const state = harness(t);
  state.recent = true;
  assert.equal((await getSellerAssistanceReview()).suggestions.length, 0);
  state.recent = false; state.member.user.emailMarketingPreference.status = "UNKNOWN";
  assert.equal((await getSellerAssistanceReview()).suggestions.length, 0);
});

test("stale preview cannot approve a changed message; queued email can be cancelled", async (t) => {
  const state = harness(t);
  const item = (await getSellerAssistanceReview()).suggestions[0]!;
  state.member.shop.name = "Renamed shop";
  await assert.rejects(() => approveSellerAssistance("admin", item.userId, item.shopId, item.fingerprint));
  await approveFirst();
  assert.equal(await cancelSellerAssistance("campaign"), 1);
  assert.equal((await deliverApprovedSellerAssistance(async () => { assert.fail("Cancelled"); })).sent, 0);
});

test("unconfirmed provider response is not automatically retried", async (t) => {
  const state = harness(t); await approveFirst();
  assert.equal((await deliverApprovedSellerAssistance(async () => ({ success: true, fallback: true }))).failed, 1);
  assert.equal(state.recipient.status, "FAILED");
  await deliverApprovedSellerAssistance(async () => { assert.fail("Unknown delivery must not retry"); });
});

test("sending disabled preserves the queue; cron rejects missing or wrong authorization", async (t) => {
  const state = harness(t); await approveFirst();
  process.env.SELLER_ASSISTANCE_SEND_ENABLED = "false";
  const result = await deliverApprovedSellerAssistance(async () => { assert.fail("Disabled"); });
  assert.ok(result.blockers.includes("assistance_send_disabled"));
  assert.equal(state.recipient.status, "PENDING");
  assert.equal((await GET(new Request("https://example.com/api/cron/seller-assistance"))).status, 401);
  delete process.env.CRON_SECRET;
  assert.equal((await GET(new Request("https://example.com/api/cron/seller-assistance", { headers: { authorization: "Bearer undefined" } }))).status, 401);
});

test("complaints suppress future email and late delivery cannot overwrite them", async (t) => {
  const state = harness(t); await approveFirst();
  await deliverApprovedSellerAssistance(async () => ({ success: true, id: "provider-1" }));
  const data = { email_id: "provider-1", to: ["seller@example.com"], tags: { recipient_id: "recipient" }, created_at: new Date().toISOString(), from: "notifications@tradefeed.co.za", subject: "Test" };
  await applyAssistanceDeliveryEvent({ type: "email.complained", created_at: new Date().toISOString(), data });
  await applyAssistanceDeliveryEvent({ type: "email.delivered", created_at: new Date().toISOString(), data });
  assert.equal(state.recipient.status, "COMPLAINED");
  assert.equal(state.suppression, true);
});

test("unsigned provider webhooks are rejected before changing delivery state", async (t) => {
  const state = harness(t);
  const response = await POST(new Request("https://example.com/api/webhooks/resend", { method: "POST", body: JSON.stringify({ type: "email.complained", data: { email_id: "x", to: ["seller@example.com"] } }) }));
  assert.equal(response.status, 401);
  assert.equal(state.suppression, false);
});

test("changing the recipient address invalidates the reviewed approval", async (t) => {
  const state = harness(t);
  const item = (await getSellerAssistanceReview()).suggestions[0]!;
  state.member.user.email = "different@example.com";
  await assert.rejects(() => approveSellerAssistance("admin", item.userId, item.shopId, item.fingerprint));
});

test("old product-news consent alone does not authorize tailored assistance", async (t) => {
  const state = harness(t);
  state.member.user.emailMarketingPreference.consentVersion = "product_news_v1";
  assert.equal((await getSellerAssistanceReview()).suggestions.length, 0);
});

test("a signed bounce is recorded and replayed without duplicate sends", async (t) => {
  const state = harness(t); await approveFirst();
  await deliverApprovedSellerAssistance(async () => ({ success: true, id: "provider-1" }));
  const body = JSON.stringify({ type: "email.bounced", data: { email_id: "provider-1", to: ["seller@example.com"], tags: { recipient_id: "recipient" } } });
  const time = new Date();
  const signature = new Webhook(process.env.RESEND_WEBHOOK_SECRET!).sign("event-1", time, body);
  const request = () => new Request("https://example.com/api/webhooks/resend", { method: "POST", body, headers: { "svix-id": "event-1", "svix-timestamp": String(Math.floor(time.getTime() / 1000)), "svix-signature": signature } });
  assert.equal((await POST(request())).status, 200);
  assert.equal((await POST(request())).status, 200);
  assert.equal(state.recipient.status, "BOUNCED");
  assert.equal(state.suppression, true);
});
