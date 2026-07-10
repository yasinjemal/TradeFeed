import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BuyerAccountShell } from "@/components/buyer/buyer-account-shell";
import { BuyerActivityTimeline } from "@/components/buyer/buyer-activity-timeline";
import { getBuyerRecentActivity, getOrCreateBuyerProfile } from "@/lib/db/buyers";

export const metadata: Metadata = { title: "Recent Activity | TradeFeed", robots: { index: false, follow: false } };

export default async function BuyerActivityPage() {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/me/activity")}`);
  const buyer = await getOrCreateBuyerProfile(userId);
  const activity = await getBuyerRecentActivity(userId, buyer.id);
  return <BuyerAccountShell><div className="mb-7"><h1 className="text-2xl font-extrabold">Recent activity</h1><p className="mt-1 text-sm text-stone-400">A private history of your TradeFeed shopping activity.</p></div><BuyerActivityTimeline items={activity} /></BuyerAccountShell>;
}
