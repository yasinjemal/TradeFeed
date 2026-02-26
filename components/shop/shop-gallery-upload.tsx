// ============================================================
// Component — Shop Gallery Upload
// ============================================================
// Upload and manage shop gallery images/videos.
// Shows a grid of thumbnails with delete + caption editing.
// Uses Uploadthing for file uploads.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing";
import {
  addGalleryItemAction,
  deleteGalleryItemAction,
  updateGalleryCaptionAction,
} from "@/app/actions/gallery";
import { toast } from "sonner";

interface GalleryItem {
  id: string;
  url: string;
  key: string | null;
  type: "IMAGE" | "VIDEO";
  caption: string | null;
  position: number;
}

interface ShopGalleryUploadProps {
  shopSlug: string;
  initialItems: GalleryItem[];
}

export function ShopGalleryUpload({
  shopSlug,
  initialItems,
}: ShopGalleryUploadProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionValue, setCaptionValue] = useState("");

  const { startUpload } = useUploadThing("shopGalleryUploader", {
    onClientUploadComplete: (results) => {
      if (!results) return;
      // Add each uploaded file to gallery via server action
      for (const file of results) {
        const isVideo = file.name.toLowerCase().endsWith(".mp4") || file.name.toLowerCase().endsWith(".mov");
        startTransition(async () => {
          const result = await addGalleryItemAction(
            shopSlug,
            file.serverData.url,
            file.serverData.key,
            isVideo ? "VIDEO" : "IMAGE"
          );
          if (result.success) {
            // Refresh items — we'll just add it to local state
            setItems((prev) => [
              ...prev,
              {
                id: `temp-${Date.now()}-${Math.random()}`,
                url: file.serverData.url,
                key: file.serverData.key,
                type: isVideo ? "VIDEO" : "IMAGE",
                caption: null,
                position: prev.length,
              },
            ]);
          } else {
            toast.error(result.error ?? "Failed to save gallery item");
          }
        });
      }
      setIsUploading(false);
      toast.success("Gallery updated!");
    },
    onUploadError: (error) => {
      setIsUploading(false);
      toast.error(error.message || "Upload failed");
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (items.length + files.length > 12) {
      toast.error("Maximum 12 gallery items allowed");
      return;
    }
    startUpload(Array.from(files));
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDelete = (itemId: string) => {
    if (!confirm("Delete this gallery item?")) return;
    startTransition(async () => {
      const result = await deleteGalleryItemAction(shopSlug, itemId);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success("Gallery item deleted");
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    });
  };

  const handleCaptionSave = (itemId: string) => {
    startTransition(async () => {
      const result = await updateGalleryCaptionAction(shopSlug, itemId, captionValue);
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, caption: captionValue } : i))
        );
        setEditingCaption(null);
        toast.success("Caption updated");
      } else {
        toast.error(result.error ?? "Failed to update caption");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            📸 Shop Gallery
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Upload photos & videos of your shop, team, and products to build buyer trust
          </p>
        </div>
        <span className="text-xs text-stone-400">{items.length}/12</span>
      </div>

      {/* Gallery Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50 aspect-square"
            >
              {item.type === "VIDEO" ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={item.url}
                  alt={item.caption || "Gallery image"}
                  fill
                  sizes="(max-width: 640px) 33vw, 25vw"
                  className="object-cover"
                />
              )}

              {/* Video badge */}
              {item.type === "VIDEO" && (
                <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  🎬 VIDEO
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* Edit caption */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCaption(item.id);
                    setCaptionValue(item.caption || "");
                  }}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone-700 hover:bg-white transition-colors"
                  title="Edit caption"
                >
                  ✏️
                </button>
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={isPending}
                  className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 hover:bg-white transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>

              {/* Caption display */}
              {item.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <p className="text-white text-[10px] font-medium truncate">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caption editor dialog */}
      {editingCaption && (
        <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
          <input
            type="text"
            value={captionValue}
            onChange={(e) => setCaptionValue(e.target.value)}
            placeholder="Add a caption…"
            maxLength={100}
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => handleCaptionSave(editingCaption)}
            disabled={isPending}
            className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingCaption(null)}
            className="px-3 py-2 text-xs font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Upload button */}
      {items.length < 12 && (
        <label
          className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${isUploading
              ? "border-emerald-300 bg-emerald-50 cursor-wait"
              : "border-stone-300 hover:border-emerald-400 hover:bg-emerald-50/50"
            }`}
        >
          <input
            type="file"
            accept="image/*,video/mp4,video/quicktime"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading || isPending}
            className="sr-only"
          />
          {isUploading ? (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              Uploading…
            </span>
          ) : (
            <span className="text-sm text-stone-500 font-medium">
              📷 Add photos or videos
            </span>
          )}
        </label>
      )}
    </div>
  );
}
