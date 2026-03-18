import { cn } from "@/lib/utils";

type TrustBadgeVariant =
  | "verified"
  | "response-time"
  | "top-seller"
  | "new-seller"
  | "promoted";

interface TrustBadgeProps {
  variant: TrustBadgeVariant;
  label?: string;
  className?: string;
  small?: boolean;
}

const badgeStyles: Record<
  TrustBadgeVariant,
  { className: string; icon: React.ReactNode; defaultLabel: string }
> = {
  verified: {
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    defaultLabel: "Verified Seller",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  "response-time": {
    className: "border border-sky-200 bg-sky-50 text-sky-700",
    defaultLabel: "Fast Responder",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "top-seller": {
    className: "border border-amber-200 bg-amber-50 text-amber-700",
    defaultLabel: "Top Seller",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
  },
  "new-seller": {
    className: "border border-slate-200 bg-slate-50 text-slate-700",
    defaultLabel: "New Seller",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  promoted: {
    className: "border border-amber-200 bg-amber-50 text-amber-700",
    defaultLabel: "Promoted Listing",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656zm8.475 1.768a.75.75 0 00-1.06 1.06l.69.69H8.75a.75.75 0 000 1.5h2.527l-.69.69a.75.75 0 101.06 1.06l1.97-1.97a.75.75 0 000-1.06l-1.97-1.97z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

export function TrustBadge({ variant, label, className, small = false }: TrustBadgeProps) {
  const config = badgeStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        small ? "gap-1 px-2 py-1 text-[11px]" : "gap-1.5 px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      {config.icon}
      <span>{label ?? config.defaultLabel}</span>
    </span>
  );
}