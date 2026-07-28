// ============================================================
// Component — Create Product Form (v3 — Photo-first)
// ============================================================
// The fastest path IS the default path: drop a photo, AI writes
// the listing, seller confirms price + stock, publish. Manual
// typing is the quiet fallback, advanced fields live behind one
// "More options" fold. Same createProductAction contract as v2.
// ============================================================

"use client";

import { useActionState, useState, useMemo, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  PartyPopper,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { createProductAction } from "@/app/actions/product";
import { trackCatalogSharedAction } from "@/app/actions/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlobalCategoryPicker } from "@/components/product/global-category-picker";
import { ImageUpload } from "@/components/product/image-upload";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";
import { suggestGlobalCategory } from "@/lib/config/category-suggest";
import { getVariantLabels } from "@/lib/config/category-variants";
import { toast } from "sonner";
import Link from "next/link";

/* ── Quick-name chips (manual path helper) ─────────────────── */
const PRODUCT_TYPES = [
  "T-Shirt",
  "Hoodie",
  "Jacket",
  "Jeans",
  "Dress",
  "Sneakers",
  "Phone",
  "Earbuds",
  "Charger",
  "Skincare",
  "Fragrance",
  "Snack Pack",
  "Beverage",
  "Home Decor",
  "Accessory",
] as const;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const INPUT_CLASSES =
  "h-12 rounded-xl border border-stone-300 bg-white text-base text-stone-900 placeholder:text-stone-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20";

interface CreateProductFormProps {
  shopSlug: string;
  categories?: { id: string; name: string }[];
  globalCategories?: GlobalCategoryOption[];
  planSlug?: string;
  /** When true, scroll focus to the photo step (from ?ai=true deep link) */
  autoOpenAi?: boolean;
}

export function CreateProductForm({
  shopSlug,
  categories = [],
  globalCategories = [],
  planSlug = "free",
  autoOpenAi = false,
}: CreateProductFormProps) {
  const boundAction = createProductAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [option1Label, setOption1Label] = useState("Size");
  const [option2Label, setOption2Label] = useState("Color");
  const [selectedGlobalCategorySlug, setSelectedGlobalCategorySlug] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  // ── AI state (same endpoint + gates as v2) ──────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiSeoPreview, setAiSeoPreview] = useState<{ seoTitle: string; seoDescription: string; tags: string[] } | null>(null);
  const [aiCreditsRemaining, setAiCreditsRemaining] = useState<number | null>(null);
  const [aiUsedWithoutPlan, setAiUsedWithoutPlan] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const hasAiAccess = ["pro-ai", "business"].includes(planSlug);

  const suggestedSlug = useMemo(() => suggestGlobalCategory(name), [name]);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoOpenAi) photoRef.current?.scrollIntoView({ block: "center" });
  }, [autoOpenAi]);

  // Variant labels follow the marketplace category
  useEffect(() => {
    if (selectedGlobalCategorySlug) {
      const labels = getVariantLabels(selectedGlobalCategorySlug);
      setOption1Label(labels.option1Label);
      setOption2Label(labels.option2Label);
    }
  }, [selectedGlobalCategorySlug]);

  const handleQuickName = (label: string) => {
    setName(label);
    const slug = suggestGlobalCategory(label);
    if (slug) setSelectedGlobalCategorySlug(slug);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAiImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    if (!aiImageUrl) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: aiImageUrl, shopSlug }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "PLAN_REQUIRED") {
          setAiError("PLAN_REQUIRED");
          setAiUsedWithoutPlan(true);
          return;
        }
        if (data.error === "CREDITS_EXHAUSTED") {
          setAiError("CREDITS_EXHAUSTED");
          setAiCreditsRemaining(0);
          return;
        }
        throw new Error(data.message || "AI generation failed");
      }

      if (data.credits) {
        setAiCreditsRemaining(data.credits.unlimited ? null : data.credits.remaining);
        if (!data.credits.unlimited) setAiUsedWithoutPlan(true);
      }

      const ai = data.data;
      setName(ai.name);
      setDescription(ai.description);
      setAiGenerated(true);
      setMoreOpen(true);
      if (ai.category) {
        const slug = suggestGlobalCategory(ai.category);
        if (slug) setSelectedGlobalCategorySlug(slug);
      }
      if (ai.seoTitle || ai.seoDescription || ai.tags?.length) {
        setAiSeoPreview({
          seoTitle: ai.seoTitle || ai.name,
          seoDescription: ai.seoDescription || (ai.description || "").slice(0, 155),
          tags: ai.tags || [],
        });
      }
      toast.success("Listing written — check the details, set your price, publish.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════════════
     SUCCESS — product is live
  ══════════════════════════════════════════════════════════ */
  if (state?.success && state.productId) {
    const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${shopSlug}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out my shop!\n${catalogUrl}`)}`;
    const isFirstProduct = !!state.isFirstProduct;

    return (
      <div className="mx-auto w-full max-w-lg space-y-5 py-6">
        {/* Confirmation */}
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            <Check className="size-7" strokeWidth={3} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">
            {name || "Your product"} is live
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Buyers can see it on your catalogue right now.
          </p>
        </div>

        {/* First product: sharing is the one thing that matters */}
        {isFirstProduct && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <PartyPopper className="size-4" aria-hidden="true" />
              That was your first product — now tell your customers
            </p>
            <p className="mt-1 text-xs text-emerald-800/80">
              Sellers who share their link on day one get their first order 3× sooner.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void trackCatalogSharedAction(shopSlug, "dashboard");
              }}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp text-base font-semibold text-white transition-colors hover:bg-whatsapp-hover"
            >
              <WhatsAppIcon className="size-5" />
              Share your catalogue on WhatsApp
            </a>
          </div>
        )}

        {/* Photos */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-semibold text-stone-900">
            Add photos{" "}
            <span className="font-normal text-stone-400">— products with photos sell 5× more</span>
          </p>
          <div className="mt-3">
            <ImageUpload
              images={[]}
              shopSlug={shopSlug}
              productId={state.productId}
              autoUploadDataUrl={aiGenerated ? aiImageUrl : null}
            />
          </div>
        </div>

        {/* Catalogue link */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Your catalogue link
          </p>
          <p className="mt-1 select-all break-all font-mono text-sm text-stone-700">{catalogUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(catalogUrl);
                void trackCatalogSharedAction(shopSlug, "dashboard");
                toast.success("Link copied");
              }}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              Copy link
            </button>
            {!isFirstProduct && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void trackCatalogSharedAction(shopSlug, "dashboard");
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-whatsapp px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-whatsapp-hover"
              >
                <WhatsAppIcon className="size-3.5" />
                Share on WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* Next steps */}
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Add another product
          </button>
          <Link
            href={`/dashboard/${shopSlug}/products/${state.productId}`}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            Edit details
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     FORM — photo first, essentials second, everything else folded
  ══════════════════════════════════════════════════════════ */
  const canPublish = name.trim().length >= 2 && !isPending;

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 pb-28">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Add a product</h1>
        <p className="mt-1 text-sm text-stone-500">
          Drop a photo and let AI write the listing — or type it yourself below.
        </p>
      </div>

      {/* ── Step 1 — Photo (the fast path) ─────────────────── */}
      <div
        ref={photoRef}
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">1</span>
            Product photo
          </p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {hasAiAccess
              ? "Unlimited AI"
              : aiCreditsRemaining !== null
                ? `${aiCreditsRemaining} AI credit${aiCreditsRemaining === 1 ? "" : "s"} left`
                : "Free AI included"}
          </span>
        </div>

        <div className="mt-4">
          {aiImageUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              <img src={aiImageUrl} alt="Your product" className="h-52 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setAiImageUrl(null);
                  setAiSeoPreview(null);
                }}
                aria-label="Remove photo"
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-stone-900/60 text-white transition-colors hover:bg-stone-900/80"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && file.type.startsWith("image/")) handleFile(file);
              }}
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-stone-400 shadow-sm">
                <Camera className="size-6" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-stone-700">
                Tap to add a photo
              </span>
              <span className="text-xs text-stone-400">
                Straight from your camera or gallery
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        {aiImageUrl && !aiGenerated && (
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
          >
            {aiLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Reading your photo…
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden="true" />
                Write my listing for me
              </>
            )}
          </button>
        )}

        {aiGenerated && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <Check className="size-3.5 shrink-0" aria-hidden="true" />
            Listing written from your photo — review it below, then set your price.
          </p>
        )}

        {/* AI upgrade / error states */}
        {aiError === "CREDITS_EXHAUSTED" && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-stone-900">
              You&apos;ve used all your AI listings for now
            </p>
            <p className="mt-1 text-xs text-stone-600">
              Upgrade for unlimited AI listings — or keep typing them yourself below, free forever.
            </p>
            <Link
              href={`/dashboard/${shopSlug}/billing`}
              className="mt-3 block w-full rounded-lg bg-emerald-700 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              See plans
            </Link>
          </div>
        )}
        {aiError === "PLAN_REQUIRED" && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-stone-900">AI listings need a Pro AI plan</p>
            <p className="mt-1 text-xs text-stone-600">
              Upload a photo, get a ready listing in seconds — every time.
            </p>
            <Link
              href={`/dashboard/${shopSlug}/billing`}
              className="mt-3 block w-full rounded-lg bg-emerald-700 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Upgrade to Pro AI
            </Link>
          </div>
        )}
        {aiError && aiError !== "PLAN_REQUIRED" && aiError !== "CREDITS_EXHAUSTED" && (
          <p className="mt-3 text-center text-xs text-red-600">{aiError}</p>
        )}
      </div>

      {/* ── Step 2 + 3 — the actual form ───────────────────── */}
      <form action={formAction} className="space-y-4">
        {aiGenerated && <input type="hidden" name="aiGenerated" value="on" />}

        {state?.error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.error}
          </div>
        )}
        {state?.warning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {state.warning}
          </div>
        )}

        {/* Essentials card */}
        <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">2</span>
            Name &amp; price
          </p>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-stone-700">
              What is it?
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Waffle Knit Polo Shirt"
              required
              minLength={2}
              maxLength={200}
              disabled={isPending}
              className={INPUT_CLASSES}
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
            )}
            {/* Quick picks — only while the field is empty */}
            {!name && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRODUCT_TYPES.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleQuickName(label)}
                    className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price + stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priceInRands" className="text-sm font-medium text-stone-700">
                Price
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
                  R
                </span>
                <Input
                  id="priceInRands"
                  name="priceInRands"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={isPending}
                  className={`${INPUT_CLASSES} pl-9`}
                />
              </div>
              {state?.fieldErrors?.priceInRands && (
                <p className="text-xs text-red-600">{state.fieldErrors.priceInRands[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock" className="text-sm font-medium text-stone-700">
                In stock
              </Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="e.g. 50"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={isPending}
                className={INPUT_CLASSES}
              />
              {state?.fieldErrors?.stock && (
                <p className="text-xs text-red-600">{state.fieldErrors.stock[0]}</p>
              )}
            </div>
          </div>
          {/* Sold-out warning ONLY when it applies */}
          {stock === "0" && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              With 0 stock this product shows as sold out. Set at least 1 to take orders.
            </p>
          )}
          <p className="text-xs text-stone-400">
            One price is enough to start — sizes, colours and more photos can come later.
          </p>
        </div>

        {/* More options — one fold for everything else */}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-stone-700 transition-colors hover:text-stone-900"
          >
            <span>More options <span className="font-normal text-stone-400">— description, category, wholesale</span></span>
            <ChevronDown
              className={`size-4 text-stone-400 transition-transform ${moreOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          <div className={moreOpen ? "space-y-5 border-t border-stone-100 p-5" : "hidden"}>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-stone-700">
                Description <span className="font-normal text-stone-400">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Material, fit, what makes it good…"
                maxLength={2000}
                rows={4}
                disabled={isPending}
                className="rounded-xl border-stone-300 text-base focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
              {state?.fieldErrors?.description && (
                <p className="text-sm text-red-600">{state.fieldErrors.description[0]}</p>
              )}
            </div>

            {/* Marketplace category */}
            {globalCategories.length > 0 && (
              <GlobalCategoryPicker
                categories={globalCategories}
                productName={name}
                suggestedSlug={suggestedSlug}
                disabled={isPending}
                onCategoryChange={setSelectedGlobalCategorySlug}
              />
            )}

            {/* Shop category */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-medium text-stone-700">
                  Shop category <span className="font-normal text-stone-400">(optional)</span>
                </Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  disabled={isPending}
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base text-stone-900 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Variant labels */}
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-stone-700">
                <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
                Option labels: {option1Label} / {option2Label}
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="option1Label" className="text-xs text-stone-500">
                    Option 1 label
                  </Label>
                  <Input
                    id="option1Label"
                    name="option1Label"
                    value={option1Label}
                    onChange={(e) => setOption1Label(e.target.value)}
                    placeholder="Size"
                    disabled={isPending}
                    className="h-10 rounded-lg border-stone-300 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="option2Label" className="text-xs text-stone-500">
                    Option 2 label
                  </Label>
                  <Input
                    id="option2Label"
                    name="option2Label"
                    value={option2Label}
                    onChange={(e) => setOption2Label(e.target.value)}
                    placeholder="Color"
                    disabled={isPending}
                    className="h-10 rounded-lg border-stone-300 text-sm"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                What your options mean — Size/Color for clothing, Storage/Color for phones.
              </p>
            </details>

            {/* Wholesale minimum */}
            <div className="space-y-2">
              <Label htmlFor="minWholesaleQty" className="text-sm font-medium text-stone-700">
                Minimum wholesale order
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="minWholesaleQty"
                  name="minWholesaleQty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={99999}
                  defaultValue={1}
                  disabled={isPending}
                  className="h-11 w-28 rounded-lg border-stone-300 text-base"
                />
                <span className="text-sm text-stone-500">units per order</span>
              </div>
              <p className="text-xs text-stone-400">Leave at 1 for no minimum.</p>
              {state?.fieldErrors?.minWholesaleQty && (
                <p className="text-xs text-red-600">{state.fieldErrors.minWholesaleQty[0]}</p>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-stone-700">
                  Wholesale only
                  <span className="block text-xs text-stone-400">
                    Only verified wholesale buyers can see it
                  </span>
                </span>
                <span className="relative">
                  <input type="checkbox" id="wholesaleOnly" name="wholesaleOnly" disabled={isPending} className="peer sr-only" />
                  <span className="block h-6 w-10 rounded-full bg-stone-200 transition-colors peer-checked:bg-emerald-600" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-sm text-stone-700">
                  Show on public catalogue
                  <span className="block text-xs text-stone-400">Turn off to save as hidden</span>
                </span>
                <span className="relative">
                  <input type="checkbox" id="isActive" name="isActive" defaultChecked disabled={isPending} className="peer sr-only" />
                  <span className="block h-6 w-10 rounded-full bg-stone-200 transition-colors peer-checked:bg-emerald-600" />
                  <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Google preview — quiet, collapsible, only after AI */}
        {aiSeoPreview && (
          <details className="rounded-2xl border border-stone-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 text-sm font-semibold text-stone-700">
              <Search className="size-4 text-stone-400" aria-hidden="true" />
              How it looks on Google
            </summary>
            <div className="space-y-3 border-t border-stone-100 p-5">
              <div className="space-y-1">
                <p className="truncate text-base font-medium leading-snug text-blue-700">
                  {aiSeoPreview.seoTitle}
                </p>
                <p className="truncate text-xs text-emerald-700">
                  tradefeed.co.za &rsaquo; catalog &rsaquo; {shopSlug} &rsaquo; products
                </p>
                <p className="line-clamp-2 text-sm leading-relaxed text-stone-600">
                  {aiSeoPreview.seoDescription}
                </p>
              </div>
              {aiSeoPreview.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {aiSeoPreview.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {aiUsedWithoutPlan && aiCreditsRemaining !== null && aiCreditsRemaining > 0 && (
                <p className="text-xs text-stone-500">
                  {aiCreditsRemaining} free AI listing{aiCreditsRemaining === 1 ? "" : "s"} left this month ·{" "}
                  <Link href={`/dashboard/${shopSlug}/billing`} className="font-medium text-emerald-700 underline underline-offset-2">
                    go unlimited
                  </Link>
                </p>
              )}
            </div>
          </details>
        )}

        {/* Sticky publish bar */}
        <div className="fixed inset-x-0 bottom-14 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="mx-auto max-w-xl">
            <button
              type="submit"
              disabled={!canPublish}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-base font-semibold text-white shadow-lg shadow-emerald-700/15 transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Publishing…
                </>
              ) : name.trim() ? (
                `Publish ${name.trim()}`
              ) : (
                "Publish product"
              )}
            </button>
            <p className="mt-1.5 hidden text-center text-xs text-stone-400 md:block">
              Goes live on your catalogue immediately — you can edit anything later.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
