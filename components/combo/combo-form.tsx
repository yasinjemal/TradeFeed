// ============================================================
// Component — Combo Form (Create / Edit)
// ============================================================
// Form to create or edit a combo deal with product picker.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createComboAction, updateComboAction, addComboImageAction, deleteComboImageAction } from "@/app/actions/combo";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { formatZAR } from "@/types";

interface Product {
  id: string;
  name: string;
  variants: { id: string; size: string; color: string | null; priceInCents: number; stock: number }[];
  images: { url: string }[];
}

interface ComboItem {
  productId?: string;
  variantId?: string;
  productName: string;
  variantLabel?: string;
  quantity: number;
}

interface ComboImage {
  id: string;
  url: string;
  key?: string | null;
  position: number;
}

interface ComboFormProps {
  shopSlug: string;
  categories: { id: string; name: string }[];
  products: Product[];
  // Edit mode
  combo?: {
    id: string;
    name: string;
    description: string | null;
    priceCents: number;
    retailPriceCents: number | null;
    stock: number;
    isActive: boolean;
    comboCategoryId: string | null;
    comboCategory: { id: string; name: string } | null;
    items: { id: string; productId: string | null; variantId: string | null; productName: string; variantLabel: string | null; quantity: number }[];
    images: ComboImage[];
  };
}

