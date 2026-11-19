// ============================================================
// Seller call to action — one label, one sign-up path
// ============================================================
// Every public "become a seller" button reads from here so the
// wording and the destination cannot drift apart again:
//
//   signed out            → /sign-up  → (Clerk) → /get-started
//   signed in, no shop    → /get-started
//   signed in, has a shop → /dashboard/<slug>
//
// /get-started is the only onboarding flow. It ends with a live
// product, which is the activation moment; /create-shop ended on
// an empty dashboard and now redirects here.
//
// Client components can import this file (no server-only deps).
// ============================================================

/** Clerk sign-up. Its fallback redirect is SELLER_ONBOARDING_PATH. */
export const SELLER_SIGN_UP_PATH = "/sign-up";

/** The single post-sign-up destination for sellers. */
export const SELLER_ONBOARDING_PATH = "/get-started";

/** The one sign-up label. Do not write variants of it in components. */
export const SELLER_CTA_LABEL = "Create your free shop";

/** Shown instead of the sign-up label to a seller who already has a shop. */
export const SELLER_DASHBOARD_LABEL = "Go to dashboard";

export interface SellerCta {
  href: string;
  label: string;
}

export interface SellerCtaViewer {
  /** True when the visitor has a Clerk session. */
  isSignedIn?: boolean;
  /** Slug of the visitor's first shop, when they have one. */
  dashboardSlug?: string | null;
}

/**
 * Resolve the seller call to action for a visitor. Pages that cannot
 * know who is looking (static SEO pages, storefront footers) call it
 * with no argument and get the signed-out path; a signed-in visitor
 * who follows it is forwarded on by Clerk and /get-started.
 */
export function sellerCta(viewer: SellerCtaViewer = {}): SellerCta {
  if (viewer.dashboardSlug) {
    return {
      href: `/dashboard/${viewer.dashboardSlug}`,
      label: SELLER_DASHBOARD_LABEL,
    };
  }
  return {
    href: viewer.isSignedIn ? SELLER_ONBOARDING_PATH : SELLER_SIGN_UP_PATH,
    label: SELLER_CTA_LABEL,
  };
}
