// ============================================================
// Buyer Profile — /me
// ============================================================
// Lightweight phone-based buyer home: shops you follow and
// "new from shops you follow" feed. No password — buyers sign
// in via WhatsApp magic link.
//
// Gated behind FEATURE_FLAGS.SHOP_FOLLOW + BUYER_ACCOUNTS.
// Mobile-first, server-rendered, no client JS beyond links.
// ============================================================

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { BuyerAccountShell } from "@/components/buyer/buyer-account-shell";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import {
  getOrCreateBuyerProfile,
  getFollowedShops,
  getFollowedFeed,
  getBuyerSavedProducts,
} from "@/lib/db/buyers";
import { formatZAR } from "@/lib/config/promotions";

export const metadata: Metadata = {
  title: "My TradeFeed | Shops You Follow",
  description: "Your saved shops and the newest products from sellers you follow.",
};

export default async function BuyerHomePage() {
  if (!FEATURE_FLAGS.SHOP_FOLLOW || !FEATURE_FLAGS.BUYER_ACCOUNTS) {
    notFound();
  }

  const { userId } = await auth();

  // ── Guest: WhatsApp sign-in prompt ──────────────────────
  if (!userId) {
    return (
      <PageShell>
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2 text-stone-100">
            Follow your favourite shops
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
            Sign in with WhatsApp — no password needed — to follow shops and see
            their newest products here.
          </p>
          <Link
            href="/whatsapp-login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
          >
            Sign in with WhatsApp
          </Link>
        </div>
      </PageShell>
    );
  }

  // ── Signed-in buyer ─────────────────────────────────────
  const buyer = await getOrCreateBuyerProfile(userId);
  const [shops, feed, savedProducts] = await Promise.all([
    getFollowedShops(buyer.id),
    getFollowedFeed(buyer.id),
    getBuyerSavedProducts(userId),
  ]);

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-100">My TradeFeed</h1>
          <p className="text-stone-400 text-sm mt-1">
            {shops.length === 0
              ? "Follow shops to see their newest products here."
              : `Following ${shops.length} shop${shops.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link
          href="/orders"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          My Orders →
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/orders" className="rounded-2xl border border-stone-800/50 bg-stone-900/40 p-4 transition-colors hover:border-emerald-500/30">
          <p className="text-xs font-medium text-stone-400">Orders</p>
          <p className="mt-1 text-sm font-semibold text-stone-100">Track purchases</p>
        </Link>
        <a href="#saved" className="rounded-2xl border border-stone-800/50 bg-stone-900/40 p-4 transition-colors hover:border-emerald-500/30">
          <p className="text-xs font-medium text-stone-400">Saved</p>
          <p className="mt-1 text-sm font-semibold text-stone-100">{savedProducts.length} product{savedProducts.length === 1 ? "" : "s"}</p>
        </a>
        <a href="#following" className="col-span-2 rounded-2xl border border-stone-800/50 bg-stone-900/40 p-4 transition-colors hover:border-emerald-500/30 sm:col-span-1">
          <p className="text-xs font-medium text-stone-400">Following</p>
          <p className="mt-1 text-sm font-semibold text-stone-100">{shops.length} shop{shops.length === 1 ? "" : "s"}</p>
        </a>
        <Link href="/me/notifications" className="col-span-2 rounded-2xl border border-stone-800/50 bg-stone-900/40 p-4 transition-colors hover:border-emerald-500/30 sm:col-span-1">
          <p className="text-xs font-medium text-stone-400">Notifications</p>
          <p className="mt-1 text-sm font-semibold text-stone-100">Manage alerts</p>
        </Link>
      </div>

      <section id="saved" className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-400">Saved products</h2>
          {savedProducts.length > 0 && <span className="text-xs text-stone-500">Across your shops</span>}
        </div>
        {savedProducts.length === 0 ? (
          <div className="rounded-2xl border border-stone-800/30 bg-stone-900/30 px-4 py-5 text-sm text-stone-500">Tap the heart on a product to save it here.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {savedProducts.map((product) => (
              <Link key={product.id} href={`/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`} className="overflow-hidden rounded-2xl border border-stone-800/40 bg-stone-900/60 transition-colors hover:border-emerald-500/30">
                <div className="relative aspect-square bg-stone-900">
                  {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" /> : <div className="flex size-full items-center justify-center text-2xl text-stone-700">♡</div>}
                </div>
                <div className="p-3"><p className="truncate text-xs font-medium text-stone-200">{product.name}</p><p className="mt-0.5 truncate text-[11px] text-stone-500">{product.shop.name}</p><p className="mt-1 text-sm font-semibold text-emerald-400">{formatZAR(product.minPriceCents)}</p></div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Followed shops strip ───────────────────────────── */}
      {shops.length > 0 && (
        <div id="following" className="mb-10">
          <h2 className="text-sm font-semibold text-stone-400 mb-3">Shops you follow</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/catalog/${shop.slug}`}
                className="flex-shrink-0 w-24 text-center group"
              >
                <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/60 group-hover:border-emerald-500/40 transition-colors relative">
                  {shop.logoUrl ? (
                    <Image src={shop.logoUrl} alt={shop.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-stone-600">
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-stone-400 truncate group-hover:text-stone-200 transition-colors">
                  {shop.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── New from shops you follow ──────────────────────── */}
      <h2 className="text-sm font-semibold text-stone-400 mb-3">
        New from shops you follow
      </h2>

      {feed.items.length === 0 ? (
        <div className="text-center py-14 rounded-2xl bg-stone-900/40 border border-stone-800/30">
          <p className="text-stone-500 text-sm mb-4">
            {shops.length === 0
              ? "You're not following any shops yet."
              : "Nothing new yet — check back soon."}
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {feed.items.map((item) => (
            <Link
              key={item.id}
              href={`/catalog/${item.shop.slug}/products/${item.id}`}
              className="rounded-2xl overflow-hidden bg-stone-900/60 border border-stone-800/40 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="aspect-square relative bg-stone-900">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-stone-700">📦</div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-stone-200 font-medium truncate">{item.name}</p>
                <p className="text-[11px] text-stone-500 truncate mt-0.5">
                  {item.shop.name}
                  {item.shop.isVerified && <span className="text-emerald-500"> ✓</span>}
                </p>
                <p className="text-sm font-bold text-emerald-400 mt-1">
                  {formatZAR(item.minPriceCents)}
                  {item.maxPriceCents > item.minPriceCents && <span className="text-stone-500 font-normal text-[11px]">+</span>}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <BuyerAccountShell width="max-w-2xl">{children}</BuyerAccountShell>;
}
