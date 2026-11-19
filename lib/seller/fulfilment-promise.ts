// ============================================================
// Fulfilment honesty gate
// ============================================================
// prisma/schema.prisma defaults dispatchWindow to "1-2 business
// days" and both deliveryEnabled and collectionEnabled to true.
// A seller who has never shipped anything and never opened
// settings would otherwise have an UNSET SCHEMA DEFAULT shown to
// buyers as their own promise.
//
// So a fulfilment row renders as a seller promise only once the
// seller demonstrably touched these settings. Until then the row
// still renders — as a real buyer action ("Ask on WhatsApp"),
// never as a fabricated commitment.
//
// NOTE: the correct long-term signal is a `Shop.fulfilmentConfirmedAt`
// column stamped when the settings form saves. This derivation is
// the migration-free stand-in: it is conservative (it can only
// under-claim, never over-claim) and the column can replace it
// without touching any caller.
// ============================================================

export const DEFAULT_DISPATCH_WINDOW = "1-2 business days";

export interface FulfilmentInput {
  dispatchWindow: string;
  deliveryEnabled: boolean;
  collectionEnabled: boolean;
  deliveryNote: string | null;
  returnPolicy: string | null;
  /** Set once the column exists; short-circuits the derivation. */
  fulfilmentConfirmedAt?: Date | null;
}

export function hasConfirmedFulfilment(shop: FulfilmentInput): boolean {
  if (shop.fulfilmentConfirmedAt) return true;
  if (shop.returnPolicy?.trim()) return true;
  if (shop.deliveryNote?.trim()) return true;
  if (shop.dispatchWindow.trim() !== DEFAULT_DISPATCH_WINDOW) return true;
  // Both flags default to true; turning one OFF is a deliberate act.
  if (!shop.deliveryEnabled || !shop.collectionEnabled) return true;
  return false;
}

export type PromiseTone = "promise" | "ask" | "missing";

export interface PromiseRow {
  id: "dispatch" | "fulfilment" | "returns" | "pays";
  label: string;
  value: string;
  tone: PromiseTone;
}

/**
 * Four rows, always four. A row never disappears, because a missing
 * row reads as a hole; it degrades to a buyer-useful line instead.
 */
export function buildPromiseRows(shop: FulfilmentInput): PromiseRow[] {
  const confirmed = hasConfirmedFulfilment(shop);
  const rows: PromiseRow[] = [];

  rows.push(
    confirmed
      ? { id: "dispatch", label: "Ships", value: shop.dispatchWindow, tone: "promise" }
      : { id: "dispatch", label: "Ships", value: "Ask on WhatsApp", tone: "ask" },
  );

  if (confirmed) {
    const modes = [
      shop.deliveryEnabled ? "Delivery" : null,
      shop.collectionEnabled ? "Collection" : null,
    ].filter(Boolean) as string[];
    rows.push({
      id: "fulfilment",
      label: "How you get it",
      value: modes.length > 0 ? modes.join(" or ") : "Ask on WhatsApp",
      tone: modes.length > 0 ? "promise" : "ask",
    });
  } else {
    rows.push({
      id: "fulfilment",
      label: "How you get it",
      value: "Ask about delivery on WhatsApp",
      tone: "ask",
    });
  }

  const returns = shop.returnPolicy?.trim();
  rows.push(
    returns
      ? { id: "returns", label: "Returns", value: returns, tone: "promise" }
      : { id: "returns", label: "Returns", value: "Not set yet", tone: "missing" },
  );

  rows.push({
    id: "pays",
    label: "Paying",
    value: "PayFast secure checkout · POPIA compliant",
    tone: "promise",
  });

  return rows;
}
