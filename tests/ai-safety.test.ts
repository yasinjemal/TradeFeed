// ============================================================
// Tests — AI Safety Layer
// ============================================================
// Unit tests for sanitizeAIOutput, moderateContent, limitTags,
// and applyAISafety from lib/validation/ai-product.ts
// ============================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeAIOutput,
  moderateContent,
  limitTags,
  applyAISafety,
} from "@/lib/validation/ai-product";
import type { AiProductResponse } from "@/lib/validation/ai-product";

// ── Helper: create a valid AI response ──────────────────
function mockResponse(overrides: Partial<AiProductResponse> = {}): AiProductResponse {
  return {
    name: "Premium Oversized Hoodie — Fleece Lined",
    description:
      "Stay warm in style with this premium fleece-lined oversized hoodie. Soft cotton blend, relaxed fit.",
    category: "Hoodies",
    tags: ["hoodie", "oversized hoodie", "fleece", "winter clothing SA"],
    shortCaption: "🔥 Premium fleece hoodie — order now via WhatsApp 📦",
    seoTitle: "Oversized Fleece Hoodie — Buy Online | TradeFeed SA",
    seoDescription:
      "Shop premium fleece-lined hoodies in S-XXL. Order via WhatsApp. Available on TradeFeed.",
    ...overrides,
  };
}

// ── sanitizeAIOutput ────────────────────────────────────
describe("sanitizeAIOutput", () => {
  it("strips HTML tags from all fields", () => {
    const dirty = mockResponse({
      name: "<b>Premium</b> Hoodie",
      description: "Great <script>alert('xss')</script> product",
      shortCaption: "<em>Buy now!</em> 🔥",
    });

    const cleaned = sanitizeAIOutput(dirty);
    assert.ok(!cleaned.name.includes("<b>"));
    assert.ok(!cleaned.description.includes("<script>"));
    assert.ok(!cleaned.shortCaption.includes("<em>"));
  });

  it("normalizes excessive whitespace", () => {
    const dirty = mockResponse({
      name: "Premium     Oversized     Hoodie",
      description: "First line.\n\n\n\n\n   Second line.",
    });

    const cleaned = sanitizeAIOutput(dirty);
    assert.ok(!cleaned.name.includes("     "));
    assert.ok(!cleaned.description.includes("\n\n\n"));
  });

  it("removes empty tags", () => {
    const dirty = mockResponse({
      tags: ["hoodie", "", "  ", "fleece"],
    });

    const cleaned = sanitizeAIOutput(dirty);
    assert.equal(cleaned.tags.length, 2);
    assert.deepEqual(cleaned.tags, ["hoodie", "fleece"]);
  });

  it("handles undefined SEO fields gracefully", () => {
    const dirty = mockResponse({
      seoTitle: undefined as unknown as string,
      seoDescription: undefined as unknown as string,
    });

    const cleaned = sanitizeAIOutput(dirty);
    assert.equal(cleaned.seoTitle, "");
    assert.equal(cleaned.seoDescription, "");
  });
});

// ── moderateContent ─────────────────────────────────────
describe("moderateContent", () => {
  it("passes clean content without flags", () => {
    const result = moderateContent(mockResponse());
    assert.equal(result.clean, true);
    assert.equal(result.flags.length, 0);
  });

  it("flags phone numbers in description", () => {
    const dirty = mockResponse({
      description: "Call me at +27835034502 for bulk orders.",
    });

    const result = moderateContent(dirty);
    assert.equal(result.clean, false);
    assert.ok(result.flags.some((f) => f.includes("description")));
    assert.ok(result.data.description.includes("***"));
  });

  it("flags email addresses", () => {
    const dirty = mockResponse({
      description: "Email seller@gmail.com for more info.",
    });

    const result = moderateContent(dirty);
    assert.equal(result.clean, false);
    assert.ok(result.data.description.includes("***"));
  });

  it("flags URLs injected by AI", () => {
    const dirty = mockResponse({
      description: "Buy at https://scam-site.com now!",
    });

    const result = moderateContent(dirty);
    assert.equal(result.clean, false);
    assert.ok(result.data.description.includes("***"));
  });

  it("flags spam phrases", () => {
    const dirty = mockResponse({
      name: "ACT NOW Limited Time Only Hoodie",
    });

    const result = moderateContent(dirty);
    assert.equal(result.clean, false);
    assert.ok(result.flags.some((f) => f.includes("name")));
  });

  it("flags dangerous health claims", () => {
    const dirty = mockResponse({
      description: "This cream cures cancer and promotes weight loss miracle results.",
    });

    const result = moderateContent(dirty);
    assert.equal(result.clean, false);
  });

  it("does not flag legitimate product content", () => {
    const clean = mockResponse({
      name: "Nike Air Force 1 White Sneakers — Men's Size 8-12",
      description:
        "Classic Nike Air Force 1 in all-white leather. Durable rubber outsole, foam midsole for all-day comfort. Perfect for casual wear in South Africa.",
    });

    const result = moderateContent(clean);
    assert.equal(result.clean, true);
  });
});

// ── limitTags ───────────────────────────────────────────
describe("limitTags", () => {
  it("returns tags as-is when under limit", () => {
    const tags = ["hoodie", "fleece", "winter"];
    assert.deepEqual(limitTags(tags, 10), ["hoodie", "fleece", "winter"]);
  });

  it("truncates tags over the limit", () => {
    const tags = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    const result = limitTags(tags, 10);
    assert.equal(result.length, 10);
  });

  it("deduplicates case-insensitively", () => {
    const tags = ["Hoodie", "hoodie", "HOODIE", "fleece"];
    const result = limitTags(tags);
    assert.equal(result.length, 2);
  });

  it("removes empty/whitespace-only tags", () => {
    const tags = ["hoodie", "", "  ", "fleece"];
    const result = limitTags(tags);
    assert.equal(result.length, 2);
  });

  it("preserves original casing of first occurrence", () => {
    const tags = ["Hoodie", "hoodie"];
    const result = limitTags(tags);
    assert.deepEqual(result, ["Hoodie"]);
  });
});

// ── applyAISafety (full pipeline) ───────────────────────
describe("applyAISafety", () => {
  it("passes clean data through unchanged (except tag normalization)", () => {
    const input = mockResponse();
    const { data, flags } = applyAISafety(input);

    assert.equal(flags.length, 0);
    assert.equal(data.name, input.name);
    assert.equal(data.description, input.description);
    assert.equal(data.category, input.category);
  });

  it("catches HTML + phone number + excessive tags in one pass", () => {
    const dirty = mockResponse({
      name: "<b>Premium</b> Hoodie",
      description: "Call +27835034502 to order",
      tags: Array.from({ length: 15 }, (_, i) => `tag${i}`),
    });

    const { data, flags } = applyAISafety(dirty);

    // HTML stripped
    assert.ok(!data.name.includes("<b>"));
    // Phone flagged
    assert.ok(flags.length > 0);
    // Tags capped at 10
    assert.ok(data.tags.length <= 10);
  });
});
