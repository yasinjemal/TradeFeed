// ============================================================
// Page — Admin Marketplace Analytics (/admin/analytics)
// ============================================================
// M7.5 — Platform-wide marketplace analytics.
// ============================================================

import { getMarketplaceAnalytics } from "@/lib/db/admin";
import { AdminMarketplaceAnalytics } from "@/components/admin/admin-marketplace-analytics";

export default async function AdminAnalyticsPage() {
  const analytics = await getMarketplaceAnalytics(30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketplace Analytics</h1>
        <p className="text-stone-500 text-sm mt-1">
          Platform-wide views, clicks, geographic distribution, and category insights.
        </p>
      </div>

      <AdminMarketplaceAnalytics analytics={analytics} />
    </div>
  );
}
