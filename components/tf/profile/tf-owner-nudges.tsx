import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ============================================================
// TfOwnerNudges — seller-facing, and ONLY seller-facing.
//
// This page is ISR-cached at 60s. A buyer must never be served a
// cached response carrying seller nagging, so this is a separate
// server component gated on isOwner from Clerk — never a block
// hidden with CSS.
//
// Max three items, each phrased as a visible consequence rather
// than a scold, in the order that actually pays:
//   1. return policy — the difference between listed and invisible
//   2. the first product — the biggest visual jump in the system
//   3. a third product — the page changes shape
// ============================================================

export interface OwnerNudge {
  id: string;
  title: string;
  consequence: string;
  href: string;
  cta: string;
}

const MAX_NUDGES = 3;

export function buildOwnerNudges(input: {
  dashboardSlug: string;
  hasReturnPolicy: boolean;
  hasConfirmedFulfilment: boolean;
  productCount: number;
  galleryCount: number;
}): OwnerNudge[] {
  const base = `/dashboard/${input.dashboardSlug}`;
  const nudges: OwnerNudge[] = [];

  if (!input.hasReturnPolicy) {
    nudges.push({
      id: "returns",
      title: "Add a return policy",
      consequence:
        "Without it your products are hidden from marketplace search — buyers can only reach you through this link.",
      href: `${base}/settings`,
      cta: "Add it — 2 minutes",
    });
  }

  if (!input.hasConfirmedFulfilment) {
    nudges.push({
      id: "fulfilment",
      title: "Confirm delivery and collection",
      consequence:
        "Until you confirm, buyers see “ask on WhatsApp” instead of your shipping promise.",
      href: `${base}/settings`,
      cta: "Confirm now",
    });
  }

  if (input.productCount === 0) {
    nudges.push({
      id: "first-product",
      title: "List your first product",
      consequence:
        "One photo and a price turns this page into a shopfront. It is the biggest single change you can make here.",
      href: `${base}/products/new`,
      cta: "Add a product",
    });
  } else if (input.productCount < 3) {
    nudges.push({
      id: "third-product",
      title: `Add ${3 - input.productCount} more product${3 - input.productCount === 1 ? "" : "s"}`,
      consequence:
        "At three your page changes shape — buyers get a rail to swipe instead of a single item.",
      href: `${base}/products/new`,
      cta: "Add a product",
    });
  }

  if (nudges.length < MAX_NUDGES && input.galleryCount < 3) {
    nudges.push({
      id: "gallery",
      title: "Add three photos of the shop",
      consequence:
        "The shop, the packaging, hands at work. Phone photos are fine — they become your strongest trust cards.",
      href: `${base}/settings`,
      cta: "Upload photos",
    });
  }

  return nudges.slice(0, MAX_NUDGES);
}

export function TfOwnerNudges({ nudges }: { nudges: OwnerNudge[] }) {
  if (nudges.length === 0) return null;

  return (
    <section
      aria-label="Ways to improve your shop page"
      className="rounded-2xl border border-tf-stone-200 bg-tf-stone-50 p-5"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tf-stone-500">
        Only you can see this
      </p>
      <h2 className="mt-1 font-tf-display text-xl font-semibold text-tf-ink">
        This is how buyers see your shop
      </h2>

      <ul className="mt-4 space-y-3">
        {nudges.map((nudge) => (
          <li
            key={nudge.id}
            className="rounded-xl border border-tf-stone-200 bg-tf-raised p-4"
          >
            <p className="text-[15px] font-semibold text-tf-ink">{nudge.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-tf-stone-600">
              {nudge.consequence}
            </p>
            <Link
              href={nudge.href}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-tf-primary outline-none focus-visible:ring-2 focus-visible:ring-tf-primary"
            >
              {nudge.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
