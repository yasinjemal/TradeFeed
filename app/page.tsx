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
      <section className="relative px-5 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border border-stone-800 bg-stone-900/80 shadow-2xl shadow-black/40 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-stone-900 border-b border-stone-800">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-stone-700" />
                <div className="w-3 h-3 rounded-full bg-stone-700" />
                <div className="w-3 h-3 rounded-full bg-stone-700" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-stone-800 rounded-md text-xs text-stone-500 font-mono">
                  tradefeed.co.za/catalog/your-shop
                </div>
              </div>
            </div>

            {/* Mock catalog content */}
            <div className="p-6 sm:p-8">
              {/* Shop header mock */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  JF
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-200 text-sm">Jeppe Fashion Hub</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">✓ Verified</span>
                  </div>
                  <span className="text-xs text-stone-500">📍 Johannesburg, Gauteng · 48 products</span>
                </div>
              </div>

              {/* Search bar mock */}
              <div className="flex gap-2 mb-6">
                <div className="flex-1 h-10 rounded-xl bg-stone-800/80 border border-stone-700/50 flex items-center px-3">
                  <svg className="w-4 h-4 text-stone-600 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                  <span className="text-xs text-stone-600">Search products...</span>
                </div>
              </div>

              {/* Product grid mock */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { name: "Oversized Hoodie", price: "R 280", colors: ["bg-stone-700", "bg-amber-700", "bg-emerald-700"] },
                  { name: "Cargo Pants", price: "R 320", colors: ["bg-stone-800", "bg-stone-500"] },
                  { name: "Graphic Tee Pack", price: "R 150", colors: ["bg-white", "bg-stone-900", "bg-blue-800"] },
                  { name: "Denim Jacket", price: "R 450", colors: ["bg-blue-700", "bg-stone-700"] },
                  { name: "Track Set", price: "R 380", colors: ["bg-stone-900", "bg-red-800"] },
                  { name: "Bucket Hat", price: "R 120", colors: ["bg-stone-900", "bg-amber-600", "bg-emerald-800"] },
                ].map((product) => (
                  <div key={product.name} className="group rounded-xl bg-stone-800/60 border border-stone-700/30 overflow-hidden hover:border-emerald-500/30 transition-all">
                    {/* Image placeholder */}
                    <div className="aspect-square bg-gradient-to-br from-stone-700 to-stone-800 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-stone-600">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-stone-300 truncate">{product.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-emerald-400">{product.price}</span>
                        <div className="flex gap-1">
                          {product.colors.map((c, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full ${c} border border-stone-600`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp CTA mock */}
              <div className="mt-6 flex items-center justify-center">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Order on WhatsApp
                </div>
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className="text-center text-xs text-stone-600 mt-4">
            ↑ This is what your customers see — a beautiful, searchable catalog on any phone
          </p>
        </div>
      </section>

      {/* ── How it Works ────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-5 border-t border-stone-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
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
                icon: "📦",
                title: "Upload Products",
                desc: "Add photos, prices, sizes, and colors. Drag & drop images — we handle the rest.",
              },
              {
                step: "2",
                icon: "🔗",
                title: "Share Your Link",
                desc: "Get a unique catalog URL. Drop it in your WhatsApp groups, status, or bio.",
              },
              {
                step: "3",
                icon: "💬",
                title: "Get WhatsApp Orders",
                desc: "Customers browse, pick sizes & quantities, and send you a structured order on WhatsApp.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-stone-900/60 border border-stone-800/60 hover:border-emerald-500/20 transition-all group"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-600/20">
                  {item.step}
                </div>
                <div className="text-3xl mb-4 mt-2">{item.icon}</div>
                <h3 className="text-lg font-bold text-stone-100">{item.title}</h3>
                <p className="mt-2 text-sm text-stone-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
                icon: "📱",
                title: "Works on All Phones",
                desc: "No app to install. Your customers just tap a link — works on any phone with WhatsApp.",
              },
              {
                icon: "🛍️",
                title: "Product Catalogs That Last",
                desc: "No more lost WhatsApp posts. Your products stay organized and always accessible.",
              },
              {
                icon: "📐",
                title: "Size & Color Variants",
                desc: "Set up S/M/L/XL with different colors and stock levels. Customers pick exactly what they want.",
              },
              {
                icon: "🛒",
                title: "Structured Orders",
                desc: "Customers add to cart with size + quantity. You get clean, organized WhatsApp orders.",
              },
              {
                icon: "🔍",
                title: "Search & Categories",
                desc: "Customers can search, filter by category, and sort by price. No more endless scrolling.",
              },
              {
                icon: "📊",
                title: "Seller Analytics",
                desc: "See how many people view your catalog, which products are popular, and track WhatsApp clicks.",
              },
              {
                icon: "✅",
                title: "Verified Seller Badge",
                desc: "Get verified to build trust with customers. Show you're a legitimate business.",
              },
              {
                icon: "🖼️",
                title: "CDN Image Hosting",
                desc: "Upload high-quality product photos. We compress and serve them fast from a global CDN.",
              },
              {
                icon: "💳",
                title: "Free Tier Included",
                desc: "Start with 10 products for free. Upgrade to Pro for R199/mo when you're ready to scale.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl bg-stone-900/60 border border-stone-800/50 hover:border-emerald-500/20 transition-all"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
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
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Built for How You Sell
          </h2>
          <p className="mt-3 text-stone-400 text-lg max-w-xl mx-auto">
            TradeFeed helps fashion sellers stop losing orders in chat. Control your
            inventory, present products beautifully, and let customers browse
            without scrolling through hundreds of messages.
          </p>

          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: "My customers used to DM me asking for sizes every time. Now they just check the catalog and order directly.",
                name: "Amina K.",
                location: "Jeppe, JHB",
                emoji: "👗",
              },
              {
                quote: "I share my TradeFeed link in 12 WhatsApp groups. Way better than posting photos every morning.",
                name: "Thabo M.",
                location: "Durban CBD",
                emoji: "👔",
              },
              {
                quote: "The structured orders save me so much time. No more confusion about sizes and quantities.",
                name: "Fatima S.",
                location: "Cape Town",
                emoji: "🧥",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="p-6 rounded-2xl bg-stone-900/60 border border-stone-800/50 text-left"
              >
                <div className="text-2xl mb-3">{testimonial.emoji}</div>
                <p className="text-sm text-stone-300 leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-200">{testimonial.name}</p>
                    <p className="text-[10px] text-stone-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-stone-600">
            📍 Built for clothing sellers in Johannesburg, Durban, Cape Town, and beyond
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
