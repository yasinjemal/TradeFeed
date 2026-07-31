// ============================================================
// Dashboard — Notifications Settings Page
// ============================================================
// Manage email notification preferences and low-stock thresholds.
// Also shows current low-stock variants.
// ============================================================

import { requireShopAccess } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getNotificationPrefs, getLowStockVariants } from "@/lib/db/notifications";
import { NotificationSettings } from "@/components/notifications/notification-settings";
import { WhatsAppSequenceToggle } from "@/components/notifications/whatsapp-sequence-toggle";
import { EmailMarketingToggle } from "@/components/notifications/email-marketing-toggle";
import { db } from "@/lib/db";

interface NotificationsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { slug } = await params;

  const access = await requireShopAccess(slug);
  if (!access) notFound();

  const [
    prefs,
    lowStockVariants,
    sequenceState,
    emailMarketingPreference,
  ] = await Promise.all([
    getNotificationPrefs(access.shopId),
    getLowStockVariants(access.shopId),
    db.sellerSequenceState.findUnique({ where: { shopId: access.shopId }, select: { optedOut: true } }),
    db.emailMarketingPreference.findUnique({
      where: { userId: access.userId },
      select: { status: true },
    }).catch(() => {
      // Keep transactional notification settings available during a
      // code-before-migration rollout. Marketing remains off until the
      // additive preference table is present and an explicit opt-in exists.
      return null;
    }),
  ]);

  const formattedVariants = lowStockVariants.map((v) => ({
    id: v.id,
    productName: v.product.name,
    productId: v.product.id,
    option1Label: v.product.option1Label,
    option1Value: v.size,
    option2Label: v.product.option2Label,
    option2Value: v.color,
    stock: v.stock,
    sku: v.sku,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
        <p className="text-sm text-stone-500 mt-1">
          Manage transactional alerts and optional TradeFeed updates.
        </p>
      </div>

      <NotificationSettings
        prefs={prefs}
        lowStockVariants={formattedVariants}
        shopSlug={slug}
      />

      <EmailMarketingToggle
        shopSlug={slug}
        optedIn={emailMarketingPreference?.status === "OPTED_IN"}
      />

      <WhatsAppSequenceToggle
        shopSlug={slug}
        optedOut={sequenceState?.optedOut ?? false}
      />
    </div>
  );
}
