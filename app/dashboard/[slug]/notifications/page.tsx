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

interface NotificationsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { slug } = await params;

  const access = await requireShopAccess(slug);
  if (!access) notFound();

  const [prefs, lowStockVariants] = await Promise.all([
    getNotificationPrefs(access.shopId),
    getLowStockVariants(access.shopId),
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
          Configure email alerts for orders, reviews, and stock levels
        </p>
      </div>

      <NotificationSettings
        prefs={prefs}
        lowStockVariants={formattedVariants}
        shopSlug={slug}
      />
    </div>
  );
}
