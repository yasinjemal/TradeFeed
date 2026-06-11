import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

// ============================================================
// TfFonts — loads General Sans (display face) from Fontshare.
// Renders nothing while UI_REDESIGN is off, so the live site
// never pays the extra font request. Inter (already loaded via
// next/font) is the fallback in --font-tf-display.
// ============================================================

export function TfFonts() {
  if (!FEATURE_FLAGS.UI_REDESIGN) return null;
  return (
    <>
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap"
      />
    </>
  );
}
