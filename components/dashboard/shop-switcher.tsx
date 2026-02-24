// ============================================================
// Component — Shop Switcher (Dashboard Header Dropdown)
// ============================================================
// Dropdown for users who own/manage multiple shops.
// Shows current shop name with a chevron — click to see all shops.
// Navigates to /dashboard/{slug} on selection.
//
// BEHAVIOUR:
// - Single shop: renders as static text (no dropdown affordance)
// - Multi-shop: renders as a dropdown with chevron indicator
// - Closes on outside click or Escape key
// - Shows role badge (Owner/Admin/Staff) for each shop
// - Current shop is highlighted with a check mark
// ============================================================

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShopItem {
  id: string;
  slug: string;
  name: string;
  role: string;
}

interface ShopSwitcherProps {
  currentSlug: string;
  shops: ShopItem[];
}

export function ShopSwitcher({ currentSlug, shops }: ShopSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentShop = shops.find((s) => s.slug === currentSlug);
  const hasMultipleShops = shops.length > 1;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSwitch = useCallback(
    (slug: string) => {
      if (slug === currentSlug) {
        setIsOpen(false);
        return;
      }
      setIsOpen(false);
      router.push(`/dashboard/${slug}`);
    },
    [currentSlug, router],
  );

  // Single shop — just plain text, no dropdown
  if (!hasMultipleShops) {
    return (
      <span className="text-sm font-medium text-stone-600 truncate max-w-[200px]">
        {currentShop?.name ?? currentSlug}
      </span>
    );
  }

  // Multi-shop — interactive dropdown
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-stone-100"
      >
        <span className="truncate max-w-[180px]">
          {currentShop?.name ?? currentSlug}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
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
      </button>

      {/* ── Dropdown Menu ───────────────────────────────── */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-stone-200 shadow-xl shadow-stone-200/50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 pb-2 mb-1 border-b border-stone-100">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Your Shops
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {shops.map((shop) => {
              const isCurrent = shop.slug === currentSlug;
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => handleSwitch(shop.slug)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isCurrent
                      ? "bg-emerald-50"
                      : "hover:bg-stone-50"
                  }`}
                >
                  {/* Shop Initial Avatar */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                      isCurrent
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {shop.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Shop Name + Role */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isCurrent ? "text-emerald-700" : "text-stone-800"
                      }`}
                    >
                      {shop.name}
                    </p>
                    <p className="text-[11px] text-stone-400 capitalize">
                      {shop.role.toLowerCase()}
                    </p>
                  </div>

                  {/* Check Mark for Current */}
                  {isCurrent && (
                    <svg
                      className="w-4 h-4 text-emerald-600 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
