import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { WhatsAppImportFlow } from "@/components/import/whatsapp-import-flow";

// ============================================================
// /import-whatsapp-catalogue — SEO Landing Page + Functional Import
// ============================================================
// Public: marketing page targeting "import WhatsApp catalogue"
// Signed-in with shop: actual working import flow
// Signed-in without shop: CTA to create shop first
// ============================================================

export const revalidate = 3600; // 1 hour

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title:
    "Import Your WhatsApp Catalogue to TradeFeed — Free Online Shop in 30 Seconds",
  description:
    "Turn your WhatsApp Business catalogue into a professional online shop instantly. Upload your product photos or paste your catalogue link — AI creates the listings. Free to start. Join 100+ South African sellers on TradeFeed.",
  keywords: [
    "import WhatsApp catalogue",
    "WhatsApp catalogue to online shop",
    "WhatsApp business online store",
    "WhatsApp catalogue import South Africa",
    "convert WhatsApp catalogue to website",
    "WhatsApp business catalogue",
    "create online shop from WhatsApp",
    "WhatsApp shop South Africa",
    "AI product listing",
    "sell on WhatsApp South Africa",
    "online shop South Africa free",
    "TradeFeed",
  ],
  alternates: { canonical: `${APP_URL}/import-whatsapp-catalogue` },
  openGraph: {
    title:
      "Import Your WhatsApp Catalogue to TradeFeed — Free Online Shop in 30 Seconds",
    description:
      "Turn your WhatsApp Business catalogue into a professional online shop. Upload product photos — AI creates listings. Free to start.",
    url: `${APP_URL}/import-whatsapp-catalogue`,
    siteName: "TradeFeed",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Import WhatsApp Catalogue → Online Shop in 30 Seconds | TradeFeed",
    description:
      "Upload your WhatsApp catalogue photos. AI creates listings. Get your own online shop link. Free.",
  },
};

const getPlatformStats = unstable_cache(
  async () => {
    const [shopCount, productCount] = await Promise.all([
      db.shop.count({ where: { isActive: true } }),
      db.product.count({ where: { isActive: true } }),
    ]);
    return { shopCount, productCount };
  },
  ["import-page-stats"],
  { revalidate: 600 },
);

