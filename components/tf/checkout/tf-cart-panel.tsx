"use client";

import * as React from "react";
import Image from "next/image";
import { useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import {
  buildWhatsAppCheckoutUrl,
  buildWhatsAppMessage,
  type DeliveryAddress,
} from "@/lib/cart/whatsapp-message";
import { checkoutAction } from "@/app/actions/orders";
import { trackWhatsAppCheckoutAction } from "@/app/actions/analytics";
import { formatShippingCost, type ShippingRate } from "@/lib/shipping/rates";
import { formatZAR } from "@/types";
import { TfButton } from "@/components/tf/button";
import { TfInput } from "@/components/tf/input";
import { TfTrustBar } from "@/components/tf/trust-bar";
import { TfVerifiedSellerCard } from "@/components/tf/verified-seller-card";

// ============================================================
// TfCartPanel — the WhatsApp handoff as a guided, reassuring
// step, not a dead end. Review order → your details → WhatsApp.
// Shows the Verified Seller card and trust bar BEFORE handoff,
// and a clean confirmation (with tracking) after. Same checkout
// action and message builders as the live panel — only the
// presentation changes. No dark patterns.
// ============================================================

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

interface TfCartPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Confirmation {
  orderNumber: string | null;
  trackingUrl: string | null;
  whatsappUrl: string;
  totalCents: number;
  itemCount: number;
}

export function TfCartPanel({ isOpen, onClose }: TfCartPanelProps) {
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
    shopProvince,
    shopCity,
    codEnabled,
    shopName,
    shopLogoUrl,
    shopVerified,
  } = useCart();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [buyerName, setBuyerName] = React.useState("");
  const [buyerPhone, setBuyerPhone] = React.useState("");
  const [buyerNote, setBuyerNote] = React.useState("");
  const [marketingConsent, setMarketingConsent] = React.useState(false);
  const [showDelivery, setShowDelivery] = React.useState(false);
  const [delivery, setDelivery] = React.useState<DeliveryAddress>({
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [shippingRates, setShippingRates] = React.useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = React.useState<string | null>(null);
  const [loadingRates, setLoadingRates] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<"PAYFAST" | "COD">("PAYFAST");
  const panelRef = React.useRef<HTMLDivElement>(null);

  const selectedShippingRate =
    selectedShipping && selectedShipping !== "collection"
      ? shippingRates.find((r) => `${r.carrier}|${r.service}` === selectedShipping) ?? null
      : null;
  const shippingCents = selectedShippingRate?.priceCents ?? 0;

  // Shipping rates lookup (same API as the live panel)
  React.useEffect(() => {
    if (!showDelivery || !delivery.province || !shopProvince) {
      setShippingRates([]);
      setSelectedShipping(null);
      return;
    }
    let cancelled = false;
    setLoadingRates(true);
    const params = new URLSearchParams({
      originProvince: shopProvince,
      destinationProvince: delivery.province,
      ...(shopCity ? { originCity: shopCity } : {}),
      ...(delivery.city ? { destinationCity: delivery.city } : {}),
    });
    fetch(`/api/shipping/rates?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setShippingRates(data.rates ?? []);
        if (data.rates?.length > 0) {
          const cheapest = data.rates[0];
          setSelectedShipping(`${cheapest.carrier}|${cheapest.service}`);
        }
      })
      .catch(() => {
        if (!cancelled) setShippingRates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDelivery, delivery.province, delivery.city, shopProvince, shopCity]);

  // Escape to close + scroll lock
  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    if (items.length === 0 || isPending) return;
    setError(null);
    const deliveryData = showDelivery && delivery.address.trim() ? delivery : null;

    startTransition(async () => {
      try {
        const whatsappMessage = buildWhatsAppMessage(items, deliveryData, undefined, shopSlug, paymentMethod);
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

        const result = await checkoutAction(
          shopId,
          shopSlug,
          orderItems,
          whatsappMessage,
          buyerName.trim() || undefined,
          buyerPhone.trim() || undefined,
          buyerNote.trim() || undefined,
          deliveryData?.address || undefined,
          deliveryData?.city || undefined,
          deliveryData?.province || undefined,
          deliveryData?.postalCode || undefined,
          marketingConsent,
          selectedShipping === "collection"
            ? "COLLECTION"
            : selectedShippingRate
              ? "PLATFORM_COURIER"
              : "SELLER_ARRANGED",
          selectedShippingRate?.priceCents ?? 0,
          selectedShippingRate?.carrier ?? undefined,
          paymentMethod,
        );

        if (!result.success) {
          setError(result.error ?? "We couldn't place this order. Check your details and try again.");
          return;
        }

        const hasRetailItems = items.some((i) => i.orderType === "retail");
        const checkoutNumber =
          hasRetailItems && retailWhatsappNumber ? retailWhatsappNumber : whatsappNumber;
        const url = buildWhatsAppCheckoutUrl(
          checkoutNumber,
          items,
          deliveryData,
          result.orderNumber,
          shopSlug,
          paymentMethod,
        );
        window.open(url, "_blank", "noopener,noreferrer");
        void trackWhatsAppCheckoutAction(shopId);

        setConfirmation({
          orderNumber: result.orderNumber ?? null,
          trackingUrl:
            result.trackingUrl ?? (result.orderNumber ? `/track/${result.orderNumber}` : null),
          whatsappUrl: url,
          totalCents: totalPriceInCents + shippingCents,
          itemCount: totalItems,
        });
        clearCart();
      } catch {
        setError(
          "Something interrupted the connection. Your cart is safe — try again in a moment.",
        );
      }
    });
  };

  if (!isOpen) return null;

  const sectionCls = "rounded-xl border border-tf-stone-200 bg-tf-raised p-4";
  const labelCls = "mb-1.5 block text-sm font-medium text-tf-ink";

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close cart"
        className="absolute inset-0 bg-tf-ink/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={confirmation ? "Order placed" : "Your order"}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-tf-surface shadow-tf-md outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-tf-stone-200 bg-tf-raised px-4 py-3">
          <h2 className="flex items-center gap-2 font-tf-display text-lg font-semibold text-tf-ink">
            {confirmation ? (
              <>
                <CheckCircle2 aria-hidden="true" className="size-5 text-tf-primary" />
                Order placed
              </>
            ) : (
              <>
                <ShoppingBag aria-hidden="true" className="size-5 text-tf-primary" />
                Your order
                {totalItems > 0 && (
                  <span className="rounded-full bg-tf-verified-soft px-2 py-0.5 text-xs font-medium tabular-nums text-tf-deep">
                    {totalItems}
                  </span>
                )}
              </>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-11 items-center justify-center rounded-full text-tf-stone-500 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* ── Confirmation state ───────────────────────── */}
        {confirmation ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div className="rounded-xl border border-tf-stone-200 bg-tf-raised p-5 text-center">
              <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-tf-primary" />
              {confirmation.orderNumber && (
                <p className="mt-3 font-tf-display text-xl font-semibold tabular-nums text-tf-ink">
                  {confirmation.orderNumber}
                </p>
              )}
              <p className="mt-1 text-sm tabular-nums text-tf-stone-600">
                {confirmation.itemCount} item{confirmation.itemCount === 1 ? "" : "s"} ·{" "}
                {formatZAR(confirmation.totalCents)}
              </p>
            </div>

            <div className={sectionCls}>
              <h3 className="font-tf-display text-sm font-semibold text-tf-ink">
                What happens next
              </h3>
              <ol className="mt-2 space-y-2 text-sm text-tf-stone-600">
                <li className="flex gap-2">
                  <span className="font-medium tabular-nums text-tf-primary">1.</span>
                  WhatsApp opened with your order — send the message to {shopName ?? "the seller"}.
                </li>
                <li className="flex gap-2">
                  <span className="font-medium tabular-nums text-tf-primary">2.</span>
                  They confirm stock, payment and delivery with you in the chat.
                </li>
                <li className="flex gap-2">
                  <span className="font-medium tabular-nums text-tf-primary">3.</span>
                  Track your order anytime with the order number above.
                </li>
              </ol>
            </div>

            {shopName && (
              <TfVerifiedSellerCard
                name={shopName}
                verified={shopVerified ?? false}
                avatarUrl={shopLogoUrl}
              />
            )}

            <div className="space-y-2">
              {confirmation.trackingUrl && (
                <TfButton asChild fullWidth>
                  <a href={confirmation.trackingUrl}>
                    <PackageCheck aria-hidden="true" />
                    Track this order
                  </a>
                </TfButton>
              )}
              <TfButton asChild variant="whatsapp" fullWidth>
                <a href={confirmation.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  Reopen WhatsApp message
                </a>
              </TfButton>
              <TfButton variant="ghost" fullWidth onClick={onClose}>
                Keep browsing
              </TfButton>
            </div>
          </div>
        ) : items.length === 0 ? (
          /* ── Empty cart ───────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingBag aria-hidden="true" className="size-10 text-tf-stone-300" />
            <h3 className="font-tf-display text-lg font-semibold text-tf-ink">
              Nothing here yet
            </h3>
            <p className="max-w-xs text-sm text-tf-stone-600">
              Pick a product, choose a size, and it&apos;ll wait for you here until you&apos;re
              ready to order.
            </p>
            <TfButton variant="secondary" onClick={onClose}>
              Browse products
            </TfButton>
          </div>
        ) : (
          /* ── Review + details + handoff ───────────────── */
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Step 1 — review */}
              <section aria-label="Review your order" className={sectionCls}>
                <h3 className="mb-3 font-tf-display text-sm font-semibold text-tf-ink">
                  <span className="tabular-nums text-tf-primary">1.</span> Review your order
                </h3>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={`${item.variantId}-${item.orderType}`} className="flex gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-tf-stone-200 bg-tf-stone-100">
                        {item.imageUrl && (
                          <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-tf-ink">
                          {item.productName}
                        </p>
                        <p className="text-xs text-tf-stone-500">
                          {item.size}
                          {item.color ? ` · ${item.color}` : ""}
                          {item.orderType === "wholesale" ? " · wholesale" : ""}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-tf-stone-300">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.productName}`}
                              onClick={() =>
                                item.quantity > 1
                                  ? updateQuantity(item.variantId, item.quantity - 1, item.orderType)
                                  : removeItem(item.variantId, item.orderType)
                              }
                              className="flex size-8 items-center justify-center rounded-full text-tf-stone-600 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="min-w-7 text-center text-xs font-medium tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.productName}`}
                              onClick={() =>
                                updateQuantity(
                                  item.variantId,
                                  Math.min(item.maxStock, item.quantity + 1),
                                  item.orderType,
                                )
                              }
                              disabled={item.quantity >= item.maxStock}
                              className="flex size-8 items-center justify-center rounded-full text-tf-stone-600 outline-none hover:bg-tf-stone-100 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:opacity-40"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-tf-ink">
                            {formatZAR(item.priceInCents * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId, item.orderType)}
                        aria-label={`Remove ${item.productName}`}
                        className="flex size-8 shrink-0 items-center justify-center self-start rounded-full text-tf-stone-400 outline-none hover:bg-tf-error-soft hover:text-tf-error focus-visible:ring-2 focus-visible:ring-tf-primary"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Step 2 — details */}
              <section aria-label="Your details" className={sectionCls}>
                <h3 className="mb-3 font-tf-display text-sm font-semibold text-tf-ink">
                  <span className="tabular-nums text-tf-primary">2.</span> Your details{" "}
                  <span className="font-normal text-tf-stone-400">(optional, speeds things up)</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="tf-buyer-name" className={labelCls}>Name</label>
                    <TfInput
                      id="tf-buyer-name"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      autoComplete="name"
                      placeholder="So the seller knows who's ordering"
                    />
                  </div>
                  <div>
                    <label htmlFor="tf-buyer-phone" className={labelCls}>Phone</label>
                    <TfInput
                      id="tf-buyer-phone"
                      type="tel"
                      inputMode="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      autoComplete="tel"
                      placeholder="For delivery updates"
                    />
                  </div>
                  <div>
                    <label htmlFor="tf-buyer-note" className={labelCls}>Note to seller</label>
                    <TfInput
                      id="tf-buyer-note"
                      value={buyerNote}
                      onChange={(e) => setBuyerNote(e.target.value)}
                      placeholder="Anything they should know"
                    />
                  </div>

                  {/* Delivery toggle */}
                  <button
                    type="button"
                    onClick={() => setShowDelivery((v) => !v)}
                    aria-expanded={showDelivery}
                    className="flex min-h-11 w-full items-center justify-between rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 text-sm text-tf-ink outline-none hover:border-tf-stone-400 focus-visible:ring-2 focus-visible:ring-tf-primary"
                  >
                    Add a delivery address
                    <ChevronDown
                      aria-hidden="true"
                      className={cn("size-4 text-tf-stone-400 transition-transform motion-reduce:transition-none", showDelivery && "rotate-180")}
                    />
                  </button>

                  {showDelivery && (
                    <div className="space-y-3 rounded-lg bg-tf-stone-50 p-3">
                      <div>
                        <label htmlFor="tf-addr" className={labelCls}>Street address</label>
                        <TfInput
                          id="tf-addr"
                          value={delivery.address}
                          onChange={(e) => setDelivery((d) => ({ ...d, address: e.target.value }))}
                          autoComplete="street-address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="tf-city" className={labelCls}>City</label>
                          <TfInput
                            id="tf-city"
                            value={delivery.city}
                            onChange={(e) => setDelivery((d) => ({ ...d, city: e.target.value }))}
                            autoComplete="address-level2"
                          />
                        </div>
                        <div>
                          <label htmlFor="tf-postal" className={labelCls}>Postal code</label>
                          <TfInput
                            id="tf-postal"
                            inputMode="numeric"
                            value={delivery.postalCode}
                            onChange={(e) => setDelivery((d) => ({ ...d, postalCode: e.target.value }))}
                            autoComplete="postal-code"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="tf-province" className={labelCls}>Province</label>
                        <select
                          id="tf-province"
                          value={delivery.province}
                          onChange={(e) => setDelivery((d) => ({ ...d, province: e.target.value }))}
                          className="min-h-11 w-full rounded-[10px] border border-tf-stone-300 bg-tf-raised px-3 text-[15px] text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
                        >
                          <option value="">Choose a province</option>
                          {SA_PROVINCES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* Shipping options */}
                      {loadingRates && (
                        <p className="text-xs text-tf-stone-500">Checking courier rates…</p>
                      )}
                      {(shippingRates.length > 0 || delivery.province) && !loadingRates && (
                        <fieldset>
                          <legend className={labelCls}>Delivery option</legend>
                          <div className="space-y-2">
                            {shippingRates.map((r) => {
                              const key = `${r.carrier}|${r.service}`;
                              return (
                                <label
                                  key={key}
                                  className={cn(
                                    "flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-[10px] border px-3 text-sm",
                                    selectedShipping === key
                                      ? "border-tf-primary bg-tf-verified-soft text-tf-deep"
                                      : "border-tf-stone-300 bg-tf-raised text-tf-stone-600",
                                  )}
                                >
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="tf-shipping"
                                      checked={selectedShipping === key}
                                      onChange={() => setSelectedShipping(key)}
                                      className="accent-[#047857]"
                                    />
                                    {r.carrier} — {r.service}
                                  </span>
                                  <span className="font-medium tabular-nums">{formatShippingCost(r.priceCents)}</span>
                                </label>
                              );
                            })}
                            <label
                              className={cn(
                                "flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border px-3 text-sm",
                                selectedShipping === "collection"
                                  ? "border-tf-primary bg-tf-verified-soft text-tf-deep"
                                  : "border-tf-stone-300 bg-tf-raised text-tf-stone-600",
                              )}
                            >
                              <input
                                type="radio"
                                name="tf-shipping"
                                checked={selectedShipping === "collection"}
                                onChange={() => setSelectedShipping("collection")}
                                className="accent-[#047857]"
                              />
                              I&apos;ll collect from the seller
                            </label>
                          </div>
                        </fieldset>
                      )}
                    </div>
                  )}

                  {/* Payment method */}
                  {codEnabled && (
                    <fieldset>
                      <legend className={labelCls}>Payment</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            ["PAYFAST", "PayFast (secure)"],
                            ["COD", "Cash on delivery"],
                          ] as const
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[10px] border px-2 text-sm",
                              paymentMethod === value
                                ? "border-tf-primary bg-tf-verified-soft font-medium text-tf-deep"
                                : "border-tf-stone-300 bg-tf-raised text-tf-stone-600",
                            )}
                          >
                            <input
                              type="radio"
                              name="tf-payment"
                              checked={paymentMethod === value}
                              onChange={() => setPaymentMethod(value)}
                              className="sr-only"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  <label className="flex cursor-pointer items-start gap-2 text-xs text-tf-stone-500">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 accent-[#047857]"
                    />
                    The seller may message me about new stock (POPIA: you can opt out anytime).
                  </label>
                </div>
              </section>

              {/* Who you're ordering from */}
              {shopName && (
                <TfVerifiedSellerCard
                  name={shopName}
                  verified={shopVerified ?? false}
                  avatarUrl={shopLogoUrl}
                  location={[shopCity, shopProvince].filter(Boolean).join(", ") || undefined}
                />
              )}

              <TfTrustBar compact />
            </div>

            {/* Step 3 — handoff (sticky footer) */}
            <div className="space-y-3 border-t border-tf-stone-200 bg-tf-raised p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {error && (
                <p role="alert" className="rounded-lg bg-tf-error-soft px-3 py-2 text-sm text-tf-error">
                  {error}
                </p>
              )}
              <dl className="space-y-1 text-sm tabular-nums">
                <div className="flex justify-between text-tf-stone-600">
                  <dt>Items ({totalItems})</dt>
                  <dd>{formatZAR(totalPriceInCents)}</dd>
                </div>
                {shippingCents > 0 && (
                  <div className="flex justify-between text-tf-stone-600">
                    <dt>Courier</dt>
                    <dd>{formatShippingCost(shippingCents)}</dd>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-tf-ink">
                  <dt>Total</dt>
                  <dd>{formatZAR(totalPriceInCents + shippingCents)}</dd>
                </div>
              </dl>
              <TfButton
                variant="whatsapp"
                size="lg"
                fullWidth
                onClick={handleCheckout}
                disabled={isPending}
              >
                <MessageCircle aria-hidden="true" />
                {isPending ? "Placing your order…" : "Order on WhatsApp"}
              </TfButton>
              <p className="text-center text-xs text-tf-stone-500">
                <span className="tabular-nums text-tf-primary">3.</span> WhatsApp opens with this
                order pre-filled — nothing is paid until you and the seller agree.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
