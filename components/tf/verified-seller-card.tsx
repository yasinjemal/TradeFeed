import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatReplyTime } from "./format";

// ============================================================
// TfVerifiedSellerCard — THE signature element of the redesign.
// One recurring identity unit: avatar, name, verified tick,
// "127 orders · replies in ~8 min · since 2024", location.
// Appears on storefronts (hero), product pages (inline), and
// at checkout (inline). Trust as a visible, repeated object.
//
// POPIA: this component never renders a WhatsApp number.
// ============================================================

export interface TfVerifiedSellerCardProps extends React.ComponentProps<"div"> {
  name: string;
  verified?: boolean;
  avatarUrl?: string | null;
  ordersFulfilled?: number;
  /** Average reply time in minutes */
  avgReplyMinutes?: number;
  /** Year the seller joined, e.g. 2024 */
  memberSince?: number | string;
  location?: string;
  /** Link to the seller's storefront (inline variant) */
  href?: string;
  /** "inline" (product page / checkout) or "hero" (storefront header) */
  variant?: "inline" | "hero";
  /** Optional action slot, e.g. a Follow button (hero variant) */
  action?: React.ReactNode;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function StatsLine({
  ordersFulfilled,
  avgReplyMinutes,
  memberSince,
  className,
}: Pick<TfVerifiedSellerCardProps, "ordersFulfilled" | "avgReplyMinutes" | "memberSince"> & {
  className?: string;
}) {
  const parts: string[] = [];
  if (ordersFulfilled != null)
    parts.push(`${ordersFulfilled.toLocaleString("en-ZA")} order${ordersFulfilled === 1 ? "" : "s"}`);
  if (avgReplyMinutes != null) parts.push(`replies in ${formatReplyTime(avgReplyMinutes)}`);
  if (memberSince != null) parts.push(`since ${memberSince}`);
  if (parts.length === 0) return null;
  return (
    <p className={cn("text-[13px] text-tf-stone-600 tabular-nums", className)}>
      {parts.join(" · ")}
    </p>
  );
}

function TfVerifiedSellerCard({
  name,
  verified = false,
  avatarUrl,
  ordersFulfilled,
  avgReplyMinutes,
  memberSince,
  location,
  href,
  variant = "inline",
  action,
  className,
  ...props
}: TfVerifiedSellerCardProps) {
  const hero = variant === "hero";

  const avatar = (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-tf-deep font-medium text-tf-surface",
        hero ? "size-16 text-xl" : "size-12 text-base",
      )}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt="" fill sizes={hero ? "64px" : "48px"} className="object-cover" />
      ) : (
        initialsOf(name)
      )}
    </div>
  );

  const nameEl = (
    <span className={cn("font-tf-display font-semibold text-tf-ink", hero ? "text-xl" : "text-base")}>
      {name}
      {verified && (
        <BadgeCheck
          aria-hidden="true"
          className={cn("ml-1 inline-block align-[-3px] text-tf-verified", hero ? "size-5" : "size-[18px]")}
        />
      )}
      {verified && <span className="sr-only">Verified seller</span>}
    </span>
  );

  return (
    <div
      data-slot="tf-verified-seller-card"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-tf-stone-200 bg-tf-raised shadow-tf-sm",
        hero ? "items-start gap-4 p-5" : "p-4",
        className,
      )}
      {...props}
    >
      {avatar}
      <div className="min-w-0 flex-1">
        {href && !hero ? (
          <Link
            href={href}
            className="rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-tf-primary"
          >
            {nameEl}
          </Link>
        ) : (
          nameEl
        )}
        <StatsLine
          ordersFulfilled={ordersFulfilled}
          avgReplyMinutes={avgReplyMinutes}
          memberSince={memberSince}
          className="mt-0.5"
        />
        {location && (
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-tf-stone-500">
            <MapPin aria-hidden="true" className="size-3.5" />
            {location}
          </p>
        )}
      </div>
      {action ? (
        <div className="shrink-0 self-center">{action}</div>
      ) : verified ? (
        <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-full bg-tf-verified-soft px-2.5 py-1 text-xs font-medium leading-none text-tf-deep">
          <BadgeCheck aria-hidden="true" className="size-3.5" />
          Verified
        </span>
      ) : null}
    </div>
  );
}

export { TfVerifiedSellerCard };
