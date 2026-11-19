// ============================================================
// Company identity — who operates TradeFeed
// ============================================================
// Single source for the "who are we dealing with" facts shown in
// the public footer, on /about, and in the Organization JSON-LD.
//
// RULE: nothing in this file may be invented. A field the owner
// has not supplied stays `null` (or an empty list). `null` fields
// are omitted from the production site and from structured data;
// on local and preview builds they render as a visible
// "TODO" marker so the gap is obvious before launch.
// ============================================================

import { SUPPORT_EMAIL } from "@/lib/config/site";

export interface CompanyAddress {
  /** Street address, e.g. "12 Example Road, Unit 4" */
  street: string;
  /** Suburb / city, e.g. "Johannesburg" */
  locality: string;
  /** Province, e.g. "Gauteng" */
  region: string;
  postalCode: string;
}

export interface CompanyProfile {
  /** The brand customers see. */
  brandName: string;
  /** Registered legal entity that operates the brand. */
  legalName: string | null;
  /** Company registration number as it appears on the registration certificate. */
  registrationNumber: string | null;
  /** VAT number — only if the entity is VAT registered. */
  vatNumber: string | null;
  /** Physical address of the business. */
  address: CompanyAddress | null;
  /** Plain-language support hours, e.g. "Mon–Fri 08:00–17:00 SAST". */
  supportHours: string | null;
  supportEmail: string;
  /** Support WhatsApp number, digits only with country code. */
  supportWhatsApp: string;
  /** Official profile URLs (Facebook, Instagram, TikTok, LinkedIn, X…). */
  socialLinks: readonly string[];
}

export const COMPANY: CompanyProfile = {
  brandName: "TradeFeed",

  // TODO(owner): registered legal name of the business that operates TradeFeed.
  legalName: null,
  // TODO(owner): company registration number.
  registrationNumber: null,
  // TODO(owner): VAT number, or leave null if not VAT registered.
  vatNumber: null,
  // TODO(owner): physical business address.
  address: null,
  // TODO(owner): support hours, including the time zone.
  supportHours: null,

  // Already published on /contact — real, not placeholders.
  supportEmail: SUPPORT_EMAIL,
  supportWhatsApp: "27835034502",

  // TODO(owner): official social profile URLs. Feeds Organization `sameAs`.
  socialLinks: [],
};

/** "+27 83 503 4502" from "27835034502". Other shapes are returned with a leading "+". */
export function formatWhatsAppNumber(digits: string): string {
  const match = /^27(\d{2})(\d{3})(\d{4})$/.exec(digits);
  return match ? `+27 ${match[1]} ${match[2]} ${match[3]}` : `+${digits}`;
}

export function formatCompanyAddress(address: CompanyAddress): string {
  return [address.street, address.locality, address.region, address.postalCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export interface CompanyDetailRow {
  key: "legalName" | "registrationNumber" | "vatNumber" | "address" | "supportHours";
  label: string;
  /** The real value, or `null` when the owner has not supplied it. */
  value: string | null;
}

/**
 * The legal-identity rows for the footer and /about.
 *
 * With `includeMissing: false` (production) only supplied values are
 * returned, so the live site never shows a placeholder. With
 * `includeMissing: true` (local and preview) every row is returned
 * and the caller marks the `null` ones as TODO.
 *
 * VAT is optional by nature, so it never appears as a TODO.
 */
export function companyDetailRows(
  company: CompanyProfile,
  { includeMissing }: { includeMissing: boolean },
): CompanyDetailRow[] {
  const rows: CompanyDetailRow[] = [
    { key: "legalName", label: "Operated by", value: company.legalName },
    { key: "registrationNumber", label: "Registration number", value: company.registrationNumber },
    { key: "vatNumber", label: "VAT number", value: company.vatNumber },
    {
      key: "address",
      label: "Address",
      value: company.address ? formatCompanyAddress(company.address) : null,
    },
    { key: "supportHours", label: "Support hours", value: company.supportHours },
  ];
  return rows.filter(
    (row) => row.value !== null || (includeMissing && row.key !== "vatNumber"),
  );
}

/**
 * Whether unfilled company details should render as visible TODO
 * markers. True everywhere except the production deployment.
 * Server-side only (VERCEL_ENV is not exposed to the browser).
 */
export function showCompanyTodos(env: {
  VERCEL_ENV?: string;
  NODE_ENV?: string;
} = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== "production";
  return env.NODE_ENV !== "production";
}
