// ============================================================
// Component — Product Listing Wizard (Guided Multi-Step)
// ============================================================
// A beginner-friendly wizard that guides sellers through
// creating a high-quality listing step by step.
//
// Steps: 1) Photos → 2) Details → 3) Price & Stock → 4) Review
//
// Architecture:
//  - Product is created as a draft (isActive: false) at Step 1
//    so images can be uploaded immediately via existing ImageUpload.
//  - At Step 4 (Publish), the product is activated via updateProduct.
//  - This avoids orphaned uploads and reuses existing server actions.
// ============================================================

"use client";

import { useState, useActionState, useMemo, useCallback } from "react";
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

const STEP_LABELS = ["Photos", "Details", "Price & Stock", "Review"] as const;

interface ProductWizardProps {
  shopSlug: string;
  categories?: { id: string; name: string }[];
  globalCategories?: GlobalCategoryOption[];
}

type WizardData = {
  // Step 1 result
  productId: string | null;
  uploadedImageCount: number;
  // Step 2
  name: string;
  description: string;
  categoryId: string;
  globalCategoryId: string;
  option1Label: string;
  option2Label: string;
  // Step 3
  priceInRands: string;
  stock: string;
  minWholesaleQty: string;
};

const DEFAULT_DATA: WizardData = {
  productId: null,
  uploadedImageCount: 0,
  name: "",
  description: "",
  categoryId: "",
  globalCategoryId: "",
  option1Label: "Size",
  option2Label: "Color",
  priceInRands: "",
  stock: "1",
  minWholesaleQty: "1",
};

