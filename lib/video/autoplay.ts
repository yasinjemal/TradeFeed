// ============================================================
// Autoplay policy — should this device auto-play video previews?
// TradeFeed's buyers are on paid mobile data: we respect the
// browser's Save-Data signal (Chromium — the SA Android majority)
// and prefers-reduced-motion. Non-Chromium browsers without the
// connection API simply keep autoplay (they gave no opt-out
// signal); the server always answers false.
// ============================================================

interface NetworkInformationLike {
  saveData?: boolean;
}

/** Call from effects/handlers only — answers false during SSR. */
export function shouldAutoplay(): boolean {
  if (typeof window === "undefined") return false;

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
  if (connection?.saveData) return false;

  return true;
}
