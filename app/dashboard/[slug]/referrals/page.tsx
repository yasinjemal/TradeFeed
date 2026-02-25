// ============================================================
// Page — Referral Program Dashboard
// ============================================================
// Sellers can:
// - View/generate their referral code
// - Share invite link via WhatsApp
// - See how many sellers they've referred
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReferralInvite } from "@/components/dashboard/referral-invite";

interface ReferralPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  // Generate referral code if not yet set
  let referralCode = (shop as { referralCode?: string | null }).referralCode;
  if (!referralCode) {
    const code = `TF-${shop.slug.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await db.shop.update({
      where: { id: shop.id },
      data: { referralCode: code },
    });
    referralCode = code;
  }

  // Count referred shops
  const referralCount = await db.shop.count({
    where: { referredBy: shop.slug },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Referral Program</h1>
        <p className="text-sm text-stone-500 mt-1">
          Invite other sellers to TradeFeed and grow the community
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="text-3xl font-bold text-emerald-600">{referralCount}</p>
          <p className="text-sm text-stone-500 mt-1">Sellers Referred</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="text-3xl font-bold text-stone-900">{referralCode}</p>
          <p className="text-sm text-stone-500 mt-1">Your Referral Code</p>
        </div>
      </div>

      {/* Invite Card */}
      <ReferralInvite
        referralCode={referralCode}
        shopName={shop.name}
        shopSlug={slug}
      />

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <h2 className="font-semibold text-stone-900">How it works</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Share your invite link", desc: "Send your referral link to other sellers via WhatsApp" },
            { step: "2", title: "They sign up", desc: "When they create a shop using your link, they're linked to you" },
            { step: "3", title: "Community grows", desc: "More sellers = more buyers = more orders for everyone" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-600">{item.step}</span>
              </div>
              <div>
                <p className="font-medium text-stone-900 text-sm">{item.title}</p>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
