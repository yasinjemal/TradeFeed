// ============================================================
// Component — TradeFeed Logo (Reusable)
// ============================================================
// Renders the TradeFeed logo icon (WhatsApp chat bubble +
// shopping bag) and optional wordmark.
// Used in navbar, footer, mobile nav, etc.
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
  sm: { icon: "w-6 h-6", text: "text-sm" },
  md: { icon: "w-8 h-8", text: "text-lg" },
  lg: { icon: "w-10 h-10", text: "text-xl" },
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
      {/* Icon mark — WhatsApp chat bubble + shopping bag */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${s.icon} flex-shrink-0`}
      >
        <defs>
          <linearGradient id="tf-bag" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="tf-bubble" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        {/* Chat bubble (behind) */}
        <path
          d="M8 28C8 17.5 16.5 9 27 9h1c10.5 0 19 8.5 19 19v1c0 8.2-5.2 15.2-12.5 17.8L27 54l-7.5-4.2C12.5 47 8 40.5 8 33v-5Z"
          fill="url(#tf-bubble)"
          opacity="0.85"
        />
        {/* Chat bubble smile/tail */}
        <path
          d="M16 51l5-6c-5-3-8.5-8.5-8.5-15"
          stroke="url(#tf-bubble)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Shopping bag (front) */}
        <rect x="28" y="22" width="28" height="32" rx="4" fill="url(#tf-bag)" />
        {/* Bag handle */}
        <path
          d="M36 22v-4a6 6 0 0 1 12 0v4"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bag handle circles */}
        <circle cx="36" cy="22" r="2" fill="white" opacity="0.9" />
        <circle cx="48" cy="22" r="2" fill="white" opacity="0.9" />
        {/* Product grid on bag */}
        <rect x="34" y="33" width="7" height="7" rx="1.5" fill="white" opacity="0.5" />
        <rect x="43" y="33" width="7" height="7" rx="1.5" fill="white" opacity="0.5" />
        <rect x="34" y="42" width="7" height="7" rx="1.5" fill="white" opacity="0.5" />
        <rect x="43" y="42" width="7" height="7" rx="1.5" fill="white" opacity="0.35" />
      </svg>

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