export function ProductWizard({
  shopSlug,
  categories = [],
  globalCategories = [],
}: ProductWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(DEFAULT_DATA);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // ── Draft creation for image uploads (Step 1) ────────
  const boundCreateAction = createProductAction.bind(null, shopSlug);
  const [createState, createAction, isCreating] = useActionState(boundCreateAction, null);

  // Track image count manually (ImageUpload uses server revalidation)
  const [wizardImages, setWizardImages] = useState<{ id: string; url: string; altText: string | null; position: number }[]>([]);

  // ── Step navigation ──────────────────────────────────
  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 0: // Photos — require at least 1 image
        return wizardImages.length > 0;
      case 1: // Details — require name
        return data.name.trim().length >= 2;
      case 2: // Price & Stock — require price
        return data.priceInRands.trim() !== "" && parseFloat(data.priceInRands) > 0;
      case 3: // Review — always can publish
        return true;
      default:
        return false;
    }
  }, [step, wizardImages.length, data.name, data.priceInRands]);

  const next = () => {
    if (canProceed() && step < 3) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  // Create draft product for image attachment
  const createDraftProduct = async () => {
    if (data.productId) return data.productId; // already created

    const formData = new FormData();
    formData.set("name", data.name || "New Product");
    formData.set("isActive", ""); // NOT "on", so it's a draft
    formData.set("option1Label", data.option1Label);
    formData.set("option2Label", data.option2Label);
    formData.set("minWholesaleQty", "1");

    // Call create action directly (bypass useActionState for programmatic use)
    const result = await createProductAction(shopSlug, null, formData);
    if (result?.success && result.productId) {
      setData((d) => ({ ...d, productId: result.productId! }));
      return result.productId;
    }
    if (result?.error) {
      toast.error(result.error);
    }
    return null;
  };

  // Auto-suggest labels from category
  const handleTypeSelect = (label: string) => {
    setSelectedType(label);
    if (!data.name || PRODUCT_TYPES.some((t) => t.label === data.name)) {
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

  // ── Publish handler (Step 4) ─────────────────────────
  const handlePublish = async () => {
    if (!data.productId) {
      setPublishError("No product draft found. Please go back and try again.");
      return;
    }
    setIsPublishing(true);
    setPublishError(null);

    try {
      // Build update formData
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("description", data.description);
      formData.set("categoryId", data.categoryId);
      formData.set("globalCategoryId", data.globalCategoryId);
      formData.set("option1Label", data.option1Label);
      formData.set("option2Label", data.option2Label);
      formData.set("minWholesaleQty", data.minWholesaleQty);
      formData.set("isActive", "on"); // Publish!
      formData.set("priceInRands", data.priceInRands);
      formData.set("stock", data.stock || "1");

      const result = await updateProductAction(
        shopSlug,
        data.productId,
        null,
        formData
      );

      if (result?.success) {
        setPublished(true);
        toast.success("🎉 Your listing is live!");
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
    const whatsappMessage = encodeURIComponent(`🛍️ Check out my shop!\n${catalogUrl}`);
    return (
      <div className="w-full max-w-lg mx-auto text-center space-y-6 py-8">
        <div className="text-6xl animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold text-stone-900">Your product is live!</h2>
        <p className="text-stone-500">
          <span className="font-semibold text-stone-700">{data.name}</span> is now visible to buyers.
        </p>

        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Your catalog link</p>
          <p className="text-sm font-mono text-stone-700 break-all select-all">{catalogUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(catalogUrl)}
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
            className="w-full py-3 rounded-xl text-sm font-medium text-stone-600 border-2 border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 transition-all"
          >
            + Add another product
          </button>
        </div>
      </div>
    );
  }

  // ── Quality score for review step ───────────────────
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
                <div className={`flex-1 h-0.5 ${i <= step ? "bg-emerald-500" : "bg-stone-200"} transition-colors duration-300`} />
              )}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0 ${
                  i < step
                    ? "bg-emerald-500 text-white"
                    : i === step
                      ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                      : "bg-stone-200 text-stone-500"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? "bg-emerald-500" : "bg-stone-200"} transition-colors duration-300`} />
              )}
            </div>
            <span className={`text-[10px] font-medium ${i <= step ? "text-emerald-700" : "text-stone-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Step Content ────────────────────────────────── */}

      {/* ── STEP 1: Photos ──────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Upload product photos</h2>
            <p className="text-sm text-stone-500 mt-1">
              Great photos are the #1 reason buyers click. Add at least one.
            </p>
          </div>

          <SellerTip>Products with photos sell 3x faster than listings without images.</SellerTip>

          {/* Draft creation — need a product ID for image upload */}
          {!data.productId ? (
            <div className="space-y-4">
              <p className="text-sm text-stone-600">
                First, give your product a quick name so we can save your photos:
              </p>
              <Input
                value={data.name}
                onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. T-Shirt, Sneakers, Phone Case"
                className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-base"
              />
              <Button
                type="button"
                onClick={async () => {
                  const id = await createDraftProduct();
                  if (id) toast.success("Draft saved — now add photos!");
                }}
                disabled={!data.name.trim() || isCreating}
                className="w-full rounded-xl h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Continue to photos →"
                )}
              </Button>
              {createState?.error && (
                <p className="text-sm text-red-600">{createState.error}</p>
              )}
            </div>
          ) : (
            <ImageUpload
              images={wizardImages}
              shopSlug={shopSlug}
              productId={data.productId}
            />
          )}

          {wizardImages.length === 0 && data.productId && (
            <SellerTip variant="warning" icon="⚠️">
              Add at least 1 photo to continue. Drag &amp; drop or click the area above.
            </SellerTip>
          )}
        </div>
      )}

      {/* ── STEP 2: Details ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Product details</h2>
            <p className="text-sm text-stone-500 mt-1">
              Help buyers find and understand your product.
            </p>
          </div>

          {/* Product Type Tiles */}
          <div>
            <p className="text-sm font-medium text-stone-700 mb-2">Quick pick a type:</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {PRODUCT_TYPES.map(({ label, emoji }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleTypeSelect(label)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 border-2 transition-all duration-200 ${
                    selectedType === label
                      ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100 scale-105"
                      : "border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] font-medium text-stone-700 leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="wiz-name" className="text-sm font-medium">Product Name *</Label>
            <Input
              id="wiz-name"
              value={data.name}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
              placeholder="e.g. Premium Cotton T-Shirt"
              required
              minLength={2}
              maxLength={200}
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-base"
            />
            <SellerTip>Clear, specific titles help buyers find your product in search.</SellerTip>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="wiz-desc" className="text-sm font-medium">
              Description <span className="text-stone-400 font-normal">(recommended)</span>
            </Label>
            <Textarea
              id="wiz-desc"
              value={data.description}
              onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
              placeholder="Material, fit, style notes..."
              maxLength={2000}
              rows={3}
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400"
            />
            <SellerTip>Detailed descriptions reduce buyer questions and boost confidence.</SellerTip>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="wiz-cat" className="text-sm font-medium">Category</Label>
              <select
                id="wiz-cat"
                value={data.categoryId}
                onChange={(e) => setData((d) => ({ ...d, categoryId: e.target.value }))}
                className="flex h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 focus:border-emerald-400 focus:outline-none"
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
            <h2 className="text-xl font-bold text-stone-900">Price & stock</h2>
            <p className="text-sm text-stone-500 mt-1">
              Set your price and how many you have available.
            </p>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="wiz-price" className="text-sm font-medium">Price (Rands) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">R</span>
              <Input
                id="wiz-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={data.priceInRands}
                onChange={(e) => setData((d) => ({ ...d, priceInRands: e.target.value }))}
                placeholder="0.00"
                className="pl-7 rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-base"
              />
            </div>
            <SellerTip>This is the wholesale price buyers pay per unit.</SellerTip>
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <Label htmlFor="wiz-stock" className="text-sm font-medium">Stock Quantity *</Label>
            <Input
              id="wiz-stock"
              type="number"
              inputMode="numeric"
              min="0"
              value={data.stock}
              onChange={(e) => setData((d) => ({ ...d, stock: e.target.value }))}
              placeholder="e.g. 50"
              className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-base"
            />
            <SellerTip variant="warning" icon="⚠️">
              If stock is 0, your product appears as &quot;sold out&quot; and buyers cannot order. Set to at least 1.
            </SellerTip>
          </div>

          {/* Min Wholesale Qty */}
          <div className="space-y-2">
            <Label htmlFor="wiz-moq" className="text-sm font-medium">
              Min. Wholesale Order
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="wiz-moq"
                type="number"
                inputMode="numeric"
                min={1}
                max={99999}
                value={data.minWholesaleQty}
                onChange={(e) => setData((d) => ({ ...d, minWholesaleQty: e.target.value }))}
                className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-11 text-base w-28"
              />
              <span className="text-sm text-stone-500">units per order</span>
            </div>
            <p className="text-[10px] text-stone-400">Set to 1 for no minimum.</p>
          </div>
        </div>
      )}

      {/* ── STEP 4: Review & Publish ───────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Review your listing</h2>
            <p className="text-sm text-stone-500 mt-1">
              Check everything looks good, then publish.
            </p>
          </div>

          {/* Quality Score */}
          <ListingQualityScore {...qualityProps} />

          {/* Preview Card */}
          <div className="rounded-2xl border-2 border-stone-200 bg-white overflow-hidden">
            {/* Preview Image */}
            {wizardImages.length > 0 ? (
              <div className="aspect-video bg-stone-100 overflow-hidden relative">
                <img
                  src={wizardImages[0]!.url}
                  alt={data.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-stone-50 flex items-center justify-center">
                <span className="text-4xl opacity-40">📷</span>
              </div>
            )}

            {/* Preview Info */}
            <div className="p-4 space-y-3">
              <h3 className="text-lg font-bold text-stone-900">{data.name || "Untitled Product"}</h3>
              {data.description && (
                <p className="text-sm text-stone-500 line-clamp-2">{data.description}</p>
              )}
              <div className="flex items-center gap-4 pt-2 border-t border-stone-100">
                <span className="text-lg font-bold text-emerald-600">
                  {data.priceInRands ? `R${parseFloat(data.priceInRands).toFixed(2)}` : "No price"}
                </span>
                <span className="text-sm text-stone-500">
                  {data.stock || "0"} in stock
                </span>
                <span className="text-xs text-stone-400">
                  {wizardImages.length} photo{wizardImages.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Edit buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="py-2 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              ✏️ Photos
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              ✏️ Details
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-2 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              ✏️ Price
            </button>
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
      <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
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

        {step < 3 ? (
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
