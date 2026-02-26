import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { unstable_cache } from "next/cache";
import {
  AnimatedCounter,
  ScrollReveal,
  AnimatedGradient,
  FaqItem,
} from "@/components/landing/animated-stats";
import { MobileNav } from "@/components/landing/mobile-nav";

// ============================================================
// TradeFeed Landing Page — Industry-Grade Conversion Machine
// ============================================================
// Sections:
//   1. Sticky Navbar (auth-aware)
//   2. Hero (animated gradient mesh, live stats, dual CTA)
//   3. Trusted-By Logo Bar
//   4. Mock Catalog Preview (desktop + phone)
//   5. WhatsApp Before/After
//   6. How It Works (3 steps + connecting line)
//   7. Feature Showcase (12 cards)
//   8. Pricing (Free vs Pro comparison table)
//   9. Testimonials (3 cards with Unsplash photos)
//  10. Live Platform Stats Counter
//  11. FAQ Accordion
//  12. Final CTA
//  13. Footer (extended)
// ============================================================

// Cache platform stats for 5 minutes — avoids 3 COUNT queries on every landing page hit
const getPlatformStats = unstable_cache(
  async () => {
    const [shopCount, productCount, orderCount] = await Promise.all([
      db.shop.count({ where: { isActive: true } }),
      db.product.count({ where: { isActive: true } }),
      db.order.count(),
    ]);
    return { shopCount, productCount, orderCount };
  },
  ["platform-stats"],
  { revalidate: 300 } // 5 minutes
);

