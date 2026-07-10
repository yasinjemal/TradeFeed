import { z } from "zod";

export const BUYER_LANGUAGES = ["en", "zu", "xh", "af", "st"] as const;
export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const buyerProfileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(80, "Use 80 characters or fewer."),
  language: z.enum(BUYER_LANGUAGES),
});

export const buyerAddressSchema = z.object({
  label: z.string().trim().min(1, "Add a label.").max(30, "Use 30 characters or fewer."),
  recipientName: z.string().trim().min(2, "Enter the recipient’s name.").max(100),
  phone: optionalText(20).refine(
    (value) => !value || /^(?:\+27|0)\d{9}$/.test(value.replace(/[\s\-()]/g, "")),
    "Enter a valid South African phone number.",
  ),
  addressLine1: z.string().trim().min(4, "Enter a complete street address.").max(160),
  addressLine2: optionalText(100),
  city: z.string().trim().min(2, "Enter a city or town.").max(80),
  province: z.enum(SA_PROVINCES),
  postalCode: z.string().trim().regex(/^\d{4}$/, "Enter a 4-digit South African postal code."),
  deliveryInstructions: optionalText(250),
  isDefault: z.boolean().default(false),
});

export type BuyerAddressInput = z.infer<typeof buyerAddressSchema>;
