import test from "node:test";
import assert from "node:assert/strict";

import { shopCreateSchema } from "@/lib/validation/shop";

const validInput = {
  name: "Test Traders",
  description: "",
  whatsappNumber: "071 234 5678",
  city: "Johannesburg",
  province: "Gauteng",
};

test("accepts a valid shop with city and province", () => {
  const result = shopCreateSchema.safeParse(validInput);
  assert.equal(result.success, true);
  assert.equal(result.data?.city, "Johannesburg");
  assert.equal(result.data?.province, "Gauteng");
  assert.equal(result.data?.whatsappNumber, "+27712345678");
});

test("rejects a missing city", () => {
  const result = shopCreateSchema.safeParse({ ...validInput, city: "" });
  assert.equal(result.success, false);
  const paths = result.error?.issues.map((i) => i.path[0]);
  assert.ok(paths?.includes("city"));
});

test("rejects an unknown province", () => {
  const result = shopCreateSchema.safeParse({
    ...validInput,
    province: "Atlantis",
  });
  assert.equal(result.success, false);
  const paths = result.error?.issues.map((i) => i.path[0]);
  assert.ok(paths?.includes("province"));
});

test("trims whitespace from city", () => {
  const result = shopCreateSchema.safeParse({
    ...validInput,
    city: "  Cape Town  ",
  });
  assert.equal(result.success, true);
  assert.equal(result.data?.city, "Cape Town");
});

test("accepts a small town not in the suggestion list", () => {
  const result = shopCreateSchema.safeParse({
    ...validInput,
    city: "Brakpan",
    province: "Gauteng",
  });
  assert.equal(result.success, true);
});
