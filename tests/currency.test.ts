import test from "node:test";
import assert from "node:assert/strict";
import { formatZARCents, formatZARRands } from "@/lib/currency";

test("formats whole Rand amounts without a decimal tail", () => {
  assert.equal(formatZARRands(1899), "R 1,899");
  assert.equal(formatZARCents(189900), "R 1,899");
});

test("formats Rand cents with a familiar decimal separator", () => {
  assert.equal(formatZARRands(2500.02), "R 2,500.02");
  assert.equal(formatZARCents(250002), "R 2,500.02");
});

test("does not display invalid money values", () => {
  assert.equal(formatZARRands(Number.NaN), "R 0");
});
