import { z } from "zod";

export const HUNT_MAX_IMAGE_BYTES = 850_000;
export const HUNT_LIFETIME_HOURS = 24;
export const HUNT_PRIVATE_RETENTION_DAYS = 180;

export const HUNT_PILOT_CITY = "Johannesburg";
export const HUNT_PILOT_PROVINCE = "Gauteng";

const PUBLIC_CONTACT_OR_MARKUP =
  /<[^>]*>|https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|@[a-z0-9_.]{2,}|(?:[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\.)+[a-z]{2,24}\b/i;
const PUBLIC_SOUTH_AFRICAN_PHONE =
  /(?:\+?\s*27[\s./()\-]*|0)(?:\d[\s./()\-]*){9}(?!\d)|(?:^|[^\d])(?:[678]\d)(?:[\s./()\-]*\d){7}(?!\d)/i;

export function isHuntPublicTextSafe(value: string): boolean {
  return (
    !PUBLIC_CONTACT_OR_MARKUP.test(value) &&
    !PUBLIC_SOUTH_AFRICAN_PHONE.test(value)
  );
}

export const huntMatchPreferenceSchema = z.enum([
  "EXACT_ONLY",
  "SIMILAR_OK",
]);

export const huntOfferMatchTypeSchema = z.enum([
  "EXACT",
  "SIMILAR",
  "UNCERTAIN",
]);

export const huntSellerRouteStatusSchema = z.enum([
  "ROUTED",
  "CONTACTED",
  "RESPONDED",
  "DECLINED",
  "CANCELLED",
]);

export const huntReportReasonSchema = z.enum([
  "SCAM_OR_FRAUD",
  "PROHIBITED_ITEM",
  "COPYRIGHT_OR_TRADEMARK",
  "PRIVACY",
  "MISLEADING",
  "SPAM",
  "OTHER",
]);

const huntIdSchema = z
  .string()
  .trim()
  .min(1, "Hunt ID is required")
  .max(64, "Invalid Hunt ID");

const shopIdSchema = z
  .string()
  .trim()
  .min(1, "Shop ID is required")
  .max(64, "Invalid shop ID");

const offerIdSchema = z
  .string()
  .trim()
  .min(1, "Offer ID is required")
  .max(64, "Invalid offer ID");

const optionalTrimmedText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .optional()
    .transform((value) => value || undefined);

const optionalPublicOfferText = (maximum: number, lengthMessage: string) =>
  z
    .string()
    .trim()
    .max(maximum, lengthMessage)
    .refine(isHuntPublicTextSafe, {
      message: "Do not include contact details, handles, links or markup",
    })
    .optional()
    .transform((value) => value || undefined);

const budgetStringSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(?:\.\d{1,2})?$/, "Enter a budget between R1 and R999,999")
  .transform((value) => Math.round(Number(value) * 100))
  .refine((value) => value >= 100 && value <= 99_999_900, {
    message: "Enter a budget between R1 and R999,999",
  });

export const huntCreateFieldsSchema = z.object({
  requestText: z
    .string()
    .trim()
    .min(3, "Tell us what must match")
    .max(500, "Keep the request under 500 characters"),
  desiredVariant: z
    .string()
    .trim()
    .max(80, "Keep the size or variant under 80 characters")
    .refine(isHuntPublicTextSafe, {
      message: "Do not include contact details or links in the public variant",
    })
    .optional()
    .transform((value) => value || undefined),
  city: z.literal(HUNT_PILOT_CITY),
  maxBudgetCents: budgetStringSchema,
  matchPreference: huntMatchPreferenceSchema,
  buyerName: z
    .string()
    .trim()
    .max(80, "Keep the name under 80 characters")
    .optional()
    .transform((value) => value || undefined),
  phone: z.string().trim().min(1, "WhatsApp number is required"),
  publicImageConsent: z.literal(true, {
    error: "Confirm that this cropped image may appear on the public Hunt page",
  }),
  huntUpdatesConsent: z.literal(true, {
    error: "Consent is required so TradeFeed can contact you about this Hunt",
  }),
  termsAccepted: z.literal(true, {
    error: "Accept the HUNT pilot terms to continue",
  }),
});

const offerPriceStringSchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(?:\.\d{1,2})?$/, "Enter a price between R1 and R999,999")
  .transform((value) => Math.round(Number(value) * 100))
  .refine((value) => value >= 100 && value <= 99_999_900, {
    message: "Enter a price between R1 and R999,999",
  });

const optionalPositiveIntegerSchema = z.preprocess(
  (value) => {
    if (value === "" || value == null) return undefined;
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return Number(value);
    }
    return value;
  },
  z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(100_000, "Quantity is too large")
    .optional(),
);

const disabledPublicProofSchema = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.undefined({
    error:
      "Public proof media is disabled during Beta until dedicated consent and deletion controls are available",
  }),
);

/**
 * Strict admin input for a publishable offer. Seller identity, verification
 * and WhatsApp snapshots are intentionally absent: the persistence layer
 * derives those values from the selected Shop.
 */
