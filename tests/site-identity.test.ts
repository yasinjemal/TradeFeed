import test from "node:test";
import assert from "node:assert/strict";
import { PRODUCTION_ORIGIN, resolveSiteUrl } from "@/lib/seo/site-url";
import {
  COMPANY,
  companyDetailRows,
  formatCompanyAddress,
  formatWhatsAppNumber,
  showCompanyTodos,
  type CompanyProfile,
} from "@/lib/config/company";
import { generateSiteJsonLd } from "@/lib/seo/json-ld";

// ── Site origin ─────────────────────────────────────────────

test("production never falls back to localhost", () => {
  assert.equal(resolveSiteUrl({ NODE_ENV: "production" }), PRODUCTION_ORIGIN);
  assert.equal(resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "" }), PRODUCTION_ORIGIN);
  for (const local of [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost",
    "http://[::1]:3000",
  ]) {
    assert.equal(
      resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: local }),
      PRODUCTION_ORIGIN,
      local,
    );
  }
  assert.equal(
    resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "not a url" }),
    PRODUCTION_ORIGIN,
  );
});

test("a configured origin is used, without a trailing slash", () => {
  assert.equal(
    resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://tradefeed.co.za/" }),
    "https://tradefeed.co.za",
  );
  assert.equal(
    resolveSiteUrl({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://staging.example.com" }),
    "https://staging.example.com",
  );
});

test("development keeps the localhost fallback", () => {
  assert.equal(resolveSiteUrl({ NODE_ENV: "development" }), "http://localhost:3000");
  assert.equal(
    resolveSiteUrl({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://localhost:3001" }),
    "http://localhost:3001",
  );
});

// ── Company details ─────────────────────────────────────────

const unfilled: CompanyProfile = {
  ...COMPANY,
  legalName: null,
  registrationNumber: null,
  vatNumber: null,
  address: null,
  supportHours: null,
  socialLinks: [],
};

const filled: CompanyProfile = {
  ...unfilled,
  legalName: "Example Trading (Pty) Ltd",
  registrationNumber: "2020/000000/07",
  address: { street: "1 Example Road", locality: "Johannesburg", region: "Gauteng", postalCode: "2000" },
  supportHours: "Mon–Fri 08:00–17:00 SAST",
  socialLinks: ["https://www.instagram.com/example"],
};

test("production shows no placeholder for a detail the owner has not supplied", () => {
  assert.deepEqual(companyDetailRows(unfilled, { includeMissing: false }), []);
});

test("previews list every missing detail except the optional VAT number", () => {
  const rows = companyDetailRows(unfilled, { includeMissing: true });
  assert.deepEqual(
    rows.map((row) => row.key),
    ["legalName", "registrationNumber", "address", "supportHours"],
  );
  assert.ok(rows.every((row) => row.value === null));
});

test("supplied details are shown in both modes", () => {
  for (const includeMissing of [true, false]) {
    const rows = companyDetailRows(filled, { includeMissing });
    assert.deepEqual(
      rows.map((row) => [row.key, row.value]),
      [
        ["legalName", "Example Trading (Pty) Ltd"],
        ["registrationNumber", "2020/000000/07"],
        ["address", "1 Example Road, Johannesburg, Gauteng, 2000"],
        ["supportHours", "Mon–Fri 08:00–17:00 SAST"],
      ],
    );
  }
});

test("TODO markers show on local and preview builds, never on the production deployment", () => {
  assert.equal(showCompanyTodos({ VERCEL_ENV: "production", NODE_ENV: "production" }), false);
  assert.equal(showCompanyTodos({ VERCEL_ENV: "preview", NODE_ENV: "production" }), true);
  assert.equal(showCompanyTodos({ NODE_ENV: "development" }), true);
  assert.equal(showCompanyTodos({ NODE_ENV: "production" }), false);
});

test("formatters", () => {
  assert.equal(formatWhatsAppNumber("27835034502"), "+27 83 503 4502");
  assert.equal(formatWhatsAppNumber("447700900123"), "+447700900123");
  assert.equal(
    formatCompanyAddress({ street: "1 Example Road", locality: "Durban", region: "", postalCode: "4001" }),
    "1 Example Road, Durban, 4001",
  );
});

// ── Organization JSON-LD ────────────────────────────────────

test("Organization schema carries a real contact point and no invented facts", () => {
  const [organization] = generateSiteJsonLd(unfilled);
  assert.ok(organization);
  assert.deepEqual(organization.contactPoint, {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: unfilled.supportEmail,
    telephone: "+27835034502",
    url: `${organization.url}/contact`,
    areaServed: "ZA",
    availableLanguage: ["English"],
  });
  for (const absent of ["sameAs", "legalName", "address", "vatID"]) {
    assert.equal(absent in organization, false, `${absent} must be omitted until supplied`);
  }
});

test("Organization schema picks up owner-supplied identity and social links", () => {
  const [organization] = generateSiteJsonLd(filled);
  assert.ok(organization);
  assert.equal(organization.legalName, "Example Trading (Pty) Ltd");
  assert.deepEqual(organization.sameAs, ["https://www.instagram.com/example"]);
  assert.deepEqual(organization.address, {
    "@type": "PostalAddress",
    streetAddress: "1 Example Road",
    addressLocality: "Johannesburg",
    addressRegion: "Gauteng",
    postalCode: "2000",
    addressCountry: "ZA",
  });
  assert.equal(
    (organization.contactPoint as { hoursAvailable?: string }).hoursAvailable,
    undefined,
    "free-text hours are not valid OpeningHoursSpecification",
  );
});
