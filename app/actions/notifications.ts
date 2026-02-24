// ============================================================
// Server Actions — Notification Preferences
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireShopAccess } from "@/lib/auth";
import { updateNotificationPrefs } from "@/lib/db/notifications";

type ActionResult = {
  success: boolean;
  error?: string;
};

const notificationPrefsSchema = z.object({
  orderNotifications: z.boolean(),
  lowStockAlerts: z.boolean(),
  reviewNotifications: z.boolean(),
  lowStockThreshold: z.number().int().min(0).max(9999),
  notificationEmail: z.string().email().optional().or(z.literal("")),
});

export async function updateNotificationPrefsAction(
  shopSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const rawInput = {
      orderNotifications: formData.get("orderNotifications") === "on",
      lowStockAlerts: formData.get("lowStockAlerts") === "on",
      reviewNotifications: formData.get("reviewNotifications") === "on",
      lowStockThreshold: parseInt(formData.get("lowStockThreshold") as string, 10) || 5,
      notificationEmail: (formData.get("notificationEmail") as string) || "",
    };

    const parsed = notificationPrefsSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: "Invalid settings." };
    }

    await updateNotificationPrefs(access.shopId, parsed.data);
    revalidatePath(`/dashboard/${shopSlug}/notifications`);

    return { success: true };
  } catch (error) {
    console.error("[updateNotificationPrefsAction] Error:", error);
    return { success: false, error: "Failed to update settings." };
  }
}