export const huntAdminOfferSchema = z
  .object({
    huntId: huntIdSchema,
    shopId: shopIdSchema,
    matchType: huntOfferMatchTypeSchema,
    publicProductName: z
      .string()
      .trim()
      .min(2, "Product name is required")
      .max(140, "Keep the product name under 140 characters")
      .refine(isHuntPublicTextSafe, {
        message:
          "Do not include contact details, handles, links or markup in the product name",
      }),
    publicDescription: optionalPublicOfferText(
      500,
      "Keep the offer description under 500 characters",
    ),
    publicVariant: optionalPublicOfferText(
      120,
      "Keep the offered variant under 120 characters",
    ),
    publicDeliveryEstimate: z
      .string()
      .trim()
      .min(2, "Delivery or collection estimate is required")
      .max(160, "Keep delivery details under 160 characters")
      .refine(isHuntPublicTextSafe, {
        message:
          "Do not include contact details, handles, links or markup in delivery details",
      }),
    publicProofUrl: disabledPublicProofSchema,
    publicProofCapturedAt: disabledPublicProofSchema,
    priceCents: offerPriceStringSchema,
    quantityAvailable: optionalPositiveIntegerSchema,
  })
  .strict();

export const huntAdminRouteSchema = z
  .object({
    huntId: huntIdSchema,
    shopId: shopIdSchema,
    note: optionalTrimmedText(500, "Keep the routing note under 500 characters"),
  })
  .strict();

export const huntAdminRouteStatusSchema = z
  .object({
    routeId: z
      .string()
      .trim()
      .min(1, "Route ID is required")
      .max(64, "Invalid route ID"),
    status: huntSellerRouteStatusSchema,
  })
  .strict();

export const huntAdminSelectOfferSchema = z
  .object({
    huntId: huntIdSchema,
    offerId: offerIdSchema,
  })
  .strict();

export const huntOwnerSelectOfferSchema = z
  .object({
    huntSlug: z
      .string()
      .trim()
      .min(8, "Invalid Hunt link")
      .max(180, "Invalid Hunt link"),
    offerId: offerIdSchema,
  })
  .strict();

export const huntAdminCloseSchema = z
  .object({
    huntId: huntIdSchema,
    reason: optionalTrimmedText(500, "Keep the reason under 500 characters"),
  })
  .strict();

export const huntAdminTakedownSchema = z
  .object({
    huntId: huntIdSchema,
    reportId: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .optional()
      .transform((value) => value || undefined),
    reason: z
      .string()
      .trim()
      .min(3, "A takedown reason is required")
      .max(500, "Keep the takedown reason under 500 characters"),
  })
  .strict();

export const huntAdminWithdrawOfferSchema = z
  .object({
    offerId: offerIdSchema,
    reason: z
      .string()
      .trim()
      .min(3, "A withdrawal reason is required")
      .max(500, "Keep the withdrawal reason under 500 characters"),
  })
  .strict();

export const huntAdminDismissReportSchema = z
  .object({
    reportId: z
      .string()
      .trim()
      .min(1, "Report ID is required")
      .max(64, "Invalid report ID"),
    resolutionNote: z
      .string()
      .trim()
      .min(3, "A resolution note is required")
      .max(500, "Keep the resolution note under 500 characters"),
  })
  .strict();

export const huntReportSchema = z
  .object({
    huntSlug: z
      .string()
      .trim()
      .min(8, "Invalid Hunt link")
      .max(180, "Invalid Hunt link"),
    reason: huntReportReasonSchema,
    details: optionalTrimmedText(
      1_000,
      "Keep report details under 1,000 characters",
    ),
  })
  .strict();

export const huntSellerPreferenceSchema = z
  .object({
    shopId: shopIdSchema,
    isOptedIn: z.boolean(),
    cities: z
      .array(
        z
          .string()
          .trim()
          .min(2, "Invalid city")
          .max(80, "City is too long"),
      )
      .max(20, "Choose no more than 20 cities"),
    categories: z
      .array(
        z
          .string()
          .trim()
          .min(2, "Invalid category")
          .max(80, "Category is too long"),
      )
      .max(30, "Choose no more than 30 categories"),
  })
  .strict();

export type HuntCreateFields = z.infer<typeof huntCreateFieldsSchema>;
export type HuntMatchPreferenceInput = z.infer<
  typeof huntMatchPreferenceSchema
>;
export type HuntAdminOfferFields = z.infer<typeof huntAdminOfferSchema>;
export type HuntAdminRouteFields = z.infer<typeof huntAdminRouteSchema>;
export type HuntAdminRouteStatusFields = z.infer<
  typeof huntAdminRouteStatusSchema
>;
export type HuntAdminSelectOfferFields = z.infer<
  typeof huntAdminSelectOfferSchema
>;
export type HuntOwnerSelectOfferFields = z.infer<
  typeof huntOwnerSelectOfferSchema
>;
export type HuntAdminCloseFields = z.infer<typeof huntAdminCloseSchema>;
export type HuntAdminTakedownFields = z.infer<
  typeof huntAdminTakedownSchema
>;
export type HuntAdminWithdrawOfferFields = z.infer<
  typeof huntAdminWithdrawOfferSchema
>;
export type HuntAdminDismissReportFields = z.infer<
  typeof huntAdminDismissReportSchema
>;
export type HuntReportFields = z.infer<typeof huntReportSchema>;
export type HuntSellerPreferenceFields = z.infer<
  typeof huntSellerPreferenceSchema
>;

export type HuntImageMime =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

/**
 * Detect the real image type from its bytes. Browser-provided MIME types are
 * untrusted, so the HUNT action requires both to agree.
 */
export function detectHuntImageMime(bytes: Uint8Array): HuntImageMime | null {
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  if (isJpeg) return "image/jpeg";

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isPng =
    bytes.length >= pngSignature.length &&
    pngSignature.every((byte, index) => bytes[index] === byte);
  if (isPng) return "image/png";

  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (isWebp) return "image/webp";

  return null;
}

export function imageExtensionForMime(mime: HuntImageMime): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function formCheckbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export function formatHuntBudget(cents: number | null): string | null {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
