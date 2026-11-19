import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  SELLER_CTA_LABEL,
  SELLER_DASHBOARD_LABEL,
  SELLER_ONBOARDING_PATH,
  SELLER_SIGN_UP_PATH,
  sellerCta,
} from "@/lib/config/seller-cta";

test("a signed-out visitor is sent to sign-up with the one label", () => {
  assert.deepEqual(sellerCta(), { href: "/sign-up", label: "Create your free shop" });
  assert.deepEqual(sellerCta({ isSignedIn: false }), {
    href: SELLER_SIGN_UP_PATH,
    label: SELLER_CTA_LABEL,
  });
});

test("a signed-in visitor without a shop goes straight to /get-started", () => {
  assert.deepEqual(sellerCta({ isSignedIn: true, dashboardSlug: null }), {
    href: "/get-started",
    label: SELLER_CTA_LABEL,
  });
  assert.equal(SELLER_ONBOARDING_PATH, "/get-started");
});

test("a seller who already has a shop goes to their dashboard", () => {
  assert.deepEqual(sellerCta({ isSignedIn: true, dashboardSlug: "kasi-kicks" }), {
    href: "/dashboard/kasi-kicks",
    label: SELLER_DASHBOARD_LABEL,
  });
});

// ── Regression guard ────────────────────────────────────────
// /create-shop is a redirect now. A link to it works, but costs an
// extra hop and means someone bypassed sellerCta(); catch it here.

const ROOT = process.cwd();
const SCANNED_DIRS = ["app", "components"];
// The redirect itself, and route lists that must keep naming the old path.
const ALLOWED = new Set([
  join("app", "create-shop", "page.tsx"),
  join("app", "robots.ts"),
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

test("no page or component links to the retired /create-shop flow", () => {
  const offenders = SCANNED_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir)))
    .filter((file) => !ALLOWED.has(relative(ROOT, file)))
    .filter((file) => /["'`(]\/create-shop(?![-\w])/.test(readFileSync(file, "utf8")))
    .map((file) => relative(ROOT, file).split(sep).join("/"));

  assert.deepEqual(offenders, []);
});
