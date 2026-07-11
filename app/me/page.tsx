import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  Heart,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { BuyerAccountShell } from "@/components/buyer/buyer-account-shell";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { formatZAR } from "@/lib/config/promotions";
import {
  getBuyerHomeSummary,
  getBuyerSavedProducts,
  getFollowedFeed,
  getFollowedShops,
  getOrCreateBuyerProfile,
} from "@/lib/db/buyers";

export const metadata: Metadata = {
  title: "My TradeFeed | Your Shopping Hub",
  description: "Track orders, revisit saved products, and discover new arrivals from shops you follow.",
};

export default async function BuyerHomePage() {
  if (!FEATURE_FLAGS.SHOP_FOLLOW || !FEATURE_FLAGS.BUYER_ACCOUNTS) notFound();
  const { userId } = await auth();

  if (!userId) {
    return <BuyerAccountShell><GuestWelcome /></BuyerAccountShell>;
  }

  const buyer = await getOrCreateBuyerProfile(userId);
  const [shops, feed, savedProducts, summary] = await Promise.all([
    getFollowedShops(buyer.id),
    getFollowedFeed(buyer.id),
    getBuyerSavedProducts(userId, 8),
    getBuyerHomeSummary(userId, buyer.id),
  ]);
  const firstName = buyer.displayName?.trim().split(/\s+/)[0];

  return (
    <BuyerAccountShell>
      <section className="relative mb-6 overflow-hidden rounded-[28px] border border-emerald-400/15 bg-gradient-to-br from-emerald-950 via-[#10221d] to-stone-950 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:p-7 lg:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
              <Sparkles className="size-3.5" /> Your personal marketplace
            </div>
            <h1 className="max-w-xl text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              {firstName ? `Welcome back, ${firstName}` : "Welcome to My TradeFeed"}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50/65 sm:text-[15px]">
              Everything you care about—orders, saved finds, favourite shops, and fresh arrivals—in one calm place.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-400 px-4 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-300">
                <Search className="size-4" /> Explore marketplace
              </Link>
              <Link href="/orders" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10">
                View orders <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <HeroMetric icon={<Package className="size-4" />} label="Active orders" value={summary.activeOrders} href="/orders" />
            <HeroMetric icon={<Bell className="size-4" />} label="Unread alerts" value={summary.unreadNotifications} href="/me/notifications" />
            <HeroMetric icon={<Heart className="size-4" />} label="Saved items" value={summary.savedProducts} href="#saved" />
            <HeroMetric icon={<Store className="size-4" />} label="Shops followed" value={shops.length} href="#following" />
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <QuickAction href="/orders" icon={<Package className="size-4" />} label="Track orders" detail="Delivery and collection" />
        <QuickAction href="/me/notifications" icon={<Bell className="size-4" />} label="Notifications" detail="Messages and alerts" badge={summary.unreadNotifications} />
        <QuickAction href="/me/activity" icon={<Activity className="size-4" />} label="Recent activity" detail="Your shopping history" />
        <QuickAction href="/me/account" icon={<UserRound className="size-4" />} label="Account" detail="Addresses and settings" />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-10">
          <section id="following">
            <SectionHeader eyebrow="Your circle" title="Shops you follow" href="/marketplace" linkLabel="Find more" />
            {shops.length === 0 ? (
              <EmptyState icon={<Store className="size-5" />} title="Build your favourite-shop list" detail="Follow shops to see their latest products and stock drops here." action="Browse shops" href="/marketplace" />
            ) : (
              <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
                {shops.map((shop) => (
                  <Link key={shop.id} href={`/catalog/${shop.slug}`} className="group flex w-[210px] shrink-0 items-center gap-3 rounded-2xl border border-stone-800/70 bg-stone-900/55 p-3 transition hover:-translate-y-0.5 hover:border-emerald-500/35 hover:bg-stone-900">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-stone-700/60 bg-stone-800">
                      {shop.logoUrl ? <Image src={shop.logoUrl} alt={shop.name} fill sizes="48px" className="object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex size-full items-center justify-center text-lg font-bold text-stone-500">{shop.name.charAt(0).toUpperCase()}</div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-100">{shop.name}</p>
                      <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-stone-500"><MapPin className="size-3" />{shop.city ?? shop.province ?? "South Africa"}</p>
                    </div>
                    <ChevronRight className="size-4 text-stone-700 transition group-hover:translate-x-0.5 group-hover:text-emerald-400" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader eyebrow="Fresh for you" title="New from followed shops" href="/marketplace" linkLabel="Explore all" />
            {feed.items.length === 0 ? (
              <EmptyState icon={<Sparkles className="size-5" />} title="Your feed is ready for fresh finds" detail={shops.length === 0 ? "Follow a few shops and their new products will appear here." : "Nothing new today. Check back soon for the next drop."} action="Explore marketplace" href="/marketplace" />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {feed.items.slice(0, 12).map((item) => (
                  <BuyerProductCard key={item.id} href={`/catalog/${item.shop.slug}/products/${item.id}`} name={item.name} imageUrl={item.imageUrl} minPriceCents={item.minPriceCents} maxPriceCents={item.maxPriceCents} shop={item.shop} badge="New" />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-36">
          <section id="saved" className="rounded-3xl border border-stone-800/70 bg-stone-900/45 p-4 sm:p-5">
            <SectionHeader eyebrow="Saved for later" title="Your favourites" href="#saved" linkLabel={`${summary.savedProducts} saved`} compact />
            {savedProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-700/70 px-4 py-8 text-center"><Heart className="mx-auto size-6 text-stone-600" /><p className="mt-3 text-sm font-medium text-stone-300">No saved products yet</p><p className="mt-1 text-xs leading-5 text-stone-500">Tap the heart on any product to keep it close.</p></div>
            ) : (
              <div className="space-y-2.5">
                {savedProducts.slice(0, 4).map((product) => (
                  <Link key={product.id} href={`/catalog/${product.shop.slug}/products/${product.slug ?? product.id}`} className="group flex items-center gap-3 rounded-2xl border border-stone-800/60 bg-stone-950/50 p-2.5 transition hover:border-emerald-500/30">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-stone-800">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex size-full items-center justify-center"><Heart className="size-5 text-stone-600" /></div>}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-stone-200">{product.name}</p><p className="mt-0.5 truncate text-[11px] text-stone-500">{product.shop.name}</p><p className="mt-1 text-sm font-bold text-emerald-400">{formatZAR(product.minPriceCents)}</p></div>
                    <ArrowUpRight className="size-4 text-stone-700 transition group-hover:text-emerald-400" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-stone-800/70 bg-gradient-to-br from-stone-900 to-stone-950 p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"><ShieldCheck className="size-5" /></div>
            <h2 className="mt-4 text-base font-bold text-stone-100">Your shopping, organised</h2>
            <p className="mt-2 text-xs leading-5 text-stone-500">Manage delivery addresses, alert preferences, and account security from one private space.</p>
            <Link href="/me/account" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300">Open account settings <ArrowRight className="size-3.5" /></Link>
          </section>
        </aside>
      </div>
    </BuyerAccountShell>
  );
}

function GuestWelcome() {
  return <div className="mx-auto max-w-xl py-16 text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10"><Heart className="size-7 text-emerald-400" /></div><h1 className="mt-6 text-3xl font-black tracking-tight">Your favourite shops, together</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-400">Sign in to save products, follow sellers, track orders, and receive useful alerts.</p><Link href="/whatsapp-login" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-bold text-emerald-950">Sign in with WhatsApp <ArrowRight className="size-4" /></Link></div>;
}

function HeroMetric({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: number; href: string }) {
  return <Link href={href} className="group rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur transition hover:border-emerald-300/30 hover:bg-white/[0.09]"><div className="flex items-center justify-between text-emerald-200/70"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-300/10">{icon}</span><ArrowUpRight className="size-3.5 opacity-40 transition group-hover:opacity-100" /></div><p className="mt-3 text-2xl font-black tabular-nums text-white">{value}</p><p className="mt-0.5 text-[11px] text-emerald-50/50">{label}</p></Link>;
}

function QuickAction({ href, icon, label, detail, badge }: { href: string; icon: React.ReactNode; label: string; detail: string; badge?: number }) {
  return <Link href={href} className="group relative flex min-h-[92px] flex-col justify-between rounded-2xl border border-stone-800/70 bg-stone-900/45 p-3.5 transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:bg-stone-900"><div className="flex items-center justify-between"><span className="flex size-8 items-center justify-center rounded-lg bg-stone-800 text-emerald-400 transition group-hover:bg-emerald-500/10">{icon}</span>{badge ? <span className="flex min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1.5 py-0.5 text-[10px] font-black text-emerald-950">{badge > 9 ? "9+" : badge}</span> : <ChevronRight className="size-3.5 text-stone-700 group-hover:text-emerald-400" />}</div><div><p className="text-xs font-bold text-stone-200 sm:text-sm">{label}</p><p className="mt-0.5 hidden text-[10px] text-stone-500 sm:block">{detail}</p></div></Link>;
}

function SectionHeader({ eyebrow, title, href, linkLabel, compact = false }: { eyebrow: string; title: string; href: string; linkLabel: string; compact?: boolean }) {
  return <div className={compact ? "mb-4" : "mb-4 flex items-end justify-between gap-4"}><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500/70">{eyebrow}</p><h2 className="mt-1 text-lg font-bold tracking-tight text-stone-100 sm:text-xl">{title}</h2></div><Link href={href} className={`${compact ? "mt-1 inline-flex" : "inline-flex"} items-center gap-1 text-[11px] font-semibold text-stone-500 transition hover:text-emerald-400`}>{linkLabel}<ChevronRight className="size-3" /></Link></div>;
}

function EmptyState({ icon, title, detail, action, href }: { icon: React.ReactNode; title: string; detail: string; action: string; href: string }) {
  return <div className="rounded-3xl border border-dashed border-stone-800 bg-stone-900/25 px-5 py-10 text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-stone-900 text-emerald-400">{icon}</div><h3 className="mt-4 text-sm font-bold text-stone-200">{title}</h3><p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-stone-500">{detail}</p><Link href={href} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">{action}<ArrowRight className="size-3.5" /></Link></div>;
}

function BuyerProductCard({ href, name, imageUrl, minPriceCents, maxPriceCents, shop, badge }: { href: string; name: string; imageUrl: string | null; minPriceCents: number; maxPriceCents: number; shop: { name: string; isVerified: boolean }; badge?: string }) {
  return <Link href={href} className="group overflow-hidden rounded-2xl border border-stone-800/70 bg-stone-900/50 transition hover:-translate-y-1 hover:border-emerald-500/35 hover:shadow-[0_18px_45px_rgba(0,0,0,0.3)]"><div className="relative aspect-[4/5] overflow-hidden bg-stone-900">{imageUrl ? <Image src={imageUrl} alt={name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px" className="object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex size-full items-center justify-center"><Package className="size-7 text-stone-700" /></div>}{badge && <span className="absolute left-2.5 top-2.5 rounded-full bg-emerald-400 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-950 shadow-lg">{badge}</span>}<span className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur"><Heart className="size-3.5" /></span></div><div className="p-3.5"><p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-stone-100">{name}</p><p className="mt-1 flex items-center gap-1 truncate text-[11px] text-stone-500">{shop.name}{shop.isVerified && <BadgeCheck className="size-3 text-emerald-500" />}</p><p className="mt-2 text-base font-black text-emerald-400">{formatZAR(minPriceCents)}{maxPriceCents > minPriceCents && <span className="ml-0.5 text-[10px] font-medium text-stone-500">+</span>}</p></div></Link>;
}
