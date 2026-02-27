// ============================================================
// Zod Validation — Shop Settings / Profile Update
// ============================================================

import { z } from "zod";

/**
 * SA Province enum for dropdown.
 */
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

/**
 * Days of the week for business hours.
 */
export const DAYS_OF_WEEK = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type DayKey = (typeof DAYS_OF_WEEK)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/**
 * Business hours type: { mon: "08:00-17:00", tue: "closed", ... }
 */
export type BusinessHours = Partial<Record<DayKey, string>>;

/**
 * Schema for updating a shop's profile settings.
 * All fields optional — partial update.
 */
export const shopSettingsSchema = z.object({
  // Basic info
  name: z
    .string()
    .trim()
    .min(2, "Shop name must be at least 2 characters")
    .max(100, "Shop name too long")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description too long")
    .optional()
    .or(z.literal("")),

  aboutText: z
    .string()
    .trim()
    .max(2000, "About text too long")
    .optional()
    .or(z.literal("")),

  // WhatsApp numbers
  whatsappNumber: z
    .string()
    .trim()
    .max(20, "Number too long")
    .optional()
    .or(z.literal("")),

  retailWhatsappNumber: z
    .string()
    .trim()
    .max(20, "Number too long")
    .optional()
    .or(z.literal("")),

  // Location
  address: z
    .string()
    .trim()
    .max(300, "Address too long")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .max(100, "City name too long")
    .optional()
    .or(z.literal("")),

  province: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),

  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .optional()
    .or(z.literal("").transform(() => undefined)),

  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .optional()
    .or(z.literal("").transform(() => undefined)),

  // Business hours (JSON string)
  businessHours: z
    .string()
    .optional()
    .or(z.literal("")),

  // Social links
  instagram: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),

  facebook: z
    .string()
    .trim()
    .max(200)
    .optional()
    .or(z.literal("")),

  tiktok: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),

  whatsappGroupLink: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
});

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
