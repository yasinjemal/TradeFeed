// ============================================================
// Component — Wishlist Panel (Slide-out Drawer)
// ============================================================
// Shows the buyer's favourited products. Similar UX to cart panel
// but focused on browsing — links to product detail pages.
// ============================================================

"use client";

import { useEffect, useRef } from "react";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import Link from "next/link";
import Image from "next/image";
import { formatZAR } from "@/types";

interface WishlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shopSlug: string;
}

export function WishlistPanel({ isOpen, onClose, shopSlug }: WishlistPanelProps) {
  const { items, removeItem, clearWishlist, count } = useWishlist();

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape + focus trap
  useEffect(() => {
    if (!isOpen) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* ── Backdrop ──────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* ── Panel ─────────────────────────────────────────── */}
      <div ref={panelRef} className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col" role="dialog" aria-modal="true" aria-label="Favourites">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <h2 className="font-bold text-stone-900 text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Favourites
            </h2>
            <p className="text-xs text-stone-500 mt-0.5" aria-live="polite">
              {count} {count === 1 ? "item" : "items"} saved
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close favourites"
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors text-stone-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Items List ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <p className="text-stone-500 text-sm">No favourites yet</p>
              <p className="text-stone-400 text-xs mt-1">
                Tap the heart icon on products you like
              </p>
              <button
                onClick={onClose}
                className="mt-3 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
              >
                Browse products
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100 group"
              >
                {/* Image */}
                <Link
                  href={`/catalog/${shopSlug}/products/${item.productId}`}
                  onClick={onClose}
                  className="w-16 h-16 rounded-lg bg-stone-200 overflow-hidden flex-shrink-0"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/catalog/${shopSlug}/products/${item.productId}`}
                    onClick={onClose}
                    className="font-semibold text-stone-900 text-sm hover:text-emerald-700 transition-colors line-clamp-2"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-sm font-bold text-stone-700 mt-1">
                    {formatZAR(item.priceInCents)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="self-start w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label={`Remove ${item.productName} from favourites`}
                  title="Remove from favourites"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4 bg-white">
            <button
              onClick={() => {
                if (confirm("Remove all favourites?")) clearWishlist();
              }}
              className="text-xs text-stone-400 hover:text-red-500 transition-colors underline"
            >
              Clear all favourites
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
