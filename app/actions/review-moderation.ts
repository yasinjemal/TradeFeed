"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
export async function moderateReviewAction(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const input = z
    .object({
      id: z.string().min(1),
      reason: z.string().trim().min(5).max(500),
      decision: z.enum(["publish", "hide"]),
    })
    .parse(Object.fromEntries(form));
  const review = await db.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: input.id },
      data: {
        isApproved: input.decision === "publish",
        moderatedAt: new Date(),
        reportedAt: null,
        moderationReason: input.reason,
      },
      include: { shop: { select: { slug: true } } },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "REVIEW_MODERATED",
        entityType: "Review",
        entityId: review.id,
        details: JSON.stringify(input),
      },
    });
    return review;
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/marketplace");
  revalidatePath("/catalog/" + review.shop.slug, "layout");
}
