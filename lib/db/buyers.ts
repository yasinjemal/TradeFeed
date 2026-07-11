// ============================================================
// Data Access — Buyer Profiles & Shop Follows
// ============================================================
// Phone-based buyer retention layer (Phase 1).
// Buyer identity = Clerk userId (created via the existing
// WhatsApp magic-link login). BuyerProfile is created lazily
// on first follow/save — no separate signup step.
//
// POPIA: BuyerProfile.phone is PII. Never return it from
// functions that feed public UI.
// ============================================================

import { db } from "@/lib/db";

const FEED_PAGE_SIZE = 24;

// ── Profile ──────────────────────────────────────────────────

/**
 * Get or lazily create the buyer profile for a Clerk user.
 * Phone is optional — populated when known (e.g. from the
 * MagicLink row after WhatsApp login).
 */
export async function getOrCreateBuyerProfile(
  clerkId: string,
  data?: { phone?: string | null; displayName?: string | null; language?: string }
) {
  const existing = await db.buyerProfile.findUnique({ where: { clerkId } });
  if (existing) return existing;

  return db.buyerProfile.create({
    data: {
      clerkId,
      phone: data?.phone ?? null,
      displayName: data?.displayName ?? null,
      language: data?.language ?? "en",
    },
  });
}

export async function getBuyerProfile(clerkId: string) {
  return db.buyerProfile.findUnique({ where: { clerkId } });
}