export default async function ImportWhatsAppCataloguePage() {
  const { shopCount, productCount } = await getPlatformStats();

  // ── Auth check: show import flow for users with a shop ────
  const { userId: clerkId } = await auth();
  let shopSlug: string | null = null;
  let shopName: string | null = null;

  if (clerkId) {
    const user = await db.user.findUnique({
      where: { clerkId },
      select: {
        shops: {
          select: { shop: { select: { slug: true, name: true } } },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
    });
    shopSlug = user?.shops[0]?.shop.slug ?? null;
    shopName = user?.shops[0]?.shop.name ?? null;
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 px-5 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/[0.06] rounded-full blur-[140px]" />
          <div className="absolute top-40 right-[20%] w-[300px] h-[200px] bg-violet-500/[0.04] rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {Math.max(shopCount, 50)}+ sellers already on TradeFeed
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Import Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-emerald-400">
              WhatsApp Catalogue
            </span>{" "}
            <br className="hidden sm:block" />
            to Your Own Online Shop
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Upload your product photos or screenshots from WhatsApp Business.
            AI creates the listing — title, description, price, category — in
            seconds. Get your own shareable shop link. <strong className="text-stone-200">Free to start.</strong>
          </p>

          {/* Show appropriate CTA only when no shop (marketing mode) */}
          {!shopSlug && (
            <>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href={clerkId ? "/create-shop" : "/sign-up"}
                  className="group inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-gradient-to-r from-[#25D366] to-emerald-500 text-white hover:from-[#20BD5A] hover:to-emerald-400 transition-all shadow-2xl shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current mr-2" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {clerkId ? "Create Your Shop First" : "Import My Catalogue — Free"}
                  <svg
                    className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/marketplace"
                  className="text-sm text-stone-400 hover:text-emerald-400 transition-colors"
                >
                  or browse the marketplace →
                </Link>
              </div>
              <p className="mt-4 text-xs text-stone-600">
                10 free AI listings · No credit card · Set up in under 3 minutes
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── IMPORT FLOW (signed-in with shop) ────────────── */}
      {shopSlug && shopName && (
        <section className="px-5 pb-16 -mt-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-4 px-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-400">
                  Importing to {shopName}
                </span>
              </div>
              <Link
                href={`/dashboard/${shopSlug}`}
                className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
              >
                ← Back to dashboard
              </Link>
            </div>
            <WhatsAppImportFlow shopSlug={shopSlug} shopName={shopName} />
          </div>
        </section>
      )}

      {/* ── Create Shop CTA (signed-in WITHOUT shop) ─────── */}
      {clerkId && !shopSlug && (
        <section className="px-5 pb-16 -mt-8">
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-6 text-center">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="text-lg font-bold text-stone-100">
                Create your shop first
              </h3>
              <p className="text-sm text-stone-400 mt-1">
                You need a shop to import products into. It takes less than 60
                seconds.
              </p>
              <Link
                href="/create-shop"
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
              >
                Create My Shop — Free
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-stone-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-16">
            How to Import Your WhatsApp Catalogue
          </h2>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-emerald-500/40 via-emerald-500/20 to-emerald-500/40" />

            {[
              {
                step: "1",
                icon: "📸",
                title: "Upload Your Photos",
                description:
                  "Take screenshots of your WhatsApp Business catalogue, or upload your product photos directly. Multiple photos per product supported.",
              },
              {
                step: "2",
                icon: "✨",
                title: "AI Creates the Listings",
                description:
                  "Our AI analyses each photo and automatically generates product name, description, category, and suggested tags. Just review and confirm.",
              },
              {
                step: "3",
                icon: "🚀",
                title: "Share Your Shop Link",
                description:
                  "Get your own tradefeed.co.za/catalog/your-shop link. Share it on WhatsApp, Facebook, Instagram — customers browse and order via WhatsApp.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                <div className="flex flex-col items-center">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-900 border-2 border-emerald-500/30 text-3xl mb-4">
                    {item.icon}
                  </div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-3">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-stone-100 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────── */}
      <section className="py-20 px-5 bg-stone-900/20 border-t border-stone-800/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-12">
            Why Move Your WhatsApp Catalogue to TradeFeed?
          </h2>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: "🔍",
                title: "Get Found on Google",
                description:
                  "WhatsApp catalogues are invisible to Google. TradeFeed products appear in search results — free organic traffic 24/7.",
              },
              {
                icon: "📱",
                title: "No More Size DMs",
                description:
                  "Customers browse your full catalogue, pick exact sizes and colours, and order with one tap. You stop answering repetitive questions.",
              },
              {
                icon: "🔗",
                title: "One Link, All Your Stock",
                description:
                  "Instead of posting individual photos in groups every morning, share one link. Customers come back to browse anytime.",
              },
              {
                icon: "📊",
                title: "See What Sells",
                description:
                  "Analytics show which products get the most views and orders. Double down on winners, drop slow sellers.",
              },
              {
                icon: "🤖",
                title: "AI Does the Work",
                description:
                  "Upload a photo → AI writes the title, description, tags, and suggests a category. List products 10× faster than typing everything.",
              },
              {
                icon: "🆓",
                title: "Free Forever Plan",
                description:
                  "List up to 20 products completely free — no credit card, no trial period, no hidden fees. Upgrade only when you're ready.",
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="flex gap-4 p-5 rounded-2xl bg-stone-900/60 border border-stone-800/50 hover:border-stone-700/80 transition-all"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                  {benefit.icon}
                </span>
                <div>
                  <h3 className="font-bold text-stone-100 mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-stone-400 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof Stats ───────────────────────────── */}
      <section className="py-16 px-5 border-t border-stone-800/30">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/50 to-stone-900/80 border border-emerald-500/10 p-10 text-center">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-widest mb-4">
              Growing Platform
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-extrabold text-emerald-400">
                  {Math.max(shopCount, 10)}+
                </p>
                <p className="text-xs text-stone-500 mt-1">Active Sellers</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-stone-100">
                  {Math.max(productCount, 50)}+
                </p>
                <p className="text-xs text-stone-500 mt-1">Products Listed</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-stone-100">9</p>
                <p className="text-xs text-stone-500 mt-1">SA Provinces</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ──────────────────────────────────── */}
      <section className="py-20 px-5 bg-stone-900/20 border-t border-stone-800/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-10">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Can I import my existing WhatsApp Business catalogue?",
                a: "Yes! Upload screenshots of your WhatsApp catalogue, or upload your product photos directly. Our AI reads the image and creates structured product listings with title, description, and suggested category.",
              },
              {
                q: "Do I need any technical skills?",
                a: "Not at all. If you can take a photo and tap a button, you can use TradeFeed. Upload photos → AI creates the listings → you review and publish. That's it.",
              },
              {
                q: "Is it really free?",
                a: "Yes. Our Free plan lets you list up to 20 products with 10 AI generations per month — forever. No credit card required. Upgrade to Starter (R99/month) for unlimited products, or Pro (R299/month) for unlimited AI.",
              },
              {
                q: "Will my customers still order on WhatsApp?",
                a: "Absolutely! TradeFeed is built around WhatsApp ordering. Customers browse your catalogue on their phone, pick sizes and colours, and tap 'Order on WhatsApp' — a pre-filled message opens in their WhatsApp. Same workflow, better experience.",
              },
              {
                q: "Can Google find my products?",
                a: "Yes — that's the biggest advantage over a WhatsApp-only catalogue. Every product page is indexed by Google with proper SEO, structured data, and rich results. This means free traffic from people searching for your products.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-stone-800/50 bg-stone-900/40 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-sm font-semibold text-stone-200 hover:text-emerald-400 transition-colors">
                  {faq.q}
                  <svg
                    className="w-4 h-4 text-stone-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-stone-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-24 px-5 border-t border-stone-800/30 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/[0.06] rounded-full blur-[140px]" />
        </div>
        <div className="relative max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Move Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-emerald-400">
              WhatsApp Catalogue
            </span>{" "}
            Online?
          </h2>
          <p className="mt-4 text-stone-400 text-lg">
            Join {Math.max(shopCount, 50)}+ South African sellers who already
            upgraded from WhatsApp-only selling.
          </p>
          {shopSlug ? (
            <button
              onClick={undefined}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-emerald-500 text-base font-bold text-white shadow-2xl shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-default"
            >
              ↑ Scroll up to start importing
            </button>
          ) : (
            <Link
              href={clerkId ? "/create-shop" : "/sign-up"}
              className="mt-8 inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#25D366] to-emerald-500 text-base font-bold text-white shadow-2xl shadow-emerald-600/25 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {clerkId ? "Create Your Shop First" : "Import My Catalogue — Free"}
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          )}
          <p className="mt-3 text-xs text-stone-600">
            Free plan · No credit card · AI-powered listings
          </p>
        </div>
      </section>

      {/* ── Footer link ──────────────────────────────────── */}
      <div className="py-8 px-5 border-t border-stone-800/30 text-center">
        <Link
          href="/"
          className="text-sm text-stone-500 hover:text-emerald-400 transition-colors"
        >
          ← Back to TradeFeed Home
        </Link>
      </div>
    </main>
  );
}
