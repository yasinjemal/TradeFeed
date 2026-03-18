import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth/admin";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { FaqItem } from "@/components/landing/animated-stats";
import { HeroSection } from "@/components/landing/hero-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ProductPreviewSection } from "@/components/landing/product-preview-section";
import { FinalCTASection } from "@/components/landing/final-cta-section";
import { FadeIn } from "@/components/landing/fade-in";
import { MobileNav } from "@/components/landing/mobile-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";
import { generateFaqJsonLd } from "@/lib/seo/json-ld";
import type { Metadata } from "next";

// ============================================================
// Landing Page SEO — targeted for "wholesale marketplace South Africa"
// ============================================================
export const metadata: Metadata = {
  title: "Sell Online South Africa — Create Your Shop & WhatsApp Catalog in 2 Minutes | TradeFeed",
  description:
    "Turn your WhatsApp business into a professional online shop. Upload a photo, AI creates the listing in 10 seconds. Share your catalog link and get orders — no back-and-forth. Free forever. Join 100+ sellers in Johannesburg, Durban, Cape Town & all 9 provinces.",
  keywords: [
    // Primary high-volume
    "sell online South Africa",
    "how to sell online in South Africa",
    "create online shop free South Africa",
    "start online business South Africa",
    "sell on WhatsApp South Africa",
    // Wholesale (money keywords)
    "wholesale Johannesburg",
    "wholesale marketplace South Africa",
    "buy wholesale South Africa",
    "cheap wholesale South Africa",
    "bulk buy South Africa",
    "Jeppe Street wholesale",
    "wholesale suppliers Johannesburg",
    // Product-specific
    "sell products online South Africa",
    "buy products online South Africa",
    "sell shoes online South Africa",
    "wholesale South Africa",
    "sell clothes online South Africa",
    "sell electronics online South Africa",
    // Intent-based
    "online shop South Africa free",
    "WhatsApp catalog South Africa",
    "WhatsApp business South Africa",
    "AI product listing",
    // Reseller / hustle
    "reseller South Africa",
    "side hustle South Africa",
    "sell from home South Africa",
    "township business online",
    "small business South Africa",
    // City-specific
    "sell online Johannesburg",
    "sell online Cape Town",
    "sell online Durban",
    "wholesale Pretoria",
    "wholesale Durban",
    "wholesale Cape Town",
  ],
  alternates: {
    canonical: "https://tradefeed.co.za",
  },
};

// ── FAQ data (used for both UI rendering + JSON-LD schema) ──
const FAQ_ITEMS = [
  { q: "Do my customers need to download an app?", a: "No! Your customers just tap your catalog link — it opens in their phone browser. No app download, no sign-up, no registration. They browse products, add to cart, and order via WhatsApp. Works on any smartphone." },
  { q: "Can I update stock and prices easily?", a: "Yes. Log into your dashboard from any device, edit any product, change prices, add new sizes or colors, upload new photos, or mark items as sold out. Changes appear on your catalog link instantly." },
  { q: "Is my WhatsApp number safe?", a: "Absolutely. Your WhatsApp number is only used to receive orders. When a customer taps the order button, it opens their WhatsApp with a pre-filled message. We never share your number with third parties, and it's protected by our POPIA-compliant privacy policy." },
  { q: "How much does it cost?", a: "Free to start with up to 20 products — forever. When you're ready to scale, upgrade to Starter for R99/month (unlimited products), Pro for R299/month (unlimited AI + team accounts), or Pro AI for R499/month (full AI automation). No hidden fees. Cancel anytime." },
  { q: "How is this different from posting in WhatsApp groups?", a: "WhatsApp posts get buried in 10 minutes. With TradeFeed, your products live on a permanent, searchable, shareable catalog page. Customers can browse anytime, filter by category, sort by price, and send you organized orders with exact sizes, colors, and quantities — no back-and-forth." },
  { q: "Who is TradeFeed for?", a: "Any seller who uses WhatsApp to sell products — whether you're a Jeppe Street wholesaler, a boutique reseller, or selling from home. If your customers DM you for prices and stock — TradeFeed replaces that back-and-forth with a professional catalog link. Works great for clothing, shoes, electronics, beauty products, accessories, and any physical goods." },
  { q: "Can I use this if I'm not tech-savvy?", a: "If you can post a photo on WhatsApp, you can use TradeFeed. Upload a photo, type a name and price, hit save. That's it. No coding, no design skills needed. We even have a bulk import if you have a spreadsheet of products." },
  { q: "Do you support PayFast for payments?", a: "Yes! Subscription payments are processed securely through PayFast — South Africa's most trusted payment gateway. Pay with card, EFT, or any PayFast-supported method. We also use PayFast for promoted listing purchases." },
  { q: "Can buyers track their orders?", a: "Yes. Every order gets a unique tracking number (e.g. TF-20260224-0042). Sellers update the order status from their dashboard (Pending → Confirmed → Shipped → Delivered), and buyers can enquire via WhatsApp using their order number." },
];

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
//   8. Pricing (Free vs Pro vs Pro AI comparison)
//   9. Social Proof (benefit-focused value cards)
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

