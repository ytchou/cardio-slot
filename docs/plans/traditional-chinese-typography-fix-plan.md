# Traditional Chinese typography fix — 2026-09-28

Scope: existing mobile-ui-tune-up worktree, direct /fix; no commit, push, or new worktree. Preserve previous UI work. Apply across cabinet, ticket, running cues, dialogs, and PNG. User authorized research and direct implementation. No agents.

## Findings and decisions

The app correctly declares zh-TW, but relies on device-dependent CJK fallback. Chinese inherits condensed Latin tracking, tight line height and heavy heading weights. Canvas also switches numeric data to a device-dependent Chinese face and does not await a Chinese font. These are the root causes addressed.

| Research angle | Evidence and application | Confidence |
|---|---|---|
| Regional glyphs | Taiwan typography is not interchangeable with all Traditional Chinese regions; choose Noto Sans TC and preserve zh-TW. | High |
| Typeface style | Hei/sans matches functional running instructions; keeping sans is a design judgment, not a universal readability law. | Medium |
| Character spacing | Preserve Han character proportions; remove Latin negative tracking from Chinese reels. | High |
| Punctuation | Keep full-width Chinese punctuation and contextual browser breaking; no blanket punctuation compression. | High |
| Line breaking | Use strict Chinese punctuation rules and normal word breaking; avoid keep-all and break-all for prose. | High |
| Mixed scripts | Preserve explicit existing spaces and distinct numeric runs; avoid experimental autospace dependency or inserting spaces between Han characters. | High |
| Line rhythm | Chinese body copy uses 1.65 line height; short controls/headings use tighter role-specific values. Exact values are design choices. | Medium |
| Weight hierarchy | Regular body, medium controls, semibold titles; reserve heavy display styling for identity. | Medium |
| Numeric hierarchy | Retain Latin numeric faces and tabular numerals across languages; timer remains primary. | Medium |
| Small/rotated screens | Verify 320px portrait and short landscape; avoid shrinking functional text below 16px. | Medium |
| Font delivery/offline | Bundle a WOFF2 variable-font subset; existing PWA precache includes WOFF2. Include license and regeneration script. | High |
| Canvas loading | Explicitly await requested Chinese faces and numeric faces with bounded fallback; page-wide font readiness can hang. | High |
| Accessibility | WCAG text-spacing values describe tolerated user overrides, not mandatory default typography. Preserve semantic result fallback. | High |

## Primary sources consulted

1. [W3C Chinese layout requirements](https://www.w3.org/TR/clreq/) — regional forms, square glyphs, punctuation, line breaks, mixed scripts, line gaps; September 2026 Group Note Draft, not a normative standard.
2. [W3C CSS Text 4](https://www.w3.org/TR/css-text-4/) — spacing/breaking model; draft features are not universally available.
3. [W3C internationalization line breaking](https://www.w3.org/International/articles/typography/linebreak.en) — script-dependent break opportunities.
4. [WCAG text spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) — user override requirements.
5. [Noto usage](https://github.com/notofonts/noto-docs/blob/main/docs/website/use.md) — regional family selection.
6. [Noto TC specimen](https://notofonts.github.io/noto-docs/specimen/NotoSansCJKtc/) — glyph design/family.
7. [Noto CJK formats](https://github.com/notofonts/noto-cjk/blob/main/Sans/README.md) — region-specific fonts and variable formats.
8. [Adobe Source Han Sans](https://github.com/adobe-fonts/source-han-sans) — regional and weight design.
9. [MDN text-autospace](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-autospace) — optional mixed-script spacing; deferred for compatibility.
10. [MDN line-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-break) — strict punctuation rules.
11. [MDN word-break](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/word-break) — normal CJK wrapping.
12. [MDN FontFaceSet.load](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/load) — explicit face/text selection; does not itself prove glyph coverage.
13. [Google Fonts CSS API](https://developers.google.com/fonts/docs/css2) — variable fonts/subsets.
14. [OFL usage](https://openfontlicense.org/how-to-use-ofl-fonts/) — redistribution/subsetting and license preservation.
15. [FontTools subset](https://fonttools.readthedocs.io/en/latest/subset/index.html) — reproducible WOFF2 subsetting.
16. [Web font best practices](https://web.dev/articles/font-best-practices) — delivery, subset size, fallback.
17. [Google Fonts Noto TC source](https://github.com/google/fonts/tree/3be1884c48c3e45b52ecc725676a08f87776373e/ofl/notosanstc) — pinned binary and OFL.

## Skeptic check and limitations

Book-layout conventions do not prescribe the best compact workout UI. No research proves one exact size or weight ideal while running; validate visually and eventually on a physical treadmill. Platform font rendering still varies. Apple HIG and Google Fonts Knowledge pages were JS-only in retrieval and were not used as supporting evidence. Fonts API success does not establish coverage, so verify the subset cmap separately. Critical assumption: all Chinese product copy is bundled in src; when copy changes regenerate the subset or new glyphs silently fall back. Fallback remains intentional on network/font failure. No full WCAG conformance claim.

## Implementation and verification

1. Bundle licensed, pinned TC font subset and repeatable generation command.
2. Scope Chinese typography by role; keep English branding, existing interactions and touch sizes.
3. Make PNG use the same Chinese face with explicit bounded loading and stable numerals.
4. Verify glyph coverage, lint/typecheck/build/unit tests and i18n/result browser flows in Chromium/WebKit; inspect screenshots at narrow portrait and short landscape. Review only task changes against prior worktree state.

## Verification completed

- WOFF2 subset: 123,264 bytes; cmap covers all current source Chinese glyphs, license retained.
- Lint, TypeScript, production build and 40 unit tests pass.
- 12 scoped browser cases pass across Chromium and WebKit (language persistence, font failures/stalls, PNG fallback/download and bundled Chinese font export).
- Regression evidence: reverting the pre-fix CSS makes the new Chinese font test fail with `[]` instead of `["loaded"]`; restoring the fix passes in both engines.
- Live UI visually inspected: Chinese result receipt, ticket at 320×640, running cue at 320×640 and 844×320; default viewport restored. No geometry/CSS assertions added.
- Task diff reviewed; existing uncommitted work retained. Temporary Playwright preview on 4173 exited. User-requested Vite preview remains PID 93501 on 5173; cleanup `kill 93501`.
- Assumptions/limits: Taiwan Traditional Chinese; subset regenerated when copy changes; physical-device and running-distance legibility remain human verification. No full WCAG audit claimed.
