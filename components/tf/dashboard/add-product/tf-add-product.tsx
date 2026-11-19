// ============================================================
// TfAddProduct — the one "Add product" screen
// ============================================================
// One photo, one price, one screen:
//
//   1. Pick a photo. It uploads straight away (compressed on the
//      phone) and the AI listing starts by itself, the same way
//      onboarding does it.
//   2. Check the name, type a price. Publish stays off until
//      there is a price.
//   3. Sizes are optional chips with their own stock. Everything
//      else sits under "More options".
//
// The photo is sent with the form and attached by
// createProductAction in the same request, whichever way the
// listing was written. The result screen shows what the action
// reports: live, or a draft with the reason.
//
// Field ids (#name, #priceInRands, #stock, #isActive), the
// "Publish <name>" button and the "<name> is live" heading are
// used by the production monitor in monitoring/checkly.
// ============================================================

"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  AlertTriangle,
  Camera,
  ChevronDown,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

import { createProductAction } from "@/app/actions/product";
import { PriceSuggestionHint } from "@/components/product/price-suggestion-hint";
import { TfButton } from "@/components/tf/button";
import { formatZAR } from "@/components/tf/format";
import { TfSkeleton } from "@/components/tf/skeleton";
import { cn } from "@/lib/utils";
import { suggestGlobalCategory } from "@/lib/config/category-suggest";
import { getVariantPreset } from "@/lib/config/category-variants";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";
import { compressImage } from "@/lib/images/compress-image";
import {
  randsToCents,
  resolveSale,
  wasPriceProblem,
  WAS_PRICE_FORMAT_MESSAGE,
} from "@/lib/products/compare-at";
import { MIN_LISTING_DESCRIPTION_LENGTH } from "@/lib/marketplace/listing-readiness";
import {
  MAX_CREATE_SIZES,
  draftListingReadiness,
  type ListingPhoto,
  type ReadinessKey,
} from "@/lib/products/create-listing";
import { useUploadThing } from "@/lib/uploadthing";

import { TfAddProductResult } from "./tf-add-product-result";
import { TfBuyersSee } from "./tf-buyers-see";
import { TfReadiness } from "./tf-readiness";
import { TfSizeChips, type SizeEntry } from "./tf-size-chips";

export interface TfAddProductProps {
  shopSlug: string;
  shopName: string;
  catalogUrl: string;
  categories: { id: string; name: string }[];
  globalCategories: GlobalCategoryOption[];
  /** AI listing allowance, read on the server so the counter is right from the start. */
  ai: { unlimited: boolean; creditsRemaining: number };
  /** The shop passes the shop-level part of the marketplace gate. */
  shopMarketplaceReady: boolean;
}

// ── Shared field styles (TF tokens only) ────────────────────

const FIELD =
  "w-full min-h-12 rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 text-base text-tf-ink placeholder:text-tf-stone-400 outline-none transition-colors motion-reduce:transition-none focus-visible:border-tf-primary focus-visible:ring-2 focus-visible:ring-tf-primary/25 aria-invalid:border-tf-error disabled:cursor-not-allowed disabled:opacity-50";
const LABEL = "block text-sm font-medium text-tf-ink";
const HINT = "text-sm text-tf-stone-600";
const CARD = "rounded-2xl border border-tf-stone-200 bg-tf-raised p-4 shadow-tf-sm";
const STEPPER =
  "flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-tf-stone-300 bg-tf-raised text-tf-ink outline-none hover:border-tf-stone-400 hover:bg-tf-stone-50 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:cursor-not-allowed disabled:opacity-40";

type PhotoState =
  | { phase: "empty" }
  | { phase: "uploading"; previewUrl: string; progress: number }
  | { phase: "ready"; previewUrl: string; uploaded: ListingPhoto }
  | { phase: "error"; previewUrl: string; message: string };

type AiState =
  | { phase: "idle" }
  | { phase: "writing" }
  | { phase: "done" }
  | { phase: "credits" }
  | { phase: "error"; message: string };

interface CategoryChoice {
  id: string;
  /** How it got chosen — shown to the seller so nothing is picked silently. */
  source: "seller" | "photo" | "name";
}

interface ListingText {
  name: string;
  nameByAi: boolean;
  description: string;
  descriptionByAi: boolean;
}

interface SavedDraft {
  name?: string;
  description?: string;
  price?: string;
  wasPrice?: string;
  stock?: string;
  sizes?: SizeEntry[];
  category?: CategoryChoice | null;
  photo?: ListingPhoto | null;
  aiGenerated?: boolean;
}

/** Where each server-validated field lives, in the order the seller meets them. */
const ERROR_FIELDS: { name: string; id: string; insideMore: boolean }[] = [
  { name: "photo", id: "add-product-photo", insideMore: false },
  { name: "name", id: "name", insideMore: false },
  { name: "priceInRands", id: "priceInRands", insideMore: false },
  { name: "compareAtPriceInRands", id: "compareAtPriceInRands", insideMore: false },
  { name: "stock", id: "stock", insideMore: false },
  { name: "sizes", id: "add-product-sizes", insideMore: false },
  { name: "description", id: "description", insideMore: true },
  { name: "globalCategoryId", id: "globalCategoryId", insideMore: true },
  { name: "categoryId", id: "categoryId", insideMore: true },
  { name: "option1Label", id: "option1Label", insideMore: true },
  { name: "option2Label", id: "option2Label", insideMore: true },
  { name: "minWholesaleQty", id: "minWholesaleQty", insideMore: true },
];

