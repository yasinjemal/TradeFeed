# Display faces

The `.woff2` files that belong in `v1/` are **not in this repo on purpose.**

TradeFeed's three display faces — Clash Display (`--font-tf-hero`), General
Sans (`--font-tf-display`) and Boska (`--font-tf-editorial`) — are Indian Type
Foundry faces distributed through Fontshare under the ITF Free Font License
v2.0, a copy of which is in `LICENSE-ITF-FFL.txt`.

The licence says two things that together decide the setup here.

**§01 permits self-hosting, and recommends it:**

> You may self-host the Font Software on your own servers or infrastructure
> for use on your own websites and applications, including through standard
> webfont technologies such as CSS @font-face. Self-hosting by end users is
> permitted and recommended for greater control, reliability and performance.

**§02 forbids redistribution,** naming a "repository" and "publicly accessible
servers" among the prohibited channels. `github.com/yasinjemal/TradeFeed` is
public, so committing the binaries here would hand a downloadable copy to
anyone who clones it. Serving them from `tradefeed.co.za` is self-hosting;
committing them is not.

So the files are gitignored and fetched at build time:

```bash
npm run fonts:fetch
```

`predev` and `prebuild` run it for you, and it is a no-op once the files are
present. A release build (`CI` or `VERCEL` set) fails if a face cannot be
fetched, so production never silently falls back to Inter. Local development
only warns.

**If this repo is ever made private,** the simpler setup becomes available:
delete `scripts/fetch-fonts.mjs`, drop the `/public/fonts/*/*.woff2` line from
`.gitignore`, commit the three files, and remove the `predev`/`prebuild`
hooks. Nothing else changes — the `@font-face` rules in `app/globals.css`
point at these paths either way.

## Rules for whoever touches this next

- **Never modify the files.** §02 forbids subsetting, format conversion and
  metadata edits. Ship them byte-for-byte as Fontshare serves them. (Subsetting
  to Latin was measured at ~7% — the faces are already Latin-only, so there is
  nothing to gain anyway.)
- **Never overwrite a file in place.** `public/sw.js` caches same-origin fonts
  cache-first with no revalidation, so a warm service worker would keep the old
  bytes indefinitely. Bump `VERSION` in `scripts/fetch-fonts.mjs`, create
  `v2/`, and update the paths in `app/globals.css` and
  `components/tf/tf-fonts.tsx`.
- **Never offer these faces to sellers.** §02 forbids making the Font Software
  "available as a selectable font for third-party users". `THEME_FONTS` in
  `lib/config/themes.ts` is a closed allowlist of five SIL OFL Google Fonts —
  keep it that way.
- **Request one family per Fontshare call.** The `/v2/css` endpoint honours
  only the first `f[]` parameter and silently drops the rest. Asking for three
  families in one URL is what left this app requesting Clash Display and
  General Sans for months while receiving neither.
