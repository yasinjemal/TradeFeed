import { db } from "@/lib/db";
import { listingQualityIssues } from "@/lib/marketplace/listing-readiness";
import {
  parseFollowup,
  sellerPriority,
} from "@/lib/activation/operations-policy";

export async function getActivationOperations(now = new Date()) {
  const since = new Date(now.getTime() - 30 * 86400000);
  const [
    shops,
    notes,
    intents,
    shares,
    milestones,
    staleOrders,
    orderNotes,
    reviewCounts,
  ] = await Promise.all([
    db.shop.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        city: true,
        province: true,
        whatsappNumber: true,
        returnPolicy: true,
        deliveryEnabled: true,
        collectionEnabled: true,
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            globalCategoryId: true,
            isActive: true,
            isFlagged: true,
            minPriceCents: true,
            discoveryGraceUntil: true,
            images: { select: { url: true } },
            variants: {
              select: { isActive: true, stock: true, priceInCents: true },
            },
          },
        },
      },
    }),
    db.adminAuditLog.findMany({
      where: { action: "SELLER_ACTIVATION_FOLLOWUP" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      distinct: ["entityId"],
    }),
    db.analyticsEvent.groupBy({
      by: ["shopId"],
      where: {
        createdAt: { gte: since },
        visitorId: { not: null },
        type: { in: ["WHATSAPP_CLICK", "WHATSAPP_CHECKOUT"] },
      },
      _count: { _all: true },
    }),
    db.onboardingEvent.findMany({
      where: { step: "catalog_shared" },
      select: { metadata: true },
    }),
    db.onboardingEvent.groupBy({
      by: ["step"],
      _max: { createdAt: true },
      _count: { _all: true },
    }),
    db.order.findMany({
      where: {
        status: "PENDING",
        deletedAt: null,
        createdAt: { lt: new Date(now.getTime() - 7 * 86400000) },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        paidAt: true,
        stockReservedAt: true,
        shop: { select: { name: true, slug: true } },
      },
    }),
    db.adminAuditLog.findMany({
      where: { action: "ORDER_OUTCOME_FOLLOWUP" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      distinct: ["entityId"],
    }),
    db.review.groupBy({ by: ["isVerified"], _count: { _all: true } }),
  ]);
  const noteMap = new Map(notes.map((n) => [n.entityId, n]));
  const intentMap = new Map(intents.map((n) => [n.shopId, n._count._all]));
  const shared = new Set(
    shares.flatMap((e) => {
      const m = e.metadata as { shopId?: string; shopSlug?: string } | null;
      return m?.shopId ? [m.shopId] : m?.shopSlug ? [m.shopSlug] : [];
    }),
  );
  const sellers = shops
    .map((s) => {
      const products = s.products.map((p) => ({
        ...p,
        issues: listingQualityIssues(p),
      }));
      const ready = products.filter((p) => p.issues.length === 0).length;
      const note = noteMap.get(s.id);
      const parsed = parseFollowup(note?.details ?? null);
      const followup = parsed.success ? parsed.data : null;
      const shopIssues = [
        ...(!s.whatsappNumber || !s.city || !s.province
          ? ["Confirm contact details and location"]
          : []),
        ...(!s.returnPolicy?.trim()
          ? ["Write the shop's returns and refund policy"]
          : []),
        ...(!s.deliveryEnabled && !s.collectionEnabled
          ? ["Offer delivery or collection"]
          : []),
      ];
      const confirmedEnquiry = followup?.enquiry === "SELLER_CONFIRMED";
      return {
        ...s,
        products,
        ready,
        shopIssues,
        followup,
        owner: note?.adminEmail ?? null,
        updatedAt: note?.createdAt ?? null,
        shared: shared.has(s.id) || shared.has(s.slug),
        intentCount: intentMap.get(s.id) ?? 0,
        priority:
          followup?.status === "CLOSED"
            ? -1
            : sellerPriority(
                {
                  createdAt: s.createdAt,
                  ready,
                  active: products.length,
                  shopReady: shopIssues.length === 0,
                  shared: shared.has(s.id) || shared.has(s.slug),
                  confirmedEnquiry,
                },
                now,
              ),
      };
    })
    .sort(
      (a, b) =>
        b.priority - a.priority ||
        b.createdAt.getTime() - a.createdAt.getTime() ||
        a.id.localeCompare(b.id),
    );
  return {
    asOf: now.getTime(),
    sellers,
    milestones,
    staleOrders,
    orderNotes: new Map(orderNotes.map((n) => [n.entityId, n])),
    reviewCounts,
  };
}
