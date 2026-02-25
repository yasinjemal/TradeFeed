// ============================================================
// Component — Bottom Navigation (WhatsApp-Style)
// ============================================================
// Fixed bottom navigation bar for the catalog buyer experience.
// Gives the app a native mobile feel — like WhatsApp's tab bar.
//
// TABS:
// - Shop    → Current shop home (/catalog/[slug])
// - Explore → Marketplace discovery (/marketplace)
// - Cart    → Opens CartPanel slide-out (shows badge count)
// - Chat    → Direct WhatsApp link to seller
//
// DESIGN:
// - Fixed bottom, full-width, 64px tall
// - White background with subtle top border
// - Active tab: emerald-600, inactive: stone-400
// - Min 44px tap targets (WCAG / Apple HIG)
// - Safe-area-inset-bottom for iPhone notch
// - No new dependencies — pure Tailwind + inline SVGs
// ============================================================

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { CartPanel } from "@/components/catalog/cart-panel";

interface BottomNavProps {
  shopSlug: string;
  whatsappNumber: string;
}

export function BottomNav({ shopSlug, whatsappNumber }: BottomNavProps) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const isShop =
    pathname === `/catalog/${shopSlug}` ||
    (pathname.startsWith(`/catalog/${shopSlug}/`) &&
      !pathname.startsWith("/marketplace"));
  const isExplore = pathname.startsWith("/marketplace");

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-stone-200/60"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {/* ── Shop Home ──────────────────────────────── */}
          <Link
            href={`/catalog/${shopSlug}`}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] rounded-xl transition-colors duration-200 ${
              isShop
                ? "text-emerald-600"
                : "text-stone-400 active:text-stone-600"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isShop ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={isShop ? 0 : 1.8}
              stroke="currentColor"
            >
              {isShop ? (
                <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.061l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.689zM12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.432z" />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              )}
            </svg>
            <span className="text-[10px] font-semibold leading-none">
              Shop
            </span>
          </Link>

          {/* ── Explore / Marketplace ──────────────────── */}
          <Link
            href="/marketplace"
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] rounded-xl transition-colors duration-200 ${
              isExplore
                ? "text-emerald-600"
                : "text-stone-400 active:text-stone-600"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isExplore ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              strokeWidth={isExplore ? 0 : 1.8}
              stroke="currentColor"
            >
              {isExplore ? (
                <path
                  fillRule="evenodd"
                  d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
                />
              )}
            </svg>
            <span className="text-[10px] font-semibold leading-none">
              Explore
            </span>
          </Link>

          {/* ── Cart ───────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] rounded-xl text-stone-400 active:text-stone-600 transition-colors duration-200 relative"
          >
            <div className="relative">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              {/* Badge */}
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-sm">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold leading-none">
              Cart
            </span>
          </button>

          {/* ── WhatsApp Chat ──────────────────────────── */}
          <a
            href={`https://wa.me/${whatsappNumber.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[44px] rounded-xl text-stone-400 active:text-emerald-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-[10px] font-semibold leading-none">
              Chat
            </span>
          </a>
        </div>
      </nav>

      {/* ── Cart Panel (same slide-out as before) ──────── */}
      <CartPanel isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
