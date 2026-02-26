// ============================================================
// Image Placeholder — Shimmer blur-up for next/image
// ============================================================
// Generates an animated SVG shimmer that displays while images
// load. Use with `placeholder="blur"` + `blurDataURL`.
// Matches the app's Stone color palette (dark/light variants).
// ============================================================

const shimmer = (w: number, h: number, dark: boolean) => {
  const bg = dark ? "#292524" : "#f5f5f4"; // stone-900 / stone-100
  const hi = dark ? "#44403c" : "#e7e5e4"; // stone-700 / stone-200
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="${bg}" offset="20%" />
      <stop stop-color="${hi}" offset="50%" />
      <stop stop-color="${bg}" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${bg}" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`;
};

function toBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return btoa(str);
}

/**
 * Generates a base64-encoded shimmer SVG for use as `blurDataURL`.
 *
 * @example
 * <Image
 *   src={url}
 *   alt="Product"
 *   fill
 *   placeholder="blur"
 *   blurDataURL={shimmerPlaceholder()}
 * />
 */
export function shimmerPlaceholder(w = 400, h = 400, dark = false): string {
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h, dark))}`;
}

/** Dark variant (stone-900 bg) — for marketplace & catalog pages */
export const SHIMMER_DARK = shimmerPlaceholder(400, 400, true);

/** Light variant (stone-100 bg) — for dashboard & catalog cards */
export const SHIMMER_LIGHT = shimmerPlaceholder(400, 400, false);