// Cache featured sellers for 10 minutes — real social proof on the homepage
const getHomepageSellers = unstable_cache(
  async () => {
    const shops = await db.shop.findMany({
      where: {
        isActive: true,
        products: { some: { isActive: true } },
      },
      select: {
        name: true,
        slug: true,
        logoUrl: true,
        city: true,
        isVerified: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: [{ isFeaturedShop: "desc" }, { isVerified: "desc" }, { createdAt: "asc" }],
      take: 12, // fetch more, then filter by quality gate below
    });
    // Quality gate: only show sellers with at least 3 active products
    return shops.filter((s) => s._count.products >= 3).slice(0, 6);
  },
  ["homepage-sellers"],
  { revalidate: 600 } // 10 minutes
);

export default async function HomePage() {
  // ── i18n ──────────────────────────────────────────────
  const tNav = await getTranslations("nav");
  const tLanding = await getTranslations("landing");
  const tCommon = await getTranslations("common");
  const tFooter = await getTranslations("footer");

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
    : "Get Your Catalog Link";

  // ── AI CTA — deep-links to product creation with AI pre-opened ──
  const aiCtaHref = clerkId
    ? dashboardSlug
      ? `/dashboard/${dashboardSlug}/products/new?ai=true`
      : "/create-shop?ai=true"
    : "/sign-up?redirect_url=/dashboard&ai=true";

  // ── Live platform stats (cached) + admin check + sellers (parallel) ──
  const [{ shopCount, productCount, orderCount }, adminClerkId, featuredSellers] = await Promise.all([
    getPlatformStats(),
    isAdmin(),
    getHomepageSellers(),
  ]);
  const userIsAdmin = !!adminClerkId;

  return (
    <main className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────
          SECTION 1 — NAVBAR (Stripe-inspired frosted glass)
      ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <TradeFeedLogo variant="dark" />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: tNav("features"), href: "#features" },
              { label: tNav("pricing"), href: "#pricing" },
              { label: tNav("faq"), href: "#faq" },
              { label: tNav("marketplace"), href: "/marketplace" },
              { label: "Import Catalogue", href: "/import-whatsapp-catalogue" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 text-sm text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all"
              >
                {link.label}
              </Link>
            ))}
            {userIsAdmin && (
              <Link
                href="/admin"
                className="px-3.5 py-2 text-sm font-semibold text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all flex items-center gap-1.5"
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
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <MobileNav ctaHref={ctaHref} ctaLabel={ctaLabel} isSignedIn={!!clerkId} isAdmin={userIsAdmin} stats={{ shops: shopCount, products: productCount, orders: orderCount }} />
            {clerkId ? (
              <Link
                href={ctaHref}
                aria-label={ctaLabel}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
              >
                <span className="hidden sm:inline">{ctaLabel} →</span>
                <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden sm:inline-flex px-4 py-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {tCommon("signIn")}
                </Link>
                <Link
                  href="/sign-up"
                  aria-label="Start Selling Free"
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                >
                  <span className="hidden sm:inline">Start Selling Free →</span>
                  <svg className="w-5 h-5 sm:hidden" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────
          SECTION 2 — HERO
      ───────────────────────────────────────────────────── */}
      <HeroSection
        badge={tLanding("hero.badge", { shopCount: Math.max(shopCount, 50) })}
        title={tLanding("hero.title")}
        titleHighlight={tLanding("hero.titleHighlight")}
        subtitle={tLanding("hero.subtitle")}
        aiOffer={tLanding("hero.aiOffer")}
        ctaLabel={tLanding("hero.cta")}
        ctaHref={aiCtaHref}
        ctaSecondaryLabel={tLanding("hero.ctaSecondary")}
        ctaSecondaryHref="/marketplace"
        benefits={[
          tLanding("hero.benefitAi"),
          tLanding("hero.benefitSpeed"),
          tLanding("hero.benefitWhatsApp"),
        ]}
        proofSellers={tLanding("hero.proofSellers")}
        proofCities={tLanding("hero.proofCities")}
      />

      {/* ─────────────────────────────────────────────────────
          SECTION 3 — SOCIAL PROOF STATS
      ───────────────────────────────────────────────────── */}
      <SocialProofSection
        shopCount={shopCount}
        productCount={productCount}
        orderCount={orderCount}
        labels={{
          title: tLanding("trustedBy.title"),
          activeSellers: tLanding("trustedBy.activeSellers"),
          productsListed: tLanding("trustedBy.productsListed"),
          ordersProcessed: tLanding("trustedBy.ordersProcessed"),
          provinces: tLanding("trustedBy.provinces"),
          ordersViaChat: tLanding("trustedBy.ordersViaChat"),
        }}
      />

      {/* ─────────────────────────────────────────────────────
          SECTION 4 — CATALOG PREVIEW
      ───────────────────────────────────────────────────── */}
      <ProductPreviewSection />

      {/* ─────────────────────────────────────────────────────
          SECTION 4b — FEATURED SELLERS
      ───────────────────────────────────────────────────── */}
      {featuredSellers.length > 0 && (
        <section className="px-6 lg:px-8 py-24 bg-slate-50">
          <FadeIn>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Live sellers
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Sellers Already Growing on TradeFeed</h2>
                <p className="mt-3 text-slate-500 text-lg">Real businesses using AI-powered catalogs to sell on WhatsApp</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {featuredSellers.map((seller) => (
                  <Link
                    key={seller.slug}
                    href={`/catalog/${seller.slug}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                        {seller.logoUrl ? (
                          <Image src={seller.logoUrl} alt={seller.name} width={40} height={40} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <span className="text-white font-bold text-sm">{seller.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{seller.name}</p>
                          {seller.isVerified && (
                            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-500" title="Verified">
                              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {seller.city && `ðŸ“ ${seller.city} · `}{seller._count.products} {seller._count.products === 1 ? "product" : "products"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 group-hover:text-blue-500 transition-colors">Browse catalog →</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Join These Sellers — It&apos;s Free →
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────
          SECTION 5 — FEATURES
      ───────────────────────────────────────────────────── */}
      <FeaturesSection
        title={tLanding("features.title")}
        subtitle={tLanding("features.subtitle")}
        features={[
          { icon: "listing", title: tLanding("features.whatsapp.title"), description: tLanding("features.whatsapp.description") },
          { icon: "inventory", title: tLanding("features.variants.title"), description: tLanding("features.variants.description") },
          { icon: "customers", title: tLanding("features.analytics.title"), description: tLanding("features.analytics.description") },
          { icon: "checkout", title: tLanding("features.tracking.title"), description: tLanding("features.tracking.description") },
        ]}
      />

      {/* ─────────────────────────────────────────────────────
          SECTION 6 — HOW IT WORKS
      ───────────────────────────────────────────────────── */}
      <HowItWorksSection
        badge={tLanding("howItWorks.badge")}
        title={tLanding("howItWorks.title")}
        subtitle={tLanding("howItWorks.subtitle")}
        steps={[
          { title: tLanding("howItWorks.step1Title"), description: tLanding("howItWorks.step1Desc") },
          { title: tLanding("howItWorks.step2Title"), description: tLanding("howItWorks.step2Desc") },
          { title: tLanding("howItWorks.step3Title"), description: tLanding("howItWorks.step3Desc") },
        ]}
      />

      {/* ─────────────────────────────────────────────────────
          SECTION 7 — PRICING
      ───────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-medium mb-4">💰 {tLanding("pricing.badge")}</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{tLanding("pricing.title")}</h2>
              <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">{tLanding("pricing.subtitle")}</p>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <FadeIn delay={0}>
              <div className="relative p-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">{tLanding("pricing.freePlan.name")}</h3>
                  <p className="text-sm text-slate-500 mt-1">{tLanding("pricing.freePlan.subtitle")}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-slate-900">{tLanding("pricing.freePlan.price")}</span>
                  <span className="text-slate-500 text-sm ml-1">/{tLanding("pricing.freePlan.period")}</span>
                </div>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "✨ 10 free AI generations", highlight: true },
                    "Up to 20 products",
                    "WhatsApp checkout",
                    "Public catalog page",
                    "Basic analytics",
                    "Order tracking",
                    "Category management",
                    "Product variants",
                    "Image CDN hosting",
                  ].map((f) => {
                    const text = typeof f === "string" ? f : f.text;
                    const highlight = typeof f !== "string" && f.highlight;
                    return (
                      <li key={text} className={`flex items-start gap-3 text-sm ${highlight ? "text-violet-600" : "text-slate-600"}`}>
                        <svg className={`w-5 h-5 ${highlight ? "text-violet-500" : "text-blue-500"} flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        {text}
                      </li>
                    );
                  })}
                </ul>
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}` : "/create-shop") : "/sign-up"} className="block w-full text-center px-6 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all">
                  {tLanding("pricing.freePlan.cta")}
                </Link>
              </div>
            </FadeIn>

            {/* Starter Plan */}
            <FadeIn delay={0.1}>
              <div className="relative p-8 rounded-2xl bg-white border-2 border-blue-500/40 shadow-lg shadow-blue-500/5 hover:shadow-xl transition-all h-full flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30">MOST POPULAR</div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Starter</h3>
                  <p className="text-sm text-blue-600 mt-1">For serious sellers</p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">R99</span>
                  <span className="text-slate-500 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-blue-600/80 mb-2">Less than R3.50/day — one sale covers it ☕</p>
                <div className="mb-8 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600">💡 <span className="font-semibold">Save R189/year</span> with annual billing — R999/year (R83/mo)</p>
                </div>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "Unlimited products", highlight: true },
                    { text: "25 AI generations/month", highlight: true },
                    { text: "Everything in Free", highlight: false },
                    { text: "Revenue dashboard", highlight: false },
                    { text: "Bulk product upload", highlight: false },
                    { text: "Instant order alerts", highlight: true },
                    { text: "Buyer reviews & ratings", highlight: false },
                  ].map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm text-slate-700">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span>{f.text}{f.highlight && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-200">NEW</span>}</span>
                    </li>
                  ))}
                </ul>
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}/billing` : "/create-shop") : "/sign-up"} className="block w-full text-center px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  Get Starter →
                </Link>
              </div>
            </FadeIn>

            {/* Pro Plan */}
            <FadeIn delay={0.2}>
              <div className="relative p-8 rounded-2xl bg-white border border-blue-200 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">{tLanding("pricing.proPlan.name")}</h3>
                  <p className="text-sm text-blue-600 mt-1">For growing businesses</p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">R299</span>
                  <span className="text-slate-500 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-blue-600/80 mb-2">R10/day — scale with confidence</p>
                <div className="mb-8 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600">💡 <span className="font-semibold">Save R589/year</span> with annual billing — R2,999/year (R250/mo)</p>
                </div>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "Unlimited AI generations", highlight: true },
                    { text: "Everything in Starter", highlight: false },
                    { text: "Priority WhatsApp support", highlight: false },
                    { text: "Enhanced promoted listings", highlight: true },
                    { text: "Advanced analytics", highlight: false },
                    { text: "Team accounts (up to 3)", highlight: true },
                  ].map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm text-slate-700">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span>{f.text}{f.highlight && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-200">NEW</span>}</span>
                    </li>
                  ))}
                </ul>
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}/billing` : "/create-shop") : "/sign-up"} className="block w-full text-center px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  {tLanding("pricing.proPlan.cta")}
                </Link>
              </div>
            </FadeIn>

            {/* Pro AI Plan */}
            <FadeIn delay={0.3}>
              <div className="relative p-8 rounded-2xl bg-white border border-violet-200 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/30">✨ AI POWERED</div>
                </div>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Pro AI</h3>
                  <p className="text-sm text-violet-600 mt-1">The AI selling machine</p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-slate-900">R499</span>
                  <span className="text-slate-500 text-sm ml-1">/month</span>
                </div>
                <p className="text-sm text-violet-600/80 mb-2">AI generates listings for you — save hours ⚡</p>
                <div className="mb-8 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200">
                  <p className="text-xs text-violet-600">💡 <span className="font-semibold">Save R989/year</span> with annual billing — R4,999/year (R417/mo)</p>
                </div>
                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "🤖 AI auto title from photo", highlight: true },
                    { text: "🤖 AI product description", highlight: true },
                    { text: "🤖 AI category suggestion", highlight: true },
                    { text: "🤖 AI SEO tags & meta", highlight: true },
                    { text: "Everything in Pro", highlight: false },
                    { text: "Unlimited products", highlight: false },
                    { text: "Advanced analytics", highlight: false },
                    { text: "Priority support", highlight: false },
                  ].map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm text-slate-700">
                      <svg className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span>{f.text}{f.highlight && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 font-medium border border-violet-200">AI</span>}</span>
                    </li>
                  ))}
                </ul>
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}/billing` : "/create-shop") : "/sign-up"} className="block w-full text-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                  Upgrade to Pro AI →
                </Link>
              </div>
            </FadeIn>
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">Payments processed securely by PayFast 🇿🇦 · Cancel anytime · VAT inclusive</p>

          {/* Plan Comparison */}
          <FadeIn>
            <div className="mt-16 max-w-4xl mx-auto">
              <h3 className="text-center text-lg font-bold text-slate-900 mb-6">Plan Comparison</h3>
              <div className="rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Feature</th>
                      <th className="text-center px-3 py-3 text-slate-500 font-medium">Free</th>
                      <th className="text-center px-3 py-3 text-blue-600 font-bold">Starter</th>
                      <th className="text-center px-3 py-3 text-slate-500 font-medium">Pro</th>
                      <th className="text-center px-3 py-3 text-violet-600 font-bold">Pro AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { feature: "Products", free: "20", starter: "∞", pro: "∞", proAi: "∞" },
                      { feature: "AI Generations", free: "10", starter: "25/mo", pro: "∞", proAi: "∞" },
                      { feature: "AI Auto Title from Photo", free: "10 free", starter: "25/mo", pro: true, proAi: true },
                      { feature: "AI Product Description", free: "10 free", starter: "25/mo", pro: true, proAi: true },
                      { feature: "AI Category Suggestion", free: "10 free", starter: "25/mo", pro: true, proAi: true },
                      { feature: "AI SEO Tags & Meta", free: "10 free", starter: "25/mo", pro: true, proAi: true },
                      { feature: "WhatsApp Checkout", free: true, starter: true, pro: true, proAi: true },
                      { feature: "Marketplace Listing", free: true, starter: true, pro: true, proAi: true },
                      { feature: "Revenue Dashboard", free: false, starter: true, pro: true, proAi: true },
                      { feature: "Promoted Listings", free: false, starter: true, pro: true, proAi: true },
                      { feature: "Priority Support", free: false, starter: false, pro: true, proAi: true },
                      { feature: "Team Accounts", free: false, starter: false, pro: "3 users", proAi: "3 users" },
                    ].map((row) => (
                      <tr key={row.feature} className={row.feature.startsWith("AI") && row.proAi === true ? "bg-violet-50/50" : undefined}>
                        <td className="px-5 py-3 text-slate-700 font-medium">{row.feature}</td>
                        {[row.free, row.starter, row.pro, row.proAi].map((val, i) => (
                          <td key={i} className="text-center px-3 py-3">
                            {val === true ? (
                              <span className="text-blue-500">✅</span>
                            ) : val === false ? (
                              <span className="text-slate-300">—</span>
                            ) : (
                              <span className="text-slate-700 font-semibold">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-6">
                <Link
                  href={aiCtaHref}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  ✨ Try AI Now — 10 Free Generations
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 8 — TESTIMONIALS & TRUST
      ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">Why Sellers Love TradeFeed</h2>
              <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">Built for the way South African sellers actually do business.</p>
            </div>
          </FadeIn>

          {/* Testimonial quotes */}
          <div className="grid sm:grid-cols-3 gap-6 mb-14">
            {[
              { quote: "I used to send 50 photos a day on WhatsApp. Now I share one link and my customers browse and order. Game changer.", name: "Thandi M.", role: "Reseller, Johannesburg", img: "/img/testimonial_thandi.png" },
              { quote: "Set up my catalog in 10 minutes. First order came the same day. No app, no complicated setup — just my phone.", name: "Sipho K.", role: "Beauty & wellness, Durban", img: null },
              { quote: "The AI listing saved me hours. Upload a photo, it writes the description. I just adjust the price and publish.", name: "Lerato P.", role: "Wholesaler, Cape Town", img: null },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm h-full flex flex-col">
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-3">
                    {t.img ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <Image src={t.img} alt={t.name} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-blue-600">{t.name.split(" ").map(n => n[0]).join("")}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: (<svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
                stat: "3+ hours saved daily",
                heading: "No More Size DMs",
                description: "Customers browse your catalog, pick sizes and colors themselves, and order with one tap. You stop answering the same questions all day.",
              },
              {
                icon: (<svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h9m-9 3.75h5.25M3 5.25h18v13.5H3V5.25z" /></svg>),
                stat: "1 link, all your stock",
                heading: "Share Once, Sell Everywhere",
                description: "Drop your catalog link in WhatsApp groups instead of posting individual photos every morning. Customers come back to browse anytime.",
              },
              {
                icon: (<svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>),
                stat: "See what sells",
                heading: "Data, Not Guesswork",
                description: "Analytics show which products get the most views. Drop slow sellers and double down on winners — no more guessing what customers want.",
              },
            ].map((card, i) => (
              <FadeIn key={card.heading} delay={i * 0.15}>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
                  <div className="mb-4">{card.icon}</div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">{card.stat}</p>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{card.heading}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed flex-1">{card.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 9 — FAQ
      ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 lg:px-8 border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{tLanding("faq.title")}</h2>
              <p className="mt-3 text-slate-500 text-sm">{tLanding("faq.subtitle")}</p>
            </div>
          </FadeIn>
          {/* FAQ JSON-LD for Google rich results */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                generateFaqJsonLd(
                  FAQ_ITEMS.map((f) => ({ question: f.q, answer: f.a }))
                )
              ),
            }}
          />
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 0.05}>
                <FaqItem question={faq.q} answer={faq.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 10 — FINAL CTA
      ───────────────────────────────────────────────────── */}
      <FinalCTASection
        badge={tLanding("cta.badge", { shopCount: Math.max(shopCount, 50) })}
        title={tLanding("cta.title")}
        titleHighlight={tLanding("cta.titleHighlight")}
        subtitle={tLanding("cta.subtitle")}
        ctaLabel={tLanding("cta.button")}
        ctaHref={aiCtaHref}
        ctaSecondaryLabel={tLanding("cta.buttonSecondary")}
        ctaSecondaryHref="/marketplace"
        footer={tLanding("cta.footer")}
      />

      {/* ─────────────────────────────────────────────────────
          SECTION 11 — SEO CONTENT
      ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-8 border-t border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-6">
                Why Sell on TradeFeed — South Africa&apos;s Growing Online Marketplace
              </h2>

              <p className="text-slate-500 leading-relaxed mb-6">
                TradeFeed is the <strong className="text-slate-700">online marketplace in South Africa</strong> built
                for the way local sellers actually do business. Whether you&apos;re a clothing wholesaler in
                Johannesburg, a beauty supplier in Cape Town, or an electronics reseller in Durban — TradeFeed
                gives you the tools to <strong className="text-slate-700">sell online in South Africa</strong> without
                the complexity and high fees of traditional e-commerce platforms.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mt-10 mb-4">
                Create Your Online Shop in South Africa — Free
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Setting up an online store shouldn&apos;t cost thousands of rands or require a web developer.
                With TradeFeed, you can <strong className="text-slate-700">create your own online shop in South Africa</strong> in
                under five minutes — completely free. Upload your product photos, set prices, add sizes and
                colours, and you&apos;ll have a professional, mobile-friendly product catalog with its own
                shareable link. Your customers browse on any smartphone — no app download needed.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mt-10 mb-4">
                WhatsApp-First Ordering — Built for South African Buyers
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                South Africa has over 30 million WhatsApp users. Your customers are already there — so why
                force them onto a complicated checkout page? TradeFeed integrates directly with WhatsApp,
                allowing buyers to browse your products, select exact sizes and colours, and send you a clean,
                structured order message. No sign-ups, no payment gateways, no friction. Just tap, pick,
                and order. It&apos;s the smartest way to <strong className="text-slate-700">sell products online in South Africa</strong> using
                the platform your customers already love.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mt-10 mb-4">
                Reach Customers Nationwide on Our Marketplace
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Every product you list on TradeFeed also appears on our{" "}
                <Link href="/marketplace" className="text-blue-600 hover:text-blue-500 underline underline-offset-2">
                  public marketplace
                </Link>
                , where buyers from across all 9 South African provinces can discover and shop from local
                sellers. Unlike posting in WhatsApp groups where your products get buried in minutes,
                your TradeFeed catalog is permanent, searchable, and optimised for Google — giving you
                free exposure to new customers 24/7.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mt-10 mb-4">
                Start Free, Upgrade Anytime
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                List up to 20 products on our Free plan — forever. When your business grows, upgrade to
                Starter for just R99/month for unlimited products, or Pro for R299/month for unlimited AI,
                promoted listings, revenue analytics, and instant order notifications. Payments are handled securely through PayFast, South Africa&apos;s
                most trusted payment gateway.{" "}
                <Link href={clerkId ? (dashboardSlug ? `/dashboard/${dashboardSlug}` : "/create-shop") : "/sign-up"} className="text-blue-600 hover:text-blue-500 underline underline-offset-2">
                  Create your online shop
                </Link>
                {" "}today and join hundreds of South African sellers who chose TradeFeed as their home
                for selling online.
              </p>

              {/* Internal link cluster for SEO */}
              <div className="mt-10 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Explore TradeFeed</h3>
                <div className="flex flex-wrap gap-3">
                  <Link href="/marketplace" className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                    Browse Marketplace →
                  </Link>
                  <Link href="/import-whatsapp-catalogue" className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                    Import WhatsApp Catalogue →
                  </Link>
                  <Link href={clerkId ? "/create-shop" : "/sign-up"} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                    Create Online Shop →
                  </Link>
                  <Link href="#pricing" className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                    View Pricing →
                  </Link>
                  <Link href="#how-it-works" className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                    How It Works →
                  </Link>
                </div>
                {/* Province links for geographic SEO */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-500 mb-3">Browse by Province</h4>
                  <div className="flex flex-wrap gap-2">
                    {["gauteng", "western-cape", "kwazulu-natal", "eastern-cape", "free-state", "limpopo", "mpumalanga", "north-west", "northern-cape"].map((slug) => {
                      const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                      return (
                        <Link key={slug} href={`/marketplace/${slug}`} className="px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm">
                          {name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────
          SECTION 12 — FOOTER
      ───────────────────────────────────────────────────── */}
      <footer className="py-14 px-6 lg:px-8 border-t border-slate-800/50 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <TradeFeedLogo size="sm" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">South Africa&apos;s online marketplace for sellers and buyers. Create your online shop, list products, and sell via WhatsApp. 🇿🇦</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">{tFooter("product")}</h4>
              <ul className="space-y-2.5">
                {[{ label: tNav("features"), href: "#features" }, { label: tNav("pricing"), href: "#pricing" }, { label: tNav("marketplace"), href: "/marketplace" }, { label: tNav("faq"), href: "#faq" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">For Sellers</h4>
              <ul className="space-y-2.5">
                {[{ label: "Create a Shop", href: clerkId ? "/create-shop" : "/sign-up" }, { label: "Import WhatsApp Catalogue", href: "/import-whatsapp-catalogue" }, { label: "Sign In", href: "/sign-in" }, { label: "How It Works", href: "#how-it-works" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">{tFooter("legal")}</h4>
              <ul className="space-y-2.5">
                {[{ label: tFooter("privacy"), href: "/privacy" }, { label: tFooter("terms"), href: "/terms" }, { label: "Contact", href: "/contact" }].map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} TradeFeed. South Africa&apos;s online marketplace. Made with ❤️ in South Africa.</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                POPIA Compliant
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                SSL Encrypted
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
