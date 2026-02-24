// ============================================================
// Component — Image Upload (Uploadthing CDN + Drag & Drop)
// ============================================================
// Beautiful drag & drop image upload powered by Uploadthing:
// - Client-side compression (1200px max, JPEG 0.85 quality)
// - Direct CDN upload via useUploadThing hook
// - Real upload progress bar
// - Preview grid with main image highlight
// - Delete on hover (removes from CDN + DB)
// ============================================================

"use client";

import { useState, useRef, useCallback } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import {
  saveProductImagesAction,
  deleteProductImageAction,
} from "@/app/actions/image";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

interface ImageUploadProps {
  images: ProductImage[];
  shopSlug: string;
  productId: string;
}

const MAX_IMAGES = 8;

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
          resolve(
            blob
              ? new File([blob], file.name, { type: "image/jpeg" })
              : file
          ),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export function ImageUpload({
  images,
  shopSlug,
  productId,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("productImageUploader", {
    onUploadProgress: (p) => setUploadProgress(p),
    onUploadError: (err) => {
      setError(err.message || "Upload failed. Try again.");
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      setError(null);
      const files = Array.from(fileList).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      if (images.length + files.length > MAX_IMAGES) {
        setError(`Max ${MAX_IMAGES} images. You have ${images.length}.`);
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      try {
        // Compress images client-side before CDN upload
        const compressed = await Promise.all(files.map(compressImage));

        // Upload directly to Uploadthing CDN
        const result = await startUpload(compressed);
        if (!result) {
          setError("Upload failed. Try again.");
          return;
        }

        // Save CDN URLs to our database
        const uploadedImages = result.map((r) => ({
          url: r.serverData.url,
          key: r.serverData.key,
          name: r.serverData.name,
        }));

        const saveResult = await saveProductImagesAction(
          shopSlug,
          productId,
          uploadedImages
        );
        if (!saveResult.success) {
          setError(saveResult.error ?? "Failed to save images");
        }
      } catch {
        setError("Upload failed. Try again.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [images.length, shopSlug, productId, startUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDelete = useCallback(
    async (imageId: string) => {
      setDeletingId(imageId);
      try {
        const result = await deleteProductImageAction(shopSlug, productId, imageId);
        if (!result.success) setError(result.error ?? "Failed to delete");
      } catch {
        setError("Failed to delete");
      } finally {
        setDeletingId(null);
      }
    },
    [shopSlug, productId]
  );

  const remaining = MAX_IMAGES - images.length;

  return (
    <div className="space-y-3">
      {/* ── Image Grid ──────────────────────────────────── */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300
                ${i === 0 ? "col-span-2 row-span-2 border-emerald-300 shadow-sm" : "border-stone-200"}
                ${deletingId === img.id ? "opacity-40 scale-95" : "hover:border-emerald-400"}`}
            >
              <img
                src={img.url}
                alt={img.altText ?? "Product"}
                className="w-full h-full object-cover"
              />
              {/* Main badge */}
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  MAIN
                </span>
              )}
              {/* Delete button */}
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deletingId !== null}
                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center
                  opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500 hover:scale-110 text-xs"
              >
                ✕
              </button>
              {/* Position indicator */}
              {i > 0 && (
                <span className="absolute bottom-1 right-1.5 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {i + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Upload Drop Zone ────────────────────────────── */}
      {remaining > 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300
            ${
              isDragging
                ? "border-emerald-400 bg-emerald-50/80 scale-[1.01] shadow-lg shadow-emerald-100"
                : "border-stone-300 bg-stone-50/50 hover:border-emerald-300 hover:bg-emerald-50/30"
            }
            ${isUploading ? "pointer-events-none" : ""}`}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {isUploading ? (
              <>
                {/* Progress bar */}
                <div className="w-full max-w-[200px] h-2 bg-stone-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm font-medium text-emerald-700">
                  Uploading to CDN... {uploadProgress}%
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Images are delivered via global CDN ⚡
                </p>
              </>
            ) : (
              <>
                <div
                  className={`text-3xl mb-2 transition-transform duration-300 ${isDragging ? "scale-125 -translate-y-1" : ""}`}
                >
                  {images.length === 0 ? "📸" : "➕"}
                </div>
                <p className="text-sm font-medium text-stone-700">
                  {isDragging
                    ? "Drop images here!"
                    : images.length === 0
                      ? "Drag & drop product photos"
                      : "Add more photos"}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  or click to browse · {remaining} slot
                  {remaining !== 1 ? "s" : ""} left · JPEG, PNG · max 4MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
        </div>
      )}

      {/* Full indicator */}
      {remaining === 0 && (
        <p className="text-xs text-stone-400 text-center">
          ✓ Maximum {MAX_IMAGES} images reached
        </p>
      )}

      {/* ── Error ───────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span> {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
