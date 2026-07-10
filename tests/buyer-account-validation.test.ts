import test from "node:test";
import assert from "node:assert/strict";

import { buyerAddressSchema, buyerProfileSchema } from "@/lib/validation/buyer-account";

const validAddress = {
  label: "Home",
  recipientName: "Lerato Mokoena",
  phone: "082 123 4567",
  addressLine1: "12 Market Street",
  addressLine2: "",
  city: "Johannesburg",
  province: "Gauteng" as const,
  postalCode: "2001",
  deliveryInstructions: "Call at the gate",
  isDefault: true,
};

test("accepts a complete South African delivery address", () => {
  assert.equal(buyerAddressSchema.safeParse(validAddress).success, true);
});

test("rejects invalid provinces, postal codes, and phone numbers", () => {
  assert.equal(buyerAddressSchema.safeParse({ ...validAddress, province: "Unknown" }).success, false);
  assert.equal(buyerAddressSchema.safeParse({ ...validAddress, postalCode: "200" }).success, false);
  assert.equal(buyerAddressSchema.safeParse({ ...validAddress, phone: "123" }).success, false);
});

test("validates buyer display name and supported language", () => {
  assert.equal(buyerProfileSchema.safeParse({ displayName: "Lerato", language: "zu" }).success, true);
  assert.equal(buyerProfileSchema.safeParse({ displayName: "L", language: "en" }).success, false);
  assert.equal(buyerProfileSchema.safeParse({ displayName: "Lerato", language: "fr" }).success, false);
});
