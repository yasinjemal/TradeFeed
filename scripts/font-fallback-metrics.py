#!/usr/bin/env python3
"""Regenerate the metric-override descriptors for the fallback faces in
app/globals.css.

A webfont and the local face that stands in for it while it loads have
different advance widths and different vertical metrics, so the swap reflows
the page. `size-adjust` and the `*-override` descriptors reshape the local
face to occupy exactly the same space, which turns the swap into a change of
letterform with no layout shift.

Run this whenever a face is rolled (a new public/fonts/vN), then paste the
output into the "Metric-matched stand-ins" block in app/globals.css. Do not
hand-edit those percentages.

    pip install fonttools
    python scripts/font-fallback-metrics.py

WHY PYTHON IN A NODE REPO
    Each face is measured at the weight it actually renders at, because
    advance widths grow with weight on a variable font and a stand-in tuned
    to Regular is too narrow for a Semibold headline. That needs variable
    instancing, and fontTools is the only parser on hand that does it
    correctly — the fontkit vendored inside next/font has a stripped
    getVariation that returns undefined. This is a maintenance tool a
    developer runs by hand, not part of dev, build or CI, so it costs the
    app nothing.

Instancing happens in memory only. Nothing is written back to a font file:
the ITF Free Font License forbids altering them.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
except ImportError:  # pragma: no cover - developer tooling
    sys.exit("fonttools is not installed. Run: pip install fonttools")

FONT_DIR = Path("public/fonts/v1")

# A stand-in is only as good as the sample it was tuned on, and the two kinds
# of face here render very different text.
#
# PROSE is next/font's sample: 36 lowercase letters weighted by English
# frequency, plus 6 spaces. Right for a face that sets real sentences.
#
# DISPLAY is for the hero face, which never sets prose. It paints seller
# nameplates — and sellers type them in capitals as often as not — plus
# sentence-case headlines and rand prices. Clash Display's capitals and
# figures are far narrower relative to Arial than its lowercase is, so tuning
# the hero stand-in on lowercase made it 13.5% too wide for an all-caps shop
# name, which wrapped the nameplate onto a second line until the real font
# arrived. Measured on this sample instead, that case fits on one line and the
# nameplate does not move at all.
SAMPLES = {
    "prose": "aaabcdeeeefghiijklmnnoopqrrssttuvwxyz      ",
    "display": (
        "MEN'S CORNERS RUT TRENDYS COSMETIC STORE "
        "Trendys Cosmetic Store Health Wealth Happiness "
        "Honest pricing in rand Sell online One link Everything you need "
        "R99 R1 299 R2 499"
    ),
}

# Mean advance of each system face over each sample, in font units. The prose
# figure for Arial is the one next/font ships, and this script reproduces it
# exactly — a useful check that the measurement agrees with Next's.
SYSTEM_FACES = {
    "Arial": {"unitsPerEm": 2048, "prose": 934.5116279070, "display": 1029.4142011834},
    "Times New Roman": {"unitsPerEm": 2048, "prose": 854.3953488372},
}

# (css fallback family, file, weight it renders at, system face, sample)
TARGETS = [
    ("Clash Display Fallback", "ClashDisplay-Variable.woff2", 600, "Arial", "display"),
    ("General Sans Fallback", "GeneralSans-Variable.woff2", 600, "Arial", "prose"),
    ("Boska Fallback", "Boska-Variable.woff2", 400, "Times New Roman", "prose"),
]


def average_advance(font: TTFont, sample: str) -> float:
    cmap, hmtx = font.getBestCmap(), font["hmtx"]
    widths = [hmtx[cmap[ord(c)]][0] for c in sample if ord(c) in cmap]
    if not widths:
        raise SystemExit("font has none of the sample characters")
    return sum(widths) / len(widths) / font["head"].unitsPerEm


def descriptors(path: Path, weight: int, system: str, sample_name: str) -> dict[str, str]:
    font = TTFont(path)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=False, updateFontNames=False)

    reference = SYSTEM_FACES[system]
    if sample_name not in reference:
        raise SystemExit(f"no {sample_name!r} reference width for {system}")
    sample = SAMPLES[sample_name]
    size_adjust = average_advance(font, sample) / (reference[sample_name] / reference["unitsPerEm"])

    upem, hhea = font["head"].unitsPerEm, font["hhea"]
    pct = lambda value: f"{abs(value) * 100:.2f}%"  # noqa: E731
    return {
        "size-adjust": pct(size_adjust),
        "ascent-override": pct(hhea.ascent / (upem * size_adjust)),
        "descent-override": pct(hhea.descent / (upem * size_adjust)),
        "line-gap-override": pct(hhea.lineGap / (upem * size_adjust)),
    }


def main() -> None:
    missing = [f for _, f, _, _, _ in TARGETS if not (FONT_DIR / f).exists()]
    if missing:
        sys.exit(f"missing from {FONT_DIR}: {', '.join(missing)}\nRun: npm run fonts:fetch")

    for css_family, filename, weight, system, sample_name in TARGETS:
        values = descriptors(FONT_DIR / filename, weight, system, sample_name)
        print("@font-face {")
        print(f'  font-family: "{css_family}";')
        print(f"  /* {sample_name} sample, measured against {system} at weight {weight} */")
        for key, value in values.items():
            print(f"  {key}: {value};")
        print("}\n")


if __name__ == "__main__":
    main()
