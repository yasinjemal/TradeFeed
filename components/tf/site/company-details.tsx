import {
  COMPANY,
  companyDetailRows,
  formatWhatsAppNumber,
  showCompanyTodos,
} from "@/lib/config/company";
import { cn } from "@/lib/utils";

// ============================================================
// TfCompanyDetails — who operates TradeFeed, and how to reach us
// ============================================================
// Rendered in the public footer and on /about. Values come from
// lib/config/company.ts and are never invented here.
//
// A detail the owner has not supplied is omitted on the production
// deployment. On local and preview builds it renders as a dashed
// "TODO" chip instead, so the gap is impossible to miss in review
// and impossible to ship by accident.
//
// Server component: showCompanyTodos() reads VERCEL_ENV.
// ============================================================

const WHATSAPP_MESSAGE = "Hi TradeFeed, I need help with...";

export function TfCompanyDetails({ className }: { className?: string }) {
  const rows = companyDetailRows(COMPANY, { includeMissing: showCompanyTodos() });
  const whatsappHref = `https://wa.me/${COMPANY.supportWhatsApp}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  const linkCls =
    "underline decoration-tf-stone-300 underline-offset-2 transition-colors hover:text-tf-ink";

  return (
    <dl className={cn("grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2", className)}>
      {rows.map((row) => (
        <div key={row.key}>
          <dt className="text-xs font-medium uppercase tracking-wider text-tf-stone-500">
            {row.label}
          </dt>
          <dd className="mt-0.5 text-tf-stone-600">
            {row.value ?? (
              <span
                data-company-todo={row.key}
                className="inline-block rounded border border-dashed border-tf-warning bg-tf-warning-soft px-1.5 py-0.5 text-xs font-medium text-tf-ink"
              >
                TODO — owner to supply (hidden in production)
              </span>
            )}
          </dd>
        </div>
      ))}
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-tf-stone-500">Email</dt>
        <dd className="mt-0.5 text-tf-stone-600">
          <a href={`mailto:${COMPANY.supportEmail}`} className={linkCls}>
            {COMPANY.supportEmail}
          </a>
        </dd>
      </div>
      <div>
        <dt className="text-xs font-medium uppercase tracking-wider text-tf-stone-500">
          WhatsApp support
        </dt>
        <dd className="mt-0.5 text-tf-stone-600">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={linkCls}>
            {formatWhatsAppNumber(COMPANY.supportWhatsApp)}
          </a>
        </dd>
      </div>
    </dl>
  );
}
