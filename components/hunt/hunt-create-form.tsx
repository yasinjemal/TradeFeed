"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import {
  Camera,
  Check,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";

import { createHuntAction } from "@/app/actions/hunts";
import { TfButton } from "@/components/tf/button";
import { TfInput } from "@/components/tf/input";
import {
  HUNT_MAX_IMAGE_BYTES,
  HUNT_PILOT_CITY,
} from "@/lib/validation/hunt";

const CLIENT_IMAGE_TARGET_BYTES = 800_000;
const MAX_IMAGE_EDGE = 1_600;

type ActionError = {
  error: string;
  fieldErrors?: Record<string, string[]>;
};

async function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image could not be read"));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Image could not be processed")),
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Re-encoding strips EXIF metadata and keeps the Server Action below Next's
 * 1 MB request limit, including multipart overhead.
 */
async function prepareHuntImage(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image");
  }

  const image = await loadBrowserImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, MAX_IMAGE_EDGE / longestEdge);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  let quality = 0.84;
  let blob = await canvasBlob(canvas, quality);
  while (blob.size > CLIENT_IMAGE_TARGET_BYTES && quality > 0.5) {
    quality -= 0.08;
    blob = await canvasBlob(canvas, quality);
  }

  if (
    blob.size > CLIENT_IMAGE_TARGET_BYTES ||
    blob.size > HUNT_MAX_IMAGE_BYTES
  ) {
    throw new Error("This image is still too large. Try a tighter crop");
  }

  return new File([blob], "hunt-reference.jpg", {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const message = errors?.[name]?.[0];
  if (!message) return null;
  return (
    <p id={`${name}-error`} className="mt-1.5 text-xs text-tf-error">
      {message}
    </p>
  );
}

export function HuntCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequest = (searchParams.get("request") ?? "")
    .trim()
    .slice(0, 500);
  const galleryInput = React.useRef<HTMLInputElement>(null);
  const cameraInput = React.useRef<HTMLInputElement>(null);
  const [preparedImage, setPreparedImage] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [preparingImage, setPreparingImage] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [actionError, setActionError] = React.useState<ActionError | null>(
    null,
  );
  const [status, setStatus] = React.useState("");

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const chooseImage = async (file: File | undefined) => {
    if (!file) return;
    setPreparingImage(true);
    setActionError(null);
    setStatus("Preparing a privacy-safe copy…");
    try {
      const nextImage = await prepareHuntImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreparedImage(nextImage);
      setPreviewUrl(URL.createObjectURL(nextImage));
      setStatus("Image ready");
    } catch (error) {
      setPreparedImage(null);
      setStatus("");
      setActionError({
        error:
          error instanceof Error
            ? error.message
            : "The image could not be prepared",
        fieldErrors: {
          referenceImage: ["Choose a clear JPG, PNG, or WebP image"],
        },
      });
    } finally {
      setPreparingImage(false);
      if (galleryInput.current) galleryInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  };

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreparedImage(null);
    setPreviewUrl(null);
    setStatus("");
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!preparedImage) {
      setActionError({
        error: "Choose one product screenshot or photo first.",
        fieldErrors: { referenceImage: ["A product image is required"] },
      });
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setStatus("Checking privacy and reading the product…");

    const formData = new FormData(event.currentTarget);
    formData.set("referenceImage", preparedImage);

    try {
      const result = await createHuntAction(formData);
      if (!result.success) {
        setActionError(result);
        setStatus("");
        return;
      }
      setStatus("Hunt created. Opening the live room…");
      router.push(`/hunt/${result.slug}?started=1`);
    } catch {
      setActionError({
        error: "The Hunt could not be created. Please try again.",
      });
      setStatus("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[1.5rem] border border-white/10 bg-tf-raised p-5 text-tf-ink shadow-2xl shadow-black/25 sm:p-7"
      noValidate
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-tf-primary">
            Johannesburg pilot
          </p>
          <h2 className="mt-1 font-tf-display text-xl font-semibold sm:text-2xl">
            What should we find?
          </h2>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold">
          1. Show the product
        </span>
        <input
          ref={galleryInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Choose a product screenshot"
          onChange={(event) => void chooseImage(event.target.files?.[0])}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          aria-label="Take a product photo"
          onChange={(event) => void chooseImage(event.target.files?.[0])}
        />

        {previewUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-tf-stone-200 bg-tf-stone-100">
            <div className="relative aspect-[4/3]">
              <Image
                src={previewUrl}
                alt="Your product reference preview"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-tf-stone-200 bg-tf-raised px-3 py-2">
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-medium text-tf-primary hover:underline"
                onClick={() => galleryInput.current?.click()}
              >
                Replace
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-tf-stone-600 hover:text-tf-error"
                onClick={removeImage}
              >
                <X className="size-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl border border-dashed border-tf-stone-300 bg-tf-stone-50 p-5 text-center"
            aria-describedby="referenceImage-help referenceImage-error"
          >
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary">
              {preparingImage ? (
                <LoaderCircle
                  className="size-6 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ImagePlus className="size-6" aria-hidden="true" />
              )}
            </span>
            <p className="mt-3 text-sm font-semibold">Drop in the screenshot</p>
            <p
              id="referenceImage-help"
              className="mt-1 text-xs leading-relaxed text-tf-stone-500"
            >
              Crop out faces, usernames and messages. JPG, PNG or WebP.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <TfButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => galleryInput.current?.click()}
                disabled={preparingImage}
              >
                <ImagePlus aria-hidden="true" />
                Choose screenshot
              </TfButton>
              <TfButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => cameraInput.current?.click()}
                disabled={preparingImage}
              >
                <Camera aria-hidden="true" />
                Take a photo
              </TfButton>
            </div>
          </div>
        )}
        <FieldError
          errors={actionError?.fieldErrors}
          name="referenceImage"
        />
      </div>

      <div className="mt-5 space-y-4 border-t border-tf-stone-200 pt-5">
        <div>
          <label
            htmlFor="hunt-request"
            className="mb-1.5 block text-sm font-semibold"
          >
            2. Tell us what must match
          </label>
          <textarea
            id="hunt-request"
            name="requestText"
            defaultValue={initialRequest}
            required
            maxLength={500}
            rows={3}
            placeholder="e.g. These retro runners in size 6, black or brown"
            aria-invalid={Boolean(actionError?.fieldErrors?.requestText)}
            aria-describedby={
              actionError?.fieldErrors?.requestText
                ? "requestText-error"
                : undefined
            }
            className="w-full resize-none rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 py-3 text-[15px] text-tf-ink outline-none transition-colors placeholder:text-tf-stone-400 focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25"
          />
          <FieldError
            errors={actionError?.fieldErrors}
            name="requestText"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="hunt-variant"
              className="mb-1.5 block text-sm font-semibold"
            >
              Size or variant
            </label>
            <TfInput
              id="hunt-variant"
              name="desiredVariant"
              maxLength={80}
              placeholder="Size 6, Medium, 128 GB"
              aria-invalid={Boolean(
                actionError?.fieldErrors?.desiredVariant,
              )}
            />
            <FieldError
              errors={actionError?.fieldErrors}
              name="desiredVariant"
            />
          </div>
          <div>
            <label
              htmlFor="hunt-budget"
              className="mb-1.5 block text-sm font-semibold"
            >
              Maximum budget
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-tf-stone-500">
                R
              </span>
              <TfInput
                id="hunt-budget"
                name="maxBudgetRands"
                type="number"
                inputMode="decimal"
                min="1"
                max="999999"
                step="1"
                required
                placeholder="800"
                className="pl-8"
                aria-invalid={Boolean(
                  actionError?.fieldErrors?.maxBudgetCents,
                )}
                aria-describedby={
                  actionError?.fieldErrors?.maxBudgetCents
                    ? "maxBudgetCents-error"
                    : undefined
                }
              />
            </div>
            <FieldError
              errors={actionError?.fieldErrors}
              name="maxBudgetCents"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="hunt-city"
            className="mb-1.5 block text-sm font-semibold"
          >
            Live matching area
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-tf-primary"
              aria-hidden="true"
            />
            <TfInput
              id="hunt-city"
              name="city"
              value={HUNT_PILOT_CITY}
              readOnly
              className="pl-10"
            />
          </div>
          <p className="mt-1.5 text-xs text-tf-stone-500">
            We are proving seller response speed in one dense city first.
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            What can sellers offer?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-tf-stone-300 px-3 py-2 text-sm has-[:checked]:border-tf-primary has-[:checked]:bg-tf-verified-soft">
              <input
                type="radio"
                name="matchPreference"
                value="EXACT_ONLY"
                className="accent-emerald-700"
              />
              Exact product only
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-tf-stone-300 px-3 py-2 text-sm has-[:checked]:border-tf-primary has-[:checked]:bg-tf-verified-soft">
              <input
                type="radio"
                name="matchPreference"
                value="SIMILAR_OK"
                defaultChecked
                className="accent-emerald-700"
              />
              Similar is okay
            </label>
          </div>
        </fieldset>
      </div>

      <div className="mt-5 space-y-4 border-t border-tf-stone-200 pt-5">
        <div>
          <label
            htmlFor="hunt-phone"
            className="mb-1.5 block text-sm font-semibold"
          >
            3. Get offer alerts on WhatsApp
          </label>
          <TfInput
            id="hunt-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="082 123 4567"
            aria-invalid={Boolean(actionError?.fieldErrors?.phone)}
            aria-describedby={
              actionError?.fieldErrors?.phone ? "phone-error" : "phone-help"
            }
          />
          <p
            id="phone-help"
            className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-tf-stone-500"
          >
            <LockKeyhole
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            Your number is never shown on the public Hunt page.
          </p>
          <FieldError errors={actionError?.fieldErrors} name="phone" />
        </div>

        <div>
          <label
            htmlFor="hunt-name"
            className="mb-1.5 block text-sm font-semibold"
          >
            First name <span className="font-normal text-tf-stone-500">(optional)</span>
          </label>
          <TfInput
            id="hunt-name"
            name="buyerName"
            autoComplete="given-name"
            maxLength={80}
            placeholder="How the TradeFeed team should address you"
          />
        </div>

        <div className="space-y-3 rounded-xl bg-tf-stone-50 p-3.5">
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-tf-stone-700">
            <input
              type="checkbox"
              name="publicImageConsent"
              required
              className="mt-0.5 size-4 shrink-0 accent-emerald-700"
            />
            <span>
              I cropped out private information and allow this image to appear
              on the public Hunt page.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-tf-stone-700">
            <input
              type="checkbox"
              name="huntUpdatesConsent"
              required
              className="mt-0.5 size-4 shrink-0 accent-emerald-700"
            />
            <span>
              TradeFeed may WhatsApp me about this Hunt only. This is not
              consent to unrelated marketing.
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-tf-stone-700">
            <input
              type="checkbox"
              name="termsAccepted"
              required
              className="mt-0.5 size-4 shrink-0 accent-emerald-700"
            />
            <span>
              I accept the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-medium text-tf-primary underline"
              >
                TradeFeed terms
              </Link>{" "}
              and understand this pilot does not guarantee an offer.
            </span>
          </label>
        </div>

        {actionError && (
          <div
            role="alert"
            className="rounded-xl border border-tf-error/20 bg-tf-error-soft px-3.5 py-3 text-sm text-tf-error"
          >
            {actionError.error}
          </div>
        )}

        <TfButton
          type="submit"
          size="lg"
          fullWidth
          disabled={submitting || preparingImage}
        >
          {submitting ? (
            <>
              <LoaderCircle
                className="animate-spin"
                aria-hidden="true"
              />
              Creating your Hunt…
            </>
          ) : (
            <>
              <Sparkles aria-hidden="true" />
              Start my Hunt
            </>
          )}
        </TfButton>

        <div className="grid gap-2 text-xs text-tf-stone-500 sm:grid-cols-2">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-tf-primary" aria-hidden="true" />
            Free during the pilot
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-tf-primary" aria-hidden="true" />
            Relevant opted-in sellers only
          </span>
        </div>

        <p
          className="min-h-5 text-center text-xs font-medium text-tf-primary"
          aria-live="polite"
        >
          {status}
        </p>
      </div>
    </form>
  );
}
