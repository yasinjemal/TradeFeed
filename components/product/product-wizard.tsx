// ============================================================
// Component — Product Listing Wizard v2 (Redesigned)
// ============================================================
// A guided 5-step wizard that helps sellers create high-quality
// product listings with AI assistance.
//
// Steps: 1) Photos → 2) Title & Category → 3) Price & Stock
//        → 4) Description → 5) Preview & Publish
//
// Architecture:
//  - Draft created immediately at Step 1 (no name required first)
//    so images can be uploaded right away via ImageUpload.
//  - AI auto-fill offered after first image upload.
//  - Live product card preview at Step 5.
//  - At Step 5 (Publish), the product is activated via updateProduct.
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlobalCategoryPicker } from "@/components/product/global-category-picker";
import { ImageUpload } from "@/components/product/image-upload";
import { SellerTip } from "@/components/product/seller-tip";
import { ListingQualityScore } from "@/components/product/listing-quality-score";
import type { GlobalCategoryOption } from "@/lib/db/global-categories";
import { suggestGlobalCategory } from "@/lib/config/category-suggest";
import { getVariantLabels } from "@/lib/config/category-variants";
import { toast } from "sonner";
import Link from "next/link";

/* ── Product Type Tiles ─────────────────────────────────── */
const PRODUCT_TYPES = [
  { label: "T-Shirt", emoji: "👕" },
  { label: "Hoodie", emoji: "🧥" },
  { label: "Jeans", emoji: "👖" },
  { label: "Dress", emoji: "👗" },
  { label: "Sneakers", emoji: "👟" },
  { label: "Phone", emoji: "📱" },
  { label: "Earbuds", emoji: "🎧" },
  { label: "Skincare", emoji: "🧴" },
  { label: "Snack Pack", emoji: "🍿" },
  { label: "Home Decor", emoji: "🏠" },
  { label: "Accessory", emoji: "👜" },
  { label: "Other", emoji: "📦" },
] as const;

const STEP_LABELS = ["Photos", "Title", "Price", "Description", "Preview"] as const;

interface ProductWizardProps {
  shopSlug: string;
  categories?: { id: string; name: string }[];
  globalCategories?: GlobalCategoryOption[];
  planSlug?: string;
}

type WizardImage = {
  id: string;
  url: string;
  altText: string | null;
  position: number;
};

type WizardData = {
  productId: string | null;
  name: string;
  description: string;
  categoryId: string;
  globalCategoryId: string;
  option1Label: string;
  option2Label: string;
  priceInRands: string;
  stock: string;
  minWholesaleQty: string;
  aiGenerated: boolean;
};

const DEFAULT_DATA: WizardData = {
  productId: null,
  name: "",
  description: "",
  categoryId: "",
  globalCategoryId: "",
  option1Label: "Size",
  option2Label: "Color",
  priceInRands: "",
  stock: "1",
  minWholesaleQty: "1",
  aiGenerated: false,
};