export function ComboForm({ shopSlug, categories, products, combo }: ComboFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!combo;

  // Form fields
  const [name, setName] = useState(combo?.name ?? "");
  const [description, setDescription] = useState(combo?.description ?? "");
  const [price, setPrice] = useState(combo ? (combo.priceCents / 100).toString() : "");
  const [retailPrice, setRetailPrice] = useState(combo?.retailPriceCents ? (combo.retailPriceCents / 100).toString() : "");
  const [stock, setStock] = useState(combo?.stock?.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(combo?.comboCategoryId ?? "");
  const [isActive, setIsActive] = useState(combo?.isActive ?? true);

  // Combo items
  const [items, setItems] = useState<ComboItem[]>(
    combo?.items.map((i) => ({
      productId: i.productId ?? undefined,
      variantId: i.variantId ?? undefined,
      productName: i.productName,
      variantLabel: i.variantLabel ?? undefined,
      quantity: i.quantity,
    })) ?? [
      { productName: "", quantity: 1 },
      { productName: "", quantity: 1 },
    ]
  );

  // Images
  const [images, setImages] = useState<ComboImage[]>(combo?.images ?? []);
  const [uploading, setUploading] = useState(false);

  // Product picker
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");

  const { startUpload } = useUploadThing("productImageUploader");

  // ── Error state ──────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ── Add / Remove items ───────────────────────────────────
  function addItem() {
    setItems([...items, { productName: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    if (items.length <= 2) {
      toast.error("A combo must have at least 2 items");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, updates: Partial<ComboItem>) {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  // ── Pick a product from the catalog ──────────────────────
  function pickProduct(index: number, product: Product, variant?: Product["variants"][0]) {
    const label = variant
      ? `${variant.size}${variant.color ? ` / ${variant.color}` : ""}`
      : undefined;
    updateItem(index, {
      productId: product.id,
      variantId: variant?.id,
      productName: product.name,
      variantLabel: label,
    });
    setShowPicker(null);
    setPickerSearch("");
  }

  // ── Image upload ─────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await startUpload(Array.from(files));
      if (!uploaded) {
        toast.error("Upload failed");
        return;
      }

      if (isEdit && combo) {
        // Save images to DB immediately in edit mode
        for (const file of uploaded) {
          await addComboImageAction(shopSlug, combo.id, file.ufsUrl, file.key);
        }
        setImages((prev) => [
          ...prev,
          ...uploaded.map((f, i) => ({
            id: `new-${Date.now()}-${i}`,
            url: f.ufsUrl,
            key: f.key,
            position: prev.length + i,
          })),
        ]);
      } else {
        // For new combos, just collect URLs (will be saved after create)
        setImages((prev) => [
          ...prev,
          ...uploaded.map((f, i) => ({
            id: `new-${Date.now()}-${i}`,
            url: f.ufsUrl,
            key: f.key,
            position: prev.length + i,
          })),
        ]);
      }
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage(img: ComboImage) {
    if (isEdit && combo) {
      const result = await deleteComboImageAction(shopSlug, combo.id, img.id);
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete image");
        return;
      }
    }
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    toast.success("Image removed");
  }

  // ── Submit ───────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);

    const data = {
      name,
      description,
      priceInRands: price,
      retailPriceInRands: retailPrice,
      stock,
      comboCategoryId: categoryId,
      isActive,
      items: items.map((i) => ({
        productId: i.productId ?? "",
        variantId: i.variantId ?? "",
        productName: i.productName,
        variantLabel: i.variantLabel ?? "",
        quantity: i.quantity,
      })),
    };

    startTransition(async () => {
      const result = isEdit && combo
        ? await updateComboAction(shopSlug, combo.id, data)
        : await createComboAction(shopSlug, data);

      if (!result.success) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.error) setGlobalError(result.error);
        toast.error(result.error ?? "Please fix the errors below");
        return;
      }

      // If creating, save images to the new combo
      if (!isEdit && result.data && typeof result.data === "object" && "id" in result.data) {
        const comboId = (result.data as { id: string }).id;
        for (const img of images) {
          await addComboImageAction(shopSlug, comboId, img.url, img.key ?? undefined);
        }
      }

      toast.success(isEdit ? "Combo updated!" : "Combo created!");
      router.push(`/dashboard/${shopSlug}/combos`);
      router.refresh();
    });
  }

  // ── Compute savings ──────────────────────────────────────
  const individualTotal = items.reduce((sum, item) => {
    if (!item.variantId) return sum;
    for (const p of products) {
      const v = p.variants.find((v) => v.id === item.variantId);
      if (v) return sum + v.priceInCents * item.quantity;
    }
    return sum;
  }, 0);
  const comboPriceCents = Math.round(parseFloat(price || "0") * 100);
  const savings = individualTotal > 0 && comboPriceCents > 0 ? individualTotal - comboPriceCents : 0;

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      p.variants.some(
        (v) =>
          v.size.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          v.color?.toLowerCase().includes(pickerSearch.toLowerCase())
      )
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {globalError}
        </div>
      )}

      {/* ── Basic Info ──────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/60 space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Combo Details</h2>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Combo Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jeans + Shirt Combo"
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What's included in this combo deal?"
            className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Combo Price (ZAR) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="499.00"
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {errors.priceInRands && <p className="mt-1 text-xs text-red-600">{errors.priceInRands[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Retail Price (optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={retailPrice}
              onChange={(e) => setRetailPrice(e.target.value)}
              placeholder="599.00"
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Combo Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {savings > 0 && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm">
            <span className="font-semibold text-emerald-700">💰 Buyer saves {formatZAR(savings)}</span>
            <span className="text-emerald-600"> vs buying individually ({formatZAR(individualTotal)})</span>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-stone-700">Active (visible in catalog)</span>
        </label>
      </div>

      {/* ── Combo Items ────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/60 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">📦 Items in Combo</h2>
          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            + Add Item
          </button>
        </div>
        {errors.items && <p className="text-xs text-red-600">{errors.items[0]}</p>}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-400 uppercase">Item {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => updateItem(index, { productName: e.target.value })}
                    placeholder="Product name"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPicker(showPicker === index ? null : index);
                    setPickerSearch("");
                  }}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                >
                  {item.productId ? "Change" : "Pick Product"}
                </button>
              </div>

              {item.variantLabel && (
                <p className="text-xs text-stone-500">
                  Variant: <span className="font-medium">{item.variantLabel}</span>
                </p>
              )}

              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500">Qty:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                  className="w-16 rounded-lg border border-stone-300 px-2 py-1 text-sm text-center"
                />
              </div>

              {/* Product picker dropdown */}
              {showPicker === index && (
                <div className="rounded-xl border border-stone-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white border-b border-stone-100 p-2">
                    <input
                      type="text"
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      placeholder="Search products..."
                      className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
                      autoFocus
                    />
                  </div>
                  {filteredProducts.length === 0 ? (
                    <p className="p-3 text-sm text-stone-400">No products found</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <div key={product.id} className="border-b border-stone-50 last:border-0">
                        <button
                          type="button"
                          onClick={() => pickProduct(index, product)}
                          className="w-full text-left px-3 py-2 hover:bg-stone-50 text-sm font-medium text-stone-800"
                        >
                          {product.name}
                        </button>
                        {product.variants.length > 0 && (
                          <div className="px-3 pb-2 flex flex-wrap gap-1">
                            {product.variants.slice(0, 8).map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => pickProduct(index, product, v)}
                                className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600 hover:bg-emerald-100 hover:text-emerald-700"
                              >
                                {v.size}{v.color ? ` / ${v.color}` : ""} — {formatZAR(v.priceInCents)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Images ──────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200/60 space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">📸 Combo Images</h2>

        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-stone-200 aspect-square">
              <Image src={img.url} alt="" fill className="object-cover" sizes="150px" />
              <button
                type="button"
                onClick={() => handleDeleteImage(img)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}

          <label className="rounded-xl border-2 border-dashed border-stone-300 aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
            <span className="text-2xl text-stone-300">📷</span>
            <span className="text-xs text-stone-400 mt-1">{uploading ? "Uploading..." : "Add Image"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* ── Submit ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEdit ? "Update Combo" : "Create Combo"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