export async function getBuyerAddresses(buyerId: string) {
  return db.buyerAddress.findMany({
    where: { buyerId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getBuyerHomeSummary(clerkId: string, buyerId: string) {
  const [activeOrders, unreadNotifications, savedProducts] = await Promise.all([
    db.order.count({
      where: {
        buyerClerkId: clerkId,
        deletedAt: null,
        status: { in: ["PENDING", "CONFIRMED", "SHIPPED"] },
      },
    }),
    db.buyerNotification.count({ where: { buyerId, readAt: null } }),
    db.wishlistItem.count({ where: { userId: clerkId } }),
  ]);

  return { activeOrders, unreadNotifications, savedProducts };
}

export async function getBuyerRecentActivity(clerkId: string, buyerId: string, limit = 30) {
  const [orders, saves, follows, notifications] = await Promise.all([
    db.order.findMany({
      where: { buyerClerkId: clerkId, deletedAt: null },
      select: { id: true, orderNumber: true, status: true, createdAt: true, shop: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.wishlistItem.findMany({
      where: { userId: clerkId },
      select: { productId: true, productName: true, createdAt: true, shopId: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.shopFollow.findMany({
      where: { buyerId },
      select: { createdAt: true, shop: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.buyerNotification.findMany({
      where: { buyerId },
      select: { id: true, kind: true, title: true, body: true, href: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const productIds = saves.map((save) => save.productId);
  const products = productIds.length > 0 ? await db.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, name: true, slug: true, shop: { select: { name: true, slug: true } } },
  }) : [];
  const productsById = new Map(products.map((product) => [product.id, product]));

  return [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      type: "ORDER" as const,
      title: `Order ${order.orderNumber}`,
      detail: `${order.shop.name} · ${order.status.toLowerCase().replaceAll("_", " ")}`,
      href: `/orders`,
      createdAt: order.createdAt,
    })),
    ...saves.map((save) => {
      const product = productsById.get(save.productId);
      return {
        id: `save-${save.productId}-${save.createdAt.getTime()}`,
        type: "SAVED" as const,
        title: `Saved ${product?.name ?? save.productName ?? "a product"}`,
        detail: product?.shop.name ?? "Saved product",
        href: product ? `/catalog/${product.shop.slug}/products/${product.slug ?? product.id}` : "/me#saved",
        createdAt: save.createdAt,
      };
    }),
    ...follows.map((follow) => ({
      id: `follow-${follow.shop.slug}-${follow.createdAt.getTime()}`,
      type: "FOLLOW" as const,
      title: `Followed ${follow.shop.name}`,
      detail: "New drops from this shop can now reach your inbox.",
      href: `/catalog/${follow.shop.slug}`,
      createdAt: follow.createdAt,
    })),
    ...notifications.map((notification) => ({
      id: `notification-${notification.id}`,
      type: "NOTIFICATION" as const,
      title: notification.title,
      detail: notification.body,
      href: notification.href ?? "/me/notifications",
      createdAt: notification.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

/** Saved products across every shop for the signed-in buyer. */
export async function getBuyerSavedProducts(clerkId: string, limit = 12) {
  const saved = await db.wishlistItem.findMany({
    where: { userId: clerkId },
    select: { productId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  if (saved.length === 0) return [];

  const products = await db.product.findMany({
    where: {
      id: { in: saved.map((item) => item.productId) },
      isActive: true,
      shop: { isActive: true },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      minPriceCents: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      shop: { select: { name: true, slug: true, isVerified: true } },
    },
  });

  const byProductId = new Map(products.map((product) => [product.id, product]));
  return saved.flatMap((item) => {
    const product = byProductId.get(item.productId);
    return product ? [{ ...product, savedAt: item.createdAt, imageUrl: product.images[0]?.url ?? null }] : [];
  });
}

// ── Follows ──────────────────────────────────────────────────

/**
 * Follow a shop. Idempotent — re-following is a no-op.
 */
export async function followShop(buyerId: string, shopId: string) {
  return db.shopFollow.upsert({
    where: { buyerId_shopId: { buyerId, shopId } },
    create: { buyerId, shopId },
    update: {},
  });
}

export async function unfollowShop(buyerId: string, shopId: string) {
  await db.shopFollow.deleteMany({ where: { buyerId, shopId } });
}

export async function isFollowingShop(buyerId: string, shopId: string) {
  const follow = await db.shopFollow.findUnique({
    where: { buyerId_shopId: { buyerId, shopId } },
    select: { id: true },
  });
  return follow !== null;
}

/** Follower count for a shop (public-safe — no PII). */
export async function getShopFollowerCount(shopId: string) {
  return db.shopFollow.count({ where: { shopId } });
}

/**
 * Shops a buyer follows — public-safe shop fields only
 * (no WhatsApp numbers).
 */
export async function getFollowedShops(buyerId: string) {
  const follows = await db.shopFollow.findMany({
    where: { buyerId, shop: { isActive: true } },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          city: true,
          province: true,
          isVerified: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      },
    },
  });

  return follows.map((f) => ({ followedAt: f.createdAt, ...f.shop }));
}

// ── Feed ─────────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  name: string;
  slug: string | null;
  minPriceCents: number;
  maxPriceCents: number;
  createdAt: Date;
  imageUrl: string | null;
  shop: { id: string; name: string; slug: string; isVerified: boolean };
}

interface FeedRow {
  id: string;
  name: string;
  slug: string | null;
  minPriceCents: number;
  maxPriceCents: number;
  createdAt: Date;
  images: { url: string }[];
  shop: { id: string; name: string; slug: string; isVerified: boolean };
}

/**
 * Pure pagination/mapping for the feed: takes `pageSize + 1` rows
 * (the extra row signals another page) and produces the page +
 * nextCursor. Exported for unit testing.
 */
export function buildFeedPage(
  rows: FeedRow[],
  pageSize: number
): { items: FeedItem[]; nextCursor: string | null } {
  const hasMore = rows.length > pageSize;
  const page = hasMore ? rows.slice(0, pageSize) : rows;

  return {
    items: page.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      minPriceCents: p.minPriceCents,
      maxPriceCents: p.maxPriceCents,
      createdAt: p.createdAt,
      imageUrl: p.images[0]?.url ?? null,
      shop: p.shop,
    })),
    nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : null,
  };
}

/**
 * "New from shops you follow" — newest active products across
 * followed shops. Cursor-paginated (createdAt+id) to stay cheap
 * on low-end devices / patchy data.
 */
export async function getFollowedFeed(
  buyerId: string,
  opts?: { cursor?: string; pageSize?: number }
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const pageSize = Math.min(opts?.pageSize ?? FEED_PAGE_SIZE, 48);

  const follows = await db.shopFollow.findMany({
    where: { buyerId },
    select: { shopId: true },
  });
  const shopIds = follows.map((f) => f.shopId);
  if (shopIds.length === 0) return { items: [], nextCursor: null };

  const products = await db.product.findMany({
    where: {
      shopId: { in: shopIds },
      isActive: true,
      wholesaleOnly: false,
      shop: { isActive: true },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: pageSize + 1,
    ...(opts?.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      name: true,
      slug: true,
      minPriceCents: true,
      maxPriceCents: true,
      createdAt: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
      shop: { select: { id: true, name: true, slug: true, isVerified: true } },
    },
  });

  return buildFeedPage(products, pageSize);
}
