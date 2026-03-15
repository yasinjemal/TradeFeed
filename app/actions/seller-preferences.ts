// ============================================================
// Server Action — Seller AI Preferences
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import { upsertSellerPreferences, getSellerPreferences } from "@/lib/db/seller-preferences";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const sellerPreferencesSchema = z.object({
  brandTone: z.string().trim().max(50).optional().or(z.literal("")),
  brandDescription: z.string().trim().max(500).optional().or(z.literal("")),
  defaultCategory: z.string().trim().max(100).optional().or(z.literal("")),
  preferredTags: z.string().trim().max(500).optional().or(z.literal("")), // comma-separated
  priceRange: z.string().trim().max(50).optional().or(z.literal("")),
  targetAudience: z.string().trim().max(200).optional().or(z.literal("")),
  languagePreference: z.string().trim().max(10).optional().or(z.literal("")),
  aiToneNotes: z.string().trim().max(500).optional().or(z.literal("")),
  autoReplyEnabled: z.string().optional(),
});

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function updateSellerPreferencesAction(
  shopSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Access denied." };
    }

    if (access.role !== "OWNER" && access.role !== "MANAGER") {
      return { success: false, error: "You don't have permission to update AI preferences." };
    }

    const rawInput = {
      brandTone: formData.get("brandTone") as string,
      brandDescription: formData.get("brandDescription") as string,
      defaultCategory: formData.get("defaultCategory") as string,
      preferredTags: formData.get("preferredTags") as string,
      priceRange: formData.get("priceRange") as string,
      targetAudience: formData.get("targetAudience") as string,
      languagePreference: formData.get("languagePreference") as string,
      aiToneNotes: formData.get("aiToneNotes") as string,
      autoReplyEnabled: formData.get("autoReplyEnabled") as string,
    };

    const parsed = sellerPreferencesSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: "Please fix the errors below." };
    }

    // Convert comma-separated tags string to array
    const tagsArray = parsed.data.preferredTags
      ? parsed.data.preferredTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    await upsertSellerPreferences(access.shopId, {
      brandTone: parsed.data.brandTone || null,
      brandDescription: parsed.data.brandDescription || null,
      defaultCategory: parsed.data.defaultCategory || null,
      preferredTags: tagsArray,
      priceRange: parsed.data.priceRange || null,
      targetAudience: parsed.data.targetAudience || null,
      languagePreference: parsed.data.languagePreference || "en",
      aiToneNotes: parsed.data.aiToneNotes || null,
      autoReplyEnabled: parsed.data.autoReplyEnabled === "on",
    });

    revalidatePath(`/dashboard/${shopSlug}/settings`);
    return { success: true };
  } catch (error) {
    console.error("[updateSellerPreferencesAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function getSellerPreferencesAction(shopSlug: string) {
  const access = await requireShopAccess(shopSlug);
  if (!access) return null;
  return getSellerPreferences(access.shopId);
}
