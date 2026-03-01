// ============================================================
// Component — TradeFeed Logo (Reusable)
// ============================================================
// Renders the TradeFeed logo icon (T with signal accent) and
// optional wordmark. Used in navbar, footer, mobile nav, etc.
//
// USAGE:
//   <TradeFeedLogo />                    — icon + wordmark (default)
//   <TradeFeedLogo size="sm" />          — small variant
//   <TradeFeedLogo size="lg" />          — large variant
//   <TradeFeedLogo iconOnly />           — icon only, no text
//   <TradeFeedLogo variant="light" />    — for dark backgrounds (default)
//   <TradeFeedLogo variant="dark" />     — for light backgrounds
// ============================================================

interface TradeFeedLogoProps {
  /** "sm" = 24px, "md" = 32px (default), "lg" = 40px icon */
  size?: "sm" | "md" | "lg";
  /** Hide the wordmark, show only the icon */
  iconOnly?: boolean;
  /** "light" text for dark bg (default), "dark" text for light bg */
  variant?: "light" | "dark";
  /** Additional className for the wrapper */
  className?: string;
}

const sizeMap = {
  sm: { icon: "w-6 h-6", text: "text-sm", iconText: "text-[9px]", radius: "rounded-md" },
  md: { icon: "w-8 h-8", text: "text-lg", iconText: "text-sm", radius: "rounded-lg" },
  lg: { icon: "w-10 h-10", text: "text-xl", iconText: "text-base", radius: "rounded-xl" },
} as const;

export function TradeFeedLogo({
  size = "md",
  iconOnly = false,
  variant = "light",
  className = "",
}: TradeFeedLogoProps) {
  const s = sizeMap[size];
  const isDark = variant === "dark";

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Icon mark */}
      <span
        className={`${s.icon} ${s.radius} bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${s.icon}`}
        >
          <path d="M8 8H24V12H18V25H14V12H8Z" fill="white" />
          <circle cx="23" cy="9" r="2" fill="white" opacity="0.9" />
          <path
            d="M20 6A5 5 0 0126 6"
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </span>

      {/* Wordmark */}
      {!iconOnly && (
        <span className={`font-bold ${s.text} tracking-tight`}>
          <span className={isDark ? "text-stone-900" : "text-white"}>Trade</span>
          <span className={isDark ? "text-emerald-600" : "text-emerald-400"}>Feed</span>
        </span>
      )}
    </span>
  );
}
