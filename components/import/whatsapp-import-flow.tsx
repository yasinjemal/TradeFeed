// ============================================================
// Component — WhatsApp Catalogue Import Flow
// ============================================================
// Multi-image upload → AI generates listings → Review → Bulk create.
// Uses existing /api/ai/generate-product + createProductAction +
// saveProductImagesAction infrastructure.
//
// FLOW:
//   1. User drops 1-10 product images
//   2. Each image → base64 data URL → /api/ai/generate-product
//   3. AI returns: name, description, category, tags
//   4. User reviews table → edits if needed → confirms
//   5. For each confirmed item:
//      a. createProductAction → creates product in DB
//      b. Upload image to CDN via useUploadThing
//      c. saveProductImagesAction → links image to product
//   6. Success screen with links to products
// ============================================================

"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useUploadThing } from "@/lib/uploadthing";
import { createProductAction } from "@/app/actions/product";
import { saveProductImagesAction } from "@/app/actions/image";

// ── Types ────────────────────────────────────────────────────

interface AiResult {
  name: string;
  description: string;
  category: string;
  tags: string[];
  shortCaption: string;
  seoTitle?: string;
  seoDescription?: string;
}

type ItemStatus = "pending" | "analyzing" | "ready" | "error" | "creating" | "done";

interface ImportItem {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  error?: string;
  aiResult?: AiResult;
  productId?: string;
  editedName?: string;
  editedDescription?: string;
  editedPrice?: string;
}

interface Props {
  shopSlug: string;
  shopName: string;
}

// ── Helpers ──────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Component ────────────────────────────────────────────────

