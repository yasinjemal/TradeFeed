// ============================================================
// WhatsApp Follow-Up Sequences — Engine
// ============================================================
// Automated seller onboarding messages sent via WhatsApp.
// Triggered by a daily cron job (/api/cron/seller-sequences).
//
// SEQUENCE:
//  Day 0  → Welcome + catalog link (sent at shop creation)
//  Day 3  → "Add your first product" (if 0 products)
//  Day 7  → "Share your catalog" (if no WhatsApp clicks)
//  Day 14 → "Your shop needs attention" (if inactive)
//  Monthly → Activity summary (views, orders, revenue)
//
// RULES:
// - Only sends to sellers with whatsappNumber on the Shop
// - Respects opt-out flag on SellerSequenceState
// - Skips messages if the seller already completed the action
// - Logs every message to SellerMessage for audit + dedup
// - Uses sendTextMessage (24h window) — upgrade to templates
//   for production cold messaging
// ============================================================

import { db } from "@/lib/db";
import { sendTextMessage } from "@/lib/whatsapp/business-api";
import { formatZAR } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tradefeed.co.za";

// ── Message Templates ──────────────────────────────────────

function welcomeMessage(shopName: string, slug: string) {
  return [
    `🎉 Welcome to TradeFeed, ${shopName}!`,
    "",
    "Your free online store is live. Here's what to do next:",
    "",
    "1️⃣ Add your first product (takes 60 seconds)",
    "2️⃣ Share your catalog link with customers",
    "3️⃣ Start receiving orders via WhatsApp",
    "",
    `Your catalog: ${BASE_URL}/catalog/${slug}`,
    `Dashboard: ${BASE_URL}/dashboard/${slug}`,
    "",
    "Reply STOP to opt out of messages.",
  ].join("\n");
}

function nudgeFirstProduct(shopName: string, slug: string) {
  return [
    `Hey ${shopName} 👋`,
    "",
    "You haven't added any products yet! Sellers who list within 3 days get 5× more views.",
    "",
    "📸 Quick way: Take a photo → AI creates the listing",
    `${BASE_URL}/dashboard/${slug}/products/new?ai=true`,
    "",
    "It takes less than 60 seconds.",
    "",
    "Reply STOP to opt out.",
  ].join("\n");
}

function nudgeShareCatalog(shopName: string, slug: string, productCount: number) {
  return [
    `${shopName}, your catalog has ${productCount} product${productCount !== 1 ? "s" : ""} — nice! 🔥`,
    "",
    "Now let's get buyers. Share your link in WhatsApp groups, Instagram bio, and with friends:",
    "",
    `🔗 ${BASE_URL}/catalog/${slug}`,
    "",
    "Top sellers share their catalog 3× per week.",
    "",
    "Reply STOP to opt out.",
  ].join("\n");
}

function nudgeInactive(shopName: string, slug: string, daysSinceUpdate: number) {
  return [
    `${shopName}, your shop hasn't been updated in ${daysSinceUpdate} days 😔`,
    "",
    "Active sellers get 10× more visibility on TradeFeed marketplace.",
    "",
    "Quick wins:",
    "• Add a new product or update prices",
    "• Share your catalog link on social",
    "• Check your analytics for insights",
    "",
    `Dashboard: ${BASE_URL}/dashboard/${slug}`,
    "",
    "Reply STOP to opt out.",
  ].join("\n");
}

function monthlySummary(
  shopName: string,
  slug: string,
  stats: { views: number; whatsappClicks: number; orders: number; revenueCents: number },
) {
  const lines = [
    `📊 Monthly Report — ${shopName}`,
    "",
    `👀 Views: ${stats.views}`,
    `💬 WhatsApp clicks: ${stats.whatsappClicks}`,
    `📦 Orders: ${stats.orders}`,
    `💰 Revenue: ${formatZAR(stats.revenueCents)}`,
    "",
  ];

  if (stats.orders === 0) {
    lines.push(
      "💡 Tip: Share your catalog link in WhatsApp groups to drive your first sale.",
    );
  } else if (stats.views > 0 && stats.whatsappClicks / stats.views < 0.05) {
    lines.push(
      "💡 Tip: Add better photos and descriptions to improve your click-through rate.",
    );
  } else {
    lines.push("🔥 Great progress this month! Keep it up.");
  }

  lines.push("", `Full analytics: ${BASE_URL}/dashboard/${slug}/analytics`);
  lines.push("", "Reply STOP to opt out.");
  return lines.join("\n");
}

// ── Sequence Engine ────────────────────────────────────────

interface SequenceResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Process all seller follow-up sequences.
 * Called by the cron endpoint. Idempotent — safe to re-run.
 */
