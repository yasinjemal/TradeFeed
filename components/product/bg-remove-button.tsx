// ============================================================
// Component — Remove Background Button (Phase 3)
// ============================================================
// One-tap background cleanup for the primary product photo.
// Hidden when the flag is off. Graceful error toasts when the
// provider isn't configured or the image can't be processed.
// ============================================================

"use client";

import { useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
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
        toast.success("Background removed");
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
      className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-tf-stone-300 bg-tf-raised px-4 text-sm font-medium text-tf-ink outline-none transition-colors hover:border-tf-stone-400 hover:bg-tf-stone-50 focus-visible:ring-2 focus-visible:ring-tf-primary disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
    >
      {isPending ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
          Cleaning up…
        </>
      ) : (
        <>
          <Wand2 aria-hidden="true" className="size-4" />
          Remove background
        </>
      )}
    </button>
  );
}
