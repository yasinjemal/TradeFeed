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
import { getReferralRewards } from "@/lib/db/referrals";
import { notFound } from "next/navigation";
import { ReferralInvite } from "@/components/dashboard/referral-invite";

interface ReferralPageProps {
  params: Promise<{ slug: string }>;
}

// Single reward tier — aligned with backend (lib/db/referrals.ts): 1 free month per referred shop that upgrades
const REWARD = {
  reward: "1 free month of Pro",
  emoji: "🎁",
  description: "When a seller you referred upgrades to Pro, we add 1 free month to your Pro subscription.",
};

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  // Generate referral code if not yet set
  let referralCode = (shop as { referralCode?: string | null }).referralCode;
  if (!referralCode) {
    const { randomBytes } = await import("crypto");
    const suffix = randomBytes(3).toString("hex").slice(0, 4).toUpperCase();
    const code = `TF-${shop.slug.slice(0, 3).toUpperCase()}${suffix}`;
    await db.shop.update({
      where: { id: shop.id },
      data: { referralCode: code },
    });
    referralCode = code;
  }

  // Parallel queries: direct referrals, leaderboard, downstream, rewards
  const [directReferrals, leaderboardRaw, downstreamShops, rewards] = await Promise.all([
    // Direct referrals by this seller
    db.shop.findMany({
      where: { referredBy: shop.slug },
      select: { id: true, name: true, slug: true, createdAt: true },
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
    // Rewards earned
    getReferralRewards(shop.id),
  ]);

  const referralCount = directReferrals.length;
  const rewardsEarned = rewards.length;
  const rewardedShopIds = new Set(rewards.map((r) => r.referredShop.slug));

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
          <p className="text-2xl font-bold text-amber-600">{rewardsEarned}</p>
          <p className="text-xs text-stone-500">Months earned</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-2xl font-bold text-blue-600">{downstreamShops.length}</p>
          <p className="text-xs text-stone-500">Downstream (2nd level)</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
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

      {/* Reward — aligned with backend: 1 free month per referred shop that upgrades */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-3">
        <h2 className="font-semibold text-stone-800">🎯 Your reward</h2>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <span className="text-2xl">{REWARD.emoji}</span>
          <div>
            <p className="font-medium text-emerald-800">{REWARD.reward}</p>
            <p className="text-sm text-stone-600 mt-0.5">{REWARD.description}</p>
            <p className="text-xs text-stone-500 mt-2">
              You have <strong>{referralCount}</strong> direct referral{referralCount !== 1 ? "s" : ""}. Each one who upgrades to Pro earns you 1 extra month.
            </p>
          </div>
        </div>
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
            {directReferrals.map((ref) => {
              const wasRewarded = rewardedShopIds.has(ref.slug);
              return (
                <div key={ref.slug} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-700">{ref.name}</p>
                      {wasRewarded ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                          +1 month earned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                          Pending upgrade
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">@{ref.slug}</p>
                  </div>
                  <span className="text-xs text-stone-400">
                    {ref.createdAt.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              );
            })}
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
            { step: "3", title: "Earn 1 free month when they upgrade", desc: "When a referred seller upgrades to Pro, we add 1 free month to your Pro subscription." },
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
