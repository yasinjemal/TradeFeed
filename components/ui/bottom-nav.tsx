"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { CartPanel } from "@/components/catalog/cart-panel";

interface BottomNavProps {
  shopSlug: string;
}

export function BottomNav({ shopSlug }: BottomNavProps) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const tabs = [
    {
      key: "home",
      href: `/catalog/${shopSlug}`,
      label: "Home",
      isActive:
        pathname === `/catalog/${shopSlug}` ||
        pathname.startsWith(`/catalog/${shopSlug}/`),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 11.204 3.045a1.125 1.125 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
      ),
    },
    {
      key: "marketplace",
      href: "/marketplace",
      label: "Marketplace",
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
      href: "/sign-in",
      label: "Account",
      isActive:
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up") ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/create-shop"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.964 0A9 9 0 1 0 6.018 18.725m11.964 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200/70 bg-white/95 backdrop-blur-xl shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5 px-1">
          {/* Home, Marketplace, Orders tabs */}
          {tabs.slice(0, 3).map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors duration-200 ${
                tab.isActive
                  ? "text-emerald-600"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {tab.icon}
              <span className="leading-none">{tab.label}</span>
            </Link>
          ))}

          {/* Cart button (opens drawer) */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors duration-200 ${
              cartOpen
                ? "text-emerald-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className="relative">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
            <span className="leading-none">Cart</span>
          </button>

          {/* Account tab */}
          {tabs.slice(3).map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition-colors duration-200 ${
                tab.isActive
                  ? "text-emerald-600"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {tab.icon}
              <span className="leading-none">{tab.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Cart drawer */}
      <CartPanel isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
