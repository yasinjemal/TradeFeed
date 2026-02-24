// ============================================================
// Page — Create Shop (Redesigned)
// ============================================================
// Protected route for creating a new shop.
// Split layout: left = branding + trust, right = form
// ROUTE: /create-shop
// ============================================================

import Link from "next/link";
import { CreateShopForm } from "@/components/shop/create-shop-form";

export const metadata = {
  title: "Create Your Shop — TradeFeed",
  description: "Set up your digital catalog for WhatsApp selling in minutes.",
};

export default function CreateShopPage() {
  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col lg:flex-row">
      {/* ── Left Panel — Branding & Trust ──────────────── */}
      <div className="relative lg:w-[48%] flex flex-col justify-between p-8 lg:p-12 xl:p-16 overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-stone-950 to-stone-950" />
        <div className="pointer-events-none absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-[-15%] right-[-15%] w-[400px] h-[400px] rounded-full bg-emerald-600/6 blur-[100px]" />

        {/* Top — Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
              <span className="text-white font-extrabold text-sm">T</span>
            </div>
            <span className="font-bold text-xl tracking-tight">
              Trade<span className="text-emerald-400">Feed</span>
            </span>
          </Link>
        </div>

        {/* Middle — Value prop */}
        <div className="relative z-10 my-12 lg:my-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            Takes less than 2 minutes
          </div>

          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight leading-[1.15]">
            Launch your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              digital catalog
            </span>{" "}
            today
          </h1>

          <p className="mt-4 text-stone-400 text-base lg:text-lg max-w-md leading-relaxed">
            Give your clothing business a professional storefront link. Share it on WhatsApp and let buyers browse, pick sizes, and order — all structured.
          </p>

          {/* Feature checklist */}
          <div className="mt-8 space-y-3.5">
            {[
              { icon: "🔗", text: "Get a shareable catalog link instantly" },
              { icon: "📱", text: "Buyers order via WhatsApp — no app needed" },
              { icon: "📦", text: "Manage products, variants, and stock" },
              { icon: "⚡", text: "Free plan — upgrade anytime" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-stone-800/80 border border-stone-700/50 flex items-center justify-center text-sm">
                  {item.icon}
                </div>
                <span className="text-stone-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Social proof */}
        <div className="relative z-10 space-y-4">
          {/* Seller avatars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {[
                "from-amber-400 to-orange-500",
                "from-blue-400 to-indigo-500",
                "from-pink-400 to-rose-500",
                "from-emerald-400 to-teal-500",
              ].map((gradient, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-stone-950 flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {["JM", "TK", "NZ", "SM"][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">Trusted by 200+ SA sellers</p>
            </div>
          </div>

          <div className="h-px bg-stone-800/60" />

          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} TradeFeed · <Link href="/privacy" className="hover:text-stone-400 transition-colors">Privacy</Link> · <Link href="/terms" className="hover:text-stone-400 transition-colors">Terms</Link>
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative">
        {/* Subtle grid pattern */}
        <div className="pointer-events-none absolute inset-0 bg-stone-900/50" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <CreateShopForm />
        </div>
      </div>
    </main>
  );
}
