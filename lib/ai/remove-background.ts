// ============================================================
// AI Background Removal — Provider Client (Phase 3)
// ============================================================
// Calls remove.bg to strip the background from a product photo
// and replace it with clean white (consistent marketplace look,
// smaller JPEGs than transparent PNGs — kind to low-end Android).
//
// Provider-agnostic surface: swap the implementation without
// touching callers. No API key → returns null (graceful no-op).
//
// ENV: BG_REMOVAL_API_KEY (remove.bg API key)
// ============================================================

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";

export interface BgRemovalResult {
  /** JPEG bytes with white background */
  imageBuffer: Buffer;
  contentType: string;
}

export function isBgRemovalConfigured(): boolean {
  return !!process.env.BG_REMOVAL_API_KEY;
}

/**
 * Remove the background from an image URL.
 * Returns null when unconfigured or on provider failure —
 * callers keep the original image.
 */
export async function removeBackground(imageUrl: string): Promise<BgRemovalResult | null> {
  const apiKey = process.env.BG_REMOVAL_API_KEY;
  if (!apiKey) {
    console.log("[remove-background] No BG_REMOVAL_API_KEY — skipping");
    return null;
  }

  try {
    const form = new FormData();
    form.append("image_url", imageUrl);
    form.append("size", "auto");
    form.append("bg_color", "ffffff"); // white, not transparent — consistent cards, smaller files
    form.append("format", "jpg");

    const response = await fetch(REMOVE_BG_ENDPOINT, {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[remove-background] Provider error:", response.status, body.slice(0, 300));
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      imageBuffer: Buffer.from(arrayBuffer),
      contentType: "image/jpeg",
    };
  } catch (error) {
    console.error("[remove-background] Request failed:", error);
    return null;
  }
}
