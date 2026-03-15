// ============================================================
// Tests — Auto-Reply Generator
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateAutoReply } from "../lib/whatsapp/auto-reply";
import { detectIntent } from "../lib/whatsapp/intent-detection";
import type { IntentResult } from "../lib/whatsapp/intent-detection";

const SHOP = {
  shopName: "TestShop",
  catalogUrl: "https://tradefeed.co.za/catalog/testshop",
};

describe("generateAutoReply", () => {
  it("generates a greeting reply with shop name and catalog URL", () => {
    const intent = detectIntent("Hi there");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "greeting");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes("TestShop"));
    assert.ok(reply.message.includes(SHOP.catalogUrl));
    assert.ok(reply.message.includes("👋"));
  });

  it("generates a price inquiry reply", () => {
    const intent = detectIntent("How much is this?");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "price_inquiry");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes("💰"));
    assert.ok(reply.message.includes(SHOP.catalogUrl));
  });

  it("generates an availability reply with size entity", () => {
    const intent: IntentResult = {
      intent: "availability",
      confidence: 0.85,
      entities: { size: "XL" },
    };
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "availability");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes("XL"));
  });

  it("generates an availability reply with color entity", () => {
    const intent: IntentResult = {
      intent: "availability",
      confidence: 0.85,
      entities: { color: "red" },
    };
    const reply = generateAutoReply(intent, SHOP);
    assert.ok(reply.message.includes("red"));
  });

  it("generates a delivery reply with city entity", () => {
    const intent = detectIntent("Do you deliver to Durban?");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "delivery");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes("Durban"));
    assert.ok(reply.message.includes("🚚"));
  });

  it("generates a delivery reply without city — asks for it", () => {
    const intent: IntentResult = {
      intent: "delivery",
      confidence: 0.8,
      entities: {},
    };
    const reply = generateAutoReply(intent, SHOP);
    assert.ok(reply.message.includes("Let us know your city"));
  });

  it("generates an order status reply with order number", () => {
    const intent = detectIntent("Where is my order TF-20260315-A1B2?");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "order_status");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes("TF-20260315-A1B2"));
  });

  it("generates an order status reply without number — asks for it", () => {
    const intent: IntentResult = {
      intent: "order_status",
      confidence: 0.8,
      entities: {},
    };
    const reply = generateAutoReply(intent, SHOP);
    assert.ok(reply.message.includes("order number"));
    assert.ok(reply.message.includes("TF-"));
  });

  it("generates a product info reply", () => {
    const intent = detectIntent("Tell me more about this");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "product_info");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes(SHOP.catalogUrl));
  });

  it("generates a thanks reply with shop name", () => {
    const intent = detectIntent("Thank you so much!");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "thanks");
    assert.equal(reply.shouldSend, true);
    assert.ok(reply.message.includes("TestShop"));
    assert.ok(reply.message.includes("😊"));
  });

  it("does not send for unknown intent", () => {
    const intent = detectIntent("asjdhaskjdh random gibberish");
    const reply = generateAutoReply(intent, SHOP);
    assert.equal(reply.intent, "unknown");
    assert.equal(reply.shouldSend, false);
    assert.equal(reply.message, "");
  });

  it("keeps all messages WhatsApp-friendly (under 1024 chars)", () => {
    const intents: IntentResult[] = [
      { intent: "greeting", confidence: 0.9, entities: {} },
      { intent: "price_inquiry", confidence: 0.9, entities: {} },
      { intent: "availability", confidence: 0.9, entities: { size: "XXL", color: "navy blue" } },
      { intent: "delivery", confidence: 0.9, entities: { city: "Johannesburg" } },
      { intent: "order_status", confidence: 0.9, entities: { orderNumber: "TF-20260315-ZZZZ" } },
      { intent: "product_info", confidence: 0.9, entities: {} },
      { intent: "thanks", confidence: 0.9, entities: {} },
    ];

    for (const intent of intents) {
      const reply = generateAutoReply(intent, SHOP);
      if (reply.shouldSend) {
        assert.ok(
          reply.message.length <= 1024,
          `${intent.intent} reply too long: ${reply.message.length} chars`
        );
      }
    }
  });
});
