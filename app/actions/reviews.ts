// ============================================================
// Server Actions — Reviews
// ============================================================
// Buyer: Submit reviews (no auth required — like orders)
// Seller: Approve/delete reviews (requires shop access)
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireShopAccess } from "@/lib/auth";
import { createReview, deleteReview } from "@/lib/db/reviews";
import { notifyNewReview } from "@/lib/notifications";
import { reportError } from "@/lib/telemetry";
import { db } from "@/lib/db";

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ── Validation ──────────────────────────────────────────────

const submitReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  title: z.string().trim().max(200, "Title too long").optional().or(z.literal("")),
  comment: z.string().trim().max(2000, "Review too long").optional().or(z.literal("")),
  buyerName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  buyerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

// ── Submit Review (Buyer — no auth) ─────────────────────────

export async function submitReviewAction(
  shopId: string,
  productId: string,
  shopSlug: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const rawInput = {
      rating: parseInt(formData.get("rating") as string, 10),
      title: formData.get("title") as string,
      comment: formData.get("comment") as string,
      buyerName: formData.get("buyerName") as string,
      buyerEmail: formData.get("buyerEmail") as string,
    };

    const parsed = submitReviewSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]?.toString() ?? "unknown";
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      return { success: false, error: "Please fix the errors.", fieldErrors };
    }

    // Verify product belongs to this shop
    const product = await db.product.findFirst({
      where: { id: productId, shopId, isActive: true },
      select: { id: true },
    });
    if (!product) {
      return { success: false, error: "Product not found in this shop." };
    }

    const review = await createReview({
      shopId,
      productId,
      ...parsed.data,
    });

    // Fire-and-forget notification
    notifyNewReview({
      shopId,
      productId,
      rating: parsed.data.rating,
      title: parsed.data.title || undefined,
      comment: parsed.data.comment || undefined,
      buyerName: parsed.data.buyerName,
    }).catch(() => {});

    revalidatePath(`/catalog/${shopSlug}`);

    return { success: true };
  } catch (error) {
    await reportError("submitReviewAction", error, { shopId, productId });
    return { success: false, error: "Failed to submit review." };
  }
}

// ── Delete Review (Seller) ──────────────────────────────────

export async function deleteReviewAction(
  shopSlug: string,
  reviewId: string,
): Promise<ActionResult> {
  try {
    const access = await requireShopAccess(shopSlug);
    if (!access) return { success: false, error: "Access denied." };

    await deleteReview(reviewId, access.shopId);
    revalidatePath(`/dashboard/${shopSlug}/reviews`);
    return { success: true };
  } catch (error) {
    await reportError("deleteReviewAction", error, { shopSlug, reviewId });
    return { success: false, error: "Failed to delete review." };
  }
}
