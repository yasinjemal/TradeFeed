// ============================================================
// Server Action — Shop Settings / Profile Update
// ============================================================

"use server";

import { shopSettingsSchema } from "@/lib/validation/shop-settings";
import { updateShopSettings, getShopBySlug } from "@/lib/db/shops";
import { requireShopAccess } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Update shop settings/profile.
 *
 * AUTH: Requires OWNER or MANAGER role.
 * MULTI-TENANT: shopSlug resolves to shopId via requireShopAccess.
 */
export async function updateShopSettingsAction(
  shopSlug: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // 1. Verify access
    const access = await requireShopAccess(shopSlug);
    if (!access) {
      return { success: false, error: "Access denied." };
    }

    // Only OWNER and MANAGER can update settings
    if (access.role !== "OWNER" && access.role !== "MANAGER") {
      return { success: false, error: "You don't have permission to update settings." };
    }

    const shop = await getShopBySlug(shopSlug);
    if (!shop) {
      return { success: false, error: "Shop not found." };
    }

    // 2. Extract form data
    const rawInput = {
      name: (formData.get("name") as string) || undefined,
      description: formData.get("description") as string,
      aboutText: formData.get("aboutText") as string,
      whatsappNumber: formData.get("whatsappNumber") as string,
      retailWhatsappNumber: formData.get("retailWhatsappNumber") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      province: formData.get("province") as string,
      latitude: formData.get("latitude") as string,
      longitude: formData.get("longitude") as string,
      businessHours: formData.get("businessHours") as string,
      instagram: formData.get("instagram") as string,
      facebook: formData.get("facebook") as string,
      tiktok: formData.get("tiktok") as string,
      website: formData.get("website") as string,
      whatsappGroupLink: formData.get("whatsappGroupLink") as string,
    };

    // 3. Validate
    const parsed = shopSettingsSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "unknown";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      }
      return { success: false, error: "Please fix the errors below.", fieldErrors };
    }

    // 4. Update
    await updateShopSettings(shop.id, parsed.data);

    // 5. Revalidate pages
    revalidatePath(`/dashboard/${shopSlug}`);
    revalidatePath(`/dashboard/${shopSlug}/settings`);
    revalidatePath(`/catalog/${shopSlug}`);

    return { success: true };
  } catch (error: unknown) {
    console.error("[updateShopSettingsAction] Error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
