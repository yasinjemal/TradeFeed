// ============================================================
// Component — Create Product Form (v2 — Smart Tiles)
// ============================================================
// One-tap product type tiles → auto-fills name. Minimal typing.
// After creation, redirects to detail page for images + variants.
// ============================================================

"use client";

import { useActionState, useState, useMemo, useEffect } from "react";
import { createProductAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlobalCategoryPicker } from "@/components/product/global-category-picker";
import { ImageUpload } from "@/components/product/image-upload";
import { SellerTip } from "@/components/product/seller-tip";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";
import { suggestGlobalCategory } from "@/lib/config/category-suggest";
import { getVariantLabels } from "@/lib/config/category-variants";
import { toast } from "sonner";
import Link from "next/link";

/* ── Product Type Tiles ─────────────────────────────────── */
const PRODUCT_TYPES = [
  // Clothing
  { label: "T-Shirt", emoji: "👕" },
  { label: "Hoodie", emoji: "🧥" },
  { label: "Jacket", emoji: "🧥" },
  { label: "Jeans", emoji: "👖" },
  { label: "Dress", emoji: "👗" },
  { label: "Sneakers", emoji: "👟" },
  // Electronics
  { label: "Phone", emoji: "📱" },
  { label: "Earbuds", emoji: "🎧" },
  { label: "Charger", emoji: "🔌" },
  // Beauty
  { label: "Skincare", emoji: "🧴" },
  { label: "Fragrance", emoji: "🌸" },
  // Food
  { label: "Snack Pack", emoji: "🍿" },
  { label: "Beverage", emoji: "🥤" },
  // Home & General
  { label: "Home Decor", emoji: "🏠" },
  { label: "Accessory", emoji: "👜" },
  { label: "Other", emoji: "📦" },
] as const;

interface CreateProductFormProps {
  shopSlug: string;
  categories?: { id: string; name: string }[];
  globalCategories?: GlobalCategoryOption[];
  planSlug?: string;
  /** When true, auto-expand the AI generator panel (from ?ai=true deep link) */
  autoOpenAi?: boolean;
}

