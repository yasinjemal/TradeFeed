import { Clock3, MapPin, RotateCcw, Truck } from "lucide-react";

interface TfFulfillmentPromiseProps {
  deliveryEnabled: boolean;
  collectionEnabled: boolean;
  dispatchWindow: string;
  deliveryNote?: string | null;
  returnPolicy?: string | null;
  compact?: boolean;
}

/** A seller-configured fulfilment promise, shown before the order handoff. */
export function TfFulfillmentPromise({
  deliveryEnabled,
  collectionEnabled,
  dispatchWindow,
  deliveryNote,
  returnPolicy,
  compact = false,
}: TfFulfillmentPromiseProps) {
  if (!deliveryEnabled && !collectionEnabled && !returnPolicy) return null;

  return (
    <section aria-label="Delivery and returns" className="rounded-xl border border-tf-stone-200 bg-tf-raised p-4 shadow-tf-sm">
      <h2 className="font-tf-display text-sm font-semibold text-tf-ink">Buying with confidence</h2>
      <div className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
        {deliveryEnabled && <div className="flex gap-2.5 text-sm"><Truck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tf-primary" /><div><p className="font-medium text-tf-ink">Courier delivery</p><p className="text-xs text-tf-stone-500">Typical dispatch: {dispatchWindow}</p></div></div>}
        {collectionEnabled && <div className="flex gap-2.5 text-sm"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tf-primary" /><div><p className="font-medium text-tf-ink">Collection available</p><p className="text-xs text-tf-stone-500">Arrange a pickup time directly with the seller.</p></div></div>}
        {returnPolicy && <div className="flex gap-2.5 text-sm"><RotateCcw aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tf-primary" /><div><p className="font-medium text-tf-ink">Returns & exchanges</p><p className="text-xs leading-relaxed text-tf-stone-500">{returnPolicy}</p></div></div>}
      </div>
      {deliveryNote && <p className="mt-3 border-t border-tf-stone-100 pt-3 text-xs leading-relaxed text-tf-stone-600"><Clock3 aria-hidden="true" className="mr-1 inline size-3.5 text-tf-stone-400" />{deliveryNote}</p>}
    </section>
  );
}
