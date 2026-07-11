import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

// ============================================================
// TfFonts — loads General Sans (display face) from Fontshare.
// Renders nothing while both TF flags are off, so the live site
// never pays the extra font request. Inter (already loaded via
// next/font) is the fallback in --font-tf-display.
// ============================================================

export function TfFonts() {
  if (!FEATURE_FLAGS.UI_REDESIGN && !FEATURE_FLAGS.UI_REDESIGN_DASHBOARD) return null;
  return (
    <>
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
      {/* Clash Display — ultra-high-contrast geometric for hero headlines */}
      {/* General Sans — warm humanist for all UI & section headings      */}
      <link
        rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=boska@400,500,600,700&f[]=clash-display@200,300,400,500,600,700&f[]=general-sans@200,300,400,500,600,700&display=swap"
      />
    </>
  );
}
