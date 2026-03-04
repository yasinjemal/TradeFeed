// ============================================================
// Server Actions — Stock Drop CRUD
// ============================================================

"use server";

import { requireShopAccess } from "@/lib/auth";
import {
  createDrop,
  updateDrop,
  deleteDrop,
  publishDrop,
  archiveDrop,
} from "@/lib/db/drops";
import {
  dropCreateSchema,
  dropUpdateSchema,
} from "@/lib/validation/drop";
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

// ── Create Drop ─────────────────────────────────────────────

export async function createDropAction(
  shopSlug: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const parsed = dropCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, fieldErrors: extractFieldErrors(parsed.error.issues) };
    }

    const drop = await createDrop(parsed.data, access.shopId);
    revalidatePath(`/dashboard/${shopSlug}/drops`);
    return { success: true, data: { id: drop.id } };
  } catch (error) {
    console.error("[createDrop]", error);
    return { success: false, error: "Failed to create stock drop." };
  }
}

// ── Update Drop ─────────────────────────────────────────────

export async function updateDropAction(
  shopSlug: string,
  dropId: string,
  data: Record<string, unknown>
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const parsed = dropUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, fieldErrors: extractFieldErrors(parsed.error.issues) };
    }

    const result = await updateDrop(dropId, access.shopId, parsed.data);
    if (!result) return { success: false, error: "Drop not found." };

    revalidatePath(`/dashboard/${shopSlug}/drops`);
    revalidatePath(`/catalog/${shopSlug}/drops/${dropId}`);
    return { success: true };
  } catch (error) {
    console.error("[updateDrop]", error);
    return { success: false, error: "Failed to update stock drop." };
  }
}

// ── Publish Drop ────────────────────────────────────────────

export async function publishDropAction(
  shopSlug: string,
  dropId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const result = await publishDrop(dropId, access.shopId);
    if (!result) return { success: false, error: "Drop not found or already published." };

    revalidatePath(`/dashboard/${shopSlug}/drops`);
    revalidatePath(`/catalog/${shopSlug}/drops/${dropId}`);
    return { success: true, data: { id: result.id } };
  } catch (error) {
    console.error("[publishDrop]", error);
    return { success: false, error: "Failed to publish stock drop." };
  }
}

// ── Archive Drop ────────────────────────────────────────────

export async function archiveDropAction(
  shopSlug: string,
  dropId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const result = await archiveDrop(dropId, access.shopId);
    if (!result) return { success: false, error: "Drop not found." };

    revalidatePath(`/dashboard/${shopSlug}/drops`);
    return { success: true };
  } catch (error) {
    console.error("[archiveDrop]", error);
    return { success: false, error: "Failed to archive stock drop." };
  }
}

// ── Delete Drop ─────────────────────────────────────────────

export async function deleteDropAction(
  shopSlug: string,
  dropId: string
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    const result = await deleteDrop(dropId, access.shopId);
    if (!result) return { success: false, error: "Drop not found." };

    revalidatePath(`/dashboard/${shopSlug}/drops`);
    return { success: true };
  } catch (error) {
    console.error("[deleteDrop]", error);
    return { success: false, error: "Failed to delete stock drop." };
  }
}
