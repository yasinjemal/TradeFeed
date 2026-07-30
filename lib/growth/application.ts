export const TRADEFEED_GROWTH_WHATSAPP_NUMBER = "27835034502" as const;

export interface GrowthApplicationInput {
  businessName: string;
  ownerName: string;
  applicantWhatsApp: string;
  productType: string;
  productCount: string;
  salesChannel: string;
  photoReadiness: string;
  serviceInterest: string;
  launchTimeline: string;
  challenge: string;
}

export const GROWTH_APPLICATION_FIELD_LIMITS = {
  businessName: 120,
  ownerName: 100,
  applicantWhatsApp: 40,
  productType: 180,
  productCount: 80,
  salesChannel: 180,
  photoReadiness: 120,
  serviceInterest: 120,
  launchTimeline: 120,
  challenge: 500,
} as const satisfies Record<keyof GrowthApplicationInput, number>;

const EMPTY_VALUE_LABEL = "Not provided";

function normalizeField(value: string, maxLength: number): string {
  const normalized =
    typeof value === "string" ? value.trim().replace(/\s+/gu, " ") : "";

  return Array.from(normalized).slice(0, maxLength).join("").trim();
}

export function normalizeGrowthApplication(
  input: GrowthApplicationInput,
): GrowthApplicationInput {
  return {
    businessName: normalizeField(
      input.businessName,
      GROWTH_APPLICATION_FIELD_LIMITS.businessName,
    ),
    ownerName: normalizeField(
      input.ownerName,
      GROWTH_APPLICATION_FIELD_LIMITS.ownerName,
    ),
    applicantWhatsApp: normalizeField(
      input.applicantWhatsApp,
      GROWTH_APPLICATION_FIELD_LIMITS.applicantWhatsApp,
    ),
    productType: normalizeField(
      input.productType,
      GROWTH_APPLICATION_FIELD_LIMITS.productType,
    ),
    productCount: normalizeField(
      input.productCount,
      GROWTH_APPLICATION_FIELD_LIMITS.productCount,
    ),
    salesChannel: normalizeField(
      input.salesChannel,
      GROWTH_APPLICATION_FIELD_LIMITS.salesChannel,
    ),
    photoReadiness: normalizeField(
      input.photoReadiness,
      GROWTH_APPLICATION_FIELD_LIMITS.photoReadiness,
    ),
    serviceInterest: normalizeField(
      input.serviceInterest,
      GROWTH_APPLICATION_FIELD_LIMITS.serviceInterest,
    ),
    launchTimeline: normalizeField(
      input.launchTimeline,
      GROWTH_APPLICATION_FIELD_LIMITS.launchTimeline,
    ),
    challenge: normalizeField(
      input.challenge,
      GROWTH_APPLICATION_FIELD_LIMITS.challenge,
    ),
  };
}

function displayValue(value: string): string {
  return value || EMPTY_VALUE_LABEL;
}

export function buildGrowthApplicationMessage(
  input: GrowthApplicationInput,
): string {
  const application = normalizeGrowthApplication(input);

  return [
    "Hi TradeFeed Growth, I would like to apply.",
    "",
    `Business name: ${displayValue(application.businessName)}`,
    `Owner name: ${displayValue(application.ownerName)}`,
    `Applicant WhatsApp: ${displayValue(application.applicantWhatsApp)}`,
    `Products sold: ${displayValue(application.productType)}`,
    `Approximate product count: ${displayValue(application.productCount)}`,
    `Current sales channel: ${displayValue(application.salesChannel)}`,
    `Product photo readiness: ${displayValue(application.photoReadiness)}`,
    `Service interest: ${displayValue(application.serviceInterest)}`,
    `Preferred launch timeline: ${displayValue(application.launchTimeline)}`,
    `Biggest challenge: ${displayValue(application.challenge)}`,
  ].join("\n");
}

export function buildGrowthApplicationWhatsAppUrl(
  input: GrowthApplicationInput,
): string {
  const message = buildGrowthApplicationMessage(input);

  return `https://wa.me/${TRADEFEED_GROWTH_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
