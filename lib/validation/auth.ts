import { z } from "zod";

/**
 * SA phone number regex: +27 followed by 9 digits, or 0 followed by 9 digits.
 * Strips spaces, dashes, and parens before matching.
 */
const saPhoneRegex = /^(\+27|0)\d{9}$/;

function stripWhitespace(val: string): string {
  return val.replace(/[\s\-()]/g, "");
}

/**
 * Normalize a SA phone number to E.164 format: +27XXXXXXXXX.
 * Accepts "07X…", "+2782…", or "2782…" input.
 */
export function normalizeToE164(phone: string): string {
  const cleaned = stripWhitespace(phone);
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0")) return `+27${cleaned.slice(1)}`;
  if (cleaned.startsWith("27")) return `+${cleaned}`;
  return `+${cleaned}`;
}

export const whatsappLoginSchema = z.object({
  phoneNumber: z.preprocess(
    (val) => (typeof val === "string" ? stripWhitespace(val) : val),
    z
      .string()
      .min(1, "Phone number is required")
      .regex(saPhoneRegex, "Enter a valid SA phone number (e.g. 0821234567 or +27821234567)")
  ),
});

export type WhatsappLoginInput = z.infer<typeof whatsappLoginSchema>;
