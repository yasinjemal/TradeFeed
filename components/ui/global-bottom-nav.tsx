"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

// ============================================================
// Global Mobile Bottom Navigation
// ============================================================
// Persistent bottom tab bar shown on mobile across all public
// routes. Auto-hides on routes that have their own bottom nav
// (catalog, dashboard, admin).
//
// Matches the design language of BottomNav & MobileBottomNav.
// ============================================================

/** Route prefixes where this nav is hidden (they have their own) */
const HIDDEN_PREFIXES = [
  "/catalog/",
  "/dashboard/",
  "/admin",
  "/sign-in",
  "/sign-up",
  "/create-shop",
];

export function GlobalBottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  // Hide on routes that already have their own bottom navigation
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const accountHref = isSignedIn ? "/dashboard" : "/sign-in";
  const accountActive = isSignedIn
    ? pathname.startsWith("/dashboard") || pathname.startsWith("/create-shop")
    : pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  const tabs = [
    {
      key: "home",
      href: "/",
      label: "Home",
      isActive: pathname === "/",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045a1.125 1.125 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
      ),
    },
    {
      key: "marketplace",
      href: "/marketplace",
      label: "Explore",
      isActive: pathname.startsWith("/marketplace"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.125 7.125 0 1 0 6.575 6.575a7.125 7.125 0 0 0 10.075 10.075Z" />
        </svg>
      ),
    },
    {
      key: "orders",
      href: "/track",
      label: "Orders",
      isActive: pathname.startsWith("/track"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h9m-9 3.75h5.25" />
        </svg>
      ),
    },
    {
      key: "account",
      href: accountHref,
      label: "Account",
      isActive: accountActive,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.964 0A9 9 0 1 0 6.018 18.725m11.964 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Spacer so the fixed nav doesn't permanently cover page footer */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-stone-800/60 bg-stone-950/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.3)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Main navigation"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-4 px-1">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors duration-200 ${
                tab.isActive
                  ? "text-emerald-400"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {tab.icon}
              <span className="leading-none">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
