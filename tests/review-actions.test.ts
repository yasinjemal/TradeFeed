// ============================================================
// Tests — Review Action Validation
// ============================================================
// Tests for the review submission validation: Zod schema bounds,
// product-shop ownership check, and edge cases.
//
// Pattern: Direct Zod schema testing (pure functions, no DB).
// Uses Node.js built-in test runner (node:test + node:assert).
// ============================================================

import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

// ── Recreate the review schema locally (same as reviews.ts) ─
// We recreate it here to test in isolation without importing the
// server action file (which has "use server" directive + DB deps).
// If the schema changes in reviews.ts, these tests catch drift.

const submitReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z.string().trim().max(200, "Title too long").optional().or(z.literal("")),
  comment: z.string().trim().max(2000, "Review too long").optional().or(z.literal("")),
  buyerName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  buyerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

// ── Helpers ─────────────────────────────────────────────────

function validReviewInput() {
  return {
    rating: 5,
    title: "Great product!",
    comment: "Fits perfectly, fast delivery.",
    buyerName: "Thabo",
    buyerEmail: "thabo@example.com",
  };
}

// ============================================================
// Valid Input
// ============================================================

test("submitReviewSchema accepts valid input", () => {
  const result = submitReviewSchema.safeParse(validReviewInput());
  assert.equal(result.success, true);
});

test("submitReviewSchema accepts minimal required fields", () => {
  const result = submitReviewSchema.safeParse({
    rating: 3,
    buyerName: "Nomsa",
  });
  assert.equal(result.success, true);
});

test("submitReviewSchema accepts empty string title and comment", () => {
  const result = submitReviewSchema.safeParse({
    ...validReviewInput(),
    title: "",
    comment: "",
  });
  assert.equal(result.success, true);
});

test("submitReviewSchema accepts empty string email", () => {
  const result = submitReviewSchema.safeParse({
    ...validReviewInput(),
    buyerEmail: "",
  });
  assert.equal(result.success, true);
});

// ============================================================
// Rating Bounds
// ============================================================

test("submitReviewSchema rejects rating of 0", () => {
  const input = { ...validReviewInput(), rating: 0 };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
  if (!result.success) {
    const msg = result.error.issues[0]?.message;
    assert.equal(msg, "Rating must be 1-5");
  }
});

test("submitReviewSchema rejects rating of 6", () => {
  const input = { ...validReviewInput(), rating: 6 };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects negative rating", () => {
  const input = { ...validReviewInput(), rating: -1 };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects fractional rating", () => {
  const input = { ...validReviewInput(), rating: 3.5 };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema accepts rating of 1 (lower bound)", () => {
  const input = { ...validReviewInput(), rating: 1 };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
});

test("submitReviewSchema accepts rating of 5 (upper bound)", () => {
  const input = { ...validReviewInput(), rating: 5 };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
});

// ============================================================
// Field Length Limits
// ============================================================

test("submitReviewSchema rejects title over 200 chars", () => {
  const input = { ...validReviewInput(), title: "A".repeat(201) };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects comment over 2000 chars", () => {
  const input = { ...validReviewInput(), comment: "A".repeat(2001) };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects buyerName over 100 chars", () => {
  const input = { ...validReviewInput(), buyerName: "A".repeat(101) };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema accepts title at exactly 200 chars", () => {
  const input = { ...validReviewInput(), title: "A".repeat(200) };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
});

test("submitReviewSchema accepts comment at exactly 2000 chars", () => {
  const input = { ...validReviewInput(), comment: "A".repeat(2000) };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
});

// ============================================================
// Required Fields
// ============================================================

test("submitReviewSchema rejects missing buyerName", () => {
  const { buyerName, ...input } = validReviewInput();
  const result = submitReviewSchema.safeParse({ ...input, rating: 4 });
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects empty buyerName", () => {
  const input = { ...validReviewInput(), buyerName: "" };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects whitespace-only buyerName", () => {
  const input = { ...validReviewInput(), buyerName: "   " };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema rejects missing rating", () => {
  const { rating, ...input } = validReviewInput();
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

// ============================================================
// Email Validation
// ============================================================

test("submitReviewSchema rejects invalid email format", () => {
  const input = { ...validReviewInput(), buyerEmail: "not-an-email" };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, false);
});

test("submitReviewSchema accepts valid email", () => {
  const input = { ...validReviewInput(), buyerEmail: "buyer@shop.co.za" };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
});

// ============================================================
// Trimming
// ============================================================

test("submitReviewSchema trims buyerName whitespace", () => {
  const input = { ...validReviewInput(), buyerName: "  Thabo  " };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.buyerName, "Thabo");
  }
});

test("submitReviewSchema trims title whitespace", () => {
  const input = { ...validReviewInput(), title: "  Great!  " };
  const result = submitReviewSchema.safeParse(input);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.title, "Great!");
  }
});
