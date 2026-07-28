// ============================================================
// Component — Product Video Manager (Seller Dashboard)
// ============================================================
// One showcase video per product, three sources:
// - Link tab (all plans): paste a YouTube or direct video-file
//   URL. parseVideoUrl runs client-side for instant feedback and
//   preview; the server action re-runs it as the authority.
// - Upload tab (Starter+): UploadThing-hosted video. Free shops
//   see an upgrade card instead — `canUpload` is computed
//   SERVER-side and passed down; the action re-enforces it.
// ============================================================

"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Film, Link2, Loader2, Play, Trash2, UploadCloud, Youtube } from "lucide-react";
import { toast } from "sonner";

import { useUploadThing } from "@/lib/uploadthing";
import { parseVideoUrl, type ParseResult } from "@/lib/video/parse";
import {
  addProductVideoLinkAction,
  deleteProductVideoAction,
  saveProductVideoUploadAction,
  type ProductVideoDto,
} from "@/app/actions/video";

interface VideoManagerProps {
  shopSlug: string;
  productId: string;
  initialVideo: ProductVideoDto | null;
  /** Computed server-side from the shop's plan — never derive on the client */
  canUpload: boolean;
}

const SOURCE_LABELS: Record<ProductVideoDto["source"], string> = {
  UPLOAD: "Uploaded video",
  YOUTUBE: "YouTube",
  DIRECT: "Video link",
};

export function VideoManager({ shopSlug, productId, initialVideo, canUpload }: VideoManagerProps) {
  const [video, setVideo] = useState<ProductVideoDto | null>(initialVideo);
  const [tab, setTab] = useState<"link" | "upload">("link");
  const [url, setUrl] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed: ParseResult | null = url.trim() ? parseVideoUrl(url) : null;

  const { startUpload } = useUploadThing("productVideoUploader", {
    onUploadProgress: (p) => setUploadProgress(p),
    onUploadError: (err) => {
      toast.error(err?.message?.trim() || "Upload failed. Try a smaller file (max 32MB).");
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleAddLink = () => {
    if (!parsed?.ok || isPending) return;
    startTransition(async () => {
      const result = await addProductVideoLinkAction(shopSlug, productId, url);
      if (result.success && result.video) {
        setVideo(result.video);
        setUrl("");
        toast.success("Video added to your listing");
      } else {
        toast.error(result.error ?? "Failed to add video.");
      }
    });
  };

  const handleUploadFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || isUploading) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Choose a video file (MP4 works best).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await startUpload([file]);
      const uploaded = result?.[0];
      if (!uploaded) return; // onUploadError already toasted

      const saveResult = await saveProductVideoUploadAction(shopSlug, productId, {
        url: uploaded.serverData.url,
        key: uploaded.serverData.key,
        name: uploaded.serverData.name,
      });
      if (saveResult.success && saveResult.video) {
        setVideo(saveResult.video);
        toast.success("Video uploaded");
      } else {
        toast.error(saveResult.error ?? "Failed to save video.");
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = () => {
    if (!video || isPending) return;
    startTransition(async () => {
      const result = await deleteProductVideoAction(shopSlug, productId, video.id);
      if (result.success) {
        setVideo(null);
        toast.success("Video removed");
      } else {
        toast.error(result.error ?? "Failed to remove video.");
      }
    });
  };

  const tabCls = (active: boolean) =>
    `flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
      active ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
    }`;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <Film aria-hidden="true" className="size-4 text-emerald-600" />
        <h2 className="text-sm font-bold text-stone-800">Product video</h2>
        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Optional
        </span>
      </div>
      <p className="mb-4 text-xs text-stone-500">
        Listings with video get more orders — show the product in someone&apos;s hands.
      </p>

      {video ? (
        /* ── Current video ─────────────────────────────── */
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
            {video.source === "YOUTUBE" && video.thumbnailUrl ? (
              <>
                <Image src={video.thumbnailUrl} alt="" fill sizes="128px" className="object-cover" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <Play aria-hidden="true" className="size-6 text-white drop-shadow" />
                </span>
              </>
            ) : (
              <video src={video.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
              {video.source === "YOUTUBE" && <Youtube aria-hidden="true" className="size-4 text-red-600" />}
              {SOURCE_LABELS[video.source]}
            </p>
            <p className="truncate text-xs text-stone-400">{video.url}</p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Remove video"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </button>
        </div>
      ) : (
        /* ── Empty: two tabs ───────────────────────────── */
        <div>
          <div className="mb-3 flex gap-1 rounded-xl bg-stone-100 p-1" role="tablist" aria-label="Video source">
            <button type="button" role="tab" aria-selected={tab === "link"} onClick={() => setTab("link")} className={tabCls(tab === "link")}>
              <Link2 aria-hidden="true" className="size-4" />
              Paste a link
            </button>
            <button type="button" role="tab" aria-selected={tab === "upload"} onClick={() => setTab("upload")} className={tabCls(tab === "upload")}>
              <UploadCloud aria-hidden="true" className="size-4" />
              Upload
            </button>
          </div>

          {tab === "link" ? (
            <div className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setPreviewFailed(false);
                }}
                placeholder="YouTube link or a direct .mp4 link"
                aria-label="Video link"
                className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />

              {parsed && !parsed.ok && (
                <p className="text-xs text-amber-700">{parsed.error}</p>
              )}

              {/* Live preview */}
              {parsed?.ok && (
                <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  {parsed.video.source === "YOUTUBE" ? (
                    <>
                      <Image src={parsed.video.thumbnailUrl} alt="Video preview" fill sizes="384px" className="object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play aria-hidden="true" className="size-8 text-white drop-shadow" />
                      </span>
                    </>
                  ) : (
                    <video
                      src={parsed.video.url}
                      muted
                      playsInline
                      controls
                      preload="metadata"
                      onError={() => setPreviewFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )}
              {parsed?.ok && previewFailed && (
                <p className="text-xs text-amber-700">
                  We couldn&apos;t load a preview of that video — double-check the link works before saving.
                </p>
              )}

              <button
                type="button"
                onClick={handleAddLink}
                disabled={!parsed?.ok || isPending}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Adding…" : "Add video"}
              </button>
              <p className="text-[11px] text-stone-400">
                Works with YouTube, YouTube Shorts, and direct links to .mp4/.webm files. Free on every plan.
              </p>
            </div>
          ) : canUpload ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleUploadFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-4 py-8 text-sm text-stone-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 aria-hidden="true" className="size-6 animate-spin text-emerald-600" />
                    Uploading… {uploadProgress}%
                  </>
                ) : (
                  <>
                    <UploadCloud aria-hidden="true" className="size-6" />
                    <span className="font-medium">Tap to choose a video</span>
                    <span className="text-xs text-stone-400">MP4 recommended · max 32MB · keep it under 30 seconds</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Upgrade card — uploads are a paid perk, links stay free */
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Upload videos with Starter</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700">
                Hosted video uploads are included from the Starter plan (R99/month). YouTube and
                direct links are free on every plan — use the &quot;Paste a link&quot; tab.
              </p>
              <a
                href={`/dashboard/${shopSlug}/billing`}
                className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
              >
                See plans
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
