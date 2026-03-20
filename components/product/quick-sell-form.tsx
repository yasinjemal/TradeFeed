// ============================================================
// Component — Quick Sell Form (Ultra-Fast Mobile Listing)
// ============================================================
// Minimal flow: Take photo → Enter price → Publish.
// Auto-fills: stock = 1, simple name.
// Optimized for mobile sellers who want speed over detail.
// ============================================================

"use client";

import { useState, useRef, useCallback } from "react";
import { createProductAction } from "@/app/actions/product";
import { useUploadThing } from "@/lib/uploadthing";
import { saveProductImagesAction } from "@/app/actions/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerTip } from "@/components/product/seller-tip";
import { toast } from "sonner";
import Link from "next/link";

interface QuickSellFormProps {
  shopSlug: string;
}

/** Compress image client-side before upload */
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
          resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function QuickSellForm({ shopSlug }: QuickSellFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("productImageUploader", {
    onUploadProgress: (p) => setUploadProgress(p),
    onUploadError: (err) => {
      setError(err?.message || "Image upload failed.");
      setIsPublishing(false);
    },
  });

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }, []);

  const handlePublish = async () => {
    if (!imageFile) {
      setError("Take or upload a photo first.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Enter a price greater than zero.");
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      // 1. Create the product
      const productName = name.trim() || "New Product";
      const formData = new FormData();
      formData.set("name", productName);
      formData.set("isActive", "on");
      formData.set("priceInRands", price);
      formData.set("stock", "1"); // Quick sell default
      formData.set("option1Label", "Size");
      formData.set("option2Label", "Color");
      formData.set("minWholesaleQty", "1");

      const result = await createProductAction(shopSlug, null, formData);
      if (!result?.success || !result.productId) {
        setError(result?.error ?? "Failed to create product.");
        setIsPublishing(false);
        return;
      }

      setProductId(result.productId);

      // 2. Compress and upload image
      const compressed = await compressImage(imageFile);
      const uploadResult = await startUpload([compressed]);

      if (uploadResult && uploadResult.length > 0) {
        // 3. Save image to product
        const images = uploadResult.map((r) => ({
          url: r.serverData.url,
          key: r.serverData.key,
          name: r.serverData.name,
        }));
        await saveProductImagesAction(shopSlug, result.productId, images);
      }

      setPublished(true);
      toast.success("⚡ Listed in seconds!");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsPublishing(false);
      setUploadProgress(0);
    }
  };

  // ── Success Screen ──────────────────────────────────
  if (published && productId) {
    const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${shopSlug}`;
    const whatsappMessage = encodeURIComponent(`🛍️ Check out my shop!\n${catalogUrl}`);
    return (
      <div className="w-full max-w-sm mx-auto text-center space-y-5 py-6">
        <div className="text-5xl">⚡</div>
        <h2 className="text-xl font-bold text-stone-900">Listed!</h2>
        <p className="text-sm text-stone-500">
          Your product is live with 1 item in stock.
        </p>

        <SellerTip variant="warning" icon="📦">
          Stock was set to 1 by default. Edit the product to update stock quantity.
        </SellerTip>

        <div className="space-y-3">
          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg transition-all"
          >
            Share on WhatsApp
          </a>
          <Link
            href={`/dashboard/${shopSlug}/products/${productId}`}
            className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white transition-all"
          >
            Edit listing →
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl text-sm font-medium text-stone-600 border border-stone-200 bg-white hover:bg-stone-50 transition-all"
          >
            + Quick sell another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-900">⚡ Quick Sell</h2>
        <p className="text-sm text-stone-500 mt-1">
          Photo → Price → Listed. Done in seconds.
        </p>
      </div>

      {/* ── Photo ──────────────────────────────────────── */}
      <div
        onClick={() => !isPublishing && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 overflow-hidden ${
          imagePreview
            ? "border-emerald-300 bg-emerald-50/30"
            : "border-stone-300 bg-stone-50/50 hover:border-emerald-300 hover:bg-emerald-50/30"
        }`}
      >
        {imagePreview ? (
          <div className="aspect-square relative">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImagePreview(null);
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="aspect-square flex flex-col items-center justify-center gap-3 p-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <span className="text-3xl">📸</span>
            </div>
            <p className="text-sm font-medium text-stone-600">Tap to add a photo</p>
            <p className="text-xs text-stone-400">or drag & drop</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* ── Name (optional) ─────────────────────────────── */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-stone-500">
          Product name <span className="text-stone-400">(optional)</span>
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Auto-named 'New Product' if empty"
          disabled={isPublishing}
          className="rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-11 text-base"
        />
      </div>

      {/* ── Price ──────────────────────────────────────── */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-stone-500">Price *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">R</span>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            disabled={isPublishing}
            className="pl-7 rounded-xl border-2 border-stone-200 focus:border-emerald-400 h-12 text-lg font-semibold"
          />
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Publish ────────────────────────────────────── */}
      <Button
        type="button"
        onClick={handlePublish}
        disabled={isPublishing || !imageFile || !price}
        className={`w-full rounded-xl h-14 text-base font-bold transition-all duration-300 ${
          imageFile && price
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
            : ""
        }`}
      >
        {isPublishing ? (
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Publishing..."}
          </span>
        ) : (
          "⚡ Publish Now"
        )}
      </Button>

      <p className="text-[10px] text-stone-400 text-center">
        Stock is set to 1 by default. You can edit all details after publishing.
      </p>
    </div>
  );
}
