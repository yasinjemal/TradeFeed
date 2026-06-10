// ============================================================
// Component — Photo Catalogue Import Flow (Phase 4, Flow A)
// ============================================================
// Stages: select photos (+ optional batch caption) → chunked
// AI processing with live progress → review grid → done.
//
// The processing loop is client-driven: each iteration calls a
// small server action (≤4 vision calls), so the work survives
// serverless timeouts. Job state lives in the DB — a closed tab
// resumes from where it left off via the server page.
// ============================================================

"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useUploadThing } from "@/lib/uploadthing";
import {
  startPhotoImportAction,
  processImportChunkAction,
  getImportDraftsAction,
  completeImportJobAction,
  type ReviewDraft,
} from "@/app/actions/catalogue-import";
import { ImportReviewGrid } from "@/components/import/import-review-grid";

const MAX_PHOTOS = 50;

/** Client-side compression — same approach as the product uploader. */
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
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

type Stage = "select" | "uploading" | "processing" | "review" | "done";

interface PhotoImportFlowProps {
  shopSlug: string;
  /** Resume state from the server page (job in PROCESSING/REVIEW) */
  resumeJob?: { jobId: string; status: string; totalItems: number; readyItems: number } | null;
}

export function PhotoImportFlow({ shopSlug, resumeJob }: PhotoImportFlowProps) {
  const [stage, setStage] = useState<Stage>(
    resumeJob ? (resumeJob.status === "REVIEW" ? "review" : "processing") : "select"
  );
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [globalContext, setGlobalContext] = useState("");
  const [jobId, setJobId] = useState<string | null>(resumeJob?.jobId ?? null);
  const [progress, setProgress] = useState({
    total: resumeJob?.totalItems ?? 0,
    ready: resumeJob?.readyItems ?? 0,
  });
  const [quotaExceeded, setQuotaExceeded] = useState(0);
  const [drafts, setDrafts] = useState<ReviewDraft[] | null>(null);
  const [publishedCount, setPublishedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loopRunning = useRef(false);

  const { startUpload } = useUploadThing("bulkProductImageUploader");

  // ── Stage: select ─────────────────────────────────────────
  const onFilesPicked = (list: FileList | null) => {
    if (!list) return;
    const images = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_PHOTOS - files.length);
    setFiles((prev) => [...prev, ...images]);
    setPreviews((prev) => [...prev, ...images.map((f) => URL.createObjectURL(f))]);
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Processing loop ───────────────────────────────────────
  const runProcessingLoop = useCallback(
    async (id: string) => {
      if (loopRunning.current) return;
      loopRunning.current = true;
      try {
        // Loop until the server says done; each call is one small chunk
        for (let i = 0; i < 100; i++) {
          const res = await processImportChunkAction(shopSlug, id);
          if (!res.success) {
            setError(res.error);
            return;
          }
          setProgress({ total: res.totalItems, ready: res.readyItems });
          setQuotaExceeded(res.quotaExceededCount);
          if (res.done) break;
        }
        const draftsRes = await getImportDraftsAction(shopSlug, id);
        if (draftsRes.success) {
          setDrafts(draftsRes.drafts);
          setStage("review");
        } else {
          setError(draftsRes.error);
        }
      } finally {
        loopRunning.current = false;
      }
    },
    [shopSlug]
  );

  const handleGenerate = async () => {
    if (files.length === 0) return;
    setError(null);
    setStage("uploading");
    try {
      const compressed: File[] = [];
      for (const file of files) compressed.push(await compressImage(file));

      const uploaded = await startUpload(compressed);
      if (!uploaded || uploaded.length === 0) {
        setError("Upload failed. Check your connection and try again.");
        setStage("select");
        return;
      }

      const photos = uploaded.map((u) => ({
        url: u.serverData.url as string,
        key: u.serverData.key as string,
      }));

      const start = await startPhotoImportAction(shopSlug, {
        photos,
        globalContext: globalContext.trim() || undefined,
      });
      if (!start.success) {
        setError(start.error);
        setStage("select");
        return;
      }

      setJobId(start.jobId);
      setProgress({ total: photos.length, ready: 0 });
      setStage("processing");
      void runProcessingLoop(start.jobId);
    } catch {
      setError("Something went wrong. Please try again.");
      setStage("select");
    }
  };

  // Resume paths
  if (stage === "processing" && jobId && !loopRunning.current && !error) {
    void runProcessingLoop(jobId);
  }
  if (stage === "review" && jobId && drafts === null && !loopRunning.current) {
    loopRunning.current = true;
    getImportDraftsAction(shopSlug, jobId)
      .then((res) => {
        if (res.success) setDrafts(res.drafts);
      })
      .finally(() => {
        loopRunning.current = false;
      });
  }

  const handleFinish = async (published: number) => {
    if (!jobId) return;
    setPublishedCount(published);
    await completeImportJobAction(shopSlug, jobId);
    setStage("done");
  };

  // ══════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════

  if (stage === "select" || stage === "uploading") {
    return (
      <div className="space-y-5">
        {/* Photo picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 px-6 py-10 text-center hover:bg-emerald-50 transition-colors"
        >
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm font-bold text-emerald-800">
            {files.length > 0 ? `${files.length} photo${files.length === 1 ? "" : "s"} selected — add more?` : "Select your product photos"}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Pick up to {MAX_PHOTOS} at once. One photo per product works best.
          </p>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFilesPicked(e.target.files)}
        />

        {/* Thumbnails */}
        {previews.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs leading-none hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Batch context */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Paste your usual caption (optional — helps the AI)
          </label>
          <textarea
            rows={3}
            maxLength={2000}
            value={globalContext}
            onChange={(e) => setGlobalContext(e.target.value)}
            placeholder={'e.g. "Quality hoodies 🔥 R280, sizes S–XXL, black/grey/navy. DM to order 📲"'}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none resize-none"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={files.length === 0 || stage === "uploading"}
          className="w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {stage === "uploading"
            ? "Uploading photos…"
            : `✨ Generate ${files.length || ""} listing${files.length === 1 ? "" : "s"}`}
        </button>
      </div>
    );
  }

  if (stage === "processing") {
    const percent = progress.total > 0 ? Math.round((progress.ready / progress.total) * 100) : 0;
    return (
      <div className="text-center py-14">
        <div className="text-3xl mb-4 animate-pulse">✨</div>
        <h2 className="text-lg font-bold text-slate-900">
          {progress.ready} / {progress.total} listings ready…
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          AI is reading your photos. You can close this tab — we&apos;ll pick up where you left off.
        </p>
        <div className="max-w-xs mx-auto mt-6 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        {error && (
          <div className="mt-6">
            <p className="text-xs text-red-600 mb-2">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (jobId) void runProcessingLoop(jobId);
              }}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  if (stage === "review" && jobId) {
    return (
      <div className="space-y-4">
        {quotaExceeded > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">
              {quotaExceeded} photo{quotaExceeded === 1 ? "" : "s"} imported without AI — you ran out of AI generations.
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Fill those in manually below, or{" "}
              <Link href={`/dashboard/${shopSlug}/billing`} className="underline font-semibold">
                upgrade for unlimited AI
              </Link>.
            </p>
          </div>
        )}
        {drafts === null ? (
          <p className="text-center text-sm text-slate-500 py-10">Loading your drafts…</p>
        ) : (
          <ImportReviewGrid
            shopSlug={shopSlug}
            jobId={jobId}
            initialDrafts={drafts}
            onFinish={handleFinish}
          />
        )}
      </div>
    );
  }

  // stage === "done"
  const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/catalog/${shopSlug}`;
  const shareText = encodeURIComponent(
    `🛍️ My shop is now online! Browse my catalogue and order on WhatsApp:\n${catalogUrl}`
  );
  return (
    <div className="text-center py-14">
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-xl font-extrabold text-slate-900">
        {publishedCount} product{publishedCount === 1 ? "" : "s"} published!
      </h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
        Your catalogue is live. Share the link and start taking orders on WhatsApp.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        <a
          href={`https://wa.me/?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:bg-[#20bd5a] transition-colors"
        >
          Share on WhatsApp
        </a>
        <Link
          href={`/catalog/${shopSlug}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          View my catalogue
        </Link>
      </div>
    </div>
  );
}
