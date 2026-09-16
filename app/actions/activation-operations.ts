"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import {
  sellerFollowupSchema,
  orderFollowupSchema,
} from "@/lib/activation/operations-policy";

export async function saveSellerFollowup(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const input = sellerFollowupSchema.parse(Object.fromEntries(form));
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Shop" WHERE id=${input.shopId} FOR UPDATE`;
    const shop = await tx.shop.findUniqueOrThrow({
      where: { id: input.shopId },
      select: { name: true },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "SELLER_ACTIVATION_FOLLOWUP",
        entityType: "Shop",
        entityId: input.shopId,
        entityName: shop.name,
        details: JSON.stringify(input),
      },
    });
  });
  revalidatePath("/admin/operations");
}

export async function saveOrderFollowup(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const input = orderFollowupSchema.parse(Object.fromEntries(form));
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Order" WHERE id=${input.orderId} FOR UPDATE`;
    const order = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      select: { orderNumber: true },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "ORDER_OUTCOME_FOLLOWUP",
        entityType: "Order",
        entityId: input.orderId,
        entityName: order.orderNumber,
        details: JSON.stringify(input),
      },
    });
  });
  revalidatePath("/admin/operations");
}
