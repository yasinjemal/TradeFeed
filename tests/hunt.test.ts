import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import {
  buildHuntPublicCopy,
  cleanHuntPublicText,
} from "@/lib/ai/analyze-hunt-reference";
import {
  derivePublicHuntStatus,
  publicHuntOfferSelect,
} from "@/lib/db/hunts";
import { generateHuntSlug } from "@/lib/hunt/slug";
import {
  buildHuntWhatsAppMessage,
  buildHuntWhatsAppUrl,
} from "@/lib/hunt/whatsapp";
import { sanitizeHuntPublicImage } from "@/lib/hunt/image-sanitization";
import {
  HUNT_PILOT_CITY,
  detectHuntImageMime,
  huntAdminOfferSchema,
  huntCreateFieldsSchema,
  huntReportSchema,
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

test("HUNT public image rebuilding strips source metadata", async () => {
  const source = await sharp({
    create: {
      width: 48,
      height: 32,
      channels: 3,
      background: "#6b4f3b",
    },
  })
    .jpeg()
    .withMetadata({
      orientation: 6,
      exif: {
        IFD0: {
          Artist: "Private device owner",
          Copyright: "Private location record",
        },
      },
    })
    .toBuffer();
  const sourceMetadata = await sharp(source).metadata();
  assert.ok(sourceMetadata.exif);

  const sanitized = await sanitizeHuntPublicImage(source);
  const publicMetadata = await sharp(sanitized.bytes).metadata();

  assert.equal(sanitized.mime, "image/webp");
  assert.equal(detectHuntImageMime(sanitized.bytes), "image/webp");
  assert.equal(publicMetadata.exif, undefined);
  assert.equal(publicMetadata.xmp, undefined);
  assert.equal(publicMetadata.orientation, undefined);
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

  const publicContact = huntCreateFieldsSchema.safeParse({
    requestText: "Retro runners",
    desiredVariant: "+27 (82) 123-4567",
    city: HUNT_PILOT_CITY,
    maxBudgetCents: "800",
    matchPreference: "EXACT_ONLY",
    buyerName: "",
    phone: "0821234567",
    publicImageConsent: true,
    huntUpdatesConsent: true,
    termsAccepted: true,
  });
  assert.equal(publicContact.success, false);
});

test("public HUNT copy strips markup, handles and contact details", () => {
  const cleaned = cleanHuntPublicText(
    '<b>Retro runners</b> @privateuser +27821234567 https://example.com',
    140,
  );

  assert.equal(cleaned, "Retro runners");
  assert.equal(
    cleanHuntPublicText("Retro runners +27 (82) 123-4567", 140),
    "",
  );
});

test("public HUNT copy is built only from constrained product attributes", () => {
  const copy = buildHuntPublicCopy({
    itemType: "knit polo shirt",
    primaryColour: "brown",
    styleTerms: ["short sleeve", "retro"],
  });

  assert.equal(copy.publicTitle, "Brown short sleeve retro knit polo shirt");
  assert.match(copy.publicDescription, /concierge team/i);
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

test("HUNT WhatsApp handoff is structured and does not expose buyer contact data", () => {
  const handoff = {
    huntSlug: "brown-knit-polo-safe123",
    huntTitle: "Brown knit polo",
    requestedVariant: "Medium",
    sellerName: "Smiley Fashion",
    offerTitle: "Brown striped knit polo",
    offerPriceCents: 65_000,
    offerVariant: "Medium / Brown",
    deliveryEstimate: "Collection tomorrow",
  };

  const message = buildHuntWhatsAppMessage(handoff);
  const url = buildHuntWhatsAppUrl("+27 82 123 4567", handoff);

  assert.match(message, /Brown knit polo/);
  assert.match(message, /R\s?650/);
  assert.match(message, /confirm current stock/i);
  assert.doesNotMatch(message, /0829999999|buyer phone/i);
  assert.match(url, /^https:\/\/wa\.me\/27821234567\?text=/);
});

test("HUNT offer validation converts price and rejects injected seller contact data", () => {
  const valid = huntAdminOfferSchema.parse({
    huntId: "hunt-123",
    shopId: "shop-123",
    matchType: "EXACT",
    publicProductName: "Brown knit polo",
    publicDescription: "Checked with the seller",
    publicVariant: "Medium / Brown",
    publicDeliveryEstimate: "Collection tomorrow",
    priceCents: "650",
    quantityAvailable: "2",
  });

  assert.equal(valid.priceCents, 65_000);
  assert.equal(valid.quantityAvailable, 2);

  const injected = huntAdminOfferSchema.safeParse({
    ...valid,
    priceCents: "650",
    sellerWhatsappSnapshot: "27821234567",
  });
  assert.equal(injected.success, false);

  const publicProof = huntAdminOfferSchema.safeParse({
    ...valid,
    priceCents: "650",
    publicProofUrl: "https://4bggpvf2wh.ufs.sh/f/current-stock-proof",
    publicProofCapturedAt: new Date().toISOString(),
  });
  assert.equal(publicProof.success, false);

  for (const [field, value] of [
    ["publicProductName", "Call 082 123 4567"],
    ["publicDescription", "WhatsApp +27821234567"],
    ["publicVariant", "@seller"],
    ["publicDeliveryEstimate", "Details at https://seller.example"],
  ] as const) {
    const publicContact = huntAdminOfferSchema.safeParse({
      ...valid,
      priceCents: "650",
      [field]: value,
    });
    assert.equal(publicContact.success, false, `${field} must reject contact`);
  }

  const contactProof = huntAdminOfferSchema.safeParse({
    ...valid,
    priceCents: "650",
    publicProofUrl: "https://wa.me/27821234567",
  });
  assert.equal(contactProof.success, false);

  const externalProof = huntAdminOfferSchema.safeParse({
    ...valid,
    priceCents: "650",
    publicProofUrl: "https://example.com/current-stock.jpg",
  });
  assert.equal(externalProof.success, false);

  for (const contact of [
    "+27 (82) 123-4567",
    "082.123.4567",
    "083/123/4567",
    "82 123 4567",
    "seller.co.za",
  ]) {
    const disguisedContact = huntAdminOfferSchema.safeParse({
      ...valid,
      priceCents: "650",
      publicProductName: `Brown polo ${contact}`,
    });
    assert.equal(
      disguisedContact.success,
      false,
      `must reject disguised contact: ${contact}`,
    );
  }
});

test("HUNT reports accept known reasons and reject arbitrary status fields", () => {
  const valid = huntReportSchema.safeParse({
    huntSlug: "brown-knit-polo-safe123",
    reason: "PRIVACY",
    details: "The reference includes a username.",
  });
  assert.equal(valid.success, true);

  const injected = huntReportSchema.safeParse({
    huntSlug: "brown-knit-polo-safe123",
    reason: "PRIVACY",
    status: "DISMISSED",
  });
  assert.equal(injected.success, false);
});

test("public HUNT offer queries cannot select the seller WhatsApp snapshot", () => {
  assert.equal("sellerWhatsappSnapshot" in publicHuntOfferSelect, false);
  assert.equal("shopId" in publicHuntOfferSelect, false);
  assert.equal("publicShopSlugSnapshot" in publicHuntOfferSelect, false);
  assert.equal("publicSellerNameSnapshot" in publicHuntOfferSelect, false);
  assert.equal("publicSellerLogoUrlSnapshot" in publicHuntOfferSelect, false);
  assert.equal("publicProofUrl" in publicHuntOfferSelect, false);
  assert.equal("publicProofCapturedAt" in publicHuntOfferSelect, false);
  assert.equal("privateDataPurgeAfter" in publicHuntOfferSelect, false);
});
