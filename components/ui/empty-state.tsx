// ============================================================
// Component — EmptyState (Shared)
// ============================================================
// Reusable empty state with illustration, heading, description,
// and optional CTA button. Use this everywhere instead of
// ad-hoc inline JSX.
//
// Usage:
//   <EmptyState
//     illustration={<IllustrationEmptyBox />}
//     heading="No products yet"
//     description="Add your first product to start selling"
//     action={{ label: "Add Product", href: "/..." }}
//   />
// ============================================================

import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  illustration: React.ReactNode;
  heading: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  illustration,
  heading,
  description,
  action,
  secondaryAction,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-4" : "py-16 px-6"
      } ${className}`}
    >
      {/* Illustration */}
      <div className={`${compact ? "mb-4" : "mb-6"} opacity-90`}>
        {illustration}
      </div>

      {/* Heading */}
      <h3
        className={`font-semibold text-stone-800 ${
          compact ? "text-base" : "text-lg sm:text-xl"
        }`}
      >
        {heading}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={`text-stone-500 max-w-sm mx-auto ${
            compact ? "text-xs mt-1" : "text-sm mt-2"
          }`}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={`flex flex-wrap items-center justify-center gap-3 ${compact ? "mt-4" : "mt-6"}`}>
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all active:scale-[0.97]"
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-md shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all active:scale-[0.97]"
              >
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-all"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-all"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