export function CreateProductForm({ shopSlug, categories = [], globalCategories = [], planSlug = "free", autoOpenAi = false }: CreateProductFormProps) {
  const boundAction = createProductAction.bind(null, shopSlug);
  const [state, formAction, isPending] = useActionState(boundAction, null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [option1Label, setOption1Label] = useState("Size");
  const [option2Label, setOption2Label] = useState("Color");
  const [selectedGlobalCategorySlug, setSelectedGlobalCategorySlug] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── AI Generation State ──────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [aiSeoPreview, setAiSeoPreview] = useState<{ seoTitle: string; seoDescription: string; tags: string[] } | null>(null);
  const hasAiAccess = ["pro-ai", "business"].includes(planSlug);
  // Show AI panel for everyone when autoOpenAi=true (from homepage CTA)
  const [showAiPanel, setShowAiPanel] = useState(autoOpenAi || hasAiAccess);
  // Track if user generated AI content without having the plan
  const [aiUsedWithoutPlan, setAiUsedWithoutPlan] = useState(false);  // AI credits tracking (null = unlimited / unknown yet)
  const [aiCreditsRemaining, setAiCreditsRemaining] = useState<number | null>(null);
  // M8.3: Auto-suggest global category based on product name
  const suggestedSlug = useMemo(() => suggestGlobalCategory(name), [name]);

  // Auto-update variant labels when global category changes
  useEffect(() => {
    if (selectedGlobalCategorySlug) {
      const labels = getVariantLabels(selectedGlobalCategorySlug);
      setOption1Label(labels.option1Label);
      setOption2Label(labels.option2Label);
    }
  }, [selectedGlobalCategorySlug]);

  const handleTypeSelect = (label: string) => {
    setSelectedType(label);
    if (!name || PRODUCT_TYPES.some((t) => t.label === name)) {
      setName(label);
    }
    // Auto-suggest global category + variant labels from type tile
    const slug = suggestGlobalCategory(label);
    if (slug) {
      setSelectedGlobalCategorySlug(slug);
      const labels = getVariantLabels(slug);
      setOption1Label(labels.option1Label);
      setOption2Label(labels.option2Label);
    }
  };

  // ── AI Generation Handler ────────────────────────────
  const handleAiGenerate = async () => {
    if (!aiImageUrl) {
      toast.error("Upload an image first, then generate with AI");
      return;
    }
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
          // User tried AI without plan — still show the result from mock/preview
          // but flag that they need to upgrade to publish with AI
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

      // Track remaining credits from API response
      if (data.credits) {
        setAiCreditsRemaining(data.credits.unlimited ? null : data.credits.remaining);
        if (!data.credits.unlimited) {
          setAiUsedWithoutPlan(true);
        }
      }

      // Prefill form fields with SEO-optimized content
      const ai = data.data;
      setName(ai.name);
      setDescription(ai.description);
      setShowAdvanced(true);
      // Store SEO preview data for the seller to see
      if (ai.seoTitle || ai.seoDescription || ai.tags?.length) {
        setAiSeoPreview({
          seoTitle: ai.seoTitle || ai.name,
          seoDescription: ai.seoDescription || (ai.description || "").slice(0, 155),
          tags: ai.tags || [],
        });
      }
      toast.success("✨ AI generated SEO-optimized listing! Review below.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Success Screen (with optional first-product share prompt) ──
  if (state?.success && state.productId) {
    const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${shopSlug}`;
    const whatsappMessage = encodeURIComponent(
      `🛍️ Check out my shop!\n${catalogUrl}`
    );
    const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
    const isFirstProduct = !!state.isFirstProduct;

    return (
      <div className="w-full max-w-lg mx-auto text-center space-y-6 py-8">
        {/* First-product share prompt — prominent CTA */}
        {isFirstProduct && (
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 text-left">
            <p className="text-sm font-bold text-emerald-800 mb-1">
              📲 Share your catalog now
            </p>
            <p className="text-xs text-stone-600 mb-4">
              Your first product is live. Send your catalog link to customers on WhatsApp so they can browse and order.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-base font-bold
                bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg
                hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share catalog on WhatsApp
            </a>
          </div>
        )}

        {/* Celebration */}
        <div className="space-y-3">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-stone-900">
            Your product is live!
          </h2>
          <p className="text-stone-500">
            <span className="font-semibold text-stone-700">{name || "Product"}</span>{" "}
            has been added to your catalog
          </p>
        </div>

        {/* Catalog URL */}
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            Your catalog link
          </p>
          <p className="text-sm font-mono text-stone-700 break-all select-all">
            {catalogUrl}
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(catalogUrl)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
          >
            Copy link
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isFirstProduct && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-base font-bold
                bg-whatsapp hover:bg-whatsapp-hover text-white shadow-lg shadow-green-200/60
                hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share on WhatsApp
            </a>
          )}

          {/* Inline Image Upload — add photos right here */}
          <div className="rounded-xl border-2 border-stone-200 bg-white p-4 space-y-2 text-left">
            <p className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              📸 Add product photos
              <span className="text-[10px] text-stone-400 font-normal">(optional — you can add later too)</span>
            </p>
            <ImageUpload
              images={[]}
              shopSlug={shopSlug}
              productId={state.productId}
            />
          </div>

          <Link
            href={`/dashboard/${shopSlug}/products/${state.productId}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
              hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            Edit product details →
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl text-sm font-medium text-stone-600
              border-2 border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 transition-all"
          >
            + Add another product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* ── Step 1: Pick a Product Type ──────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-stone-900 mb-1">
          What are you selling?
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          Tap a type to get started — or type a custom name below
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {PRODUCT_TYPES.map(({ label, emoji }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleTypeSelect(label)}
              className={`flex flex-col items-center gap-1 rounded-xl p-3 border-2 transition-all duration-200
                ${
                  selectedType === label
                    ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100 scale-105"
                    : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 hover:scale-[1.02]"
                }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[10px] font-medium text-stone-700 leading-tight text-center">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 2: Product Details ──────────────────────── */}
      {/* ── AI Product Generator (all users — upgrade gate on publish) ───────── */}
      {showAiPanel ? (
        <div className={`rounded-2xl border-2 ${hasAiAccess ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60' : 'border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-purple-50/60'} p-5 shadow-sm space-y-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${hasAiAccess ? 'bg-emerald-100' : 'bg-violet-100'} flex items-center justify-center text-xl`}>
              ✨
            </div>
            <div>
              <h3 className={`text-sm font-bold ${hasAiAccess ? 'text-emerald-900' : 'text-violet-900'}`}>AI Product Generator</h3>
              <p className={`text-xs ${hasAiAccess ? 'text-emerald-600' : 'text-violet-600'}`}>Upload an image — AI writes SEO-optimized listing</p>
            </div>
            {hasAiAccess ? (
              <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                ∞ Unlimited
              </span>
            ) : (
              <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500 text-white">
                {aiCreditsRemaining !== null
                  ? `${aiCreditsRemaining}/5 left`
                  : "5 Free tries"}
              </span>
            )}
          </div>

          {/* AI Image Dropzone */}
          <div className="relative">
            {aiImageUrl ? (
              <div className={`relative rounded-xl overflow-hidden border ${hasAiAccess ? 'border-emerald-200' : 'border-violet-200'} bg-white`}>
                <img
                  src={aiImageUrl}
                  alt="Product for AI analysis"
                  className="w-full h-48 object-contain bg-stone-50"
                />
                <button
                  type="button"
                  onClick={() => setAiImageUrl(null)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs hover:bg-black/70 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center justify-center gap-2 h-36 rounded-xl border-2 border-dashed ${hasAiAccess ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50' : 'border-violet-300 bg-violet-50/50 hover:bg-violet-50'} cursor-pointer transition-colors`}>
                <span className="text-3xl">\uD83D\uDCF7</span>
                <span className={`text-sm font-medium ${hasAiAccess ? 'text-emerald-700' : 'text-violet-700'}`}>Drop a product image here</span>
                <span className={`text-xs ${hasAiAccess ? 'text-emerald-500' : 'text-violet-500'}`}>or tap to browse</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // Create a local object URL for preview + upload
                    const objectUrl = URL.createObjectURL(file);
                    setAiImageUrl(objectUrl);
                    // Upload to get a real URL for the AI
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setAiImageUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading || !aiImageUrl}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300
              ${aiLoading
                ? `${hasAiAccess ? 'bg-emerald-100 text-emerald-500' : 'bg-violet-100 text-violet-500'} cursor-wait`
                : aiImageUrl
                  ? `bg-gradient-to-r ${hasAiAccess ? 'from-emerald-500 to-teal-500' : 'from-violet-500 to-purple-500'} text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
          >
            {aiLoading ? (
              <>
                <span className={`w-4 h-4 border-2 ${hasAiAccess ? 'border-emerald-500' : 'border-violet-500'} border-t-transparent rounded-full animate-spin`} />
                Analyzing &amp; SEO optimizing...
              </>
            ) : (
              <>
                ✨ Generate SEO-Optimized Listing
              </>
            )}
          </button>

          {/* CREDITS_EXHAUSTED — all 5 free tries used — CELEBRATORY, not blocking */}
          {aiError === "CREDITS_EXHAUSTED" && (
            <div className="rounded-xl bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 border-2 border-violet-200 p-5 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h4 className="text-lg font-bold text-violet-900">You&apos;ve created 5 AI-powered listings!</h4>
                <p className="text-sm text-violet-600 mt-2 max-w-sm mx-auto">
                  That&apos;s amazing progress! You saw how fast AI creates listings.
                  Upgrade to Pro AI to keep creating listings instantly.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-violet-700">5/5 used</span>
              </div>
              <Link
                href={`/dashboard/${shopSlug}/billing`}
                className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                🚀 Upgrade to Pro AI — Unlimited AI Listings
              </Link>
              <p className="text-[11px] text-center text-violet-500">
                You can still create listings manually below ↓
              </p>
            </div>
          )}

          {/* PLAN_REQUIRED — legacy fallback */}
          {aiError === "PLAN_REQUIRED" && (
            <div className="rounded-xl bg-violet-50 border border-violet-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-violet-900">AI generation requires Pro AI plan</p>
                  <p className="text-xs text-violet-600 mt-1">Upgrade to Pro AI to unlock AI-powered listing generation. Upload a photo, get an SEO-optimized listing in 10 seconds.</p>
                </div>
              </div>
              <Link
                href={`/dashboard/${shopSlug}/billing`}
                className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                ✨ Upgrade to Pro AI — R299/mo
              </Link>
            </div>
          )}

          {/* Other AI errors */}
          {aiError && aiError !== "PLAN_REQUIRED" && aiError !== "CREDITS_EXHAUSTED" && (
            <p className="text-xs text-red-600 text-center">{aiError}</p>
          )}

          {/* SEO Preview — shows after AI generation */}
          {aiSeoPreview && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">🔍 Google Preview</span>
                <span className="flex-1 h-px bg-emerald-200" />
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-1.5 shadow-sm">
                <p className="text-base font-medium text-blue-700 leading-snug truncate">
                  {aiSeoPreview.seoTitle}
                </p>
                <p className="text-xs text-emerald-700 truncate">
                  tradefeed.co.za &rsaquo; catalog &rsaquo; {shopSlug} &rsaquo; products
                </p>
                <p className="text-sm text-stone-600 leading-relaxed line-clamp-2">
                  {aiSeoPreview.seoDescription}
                </p>
              </div>
              {aiSeoPreview.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mr-1">SEO Tags:</span>
                  {aiSeoPreview.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Upgrade nudge after seeing AI results (non-AI plan) */}
              {aiUsedWithoutPlan && (
                <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 p-4 mt-3">
                  <p className="text-sm font-semibold text-violet-900">
                    {aiCreditsRemaining !== null && aiCreditsRemaining > 0
                      ? `🌟 ${aiCreditsRemaining} free AI generation${aiCreditsRemaining === 1 ? "" : "s"} remaining`
                      : "🌟 Impressed? Imagine unlimited AI listings."}
                  </p>
                  <p className="text-xs text-violet-600 mt-1">Upgrade to Pro AI for unlimited AI generations + premium features. List 10× faster.</p>
                  <Link
                    href={`/dashboard/${shopSlug}/billing`}
                    className="mt-3 block w-full text-center py-2 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 transition-colors"
                  >
                    Upgrade to Pro AI →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Collapsed AI nudge — tap to expand */
        <button
          type="button"
          onClick={() => setShowAiPanel(true)}
          className="w-full rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50/80 to-purple-50/80 p-4 shadow-sm hover:shadow-md hover:border-violet-300 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl">
              ✨
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-violet-800">AI Product Generator</h3>
              <p className="text-xs text-violet-500">Upload a photo — AI writes your listing. Tap to try!</p>
            </div>
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </button>
      )}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <form action={formAction} className="space-y-5">
          {/* General error */}
          {state?.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {state.error}
            </div>
          )}

          {/* Warning (e.g. saved as draft because price missing) */}
          {state?.warning && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <span>💡</span> {state.warning}
            </div>
          )}

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Your Product Name"
              required
              minLength={2}
              maxLength={200}
              disabled={isPending}
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-base"
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.name[0]}
              </p>
            )}
            <SellerTip>Clear, specific titles help buyers find your product in search.</SellerTip>
          </div>

          {/* Description */}
          {showAdvanced && (
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description{" "}
              <span className="text-stone-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Material, fit, style notes..."
              maxLength={2000}
              rows={3}
              disabled={isPending}
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400"
            />
            {state?.fieldErrors?.description && (
              <p className="text-sm text-red-600">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>
          )}

          {/* Category */}
          {showAdvanced && categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-sm font-medium">
                Category{" "}
                <span className="text-stone-400 font-normal">(optional)</span>
              </Label>
              <select
                id="categoryId"
                name="categoryId"
                disabled={isPending}
                className="flex h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 focus:border-emerald-400 focus:outline-none disabled:opacity-50"
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

          {/* Marketplace Category (M8.1 — Global Category Picker) */}
          {showAdvanced && globalCategories.length > 0 && (
            <GlobalCategoryPicker
              categories={globalCategories}
              productName={name}
              suggestedSlug={suggestedSlug}
              disabled={isPending}
              onCategoryChange={setSelectedGlobalCategorySlug}
            />
          )}

          {/* Variant Labels (auto-set from category, editable) */}
          {showAdvanced && (
          <div className="space-y-2">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-2">
                <span className="transition-transform group-open:rotate-90">▶</span>
                Size & Color Options: {option1Label} / {option2Label}
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="option1Label" className="text-xs text-stone-500">
                    Option 1 Label
                  </Label>
                  <Input
                    id="option1Label"
                    name="option1Label"
                    value={option1Label}
                    onChange={(e) => setOption1Label(e.target.value)}
                    placeholder="Size"
                    disabled={isPending}
                    className="h-9 text-sm rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="option2Label" className="text-xs text-stone-500">
                    Option 2 Label
                  </Label>
                  <Input
                    id="option2Label"
                    name="option2Label"
                    value={option2Label}
                    onChange={(e) => setOption2Label(e.target.value)}
                    placeholder="Color"
                    disabled={isPending}
                    className="h-9 text-sm rounded-lg"
                  />
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-1.5">
                These labels define what your product options mean (e.g. Size/Color for clothing, Storage/Color for phones)
              </p>
            </details>
          </div>
          )}

          {/* ── Simple/Advanced Toggle ─────────────────────── */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-stone-500 hover:text-emerald-600 rounded-xl border border-dashed border-stone-200 hover:border-emerald-300 bg-stone-50/50 hover:bg-emerald-50/30 transition-all"
          >
            {showAdvanced ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                </svg>
                Simple mode
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75M10.5 18a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m3-6h9.75M10.5 12a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12H7.5" />
                </svg>
                More options (description, category, sizes)
              </>
            )}
          </button>

          {/* ── Price & Stock (inline — creates default variant) ── */}
          <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-stone-800">💰 Price & Stock</span>
              <span className="text-[10px] text-stone-400">(set now — save time)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="priceInRands" className="text-xs text-stone-600">
                  Price (Rands)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">R</span>
                  <Input
                    id="priceInRands"
                    name="priceInRands"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isPending}
                    className="pl-7 rounded-lg border-2 border-stone-200 focus:border-emerald-400 h-11 text-base"
                  />
                </div>
                {state?.fieldErrors?.priceInRands && (
                  <p className="text-xs text-red-600">{state.fieldErrors.priceInRands[0]}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock" className="text-xs text-stone-600">
                  Stock Quantity
                </Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="e.g. 50"
                  disabled={isPending}
                  className="rounded-lg border-2 border-stone-200 focus:border-emerald-400 h-11 text-base"
                />
                {state?.fieldErrors?.stock && (
                  <p className="text-xs text-red-600">{state.fieldErrors.stock[0]}</p>
                )}
              </div>
            </div>
            <SellerTip variant="warning" icon="⚠️">
              If stock is 0, your product appears as &quot;sold out&quot;. Set to at least 1.
            </SellerTip>
            <p className="text-[10px] text-stone-400">
              We&apos;ll create a default option with this price. You can add sizes &amp; colors later.
            </p>
          </div>

          {/* ── Min. Wholesale Qty ─────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="minWholesaleQty" className="text-sm font-medium text-stone-800">
              📦 Min. Wholesale Order
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
                className="rounded-lg border-2 border-stone-200 focus:border-emerald-400 h-11 text-base w-28"
              />
              <span className="text-sm text-stone-500">units per order</span>
            </div>
            <p className="text-[10px] text-stone-400">
              Buyers must order at least this many units. Set to 1 for no minimum.
            </p>
            {state?.fieldErrors?.minWholesaleQty && (
              <p className="text-xs text-red-600">{state.fieldErrors.minWholesaleQty[0]}</p>
            )}
          </div>

          {/* ── Wholesale Only Toggle ───────────────────────── */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                id="wholesaleOnly"
                name="wholesaleOnly"
                defaultChecked={false}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-10 h-6 rounded-full bg-stone-200 peer-checked:bg-amber-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow peer-checked:translate-x-4 transition-transform" />
            </div>
            <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">
              🏭 Wholesale Only
            </span>
          </label>
          <p className="text-[10px] text-stone-400 -mt-1">
            When enabled, this product is only visible to verified wholesale buyers.
          </p>

          {/* Active Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={true}
                disabled={isPending}
                className="sr-only peer"
              />
              <div className="w-10 h-6 rounded-full bg-stone-200 peer-checked:bg-emerald-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-stone-700 group-hover:text-stone-900 transition-colors">
              Show on public catalog
            </span>
          </label>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            disabled={isPending || !name.trim()}
            className={`w-full rounded-xl h-12 text-base font-semibold transition-all duration-300
              ${
                name.trim()
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                  : ""
              }`}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              `Create ${name.trim() || "Product"} →`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
