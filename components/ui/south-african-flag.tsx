import { cn } from "@/lib/utils";

interface SouthAfricanFlagProps {
  className?: string;
  title?: string;
}

/** Accurate 3:2 South African flag mark, based on the constitutional flag geometry. */
export function SouthAfricanFlag({ className, title }: SouthAfricanFlagProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 90 60"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={title}
      className={cn("overflow-hidden rounded-[2px] shadow-sm", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id="sa-flag-triangle"><path d="M0 0 45 30 0 60z" /></clipPath>
        <clipPath id="sa-flag-bounds"><path d="M0 0h90v60H0z" /></clipPath>
      </defs>
      <path fill="#E03C31" d="M0 0h90v30H45z" />
      <path fill="#001489" d="M0 60h90V30H45z" />
      <g clipPath="url(#sa-flag-bounds)" fill="none">
        <path stroke="#FFF" strokeWidth="20" d="M90 30H45L0 0v60l45-30" />
        <path fill="#000" stroke="#FFB81C" strokeWidth="20" clipPath="url(#sa-flag-triangle)" d="M0 0 45 30 0 60" />
        <path stroke="#007749" strokeWidth="12" d="M0 0 45 30h45M0 60l45-30" />
      </g>
    </svg>
  );
}
