/** Buyer payments require an approved shop settlement arrangement, separately from seller subscriptions. */
export function buyerOnlinePaymentsEnabled(shopId: string): boolean {
  const approved = (process.env.BUYER_PAYMENT_SHOP_IDS ?? "").split(",").map(s => s.trim());
  return process.env.BUYER_PAYMENTS_ENABLED === "true" && approved.includes(shopId) &&
    Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY && process.env.PAYFAST_PASSPHRASE);
}