function fieldErrorFor(
  state: { fieldErrors?: Record<string, string[]> } | null,
  field: string,
): string | null {
  return state?.fieldErrors?.[field]?.[0] ?? null;
}

function cleanPrice(value: string): string {
  let cleaned = value.replace(/[^\d.,]/g, "");
  const separator = cleaned.search(/[.,]/);
  if (separator !== -1) {
    cleaned =
      cleaned.slice(0, separator + 1) +
      cleaned.slice(separator + 1).replace(/[.,]/g, "").slice(0, 2);
  }
  return cleaned.slice(0, 9);
}

function Toggle({
  id,
  name,
  checked,
  defaultChecked,
  onChange,
  disabled,
  title,
  hint,
}: {
  id: string;
  name: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  title: string;
  hint: string;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
      <span className="text-sm text-tf-ink">
        {title}
        <span className="block text-sm text-tf-stone-600">{hint}</span>
      </span>
      <span className="relative shrink-0">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
          disabled={disabled}
          className="peer sr-only"
        />
        <span className="block h-7 w-12 rounded-full bg-tf-stone-400 transition-colors motion-reduce:transition-none peer-checked:bg-tf-primary peer-focus-visible:ring-2 peer-focus-visible:ring-tf-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-tf-raised" />
        <span className="absolute left-0.5 top-0.5 size-6 rounded-full bg-tf-raised shadow-tf-sm transition-transform motion-reduce:transition-none peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// ── Remount wrapper: "Add another product" starts clean ─────

export function TfAddProduct(props: TfAddProductProps) {
  const router = useRouter();
  const [formKey, setFormKey] = React.useState(0);

  return (
    <AddProductForm
      key={formKey}
      {...props}
      onAddAnother={() => {
        // Re-read the product limit and AI allowance, then start a fresh form.
        router.refresh();
        setFormKey((key) => key + 1);
      }}
    />
  );
}

function AddProductForm({
  shopSlug,
  shopName,
  catalogUrl,
  categories,
  globalCategories,
  ai: aiAllowance,
  shopMarketplaceReady,
  onAddAnother,
}: TfAddProductProps & { onAddAnother: () => void }) {
  const boundAction = createProductAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  // ── Listing fields ──────────────────────────────────────
  const [text, setText] = React.useState<ListingText>({
    name: "",
    nameByAi: false,
    description: "",
    descriptionByAi: false,
  });
  const [price, setPrice] = React.useState("");
  const [wasPrice, setWasPrice] = React.useState("");
  const [submittedWasPrice, setSubmittedWasPrice] = React.useState<string | null>(null);
  const [stock, setStock] = React.useState("1");
  const [sizes, setSizes] = React.useState<SizeEntry[]>([]);
  const [category, setCategory] = React.useState<CategoryChoice | null>(null);
  const [labels, setLabels] = React.useState({ option1: "Size", option2: "Color", edited: false });
  const [isActive, setIsActive] = React.useState(true);
  // Controlled on purpose: React resets uncontrolled fields after a form
  // action, which would silently wipe these when the server returns an error.
  const [shopCategoryId, setShopCategoryId] = React.useState("");
  const [minWholesaleQty, setMinWholesaleQty] = React.useState("1");
  const [wholesaleOnly, setWholesaleOnly] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [pendingFocus, setPendingFocus] = React.useState<string | null>(null);

  // ── Photo + AI ──────────────────────────────────────────
  const [photo, setPhoto] = React.useState<PhotoState>({ phase: "empty" });
  const [photoNotice, setPhotoNotice] = React.useState<string | null>(null);
  const [ai, setAi] = React.useState<AiState>({ phase: "idle" });
  const [aiGenerated, setAiGenerated] = React.useState(false);
  const [credits, setCredits] = React.useState(aiAllowance.creditsRemaining);
  const aiAvailable = aiAllowance.unlimited || credits > 0;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const lastFileRef = React.useRef<File | null>(null);
  const photoTokenRef = React.useRef(0);
  const blobUrlRef = React.useRef<string | null>(null);
  const aiAbortRef = React.useRef<AbortController | null>(null);
  const aiRequestRef = React.useRef<{ dropped: boolean } | null>(null);
  const latestRef = React.useRef({ text, aiAvailable });
  React.useEffect(() => {
    latestRef.current = { text, aiAvailable };
  });
  // The allowance is re-read from the server after each product.
  React.useEffect(() => {
    setCredits(aiAllowance.creditsRemaining);
  }, [aiAllowance.creditsRemaining]);

  const { startUpload } = useUploadThing("productImageUploader", {
    onUploadProgress: (progress) => {
      setPhoto((current) => (current.phase === "uploading" ? { ...current, progress } : current));
    },
  });

  // ── Category lookups ────────────────────────────────────
  const flatCategories = React.useMemo(
    () =>
      globalCategories.flatMap((parent) => [
        { id: parent.id, slug: parent.slug, label: parent.name },
        ...parent.children.map((child) => ({
          id: child.id,
          slug: child.slug,
          label: `${parent.name} › ${child.name}`,
        })),
      ]),
    [globalCategories],
  );
  const chosenCategory = category ? flatCategories.find((item) => item.id === category.id) : undefined;
  const nameSuggestion = React.useMemo(() => {
    if (category) return undefined;
    const slug = suggestGlobalCategory(text.name);
    return slug ? flatCategories.find((item) => item.slug === slug) : undefined;
  }, [category, text.name, flatCategories]);

  const preset = getVariantPreset(chosenCategory?.slug);
  const option1Label = labels.edited ? labels.option1 : preset.option1Label;
  const option2Label = labels.edited ? labels.option2 : preset.option2Label;

  // ── Derived ─────────────────────────────────────────────
  const priceValue = Number.parseFloat(price.replace(",", "."));
  const hasPrice = Number.isFinite(priceValue) && priceValue > 0;

  // The optional was-price. The same check the server and the catalogue use
  // decides whether buyers would see it; anything that would not show is an
  // error to fix here, never something saved and quietly ignored.
  const hasWasPrice = wasPrice.trim() !== "";
  const priceCents = randsToCents(price);
  const wasCents = hasWasPrice ? randsToCents(wasPrice) : null;
  const wasProblem = !hasWasPrice
    ? null
    : wasCents === null
      ? WAS_PRICE_FORMAT_MESSAGE
      : priceCents === null
        ? null
        : wasPriceProblem(priceCents, wasCents);
  const sale =
    priceCents !== null && wasCents !== null && !wasProblem
      ? resolveSale(priceCents / 100, wasCents / 100)
      : null;
  // A server message describes what was submitted, so it goes once that changes.
  const wasPriceError =
    wasProblem ??
    (hasWasPrice && wasPrice === submittedWasPrice
      ? fieldErrorFor(state, "compareAtPriceInRands")
      : null);
  const realSizes = sizes.map((entry) => ({
    size: entry.size,
    stock: entry.stock.trim() === "" ? 1 : Number.parseInt(entry.stock, 10) || 0,
  }));
  const totalStock =
    realSizes.length > 0
      ? realSizes.reduce((sum, entry) => sum + entry.stock, 0)
      : stock.trim() === ""
        ? 1
        : Number.parseInt(stock, 10) || 0;
  const previewUrl = photo.phase === "empty" ? null : photo.previewUrl;
  const uploadedPhoto = photo.phase === "ready" ? photo.uploaded : null;

  const readiness = draftListingReadiness({
    hasPhoto: photo.phase === "ready",
    priceInRands: price.replace(",", "."),
    totalStock,
    description: text.description,
    hasMarketplaceCategory: Boolean(chosenCategory),
  });

  const nameOk = text.name.trim().length >= 2;
  const blocker = isPending
    ? null
    : photo.phase === "uploading"
      ? "Uploading your photo…"
      : !nameOk
        ? ai.phase === "writing"
          ? "Reading your photo…"
          : "Add a name to publish"
        : isActive && !hasPrice
          ? "Add a price to publish"
          : wasProblem
            ? "Fix the was-price to publish"
            : null;
  const canSubmit = !isPending && blocker === null;
  const submitLabel = isActive
    ? nameOk
      ? `Publish ${text.name.trim()}`
      : "Publish product"
    : nameOk
      ? `Save ${text.name.trim()} as a draft`
      : "Save as a draft";

  // ── Draft recovery (this tab only) ──────────────────────
  // A flaky connection or an accidental reload should not cost the
  // seller their typing or their uploaded photo.
  const storageKey = `tf_add_product_${shopSlug}`;
  const [restored, setRestored] = React.useState(false);
  React.useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "null") as SavedDraft | null;
      if (saved && typeof saved === "object") {
        if (typeof saved.name === "string" || typeof saved.description === "string") {
          setText({
            name: saved.name ?? "",
            nameByAi: false,
            description: saved.description ?? "",
            descriptionByAi: false,
          });
        }
        if (typeof saved.price === "string") setPrice(cleanPrice(saved.price));
        if (typeof saved.wasPrice === "string") setWasPrice(cleanPrice(saved.wasPrice));
        if (typeof saved.stock === "string") setStock(saved.stock.replace(/\D/g, "").slice(0, 6));
        if (Array.isArray(saved.sizes)) {
          setSizes(
            saved.sizes
              .filter((entry) => typeof entry?.size === "string" && typeof entry?.stock === "string")
              .slice(0, MAX_CREATE_SIZES),
          );
        }
        if (saved.category?.id) setCategory({ id: saved.category.id, source: saved.category.source ?? "seller" });
        if (saved.photo?.url && saved.photo.key) {
          setPhoto({ phase: "ready", previewUrl: saved.photo.url, uploaded: saved.photo });
        }
        if (saved.aiGenerated) setAiGenerated(true);
      }
    } catch {
      // Storage may be blocked. The form still works.
    }
    setRestored(true);
  }, [storageKey]);

  const succeeded = Boolean(state?.success && state.productId);
  React.useEffect(() => {
    if (!restored) return;
    try {
      if (succeeded) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      const draft: SavedDraft = {
        name: text.name,
        description: text.description,
        price,
        wasPrice,
        stock,
        sizes,
        category,
        photo: uploadedPhoto,
        aiGenerated,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      // A failed autosave must not interrupt the seller.
    }
  }, [restored, succeeded, storageKey, text.name, text.description, price, wasPrice, stock, sizes, category, uploadedPhoto, aiGenerated]);

  // Release the local preview when the form goes away.
  React.useEffect(
    () => () => {
      aiAbortRef.current?.abort();
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    [],
  );

  // A server error takes the seller to the first field that needs fixing,
  // opening "More options" when the field lives in there.
  React.useEffect(() => {
    const errors = state?.fieldErrors;
    if (!errors) return;
    const target = ERROR_FIELDS.find((field) => errors[field.name]);
    if (!target) return;
    if (target.insideMore) setMoreOpen(true);
    setPendingFocus(target.id);
  }, [state]);

  // Focus a field after the fold it lives in has opened.
  React.useEffect(() => {
    if (!pendingFocus) return;
    const element = document.getElementById(pendingFocus);
    element?.scrollIntoView({ block: "center", behavior: "auto" });
    element?.focus({ preventScroll: true });
    setPendingFocus(null);
  }, [pendingFocus, moreOpen]);

  // ── AI listing ──────────────────────────────────────────
  // A request the seller no longer wants (they chose to type, or
  // changed the photo) is left to finish and its text is dropped:
  // the server spends the credit either way, so the counter should
  // still be updated from the real response.
  const dropListingRequest = () => {
    if (aiRequestRef.current) aiRequestRef.current.dropped = true;
  };

  const writeListing = async (imageUrl: string) => {
    dropListingRequest();
    const controller = new AbortController();
    const request = { dropped: false };
    // What the fields held when the seller (or the photo) asked for a listing.
    const before = latestRef.current.text;
    aiAbortRef.current = controller;
    aiRequestRef.current = request;
    setAi({ phase: "writing" });

    try {
      const response = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, shopSlug }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (controller.signal.aborted) return;

      if (data?.credits && !data.credits.unlimited && typeof data.credits.remaining === "number") {
        setCredits(data.credits.remaining);
      }
      if (!response.ok && (data?.error === "CREDITS_EXHAUSTED" || data?.error === "PLAN_REQUIRED")) {
        setCredits(0);
      }
      if (request.dropped) return;

      if (!response.ok) {
        if (data?.error === "CREDITS_EXHAUSTED" || data?.error === "PLAN_REQUIRED") {
          setAi({ phase: "credits" });
          return;
        }
        setAi({
          phase: "error",
          message:
            data?.error === "DAILY_LIMIT_REACHED" && typeof data.message === "string"
              ? data.message
              : "We could not read this photo.",
        });
        return;
      }

      const listing = data?.data as { name?: string; description?: string; category?: string } | undefined;
      if (!listing?.name) {
        setAi({ phase: "error", message: "We could not read this photo." });
        return;
      }

      // Fill each field unless the seller typed in it while we were reading the photo.
      setText((current) => {
        const next = { ...current };
        if (current.name === before.name || current.name.trim() === "") {
          next.name = listing.name ?? "";
          next.nameByAi = true;
        }
        if (listing.description && (current.description === before.description || current.description.trim() === "")) {
          next.description = listing.description;
          next.descriptionByAi = true;
        }
        return next;
      });

      // The name is the more specific signal; the AI's own category is the fallback.
      // Only a category that exists in the marketplace tree can be chosen.
      const match = [listing.name, listing.category ?? ""]
        .map((source) => suggestGlobalCategory(source))
        .map((slug) => (slug ? flatCategories.find((item) => item.slug === slug) : undefined))
        .find(Boolean);
      if (match) {
        setCategory((current) => (current?.source === "seller" ? current : { id: match.id, source: "photo" }));
      }

      setAiGenerated(true);
      setAi({ phase: "done" });
    } catch (error) {
      if (controller.signal.aborted || request.dropped) return;
      console.error("[add-product] AI listing failed:", error);
      setAi({ phase: "error", message: "We could not read this photo." });
    }
  };

  const stopWriting = () => {
    dropListingRequest();
    setAi({ phase: "idle" });
    setPendingFocus("name");
  };

  // ── Photo: preview → compress → upload → AI ─────────────
  const uploadPhoto = async (file: File) => {
    const token = ++photoTokenRef.current;
    dropListingRequest();
    setAi({ phase: "idle" });

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const localUrl = URL.createObjectURL(file);
    blobUrlRef.current = localUrl;
    lastFileRef.current = file;
    setPhoto({ phase: "uploading", previewUrl: localUrl, progress: 0 });

    const fail = (message: string) => {
      if (token !== photoTokenRef.current) return;
      setPhoto({ phase: "error", previewUrl: localUrl, message });
    };

    try {
      const compressed = await compressImage(file);
      const result = await startUpload([compressed]);
      if (token !== photoTokenRef.current) return; // replaced or removed meanwhile

      const uploaded = result?.[0]?.serverData;
      if (!uploaded?.url || !uploaded.key) {
        fail("The photo did not upload. Check your connection and try again.");
        return;
      }
      const saved: ListingPhoto = { url: uploaded.url, key: uploaded.key, name: uploaded.name ?? compressed.name };
      setPhoto({ phase: "ready", previewUrl: localUrl, uploaded: saved });

      // Start the listing automatically — unless the seller already wrote their own name.
      const { text: latestText, aiAvailable: canWrite } = latestRef.current;
      if (!canWrite) {
        setAi({ phase: "credits" });
      } else if (latestText.name.trim() === "" || latestText.nameByAi) {
        void writeListing(saved.url);
      }
    } catch (error) {
      console.error("[add-product] Photo upload failed:", error);
      fail("The photo did not upload. Check your connection and try again.");
    }
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      // Keep whatever photo is already there; just say why nothing changed.
      setPhotoNotice("That file is not a photo. Choose a JPG or PNG image.");
      return;
    }
    setPhotoNotice(null);
    void uploadPhoto(file);
  };

  const removePhoto = () => {
    photoTokenRef.current += 1;
    dropListingRequest();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
    lastFileRef.current = null;
    setPhoto({ phase: "empty" });
    setAi({ phase: "idle" });
  };

  const openField = (id: string, insideMore: boolean) => {
    if (insideMore) setMoreOpen(true);
    setPendingFocus(id);
  };

  const fix = (key: ReadinessKey) => {
    if (key === "photo") {
      if (photo.phase === "error" && lastFileRef.current) void uploadPhoto(lastFileRef.current);
      else fileInputRef.current?.click();
    } else if (key === "price") openField("priceInRands", false);
    else if (key === "stock") openField(sizes.length > 0 ? "add-product-sizes" : "stock", false);
    else if (key === "category") openField("globalCategoryId", true);
    else openField("description", true);
  };

  // ════════════════════════════════════════════════════════
  // RESULT — what the server says happened
  // ════════════════════════════════════════════════════════
  if (state?.success && state.productId) {
    return (
      <TfAddProductResult
        shopSlug={shopSlug}
        shopName={shopName}
        catalogUrl={catalogUrl}
        productId={state.productId}
        name={text.name}
        priceInRands={price}
        compareAtInRands={wasPrice}
        status={state.status ?? "draft"}
        draftReason={state.draftReason}
        photo={state.photo ?? "none"}
        uploadedPhoto={uploadedPhoto}
        imageId={state.imageId}
        variantCount={state.variantCount ?? 0}
        isFirstProduct={Boolean(state.isFirstProduct)}
        onAddAnother={onAddAnother}
      />
    );
  }

  // ════════════════════════════════════════════════════════
  // FORM
  // ════════════════════════════════════════════════════════
  const fieldError = (field: string) => state?.fieldErrors?.[field]?.[0];
  const writingName = ai.phase === "writing" && text.name === "";
  const creditLabel = aiAllowance.unlimited
    ? "AI listings included"
    : credits > 0
      ? `${credits} AI listing${credits === 1 ? "" : "s"} left`
      : "No AI listings left";

  return (
    <form
      action={formAction}
      onSubmit={() => {
        aiAbortRef.current?.abort();
        setSubmittedWasPrice(wasPrice);
      }}
      className="mx-auto w-full max-w-xl space-y-4 pb-32 text-tf-ink md:pb-0"
      noValidate
    >
      <header>
        <h1 className="font-tf-display text-2xl font-semibold tracking-tight">Add a product</h1>
        <p className={cn(HINT, "mt-1")}>
          {aiAvailable
            ? "Add a photo and we write the listing. You set the price."
            : "Add a photo, name it and set the price."}
        </p>
      </header>

      {/* Everything the server needs that is not a visible field */}
      <input type="hidden" name="imageUrl" value={uploadedPhoto?.url ?? ""} />
      <input type="hidden" name="imageKey" value={uploadedPhoto?.key ?? ""} />
      <input type="hidden" name="imageName" value={uploadedPhoto?.name ?? ""} />
      <input type="hidden" name="sizes" value={sizes.length > 0 ? JSON.stringify(sizes) : ""} />
      {aiGenerated && <input type="hidden" name="aiGenerated" value="on" />}

      {/* ── 1. Photo ─────────────────────────────────────── */}
      <section aria-label="Product photo" className={CARD}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-tf-display text-base font-semibold">Photo</h2>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
              aiAvailable ? "bg-tf-verified-soft text-tf-verified" : "bg-tf-stone-100 text-tf-stone-600",
            )}
          >
            <Sparkles aria-hidden="true" className="size-3.5" />
            {creditLabel}
          </span>
        </div>

        <input
          ref={fileInputRef}
          id="add-product-photo"
          type="file"
          accept="image/*"
          className="peer sr-only"
          disabled={isPending}
          onChange={(event) => {
            pickFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {photo.phase === "empty" ? (
          <label
            htmlFor="add-product-photo"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              pickFile(event.dataTransfer.files?.[0]);
            }}
            className="mt-3 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-tf-stone-300 bg-tf-stone-50 px-4 text-center transition-colors motion-reduce:transition-none hover:border-tf-primary hover:bg-tf-verified-soft peer-focus-visible:border-tf-primary peer-focus-visible:ring-2 peer-focus-visible:ring-tf-primary/25"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-tf-verified-soft text-tf-primary">
              <Camera aria-hidden="true" className="size-6" />
            </span>
            <span className="text-base font-medium text-tf-ink">Add a photo</span>
            <span className={HINT}>Take one now or choose from your gallery</span>
          </label>
        ) : (
          <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl bg-tf-stone-100">
            <Image
              src={photo.previewUrl}
              alt="Your product photo"
              fill
              unoptimized={photo.previewUrl.startsWith("blob:")}
              loading="eager"
              sizes="(max-width: 640px) 100vw, 544px"
              className={cn("object-contain", photo.phase === "uploading" && "opacity-70")}
            />
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
                className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-tf-deepest/75 px-3.5 text-sm font-medium text-white outline-none hover:bg-tf-deepest focus-visible:ring-2 focus-visible:ring-white"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                Change
              </button>
              <button
                type="button"
                onClick={removePhoto}
                disabled={isPending}
                aria-label="Remove photo"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-tf-deepest/75 text-white outline-none hover:bg-tf-deepest focus-visible:ring-2 focus-visible:ring-white"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            {photo.phase === "uploading" && (
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-tf-deepest/30" aria-hidden="true">
                <div
                  className="h-full origin-left bg-tf-primary transition-transform duration-300 motion-reduce:transition-none"
                  style={{ transform: `scaleX(${Math.max(0.04, photo.progress / 100)})` }}
                />
              </div>
            )}
          </div>
        )}

        {/* One honest line about where the photo and the listing are */}
        <div className="mt-3 min-h-6 text-sm" aria-live="polite">
          {photo.phase === "empty" && (
            <p className="text-tf-stone-600">
              {aiAvailable
                ? "We write the name and description from your photo. You can edit both."
                : "Your photo is attached to the listing when you publish."}
            </p>
          )}
          {photo.phase === "uploading" && (
            <p className="flex items-center gap-2 text-tf-stone-600">
              <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
              Uploading your photo… {Math.round(photo.progress)}%
            </p>
          )}
          {photo.phase === "error" && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p role="alert" className="flex items-center gap-2 text-tf-error">
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                {photo.message}
              </p>
              <TfButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (lastFileRef.current) void uploadPhoto(lastFileRef.current);
                  else fileInputRef.current?.click();
                }}
              >
                Try again
              </TfButton>
            </div>
          )}
          {photo.phase === "ready" && ai.phase === "writing" && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-tf-stone-600">
                <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                Reading your photo to write the listing…
              </p>
              <TfButton type="button" variant="ghost" size="sm" onClick={stopWriting}>
                Type it myself
              </TfButton>
            </div>
          )}
          {photo.phase === "ready" && ai.phase === "done" && (
            <p className="flex items-start gap-2 text-tf-verified">
              <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              Listing written from your photo. Check the name, then set your price.
            </p>
          )}
          {photo.phase === "ready" && ai.phase === "error" && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 flex-1 text-tf-stone-600">
                {ai.message} Type the name below. Your photo is uploaded and will be attached.
              </p>
              {aiAvailable && (
                <TfButton type="button" variant="ghost" size="sm" onClick={() => void writeListing(photo.uploaded.url)}>
                  Try again
                </TfButton>
              )}
            </div>
          )}
          {photo.phase === "ready" && ai.phase === "idle" && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-tf-stone-600">Photo uploaded. It will be attached when you publish.</p>
              {aiAvailable && (
                <TfButton type="button" variant="ghost" size="sm" onClick={() => void writeListing(photo.uploaded.url)}>
                  <Sparkles aria-hidden="true" />
                  Write the listing from this photo
                </TfButton>
              )}
            </div>
          )}
          {photo.phase === "ready" && ai.phase === "credits" && (
            <div className="rounded-xl border border-tf-stone-200 bg-tf-stone-50 p-3">
              <p className="font-medium text-tf-ink">You have used all your AI listings</p>
              <p className="mt-0.5 text-tf-stone-600">
                Your photo is uploaded. Type the name below, or upgrade for more AI listings.
              </p>
              <Link
                href={`/dashboard/${shopSlug}/billing`}
                className="mt-2 inline-flex min-h-11 items-center font-medium text-tf-primary underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
              >
                See plans
              </Link>
            </div>
          )}
        </div>
        {(photoNotice ?? fieldError("photo")) && (
          <p role="alert" className="mt-1 text-sm text-tf-error">
            {photoNotice ?? fieldError("photo")}
          </p>
        )}
      </section>

      {/* ── 2. Name + price ──────────────────────────────── */}
      <section aria-label="Name and price" className={cn(CARD, "space-y-4")}>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="name" className={LABEL}>
              Name
            </label>
            {text.nameByAi && (
              <span className="inline-flex items-center gap-1 text-xs text-tf-stone-600">
                <Sparkles aria-hidden="true" className="size-3.5 text-tf-primary" />
                Written by AI. Edit freely.
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="name"
              name="name"
              value={text.name}
              onChange={(event) => setText((current) => ({ ...current, name: event.target.value, nameByAi: false }))}
              placeholder={writingName ? "Reading your photo…" : "e.g. Fleece hoodie, unisex"}
              aria-busy={writingName ? true : undefined}
              maxLength={200}
              disabled={isPending}
              aria-invalid={fieldError("name") ? true : undefined}
              aria-describedby={fieldError("name") ? "name-error" : undefined}
              enterKeyHint="next"
              autoComplete="off"
              className={FIELD}
            />
            {writingName && (
              <TfSkeleton className="pointer-events-none absolute inset-y-4 right-4 w-20" />
            )}
          </div>
          {fieldError("name") && (
            <p id="name-error" role="alert" className="text-sm text-tf-error">
              {fieldError("name")}
            </p>
          )}

          {/* Category: always on the main screen, so nothing is picked silently
              and the row never shifts the fields below it. */}
          {flatCategories.length > 0 && (
            <div className="flex min-h-11 items-center gap-2 text-sm text-tf-stone-600">
              <Tag aria-hidden="true" className="size-4 shrink-0 text-tf-stone-500" />
              <p className="min-w-0 flex-1">
                {chosenCategory ? (
                  <>
                    Listed under <span className="font-medium text-tf-ink">{chosenCategory.label}</span>
                    {category?.source === "photo" && " (from your photo)"}
                  </>
                ) : nameSuggestion ? (
                  <>
                    Suggested category:{" "}
                    <span className="font-medium text-tf-ink">{nameSuggestion.label}</span>
                  </>
                ) : (
                  "No marketplace category yet"
                )}
              </p>
              {!chosenCategory && nameSuggestion ? (
                <TfButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCategory({ id: nameSuggestion.id, source: "name" })}
                >
                  Use it
                </TfButton>
              ) : (
                <TfButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openField("globalCategoryId", true)}
                >
                  {chosenCategory ? "Change" : "Choose"}
                </TfButton>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="priceInRands" className={LABEL}>
              Price
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-tf-stone-500"
              >
                R
              </span>
              <input
                id="priceInRands"
                name="priceInRands"
                value={price}
                onChange={(event) => setPrice(cleanPrice(event.target.value))}
                inputMode="decimal"
                placeholder="0.00"
                disabled={isPending}
                aria-invalid={fieldError("priceInRands") ? true : undefined}
                aria-describedby={fieldError("priceInRands") ? "price-error" : undefined}
                enterKeyHint="done"
                autoComplete="off"
                className={cn(FIELD, "pl-9 font-medium tabular-nums")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="compareAtPriceInRands" className={LABEL}>
              Was <span className="font-normal text-tf-stone-600">(optional)</span>
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-tf-stone-500"
              >
                R
              </span>
              <input
                id="compareAtPriceInRands"
                name="compareAtPriceInRands"
                value={wasPrice}
                onChange={(event) => setWasPrice(cleanPrice(event.target.value))}
                inputMode="decimal"
                placeholder="0.00"
                disabled={isPending}
                aria-invalid={wasPriceError ? true : undefined}
                aria-describedby="was-price-note"
                enterKeyHint="done"
                autoComplete="off"
                className={cn(FIELD, "pl-9 tabular-nums")}
              />
            </div>
          </div>
        </div>
        {fieldError("priceInRands") && (
          <p id="price-error" role="alert" className="text-sm text-tf-error">
            {fieldError("priceInRands")}
          </p>
        )}
        <p
          id="was-price-note"
          role={wasPriceError ? "alert" : undefined}
          className={cn("text-sm", wasPriceError ? "text-tf-error" : "text-tf-stone-600")}
        >
          {wasPriceError ??
            (sale
              ? `Buyers see ${formatZAR(sale.compareAt)} crossed out and ${sale.percentOff}% off. Only use a price you really charged before.`
              : "Had a higher price before? Add it and buyers see the saving.")}
        </p>

        {sizes.length === 0 && (
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="stock" className={LABEL}>
              In stock
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStock((value) => String(Math.max(0, (Number.parseInt(value, 10) || 0) - 1)))}
                disabled={isPending || (Number.parseInt(stock, 10) || 0) <= 0}
                aria-label="One less in stock"
                className={STEPPER}
              >
                <Minus aria-hidden="true" className="size-4" />
              </button>
              <input
                id="stock"
                name="stock"
                value={stock}
                onChange={(event) => setStock(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                placeholder="1"
                disabled={isPending}
                aria-invalid={fieldError("stock") ? true : undefined}
                autoComplete="off"
                className={cn(FIELD, "w-20 px-2 text-center tabular-nums")}
              />
              <button
                type="button"
                onClick={() => setStock((value) => String(Math.min(999999, (Number.parseInt(value, 10) || 0) + 1)))}
                disabled={isPending}
                aria-label="One more in stock"
                className={STEPPER}
              >
                <Plus aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        )}
        {fieldError("stock") && (
          <p role="alert" className="text-sm text-tf-error">
            {fieldError("stock")}
          </p>
        )}
        {sizes.length === 0 && stock === "0" && (
          <p className="flex items-start gap-2 rounded-xl bg-tf-accent-soft px-3 py-2.5 text-sm text-tf-accent-ink">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            With 0 in stock, buyers see this as sold out.
          </p>
        )}

        <PriceSuggestionHint
          shopSlug={shopSlug}
          globalCategoryId={chosenCategory?.id ?? ""}
          onPick={(suggested) => setPrice(cleanPrice(suggested))}
        />

        <div id="add-product-sizes" tabIndex={-1} className="border-t border-tf-stone-100 pt-4 outline-none">
          <TfSizeChips
            optionLabel={option1Label}
            presetGroups={preset.option1Presets ?? []}
            presetLabels={preset.option1PresetLabels ?? []}
            value={sizes}
            onChange={setSizes}
            max={MAX_CREATE_SIZES}
            disabled={isPending}
            error={fieldError("sizes")}
          />
        </div>
      </section>

      {/* ── 3. What buyers get, and what the marketplace wants ── */}
      <TfBuyersSee
        name={text.name}
        priceInRands={price}
        compareAtInRands={wasPrice}
        imageUrl={previewUrl}
        shopName={shopName}
        optionLabel={option1Label}
        sizes={realSizes}
        totalStock={totalStock}
        visible={isActive}
      />

      <TfReadiness
        readiness={readiness}
        onFix={fix}
        shopReady={shopMarketplaceReady}
        shopSlug={shopSlug}
      />

      {/* ── 4. More options — everything else ────────────── */}
      <section className="rounded-2xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm">
        <h2>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-controls="add-product-more"
            className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            <span>
              <span className="font-tf-display text-base font-semibold text-tf-ink">More options</span>
              <span className="block text-sm font-normal text-tf-stone-600">
                Description, category, wholesale
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-5 shrink-0 text-tf-stone-500 transition-transform duration-200 motion-reduce:transition-none",
                moreOpen && "rotate-180",
              )}
            />
          </button>
        </h2>

        {/* Kept mounted while closed so every field is still submitted. */}
        <div id="add-product-more" hidden={!moreOpen} className="space-y-5 border-t border-tf-stone-100 p-4">
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="description" className={LABEL}>
                Description
              </label>
              {text.descriptionByAi && (
                <span className="inline-flex items-center gap-1 text-xs text-tf-stone-600">
                  <Sparkles aria-hidden="true" className="size-3.5 text-tf-primary" />
                  Written by AI. Edit freely.
                </span>
              )}
            </div>
            <textarea
              id="description"
              name="description"
              value={text.description}
              onChange={(event) =>
                setText((current) => ({ ...current, description: event.target.value, descriptionByAi: false }))
              }
              placeholder="Material, fit, condition, what makes it good"
              maxLength={2000}
              rows={5}
              disabled={isPending}
              aria-invalid={fieldError("description") ? true : undefined}
              className={cn(FIELD, "py-3 leading-relaxed")}
            />
            <p className={cn(HINT, "flex justify-between gap-3")}>
              <span>At least {MIN_LISTING_DESCRIPTION_LENGTH} characters for the marketplace.</span>
              <span className="shrink-0 tabular-nums">{text.description.length}/2000</span>
            </p>
            {fieldError("description") && (
              <p role="alert" className="text-sm text-tf-error">
                {fieldError("description")}
              </p>
            )}
          </div>

          {flatCategories.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="globalCategoryId" className={LABEL}>
                Marketplace category
              </label>
              <select
                id="globalCategoryId"
                name="globalCategoryId"
                value={chosenCategory?.id ?? ""}
                onChange={(event) =>
                  setCategory(event.target.value ? { id: event.target.value, source: "seller" } : null)
                }
                disabled={isPending}
                className={cn(FIELD, "cursor-pointer px-3")}
              >
                <option value="">Not on the marketplace</option>
                {globalCategories.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name} (general)</option>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className={HINT}>Buyers browsing the TradeFeed marketplace find it under this category.</p>
              {fieldError("globalCategoryId") && (
                <p role="alert" className="text-sm text-tf-error">
                  {fieldError("globalCategoryId")}
                </p>
              )}
            </div>
          )}

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="categoryId" className={LABEL}>
                Shop category <span className="font-normal text-tf-stone-600">(optional)</span>
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={shopCategoryId}
                onChange={(event) => setShopCategoryId(event.target.value)}
                disabled={isPending}
                className={cn(FIELD, "cursor-pointer px-3")}
              >
                <option value="">No category</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <p className={LABEL}>What your options are called</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="option1Label" className="sr-only">
                  First option name
                </label>
                <input
                  id="option1Label"
                  name="option1Label"
                  value={option1Label}
                  onChange={(event) =>
                    setLabels({ option1: event.target.value, option2: option2Label, edited: true })
                  }
                  maxLength={50}
                  disabled={isPending}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="option2Label" className="sr-only">
                  Second option name
                </label>
                <input
                  id="option2Label"
                  name="option2Label"
                  value={option2Label}
                  onChange={(event) =>
                    setLabels({ option1: option1Label, option2: event.target.value, edited: true })
                  }
                  maxLength={50}
                  disabled={isPending}
                  className={FIELD}
                />
              </div>
            </div>
            <p className={HINT}>Size and Color for clothing, Storage and Color for phones.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="minWholesaleQty" className={LABEL}>
              Smallest wholesale order
            </label>
            <div className="flex items-center gap-3">
              <input
                id="minWholesaleQty"
                name="minWholesaleQty"
                value={minWholesaleQty}
                onChange={(event) => setMinWholesaleQty(event.target.value.replace(/\D/g, "").slice(0, 5))}
                inputMode="numeric"
                disabled={isPending}
                className={cn(FIELD, "w-28 tabular-nums")}
              />
              <span className={HINT}>units per order</span>
            </div>
            <p className={HINT}>Leave at 1 for no minimum.</p>
            {fieldError("minWholesaleQty") && (
              <p role="alert" className="text-sm text-tf-error">
                {fieldError("minWholesaleQty")}
              </p>
            )}
          </div>

          <div className="space-y-3 border-t border-tf-stone-100 pt-4">
            <Toggle
              id="wholesaleOnly"
              name="wholesaleOnly"
              checked={wholesaleOnly}
              onChange={setWholesaleOnly}
              disabled={isPending}
              title="Wholesale only"
              hint="Only verified wholesale buyers can see it"
            />
            <Toggle
              id="isActive"
              name="isActive"
              checked={isActive}
              onChange={setIsActive}
              disabled={isPending}
              title="Show on my catalogue"
              hint="Turn off to save it as a hidden draft"
            />
          </div>
        </div>
      </section>

      {/* ── Publish — in the thumb zone, above the tab bar ── */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem_+_env(safe-area-inset-bottom,0px))] z-40 border-t border-tf-stone-200 bg-tf-surface/95 px-4 py-3 backdrop-blur-sm md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto max-w-xl">
          <TfButton type="submit" size="lg" fullWidth disabled={!canSubmit}>
            {isPending && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            <span className="min-w-0 truncate">{isPending ? (isActive ? "Publishing…" : "Saving…") : submitLabel}</span>
          </TfButton>
          {state?.error && !isPending ? (
            <p role="alert" className="mt-1.5 flex items-start justify-center gap-1.5 text-center text-sm font-medium text-tf-error">
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{state.error}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-center text-sm text-tf-stone-600" aria-live="polite">
              {blocker ??
                (isActive
                  ? "Goes on your catalogue straight away."
                  : "Saved hidden until you publish it.")}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
