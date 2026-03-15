// ============================================================
// Tests — WhatsApp Intent Detection
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectIntent,
  shouldAutoReply,
} from "@/lib/whatsapp/intent-detection";

// ── Price Inquiry ───────────────────────────────────────
describe("detectIntent — price_inquiry", () => {
  const priceMessages = [
    "How much is this?",
    "What's the price?",
    "price?",
    "how much",
    "How much does this cost?",
    "R?",
    "Any discount available?",
    "Is there a sale?",
  ];

  for (const msg of priceMessages) {
    it(`detects "${msg}" as price_inquiry`, () => {
      const result = detectIntent(msg);
      assert.equal(result.intent, "price_inquiry");
      assert.ok(result.confidence >= 0.7);
    });
  }
});

// ── Availability ────────────────────────────────────────
describe("detectIntent — availability", () => {
  it('detects "Is this still available?"', () => {
    const result = detectIntent("Is this still available?");
    assert.equal(result.intent, "availability");
  });

  it('detects "Do you have stock?"', () => {
    const result = detectIntent("Do you have stock?");
    assert.equal(result.intent, "availability");
  });

  it("extracts size entity from availability question", () => {
    const result = detectIntent("Do you have stock in size large?");
    assert.equal(result.intent, "availability");
    assert.ok(result.entities.size);
  });

  it("extracts color entity", () => {
    const result = detectIntent("Is the black one in stock?");
    assert.equal(result.intent, "availability");
    assert.ok(result.entities.color);
  });
});

// ── Delivery ────────────────────────────────────────────
describe("detectIntent — delivery", () => {
  it('detects "Do you deliver to Durban?"', () => {
    const result = detectIntent("Do you deliver to Durban?");
    assert.equal(result.intent, "delivery");
    assert.equal(result.entities.city?.toLowerCase(), "durban");
  });

  it('detects "How long does shipping take?"', () => {
    const result = detectIntent("How long does shipping take?");
    assert.equal(result.intent, "delivery");
  });

  it('detects "Can I collect?"', () => {
    const result = detectIntent("Can I collect?");
    assert.equal(result.intent, "delivery");
  });

  it("extracts Johannesburg city variants", () => {
    for (const variant of ["Johannesburg", "Joburg", "Jozi"]) {
      const result = detectIntent(`Delivery to ${variant}?`);
      assert.equal(result.intent, "delivery");
      assert.ok(result.entities.city, `Should extract city from "${variant}"`);
    }
  });
});

// ── Order Status ────────────────────────────────────────
describe("detectIntent — order_status", () => {
  it('detects "Where is my order?"', () => {
    const result = detectIntent("Where is my order?");
    assert.equal(result.intent, "order_status");
  });

  it("extracts order number", () => {
    const result = detectIntent("Track order TF-12345");
    assert.equal(result.intent, "order_status");
    assert.ok(result.entities.orderNumber?.includes("TF-12345"));
  });
});

// ── Product Info ────────────────────────────────────────
describe("detectIntent — product_info", () => {
  it('detects "What sizes do you have?"', () => {
    const result = detectIntent("What sizes do you have?");
    assert.equal(result.intent, "product_info");
  });

  it('detects "Tell me more about this"', () => {
    const result = detectIntent("Tell me more about this");
    assert.equal(result.intent, "product_info");
  });
});

// ── Greeting ────────────────────────────────────────────
describe("detectIntent — greeting", () => {
  const greetings = ["Hi", "Hello", "Hey", "Howzit", "Sawubona", "Good morning"];

  for (const msg of greetings) {
    it(`detects "${msg}" as greeting`, () => {
      const result = detectIntent(msg);
      assert.equal(result.intent, "greeting");
      assert.ok(result.confidence >= 0.9);
    });
  }
});

// ── Thanks ──────────────────────────────────────────────
describe("detectIntent — thanks", () => {
  const thankMessages = ["Thank you", "Thanks", "Dankie", "Ngiyabonga", "Enkosi"];

  for (const msg of thankMessages) {
    it(`detects "${msg}" as thanks`, () => {
      const result = detectIntent(msg);
      assert.equal(result.intent, "thanks");
    });
  }
});

// ── Unknown ─────────────────────────────────────────────
describe("detectIntent — unknown", () => {
  it("returns unknown for empty string", () => {
    const result = detectIntent("");
    assert.equal(result.intent, "unknown");
    assert.equal(result.confidence, 0);
  });

  it("returns unknown for random gibberish", () => {
    const result = detectIntent("asdfghjkl qwerty zxcvb");
    assert.equal(result.intent, "unknown");
  });
});

// ── shouldAutoReply ─────────────────────────────────────
describe("shouldAutoReply", () => {
  it("returns true for high-confidence price inquiry", () => {
    const result = detectIntent("How much?");
    assert.equal(shouldAutoReply(result), true);
  });

  it("returns false for unknown intent", () => {
    const result = detectIntent("asdfghjkl");
    assert.equal(shouldAutoReply(result), false);
  });
});