export function WhatsAppImportFlow({ shopSlug, shopName }: Props) {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [phase, setPhase] = useState<"upload" | "review" | "creating" | "done">("upload");
  const [createProgress, setCreateProgress] = useState(0);
  const [createdProducts, setCreatedProducts] = useState<
    { id: string; name: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("productImageUploader");

  // ── Step 1: Handle file selection ──────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );

      if (fileArray.length === 0) return;

      // Cap at 10 items total
      const remaining = 10 - items.length;
      const toAdd = fileArray.slice(0, remaining);

      const newItems: ImportItem[] = toAdd.map((file) => ({
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
        editedPrice: "",
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Start AI analysis for each
      for (const item of newItems) {
        analyzeImage(item);
      }
    },
    [items.length]
  );

  const analyzeImage = async (item: ImportItem) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: "analyzing" } : i
      )
    );

    try {
      const dataUrl = await fileToDataUrl(item.file);

      const resp = await fetch("/api/ai/generate-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: dataUrl, shopSlug }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg =
          err.error === "CREDITS_EXHAUSTED"
            ? "AI credits exhausted — upgrade to Pro for unlimited"
            : err.message || "AI analysis failed";
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "error", error: msg } : i
          )
        );
        return;
      }

      const json = await resp.json();
      const aiResult = json.data as AiResult;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: "ready",
                aiResult,
                editedName: aiResult.name,
                editedDescription: aiResult.description,
              }
            : i
        )
      );
    } catch (e) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "error", error: "Network error. Try again." }
            : i
        )
      );
    }
  };

  // ── Step 2: Review phase ───────────────────────────────────

  const readyItems = items.filter((i) => i.status === "ready");
  const analyzingItems = items.filter((i) => i.status === "analyzing");
  const errorItems = items.filter((i) => i.status === "error");

  const canProceed = readyItems.length > 0 && analyzingItems.length === 0;

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const retryItem = (item: ImportItem) => {
    analyzeImage(item);
  };

  const updateItem = (id: string, updates: Partial<ImportItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  // ── Step 3: Create products ────────────────────────────────

  const createAllProducts = async () => {
    setPhase("creating");
    setCreateProgress(0);
    const toCreate = items.filter((i) => i.status === "ready");
    const results: { id: string; name: string }[] = [];

    for (let idx = 0; idx < toCreate.length; idx++) {
      const item = toCreate[idx]!;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "creating" } : i
        )
      );

      try {
        // a. Create product via server action
        const formData = new FormData();
        formData.set("name", item.editedName || item.aiResult!.name);
        formData.set(
          "description",
          item.editedDescription || item.aiResult!.description
        );
        // categoryId left empty — seller can assign later
        formData.set("globalCategoryId", "");
        formData.set("categoryId", "");
        formData.set("isActive", "on");
        // Set price if provided
        if (item.editedPrice && item.editedPrice.trim()) {
          formData.set("priceInRands", item.editedPrice.trim());
          formData.set("stock", "0");
        }

        const result = await createProductAction(shopSlug, null, formData);

        if (!result.success || !result.productId) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: "error",
                    error: result.error || "Failed to create product",
                  }
                : i
            )
          );
          continue;
        }

        // b. Upload image to CDN
        try {
          const uploadResult = await startUpload([item.file]);
          if (uploadResult && uploadResult.length > 0) {
            const uploaded = uploadResult.map((r) => ({
              url: r.ufsUrl ?? r.url,
              key: r.key,
              name: r.name,
            }));

            // c. Link image to product in DB
            await saveProductImagesAction(shopSlug, result.productId, uploaded);
          }
        } catch (uploadErr) {
          // Product created but image failed — not fatal
          console.error("[import] Image upload failed:", uploadErr);
        }

        results.push({
          id: result.productId,
          name: item.editedName || item.aiResult!.name,
        });

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "done", productId: result.productId }
              : i
          )
        );
      } catch (e) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: "Failed to create product" }
              : i
          )
        );
      }

      setCreateProgress(idx + 1);
    }

    setCreatedProducts(results);
    setPhase("done");
  };

  // ── Drop zone handlers ─────────────────────────────────────

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // ── Render: Done phase ─────────────────────────────────────
  if (phase === "done") {
    const doneCount = items.filter((i) => i.status === "done").length;
    const failCount = items.filter((i) => i.status === "error").length;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-stone-900">
          {doneCount} Product{doneCount !== 1 ? "s" : ""} Created!
        </h3>
        {failCount > 0 && (
          <p className="text-sm text-red-600 mt-1">
            {failCount} failed — you can add those manually later.
          </p>
        )}
        <p className="text-stone-500 mt-2">
          Your WhatsApp catalogue is now live on TradeFeed.
        </p>

        <div className="mt-6 space-y-2 max-w-md mx-auto">
          {createdProducts.slice(0, 10).map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/${shopSlug}/products/${p.id}`}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-sm hover:border-emerald-300 transition-colors"
            >
              <span className="text-stone-700 font-medium truncate">
                {p.name}
              </span>
              <span className="text-emerald-600 text-xs flex-shrink-0 ml-2">
                Edit →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/dashboard/${shopSlug}/products`}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors"
          >
            View All Products
          </Link>
          <button
            onClick={() => {
              setItems([]);
              setCreatedProducts([]);
              setCreateProgress(0);
              setPhase("upload");
            }}
            className="px-6 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-medium text-sm hover:bg-stone-50 transition-colors"
          >
            Import More
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Creating phase ─────────────────────────────────
  if (phase === "creating") {
    const total = items.filter(
      (i) => i.status === "creating" || i.status === "done" || i.status === "ready"
    ).length;

    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 text-center">
        <div className="text-4xl mb-4 animate-bounce">⚡</div>
        <h3 className="text-xl font-bold text-stone-900">
          Creating products...
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          {createProgress} of {total} done
        </p>
        <div className="mt-4 h-3 rounded-full bg-stone-100 overflow-hidden max-w-xs mx-auto">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500"
            style={{
              width: `${total > 0 ? (createProgress / total) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="mt-6 space-y-1.5 max-w-sm mx-auto text-left">
          {items
            .filter((i) => ["creating", "done", "error"].includes(i.status))
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg"
              >
                {item.status === "creating" && (
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                {item.status === "done" && (
                  <span className="text-emerald-500 flex-shrink-0">✓</span>
                )}
                {item.status === "error" && (
                  <span className="text-red-500 flex-shrink-0">✗</span>
                )}
                <span className="truncate text-stone-600">
                  {item.editedName || item.aiResult?.name || item.file.name}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // ── Render: Upload + Review phase ──────────────────────────
  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-400 bg-stone-50 hover:bg-emerald-50/30 p-8 sm:p-12 text-center cursor-pointer transition-all group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
          📸
        </div>
        <h3 className="text-lg font-bold text-stone-800">
          Drop your product photos here
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Upload screenshots from WhatsApp or your product photos.
          <br />
          AI will create listings automatically. Up to 10 at a time.
        </p>
        <p className="text-xs text-stone-400 mt-3">
          JPEG, PNG, WebP · Max 4MB per image
        </p>
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-stone-800">
              {items.length} image{items.length !== 1 ? "s" : ""} ·{" "}
              <span className="text-emerald-600">{readyItems.length} ready</span>
              {analyzingItems.length > 0 && (
                <span className="text-amber-600">
                  {" "}· {analyzingItems.length} analyzing
                </span>
              )}
              {errorItems.length > 0 && (
                <span className="text-red-500">
                  {" "}· {errorItems.length} failed
                </span>
              )}
            </h3>
            {canProceed && (
              <button
                onClick={createAllProducts}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Create {readyItems.length} Product{readyItems.length !== 1 ? "s" : ""} →
              </button>
            )}
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all ${
                item.status === "error"
                  ? "border-red-200 bg-red-50/50"
                  : item.status === "analyzing"
                    ? "border-amber-200 bg-amber-50/30"
                    : item.status === "ready"
                      ? "border-emerald-200 bg-white"
                      : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex gap-4">
                {/* Preview */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {item.status === "analyzing" && (
                    <div className="flex items-center gap-2 text-amber-700">
                      <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">
                        AI is analyzing...
                      </span>
                    </div>
                  )}

                  {item.status === "error" && (
                    <div>
                      <p className="text-sm text-red-600 font-medium">
                        {item.error}
                      </p>
                      <button
                        onClick={() => retryItem(item)}
                        className="mt-2 text-xs text-red-500 underline hover:text-red-700"
                      >
                        Retry analysis
                      </button>
                    </div>
                  )}

                  {item.status === "ready" && item.aiResult && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={item.editedName ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            editedName: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold text-stone-900 bg-transparent border-b border-stone-200 focus:border-emerald-400 outline-none pb-1 transition-colors"
                        placeholder="Product name"
                      />
                      <textarea
                        value={item.editedDescription ?? ""}
                        onChange={(e) =>
                          updateItem(item.id, {
                            editedDescription: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full text-xs text-stone-600 bg-transparent border border-stone-200 focus:border-emerald-400 rounded-lg outline-none p-2 resize-none transition-colors"
                        placeholder="Product description"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-stone-500">R</span>
                          <input
                            type="number"
                            value={item.editedPrice ?? ""}
                            onChange={(e) =>
                              updateItem(item.id, {
                                editedPrice: e.target.value,
                              })
                            }
                            className="w-24 text-xs text-stone-700 bg-stone-50 border border-stone-200 focus:border-emerald-400 rounded-lg outline-none px-2 py-1 transition-colors"
                            placeholder="Price"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[10px] font-medium text-stone-500">
                          {item.aiResult.category}
                        </span>
                        {item.aiResult.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="hidden sm:inline px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.status === "pending" && (
                    <p className="text-sm text-stone-500">Waiting to analyze...</p>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 self-start"
                  aria-label="Remove"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Bottom CTA bar */}
          {canProceed && items.length > 3 && (
            <div className="sticky bottom-4 flex justify-center">
              <button
                onClick={createAllProducts}
                className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-colors shadow-2xl shadow-emerald-600/30"
              >
                Create {readyItems.length} Product
                {readyItems.length !== 1 ? "s" : ""} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
