// ============================================================
// Component — Follow Shop Button
// ============================================================
// Lets buyers follow a shop to see new products in their
// "shops you follow" feed (/me). Anonymous visitors are sent
// to the WhatsApp passwordless login.
//
// Hidden entirely unless FEATURE_FLAGS.SHOP_FOLLOW is on.
// Optimistic toggle; reverts on failure. Kept tiny — no deps
// beyond the server action (low-end Android friendly).
// ============================================================

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FEATURE_FLAGS } from "@/lib/config/feature-flags";
import {
  toggleFollowShopAction,
  getFollowStateAction,
} from "@/app/actions/follow";

interface FollowShopButtonProps {
  shopId: string;
  className?: string;
}

export function FollowShopButton({ shopId, className = "" }: FollowShopButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!FEATURE_FLAGS.SHOP_FOLLOW) return;
    let cancelled = false;
    getFollowStateAction(shopId).then((res) => {
      if (!cancelled && res.success) setFollowing(res.following ?? false);
    });
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (!FEATURE_FLAGS.SHOP_FOLLOW) return null;

  const handleClick = () => {
    const previous = following;
    setFollowing(!previous); // optimistic
    startTransition(async () => {
      const res = await toggleFollowShopAction(shopId);
      if (res.needsAuth) {
        setFollowing(previous);
        router.push("/whatsapp-login");
        return;
      }
      if (!res.success) {
        setFollowing(previous); // revert
        return;
      }
      setFollowing(res.following ?? !previous);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={following}
      aria-label={following ? "Unfollow this shop" : "Follow this shop"}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-60 ${
        following
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100"
          : "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50"
      } ${className}`}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill={following ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={following ? 0 : 2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
      {following ? "Following" : "Follow"}
    </button>
  );
}
