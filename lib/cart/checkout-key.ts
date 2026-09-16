/** A retry (including refresh) reuses its order key; no contact details are stored. */
export async function getCheckoutKey(shopId: string, payload: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  const storageKey = "tradefeed_checkout_" + shopId;
  try {
    const previous = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (previous?.fingerprint === fingerprint && typeof previous.key === "string") return previous.key;
    const key = crypto.randomUUID();
    sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
    return key;
  } catch { return crypto.randomUUID(); }
}
