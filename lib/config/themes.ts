// ============================================================
// Storefront Theme Presets
// ============================================================
// Pro sellers can pick a theme to visually differentiate their
// catalog. Each theme defines primary/accent colors and a font.
// The catalog layout injects these as CSS custom properties.
// ============================================================

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primary: string;   // hex
  accent: string;    // hex
  font: string;      // font-family identifier
  preview: {
    bg: string;      // Tailwind bg class for preview card
    text: string;    // Tailwind text class for preview card
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean emerald & stone — the TradeFeed default",
    primary: "#10b981",
    accent: "#f59e0b",
    font: "inter",
    preview: { bg: "bg-emerald-600", text: "text-white" },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Deep indigo with teal accents — sleek & professional",
    primary: "#6366f1",
    accent: "#14b8a6",
    font: "dm-sans",
    preview: { bg: "bg-indigo-600", text: "text-white" },
  },
  {
    id: "bold",
    name: "Bold",
    description: "Vibrant rose with amber highlights — streetwear energy",
    primary: "#e11d48",
    accent: "#f59e0b",
    font: "poppins",
    preview: { bg: "bg-rose-600", text: "text-white" },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Monochrome slate — luxury & understated elegance",
    primary: "#334155",
    accent: "#94a3b8",
    font: "space-grotesk",
    preview: { bg: "bg-slate-700", text: "text-white" },
  },
  {
    id: "vibrant",
    name: "Vibrant",
    description: "Electric violet & cyan — youthful & eye-catching",
    primary: "#8b5cf6",
    accent: "#06b6d4",
    font: "poppins",
    preview: { bg: "bg-violet-600", text: "text-white" },
  },
];

export const THEME_FONTS: Record<string, string> = {
  inter: "'Inter', sans-serif",
  "dm-sans": "'DM Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  "space-grotesk": "'Space Grotesk', sans-serif",
  playfair: "'Playfair Display', serif",
};

export function getThemePreset(id: string | null | undefined): ThemePreset | null {
  if (!id) return null;
  return THEME_PRESETS.find((t) => t.id === id) ?? null;
}

/**
 * Build CSS custom properties for a shop's theme.
 * Falls back to preset values when custom colors are not set.
 */
export function buildThemeCssVars(theme: {
  themePreset?: string | null;
  themePrimary?: string | null;
  themeAccent?: string | null;
  themeFont?: string | null;
}): Record<string, string> {
  const preset = getThemePreset(theme.themePreset);
  if (!preset && !theme.themePrimary) return {};

  const primary = theme.themePrimary ?? preset?.primary ?? "#10b981";
  const accent = theme.themeAccent ?? preset?.accent ?? "#f59e0b";
  const fontKey = theme.themeFont ?? preset?.font ?? "inter";
  const fontFamily = THEME_FONTS[fontKey] ?? THEME_FONTS.inter ?? "'Inter', sans-serif";

  return {
    "--shop-primary": primary,
    "--shop-accent": accent,
    "--shop-font": fontFamily,
  };
}
