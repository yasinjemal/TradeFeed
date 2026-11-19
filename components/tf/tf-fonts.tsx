import { FEATURE_FLAGS } from "@/lib/config/feature-flags";

// ============================================================
// TfHeroFont — preloads one face: Clash Display, which sets the
// nameplate and the big headlines.
//
// The @font-face rules themselves live in app/globals.css and are
// fetched lazily by the browser, so every other TF face needs no
// help here. This component exists only because a preload is NOT
// lazy: it downloads unconditionally. Two rules follow from that.
//
//   1. It stays behind the TF flags, so a flags-off page still
//      pays zero font bytes.
//   2. Render it only where a .font-tf-hero headline is above the
//      fold. On a page that never paints the face it is 29KB of
//      pure waste on a prepaid-data phone.
//
// crossOrigin is required even though this is same-origin: fonts
// are always fetched in CORS mode, and a preload without it
// mismatches the real request and downloads the file twice.
//
// This replaced TfFonts, which pulled a render-blocking stylesheet
// from api.fontshare.com on 17 surfaces. That URL asked for three
// families and — because the endpoint honours only the first f[]
// parameter — delivered one, so the two faces the design is built
// on had never reached a single visitor.
// ============================================================

/** Keep in step with the @font-face src rules in app/globals.css. */
export const TF_FONT_URLS = {
  /** Clash Display — .font-tf-hero, the nameplate and big headlines. */
  hero: "/fonts/v1/ClashDisplay-Variable.woff2",
  /** General Sans — .font-tf-display, and the homepage hero headline. */
  display: "/fonts/v1/GeneralSans-Variable.woff2",
} as const;

export function TfHeroFont({ face = "hero" }: { face?: keyof typeof TF_FONT_URLS }) {
  if (!FEATURE_FLAGS.UI_REDESIGN && !FEATURE_FLAGS.UI_REDESIGN_DASHBOARD) return null;
  return (
    <link
      rel="preload"
      as="font"
      type="font/woff2"
      href={TF_FONT_URLS[face]}
      crossOrigin="anonymous"
    />
  );
}
