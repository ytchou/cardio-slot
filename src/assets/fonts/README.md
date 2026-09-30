# Chinese UI font

Noto Sans TC variable font, subset from google/fonts commit
`3be1884c48c3e45b52ecc725676a08f87776373e`, `ofl/notosanstc/NotoSansTC[wght].ttf`.
License: adjacent OFL.txt. CSS alias: Cardio Sans TC. No runtime font service.

When Chinese copy changes, download the pinned upstream TTF and regenerate:

```sh
curl -fL 'https://raw.githubusercontent.com/google/fonts/3be1884c48c3e45b52ecc725676a08f87776373e/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf' -o /tmp/noto-sans-tc.ttf
uv run --with 'fonttools[woff]' scripts/subset-chinese-font.py /tmp/noto-sans-tc.ttf
```

The script includes non-ASCII src text, printable ASCII and date/punctuation characters,
retains shaping features and checks Chinese glyph coverage. New characters otherwise
use the system fallback. WOFF2 is included in the existing PWA precache.
