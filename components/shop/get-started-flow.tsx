// ============================================================
// Component — Get Started Flow (Product-First Onboarding)
// ============================================================
// 3 inline steps, no page navigation:
//   Step 1: WhatsApp number + shop name → creates shop
//   Step 2: SNAP A PHOTO → AI generates listing → add price → publish
//   Step 3: 🎉 Your shop is live! Share link
//
// The WOW moment: upload a photo → AI fills everything in seconds
// ============================================================

"use client";

import { useState, useRef, useCallback, useActionState, useEffect } from "react";
import Link from "next/link";
import {
  createShopOnboardingAction,
  createFirstProductAction,
  trackOnboardingCompleteAction,
} from "@/app/actions/onboarding";
import { saveProductImagesAction } from "@/app/actions/image";
import { useUploadThing } from "@/lib/uploadthing";
import { TradeFeedLogo } from "@/components/ui/tradefeed-logo";

interface Props {
  suggestedShopName: string;
}

// ── Image compression ─────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_W = 1200;
      let w = img.width;
      let h = img.height;
      if (w > MAX_W) {
        h = Math.round((h * MAX_W) / w);
        w = MAX_W;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) =>
          resolve(
            blob ? new File([blob], file.name, { type: "image/jpeg" }) : file,
          ),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function GetStartedFlow({ suggestedShopName }: Props) {
  // ── Shared state ────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shopSlug, setShopSlug] = useState("");
  const [productId, setProductId] = useState("");
  const [shopName, setShopName] = useState(suggestedShopName);

  // ── Step 1: Shop creation ───────────────────────────────
  const [shopState, shopAction, shopPending] = useActionState(
    createShopOnboardingAction,
    null,
  );

  useEffect(() => {
    if (shopState?.success && shopState.shopSlug) {
      setShopSlug(shopState.shopSlug);
      setStep(2);
    }
  }, [shopState]);

  // ── Step 2: AI-Powered Product creation ──────────────
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<{ url: string; key: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("productImageUploader", {
    onUploadError: (err) => {
      setProductError(err?.message || "Image upload failed.");
      setIsUploading(false);
    },
  });

  // Upload image to CDN → then immediately trigger AI analysis
  const handleImageSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      setImagePreview(URL.createObjectURL(file));
      setProductError(null);
      setAiDone(false);
      setIsUploading(true);

      try {
        // 1. Compress + upload to CDN
        const compressed = await compressImage(file);
        const uploadResult = await startUpload([compressed]);

        if (!uploadResult || uploadResult.length === 0) {
          setProductError("Upload failed. Try again.");
          setIsUploading(false);
          return;
        }

        const serverData = uploadResult[0]?.serverData;
        if (!serverData?.url) {
          setProductError("Upload failed. Try again.");
          setIsUploading(false);
          return;
        }
        const imgData = {
          url: serverData.url,
          key: serverData.key,
          name: serverData.name,
        };
        setUploadedImageUrl(imgData.url);
        setUploadedImageData(imgData);
        setIsUploading(false);

        // 2. Automatically trigger AI analysis
        setIsAnalyzing(true);
        try {
          const res = await fetch("/api/ai/generate-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: imgData.url, shopSlug }),
          });
          const data = await res.json();

          if (res.ok && data.data) {
            // AI magic — auto-fill fields
            setProductName(data.data.name || "");
            setDescription(data.data.description || "");
            if (data.data.category) setCategory(data.data.category);
            setAiDone(true);
          }
          // If AI fails (credits, error), silently degrade — user can type manually
        } catch {
          // AI failed — no problem, fields stay empty for manual input
        } finally {
          setIsAnalyzing(false);
        }
      } catch {
        setProductError("Upload failed. Try again.");
        setIsUploading(false);
      }
    },
    [shopSlug, startUpload],
  );

  const handlePublishProduct = async () => {
    if (!price || parseFloat(price) <= 0) {
      setProductError("Enter a price greater than zero.");
      return;
    }

    setIsPublishing(true);
    setProductError(null);

    try {
      // Create the product
      const formData = new FormData();
      formData.set("productName", productName || "My First Product");
      formData.set("description", description);
      formData.set("category", category);
      formData.set("quantity", quantity || "1");
      formData.set("priceInRands", price);

      const result = await createFirstProductAction(shopSlug, formData);
      if (!result.success || !result.productId) {
        setProductError(result.error ?? "Failed to create product.");
        setIsPublishing(false);
        return;
      }

      setProductId(result.productId);

      // Save the already-uploaded image to the product
      if (uploadedImageData) {
        try {
          await saveProductImagesAction(shopSlug, result.productId, [uploadedImageData]);
        } catch {
          // Image save failed but product was created — continue
        }
      }

      // Track completion
      trackOnboardingCompleteAction(shopSlug).catch(() => {});

      setStep(3);
    } catch {
      setProductError("Something went wrong. Try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Step indicator ──────────────────────────────────────
  const steps = [
    { num: 1, label: "Your details" },
    { num: 2, label: "First product" },
    { num: 3, label: "You're live!" },
  ] as const;

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Header */}
      <div className="w-full max-w-lg mx-auto px-4 pt-8 pb-4">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <TradeFeedLogo size="lg" />
        </Link>
      </div>

      {/* Step indicator */}
      <div className="w-full max-w-lg mx-auto px-4 mb-8">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all ${
                  step > s.num
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : step === s.num
                      ? "border-emerald-500 text-emerald-400"
                      : "border-stone-700 text-stone-600"
                }`}
              >
                {step > s.num ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  s.num
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  step >= s.num ? "text-stone-300" : "text-stone-600"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded ${
                    step > s.num ? "bg-emerald-500" : "bg-stone-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-lg mx-auto px-4 pb-16">
        {/* ═══════════════════════════════════════════════════
            STEP 1: WhatsApp Number + Shop Name
            ═══════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Let&apos;s get you{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  selling
                </span>
              </h1>
              <p className="mt-2 text-stone-400 text-sm">
                Two quick details, then upload your first product.
              </p>
            </div>

            <form action={shopAction} className="space-y-5">
              {shopState?.error && !shopState.fieldErrors && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
                  {shopState.error}
                </div>
              )}

              {/* Shop Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-stone-200"
                >
                  Shop Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. SA Trade Supplies"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={shopPending}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                />
                {shopState?.fieldErrors?.name && (
                  <p className="text-xs text-red-400">
                    {shopState.fieldErrors.name[0]}
                  </p>
                )}
                {shopName && (
                  <p className="text-xs text-stone-500">
                    Your link:{" "}
                    <span className="text-emerald-400">
                      tradefeed.co.za/catalog/
                      {shopName
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .slice(0, 40)}
                    </span>
                  </p>
                )}
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <label
                  htmlFor="whatsappNumber"
                  className="text-sm font-medium text-stone-200"
                >
                  WhatsApp Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    <span className="text-sm text-stone-500 font-medium">
                      🇿🇦
                    </span>
                    <span className="text-sm text-stone-500">+27</span>
                    <div className="w-px h-4 bg-stone-700" />
                  </div>
                  <input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    type="tel"
                    placeholder="71 234 5678"
                    required
                    disabled={shopPending}
                    className="w-full h-12 pl-[5.5rem] pr-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                  />
                </div>
                {shopState?.fieldErrors?.whatsappNumber && (
                  <p className="text-xs text-red-400">
                    {shopState.fieldErrors.whatsappNumber[0]}
                  </p>
                )}
                <p className="text-xs text-stone-500">
                  Buyers will order via this WhatsApp number
                </p>
              </div>

              <button
                type="submit"
                disabled={shopPending}
                className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-400 transition-all" />
                <div className="relative flex items-center justify-center gap-2">
                  {shopPending ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating your shop...
                    </>
                  ) : (
                    <>
                      Next: Upload product
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
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>

            <p className="text-center text-xs text-stone-600">
              Already have a shop?{" "}
              <Link
                href="/dashboard"
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Go to dashboard
              </Link>
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 2: SNAP → AI MAGIC → Price → Publish
            ═══════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {!imagePreview ? (
                  <>
                    Snap a{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                      photo
                    </span>
                  </>
                ) : isUploading || isAnalyzing ? (
                  <>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                      AI
                    </span>{" "}
                    is working its magic...
                  </>
                ) : aiDone ? (
                  <>
                    ✨ Your listing is{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                      ready
                    </span>
                  </>
                ) : (
                  <>
                    Upload your{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                      first product
                    </span>
                  </>
                )}
              </h1>
              <p className="mt-2 text-stone-400 text-sm">
                {!imagePreview
                  ? "Take a product photo — AI creates your listing instantly."
                  : isUploading
                    ? "Uploading your photo..."
                    : isAnalyzing
                      ? "Analyzing your product with AI..."
                      : aiDone
                        ? "AI filled in the details. Just add your price!"
                        : "Add a name and price to go live."}
              </p>
            </div>

            {productError && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-300">
                {productError}
              </div>
            )}

            {/* Photo upload area */}
            <div
              onClick={() => !isPublishing && !isUploading && !isAnalyzing && fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-500 overflow-hidden ${
                isUploading || isAnalyzing
                  ? "border-violet-500/60 bg-violet-950/20 cursor-wait"
                  : imagePreview
                    ? "border-emerald-500/50 bg-emerald-950/20 cursor-pointer"
                    : "border-stone-700 bg-stone-800/30 hover:border-emerald-500/40 hover:bg-stone-800/50 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect}
                disabled={isPublishing || isUploading || isAnalyzing}
              />

              {imagePreview ? (
                <div className="relative aspect-square max-h-64 mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className={`w-full h-full object-contain p-2 transition-all duration-700 ${
                      isUploading || isAnalyzing ? "opacity-60 scale-[0.97]" : "opacity-100 scale-100"
                    }`}
                  />

                  {/* AI analyzing overlay */}
                  {(isUploading || isAnalyzing) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/40 backdrop-blur-[2px]">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 animate-pulse">
                          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium text-white">
                        {isUploading ? "Uploading..." : "✨ AI is analyzing..."}
                      </p>
                      <div className="mt-2 flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  {/* AI done badge */}
                  {aiDone && !isAnalyzing && !isUploading && (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-violet-600/90 text-xs font-medium text-white flex items-center gap-1 animate-in fade-in slide-in-from-top-2">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                      AI generated
                    </div>
                  )}

                  {!isUploading && !isAnalyzing && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-stone-900/80 text-xs text-emerald-400">
                      Tap to change
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-emerald-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                      <svg
                        className="w-10 h-10 text-violet-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                        />
                      </svg>
                    </div>
                    {/* Sparkle accent */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 text-violet-400">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-base font-semibold text-stone-200">
                    📸 Snap a photo
                  </p>
                  <p className="text-sm text-violet-400 mt-1 font-medium">
                    AI creates your listing in seconds
                  </p>
                  <p className="text-xs text-stone-500 mt-2">
                    Take a photo or choose from gallery
                  </p>
                </div>
              )}
            </div>

            {/* AI-generated description preview */}
            {aiDone && description && (
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-4 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                  </svg>
                  <p className="text-xs font-medium text-violet-400">AI-generated description</p>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed line-clamp-3">
                  {description}
                </p>
              </div>
            )}

            {/* Product name */}
            <div className="space-y-2">
              <label
                htmlFor="productName"
                className="text-sm font-medium text-stone-200 flex items-center gap-2"
              >
                Product Name
                {aiDone && productName && (
                  <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full">
                    ✨ AI
                  </span>
                )}
              </label>
              <input
                id="productName"
                type="text"
                placeholder={isAnalyzing ? "AI is generating..." : "e.g. Nike Air Max 90"}
                maxLength={200}
                disabled={isPublishing || isAnalyzing}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className={`w-full h-12 px-4 rounded-xl bg-stone-800/60 border text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50 ${
                  aiDone && productName
                    ? "border-violet-500/40 ring-1 ring-violet-500/20"
                    : "border-stone-700/60"
                }`}
              />
            </div>

            {/* AI Category chip */}
            {category && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <span className="text-xs text-stone-500">Category:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                  {aiDone && (
                    <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  )}
                  {category}
                </span>
              </div>
            )}

            {/* Price + Quantity row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Price */}
              <div className="space-y-2">
                <label
                  htmlFor="price"
                  className="text-sm font-medium text-stone-200"
                >
                  Price (ZAR)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-stone-500 font-medium">
                    R
                  </div>
                  <input
                    id="price"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    placeholder="150"
                    required
                    disabled={isPublishing}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-12 pl-9 pr-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-stone-200"
                >
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="999999"
                  step="1"
                  placeholder="1"
                  disabled={isPublishing}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-stone-800/60 border border-stone-700/60 text-stone-100 placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Publish */}
            <button
              type="button"
              onClick={handlePublishProduct}
              disabled={isPublishing || !price}
              className="relative w-full h-12 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 group-hover:from-emerald-500 group-hover:to-emerald-400 transition-all" />
              <div className="relative flex items-center justify-center gap-2">
                {isPublishing ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    Publish &amp; Go Live
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
                        d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                      />
                    </svg>
                  </>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                // Skip product, go straight to dashboard
                trackOnboardingCompleteAction(shopSlug).catch(() => {});
                setStep(3);
              }}
              disabled={isPublishing}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-400 transition-colors"
            >
              Skip for now — I&apos;ll add products later
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STEP 3: 🎉 Celebration — Your Shop is Live!
            ═══════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="text-center space-y-6 py-8">
            {/* Confetti emoji + celebration */}
            <div className="text-6xl animate-bounce">🎉</div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Your shop is{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  live!
                </span>
              </h1>
              <p className="mt-3 text-stone-400 text-sm max-w-sm mx-auto">
                {productId
                  ? "Your first product is published. Share your shop link with buyers on WhatsApp!"
                  : "Your shop is ready. Add products anytime from your dashboard."}
              </p>
            </div>

            {/* Store link */}
            <div className="p-4 rounded-xl bg-stone-800/50 border border-stone-700/50">
              <p className="text-xs text-stone-500 mb-1">Your shop link</p>
              <p className="text-sm font-medium text-emerald-400 break-all">
                tradefeed.co.za/catalog/{shopSlug}
              </p>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              {/* Share on WhatsApp — primary CTA */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🛍️ Check out my shop on TradeFeed!\nhttps://www.tradefeed.co.za/catalog/${shopSlug}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Share on WhatsApp
              </a>

              {/* View your shop */}
              <a
                href={`/catalog/${shopSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-stone-800 border border-stone-700 text-stone-200 hover:bg-stone-700 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6 6-6m0 0H9m4.5 0v4.5"
                  />
                </svg>
                View Your Shop
              </a>

              {/* Go to dashboard */}
              <Link
                href={`/dashboard/${shopSlug}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-stone-400 hover:text-stone-300 transition-colors"
              >
                Go to Dashboard
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
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>

            {/* Quick tip */}
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-left">
              <p className="text-xs font-medium text-emerald-400 mb-1">
                💡 Pro tip
              </p>
              <p className="text-xs text-stone-400">
                Add more products from your dashboard to attract more buyers.
                Shops with 5+ products get 3x more views.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
