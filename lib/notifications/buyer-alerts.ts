import { db } from "@/lib/db";
import { getRestockAlertDecision } from "@/lib/notifications/restock-state";

/**
 * Synchronize saved-product alert state with the product's current stock.
 *
 * Zero stock arms every signed-in save. Positive stock atomically claims each
 * armed save before creating a notification, so repeated edits cannot spam a
 * buyer. Returning to zero stock arms it again for the next genuine restock.
 */
export async function syncProductRestockAlerts(productId: string): Promise<number> {
  const [product, stock] = await Promise.all([
    db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        shop: { select: { name: true, slug: true, isActive: true } },
      },
    }),
    db.productVariant.aggregate({
      where: { productId, isActive: true },
      _sum: { stock: true },
    }),
  ]);

  if (!product) return 0;
  const totalStock = stock._sum.stock ?? 0;

  if (getRestockAlertDecision(totalStock, null) === "ARM") {
    await db.wishlistItem.updateMany({
      where: { productId, userId: { not: null }, restockNotifiedAt: { not: null } },
      data: { restockNotifiedAt: null },
    });
    return 0;
  }

  const armedSaves = await db.wishlistItem.findMany({
    where: { productId, userId: { not: null }, restockNotifiedAt: null },
    select: { id: true, userId: true, restockNotifiedAt: true },
  });
  if (armedSaves.length === 0) return 0;

  const clerkIds = [...new Set(armedSaves.flatMap((save) => save.userId ? [save.userId] : []))];
  await db.buyerProfile.createMany({
    data: clerkIds.map((clerkId) => ({ clerkId })),
    skipDuplicates: true,
  });
  const buyers = await db.buyerProfile.findMany({
    where: { clerkId: { in: clerkIds } },
    select: { id: true, clerkId: true, restockAlerts: true },
  });
  const buyersByClerkId = new Map(buyers.map((buyer) => [buyer.clerkId, buyer]));
  const href = `/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`;
  let notified = 0;

  for (const save of armedSaves) {
    if (!save.userId) continue;
    if (getRestockAlertDecision(totalStock, save.restockNotifiedAt) !== "NOTIFY") continue;
    const buyer = buyersByClerkId.get(save.userId);

    const created = await db.$transaction(async (tx) => {
      const claim = await tx.wishlistItem.updateMany({
        where: { id: save.id, restockNotifiedAt: null },
        data: { restockNotifiedAt: new Date() },
      });
      if (claim.count === 0 || !buyer?.restockAlerts || !product.isActive || !product.shop.isActive) return false;

      await tx.buyerNotification.create({
        data: {
          buyerId: buyer.id,
          kind: "RESTOCK",
          title: `${product.name} is back in stock`,
          body: `${product.shop.name} has restocked a product you saved.`,
          href,
        },
      });
      return true;
    });

    if (created) notified++;
  }

  return notified;
}
