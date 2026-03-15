"use server";

import { z } from "zod";
import {
  registerWholesaleBuyer,
  getWholesaleBuyerByPhone,
  getWholesaleBuyers,
  approveWholesaleBuyer,
  rejectWholesaleBuyer,
} from "@/lib/db/wholesale";
import { revalidatePath } from "next/cache";

// ── Validation ─────────────────────────────────────────

const phoneRegex = /^\+?\d{10,15}$/;

const wholesaleRegisterSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid phone number (e.g. +27612345678)"),
  businessName: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(200, "Business name too long"),
  contactName: z
    .string()
    .trim()
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name too long"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  vatNumber: z
    .string()
    .trim()
    .max(20, "VAT number too long")
    .optional()
    .or(z.literal("")),
  registrationNumber: z
    .string()
    .trim()
    .max(30, "Registration number too long")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),
  province: z
    .string()
    .trim()
    .max(100)
    .optional()
    .or(z.literal("")),
});

// ── Types ──────────────────────────────────────────────

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ── Register Wholesale Buyer ───────────────────────────

export async function registerWholesaleBuyerAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawInput = {
    phone: (formData.get("phone") as string) ?? "",
    businessName: (formData.get("businessName") as string) ?? "",
    contactName: (formData.get("contactName") as string) ?? "",
    email: (formData.get("email") as string) || "",
    vatNumber: (formData.get("vatNumber") as string) || "",
    registrationNumber: (formData.get("registrationNumber") as string) || "",
    city: (formData.get("city") as string) || "",
    province: (formData.get("province") as string) || "",
  };

  const parsed = wholesaleRegisterSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "form";
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return { success: false, error: "Please fix the errors below.", fieldErrors };
  }

  const result = await registerWholesaleBuyer(parsed.data);

  if ("alreadyExists" in result) {
    if (result.status === "VERIFIED") {
      return { success: false, error: "This phone number is already verified as a wholesale buyer." };
    }
    if (result.status === "PENDING") {
      return { success: false, error: "An application with this phone number is already pending review." };
    }
    return { success: false, error: "This phone number has a previous application. Contact support for assistance." };
  }

  return { success: true };
}

// ── Check Wholesale Status ─────────────────────────────

export async function checkWholesaleStatusAction(
  phone: string
): Promise<{
  found: boolean;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  businessName?: string;
  rejectedReason?: string | null;
}> {
  if (!phone || !phoneRegex.test(phone.trim())) {
    return { found: false };
  }

  const buyer = await getWholesaleBuyerByPhone(phone.trim());
  if (!buyer) return { found: false };

  return {
    found: true,
    status: buyer.status,
    businessName: buyer.businessName,
    rejectedReason: buyer.rejectedReason,
  };
}

// ── Admin: List Buyers ─────────────────────────────────

export async function getWholesaleBuyersAction(filter?: {
  status?: "PENDING" | "VERIFIED" | "REJECTED";
  page?: number;
}) {
  return getWholesaleBuyers(filter);
}

// ── Admin: Approve ─────────────────────────────────────

export async function approveWholesaleBuyerAction(buyerId: string): Promise<ActionResult> {
  await approveWholesaleBuyer(buyerId);
  revalidatePath("/admin/wholesale");
  return { success: true };
}

// ── Admin: Reject ──────────────────────────────────────

export async function rejectWholesaleBuyerAction(
  buyerId: string,
  reason: string
): Promise<ActionResult> {
  if (!reason.trim()) {
    return { success: false, error: "Rejection reason is required." };
  }
  await rejectWholesaleBuyer(buyerId, reason.trim());
  revalidatePath("/admin/wholesale");
  return { success: true };
}
