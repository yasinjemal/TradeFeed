// ============================================================
// Component — Cart Panel (Slide-out Drawer)
// ============================================================
// Full cart view with item list, quantities, totals, and
// the WhatsApp checkout button.
//
// DESIGN:
// - Slides in from the right (mobile-friendly)
// - Backdrop blur overlay (feels premium)
// - Each item: product name, option1, option2, price, qty stepper, remove
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

import { useEffect, useCallback, useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart/cart-context";
import { IllustrationEmptyCart } from "@/components/ui/illustrations";
import {
  buildWhatsAppCheckoutUrl,
  buildWhatsAppMessage,
  type DeliveryAddress,
} from "@/lib/cart/whatsapp-message";
import { formatZAR } from "@/types";
import { trackWhatsAppCheckoutAction } from "@/app/actions/analytics";
import { checkoutAction } from "@/app/actions/orders";
import { toast } from "sonner";

const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

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
    retailWhatsappNumber,
    shopId,
    shopSlug,
  } = useCart();

  const [isPending, startTransition] = useTransition();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showDelivery, setShowDelivery] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryAddress>({
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });

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
        if (!first || !last) return;

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

  const handleCheckout = useCallback(() => {
    if (items.length === 0 || isPending) return;
    setCheckoutError(null);

    // Resolve delivery if form is open and address is filled
    const deliveryData =
      showDelivery && delivery.address.trim() ? delivery : null;

    startTransition(async () => {
      // 1. Build WhatsApp message (needed for order record + URL)
      const whatsappMessage = buildWhatsAppMessage(items, deliveryData);

      // 2. Map cart items to order input format
      const orderItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        option1Label: item.option1Label || "Size",
        option1Value: item.size,
        option2Label: item.option2Label || "Color",
        option2Value: item.color,
        priceInCents: item.priceInCents,
        quantity: item.quantity,
      }));

      // 3. Create order (validates stock + saves to DB)
      const result = await checkoutAction(
        shopId,
        shopSlug,
        orderItems,
        whatsappMessage,
        buyerName.trim() || undefined,
        buyerPhone.trim() || undefined,
        buyerNote.trim() || undefined, // buyerNote
        deliveryData?.address || undefined,
        deliveryData?.city || undefined,
        deliveryData?.province || undefined,
        deliveryData?.postalCode || undefined,
        marketingConsent,
      );

      if (!result.success) {
        setCheckoutError(result.error ?? "Failed to place order.");
        return;
      }

      // 4. Open WhatsApp with structured message (includes order number)
      const hasRetailItems = items.some((i) => i.orderType === "retail");
      const checkoutNumber = hasRetailItems && retailWhatsappNumber
        ? retailWhatsappNumber
        : whatsappNumber;
      const url = buildWhatsAppCheckoutUrl(
        checkoutNumber,
        items,
        deliveryData,
        result.orderNumber,
      );
      window.open(url, "_blank", "noopener,noreferrer");

      // 5. Track checkout event (fire-and-forget)
      void trackWhatsAppCheckoutAction(shopId);

      // 6. Show tracking notification
      if (result.orderNumber) {
        toast.success("Order placed!", {
          description: `Order ${result.orderNumber} — Track your order anytime.`,
          action: result.trackingUrl ? {
            label: "Track Order",
            onClick: () => window.open(result.trackingUrl!, "_self"),
          } : undefined,
          duration: 10000,
        });
      }

      // 7. Clear cart after opening WhatsApp
      clearCart();
      onClose();
    });
  }, [items, isPending, shopId, shopSlug, whatsappNumber, retailWhatsappNumber, clearCart, onClose, showDelivery, delivery]);

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
      <div
        ref={panelRef}
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <h2 className="font-bold text-stone-900 text-lg">Your Order</h2>
            <p className="text-xs text-stone-500 mt-0.5" aria-live="polite">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close cart"
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
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <IllustrationEmptyCart className="w-32 h-32 mb-3" />
              <p className="text-stone-600 text-sm font-medium">Your cart is empty</p>
              <p className="text-stone-400 text-xs mt-1">Add items from the catalog to get started</p>
              <button
                onClick={onClose}
                className="mt-4 text-emerald-600 text-sm font-medium hover:text-emerald-700 transition-colors"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.variantId}__${item.orderType ?? "wholesale"}`}
                className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-stone-200 overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900 text-sm truncate">
                    {item.productName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-xs font-medium">
                      {item.option1Label ?? "Size"}: {item.size}
                    </span>
                    {item.color && (
                      <span className="text-xs text-stone-500">
                        {item.option2Label ?? "Color"}: {item.color}
                      </span>
                    )}
                    {item.orderType === "retail" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-semibold">
                        🛍️ Retail
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        🏭 Wholesale
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    {/* Quantity Stepper */}
                    <div className="flex items-center bg-white rounded-lg border border-stone-200 overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1, item.orderType)
                        }
                        aria-label={item.quantity <= (item.orderType === "retail" ? 1 : (item.minWholesaleQty ?? 1)) ? `Remove ${item.productName}` : `Decrease quantity of ${item.productName}`}
                        title={item.quantity <= (item.orderType === "retail" ? 1 : (item.minWholesaleQty ?? 1)) ? "Remove from cart" : "Decrease quantity"}
                        className="w-8 h-8 flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors"
                      >
                        {item.quantity <= (item.orderType === "retail" ? 1 : (item.minWholesaleQty ?? 1)) ? (
                          <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                          </svg>
                        )}
                      </button>
                      <span className="w-8 text-center font-semibold text-xs tabular-nums text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.variantId,
                            Math.min(item.quantity + 1, item.maxStock),
                            item.orderType
                          )
                        }
                        disabled={item.quantity >= item.maxStock}
                        aria-label={`Increase quantity of ${item.productName}`}
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
                  {item.orderType !== "retail" && (item.minWholesaleQty ?? 1) > 1 && (
                    <p className="text-[10px] text-amber-600 mt-1">Wholesale min. {item.minWholesaleQty} units</p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.variantId, item.orderType)}
                  className="self-start w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label={`Remove ${item.productName} from cart`}
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
            {/* Stock Error */}
            {checkoutError && (
              <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>{checkoutError}</span>
              </div>
            )}

            {/* ── Buyer Info (Optional) ─────────────────── */}
            <div className="space-y-2.5 p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-xs font-medium text-stone-500">Your details <span className="text-stone-400">(optional)</span></p>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="buyer-name" className="block text-xs font-medium text-stone-500 mb-1">
                    Name
                  </label>
                  <input
                    id="buyer-name"
                    type="text"
                    placeholder="Your name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
                <div>
                  <label htmlFor="buyer-phone" className="block text-xs font-medium text-stone-500 mb-1">
                    Phone
                  </label>
                  <input
                    id="buyer-phone"
                    type="tel"
                    placeholder="07X XXX XXXX"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="buyer-note" className="block text-xs font-medium text-stone-500 mb-1">
                  Order notes
                </label>
                <textarea
                  id="buyer-note"
                  placeholder="Any special instructions…"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400 resize-none"
                />
              </div>
            </div>

            {/* ── Delivery Address Toggle ─────────────────── */}
            <button
              type="button"
              onClick={() => setShowDelivery((prev) => !prev)}
              className="flex items-center gap-2 w-full text-left text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors py-1"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {showDelivery ? "Remove delivery address" : "Add delivery address"}
              <svg
                className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${showDelivery ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {/* ── Delivery Address Form (Collapsible) ─────── */}
            {showDelivery && (
              <div className="space-y-2.5 p-3 bg-stone-50 rounded-xl border border-stone-100 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label htmlFor="delivery-address" className="block text-xs font-medium text-stone-500 mb-1">
                    Street Address
                  </label>
                  <input
                    id="delivery-address"
                    type="text"
                    placeholder="123 Main Road, Unit 4B"
                    value={delivery.address}
                    onChange={(e) => setDelivery((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="delivery-city" className="block text-xs font-medium text-stone-500 mb-1">
                      City
                    </label>
                    <input
                      id="delivery-city"
                      type="text"
                      placeholder="Johannesburg"
                      value={delivery.city}
                      onChange={(e) => setDelivery((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="delivery-postal" className="block text-xs font-medium text-stone-500 mb-1">
                      Postal Code
                    </label>
                    <input
                      id="delivery-postal"
                      type="text"
                      placeholder="2000"
                      value={delivery.postalCode}
                      onChange={(e) => setDelivery((prev) => ({ ...prev, postalCode: e.target.value }))}
                      maxLength={6}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900 placeholder:text-stone-400"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="delivery-province" className="block text-xs font-medium text-stone-500 mb-1">
                    Province
                  </label>
                  <select
                    id="delivery-province"
                    value={delivery.province}
                    onChange={(e) => setDelivery((prev) => ({ ...prev, province: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-stone-900"
                  >
                    <option value="">Select province…</option>
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

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
            {/* Opt-in consent for future updates */}
            <label className="flex items-start gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-stone-500 leading-tight group-hover:text-stone-600 transition-colors">
                Send me updates about new products & deals from this seller on WhatsApp
              </span>
            </label>

            <button
              onClick={handleCheckout}
              disabled={isPending}
              className="flex items-center justify-center gap-2.5 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-wait text-white py-4 rounded-2xl text-base font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-emerald-200 active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-current"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {isPending ? "Placing Order…" : "Send Order on WhatsApp"}
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
