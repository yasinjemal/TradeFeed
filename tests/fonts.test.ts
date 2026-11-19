import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// The display faces are self-hosted. These tests pin the invariants that
// make that true, because each of them failed silently once already:
// Fontshare was asked for three families and delivered one, and nothing in
// the build, the types or the tests noticed for months.

const root = process.cwd();
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const globals = read("app/globals.css");
const tfFonts = read("components/tf/tf-fonts.tsx");
const fetchScript = read("scripts/fetch-fonts.mjs");
const proxy = read("proxy.ts");

/** Every url(...) inside an @font-face src in globals.css. */
function declaredFontUrls(): string[] {
  return [...globals.matchAll(/src:\s*url\("([^"]+\.woff2)"\)/g)].map((m) => m[1]!);
}

/** An actual Fontshare URL, as opposed to the host being named in prose. */
const FONTSHARE_URL = /\/\/(api|cdn)\.fontshare\.com/;

test("no source file reaches for Fontshare at runtime", () => {
  // A single stray <link> would put a render-blocking third-party stylesheet
  // back on the critical path — and reintroduce the multi-family bug.
  const files = {
    "app/globals.css": globals,
    "components/tf/tf-fonts.tsx": tfFonts,
    "proxy.ts": proxy,
    "components/tf/index.ts": read("components/tf/index.ts"),
  };
  for (const [name, source] of Object.entries(files)) {
    assert.ok(!FONTSHARE_URL.test(source), `${name} points at Fontshare again`);
  }
});

test("the CSP no longer allows Fontshare", () => {
  assert.ok(!FONTSHARE_URL.test(proxy), "CSP still allows a Fontshare origin");
  assert.match(proxy, /font-src 'self'/, "font-src must allow our own origin");
});

test("every declared face is one the fetch script produces", () => {
  const declared = declaredFontUrls();
  assert.equal(declared.length, 3, "expected one variable face per family");

  for (const url of declared) {
    const file = path.basename(url);
    assert.ok(
      fetchScript.includes(`file: "${file}"`),
      `${file} is declared in globals.css but scripts/fetch-fonts.mjs never fetches it`,
    );
    assert.match(
      url,
      /^\/fonts\/v\d+\//,
      `${url} must sit under a versioned directory — public/sw.js caches fonts ` +
        "cache-first with no revalidation, so an overwritten path stays stale forever",
    );
  }
});

test("the preloaded faces are faces we actually declare", () => {
  // A preload that misses its @font-face downloads the file for nothing and
  // leaves the real request to happen a second time.
  const preloads = [...tfFonts.matchAll(/"(\/fonts\/[^"]+\.woff2)"/g)].map((m) => m[1]!);
  assert.ok(preloads.length > 0, "TfHeroFont should preload at least one face");

  const declared = new Set(declaredFontUrls());
  for (const url of preloads) {
    assert.ok(declared.has(url), `${url} is preloaded but has no @font-face rule`);
  }
});

test("a preload is still gated behind the TF flags", () => {
  // Unlike an @font-face rule, a preload is not lazy: it downloads on every
  // page that renders it. This is the only thing that can make a flags-off
  // page pay for a font it never paints.
  assert.match(
    tfFonts,
    /if \(!FEATURE_FLAGS\.UI_REDESIGN && !FEATURE_FLAGS\.UI_REDESIGN_DASHBOARD\) return null;/,
    "TfHeroFont must render nothing while both TF flags are off",
  );
});

test("each token falls through a metric-matched face before Inter", () => {
  // Without these the swap reflows the page; with them it only changes
  // letterform. Order matters — the adjusted face has to come first.
  const chains: Array<[string, string]> = [
    ["--font-tf-hero", "Clash Display"],
    ["--font-tf-display", "General Sans"],
    ["--font-tf-editorial", "Boska"],
  ];

  for (const [token, family] of chains) {
    const line = globals
      .split("\n")
      .find((l) => l.trimStart().startsWith(`${token}:`));
    assert.ok(line, `${token} is missing from the theme`);

    const real = line.indexOf(`"${family}"`);
    const fallback = line.indexOf(`"${family} Fallback"`);
    assert.ok(fallback > -1, `${token} has no metric-matched fallback`);
    assert.ok(real > -1 && real < fallback, `${token} must list ${family} before its fallback`);

    const inter = line.indexOf("var(--font-inter)");
    if (inter > -1) {
      assert.ok(fallback < inter, `${token} must try the adjusted face before Inter`);
    }

    assert.ok(
      globals.includes(`font-family: "${family} Fallback";`),
      `no @font-face declares "${family} Fallback"`,
    );
  }
});

test("the homepage uses the font tokens rather than naming families itself", () => {
  // These were hardcoded, which quietly excluded the homepage — whose
  // headline is the LCP element — from the fallback chain above.
  const homepage = read("components/storefront/storefront.module.css");
  assert.ok(!homepage.includes('"General Sans"'), "storefront.module.css still names General Sans");
  assert.ok(!homepage.includes('"Boska"'), "storefront.module.css still names Boska");
});

test("the licence we ship under is in the repo", () => {
  // The ITF Free Font License permits self-hosting and forbids
  // redistribution, which is why the binaries are gitignored. Keep the terms
  // next to the thing they govern.
  const licence = read("public/fonts/LICENSE-ITF-FFL.txt");
  assert.match(licence, /ITF Free Font License/);
  assert.match(licence, /You may self-host the Font Software/);
});

test("the font binaries are not committed to this public repo", () => {
  const ignore = read(".gitignore");
  assert.match(
    ignore,
    /^\/public\/fonts\/\*\/\*\.woff2$/m,
    "the .woff2 files must stay gitignored — redistributing them breaks the licence",
  );
});

test("fetched faces are variable, so one file covers every weight used", () => {
  // Static faces would need four files for Clash Display alone, and would
  // snap the homepage's 550 and 650 half-steps to 600 and 700.
  for (const axis of ['axis: "200 700"', 'axis: "200 900"']) {
    assert.ok(fetchScript.includes(axis), `fetch-fonts.mjs no longer pins ${axis}`);
  }

  const dir = path.join(root, "public", "fonts", "v1");
  for (const match of fetchScript.matchAll(/file: "([^"]+\.woff2)"/g)) {
    const file = path.join(dir, match[1]!);
    if (!existsSync(file)) continue; // not fetched yet — predev/prebuild will
    const head = readFileSync(file).subarray(0, 4).toString("latin1");
    assert.equal(head, "wOF2", `${match[1]} is not a woff2 file`);
  }
});
