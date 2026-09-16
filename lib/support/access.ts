import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth/admin";
import { requireShopAccess } from "@/lib/auth";
import { db } from "@/lib/db";
export const supportTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function supportCaseAccess(id: string) {
  const record = await db.supportCase.findUnique({
    where: { id },
    include: {
      order: {
        select: {
          orderNumber: true,
          shop: { select: { slug: true, name: true } },
        },
      },
    },
  });
  if (!record) return null;
  const { userId } = await auth();
  if (userId && (await isAdmin()))
    return { record, actor: "ADMIN", actorId: userId };
  if (userId && record.buyerClerkId === userId)
    return { record, actor: "BUYER", actorId: userId };
  const token = (await cookies()).get("tf_support_" + id)?.value;
  if (
    token &&
    record.guestTokenHash &&
    timingSafeEqual(
      Buffer.from(supportTokenHash(token)),
      Buffer.from(record.guestTokenHash),
    )
  )
    return { record, actor: "BUYER", actorId: null };
  if (userId) {
    const shopAccess = await requireShopAccess(
      record.order.shop.slug,
      "orders:update",
    );
    if (shopAccess) return { record, actor: "SELLER", actorId: userId };
  }
  return null;
}
