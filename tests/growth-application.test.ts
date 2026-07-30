import test from "node:test";
import assert from "node:assert/strict";

import {
  GROWTH_APPLICATION_FIELD_LIMITS,
  TRADEFEED_GROWTH_WHATSAPP_NUMBER,
  buildGrowthApplicationMessage,
  buildGrowthApplicationWhatsAppUrl,
  normalizeGrowthApplication,
  type GrowthApplicationInput,
} from "@/lib/growth/application";

const application: GrowthApplicationInput = {
  businessName: "  Thandi's   Fashion  ",
  ownerName: "\n Thandi   Mokoena \t",
  applicantWhatsApp: "  +27 83 555 0101 ",
  productType: " Dresses   & accessories ",
  productCount: " About  45 ",
  salesChannel: " WhatsApp + Instagram ",
  photoReadiness: " Yes — most are ready ",
  serviceInterest: " Shop Launch ",
  launchTimeline: " Within  7 days ",
  challenge: " Customers ask for prices   repeatedly #catalogue 📱 ",
};

test("builds the exact labelled application message from normalized fields", () => {
  assert.equal(
    buildGrowthApplicationMessage(application),
    [
      "Hi TradeFeed Growth, I would like to apply.",
      "",
      "Business name: Thandi's Fashion",
      "Owner name: Thandi Mokoena",
      "Applicant WhatsApp: +27 83 555 0101",
      "Products sold: Dresses & accessories",
      "Approximate product count: About 45",
      "Current sales channel: WhatsApp + Instagram",
      "Product photo readiness: Yes — most are ready",
      "Service interest: Shop Launch",
      "Preferred launch timeline: Within 7 days",
      "Biggest challenge: Customers ask for prices repeatedly #catalogue 📱",
    ].join("\n"),
  );
});

test("encodes every field in a wa.me URL without changing the decoded message", () => {
  const url = buildGrowthApplicationWhatsAppUrl(application);
  const encodedMessage = url.split("?text=")[1];

  assert.ok(encodedMessage);
  assert.equal(
    url.startsWith(
      `https://wa.me/${TRADEFEED_GROWTH_WHATSAPP_NUMBER}?text=`,
    ),
    true,
  );
  assert.match(encodedMessage, /%26/);
  assert.match(encodedMessage, /%2B/);
  assert.match(encodedMessage, /%23/);
  assert.match(encodedMessage, /%F0%9F%93%B1/);
  assert.equal(
    decodeURIComponent(encodedMessage),
    buildGrowthApplicationMessage(application),
  );

  const parsedUrl = new URL(url);
  assert.equal(
    parsedUrl.searchParams.get("text"),
    buildGrowthApplicationMessage(application),
  );
});

test("bounds values and never puts undefined into the customer message", () => {
  const incompleteAtRuntime = {
    ...application,
    businessName: `  ${"A".repeat(200)}  `,
    challenge: undefined,
  } as unknown as GrowthApplicationInput;

  const normalized = normalizeGrowthApplication(incompleteAtRuntime);
  const message = buildGrowthApplicationMessage(incompleteAtRuntime);

  assert.equal(
    normalized.businessName.length,
    GROWTH_APPLICATION_FIELD_LIMITS.businessName,
  );
  assert.equal(normalized.challenge, "");
  assert.match(message, /Biggest challenge: Not provided/);
  assert.doesNotMatch(message, /undefined/);
  assert.doesNotMatch(
    decodeURIComponent(
      buildGrowthApplicationWhatsAppUrl(incompleteAtRuntime).split("?text=")[1]!,
    ),
    /undefined/,
  );
});
