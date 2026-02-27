// ============================================================
// Page — Referral Program Dashboard
// ============================================================
// Sellers can:
// - View/generate their referral code
// - Share invite link via WhatsApp
// - See how many sellers they've referred
// - View tiered referral rewards (A5.4.1)
// - See community leaderboard (A5.4.2)
// - Track downstream referral chains (A5.4.3)
// ============================================================

import { getShopBySlug } from "@/lib/db/shops";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReferralInvite } from "@/components/dashboard/referral-invite";

interface ReferralPageProps {
  params: Promise<{ slug: string }>;
}

// Reward tiers for referral milestones
const REWARD_TIERS = [
  { count: 1, reward: "1 free month", emoji: "🎁", description: "Your first referral earns 1 month free Pro" },
  { count: 3, reward: "2 free months", emoji: "🚀", description: "Refer 3 sellers for 2 months free Pro" },
  { count: 5, reward: "Ambassador badge", emoji: "🏆", description: "Become a TradeFeed Ambassador" },
  { count: 10, reward: "Lifetime perk", emoji: "👑", description: "Permanent discount on Pro plan" },
];

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

  // Parallel queries: direct referrals, leaderboard, downstream
  const [directReferrals, leaderboardRaw, downstreamShops] = await Promise.all([
    // Direct referrals by this seller
    db.shop.findMany({
      where: { referredBy: shop.slug },
      select: { name: true, slug: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    // Top 10 referrers community-wide
    db.shop.groupBy({
      by: ["referredBy"],
      where: { referredBy: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // Downstream referrals (2nd level: shops referred by my referrals)
    db.shop.findMany({
      where: {
        referredBy: {
          in: await db.shop
            .findMany({
              where: { referredBy: shop.slug },
              select: { slug: true },
            })
            .then((shops) => shops.map((s) => s.slug)),
        },
      },
      select: { name: true, slug: true, referredBy: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const referralCount = directReferrals.length;

  // Resolve leaderboard shop names
  const leaderSlugs = leaderboardRaw.map((l) => l.referredBy).filter(Boolean) as string[];
  const leaderShops = await db.shop.findMany({
    where: { slug: { in: leaderSlugs } },
    select: { name: true, slug: true },
  });
  const slugToName = new Map(leaderShops.map((s) => [s.slug, s.name]));

  const leaderboard = leaderboardRaw.map((l) => ({
    slug: l.referredBy!,
    name: slugToName.get(l.referredBy!) ?? l.referredBy!,
    count: l._count.id,
  }));

  // Current tier progress
  const currentTier = REWARD_TIERS.filter((t) => referralCount >= t.count).pop();
  const nextTier = REWARD_TIERS.find((t) => referralCount < t.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-stone-800 sm:text-xl">🤝 Referral Program</h1>
        <p className="text-sm text-stone-500 mt-1">
          Invite other sellers to TradeFeed and earn rewards
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-emerald-600">{referralCount}</p>
          <p className="text-xs text-stone-500">Direct referrals</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-blue-600">{downstreamShops.length}</p>
          <p className="text-xs text-stone-500">Downstream (2nd level)</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 col-span-2">
          <p className="text-lg font-bold text-stone-800 font-mono">{referralCode}</p>
          <p className="text-xs text-stone-500">Your referral code</p>
        </div>
      </div>

      {/* Invite Card */}
      <ReferralInvite
        referralCode={referralCode}
        shopName={shop.name}
        shopSlug={slug}
      />

      {/* Reward Tiers (A5.4.1) */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-stone-800">🎯 Reward Milestones</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {REWARD_TIERS.map((tier) => {
            const unlocked = referralCount >= tier.count;
            return (
              <div
                key={tier.count}
                className={`rounded-xl border p-3.5 text-center transition-all ${
                  unlocked
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-stone-200 bg-stone-50 opacity-60"
                }`}
              >
                <p className="text-2xl">{tier.emoji}</p>
                <p className={`text-xs font-bold mt-1 ${unlocked ? "text-emerald-700" : "text-stone-500"}`}>
                  {tier.count} referral{tier.count > 1 ? "s" : ""}
                </p>
                <p className={`text-[11px] mt-0.5 ${unlocked ? "text-emerald-600" : "text-stone-400"}`}>
                  {tier.reward}
                </p>
                {unlocked && (
                  <span className="mt-1.5 inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                    ✓ Unlocked
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {nextTier && (
          <p className="text-xs text-stone-500 text-center">
            {nextTier.count - referralCount} more referral{nextTier.count - referralCount > 1 ? "s" : ""} to unlock{" "}
            <span className="font-medium text-stone-700">{nextTier.reward}</span>
          </p>
        )}
        {currentTier && !nextTier && (
          <p className="text-xs text-emerald-600 text-center font-medium">
            🎉 You&apos;ve unlocked all reward tiers! Amazing work.
          </p>
        )}
      </div>

      {/* Leaderboard (A5.4.2) */}
      {leaderboard.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-700">🏅 Top Referrers</h2>
            <p className="text-xs text-stone-400">Community leaderboard</p>
          </div>
          <div className="divide-y divide-stone-50">
            {leaderboard.map((leader, i) => {
              const isMe = leader.slug === shop.slug;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              return (
                <div
                  key={leader.slug}
                  className={`flex items-center justify-between px-4 py-2.5 ${isMe ? "bg-emerald-50/50" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center text-sm">{medal}</span>
                    <span className={`text-sm ${isMe ? "font-bold text-emerald-700" : "text-stone-700"}`}>
                      {leader.name}
                      {isMe && <span className="text-xs text-emerald-500 ml-1">(you)</span>}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-stone-600">
                    {leader.count} referral{leader.count > 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Downstream Referrals (A5.4.3) */}
      {downstreamShops.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-700">🔗 Downstream Referrals</h2>
            <p className="text-xs text-stone-400">
              Sellers referred by your referrals (2nd-level chain)
            </p>
          </div>
          <div className="divide-y divide-stone-50">
            {downstreamShops.map((ds) => (
              <div key={ds.slug} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-stone-700">{ds.name}</p>
                  <p className="text-xs text-stone-400">
                    via {ds.referredBy} • {ds.createdAt.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span className="text-xs text-stone-400">2nd level</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Referrals List */}
      {directReferrals.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white">
          <div className="border-b border-stone-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-700">Your Referrals</h2>
          </div>
          <div className="divide-y divide-stone-50">
            {directReferrals.map((ref) => (
              <div key={ref.slug} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-stone-700">{ref.name}</p>
                  <p className="text-xs text-stone-400">@{ref.slug}</p>
                </div>
                <span className="text-xs text-stone-400">
                  {ref.createdAt.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
        <h2 className="font-semibold text-stone-800">How it works</h2>
        <div className="space-y-3">
          {[
            { step: "1", title: "Share your invite link", desc: "Send your referral link to other sellers via WhatsApp" },
            { step: "2", title: "They sign up & create a shop", desc: "When they create a shop using your link, they're linked to you" },
            { step: "3", title: "Earn rewards at each milestone", desc: "1 referral = 1 free month, 3 = 2 months, 5 = Ambassador badge 🏆" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-emerald-600">{item.step}</span>
              </div>
              <div>
                <p className="font-medium text-stone-800 text-sm">{item.title}</p>
                <p className="text-xs text-stone-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
