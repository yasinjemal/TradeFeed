"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, Camera, Check, FilePenLine, ImageOff, Loader2, PartyPopper, Plus } from "lucide-react";

import { saveProductImagesAction } from "@/app/actions/image";
import { BgRemoveButton } from "@/components/product/bg-remove-button";
import { TfButton } from "@/components/tf/button";
import { TfShareCatalogue } from "@/components/tf/dashboard/tf-share-catalogue";
import { formatZAR } from "@/components/tf/format";
import type { DraftReason, ListingPhoto, ListingStatus, PhotoOutcome } from "@/lib/products/create-listing";

// ============================================================
// TfAddProductResult — what actually happened, in plain words.
// "Live" is only ever shown for a listing buyers can order.
// A draft says it is a draft, why, and what fixes it. The photo
// line reports whether the chosen photo is really attached.
// ============================================================

export interface TfAddProductResultProps {
  shopSlug: string;
  shopName: string;
  catalogUrl: string;
  productId: string;
  name: string;
  /** Raw price field value in rands, as submitted. */
  priceInRands: string;
  status: ListingStatus;
  draftReason?: DraftReason;
  photo: PhotoOutcome;
  /** The uploaded photo, kept so a failed attach can be retried without re-uploading. */
  uploadedPhoto: ListingPhoto | null;
  imageId?: string;
  variantCount: number;
  isFirstProduct: boolean;
  onAddAnother: () => void;
}

const DRAFT_COPY: Record<DraftReason, { body: string; action: string }> = {
  missing_price: {
    body: "It has no price yet, so buyers cannot see it. Add a price and publish it when you are ready.",
    action: "Add a price",
  },
  hidden_by_seller: {
    body: "You chose to keep it off your catalogue, so buyers cannot see it yet. Publish it from the product page when you are ready.",
    action: "Open the draft",
  },
  publish_failed: {
    body: "Something went wrong while publishing, so we kept it hidden instead of showing buyers an unfinished listing. Open it, check the price, then publish.",
    action: "Check and publish",
  },
};

