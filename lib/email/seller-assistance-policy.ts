import { createHash } from "node:crypto";

export const ASSISTANCE_VERSION = "seller-assistance-v1";
export const ASSISTANCE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export interface AssistanceProduct {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  isFlagged: boolean;
  description: string | null;
  globalCategoryId: string | null;
  images: { url: string }[];
  variants: { isActive: boolean; priceInCents: number; stock: number }[];
}

export interface AssistanceShop {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  isActive: boolean;
  products: AssistanceProduct[];
}

export interface AssistanceDecision {
  kind: "first_product" | "incomplete_listing" | "share_catalogue";
  reason: string;
  productId: string | null;
  productName: string | null;
  issues: string[];
  actionPath: string;
}

export function assistanceListingIssues(product: AssistanceProduct): string[] {
  const issues: string[] = [];
  if (!product.images.some((image) => image.url.trim())) issues.push("a clear product photo");
  if (!product.variants.some((variant) => variant.isActive && variant.priceInCents > 0)) issues.push("a price above R0");
  if (!product.variants.some((variant) => variant.isActive && variant.priceInCents > 0 && variant.stock > 0)) issues.push("an available option with stock and a price");
  if (!product.globalCategoryId) issues.push("a marketplace category");
  if ((product.description?.trim().length ?? 0) < 40) issues.push("a useful description of at least 40 characters");
  return issues;
}

/** Deterministic observed-state rules, never an inference about a seller's emotions. */
export function chooseSellerAssistance(shop: AssistanceShop, shared: boolean, now: Date): AssistanceDecision | null {
  if (!shop.isActive) return null;
  const dashboard = `/dashboard/${encodeURIComponent(shop.slug)}`;
  if (shop.products.length === 0) {
    return now.getTime() - shop.createdAt.getTime() >= 2 * DAY ? {
      kind: "first_product", reason: "Shop is at least 48 hours old and has no saved products.",
      productId: null, productName: null, issues: [], actionPath: `${dashboard}/products/new?ai=true`,
    } : null;
  }
  // Stock-only gaps may mean an intentional sell-out. Drafts and moderation cases
  // are not treated as failed onboarding. Don't email about those automatically.
  const active = shop.products.filter((product) => product.isActive && !product.isFlagged);
  const incomplete = active.filter((product) =>
    now.getTime() - product.updatedAt.getTime() >= DAY &&
    assistanceListingIssues(product).some((issue) => issue !== "an available option with stock and a price"),
  ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))[0];
  if (incomplete) return {
    kind: "incomplete_listing", reason: "A published listing has missing details and has not been edited for 24 hours.",
    productId: incomplete.id, productName: incomplete.name,
    issues: assistanceListingIssues(incomplete), actionPath: `${dashboard}/products/${encodeURIComponent(incomplete.id)}`,
  };
  const ready = active.filter((product) => assistanceListingIssues(product).length === 0);
  if (!shared && ready.length >= 3 && ready.every((product) => now.getTime() - product.updatedAt.getTime() >= DAY)) {
    return { kind: "share_catalogue", reason: "At least three listings are ready; no tracked catalogue share has been recorded.", productId: null, productName: null, issues: [], actionPath: `${dashboard}/products` };
  }
  return null;
}

export interface AssistanceSnapshot {
  version: typeof ASSISTANCE_VERSION;
  shopId: string;
  shopName: string;
  shopSlug: string;
  decision: AssistanceDecision;
}

export function assistanceFingerprint(snapshot: AssistanceSnapshot): string {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

export function assistanceOutcome(snapshot: AssistanceSnapshot, shop: AssistanceShop, shared: boolean): boolean {
  if (!shop.isActive) return false;
  if (snapshot.decision.kind === "first_product") return shop.products.some((p) => p.isActive && !p.isFlagged && assistanceListingIssues(p).length === 0);
  if (snapshot.decision.kind === "share_catalogue") return shared;
  const product = shop.products.find((p) => p.id === snapshot.decision.productId);
  return Boolean(product && product.isActive && !product.isFlagged && assistanceListingIssues(product).length === 0);
}
