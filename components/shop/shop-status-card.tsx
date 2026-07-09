"use client";

import { useState, useTransition } from "react";
import { Copy, ExternalLink, Eye, EyeOff, Loader2, PauseCircle, Store, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { setShopVisibilityAction } from "@/app/actions/shop-settings";
import { TfButton } from "@/components/tf/button";

interface ShopStatusCardProps {
  shopSlug: string;
  shopName: string;
  initialIsActive: boolean;
}

export function ShopStatusCard({ shopSlug, shopName, initialIsActive }: ShopStatusCardProps) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [confirmPause, setConfirmPause] = useState(false);
  const [isPending, startTransition] = useTransition();
  function copyCatalogLink() {
    const catalogUrl = `${window.location.origin}/catalog/${shopSlug}`;
    navigator.clipboard.writeText(catalogUrl)
      .then(() => toast.success("Catalog link copied"))
      .catch(() => toast.error("Couldn’t copy the catalog link"));
  }

  function updateVisibility(next: boolean) {
    setIsActive(next);
    setConfirmPause(false);
    startTransition(async () => {
      const result = await setShopVisibilityAction(shopSlug, next);
      if (!result.success) {
        setIsActive(!next);
        toast.error(result.error ?? "Couldn’t update store status");
      } else {
        toast.success(next ? "Your shop is live" : "Your shop is paused");
      }
    });
  }

  return (
    <section id="section-store" className="scroll-mt-28 overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${isActive ? "bg-tf-verified-soft text-tf-primary" : "bg-tf-accent-soft text-tf-accent-ink"}`}>
            {isActive ? <Store aria-hidden="true" className="size-5" /> : <PauseCircle aria-hidden="true" className="size-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-tf-display text-lg font-semibold text-tf-ink">Store status</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? "bg-tf-verified-soft text-tf-deep" : "bg-tf-accent-soft text-tf-accent-ink"}`}>{isActive ? "Live and visible" : "Paused"}</span>
            </div>
            <p className="mt-1 text-sm text-tf-stone-600">
              {isActive ? `${shopName} is visible in its catalogue and eligible for marketplace discovery.` : "Your catalogue is hidden from buyers until you make the shop live again."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TfButton type="button" variant="secondary" size="sm" onClick={copyCatalogLink}><Copy aria-hidden="true" className="size-4" />Copy link</TfButton>
          <TfButton asChild variant="secondary" size="sm"><a href={`/catalog/${shopSlug}`} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" className="size-4" />Preview</a></TfButton>
          {isActive ? (
            <TfButton type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setConfirmPause(true)}><EyeOff aria-hidden="true" className="size-4" />Pause shop</TfButton>
          ) : (
            <TfButton type="button" size="sm" disabled={isPending} onClick={() => updateVisibility(true)}>{isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Eye aria-hidden="true" className="size-4" />}Make live</TfButton>
          )}
        </div>
      </div>
      {confirmPause && (
        <div className="flex flex-col gap-3 border-t border-tf-accent/20 bg-tf-accent-soft px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-tf-ink"><TriangleAlert aria-hidden="true" className="size-4 text-tf-accent-ink" />Buyers won&apos;t be able to browse or order from this shop.</p>
          <div className="flex gap-2"><TfButton type="button" variant="secondary" size="sm" onClick={() => setConfirmPause(false)}>Keep live</TfButton><TfButton type="button" variant="danger" size="sm" disabled={isPending} onClick={() => updateVisibility(false)}>Pause shop</TfButton></div>
        </div>
      )}
    </section>
  );
}