export function ProductWizard({
  shopSlug,
  categories = [],
  globalCategories = [],
  planSlug = "free",
}: ProductWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(DEFAULT_DATA);
  const [wizardImages, setWizardImages] = useState<WizardImage[]>([]);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [aiFilled, setAiFilled] = useState(false);

  // ── Draft creation (creates inactive product for image attachment) ──
  const createDraftProduct = useCallback(async () => {
    if (data.productId) return data.productId;
    setIsCreatingDraft(true);
    try {
      const formData = new FormData();
      formData.set("name", "New Product");
      formData.set("isActive", "");
      formData.set("option1Label", "Size");
      formData.set("option2Label", "Color");
      formData.set("minWholesaleQty", "1");

      const result = await createProductAction(shopSlug, null, formData);
      if (result?.success && result.productId) {
        setData((d) => ({ ...d, productId: result.productId! }));
        return result.productId;
      }
      if (result?.error) toast.error(result.error);
      return null;
    } catch {
      toast.error("Failed to create draft. Try again.");
      return null;
    } finally {
      setIsCreatingDraft(false);
    }
  }, [data.productId, shopSlug]);

  // ── AI generation handler ────────────────────────────
  const handleAiGenerate = useCallback(async () => {
    if (wizardImages.length === 0) {
      toast.error("Upload at least one photo first");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: wizardImages[0]!.url, shopSlug }),
      });
      const result = await res.json();

      if (!res.ok) {
        if (result.error === "PLAN_REQUIRED") {
          setAiError("Upgrade to use AI. You can still fill details manually.");
          return;
        }
        if (result.error === "CREDITS_EXHAUSTED") {
          setAiError("AI credits used up for today. Fill details manually.");
          setAiCredits(0);
          return;
        }
        throw new Error(result.message || "AI generation failed");
      }

      if (result.credits) {
        setAiCredits(result.credits.unlimited ? null : result.credits.remaining);
      }

      const ai = result.data;
      setData((d) => ({
        ...d,
        name: ai.name || d.name,
        description: ai.description || d.description,
        aiGenerated: true,
      }));

      // Auto-map AI category
      if (ai.category) {
        const slug = suggestGlobalCategory(ai.category);
        if (slug) {
          const labels = getVariantLabels(slug);
          setData((d) => ({
            ...d,
            option1Label: labels.option1Label,
            option2Label: labels.option2Label,
          }));
        }
      }

      setAiFilled(true);
      toast.success("✨ AI filled your listing details!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI generation failed";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  }, [wizardImages, shopSlug]);

  // ── Auto-suggest labels from product type ────────────
  const handleTypeSelect = (label: string) => {
    setSelectedType(label);
    if (!data.name || data.name === "New Product" || PRODUCT_TYPES.some((t) => t.label === data.name)) {
      setData((d) => ({ ...d, name: label }));
    }
    const slug = suggestGlobalCategory(label);
    if (slug) {
      const labels = getVariantLabels(slug);
      setData((d) => ({
        ...d,
        option1Label: labels.option1Label,
        option2Label: labels.option2Label,
      }));
    }
  };

  // ── Step navigation ──────────────────────────────────
  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: return wizardImages.length > 0;
      case 1: return data.name.trim().length >= 2;
      case 2: return data.priceInRands.trim() !== "" && parseFloat(data.priceInRands) > 0;
      case 3: return true; // description is optional
      case 4: return true;
      default: return false;
    }
  }, [step, wizardImages.length, data.name, data.priceInRands]);

  const next = () => { if (canProceed() && step < 4) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); };

  // ── Publish handler ──────────────────────────────────
  const handlePublish = async () => {
    if (!data.productId) {
      setPublishError("No product draft found. Please go back and try again.");
      return;
    }
    setIsPublishing(true);
    setPublishError(null);

    try {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("description", data.description);
      formData.set("categoryId", data.categoryId);
      formData.set("globalCategoryId", data.globalCategoryId);
      formData.set("option1Label", data.option1Label);
      formData.set("option2Label", data.option2Label);
      formData.set("minWholesaleQty", data.minWholesaleQty);
      formData.set("isActive", "on");
      formData.set("priceInRands", data.priceInRands);
      formData.set("stock", data.stock || "1");
      if (data.aiGenerated) formData.set("aiGenerated", "on");

      const result = await updateProductAction(shopSlug, data.productId, null, formData);
      if (result?.success) {
        setPublished(true);
        toast.success("Your listing is live!");
      } else {
        setPublishError(result?.error ?? "Failed to publish. Try again.");
      }
    } catch {
      setPublishError("Something went wrong. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Success Screen ──────────────────────────────────
  if (published && data.productId) {
    const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${shopSlug}`;
    const whatsappMessage = encodeURIComponent(`Check out my shop!\n${catalogUrl}`);
    return (
      <div className="w-full max-w-lg mx-auto text-center space-y-6 py-8">
        <div className="relative">
          <div className="text-6xl animate-bounce">🎉</div>
          <div className="absolute inset-0 bg-emerald-400/10 blur-3xl rounded-full" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your product is live!</h2>
        <p className="text-slate-500">
          <span className="font-semibold text-slate-700">{data.name}</span> is now visible to buyers.
        </p>

        {/* Catalog link */}
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Your catalog link</p>
          <p className="text-sm font-mono text-slate-700 break-all select-all">{catalogUrl}</p>
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(catalogUrl); toast.success("Copied!"); }}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
          >
            Copy link
          </button>
        </div>

        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-base font-bold bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Share on WhatsApp
          </a>

          <Link
            href={`/dashboard/${shopSlug}/products/${data.productId}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            Edit product details →
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl text-sm font-medium text-slate-600 border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            + Add another product
          </button>
        </div>
      </div>
    );
  }

  // ── Quality score props ─────────────────────────────
  const qualityProps = {
    hasImage: wizardImages.length > 0,
    hasPrice: data.priceInRands.trim() !== "" && parseFloat(data.priceInRands) > 0,
    hasStock: data.stock.trim() !== "" && parseInt(data.stock, 10) > 0,
    hasDescription: data.description.trim().length > 0,
    hasCategory: data.categoryId !== "" || data.globalCategoryId !== "",
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* ── Step Indicator ──────────────────────────────── */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-center">
              {i > 0 && (
                <div className={`flex-1 h-0.5 ${i <= step ? "bg-emerald-500" : "bg-slate-200"} transition-colors duration-300`} />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? "bg-emerald-500" : "bg-slate-200"} transition-colors duration-300`} />
              )}
            </div>
            <span className={`text-[10px] font-medium ${i <= step ? "text-emerald-700" : "text-slate-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── STEP 1: Photos ──────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upload product photos</h2>
            <p className="text-sm text-slate-500 mt-1">
              Great photos are the #1 reason buyers click. Add at least one.
            </p>
          </div>

          <SellerTip>Products with photos sell 3× faster than listings without images.</SellerTip>

          {/* Auto-create draft on first visit so images can upload immediately */}
          {!data.productId ? (
            <div className="space-y-4">
              <Button
                type="button"
                onClick={createDraftProduct}
                disabled={isCreatingDraft}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold"
              >
                {isCreatingDraft ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Preparing...
                  </span>
                ) : (
                  "📸 Start adding photos"
                )}
              </Button>
            </div>
          ) : (
            <ImageUpload
              images={wizardImages}
              shopSlug={shopSlug}
              productId={data.productId}
              onImagesChange={setWizardImages}
            />
          )}

          {wizardImages.length === 0 && data.productId && (
            <SellerTip variant="warning" icon="⚠️">
              Add at least 1 photo to continue. Drag &amp; drop or tap the area above.
            </SellerTip>
          )}

          {/* AI auto-fill offer — appears after first image upload */}
          {wizardImages.length > 0 && !aiFilled && (
            <div className="rounded-xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">Let AI fill your listing</p>
                  <p className="text-xs text-indigo-600">
                    We&apos;ll analyze your photo and generate title, description &amp; category.
                  </p>
                </div>
              </div>
              {aiError && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{aiError}</p>
              )}
              <Button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="w-full rounded-xl h-11 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {aiLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing photo...
                  </span>
                ) : (
                  "✨ Auto-fill with AI"
                )}
              </Button>
              {aiCredits !== null && (
                <p className="text-[10px] text-indigo-400 text-center">
                  {aiCredits} AI credit{aiCredits !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
          )}

          {aiFilled && (
            <SellerTip variant="success" icon="✨">
              AI filled your title &amp; description. Review them in the next steps.
            </SellerTip>
          )}
        </div>
      )}

      {/* ── STEP 2: Title & Category ───────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Title &amp; category</h2>
            <p className="text-sm text-slate-500 mt-1">
              Help buyers find your product in search.
            </p>
          </div>

          {/* Product Type Tiles */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Quick pick a type:</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PRODUCT_TYPES.map(({ label, emoji }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleTypeSelect(label)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border-2 transition-all duration-200 ${
                    selectedType === label
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100 scale-105"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] font-medium text-slate-700 leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="wiz-name" className="text-sm font-medium">
              Product Name *
              {aiFilled && <span className="ml-2 text-xs text-indigo-500 font-normal">AI-suggested</span>}
            </Label>
            <Input
              id="wiz-name"
              value={data.name === "New Product" ? "" : data.name}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Premium Cotton T-Shirt"
              required
              minLength={2}
              maxLength={200}
              className="rounded-xl border-2 border-slate-200 focus:border-emerald-400 h-12 text-base"
            />
            <SellerTip>Clear, specific titles help buyers find your product in search.</SellerTip>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="wiz-cat" className="text-sm font-medium">Category</Label>
              <select
                id="wiz-cat"
                value={data.categoryId}
                onChange={(e) => setData((d) => ({ ...d, categoryId: e.target.value }))}
                className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-base text-slate-900 focus:border-emerald-400 focus:outline-none"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Global Category Picker */}
          {globalCategories.length > 0 && (
            <GlobalCategoryPicker
              categories={globalCategories}
              productName={data.name}
              suggestedSlug={suggestGlobalCategory(data.name) ?? undefined}
              disabled={false}
              onCategoryChange={(slug) => {
                if (slug) {
                  const labels = getVariantLabels(slug);
                  setData((d) => ({
                    ...d,
                    option1Label: labels.option1Label,
                    option2Label: labels.option2Label,
                  }));
                }
              }}
            />
          )}
        </div>
      )}

      {/* ── STEP 3: Price & Stock ──────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Price &amp; stock</h2>
            <p className="text-sm text-slate-500 mt-1">
              Set your price and how many you have available.
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="wiz-price" className="text-sm font-medium">Price (Rands) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R</span>
              <Input
                id="wiz-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={data.priceInRands}
                onChange={(e) => setData((d) => ({ ...d, priceInRands: e.target.value }))}
                placeholder="0.00"
                className="pl-7 rounded-xl border-2 border-slate-200 focus:border-emerald-400 h-12 text-base"
              />
            </div>
            <SellerTip>This is the price buyers pay per unit.</SellerTip>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="wiz-stock" className="text-sm font-medium">Stock Quantity</Label>
            <Input
              id="wiz-stock"
              type="number"
              inputMode="numeric"
              min="0"
              value={data.stock}
              onChange={(e) => setData((d) => ({ ...d, stock: e.target.value }))}
              placeholder="e.g. 50"
              className="rounded-xl border-2 border-slate-200 focus:border-emerald-400 h-12 text-base"
            />
            <SellerTip variant="warning" icon="⚠️">
              If stock is 0, your product appears as &quot;sold out&quot;. Set to at least 1.
            </SellerTip>
          </div>

          {/* Min Wholesale Qty */}
          <div className="space-y-2">
            <Label htmlFor="wiz-moq" className="text-sm font-medium">Min. Order Quantity</Label>
            <div className="flex items-center gap-2">
              <Input
                id="wiz-moq"
                type="number"
                inputMode="numeric"
                min={1}
                max={99999}
                value={data.minWholesaleQty}
                onChange={(e) => setData((d) => ({ ...d, minWholesaleQty: e.target.value }))}
                className="rounded-xl border-2 border-slate-200 focus:border-emerald-400 h-11 text-base w-28"
              />
              <span className="text-sm text-slate-500">units per order</span>
            </div>
            <p className="text-[10px] text-slate-400">Set to 1 for no minimum.</p>
          </div>
        </div>
      )}

      {/* ── STEP 4: Description ────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Description</h2>
            <p className="text-sm text-slate-500 mt-1">
              Tell buyers about your product — materials, fit, what makes it special.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wiz-desc" className="text-sm font-medium">
              Product Description
              {aiFilled && data.description && (
                <span className="ml-2 text-xs text-indigo-500 font-normal">AI-generated — feel free to edit</span>
              )}
            </Label>
            <Textarea
              id="wiz-desc"
              value={data.description}
              onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
              placeholder="Material, fit, style notes, care instructions..."
              maxLength={2000}
              rows={5}
              className="rounded-xl border-2 border-slate-200 focus:border-emerald-400 text-base"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{data.description.length}/2000</span>
              {data.description.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium">+15% listing quality</span>
              )}
            </div>
          </div>

          {/* AI generate button if no description yet */}
          {!data.description && wizardImages.length > 0 && !aiLoading && (
            <Button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              variant="outline"
              className="w-full rounded-xl h-11 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium"
            >
              ✨ Generate description with AI
            </Button>
          )}

          <SellerTip>Detailed descriptions reduce buyer questions and boost confidence to buy.</SellerTip>
        </div>
      )}

      {/* ── STEP 5: Preview & Publish ──────────────────── */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Preview &amp; publish</h2>
            <p className="text-sm text-slate-500 mt-1">
              Check everything looks good, then go live.
            </p>
          </div>

          {/* Quality Score */}
          <ListingQualityScore {...qualityProps} />

          {/* Live Product Card Preview */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Image */}
            {wizardImages.length > 0 ? (
              <div className="aspect-square bg-slate-100 overflow-hidden relative">
                <img
                  src={wizardImages[0]!.url}
                  alt={data.name}
                  className="w-full h-full object-cover"
                />
                {wizardImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {wizardImages.slice(1, 4).map((img) => (
                      <div key={img.id} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {wizardImages.length > 4 && (
                      <div className="w-10 h-10 rounded-lg bg-black/50 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs font-bold">
                        +{wizardImages.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-square bg-slate-50 flex items-center justify-center">
                <span className="text-5xl opacity-30">📷</span>
              </div>
            )}

            {/* Info */}
            <div className="p-4 space-y-3">
              <h3 className="text-lg font-bold text-slate-900">{data.name || "Untitled Product"}</h3>
              {data.description && (
                <p className="text-sm text-slate-500 line-clamp-3">{data.description}</p>
              )}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                <span className="text-xl font-bold text-emerald-600">
                  {data.priceInRands ? `R${parseFloat(data.priceInRands).toFixed(2)}` : "No price"}
                </span>
                <span className="text-sm text-slate-500">
                  {data.stock || "0"} in stock
                </span>
                <span className="text-xs text-slate-400">
                  {wizardImages.length} photo{wizardImages.length !== 1 ? "s" : ""}
                </span>
              </div>
              {data.aiGenerated && (
                <div className="flex items-center gap-1 text-xs text-indigo-500">
                  <span>✨</span> AI-assisted listing
                </div>
              )}
            </div>
          </div>

          {/* Quick edit buttons */}
          <div className="grid grid-cols-4 gap-2">
            {(["Photos", "Title", "Price", "Description"] as const).map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i)}
                className="py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                ✏️ {label}
              </button>
            ))}
          </div>

          {/* Publish Error */}
          {publishError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠️</span> {publishError}
            </div>
          )}
        </div>
      )}

      {/* ── Navigation Bar ──────────────────────────────── */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={back}
            className="rounded-xl px-6"
          >
            ← Back
          </Button>
        )}
        <div className="flex-1" />

        {step < 4 ? (
          <Button
            type="button"
            onClick={next}
            disabled={!canProceed()}
            className={`rounded-xl px-8 h-12 text-base font-semibold transition-all duration-300 ${
              canProceed()
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                : ""
            }`}
          >
            Next →
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="rounded-xl px-8 h-12 text-base font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            {isPublishing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </span>
            ) : (
              "🚀 Publish Listing"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
