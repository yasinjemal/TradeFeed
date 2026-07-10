import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BuyerAccountManager } from "@/components/buyer/buyer-account-manager";
import { BuyerAccountShell } from "@/components/buyer/buyer-account-shell";
import { getBuyerAddresses, getOrCreateBuyerProfile } from "@/lib/db/buyers";

export const metadata: Metadata = { title: "My Account | TradeFeed", robots: { index: false, follow: false } };

export default async function BuyerAccountPage() {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/me/account")}`);
  const buyer = await getOrCreateBuyerProfile(userId);
  const addresses = await getBuyerAddresses(buyer.id);
  return <BuyerAccountShell><BuyerAccountManager profile={{ displayName: buyer.displayName, phone: buyer.phone, language: buyer.language, orderUpdates: buyer.orderUpdates, restockAlerts: buyer.restockAlerts, shopUpdates: buyer.shopUpdates }} initialAddresses={addresses} /></BuyerAccountShell>;
}
