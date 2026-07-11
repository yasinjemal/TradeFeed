"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useWishlist } from "@/lib/wishlist/wishlist-context";
import { cn } from "@/lib/utils";

interface TfProductFavouriteProps {
  productId: string;
  productName: string;
  imageUrl: string | null;
  priceInCents: number;
  className?: string;
}

export function TfProductFavourite({
  productId,
  productName,
  imageUrl,
  priceInCents,
  className,
}: TfProductFavouriteProps) {
  const { toggleItem, isInWishlist } = useWishlist();
  const saved = isInWishlist(productId);

  const toggle = () => {
    toggleItem({ productId, productName, imageUrl, priceInCents });
    toast.success(saved ? "Removed from favourites" : "Saved to your favourites", {
      description: saved ? undefined : "You can find it anytime in My TradeFeed.",
      duration: 2200,
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      className={cn(
        "group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-xs font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-tf-primary focus-visible:ring-offset-2 focus-visible:ring-offset-tf-surface",
        saved
          ? "border-rose-400/30 bg-rose-500/10 text-rose-500 shadow-[0_10px_30px_rgba(244,63,94,0.10)]"
          : "border-tf-stone-200 bg-tf-raised text-tf-stone-600 shadow-tf-sm hover:-translate-y-0.5 hover:border-tf-primary/35 hover:text-tf-primary",
        className,
      )}
    >
      <Heart
        aria-hidden="true"
        className={cn(
          "size-4 transition-transform duration-200 group-active:scale-125",
          saved && "fill-current",
        )}
      />
      <span>{saved ? "Saved" : "Save to favourites"}</span>
    </button>
  );
}
