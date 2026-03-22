"use client";

// ============================================================
// Bulk Import Form — Client Component
// ============================================================
// Drag-and-drop CSV upload + bulk image upload with AI analysis.
// Images are uploaded to CDN via Uploadthing, then passed to the
// server action alongside CSV data for AI-enriched product creation.
// ============================================================

import { useState, useCallback, useRef } from "react";
import NextImage from "next/image";
import { bulkImportAction, type BulkImageItem } from "@/app/actions/bulk-import";
import { generateCsvTemplate } from "@/lib/csv/parser";
import { useUploadThing } from "@/lib/uploadthing";

interface BulkImportFormProps {
  shopSlug: string;
}

type ImportState = "idle" | "preview" | "uploading-images" | "importing" | "done";

interface PreviewData {
  fileName: string;
  content: string;
  headers: string[];
  rowCount: number;
  sampleRows: string[][];
}

/** Compress image client-side before upload (same logic as ImageUpload) */
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

const MAX_IMAGES = 50;

export function BulkImportForm({ shopSlug }: BulkImportFormProps) {
  const [state, setState] = useState<ImportState>("idle");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    imported?: number;
    skipped?: number;
    totalRows?: number;
    aiAnalyzed?: number;
    error?: string;
    errors?: { row: number; message: string }[];
  } | null>(null);
  const [csvDragOver, setCsvDragOver] = useState(false);
  const [imageDragOver, setImageDragOver] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("bulkProductImageUploader", {
    onUploadProgress: (p) => setUploadProgress(p),
    onUploadError: (err) => {
      setImageError(err?.message || "Image upload failed.");
      setState(preview ? "preview" : "idle");
      setUploadProgress(0);
    },
  });

  // ── CSV handling ──────────────────────────────────────
  const handleCsvFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setResult({ success: false, error: "Please upload a .csv file" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setResult({ success: false, error: "File too large. Maximum 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.trim().split(/\r?\n/);
      const headers = lines[0]?.split(",").map((h) => h.replace(/^"|"$/g, "").trim()) ?? [];
      const sampleRows = lines.slice(1, 6).map((line) =>
        line.split(",").map((v) => v.replace(/^"|"$/g, "").trim()),
      );

      setPreview({
        fileName: file.name,
        content,
        headers,
        rowCount: lines.length - 1,
        sampleRows,
      });
      setState("preview");
      setResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleCsvDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setCsvDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleCsvFile(file);
    },
    [handleCsvFile],
  );

  // ── Image handling ────────────────────────────────────
  const addImageFiles = useCallback(
    (files: FileList | File[]) => {
      setImageError(null);
      const newImages = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (newImages.length === 0) return;

      const totalCount = imageFiles.length + newImages.length;
      if (totalCount > MAX_IMAGES) {
        setImageError(`Max ${MAX_IMAGES} images. You've selected ${totalCount}.`);
        return;
      }

      const combined = [...imageFiles, ...newImages];
      setImageFiles(combined);

      // Generate preview thumbnails
      const newPreviews = newImages.map((f) => URL.createObjectURL(f));
      setImagePreviews((prev) => [...prev, ...newPreviews]);

      // Auto-advance to preview if no CSV loaded yet
      if (!preview && state === "idle") {
        setState("preview");
      }
    },
    [imageFiles, preview, state],
  );

  const handleImageDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setImageDragOver(false);
      addImageFiles(e.dataTransfer.files);
    },
    [addImageFiles],
  );

  const removeImage = useCallback(
    (index: number) => {
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => {
        URL.revokeObjectURL(prev[index]!);
        return prev.filter((_, i) => i !== index);
      });
    },
    [],
  );

  // ── Import ────────────────────────────────────────────
  const handleImport = async () => {
    const hasCsv = !!preview;
    const hasImages = imageFiles.length > 0;

    if (!hasCsv && !hasImages) return;

    // Step 1: Upload images to CDN if present
    let uploadedImages: BulkImageItem[] = [];

    if (hasImages) {
      setState("uploading-images");
      setUploadProgress(0);

      try {
        const compressed = await Promise.all(imageFiles.map(compressImage));
        const result = await startUpload(compressed);
        if (!result) {
          setImageError("Image upload failed. Try again.");
          setState("preview");
          return;
        }
        uploadedImages = result.map((r) => ({
          url: r.serverData.url,
          name: r.serverData.name,
        }));
      } catch {
        setImageError("Image upload failed. Try again.");
        setState("preview");
        return;
      }
    }

    // Step 2: Run the bulk import action
    setState("importing");

    try {
      const csvContent = preview?.content ?? "";
      const res = await bulkImportAction(
        shopSlug,
        csvContent,
        undefined,
        uploadedImages.length > 0 ? uploadedImages : undefined,
      );
      setResult(res);
      setState("done");
    } catch {
      setResult({ success: false, error: "Import failed unexpectedly." });
      setState("done");
    }
  };

  const handleReset = () => {
    setState("idle");
    setPreview(null);
    setResult(null);
    setImageFiles([]);
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setImageError(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const csv = generateCsvTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tradefeed-product-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-3">📋 CSV Format Guide</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-2">Required Columns</h3>
            <ul className="space-y-1 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <strong>name</strong> — Product name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <strong>price</strong> — Price in Rands (e.g. 299.99)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <strong>stock</strong> — Stock quantity
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-2">Optional Columns</h3>
            <ul className="space-y-1 text-sm text-stone-600">
              <li><strong>description</strong>, <strong>size</strong>, <strong>color</strong>, <strong>sku</strong>, <strong>category</strong></li>
              <li className="text-xs text-stone-400 mt-1">
                Rows with the same product name are grouped as variants.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-3 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200">
          <p className="text-xs text-violet-700">
            <strong>✨ AI Image Analysis:</strong> Upload product photos alongside your CSV. AI will generate descriptions and categories for products missing those fields. Surplus images (more than CSV products) create standalone AI-generated listings.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download CSV Template
        </button>
      </div>

      {/* Upload Areas */}
      {(state === "idle" || state === "preview") && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* CSV Upload */}
          {!preview ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
              onDragLeave={() => setCsvDragOver(false)}
              onDrop={handleCsvDrop}
              className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                csvDragOver
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-stone-300 bg-white hover:border-stone-400"
              }`}
            >
              <svg className="mx-auto w-10 h-10 text-stone-400 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-stone-600 font-medium mb-1 text-sm">
                Drop your CSV here
              </p>
              <p className="text-xs text-stone-400 mb-3">or click to browse (max 5MB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCsvFile(file);
                }}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-5 py-2 text-sm font-medium text-white cursor-pointer hover:bg-stone-800 transition"
              >
                Choose CSV
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {preview.fileName}
                </p>
                <button onClick={() => { setPreview(null); if (imageFiles.length === 0) setState("idle"); }} className="text-xs text-emerald-600 hover:text-emerald-800">
                  Change
                </button>
              </div>
              <p className="text-xs text-emerald-700">{preview.rowCount} row{preview.rowCount !== 1 ? "s" : ""} detected</p>
            </div>
          )}

          {/* Image Upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
            onDragLeave={() => setImageDragOver(false)}
            onDrop={handleImageDrop}
            onClick={() => imageInputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              imageDragOver
                ? "border-violet-400 bg-violet-50"
                : imageFiles.length > 0
                  ? "border-violet-300 bg-violet-50/50"
                  : "border-stone-300 bg-white hover:border-violet-300"
            }`}
          >
            {imageFiles.length === 0 ? (
              <>
                <span className="mx-auto block text-3xl mb-2">📸</span>
                <p className="text-stone-600 font-medium mb-1 text-sm">
                  Drop product images here
                </p>
                <p className="text-xs text-stone-400">
                  Up to {MAX_IMAGES} images · JPEG, PNG · AI analyzes each one
                </p>
              </>
            ) : (
              <>
                <span className="mx-auto block text-3xl mb-2">✨</span>
                <p className="text-violet-700 font-medium text-sm">
                  {imageFiles.length} image{imageFiles.length !== 1 ? "s" : ""} ready
                </p>
                <p className="text-xs text-violet-500">Click or drop to add more</p>
              </>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addImageFiles(e.target.files)}
            />
          </div>
        </div>
      )}

      {/* Image Previews */}
      {(state === "idle" || state === "preview") && imageFiles.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-stone-700">
              Product Images ({imageFiles.length})
            </p>
            <button
              onClick={() => { setImageFiles([]); imagePreviews.forEach((u) => URL.revokeObjectURL(u)); setImagePreviews([]); }}
              className="text-xs text-stone-400 hover:text-red-500 transition"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {imagePreviews.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-stone-200">
                <NextImage
                  src={url}
                  alt={imageFiles[i]?.name ?? "Product image"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  ✕
                </button>
                <span className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[8px] px-1 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
          {imageError && (
            <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <span>⚠️</span> {imageError}
            </p>
          )}
        </div>
      )}

      {/* Preview Table (CSV data) */}
      {state === "preview" && preview && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-stone-900">CSV Preview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50">
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-stone-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 text-stone-700 whitespace-nowrap max-w-[200px] truncate">
                        {cell || <span className="text-stone-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rowCount > 5 && (
            <p className="text-xs text-stone-400">Showing first 5 of {preview.rowCount} rows</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {state === "preview" && (preview || imageFiles.length > 0) && (
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Import{preview ? ` ${preview.rowCount} Row${preview.rowCount !== 1 ? "s" : ""}` : ""}
            {imageFiles.length > 0 ? ` + ${imageFiles.length} Image${imageFiles.length !== 1 ? "s" : ""}` : ""}
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Uploading Images */}
      {state === "uploading-images" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <div className="w-full max-w-[200px] h-2 bg-stone-200 rounded-full overflow-hidden mx-auto mb-4">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-stone-600 font-medium">Uploading images to CDN... {uploadProgress}%</p>
          <p className="text-sm text-stone-400 mt-1">
            {imageFiles.length} image{imageFiles.length !== 1 ? "s" : ""} · compressed &amp; delivered via global CDN
          </p>
        </div>
      )}

      {/* Importing */}
      {state === "importing" && (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <div className="mx-auto w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-stone-600 font-medium">Importing products...</p>
          <p className="text-sm text-stone-400 mt-1">
            {imageFiles.length > 0
              ? "AI is analyzing your images and creating listings — this may take a moment"
              : "This may take a moment for large files"}
          </p>
        </div>
      )}

      {/* Result */}
      {state === "done" && result && (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-6 ${
              result.success
                ? "border-emerald-200 bg-emerald-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <span className="text-2xl">✅</span>
              ) : (
                <span className="text-2xl">❌</span>
              )}
              <div>
                <h3 className={`font-semibold ${result.success ? "text-emerald-800" : "text-red-800"}`}>
                  {result.success ? "Import Complete!" : "Import Failed"}
                </h3>
                {result.success ? (
                  <p className="text-sm text-emerald-700 mt-1">
                    {result.imported} product{result.imported !== 1 ? "s" : ""} imported
                    {result.skipped ? ` · ${result.skipped} skipped` : ""}
                    {result.aiAnalyzed ? ` · ✨ ${result.aiAnalyzed} analyzed by AI` : ""}
                  </p>
                ) : (
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                )}
              </div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="font-semibold text-amber-800 mb-3">⚠️ Issues ({result.errors.length})</h3>
              <ul className="space-y-1 text-sm text-amber-700 max-h-48 overflow-y-auto">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i}>
                    {err.row > 0 ? `Row ${err.row}: ` : ""}{err.message}
                  </li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-amber-500">...and {result.errors.length - 20} more</li>
                )}
              </ul>
            </div>
          )}

          <button
            onClick={handleReset}
            className="rounded-lg bg-stone-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