export function TfAddProductResult({
  shopSlug,
  shopName,
  catalogUrl,
  productId,
  name,
  priceInRands,
  status,
  draftReason,
  photo: initialPhoto,
  uploadedPhoto,
  imageId,
  variantCount,
  isFirstProduct,
  onAddAnother,
}: TfAddProductResultProps) {
  const [photo, setPhoto] = React.useState<PhotoOutcome>(initialPhoto);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(uploadedPhoto?.url ?? null);
  const [savedImageId, setSavedImageId] = React.useState<string | undefined>(imageId);
  const [retryError, setRetryError] = React.useState<string | null>(null);
  const [isRetrying, startRetry] = React.useTransition();

  const live = status === "live";
  const title = name.trim() || "Your product";
  const editHref = `/dashboard/${shopSlug}/products/${productId}`;
  const price = Number.parseFloat(priceInRands.replace(",", "."));
  const draft = DRAFT_COPY[draftReason ?? "missing_price"];

  const facts = [
    Number.isFinite(price) && price > 0 && variantCount > 0 ? formatZAR(price) : null,
    variantCount > 1 ? `${variantCount} options` : null,
  ].filter(Boolean);

  const retryPhoto = () => {
    if (!uploadedPhoto) return;
    setRetryError(null);
    startRetry(async () => {
      const result = await saveProductImagesAction(shopSlug, productId, [uploadedPhoto]);
      if (result.success) {
        setPhoto("attached");
        setPhotoUrl(result.images?.[0]?.url ?? uploadedPhoto.url);
        setSavedImageId(result.images?.[0]?.id);
      } else {
        setRetryError(result.error ?? "The photo still could not be attached.");
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 py-2 text-tf-ink">
      {/* ── What happened ─────────────────────────────── */}
      <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-5 text-center shadow-tf-sm">
        <span
          aria-hidden="true"
          className={
            live
              ? "tf-pop mx-auto flex size-14 items-center justify-center rounded-full bg-(--tf-cta) text-(--tf-cta-text)"
              : "mx-auto flex size-14 items-center justify-center rounded-full bg-tf-stone-100 text-tf-stone-600"
          }
        >
          {live ? <Check className="size-7" strokeWidth={3} /> : <FilePenLine className="size-6" />}
        </span>

        <h2 className="mt-4 font-tf-display text-2xl font-semibold tracking-tight">
          {live ? `${title} is live` : `${title} is saved as a draft`}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-tf-stone-600">
          {live ? "Buyers can see it on your catalogue now." : draft.body}
        </p>
        {live && facts.length > 0 && (
          <p className="mt-2 text-sm font-medium tabular-nums text-tf-ink">{facts.join(" · ")}</p>
        )}

        {!live && (
          <div className="mt-5">
            <TfButton asChild size="lg" fullWidth>
              <Link href={editHref}>{draft.action}</Link>
            </TfButton>
          </div>
        )}
      </div>

      {/* ── The photo: attached, missing, or failed ───── */}
      <div className="rounded-2xl border border-tf-stone-200 bg-tf-raised p-4 shadow-tf-sm">
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-tf-stone-100">
            {photo === "attached" && photoUrl ? (
              <Image src={photoUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-tf-stone-400">
                <ImageOff aria-hidden="true" className="size-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {photo === "attached" && (
              <>
                <p className="flex items-center gap-1.5 text-sm font-medium text-tf-ink">
                  <Check aria-hidden="true" className="size-4 text-tf-primary" />
                  Your photo is attached
                </p>
                <p className="mt-0.5 text-sm text-tf-stone-600">
                  A listing can have up to 8 photos.{" "}
                  <Link
                    href={editHref}
                    className="font-medium text-tf-primary underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
                  >
                    Add more photos
                  </Link>
                </p>
              </>
            )}
            {photo === "none" && (
              <>
                <p className="text-sm font-medium text-tf-ink">No photo on this listing</p>
                <p className="mt-0.5 text-sm text-tf-stone-600">
                  It will not appear on the marketplace until it has one.
                </p>
              </>
            )}
            {photo === "failed" && (
              <>
                <p className="flex items-center gap-1.5 text-sm font-medium text-tf-ink">
                  <AlertTriangle aria-hidden="true" className="size-4 text-tf-warning" />
                  Your photo was not attached
                </p>
                <p className="mt-0.5 text-sm text-tf-stone-600">
                  The listing was saved without it. Your photo is still uploaded, so this takes one tap.
                </p>
              </>
            )}
          </div>
        </div>

        {photo === "none" && (
          <TfButton asChild variant="secondary" fullWidth className="mt-3">
            <Link href={editHref}>
              <Camera aria-hidden="true" />
              Add a photo
            </Link>
          </TfButton>
        )}
        {photo === "failed" && (
          <>
            <TfButton
              type="button"
              variant="secondary"
              fullWidth
              className="mt-3"
              onClick={retryPhoto}
              disabled={isRetrying || !uploadedPhoto}
            >
              {isRetrying ? <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Camera aria-hidden="true" />}
              {isRetrying ? "Attaching your photo…" : "Attach my photo"}
            </TfButton>
            {retryError && (
              <p role="alert" className="mt-2 text-sm text-tf-error">
                {retryError}{" "}
                <Link href={editHref} className="font-medium underline underline-offset-2">
                  Add it from the product page
                </Link>
              </p>
            )}
          </>
        )}
        {photo === "attached" && savedImageId && (
          <div className="mt-3 empty:hidden">
            <BgRemoveButton shopSlug={shopSlug} imageId={savedImageId} onDone={setPhotoUrl} />
          </div>
        )}
      </div>

      {/* ── Share — only a live listing is worth sharing ── */}
      {live && (
        <div className="space-y-2">
          {isFirstProduct && (
            <p className="flex items-center gap-2 px-1 text-sm font-medium text-tf-ink">
              <PartyPopper aria-hidden="true" className="size-4 text-tf-accent-ink" />
              That was your first product. Now send your link to your customers.
            </p>
          )}
          <TfShareCatalogue catalogUrl={catalogUrl} shopName={shopName} shopSlug={shopSlug} />
        </div>
      )}

      {/* ── Next ──────────────────────────────────────── */}
      <div className="grid gap-2 sm:grid-cols-2">
        <TfButton type="button" size="lg" variant={live ? "primary" : "secondary"} onClick={onAddAnother}>
          <Plus aria-hidden="true" />
          Add another product
        </TfButton>
        {live && (
          <TfButton asChild size="lg" variant="secondary">
            <Link href={editHref}>Edit details</Link>
          </TfButton>
        )}
      </div>
    </div>
  );
}
