import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePrice,
  parseSizes,
  parseColors,
  parseProductMessage,
} from "@/lib/whatsapp/product-import-parser";

// ── parsePrice ──────────────────────────────────────────────

test("parsePrice: simple R250", () => {
  const result = parsePrice("R250");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: null });
});

test("parsePrice: R with space R 250", () => {
  const result = parsePrice("R 250");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: null });
});

test("parsePrice: decimal R250.50", () => {
  const result = parsePrice("R250.50");
  assert.deepStrictEqual(result, { minPriceCents: 25050, maxPriceCents: null });
});

test("parsePrice: thousands R1,250", () => {
  const result = parsePrice("R1,250");
  assert.deepStrictEqual(result, { minPriceCents: 125000, maxPriceCents: null });
});

test("parsePrice: thousands with space R1 250", () => {
  const result = parsePrice("R1 250");
  assert.deepStrictEqual(result, { minPriceCents: 125000, maxPriceCents: null });
});

test("parsePrice: bare number 250", () => {
  const result = parsePrice("250");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: null });
});

test("parsePrice: from R250", () => {
  const result = parsePrice("from R250");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: null });
});

test("parsePrice: range R250-R500", () => {
  const result = parsePrice("R250-R500");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: 50000 });
});

test("parsePrice: range 250-500", () => {
  const result = parsePrice("250-500");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: 50000 });
});

test("parsePrice: range with spaces R250 - R500", () => {
  const result = parsePrice("R250 - R500");
  assert.deepStrictEqual(result, { minPriceCents: 25000, maxPriceCents: 50000 });
});

test("parsePrice: returns null for no price", () => {
  const result = parsePrice("beautiful dress available now");
  assert.strictEqual(result, null);
});

test("parsePrice: price embedded in text", () => {
  const result = parsePrice("Beautiful dress R350 available now");
  assert.deepStrictEqual(result, { minPriceCents: 35000, maxPriceCents: null });
});

// ── parseSizes ──────────────────────────────────────────────

test("parseSizes: range S-XL", () => {
  const result = parseSizes("S-XL");
  assert.deepStrictEqual(result, ["S", "M", "L", "XL"]);
});

test("parseSizes: range with spaces S - XXL", () => {
  const result = parseSizes("S - XXL");
  assert.deepStrictEqual(result, ["S", "M", "L", "XL", "XXL"]);
});

test("parseSizes: listed S M L XL", () => {
  const result = parseSizes("S M L XL");
  assert.deepStrictEqual(result, ["S", "M", "L", "XL"]);
});

test("parseSizes: comma-separated S, M, L", () => {
  const result = parseSizes("S, M, L");
  assert.deepStrictEqual(result, ["S", "M", "L"]);
});

test("parseSizes: numeric range 28-34", () => {
  const result = parseSizes("28-34");
  assert.deepStrictEqual(result, ["28", "30", "32", "34"]);
});

test("parseSizes: size 6-12", () => {
  const result = parseSizes("size 6-12");
  assert.deepStrictEqual(result, ["6", "7", "8", "9", "10", "11", "12"]);
});

test("parseSizes: one size", () => {
  const result = parseSizes("one size");
  assert.deepStrictEqual(result, ["One Size"]);
});

test("parseSizes: free size", () => {
  const result = parseSizes("free size");
  assert.deepStrictEqual(result, ["One Size"]);
});

test("parseSizes: returns Default when no sizes found", () => {
  const result = parseSizes("beautiful dress available");
  assert.deepStrictEqual(result, ["Default"]);
});

// ── parseColors ─────────────────────────────────────────────

test("parseColors: single color black", () => {
  const result = parseColors("black hoodie");
  assert.deepStrictEqual(result, ["Black"]);
});

test("parseColors: multiple colors", () => {
  const result = parseColors("available in black, white and red");
  assert.deepStrictEqual(result, ["Black", "White", "Red"]);
});

test("parseColors: case insensitive", () => {
  const result = parseColors("NAVY Blue tee");
  assert.deepStrictEqual(result, ["Blue", "Navy"]);
});

test("parseColors: no colors found", () => {
  const result = parseColors("hoodie R250 S-XL");
  assert.deepStrictEqual(result, []);
});

test("parseColors: does not match partial words", () => {
  const result = parseColors("wholesale order");
  assert.deepStrictEqual(result, []);
});

// ── parseProductMessage ─────────────────────────────────────

test("parseProductMessage: full message", () => {
  const result = parseProductMessage("Black hoodie R250 S-XL");
  assert.deepStrictEqual(result, {
    price: { minPriceCents: 25000, maxPriceCents: null },
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black"],
    rawText: "Black hoodie R250 S-XL",
  });
});

test("parseProductMessage: range price with colors", () => {
  const result = parseProductMessage(
    "Summer dress R350-R500, available in red, blue and pink. Size S, M, L"
  );
  assert.strictEqual(result.price?.minPriceCents, 35000);
  assert.strictEqual(result.price?.maxPriceCents, 50000);
  assert.ok(result.colors.includes("Red"));
  assert.ok(result.colors.includes("Blue"));
  assert.ok(result.colors.includes("Pink"));
  assert.deepStrictEqual(result.sizes, ["S", "M", "L"]);
});

test("parseProductMessage: minimal message no price or size", () => {
  const result = parseProductMessage("new stock just arrived");
  assert.strictEqual(result.price, null);
  assert.deepStrictEqual(result.sizes, ["Default"]);
  assert.deepStrictEqual(result.colors, []);
  assert.strictEqual(result.rawText, "new stock just arrived");
});