export async function processSellerSequences(): Promise<SequenceResult> {
  const result: SequenceResult = { processed: 0, sent: 0, skipped: 0, failed: 0, errors: [] };

  // Get all active shops with their sequence state
  const shops = await db.shop.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappNumber: true,
      createdAt: true,
      updatedAt: true,
      sequenceState: true,
      _count: { select: { products: true, orders: true } },
    },
  });

  for (const shop of shops) {
    result.processed++;

    // Skip shops without WhatsApp number
    if (!shop.whatsappNumber) {
      result.skipped++;
      continue;
    }

    // Ensure sequence state exists
    const state = shop.sequenceState ?? await db.sellerSequenceState.create({
      data: { shopId: shop.id },
    });

    // Respect opt-out
    if (state.optedOut) {
      result.skipped++;
      continue;
    }

    const shopAgeDays = Math.floor(
      (Date.now() - shop.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysSinceUpdate = Math.floor(
      (Date.now() - shop.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    try {
      // Day 0: Welcome (if never sent)
      if (!state.welcomeSentAt) {
        await sendAndLog(shop.id, shop.whatsappNumber, "welcome", welcomeMessage(shop.name, shop.slug));
        await db.sellerSequenceState.update({
          where: { shopId: shop.id },
          data: { welcomeSentAt: new Date() },
        });
        result.sent++;
        continue; // One message per run per seller
      }

      // Day 3+: Nudge first product (if 0 products and not sent)
      if (shopAgeDays >= 3 && !state.nudgeProductSentAt && shop._count.products === 0) {
        await sendAndLog(shop.id, shop.whatsappNumber, "nudge_first_product", nudgeFirstProduct(shop.name, shop.slug));
        await db.sellerSequenceState.update({
          where: { shopId: shop.id },
          data: { nudgeProductSentAt: new Date() },
        });
        result.sent++;
        continue;
      }

      // Day 7+: Nudge share catalog (if has products but no orders, not sent)
      if (shopAgeDays >= 7 && !state.nudgeShareSentAt && shop._count.products > 0 && shop._count.orders === 0) {
        await sendAndLog(shop.id, shop.whatsappNumber, "nudge_share", nudgeShareCatalog(shop.name, shop.slug, shop._count.products));
        await db.sellerSequenceState.update({
          where: { shopId: shop.id },
          data: { nudgeShareSentAt: new Date() },
        });
        result.sent++;
        continue;
      }

      // Day 14+: Inactivity nudge (if no updates in 14+ days, not sent)
      if (shopAgeDays >= 14 && !state.nudgeInactiveSentAt && daysSinceUpdate >= 14) {
        await sendAndLog(shop.id, shop.whatsappNumber, "nudge_inactive", nudgeInactive(shop.name, shop.slug, daysSinceUpdate));
        await db.sellerSequenceState.update({
          where: { shopId: shop.id },
          data: { nudgeInactiveSentAt: new Date() },
        });
        result.sent++;
        continue;
      }

      // Monthly summary (after 30 days, max once per 28 days)
      if (shopAgeDays >= 30) {
        const lastMonthly = state.lastMonthlySentAt;
        const daysSinceLastMonthly = lastMonthly
          ? Math.floor((Date.now() - lastMonthly.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;

        if (daysSinceLastMonthly >= 28) {
          const stats = await getMonthlyStats(shop.id);
          await sendAndLog(shop.id, shop.whatsappNumber, "monthly_summary", monthlySummary(shop.name, shop.slug, stats));
          await db.sellerSequenceState.update({
            where: { shopId: shop.id },
            data: { lastMonthlySentAt: new Date() },
          });
          result.sent++;
          continue;
        }
      }

      // Nothing to send for this seller
      result.skipped++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${shop.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

/**
 * Send a welcome message immediately when a shop is created.
 * Called from createShopAction.
 */
export async function sendWelcomeSequence(shopId: string) {
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true, slug: true, whatsappNumber: true },
  });
  if (!shop?.whatsappNumber) return;

  // Create sequence state + mark welcome as sent
  await db.sellerSequenceState.upsert({
    where: { shopId },
    create: { shopId, welcomeSentAt: new Date() },
    update: { welcomeSentAt: new Date() },
  });

  await sendAndLog(shop.id, shop.whatsappNumber, "welcome", welcomeMessage(shop.name, shop.slug));
}

// ── Helpers ────────────────────────────────────────────────

async function sendAndLog(
  shopId: string,
  phone: string,
  messageType: string,
  text: string,
) {
  const result = await sendTextMessage(phone, text);

  await db.sellerMessage.create({
    data: {
      shopId,
      messageType,
      recipientPhone: phone,
      status: result.success ? "sent" : "failed",
      errorMessage: result.error ?? null,
    },
  });

  if (!result.success) {
    throw new Error(`WhatsApp send failed: ${result.error}`);
  }
}

async function getMonthlyStats(shopId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [analytics, orders] = await Promise.all([
    db.analyticsEvent.aggregate({
      where: {
        shopId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    }).then(async (allEvents) => {
      const whatsappClicks = await db.analyticsEvent.count({
        where: {
          shopId,
          type: "WHATSAPP_CLICK",
          createdAt: { gte: thirtyDaysAgo },
        },
      });
      return { views: allEvents._count.id, whatsappClicks };
    }),
    db.order.aggregate({
      where: {
        shopId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
      _sum: { totalCents: true },
    }),
  ]);

  return {
    views: analytics.views,
    whatsappClicks: analytics.whatsappClicks,
    orders: orders._count.id,
    revenueCents: orders._sum.totalCents ?? 0,
  };
}
