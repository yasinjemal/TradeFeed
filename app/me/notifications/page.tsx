import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BuyerAccountShell } from "@/components/buyer/buyer-account-shell";
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
  return <BuyerAccountShell width="max-w-2xl"><BuyerNotificationCentre notifications={notifications} preferences={{ orderUpdates: buyer.orderUpdates, restockAlerts: buyer.restockAlerts, shopUpdates: buyer.shopUpdates }} /></BuyerAccountShell>;
}
