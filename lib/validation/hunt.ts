import { z } from "zod";

export const HUNT_MAX_IMAGE_BYTES = 850_000;
export const HUNT_LIFETIME_HOURS = 24;
export const HUNT_PRIVATE_RETENTION_DAYS = 180;

export const HUNT_PILOT_CITY = "Johannesburg";
export const HUNT_PILOT_PROVINCE = "Gauteng";

export const huntMatchPreferenceSchema = z.enum([
  "EXACT_ONLY",
  "SIMILAR_OK",
]);

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

export type HuntCreateFields = z.infer<typeof huntCreateFieldsSchema>;
export type HuntMatchPreferenceInput = z.infer<
  typeof huntMatchPreferenceSchema
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
