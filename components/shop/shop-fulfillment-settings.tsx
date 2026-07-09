"use client";

import { useState, useTransition } from "react";
import { Check, Clock3, MapPin, RotateCcw, Truck } from "lucide-react";
import { toast } from "sonner";

import { updateShopFulfillmentAction } from "@/app/actions/shop-settings";
import { DISPATCH_WINDOWS } from "@/lib/validation/shop-settings";
import { TfButton } from "@/components/tf/button";

interface ShopFulfillmentSettingsProps {
  shopSlug: string;
  initialData: {
    deliveryEnabled: boolean;
    collectionEnabled: boolean;
    dispatchWindow: string;
    deliveryNote: string | null;
    returnPolicy: string | null;
  };
}

function SettingToggle({
  checked,
  onChange,
  icon: Icon,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  icon: typeof Truck;
  title: string;
  description: string;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-tf-stone-200 bg-tf-raised p-4">
      <div className="flex min-w-0 gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tf-verified-soft text-tf-primary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-tf-ink">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-tf-stone-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-primary focus-visible:ring-offset-2 disabled:opacity-50 ${
          checked ? "bg-tf-primary" : "bg-tf-stone-300"
        }`}
      >
        <span className={`mt-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function ShopFulfillmentSettings({ shopSlug, initialData }: ShopFulfillmentSettingsProps) {
  const [deliveryEnabled, setDeliveryEnabled] = useState(initialData.deliveryEnabled);
  const [collectionEnabled, setCollectionEnabled] = useState(initialData.collectionEnabled);
  const [dispatchWindow, setDispatchWindow] = useState(initialData.dispatchWindow);
  const [deliveryNote, setDeliveryNote] = useState(initialData.deliveryNote ?? "");
  const [returnPolicy, setReturnPolicy] = useState(initialData.returnPolicy ?? "");
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    deliveryEnabled !== initialData.deliveryEnabled ||
    collectionEnabled !== initialData.collectionEnabled ||
    dispatchWindow !== initialData.dispatchWindow ||
    deliveryNote !== (initialData.deliveryNote ?? "") ||
    returnPolicy !== (initialData.returnPolicy ?? "");

  function save() {
    startTransition(async () => {
      const result = await updateShopFulfillmentAction(shopSlug, {
        deliveryEnabled,
        collectionEnabled,
        dispatchWindow,
        deliveryNote,
        returnPolicy,
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not save fulfilment settings.");
        return;
      }
      toast.success("Buyer fulfilment settings updated");
    });
  }

  return (
    <section id="section-delivery" className="scroll-mt-28 overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
      <header className="flex gap-4 border-b border-tf-stone-200 px-6 py-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tf-verified-soft text-tf-primary">
          <Truck aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-tf-display text-lg font-semibold text-tf-ink">Delivery & collection</h2>
          <p className="mt-1 text-sm text-tf-stone-500">Set the fulfilment choices and expectations buyers see before they order.</p>
        </div>
      </header>

      <div className="space-y-5 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingToggle
            checked={deliveryEnabled}
            onChange={setDeliveryEnabled}
            icon={Truck}
            title="Courier delivery"
            description="Show courier quotes and let buyers enter a delivery address."
            disabled={isPending}
          />
          <SettingToggle
            checked={collectionEnabled}
            onChange={setCollectionEnabled}
            icon={MapPin}
            title="Collection from shop"
            description="Let buyers choose free collection and arrange a pickup time with you."
            disabled={isPending}
          />
        </div>

        {!deliveryEnabled && !collectionEnabled && (
          <p className="rounded-xl border border-tf-accent/20 bg-tf-accent-soft px-3 py-2.5 text-xs leading-relaxed text-tf-accent-ink">
            Buyers can still send an order on WhatsApp, but checkout will not make a delivery or collection promise.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-tf-ink">
            <span className="mb-1.5 flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4 text-tf-stone-500" />Typical dispatch time</span>
            <select
              value={dispatchWindow}
              disabled={isPending}
              onChange={(event) => setDispatchWindow(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-tf-stone-300 bg-tf-raised px-3 text-sm text-tf-ink outline-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
            >
              {DISPATCH_WINDOWS.map((window) => <option key={window} value={window}>{window}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-tf-ink">
            <span className="mb-1.5 flex items-center gap-2"><RotateCcw aria-hidden="true" className="size-4 text-tf-stone-500" />Returns & exchanges</span>
            <input
              value={returnPolicy}
              disabled={isPending}
              onChange={(event) => setReturnPolicy(event.target.value)}
              maxLength={1000}
              placeholder="e.g. Exchanges accepted within 7 days"
              className="min-h-11 w-full rounded-xl border border-tf-stone-300 bg-tf-raised px-3 text-sm text-tf-ink outline-none placeholder:text-tf-stone-400 focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-tf-ink">
          <span className="mb-1.5 block">Delivery note for buyers</span>
          <textarea
            value={deliveryNote}
            disabled={isPending}
            onChange={(event) => setDeliveryNote(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Same-day collection is available after we confirm your order on WhatsApp."
            className="w-full resize-y rounded-xl border border-tf-stone-300 bg-tf-raised px-3 py-2.5 text-sm text-tf-ink outline-none placeholder:text-tf-stone-400 focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
          />
          <span className="mt-1 block text-right text-xs text-tf-stone-400">{deliveryNote.length}/500</span>
        </label>

        <div className="flex justify-end border-t border-tf-stone-200 pt-4">
          <TfButton type="button" onClick={save} disabled={isPending || !hasChanges}>
            <Check aria-hidden="true" className="size-4" />{isPending ? "Saving..." : "Save fulfilment settings"}
          </TfButton>
        </div>
      </div>
    </section>
  );
}
