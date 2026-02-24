// ============================================================
// Component — Cart Panel (Slide-out Drawer)
// ============================================================
// Full cart view with item list, quantities, totals, and
// the WhatsApp checkout button.
//
// DESIGN:
// - Slides in from the right (mobile-friendly)
// - Backdrop blur overlay (feels premium)
// - Each item: product name, size, color, price, qty stepper, remove
// - Footer: total + "Send Order on WhatsApp" button
// - Clear cart option
// - Closes on backdrop tap or X button
//
// CHECKOUT FLOW:
// 1. Buyer reviews cart
// 2. Taps "Send Order on WhatsApp"
// 3. wa.me opens with structured order message
// 4. Cart clears after opening WhatsApp
// ============================================================

"use client";

import { useEffect, useCallback } from "react";
import { useCart } from "@/lib/cart/cart-context";
import { buildWhatsAppCheckoutUrl } from "@/lib/cart/whatsapp-message";
import { formatZAR } from "@/types";
import { trackWhatsAppCheckoutAction } from "@/app/actions/analytics";

interface CartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartPanel({ isOpen, onClose }: CartPanelProps) {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPriceInCents,
    whatsappNumber,
    shopId,
  } = useCart();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when panel is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return;

    const url = buildWhatsAppCheckoutUrl(whatsappNumber, items);
    window.open(url, "_blank", "noopener,noreferrer");

    // Track checkout event (fire-and-forget)
    void trackWhatsAppCheckoutAction(shopId);

    // Clear cart after opening WhatsApp
    clearCart();
    onClose();
  }, [items, whatsappNumber, shopId, clearCart, onClose]);

  const handleClearCart = useCallback(() => {
    if (!confirm("Remove all items from your cart?")) return;
    clearCart();
  }, [clearCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* ── Backdrop ──────────────────────────────────────── */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* ── Panel ─────────────────────────────────────────── */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <h2 className="font-bold text-stone-900 text-lg">Your Order</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-stone-100 transition-colors text-stone-500"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Items List ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-stone-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
              </div>
              <p className="text-stone-500 text-sm">Your cart is empty</p>
              <button
                onClick={onClose}
                className="mt-3 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
              >
                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 text-sm truncate">
                    {item.productName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-xs font-medium">
                      {item.size}
                    </span>
                    {item.color && (
                      <span className="text-xs text-stone-500">
                        {item.color}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-white rounded-lg border border-stone-200 overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      </button>
                      <span className="w-8 text-center font-semibold text-xs tabular-nums text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.variantId,
                            Math.min(item.quantity + 1, item.maxStock)
                          )
                        }
                        disabled={item.quantity >= item.maxStock}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors disabled:text-stone-300"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="font-bold text-sm text-stone-900">
                      {formatZAR(item.priceInCents * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="self-start w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Remove item"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── Footer: Total + Checkout ────────────────────── */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 px-5 py-4 space-y-3 bg-white">
            {/* Order Summary */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-stone-500">Order Total</span>
                <div className="text-xl font-bold text-stone-900">
                  {formatZAR(totalPriceInCents)}
                </div>
              </div>
              <button
                onClick={handleClearCart}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors underline"
              >
                Clear all
              </button>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              onClick={handleCheckout}
              className="flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-base font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-emerald-200 active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-current"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Send Order on WhatsApp
            </button>

            <p className="text-[10px] text-stone-400 text-center">
              Opens WhatsApp with your order details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
