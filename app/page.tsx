import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// ============================================================
// TradeFeed Landing Page — Conversion-focused
// ============================================================
// Hero → How it Works → Features → Mock Preview → Social Proof → FAQ → CTA → Footer
// Server component for auth-aware CTAs
// ============================================================

export default async function HomePage() {
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

  // Dynamic CTA based on auth state
  const ctaHref = clerkId
    ? dashboardSlug
      ? `/dashboard/${dashboardSlug}`
      : "/create-shop"
    : "/sign-up";
  const ctaLabel = clerkId
    ? dashboardSlug
      ? "Go to Dashboard"
      : "Create Your Shop"
    : "Get Started Free";

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-stone-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-lg tracking-tight">
              Trade<span className="text-emerald-400">Feed</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-stone-400 hover:text-white transition-colors"
            >
              Marketplace
            </Link>
            {clerkId ? (
              <Link
                href={ctaHref}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
              >
                {ctaLabel} →
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 text-sm font-medium text-stone-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-5">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Built for South African clothing sellers
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Structure Your Clothing Inventory.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              Replace WhatsApp Chaos.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Upload products. Share your catalog link. Get organized orders via
            WhatsApp — no app download required. Built for wholesalers &
            retailers who sell to groups.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={ctaHref}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 w-full sm:w-auto"
            >
              {ctaLabel}
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            {!clerkId && (
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold rounded-xl border border-stone-700 text-stone-300 hover:text-white hover:border-stone-600 transition-all w-full sm:w-auto"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center px-6 py-4 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Browse Marketplace →
            </Link>
          </div>

          <p className="mt-4 text-xs text-stone-600">
            Create your first shop catalog in minutes · No credit card required
          </p>

          {/* Stats bar */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-stone-500">
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-200">100%</p>
              <p className="text-xs mt-0.5">Free to start</p>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-200">0</p>
              <p className="text-xs mt-0.5">Apps to download</p>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-200">30s</p>
              <p className="text-xs mt-0.5">To share catalog</p>
            </div>
            <div className="w-px h-8 bg-stone-800" />
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-200">🇿🇦</p>
              <p className="text-xs mt-0.5">Made for SA</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mock Catalog Preview ────────────────────────── */}
      <section className="relative px-5 pb-24">
        {/* Ambient glow behind preview */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Desktop + Phone side by side */}
          <div className="relative flex items-end justify-center gap-6">
            
            {/* ── Desktop Browser Mockup ─────────────────── */}
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
                      tradefeed.co.za/catalog/jeppe-fashion-hub
                    </div>
                  </div>
                </div>

                {/* Mock catalog content */}
                <div className="p-5 sm:p-6">
                  {/* Shop header mock */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-orange-500/20">
                        JF
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-200 text-sm">Jeppe Fashion Hub</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-500/20">✓ Verified</span>
                        </div>
                        <span className="text-[11px] text-stone-500">📍 Johannesburg, Gauteng · 48 products</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-medium flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Chat on WhatsApp
                      </div>
                    </div>
                  </div>

                  {/* Category pills */}
                  <div className="flex gap-2 mb-4 overflow-hidden">
                    {["All", "Hoodies", "Pants", "Tees", "Jackets", "Accessories"].map((cat, i) => (
                      <span key={cat} className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${i === 0 ? "bg-emerald-600 text-white" : "bg-stone-800 text-stone-400 border border-stone-700/50"}`}>{cat}</span>
                    ))}
                  </div>

                  {/* Search bar mock */}
                  <div className="flex gap-2 mb-5">
                    <div className="flex-1 h-9 rounded-lg bg-stone-800/60 border border-stone-700/40 flex items-center px-3">
                      <svg className="w-3.5 h-3.5 text-stone-600 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                      <span className="text-[11px] text-stone-600">Search products...</span>
                    </div>
                    <div className="h-9 px-3 rounded-lg bg-stone-800/60 border border-stone-700/40 flex items-center text-[11px] text-stone-500 gap-1">
                      Sort <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                  </div>

                  {/* Product grid with REAL images */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Oversized Hoodie", price: "R 280", badge: "BEST SELLER", badgeColor: "bg-amber-500", img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-800", "bg-amber-700", "bg-emerald-700"] },
                      { name: "Cargo Pants", price: "R 320", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-800", "bg-stone-500"] },
                      { name: "Graphic Tee Pack", price: "R 150", badge: "NEW", badgeColor: "bg-emerald-500", img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop&q=80", colors: ["bg-white", "bg-stone-900", "bg-blue-700"] },
                      { name: "Denim Jacket", price: "R 450", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&h=400&fit=crop&q=80", colors: ["bg-blue-600", "bg-stone-700"] },
                      { name: "Track Set", price: "R 380", badge: "HOT", badgeColor: "bg-red-500", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-900", "bg-red-700"] },
                      { name: "Bucket Hat", price: "R 120", badge: null, badgeColor: "", img: "https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=400&h=400&fit=crop&q=80", colors: ["bg-stone-900", "bg-amber-600", "bg-emerald-700"] },
                    ].map((product) => (
                      <div key={product.name} className="group rounded-xl bg-stone-800/40 border border-stone-700/30 overflow-hidden hover:border-emerald-500/30 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                        <div className="aspect-square relative overflow-hidden">
                          <img
                            src={product.img}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {product.badge && (
                            <span className={`absolute top-2 left-2 ${product.badgeColor} text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-lg`}>
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-[11px] font-medium text-stone-300 truncate">{product.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-emerald-400">{product.price}</span>
                            <div className="flex gap-1">
                              {product.colors.map((c, i) => (
                                <div key={i} className={`w-2.5 h-2.5 rounded-full ${c} border border-stone-600/50`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* WhatsApp order bar */}
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

            {/* ── Phone Mockup ───────────────────────────── */}
            <div className="hidden lg:block relative w-[220px] flex-shrink-0 -mb-8">
              <div className="relative rounded-[2rem] border-4 border-stone-700 bg-stone-900 shadow-2xl shadow-black/60 overflow-hidden">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-stone-700 rounded-b-2xl z-10" />
                
                {/* Phone screen content */}
                <div className="pt-8 pb-4 px-3">
                  {/* Mini shop header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-[8px]">JF</div>
                    <div>
                      <p className="text-[9px] font-semibold text-stone-200">Jeppe Fashion Hub</p>
                      <p className="text-[7px] text-stone-500">48 products</p>
                    </div>
                  </div>

                  {/* Mini product grid */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200&h=200&fit=crop&q=80", name: "Hoodie", price: "R 280" },
                      { img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&h=200&fit=crop&q=80", name: "Cargo", price: "R 320" },
                      { img: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=200&h=200&fit=crop&q=80", name: "Tee Pack", price: "R 150" },
                      { img: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=200&h=200&fit=crop&q=80", name: "Denim", price: "R 450" },
                    ].map((p) => (
                      <div key={p.name} className="rounded-lg overflow-hidden bg-stone-800/60">
                        <img src={p.img} alt={p.name} className="w-full aspect-square object-cover" />
                        <div className="p-1.5">
                          <p className="text-[7px] text-stone-300 truncate">{p.name}</p>
                          <p className="text-[8px] font-bold text-emerald-400">{p.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mini WhatsApp CTA */}
                  <div className="mt-3 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[8px] font-semibold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Order on WhatsApp
                  </div>
                </div>

                {/* Phone home bar */}
                <div className="flex justify-center pb-2">
                  <div className="w-16 h-1 rounded-full bg-stone-600" />
                </div>
              </div>

              {/* "Works on mobile" label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-stone-500 flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                Works on any phone
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className="text-center text-xs text-stone-500 mt-10 max-w-md mx-auto">
            ↑ Your customers see a professional catalog — browse products, pick sizes, and order via WhatsApp. No app needed.
          </p>
        </div>
      </section>

      {/* ── WhatsApp Order Preview ──────────────────────── */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              This Is What Your Orders Look Like
            </h2>
            <p className="mt-2 text-stone-400 text-sm">
              No more &ldquo;what size?&rdquo; &ldquo;what color?&rdquo; back and forth. Clean, structured orders.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {/* Before: Chaotic */}
            <div className="w-full sm:w-72 rounded-2xl border border-red-900/30 bg-stone-900/60 overflow-hidden">
              <div className="px-4 py-2.5 bg-red-950/40 border-b border-red-900/20 flex items-center gap-2">
                <span className="text-red-400 text-xs font-bold">✗</span>
                <span className="text-xs font-semibold text-red-300">Before TradeFeed</span>
              </div>
              <div className="p-4 space-y-2.5 font-mono text-[11px] text-stone-400">
                <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">Hi do u hav this hoodie?</div>
                <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">wat sizes u got</div>
                <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">hw much is it</div>
                <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">u still hav stock?</div>
                <div className="bg-emerald-900/30 rounded-xl rounded-tr-none px-3 py-2 ml-auto max-w-[80%] text-emerald-300">which one? send pic</div>
                <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2">the black 1 from yesterday</div>
                <div className="text-center text-[9px] text-red-400/60 mt-2">...repeat 50x per day 😩</div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-emerald-500">
              <svg className="w-8 h-8 hidden sm:block" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              <svg className="w-8 h-8 sm:hidden rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </div>

            {/* After: Structured */}
            <div className="w-full sm:w-72 rounded-2xl border border-emerald-900/30 bg-stone-900/60 overflow-hidden">
              <div className="px-4 py-2.5 bg-emerald-950/40 border-b border-emerald-900/20 flex items-center gap-2">
                <span className="text-emerald-400 text-xs font-bold">✓</span>
                <span className="text-xs font-semibold text-emerald-300">With TradeFeed</span>
              </div>
              <div className="p-4 font-mono text-[11px]">
                <div className="bg-stone-800/60 rounded-xl rounded-tl-none px-3 py-2.5 text-stone-300 space-y-1">
                  <p className="font-bold text-emerald-400 text-xs">🛍️ New Order from TradeFeed</p>
                  <div className="border-t border-stone-700/50 pt-1.5 space-y-1">
                    <p>1× Oversized Hoodie</p>
                    <p className="text-stone-500 pl-3">Size: L · Color: Black</p>
                    <p>2× Graphic Tee Pack</p>
                    <p className="text-stone-500 pl-3">Size: M · Color: White</p>
                  </div>
                  <div className="border-t border-stone-700/50 pt-1.5">
                    <p className="font-bold text-emerald-400">Total: R 580</p>
                  </div>
                </div>
                <div className="text-center text-[9px] text-emerald-400/60 mt-3">Clean order. No back-and-forth. ✨</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 border-t border-stone-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 border border-stone-700/50 text-stone-400 text-[11px] font-medium mb-4">
              ⚡ Takes less than 5 minutes
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              How It Works
            </h2>
            <p className="mt-3 text-stone-400 text-lg">
              Three steps. Five minutes. Your catalog is live.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: "1",
                title: "Upload Products",
                desc: "Add photos, prices, sizes, and colors. Drag & drop images — we compress and host them on a global CDN.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                ),
              },
              {
                step: "2",
                title: "Share Your Link",
                desc: "Get a unique catalog URL. Drop it in your WhatsApp groups, status, bio — anywhere your customers are.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L5.95 9.318" /></svg>
                ),
              },
              {
                step: "3",
                title: "Get WhatsApp Orders",
                desc: "Customers browse, pick sizes & quantities, and send you a clean structured order on WhatsApp. Done.",
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-stone-900/60 border border-stone-800/60 hover:border-emerald-500/20 transition-all group"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-600/20">
                  {item.step}
                </div>
                <div className="text-emerald-400 mb-4 mt-1">{item.icon}</div>
                <h3 className="text-lg font-bold text-stone-100">{item.title}</h3>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Connection line */}
          <div className="hidden sm:flex items-center justify-center mt-8 gap-2 text-stone-600">
            <div className="h-px flex-1 max-w-[200px] bg-gradient-to-r from-transparent to-stone-700" />
            <span className="text-xs">That&apos;s it. Really.</span>
            <div className="h-px flex-1 max-w-[200px] bg-gradient-to-l from-transparent to-stone-700" />
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-20 px-5 bg-stone-900/30 border-t border-stone-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything You Need to Sell Smarter
            </h2>
            <p className="mt-3 text-stone-400 text-lg">
              Built specifically for how South African clothing sellers actually work.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Works on All Phones",
                desc: "No app to install. Your customers just tap a link — works on any phone with WhatsApp.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>
                ),
                color: "from-blue-500/20 to-blue-600/10 border-blue-500/10",
                iconColor: "text-blue-400",
              },
              {
                title: "Product Catalogs That Last",
                desc: "No more lost WhatsApp posts. Your products stay organized and always accessible.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                ),
                color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/10",
                iconColor: "text-emerald-400",
              },
              {
                title: "Size & Color Variants",
                desc: "Set up S/M/L/XL with different colors and stock levels. Customers pick exactly what they want.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" /></svg>
                ),
                color: "from-purple-500/20 to-purple-600/10 border-purple-500/10",
                iconColor: "text-purple-400",
              },
              {
                title: "Structured Orders",
                desc: "Customers add to cart with size + quantity. You get clean, organized WhatsApp orders.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
                ),
                color: "from-amber-500/20 to-amber-600/10 border-amber-500/10",
                iconColor: "text-amber-400",
              },
              {
                title: "Search & Categories",
                desc: "Customers can search, filter by category, and sort by price. No more endless scrolling.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                ),
                color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/10",
                iconColor: "text-cyan-400",
              },
              {
                title: "Seller Analytics",
                desc: "See how many people view your catalog, which products are popular, and track WhatsApp clicks.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                ),
                color: "from-pink-500/20 to-pink-600/10 border-pink-500/10",
                iconColor: "text-pink-400",
              },
              {
                title: "Verified Seller Badge",
                desc: "Get verified to build trust with customers. Show you're a legitimate business.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                ),
                color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/10",
                iconColor: "text-emerald-400",
              },
              {
                title: "CDN Image Hosting",
                desc: "Upload high-quality product photos. We compress and serve them fast from a global CDN.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                ),
                color: "from-orange-500/20 to-orange-600/10 border-orange-500/10",
                iconColor: "text-orange-400",
              },
              {
                title: "Free Tier Included",
                desc: "Start with 10 products for free. Upgrade to Pro for R199/mo when you're ready to scale.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                ),
                color: "from-green-500/20 to-green-600/10 border-green-500/10",
                iconColor: "text-green-400",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`p-5 rounded-xl bg-gradient-to-br ${feature.color} border hover:scale-[1.02] transition-all duration-200`}
              >
                <div className={`${feature.iconColor} mb-3`}>{feature.icon}</div>
                <h3 className="font-bold text-stone-100 text-sm">{feature.title}</h3>
                <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ────────────────────────────────── */}
      <section className="py-20 px-5 border-t border-stone-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" /></svg>
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Sellers Love TradeFeed
          </h2>
          <p className="mt-3 text-stone-400 text-lg max-w-xl mx-auto">
            Hear from fashion sellers who replaced WhatsApp chaos with a
            proper catalog system.
          </p>

          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: "My customers used to DM me asking for sizes every time. Now they just check the catalog and order directly. I save 2+ hours a day.",
                name: "Amina K.",
                location: "Jeppe, Johannesburg",
                role: "Wholesaler · 200+ products",
                avatar: "from-amber-500 to-orange-500",
              },
              {
                quote: "I share my TradeFeed link in 12 WhatsApp groups every week. Way better than posting individual photos every morning.",
                name: "Thabo M.",
                location: "Durban CBD",
                role: "Retailer · 45 products",
                avatar: "from-blue-500 to-indigo-500",
              },
              {
                quote: "The structured orders save me so much time. No more confusion about sizes and quantities. My customers love how easy it is.",
                name: "Fatima S.",
                location: "Cape Town",
                role: "Wholesaler · 120+ products",
                avatar: "from-emerald-500 to-teal-500",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/50 text-left hover:border-stone-700/80 transition-all"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" /></svg>
                  ))}
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-stone-800/50">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${testimonial.avatar} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-200">{testimonial.name}</p>
                    <p className="text-[10px] text-stone-500">{testimonial.location}</p>
                    <p className="text-[10px] text-emerald-500/80">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-xs text-stone-600">
            📍 Trusted by clothing sellers across Johannesburg, Durban, Cape Town, Pretoria, and beyond
          </p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="py-20 px-5 bg-stone-900/30 border-t border-stone-800/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Do my customers need to download an app?",
                a: "No! Your customers just tap your catalog link — it opens in their phone browser. No app, no sign-up. They browse, pick what they want, and order via WhatsApp.",
              },
              {
                q: "Can I update stock and prices easily?",
                a: "Yes. Log into your dashboard, edit any product, change prices, add new sizes, or mark items as sold out. Changes appear on your catalog instantly.",
              },
              {
                q: "Is my WhatsApp number safe?",
                a: "Your WhatsApp number is only used to receive orders. Customers tap the order button and it opens WhatsApp with a pre-filled message. We never share your number with third parties.",
              },
              {
                q: "How much does it cost?",
                a: "Free to start with up to 10 products. When you're ready for unlimited products and advanced features, upgrade to Pro for R199/month. No hidden fees.",
              },
              {
                q: "How is this different from just posting in WhatsApp groups?",
                a: "WhatsApp posts get buried in minutes. With TradeFeed, your products live on a permanent, searchable page. Customers can browse anytime, filter by category, and send you clean structured orders.",
              },
              {
                q: "Can I use this if I'm not tech-savvy?",
                a: "Absolutely. If you can post a photo on WhatsApp, you can use TradeFeed. Upload photos, type a name and price, and you're done. No technical skills needed.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-stone-800/50 bg-stone-900/40 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none hover:bg-stone-800/30 transition-colors">
                  <span className="font-medium text-sm text-stone-200 pr-4">{faq.q}</span>
                  <svg className="w-5 h-5 text-stone-500 flex-shrink-0 group-open:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-stone-400 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="py-24 px-5 border-t border-stone-800/50 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to organize your catalog?
          </h2>
          <p className="mt-4 text-stone-400 text-lg">
            Stop losing orders in WhatsApp chaos. Create your catalog in minutes
            and share it with your customers today.
          </p>
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="group inline-flex items-center justify-center px-10 py-4 text-base font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
            >
              {ctaLabel}
              <svg className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
          <p className="mt-3 text-xs text-stone-600">
            Free tier · No credit card · Set up in under 5 minutes
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="py-10 px-5 border-t border-stone-800/50 bg-stone-950">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="text-white font-extrabold text-[10px]">T</span>
            </div>
            <span className="text-sm font-semibold text-stone-400">
              Trade<span className="text-emerald-400">Feed</span>
            </span>
            <span className="text-xs text-stone-600 ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-stone-500">
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
