export interface HuntWhatsAppHandoffInput {
  huntSlug: string;
  huntTitle: string;
  requestedVariant?: string | null;
  sellerName: string;
  offerTitle: string;
  offerPriceCents: number;
  offerVariant?: string | null;
  deliveryEstimate?: string | null;
}

function formatRand(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * The handoff is deliberately a confirmation request, not a completed order.
 * The seller must still confirm stock, final total, payment and delivery.
 */
export function buildHuntWhatsAppMessage(
  input: HuntWhatsAppHandoffInput,
): string {
  const lines = [
    `Hi ${input.sellerName}, I chose your offer on TradeFeed HUNT.`,
    "",
    `HUNT: ${input.huntTitle}`,
    `Offer: ${input.offerTitle}`,
    `Price: ${formatRand(input.offerPriceCents)}`,
  ];

  if (input.requestedVariant) {
    lines.push(`I requested: ${input.requestedVariant}`);
  }
  if (input.offerVariant) {
    lines.push(`Offered variant: ${input.offerVariant}`);
  }
  if (input.deliveryEstimate) {
    lines.push(`Delivery/collection: ${input.deliveryEstimate}`);
  }

  lines.push(
    "",
    `Reference: https://tradefeed.co.za/hunt/${input.huntSlug}`,
    "",
    "Please confirm current stock, the final total, payment details and delivery before I order.",
  );

  return lines.join("\n");
}

export function buildHuntWhatsAppUrl(
  sellerWhatsappNumber: string,
  input: HuntWhatsAppHandoffInput,
): string {
  const phone = sellerWhatsappNumber.replace(/\D/g, "");
  if (!phone) {
    throw new Error("Seller WhatsApp number is required.");
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    buildHuntWhatsAppMessage(input),
  )}`;
}
