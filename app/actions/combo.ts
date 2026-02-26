// ============================================================
// Server Actions — Combo CRUD
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import {
  createComboCategory,
  deleteComboCategory,
  createCombo,
  updateCombo,
  deleteCombo,
  addComboImage,
  deleteComboImage,
} from "@/lib/db/combos";
import {
  comboCategoryCreateSchema,
  comboCreateSchema,
  comboUpdateSchema,
} from "@/lib/validation/combo";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

function extractFieldErrors(
  issues: { path: PropertyKey[]; message: string }[]
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const field = issue.path[0]?.toString() ?? "unknown";
    if (!fieldErrors[field]) fieldErrors[field] = [];
    fieldErrors[field].push(issue.message);
  }
  return fieldErrors;
}

// ── Combo Categories ────────────────────────────────────────

export async function createComboCategoryAction(
  shopSlug: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const raw = { name: formData.get("name") as string };
    const parsed = comboCategoryCreateSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, fieldErrors: extractFieldErrors(parsed.error.issues) };
    }

    await createComboCategory(access.shopId, parsed.data.name);
    revalidatePath(`/dashboard/${shopSlug}/combos`);
    return { success: true };
  } catch (error) {
    console.error("[createComboCategory]", error);
    return { success: false, error: "Failed to create combo category." };
  }
}

export async function deleteComboCategoryAction(
  shopSlug: string,
  categoryId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const result = await deleteComboCategory(categoryId, access.shopId);
    if (!result) return { success: false, error: "Category not found." };

    revalidatePath(`/dashboard/${shopSlug}/combos`);
    return { success: true };
  } catch (error) {
    console.error("[deleteComboCategory]", error);
    return { success: false, error: "Failed to delete combo category." };
  }
}

// ── Combos ──────────────────────────────────────────────────

export async function createComboAction(
  shopSlug: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const parsed = comboCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, fieldErrors: extractFieldErrors(parsed.error.issues) };
    }

    const combo = await createCombo(parsed.data, access.shopId);
    revalidatePath(`/dashboard/${shopSlug}/combos`);
    revalidatePath(`/catalog/${shopSlug}`);
    return { success: true, data: { id: combo.id } };
  } catch (error) {
    console.error("[createCombo]", error);
    return { success: false, error: "Failed to create combo." };
  }
}

export async function updateComboAction(
  shopSlug: string,
  comboId: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const parsed = comboUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, fieldErrors: extractFieldErrors(parsed.error.issues) };
    }

    const combo = await updateCombo(comboId, access.shopId, parsed.data);
    if (!combo) return { success: false, error: "Combo not found." };

    revalidatePath(`/dashboard/${shopSlug}/combos`);
    revalidatePath(`/catalog/${shopSlug}`);
    return { success: true };
  } catch (error) {
    console.error("[updateCombo]", error);
    return { success: false, error: "Failed to update combo." };
  }
}

export async function deleteComboAction(
  shopSlug: string,
  comboId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const combo = await deleteCombo(comboId, access.shopId);
    if (!combo) return { success: false, error: "Combo not found." };

    // Cleanup images from Uploadthing
    const keysToDelete = combo.images
      .map((img) => img.key)
      .filter((k): k is string => !!k);
    if (keysToDelete.length > 0) {
      try {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        await utapi.deleteFiles(keysToDelete);
      } catch (e) {
        console.error("[deleteCombo] Image cleanup failed:", e);
      }
    }

    revalidatePath(`/dashboard/${shopSlug}/combos`);
    revalidatePath(`/catalog/${shopSlug}`);
    return { success: true };
  } catch (error) {
    console.error("[deleteCombo]", error);
    return { success: false, error: "Failed to delete combo." };
  }
}

export async function addComboImageAction(
  shopSlug: string,
  comboId: string,
  url: string,
  key?: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const image = await addComboImage(comboId, access.shopId, url, key);
    if (!image) return { success: false, error: "Combo not found." };

    revalidatePath(`/dashboard/${shopSlug}/combos`);
    return { success: true };
  } catch (error) {
    console.error("[addComboImage]", error);
    return { success: false, error: "Failed to add image." };
  }
}

export async function deleteComboImageAction(
  shopSlug: string,
  comboId: string,
  imageId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const image = await deleteComboImage(imageId, comboId, access.shopId);
    if (!image) return { success: false, error: "Image not found." };

    // Cleanup from Uploadthing
    if (image.key) {
      try {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        await utapi.deleteFiles([image.key]);
      } catch (e) {
        console.error("[deleteComboImage] Cleanup failed:", e);
      }
    }

    revalidatePath(`/dashboard/${shopSlug}/combos`);
    return { success: true };
  } catch (error) {
    console.error("[deleteComboImage]", error);
    return { success: false, error: "Failed to delete image." };
  }
}