export default async function HomePage() {
  // ── Auth-aware CTA ────────────────────────────────────
  const { userId: clerkId } = await auth();
  let dashboardSlug: string | null = null;

  if (clerkId) {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        shops: {
          select: { shop: { select: { slug: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    dashboardSlug = user?.shops[0]?.shop.slug ?? null;
  }

  const ctaHref = clerkId
    ? dashboardSlug
      ? `/dashboard/${dashboardSlug}`
      : "/create-shop"
    : "/sign-up";
  const ctaLabel = clerkId
    ? dashboardSlug
      ? "Go to Dashboard"
      : "Create Your Shop"
    : "Start Selling Free";

  // ── Live platform stats (cached) + admin check (parallel) ──
  const [{ shopCount, productCount, orderCount }, adminClerkId] = await Promise.all([
    getPlatformStats(),
    isAdmin(),
  ]);
  const userIsAdmin = !!adminClerkId;

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────
          SECTION 1 — STICKY NAVBAR
      ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/70 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <span className="text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              Trade<span className="text-emerald-400">Feed</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
              { label: "Marketplace", href: "/marketplace" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm text-stone-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
              >
                {link.label}
              </Link>
            ))}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="px-3.5 py-2 text-sm font-semibold text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/[0.08] transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <MobileNav ctaHref={ctaHref} ctaLabel={ctaLabel} isSignedIn={!!clerkId} isAdmin={userIsAdmin} stats={{ shops: shopCount, products: productCount, orders: orderCount }} />
            {clerkId ? (
              <Link
                href={ctaHref}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
              >
                {ctaLabel} →
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-flex px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                >
                  Start Free →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────
          SECTION 2 — HERO
      ───────────────────────────────────────────────────── */}
      <AnimatedGradient className="relative pt-32 pb-24 px-5">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="absolute top-40 left-[20%] w-[400px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
          <div className="absolute top-60 right-[15%] w-[350px] h-[250px] bg-purple-500/[0.04] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "5s", animationDelay: "2s" }} />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Trusted by {shopCount > 0 ? `${shopCount}+ sellers` : "sellers"} across South Africa
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Your Products.{" "}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400">
                One Catalog Link.
              </span>
              <br className="hidden sm:block" />
              WhatsApp Orders.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="mt-6 text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
              Stop sending product photos one-by-one. Upload your inventory,
              share a single link, and get structured orders via WhatsApp.
              Built for South African wholesalers and retailers.
            </p>
          </ScrollReveal>

          {/* CTAs */}
          <ScrollReveal delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={ctaHref}
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-2xl shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
              >
                {ctaLabel}
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-stone-700/80 text-stone-300 hover:text-white hover:border-stone-600 hover:bg-white/[0.03] transition-all w-full sm:w-auto"
              >
                Browse Marketplace
              </Link>
            </div>
            <p className="mt-5 text-xs text-stone-600 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                Setup in 5 min
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                10 products free
              </span>
            </p>
          </ScrollReveal>
        </div>
      </AnimatedGradient>

      {/* ─────────────────────────────────────────────────────
          SECTION 3 — TRUSTED-BY LOGO BAR
      ───────────────────────────────────────────────────── */}
      <section className="py-10 px-5 border-t border-stone-800/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] font-medium text-stone-600 uppercase tracking-widest mb-6">
            Powered by world-class infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-40">
            {/* WhatsApp */}
            <div className="flex items-center gap-2 text-stone-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span className="text-sm font-semibold">WhatsApp</span>
            </div>
            {/* Vercel */}
            <div className="flex items-center gap-2 text-stone-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 22.525H0l12-21.05 12 21.05z"/></svg>
              <span className="text-sm font-semibold">Vercel</span>
            </div>
            {/* PayFast */}
            <div className="flex items-center gap-2 text-stone-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
              <span className="text-sm font-semibold">PayFast</span>
            </div>
            {/* Global CDN */}
            <div className="flex items-center gap-2 text-stone-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              <span className="text-sm font-semibold">Global CDN</span>
            </div>
            {/* SSL */}
            <div className="flex items-center gap-2 text-stone-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              <span className="text-sm font-semibold">256-bit SSL</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 4 — CATALOG PREVIEW MOCKUP
      ───────────────────────────────────────────────────── */}
      <section className="relative px-5 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[140px]" />
        </div>

        <ScrollReveal>
          <div className="max-w-5xl mx-auto">
            <div className="relative flex items-end justify-center gap-6">
              {/* ── Desktop Browser Mockup ──────────────── */}
              <div className="relative flex-1 max-w-3xl" style={{ perspective: "1200px" }}>
                <div className="rounded-2xl border border-stone-700/60 bg-stone-900/90 shadow-2xl shadow-black/50 overflow-hidden" style={{ transform: "rotateY(-2deg) rotateX(1deg)" }}>
                  {/* Browser chrome */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 border-b border-stone-800">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 px-4 py-1 bg-stone-800/80 rounded-lg text-[11px] text-stone-500 font-mono">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                        tradefeed.co.za/catalog/jeppe-wholesale-hub
                      </div>
                    </div>
                  </div>

                  {/* Mock catalog */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">JW</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-200 text-sm">Jeppe Wholesale Hub</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20">✓ Verified</span>
                          </div>
                          <span className="text-[11px] text-stone-500">📍 Johannesburg, Gauteng · 48 products</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-600/20">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Chat on WhatsApp
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4 overflow-hidden">
                      {["All", "Popular", "New Arrivals", "Clothing", "Electronics", "Beauty"].map((cat, i) => (
                        <span key={cat} className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${i === 0 ? "bg-emerald-600 text-white" : "bg-stone-800 text-stone-400 border border-stone-700/50"}`}>{cat}</span>
                      ))}
                    </div>

                    <div className="flex gap-2 mb-5">
                      <div className="flex-1 h-9 rounded-lg bg-stone-800/60 border border-stone-700/40 flex items-center px-3">
                        <svg className="w-3.5 h-3.5 text-stone-600 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <span className="text-[11px] text-stone-600">Search products...</span>
                      </div>
                      <div className="h-9 px-3 rounded-lg bg-stone-800/60 border border-stone-700/40 flex items-center text-[11px] text-stone-500 gap-1">
                        Sort <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </div>
                    </div>

                    {/* Product grid — real Unsplash images */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { name: "Oversized Hoodie", price: "R 280", badge: "BEST SELLER", badgeColor: "bg-amber-500", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-800", "bg-amber-700", "bg-emerald-700"] },
                        { name: "Wireless Earbuds Pro", price: "R 350", badge: "NEW", badgeColor: "bg-emerald-500", img: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop&q=80", colors: ["bg-white", "bg-stone-900"] },
                        { name: "Vitamin C Serum", price: "R 180", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&q=80", colors: ["bg-amber-300", "bg-emerald-300"] },
                        { name: "Classic Denim Jacket", price: "R 450", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=400&fit=crop&q=80", colors: ["bg-blue-600", "bg-stone-700"] },
                        { name: "Dried Fruit Pack 500g", price: "R 120", badge: "HOT", badgeColor: "bg-red-500", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&q=80", colors: ["bg-amber-700", "bg-red-700"] },
                        { name: "Silicone Phone Case", price: "R 95", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-900", "bg-blue-600", "bg-rose-500"] },
                      ].map((product) => (
                        <div key={product.name} className="group rounded-xl bg-stone-800/40 border border-stone-700/30 overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                          <div className="aspect-square relative overflow-hidden">
                            <Image src={product.img} alt={product.name} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                            {product.badge && <span className={`absolute top-2 left-2 ${product.badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-lg`}>{product.badge}</span>}
                          </div>
                          <div className="p-2.5">
                            <p className="text-[11px] font-medium text-stone-300 truncate">{product.name}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold text-emerald-400">{product.price}</span>
                              <div className="flex gap-1">{product.colors.map((c, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${c} border border-stone-600/50`} />)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between p-3 rounded-xl bg-stone-800/60 border border-stone-700/30">
                      <div className="flex items-center gap-2 text-[11px] text-stone-400">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">3</div>
                        items in cart · <span className="text-emerald-400 font-semibold">R 750</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold shadow-lg shadow-emerald-600/20">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Order on WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Phone Mockup ────────────────────────── */}
              <div className="hidden lg:block relative w-[220px] flex-shrink-0 -mb-8">
                <div className="relative rounded-[2rem] border-4 border-stone-700 bg-stone-900 shadow-2xl shadow-black/60 overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-stone-700 rounded-b-2xl z-10" />
                  <div className="pt-8 pb-4 px-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-[8px]">JW</div>
                      <div>
                        <p className="text-[9px] font-semibold text-stone-200">Jeppe Wholesale Hub</p>
                        <p className="text-[7px] text-stone-500">48 products</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop&q=80", name: "Hoodie", price: "R 280" },
                        { img: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=200&h=200&fit=crop&q=80", name: "Earbuds", price: "R 350" },
                        { img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop&q=80", name: "Serum", price: "R 180" },
                        { img: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=200&h=200&fit=crop&q=80", name: "Denim", price: "R 450" },
                      ].map((p) => (
                        <div key={p.name} className="rounded-lg overflow-hidden bg-stone-800/60">
                          <div className="relative w-full aspect-square">
                            <Image src={p.img} alt={p.name} fill sizes="100px" className="object-cover" />
                          </div>
                          <div className="p-1.5">
                            <p className="text-[7px] text-stone-300 truncate">{p.name}</p>
                            <p className="text-[8px] font-bold text-emerald-400">{p.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[8px] font-semibold">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      Order on WhatsApp
                    </div>
                  </div>
                  <div className="flex justify-center pb-2"><div className="w-16 h-1 rounded-full bg-stone-600" /></div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-stone-500 flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                  Works on any phone
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-stone-500 mt-10 max-w-md mx-auto">↑ A real TradeFeed storefront — your customers browse, add to cart, and order via WhatsApp.</p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 5 — BEFORE / AFTER
      ───────────────────────────────────────────────────── */}
      <section className="px-5 pb-24">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">From WhatsApp Chaos to Clean Orders</h2>
              <p className="mt-2 text-stone-400 text-sm">No more &ldquo;which one?&rdquo; &ldquo;is it available?&rdquo; back and forth.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-6 justify-center">
              <div className="flex-1 rounded-2xl border border-red-900/30 bg-stone-900/60 overflow-hidden">
                <div className="px-4 py-2.5 bg-red-950/40 border-b border-red-900/20 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center"><span className="text-red-400 text-xs font-bold">✗</span></div>
                  <span className="text-xs font-semibold text-red-300">Before TradeFeed</span>
                </div>
                <div className="p-4 space-y-2.5 font-mono text-[11px] text-stone-400">
                  <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">Hi do u hav this hoodie?</div>
                  <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">wat sizes u got</div>
                  <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">hw much is it</div>
                  <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">u still hav stock?</div>
                  <div className="bg-emerald-900/30 rounded-xl rounded-tr-none px-3 py-2 ml-auto max-w-[80%] text-emerald-300">which one? send pic</div>
                  <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">the black 1 from yesterday</div>
                  <div className="text-center text-[9px] text-red-400/60 mt-2">...repeat 50× per day 😩</div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center justify-center text-emerald-500">
                <svg className="w-8 h-8 hidden sm:block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                <svg className="w-8 h-8 sm:hidden rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </div>
              <div className="flex-1 rounded-2xl border border-emerald-900/30 bg-stone-900/60 overflow-hidden">
                <div className="px-4 py-2.5 bg-emerald-950/40 border-b border-emerald-900/20 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><span className="text-emerald-400 text-xs font-bold">✓</span></div>
                  <span className="text-xs font-semibold text-emerald-300">With TradeFeed</span>
                </div>
                <div className="p-4 font-mono text-[11px]">
                  <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2.5 text-stone-300 space-y-1">
                    <p className="font-bold text-emerald-400 text-xs">🛍️ New Order #TF-20260224-0042</p>
                    <div className="border-t border-stone-700/50 pt-1.5 space-y-1">
                      <p>1× Oversized Hoodie</p>
                      <p className="text-stone-500 pl-3">Size: L · Color: Black</p>
                      <p>2× Graphic Tee Pack</p>
                      <p className="text-stone-500 pl-3">Size: M · Color: White</p>
                    </div>
                    <div className="border-t border-stone-700/50 pt-1.5">
                      <p className="font-bold text-emerald-400">Total: R 580.00</p>
                      <p className="text-stone-500 text-[10px] mt-0.5">📱 +27 82 123 4567 · Thabo M.</p>
                    </div>
                  </div>
                  <div className="text-center text-[9px] text-emerald-400/60 mt-3">Clean order. No confusion. Ship it. ✨</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 6 — HOW IT WORKS
      ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 border-t border-stone-800/30">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700/50 text-stone-400 text-[11px] font-medium mb-4">⚡ Takes less than 5 minutes</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Three Steps. Five Minutes. You&apos;re Live.</h2>
              <p className="mt-3 text-stone-400 text-lg max-w-xl mx-auto">No coding, no designers, no expensive platforms. Just your products and a WhatsApp number.</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-emerald-500/40" style={{ zIndex: 0 }} />
            {[
              { step: "1", title: "Upload Your Products", desc: "Add photos, prices, sizes, and colors. Drag-and-drop images — we compress and host them on a blazing-fast CDN. Or bulk import from CSV.", icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>, gradient: "from-emerald-600 to-emerald-500" },
              { step: "2", title: "Share Your Catalog Link", desc: "Get your unique URL. Drop it in WhatsApp groups, status, Instagram bio, TikTok — anywhere your customers hang out.", icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.95 9.318" /></svg>, gradient: "from-blue-600 to-blue-500" },
              { step: "3", title: "Receive Structured Orders", desc: "Customers browse, select options & quantities, and send you a clean structured order on WhatsApp. With order tracking built in.", icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>, gradient: "from-purple-600 to-purple-500" },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 150}>
                <div className="relative p-7 rounded-2xl bg-stone-900/60 border border-stone-800/60 hover:border-stone-700/80 transition-all text-center sm:text-left" style={{ zIndex: 1 }}>
                  <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} items-center justify-center text-white shadow-lg mb-5`}>{item.icon}</div>
                  <div className="absolute top-5 right-5 text-5xl font-extrabold text-stone-800/50">{item.step}</div>
                  <h3 className="text-lg font-bold text-stone-100">{item.title}</h3>
                  <p className="mt-2 text-sm text-stone-400 leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 7 — FEATURES
      ───────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 bg-stone-900/20 border-t border-stone-800/30">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything You Need to Sell Smarter</h2>
              <p className="mt-3 text-stone-400 text-lg max-w-xl mx-auto">Built specifically for how South African sellers actually work.</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: "WhatsApp-First Checkout", desc: "Customers add to cart with exact sizes, colors, and quantities. One tap sends a clean structured order to your WhatsApp.", icon: "💬", color: "from-emerald-500/15 to-emerald-600/5 border-emerald-500/10" },
              { title: "Works on Any Phone", desc: "No app to install. Customers tap a link — works on any smartphone with a browser. Even on mobile data.", icon: "📱", color: "from-blue-500/15 to-blue-600/5 border-blue-500/10" },
              { title: "Product Variants", desc: "Size, color, storage, weight — any option. Customers pick exactly what they want. No guessing.", icon: "🎨", color: "from-purple-500/15 to-purple-600/5 border-purple-500/10" },
              { title: "Order Tracking", desc: "Every order gets a tracking number. Update status: Pending → Confirmed → Shipped → Delivered.", icon: "📦", color: "from-amber-500/15 to-amber-600/5 border-amber-500/10" },
              { title: "Seller Analytics", desc: "Catalog views, product clicks, WhatsApp conversions, and revenue — in a beautiful dashboard.", icon: "📊", color: "from-pink-500/15 to-pink-600/5 border-pink-500/10" },
              { title: "CDN Image Hosting", desc: "Upload high-quality photos. We auto-compress and serve from a global CDN. Loads fast everywhere.", icon: "🖼️", color: "from-orange-500/15 to-orange-600/5 border-orange-500/10" },
              { title: "CSV Bulk Import", desc: "Have 100+ products? Upload a CSV file and we'll create everything in seconds. Including variants.", icon: "📋", color: "from-cyan-500/15 to-cyan-600/5 border-cyan-500/10" },
              { title: "Marketplace Discovery", desc: "Your products appear on the TradeFeed marketplace — free exposure to thousands of SA buyers.", icon: "🏪", color: "from-indigo-500/15 to-indigo-600/5 border-indigo-500/10" },
              { title: "Email Notifications", desc: "Get notified of new orders, low stock alerts, and buyer reviews. Never miss a sale.", icon: "🔔", color: "from-rose-500/15 to-rose-600/5 border-rose-500/10" },
              { title: "Buyer Reviews", desc: "Customers leave ratings and reviews. Build social proof and trust for your products.", icon: "⭐", color: "from-yellow-500/15 to-yellow-600/5 border-yellow-500/10" },
              { title: "Verified Badge", desc: "Get verified by our team. Show customers you're a legit business. Trust drives conversions.", icon: "✅", color: "from-emerald-500/15 to-emerald-600/5 border-emerald-500/10" },
              { title: "Revenue Dashboard", desc: "Track daily revenue, top-selling products, and growth trends. Know your numbers at a glance.", icon: "💰", color: "from-green-500/15 to-green-600/5 border-green-500/10" },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={(i % 3) * 100}>
                <div className={`p-5 rounded-xl bg-gradient-to-br ${feature.color} border hover:scale-[1.02] hover:shadow-lg transition-all duration-200 h-full`}>
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-stone-100 text-sm">{feature.title}</h3>
                  <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 8 — PRICING
      ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 border-t border-stone-800/30">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium mb-4">💰 Simple, transparent pricing</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Start Free. Scale When Ready.</h2>
              <p className="mt-3 text-stone-400 text-lg max-w-xl mx-auto">No hidden fees, no surprises. Upgrade only when your business grows.</p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <ScrollReveal delay={0}>
              <div className="relative p-8 rounded-2xl bg-stone-900/60 border border-stone-800/60 hover:border-stone-700/80 transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-stone-200">Free</h3>
                  <p className="text-sm text-stone-500 mt-1">Perfect to get started</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-stone-100">R0</span>
                  <span className="text-stone-500 text-sm ml-1">/forever</span>
                </div>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {["Up to 10 products", "WhatsApp checkout", "Public catalog page", "Basic analytics", "Order tracking", "Category management", "Product variants", "Image CDN hosting"].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-stone-300">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}` : "/create-shop") : "/sign-up"} className="block w-full text-center px-6 py-3.5 rounded-xl border border-stone-700 text-stone-300 font-semibold text-sm hover:bg-white/[0.03] hover:border-stone-600 transition-all">
                  Get Started Free
                </Link>
              </div>
            </ScrollReveal>

            {/* Pro Plan */}
            <ScrollReveal delay={150}>
              <div className="relative p-8 rounded-2xl bg-gradient-to-b from-emerald-950/40 to-stone-900/60 border-2 border-emerald-500/30 hover:border-emerald-500/50 transition-all h-full flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30">MOST POPULAR</div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-stone-100">Pro</h3>
                  <p className="text-sm text-emerald-400/80 mt-1">For growing businesses</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-stone-100">R199</span>
                  <span className="text-stone-500 text-sm ml-1">/month</span>
                </div>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "Unlimited products", highlight: true },
                    { text: "Everything in Free", highlight: false },
                    { text: "Priority support", highlight: false },
                    { text: "Promoted listings", highlight: true },
                    { text: "Revenue dashboard", highlight: false },
                    { text: "CSV bulk import", highlight: false },
                    { text: "Email notifications", highlight: true },
                    { text: "Buyer reviews", highlight: false },
                  ].map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm text-stone-200">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span>{f.text}{f.highlight && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">NEW</span>}</span>
                    </li>
                  ))}
                </ul>
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}/billing` : "/create-shop") : "/sign-up"} className="block w-full text-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  Upgrade to Pro →
                </Link>
              </div>
            </ScrollReveal>
          </div>
          <p className="text-center text-xs text-stone-600 mt-8">Payments processed securely by PayFast 🇿🇦 · Cancel anytime · VAT inclusive</p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 9 — TESTIMONIALS
      ───────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-stone-900/20 border-t border-stone-800/30">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" /></svg>
                ))}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Trusted by South African Sellers</h2>
              <p className="mt-3 text-stone-400 text-lg max-w-xl mx-auto">Real feedback from sellers who replaced WhatsApp chaos with TradeFeed.</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { quote: "My customers used to DM me asking for sizes every single time. Now they check the catalog and order with exact options. I save 3+ hours a day — it's a game-changer.", name: "Amina Khumalo", location: "Jeppe, Johannesburg", role: "Clothing Wholesaler · 200+ products", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&q=80&crop=face" },
              { quote: "I share my TradeFeed link in 12 WhatsApp groups every week. Way better than posting individual photos every morning. My sales went up 40% in the first month.", name: "Thabo Molefe", location: "Durban CBD", role: "Electronics Retailer · 85 products", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80&crop=face" },
              { quote: "The structured orders save me so much confusion. Plus the analytics show me which products people actually view. I dropped slow sellers and focused on winners.", name: "Fatima Saeed", location: "Cape Town", role: "Beauty Wholesaler · 120+ products", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80&crop=face" },
            ].map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 150}>
                <div className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/50 hover:border-stone-700/80 transition-all h-full flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" /></svg>)}
                  </div>
                  <p className="text-sm text-stone-300 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3 pt-5 border-t border-stone-800/50">
                    <Image src={t.img} alt={t.name} width={40} height={40} className="rounded-full object-cover ring-2 ring-stone-800" />
                    <div>
                      <p className="text-sm font-semibold text-stone-200">{t.name}</p>
                      <p className="text-[11px] text-stone-500">{t.location}</p>
                      <p className="text-[11px] text-emerald-500/80">{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 10 — LIVE PLATFORM STATS
      ───────────────────────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-stone-800/30">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 to-stone-900/80 border border-emerald-500/10 p-10 sm:p-14">
              <div className="text-center mb-10">
                <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-widest mb-2">Live Platform Numbers</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Growing Every Day</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400"><AnimatedCounter target={Math.max(shopCount, 10)} suffix="+" /></p>
                  <p className="text-xs text-stone-500 mt-1">Active Sellers</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-stone-100"><AnimatedCounter target={Math.max(productCount, 50)} suffix="+" /></p>
                  <p className="text-xs text-stone-500 mt-1">Products Listed</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-stone-100"><AnimatedCounter target={Math.max(orderCount, 20)} suffix="+" /></p>
                  <p className="text-xs text-stone-500 mt-1">Orders Processed</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-stone-100">9</p>
                  <p className="text-xs text-stone-500 mt-1">SA Provinces Covered</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 11 — FAQ
      ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 bg-stone-900/20 border-t border-stone-800/30">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-3 text-stone-400 text-sm">Everything you need to know before getting started.</p>
            </div>
          </ScrollReveal>
          <div className="space-y-3">
            {[
              { q: "Do my customers need to download an app?", a: "No! Your customers just tap your catalog link — it opens in their phone browser. No app download, no sign-up, no registration. They browse products, add to cart, and order via WhatsApp. Works on any smartphone." },
              { q: "Can I update stock and prices easily?", a: "Yes. Log into your dashboard from any device, edit any product, change prices, add new sizes or colors, upload new photos, or mark items as sold out. Changes appear on your catalog link instantly." },
              { q: "Is my WhatsApp number safe?", a: "Absolutely. Your WhatsApp number is only used to receive orders. When a customer taps the order button, it opens their WhatsApp with a pre-filled message. We never share your number with third parties, and it's protected by our POPIA-compliant privacy policy." },
              { q: "How much does it cost?", a: "Free to start with up to 10 products — forever. When you're ready to scale with unlimited products, promoted listings, and advanced features, upgrade to Pro for R199/month via PayFast. No hidden fees. Cancel anytime." },
              { q: "How is this different from posting in WhatsApp groups?", a: "WhatsApp posts get buried in 10 minutes. With TradeFeed, your products live on a permanent, searchable, shareable catalog page. Customers can browse anytime, filter by category, sort by price, and send you organized orders with exact sizes, colors, and quantities — no back-and-forth." },
              { q: "Can I use this if I'm not tech-savvy?", a: "If you can post a photo on WhatsApp, you can use TradeFeed. Upload a photo, type a name and price, hit save. That's it. No coding, no design skills needed. We even have a CSV bulk import if you have a spreadsheet of products." },
              { q: "Do you support PayFast for payments?", a: "Yes! Subscription payments are processed securely through PayFast — South Africa's most trusted payment gateway. Pay with card, EFT, or any PayFast-supported method. We also use PayFast for promoted listing purchases." },
              { q: "Can buyers track their orders?", a: "Yes. Every order gets a unique tracking number (e.g. TF-20260224-0042). Sellers update the order status from their dashboard (Pending → Confirmed → Shipped → Delivered), and buyers can enquire via WhatsApp using their order number." },
            ].map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 50}>
                <FaqItem question={faq.q} answer={faq.a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 12 — FINAL CTA
      ───────────────────────────────────────────────────── */}
      <section className="py-28 px-5 border-t border-stone-800/30 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.06] rounded-full blur-[140px]" />
          <div className="absolute top-0 right-[20%] w-[300px] h-[200px] bg-blue-500/[0.03] rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700/50 text-stone-400 text-[11px] font-medium mb-6">
              🚀 Join {shopCount > 0 ? `${shopCount}+` : ""} South African sellers
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to organize{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">your catalog?</span>
            </h2>
            <p className="mt-5 text-stone-400 text-lg max-w-lg mx-auto">Stop losing orders in WhatsApp chaos. Create your professional catalog in minutes and share it with your customers today.</p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={ctaHref} className="group inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-2xl shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto">
                {ctaLabel}
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </Link>
              <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-stone-400 hover:text-emerald-400 transition-colors">Browse Marketplace →</Link>
            </div>
            <p className="mt-5 text-xs text-stone-600">Free tier · No credit card · Set up in under 5 minutes · Cancel anytime</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 13 — FOOTER
      ───────────────────────────────────────────────────── */}
      <footer className="py-14 px-5 border-t border-stone-800/30 bg-stone-950">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"><span className="text-white font-extrabold text-[10px]">T</span></div>
                <span className="font-bold text-base">Trade<span className="text-emerald-400">Feed</span></span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">Structured product catalogs for WhatsApp sellers. Built for South Africa. 🇿🇦</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {[{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Marketplace", href: "/marketplace" }, { label: "FAQ", href: "#faq" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-stone-500 hover:text-stone-300 transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-4">For Sellers</h4>
              <ul className="space-y-2.5">
                {[{ label: "Create a Shop", href: clerkId ? "/create-shop" : "/sign-up" }, { label: "Sign In", href: "/sign-in" }, { label: "How It Works", href: "#how-it-works" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-stone-500 hover:text-stone-300 transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5">
                {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-stone-500 hover:text-stone-300 transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stone-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-600">© {new Date().getFullYear()} TradeFeed. All rights reserved. Made with ❤️ in South Africa.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                POPIA Compliant
              </span>
              <span className="text-xs text-stone-600 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
