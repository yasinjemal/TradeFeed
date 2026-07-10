import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { BuyerAccountShell } from "@/components/buyer/buyer-account-shell";

export const metadata: Metadata = { title: "Security | TradeFeed", robots: { index: false, follow: false } };

export default async function BuyerSecurityPage() {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent("/me/security")}`);
  return <BuyerAccountShell width="max-w-5xl"><div className="mb-6"><h1 className="text-2xl font-extrabold">Security and sign-in</h1><p className="mt-1 text-sm text-stone-400">Manage your password, connected accounts, and active devices securely.</p></div><div className="overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/40 p-2"><UserProfile path="/me/security" routing="path" appearance={{ variables: { colorPrimary: "#10b981", colorBackground: "#0c0a09", colorText: "#f5f5f4", colorTextSecondary: "#a8a29e", colorInputBackground: "#1c1917", colorInputText: "#f5f5f4", borderRadius: "0.75rem" } }} /></div></BuyerAccountShell>;
}
