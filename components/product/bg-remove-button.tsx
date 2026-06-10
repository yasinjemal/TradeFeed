// ============================================================
// Component — Remove Background Button (Phase 3)
// ============================================================
// One-tap background cleanup for the primary product photo.
// Hidden when the flag is off. Graceful error toasts when the
// provider isn't configured or the image can't be processed.
// ============================================================

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import { removeImageBackgroundAction } from "@/app/actions/image-bg";

interface BgRemoveButtonProps {
  shopSlug: string;
  imageId: string;
  onDone?: (newUrl: string) => void;
}

export function BgRemoveButton({ shopSlug, imageId, onDone }: BgRemoveButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (!FEATURE_FLAGS.BG_REMOVAL) return null;

  const handleClick = () => {
    startTransition(async () => {
      const res = await removeImageBackgroundAction(shopSlug, imageId);
      if (res.success) {
        toast.success("Background removed — looking sharp! ✨");
        onDone?.(res.url);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors disabled:opacity-60"
    >
      {isPending ? (
        <>
          <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          Cleaning up…
        </>
      ) : (
        <>🪄 Remove background</>
      )}
    </button>
  );
}
