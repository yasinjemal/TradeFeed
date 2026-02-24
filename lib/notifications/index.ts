// ============================================================
// Notifications — Order & Low-Stock & Review Emails
// ============================================================
// Fire-and-forget notification triggers.
// Called from server actions AFTER the primary operation succeeds.
// Never block the main operation on email delivery.
// ============================================================

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { newOrderEmailHtml } from "@/lib/email/templates/order-notification";
import { lowStockAlertEmailHtml } from "@/lib/email/templates/low-stock-alert";
import { newReviewEmailHtml } from "@/lib/email/templates/review-notification";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trade-feed.vercel.app";

// ── Helpers ─────────────────────────────────────────────────

/**
 * Get the notification email for a shop.
 * Checks NotificationPreference first, then falls back to shop owner's email.
 */
async function getShopNotificationEmail(shopId: string): Promise<string | null> {
  // Check for custom notification email
  const prefs = await db.notificationPreference.findUnique({
    where: { shopId },
    select: { notificationEmail: true },
  });

  if (prefs?.notificationEmail) return prefs.notificationEmail;

  // Fall back to shop owner's email
  const ownerLink = await db.shopUser.findFirst({
    where: { shopId, role: "OWNER" },
    include: { user: { select: { email: true } } },
  });

  return ownerLink?.user.email ?? null;
}

/**
 * Get notification preferences for a shop (with defaults).
 */
async function getNotificationPrefs(shopId: string) {
  const prefs = await db.notificationPreference.findUnique({
    where: { shopId },
  });

  return {
    orderNotifications: prefs?.orderNotifications ?? true,
    lowStockAlerts: prefs?.lowStockAlerts ?? true,
    reviewNotifications: prefs?.reviewNotifications ?? true,
    lowStockThreshold: prefs?.lowStockThreshold ?? 5,
  };
}

// ── Order Notification ──────────────────────────────────────

/**
 * Send email notification when a new order is placed.
 * Fire-and-forget — errors are logged, never thrown.
 */
export async function notifyNewOrder(order: {
  orderNumber: string;
  shopId: string;
  buyerName: string | null;
  buyerPhone: string | null;
  totalCents: number;
  itemCount: number;
  items: {
    productName: string;
    option1Label: string;
    option1Value: string;
    option2Label: string;
    option2Value: string | null;
    priceInCents: number;
    quantity: number;
  }[];
}) {
  try {
    const prefs = await getNotificationPrefs(order.shopId);
    if (!prefs.orderNotifications) return;

    const email = await getShopNotificationEmail(order.shopId);
    if (!email) return;

    const shop = await db.shop.findUnique({
      where: { id: order.shopId },
      select: { name: true, slug: true },
    });
    if (!shop) return;

    const html = newOrderEmailHtml({
      shopName: shop.name,
      orderNumber: order.orderNumber,
      buyerName: order.buyerName ?? undefined,
      buyerPhone: order.buyerPhone ?? undefined,
      totalCents: order.totalCents,
      itemCount: order.itemCount,
      items: order.items,
      dashboardUrl: `${APP_URL}/dashboard/${shop.slug}/orders`,
    });

    await sendEmail({
      to: email,
      subject: `🛒 New order ${order.orderNumber} — ${shop.name}`,
      html,
    });
  } catch (error) {
    console.error("[notifyNewOrder] Failed:", error);
  }
}

// ── Low Stock Alert ─────────────────────────────────────────

/**
 * Check for low-stock variants after an order and send alert.
 * Called after order creation with the variant IDs that were decremented.
 */
export async function checkAndNotifyLowStock(
  shopId: string,
  variantIds: string[],
) {
  try {
    const prefs = await getNotificationPrefs(shopId);
    if (!prefs.lowStockAlerts) return;

    // Get variants that dropped below threshold
    const variants = await db.productVariant.findMany({
      where: {
        id: { in: variantIds },
        stock: { lte: prefs.lowStockThreshold },
        product: { shopId },
      },
      include: {
        product: {
          select: { name: true, option1Label: true, option2Label: true },
        },
      },
    });

    if (variants.length === 0) return;

    const email = await getShopNotificationEmail(shopId);
    if (!email) return;

    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: { name: true, slug: true },
    });
    if (!shop) return;

    const html = lowStockAlertEmailHtml({
      shopName: shop.name,
      threshold: prefs.lowStockThreshold,
      variants: variants.map((v) => ({
        productName: v.product.name,
        option1Label: v.product.option1Label,
        option1Value: v.size,
        option2Label: v.product.option2Label,
        option2Value: v.color,
        currentStock: v.stock,
        sku: v.sku,
      })),
      dashboardUrl: `${APP_URL}/dashboard/${shop.slug}/products`,
    });

    const outOfStockCount = variants.filter((v) => v.stock === 0).length;
    const subject = outOfStockCount > 0
      ? `🚨 ${outOfStockCount} variant${outOfStockCount > 1 ? "s" : ""} out of stock — ${shop.name}`
      : `⚠️ ${variants.length} variant${variants.length > 1 ? "s" : ""} low on stock — ${shop.name}`;

    await sendEmail({ to: email, subject, html });
  } catch (error) {
    console.error("[checkAndNotifyLowStock] Failed:", error);
  }
}

// ── Review Notification ─────────────────────────────────────

/**
 * Send email notification when a new review is submitted.
 */
export async function notifyNewReview(review: {
  shopId: string;
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  buyerName: string;
}) {
  try {
    const prefs = await getNotificationPrefs(review.shopId);
    if (!prefs.reviewNotifications) return;

    const email = await getShopNotificationEmail(review.shopId);
    if (!email) return;

    const [shop, product] = await Promise.all([
      db.shop.findUnique({
        where: { id: review.shopId },
        select: { name: true, slug: true },
      }),
      db.product.findUnique({
        where: { id: review.productId },
        select: { name: true },
      }),
    ]);
    if (!shop || !product) return;

    const html = newReviewEmailHtml({
      shopName: shop.name,
      productName: product.name,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      buyerName: review.buyerName,
      dashboardUrl: `${APP_URL}/dashboard/${shop.slug}/reviews`,
    });

    const stars = "★".repeat(review.rating);
    await sendEmail({
      to: email,
      subject: `⭐ New ${stars} review for ${product.name}`,
      html,
    });
  } catch (error) {
    console.error("[notifyNewReview] Failed:", error);
  }
}
