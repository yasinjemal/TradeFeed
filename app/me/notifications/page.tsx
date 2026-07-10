import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { BuyerNotificationCentre } from "@/components/buyer/buyer-notification-centre";
import { getOrCreateBuyerProfile } from "@/lib/db/buyers";
import { getBuyerNotifications } from "@/lib/db/buyer-notifications";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

export default async function BuyerNotificationsPage() {
  if (!FEATURE_FLAGS.BUYER_ACCOUNTS) redirect("/marketplace");
  const { userId } = await auth();
  if (!userId) redirect("/whatsapp-login");
  const buyer = await getOrCreateBuyerProfile(userId);
  const notifications = await getBuyerNotifications(buyer.id);
  return <div className="min-h-screen bg-stone-950 text-stone-100"><header className="border-b border-stone-800/50 bg-stone-950/80"><div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5"><Link href="/me"><TradeFeedLogo size="sm" /></Link><Link href="/marketplace" className="text-xs text-stone-500">Marketplace</Link></div></header><main className="mx-auto max-w-2xl px-5 py-10"><BuyerNotificationCentre notifications={notifications} preferences={{ orderUpdates: buyer.orderUpdates, restockAlerts: buyer.restockAlerts, shopUpdates: buyer.shopUpdates }} /></main></div>;
}
