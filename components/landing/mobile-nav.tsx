// ============================================================
// Component — Mobile Navigation (Landing Page)
// ============================================================
// Full-screen immersive menu with staggered animations,
// icons, live stats, and premium glass-morphism effects.
// Designed to feel like a native app launcher — not a website nav.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";

interface MobileNavProps {
  ctaHref: string;
  ctaLabel: string;
  isSignedIn: boolean;
  isAdmin?: boolean;
  stats?: { shops: number; products: number; orders: number };
}

// ── Navigation items with icons ──────────────────────────
const NAV_ITEMS = [
  {
    label: "Marketplace",
    href: "/marketplace",
    description: "Browse all products",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
  },
  {
    label: "Features",
    href: "#features",
    description: "What you get",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  {
    label: "Pricing",
    href: "#pricing",
    description: "Free forever plan",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    label: "FAQ",
    href: "#faq",
    description: "Common questions",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    label: "Import Catalogue",
    href: "/import-whatsapp-catalogue",
    description: "WhatsApp → Online shop",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

export function MobileNav({
  ctaHref,
  ctaLabel,
  isSignedIn,
  isAdmin: isAdminUser,
  stats,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => {
    setMounted(false);
    setTimeout(() => setOpen(false), 250);
  }, []);

  // Lock scroll & bind Escape
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => setMounted(true));

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      {/* ── Hamburger Button ──────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all text-slate-600"
        aria-label="Open menu"
        suppressHydrationWarning
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* ── Full-screen Menu Overlay ──────────────────── */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-white/98 backdrop-blur-2xl transition-opacity duration-300 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
            onClick={close}
          />

          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className={`absolute -top-20 -right-20 w-72 h-72 bg-blue-500/[0.06] rounded-full blur-[100px] transition-opacity duration-700 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`absolute bottom-32 -left-16 w-56 h-56 bg-purple-500/[0.04] rounded-full blur-[80px] transition-opacity duration-700 delay-200 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* Menu Container */}
          <div
            className={`absolute inset-0 flex flex-col transition-all duration-300 ease-out ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3"
            }`}
          >
            {/* ── Header ─────────────────────────────── */}
            <div className="flex items-center justify-between px-5 h-16">
              <div className="flex items-center gap-2.5">
                <TradeFeedLogo size="lg" />
              </div>
              <button
                onClick={close}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 transition-all text-slate-600"
                aria-label="Close menu"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* ── Navigation Links ───────────────────── */}
            <nav className="flex-1 px-5 pt-6 pb-2 overflow-y-auto">
              <p
                className={`text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3 pl-4 transition-all duration-300 ${
                  mounted
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-3"
                }`}
                style={{ transitionDelay: mounted ? "60ms" : "0ms" }}
              >
                Navigate
              </p>
              <div className="space-y-1">
                {NAV_ITEMS.map((item, i) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={close}
                    className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-slate-100 active:bg-slate-200 active:scale-[0.98] transition-all duration-200 ${
                      mounted
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                    style={{
                      transitionDelay: mounted ? `${100 + i * 60}ms` : "0ms",
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-all duration-200 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-[12px] text-slate-500 group-hover:text-slate-600 transition-colors mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                ))}
              </div>

              {/* ── Admin Link (only for admins) ─────── */}
              {isAdminUser && (
                <div className="mt-4">
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3 pl-4 transition-all duration-300 ${
                      mounted
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-3"
                    }`}
                    style={{ transitionDelay: mounted ? "340ms" : "0ms" }}
                  >
                    Platform
                  </p>
                  <Link
                    href="/admin"
                    onClick={close}
                    className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 active:bg-red-100 active:scale-[0.98] transition-all duration-200 ${
                      mounted
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                    style={{ transitionDelay: mounted ? "400ms" : "0ms" }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center text-red-500 group-hover:text-red-600 transition-all duration-200 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-red-500 group-hover:text-red-600 transition-colors">
                        Admin Panel
                      </p>
                      <p className="text-[12px] text-slate-500 group-hover:text-slate-600 transition-colors mt-0.5">
                        Manage platform
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-300 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                </div>
              )}

              {/* ── Live Stats Card ────────────────────── */}
              {stats && (
                <div
                  className={`mt-6 mx-1 p-4 rounded-2xl bg-slate-50 border border-slate-200/60 transition-all duration-400 ${
                    mounted
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-95"
                  }`}
                  style={{ transitionDelay: mounted ? "380ms" : "0ms" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Live Platform
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: stats.shops, label: "Sellers", suffix: "+" },
                      { value: stats.products, label: "Products", suffix: "+" },
                      { value: stats.orders, label: "Orders", suffix: "+" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="text-center py-2 rounded-xl bg-white"
                      >
                        <p className="text-xl font-bold text-blue-600 tabular-nums">
                          {stat.value}{stat.suffix}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </nav>

            {/* ── Bottom Actions ──────────────────────── */}
            <div
              className={`px-5 pt-3 space-y-3 border-t border-slate-200/60 transition-all duration-300 ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={{
                transitionDelay: mounted ? "440ms" : "0ms",
                paddingBottom:
                  "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              {isSignedIn ? (
                <Link
                  href={ctaHref}
                  onClick={close}
                  className="flex items-center justify-center gap-2.5 w-full px-5 py-4 text-[15px] font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/25"
                >
                  {ctaLabel}
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
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    onClick={close}
                    className="flex items-center justify-center gap-2.5 w-full px-5 py-4 text-[15px] font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] transition-all shadow-xl shadow-blue-600/25"
                  >
                    Start Selling — It&apos;s Free
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
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/sign-in"
                    onClick={close}
                    className="flex items-center justify-center w-full px-5 py-3.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    Already have an account? Sign In
                  </Link>
                </>
              )}

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-slate-400">
                {["No credit card", "Setup in 5 min", "10 products free"].map(
                  (text) => (
                    <span key={text} className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {text}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
