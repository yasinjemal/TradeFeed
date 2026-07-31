import test from "node:test";
import assert from "node:assert/strict";

import { cleanHuntPublicText } from "@/lib/ai/analyze-hunt-reference";
import { derivePublicHuntStatus } from "@/lib/db/hunts";
import { generateHuntSlug } from "@/lib/hunt/slug";
import {
  HUNT_PILOT_CITY,
  detectHuntImageMime,
  huntCreateFieldsSchema,
} from "@/lib/validation/hunt";

test("HUNT image detection accepts real JPEG, PNG and WebP signatures", () => {
  assert.equal(
    detectHuntImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xdb])),
    "image/jpeg",
  );
  assert.equal(
    detectHuntImageMime(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    "image/png",
  );
  assert.equal(
    detectHuntImageMime(
      new Uint8Array([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ),
    "image/webp",
  );
});

test("HUNT image detection rejects untrusted SVG, GIF and random bytes", () => {
  assert.equal(
    detectHuntImageMime(
      new TextEncoder().encode("<svg><script>alert(1)</script></svg>"),
    ),
    null,
  );
  assert.equal(
    detectHuntImageMime(new TextEncoder().encode("GIF89a")),
    null,
  );
  assert.equal(detectHuntImageMime(new Uint8Array([1, 2, 3, 4])), null);
});

test("HUNT fields convert a valid Rand budget to integer cents", () => {
  const result = huntCreateFieldsSchema.parse({
    requestText: "Retro runners in black",
    desiredVariant: "Size 6",
    city: HUNT_PILOT_CITY,
    maxBudgetCents: "799.95",
    matchPreference: "SIMILAR_OK",
    buyerName: "",
    phone: "0821234567",
    publicImageConsent: true,
    huntUpdatesConsent: true,
    termsAccepted: true,
  });

  assert.equal(result.maxBudgetCents, 79_995);
  assert.equal(result.buyerName, undefined);
});

test("HUNT fields reject a different city and missing consent during the pilot", () => {
  const result = huntCreateFieldsSchema.safeParse({
    requestText: "Retro runners",
    desiredVariant: "",
    city: "Cape Town",
    maxBudgetCents: "800",
    matchPreference: "EXACT_ONLY",
    buyerName: "",
    phone: "0821234567",
    publicImageConsent: false,
    huntUpdatesConsent: true,
    termsAccepted: true,
  });

  assert.equal(result.success, false);
});

test("public HUNT copy strips markup, handles and contact details", () => {
  const cleaned = cleanHuntPublicText(
    '<b>Retro runners</b> @privateuser +27821234567 https://example.com',
    140,
  );

  assert.equal(cleaned, "Retro runners");
});

test("HUNT slugs have a readable prefix and non-enumerable random suffix", () => {
  const first = generateHuntSlug("Brown Knit Polo");
  const second = generateHuntSlug("Brown Knit Polo");

  assert.match(first, /^brown-knit-polo-[a-z0-9_-]{13,14}$/);
  assert.notEqual(first, second);
});

test("an elapsed live HUNT is presented as expired without a cron dependency", () => {
  const status = derivePublicHuntStatus(
    "LIVE",
    new Date("2026-07-29T00:00:00.000Z"),
    new Date("2026-07-30T00:00:00.000Z"),
  );

  assert.equal(status, "EXPIRED");
});
