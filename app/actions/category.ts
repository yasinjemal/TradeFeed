// ============================================================
// Server Actions — Category CRUD
// ============================================================
// All actions require shop access (auth + ownership).
// Used by the category management page in the dashboard.
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/db/categories";
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from "@/lib/validation/category";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createCategoryAction(
  shopSlug: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const raw = { name: formData.get("name") as string };
    const parsed = categoryCreateSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "name");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    await createCategory(access.shopId, parsed.data.name);
    revalidatePath(`/dashboard/${shopSlug}/categories`);
    return { success: true };
  } catch (error) {
    console.error("[createCategory]", error);
    return { success: false, error: "Failed to create category." };
  }
}

export async function updateCategoryAction(
  shopSlug: string,
  categoryId: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const raw = { name: formData.get("name") as string };
    const parsed = categoryUpdateSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "name");
        if (!fieldErrors[key]) fieldErrors[key] = [];
        fieldErrors[key].push(issue.message);
      }
      return { success: false, fieldErrors };
    }

    await updateCategory(categoryId, access.shopId, parsed.data.name);
    revalidatePath(`/dashboard/${shopSlug}/categories`);
    return { success: true };
  } catch (error) {
    console.error("[updateCategory]", error);
    return { success: false, error: "Failed to update category." };
  }
}

export async function deleteCategoryAction(
  shopSlug: string,
  categoryId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const result = await deleteCategory(categoryId, access.shopId);
    if (!result) return { success: false, error: "Category not found." };

    revalidatePath(`/dashboard/${shopSlug}/categories`);
    revalidatePath(`/dashboard/${shopSlug}/products`);
    return { success: true };
  } catch (error) {
    console.error("[deleteCategory]", error);
    return { success: false, error: "Failed to delete category." };
  }
}
