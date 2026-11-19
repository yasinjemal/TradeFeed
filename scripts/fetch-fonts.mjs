#!/usr/bin/env node
/**
 * Fetch the TF display faces from Fontshare into public/fonts/<VERSION>/.
 *
 * WHY THIS EXISTS INSTEAD OF COMMITTED BINARIES
 * ---------------------------------------------
 * Clash Display, General Sans and Boska are Indian Type Foundry faces under
 * the ITF Free Font License v2.0. Section 01 is explicit that we may
 * self-host them:
 *
 *   "You may self-host the Font Software on your own servers or
 *    infrastructure for use on your own websites and applications,
 *    including through standard webfont technologies such as CSS
 *    @font-face. Self-hosting by end users is permitted and recommended."
 *
 * Section 02 is equally explicit that we may not redistribute them, naming
 * a "repository" and "publicly accessible servers" among the prohibited
 * channels. github.com/yasinjemal/TradeFeed is public, so the .woff2 files
 * are gitignored and fetched at build time instead. Serving them from
 * tradefeed.co.za is self-hosting; committing them to a public repo would
 * be redistribution.
 *
 * If the repo is ever made private, this script can be deleted and the
 * files committed directly — see public/fonts/README.md.
 *
 * Section 02 also forbids subsetting and format conversion, so the files
 * are written byte-for-byte as Fontshare serves them. Do not add a subset,
 * recompress or re-flavour step here.
 *
 * Run: node scripts/fetch-fonts.mjs        (npm run fonts:fetch)
 * Hooked to predev and prebuild; a no-op once the files are in place.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Bump VERSION when a face is rolled. The directory is part of the URL and
 * public/sw.js caches same-origin fonts cache-first with no revalidation,
 * so a file overwritten in place would stay stale in warm service workers
 * forever. Never overwrite — always bump.
 */
const VERSION = "v1";
const OUT_DIR = path.join(process.cwd(), "public", "fonts", VERSION);

/**
 * One variable file per family. A variable face covers every weight the app
 * uses in a single request, and for all three families it is far smaller
 * than the statics it replaces:
 *   Clash Display  300/500/600/700      4 statics 62KB -> 1 variable 29KB
 *   General Sans   400/550/600/650/700  5 statics 93KB -> 1 variable 38KB
 *   Boska          400/500              2 statics 63KB -> 1 variable 47KB
 * The 550 and 650 half-steps on the homepage (components/storefront/
 * storefront.module.css) only render as authored with a variable face;
 * statics would snap them to 600 and 700.
 *
 * sha256 is the file Fontshare served when this was written. A mismatch is
 * not fatal — ITF may ship a revision — but it is reported loudly so the
 * change is a decision rather than a surprise.
 */
const FAMILIES = [
  {
    slug: "clash-display",
    file: "ClashDisplay-Variable.woff2",
    axis: "200 700",
    sha256: "e0ec5644c93b04de",
    approxBytes: 29432,
  },
  {
    slug: "general-sans",
    file: "GeneralSans-Variable.woff2",
    axis: "200 700",
    sha256: "49d3fbd2f1bcc985",
    approxBytes: 38132,
  },
  {
    slug: "boska",
    file: "Boska-Variable.woff2",
    axis: "200 900",
    sha256: "a196ec634df15b51",
    approxBytes: 47276,
  },
];

/** Fontshare's /v2/css endpoint honours only the FIRST f[] parameter and
 *  silently drops the rest — the bug that left this app requesting three
 *  families and receiving one for months. Always request a single family
 *  per call. "@1" selects the variable file. */
const cssUrl = (slug) =>
  `https://api.fontshare.com/v2/css?f%5B%5D=${encodeURIComponent(slug)}@1&display=swap`;

const WOFF2_MAGIC = "wOF2";
const SIZE_TOLERANCE = 0.5; // accept a revision up to 50% off the known size

function sha(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function get(url, as) {
  const res = await fetch(url, {
    headers: { "user-agent": "TradeFeed font fetch (build step)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return as === "buffer" ? Buffer.from(await res.arrayBuffer()) : res.text();
}

async function fetchFamily(family) {
  const css = await get(cssUrl(family.slug), "text");

  const weight = /font-weight:\s*([0-9]+\s+[0-9]+)/.exec(css)?.[1];
  if (weight !== family.axis) {
    throw new Error(
      `${family.slug}: expected a variable face with axis "${family.axis}", got "${weight ?? "none"}". ` +
        `Fontshare may have changed its API; check the response before trusting it.`,
    );
  }

  const href = /url\('(\/\/cdn\.fontshare\.com[^']+\.woff2)'\)/.exec(css)?.[1];
  if (!href) throw new Error(`${family.slug}: no woff2 URL in the Fontshare stylesheet`);

  const buf = await get(`https:${href}`, "buffer");

  if (buf.subarray(0, 4).toString("latin1") !== WOFF2_MAGIC) {
    throw new Error(`${family.slug}: downloaded file is not woff2`);
  }
  const drift = Math.abs(buf.length - family.approxBytes) / family.approxBytes;
  if (drift > SIZE_TOLERANCE) {
    throw new Error(
      `${family.slug}: ${buf.length} bytes, expected ~${family.approxBytes}. Refusing a file this far off.`,
    );
  }

  const digest = sha(buf);
  if (!digest.startsWith(family.sha256)) {
    console.warn(
      `  ! ${family.file} differs from the pinned build (sha256 ${digest.slice(0, 16)}…, ` +
        `expected ${family.sha256}…). Probably an ITF revision. Check it renders, then update ` +
        `the sha256 in scripts/fetch-fonts.mjs and bump VERSION.`,
    );
  }
  return buf;
}

async function alreadyPresent(family) {
  const dest = path.join(OUT_DIR, family.file);
  if (!existsSync(dest)) return false;
  const buf = await readFile(dest);
  return buf.subarray(0, 4).toString("latin1") === WOFF2_MAGIC && buf.length > 1024;
}

async function main() {
  // A missing font is a degraded design, not a broken page: every TF token
  // falls back through a metric-matched local face to Inter. So a developer
  // offline still gets a working app, while a release build fails loudly
  // rather than shipping Inter to production by accident.
  const strict = Boolean(process.env.CI || process.env.VERCEL);

  await mkdir(OUT_DIR, { recursive: true });

  const pending = [];
  for (const family of FAMILIES) {
    if (await alreadyPresent(family)) continue;
    pending.push(family);
  }

  if (pending.length === 0) {
    const have = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".woff2"));
    console.log(`fonts: ${have.length} face(s) already in public/fonts/${VERSION}, nothing to do`);
    return;
  }

  console.log(`fonts: fetching ${pending.length} face(s) into public/fonts/${VERSION}`);
  const failures = [];

  for (const family of pending) {
    try {
      const buf = await fetchFamily(family);
      await writeFile(path.join(OUT_DIR, family.file), buf);
      console.log(`  + ${family.file} (${buf.length} bytes, wght ${family.axis})`);
    } catch (error) {
      failures.push(`${family.slug}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (failures.length === 0) return;

  const message = `fonts: could not fetch ${failures.length} face(s)\n  ${failures.join("\n  ")}`;
  if (strict) {
    console.error(`${message}\n\nRefusing to build without the display faces.`);
    process.exit(1);
  }
  console.warn(`${message}\n  Continuing — the TF tokens fall back to Inter until these land.`);
}

main().catch((error) => {
  console.error("fonts:", error instanceof Error ? error.message : error);
  process.exit(process.env.CI || process.env.VERCEL ? 1 : 0);
});
