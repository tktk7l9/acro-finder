#!/usr/bin/env python3
"""Builds app/fonts/inter-tight.woff2, the Inter Tight file app/layout.tsx self-hosts.

next/font/google served Google's latin subset of Inter Tight with the whole weight axis
(100-900, 45 KB), and a separate 90 KB latin-ext file that one facility name (Dōjō) pulled
in. This file has the same characters as Google's latin subset plus the macron vowels of
romanized Japanese, and only the 400-700 weights the CSS uses (800 rendered as 700 before
too): 28 KB, and the latin-ext file is gone.

The outlines are Google's (same Inter Tight 3.004 source); limiting the axis moves points
by at most 1/2048 em at 500-700. A character outside CODEPOINTS falls back to the next
font in --font-en (globals.css), as it did before for anything outside Google's subsets.

Run manually when the characters or weights change:
  python3 -m pip install fonttools brotli
  python3 scripts/build-fonts.py
"""

import io
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

# google/fonts at the commit that added Inter Tight 3.004 (the version fonts.gstatic.com serves).
SOURCE = (
    "https://raw.githubusercontent.com/google/fonts/"
    "fac60545cc0de9d4eff6eb5b1ab88bcdfc9ecc69/ofl/intertight/InterTight%5Bwght%5D.ttf"
)
OUT = Path(__file__).resolve().parent.parent / "app" / "fonts" / "inter-tight.woff2"

# The characters of Google's "latin" subset of Inter Tight ...
LATIN = (
    "0020-007E,00A0-00FF,0131,0152-0153,02BB-02BC,02C6,02DA,02DC,0304,0308,0329,"
    "2002,2009,200B,2013-2014,2018-201A,201C-201E,2022,2026,2032-2033,2039-203A,2044,"
    "20AC,2122,2191,2193,2212,FEFF"
)
# ... plus Ā ā Ē ē Ī ī Ō ō Ū ū (romanized Japanese, e.g. "Dōjō" in lib/data.ts).
MACRONS = "0100-0101,0112-0113,012A-012B,014C-014D,016A-016B"
CODEPOINTS = f"{LATIN},{MACRONS}"

# The OpenType features Google's latin subset keeps.
FEATURES = ["calt", "ccmp", "dnom", "frac", "kern", "locl", "mark", "numr", "pnum", "tnum"]


def unicodes(spec: str) -> list[int]:
    out: list[int] = []
    for part in spec.split(","):
        first, _, last = part.partition("-")
        out.extend(range(int(first, 16), int(last or first, 16) + 1))
    return out


def main() -> None:
    with urllib.request.urlopen(SOURCE) as res:
        font = TTFont(io.BytesIO(res.read()))
    font = instantiateVariableFont(font, {"wght": (400, 700)})
    # Round-trip through bytes: the subsetter cannot read the instancer's in-memory gvar.
    buffer = io.BytesIO()
    font.save(buffer)
    buffer.seek(0)
    font = TTFont(buffer)

    options = subset.Options()
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.flavor = "woff2"
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes(CODEPOINTS))
    subsetter.subset(font)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(OUT)
    print(f"{OUT.relative_to(OUT.parent.parent.parent)}: {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
