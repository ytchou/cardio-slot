# Bilingual typography standardization

Implement in the existing mobile-ui-tune-up linked worktree, main session only. Preserve accepted layouts, workout mechanics and content; no commit/push/PR.

## Decision

The current interface mixes Barlow Condensed, IBM Plex Mono, Noto Sans TC and Georgia; English and Chinese assign inconsistent families, weights and sizes to equivalent roles. The user explicitly prefers the original IBM Plex Mono wordmark for English. Use the existing IBM Plex Mono for English UI, CARDIO SLOT wordmarks and numeric readouts in both languages; use the bundled Noto Sans TC for Chinese UI. Keep Barlow Condensed 800 only for the cabinet's large physical marquee. Remove Georgia and the unused Barlow weights. The trade-off is giving up serif receipt decoration and condensed functional labels for consistent roles and the user's preferred monospace English character. Preserve the accepted paper composition.

Use semantic font/size/weight/line-height tokens. Body 17px regular, controls/labels 16px medium or semibold, metadata 12px medium, section headings 19px semibold, ticket title bounded 28–36px semibold, effort bounded 40–56px semibold with smaller recovery. Use natural spacing and Chinese strict punctuation breaking. Keep timers tabular across languages with bounded size for five-character clocks. Below 700px, give the central drum more width so Endurance fits at the existing text size. Keep the original small wordmark's family, weight and tracking. The PNG uses the same UI/brand/numeric roles and explicitly awaits only its used fonts with the existing timeout.


## Implementation

1. Sweep CSS font declarations, component consumers, canvas helper callers and font-loading e2e expectations.
2. Standardize CSS roles, remove duplicate Chinese-only styling that is now shared, and allow the session-minutes label to size its grid column naturally. Keep IBM Plex Mono 400/500/600 and only Barlow Condensed 800.
3. Make canvas labels follow the locale UI role and numeric/wordmark runs follow the common IBM Plex Mono role, and update explicit font-loading evidence.
4. Verify existing unit tests, lint/build, font glyph/weight/tabular support, static text measurements at narrow widths, native exporter samples in both languages, e2e spec parsing and diff review. No new presentation-only tests. Use the user-authorized computer-use review for actual desktop, narrow portrait and short landscape rendering in both languages; preserve the existing live preview.

## Pre-mortem

The failing assumption would be that IBM Plex Mono fits widths originally designed for condensed text. Check Endurance/ENDURANCE, Session minutes, Warm-up/Cool-down, next-effort names and Chinese equivalents against current narrow containers; use normal wrapping/size bounds and content-sized label columns instead of shrinking all text. Silent failures: missing subset glyphs, synthetic weights and numbers silently falling back to another family. Verify the actual bundled font tables and output text bounds.

## References

[W3C Chinese layout requirements](https://www.w3.org/TR/clreq/) (September 2026 working draft) informs natural Chinese character proportions and punctuation breaking, not exact UI pixel sizes. [Noto CJK family documentation](https://github.com/notofonts/noto-cjk/blob/main/Sans/README.md) describes region-specific font options. The UI families, marquee exception and role scale are product design decisions.

## User-authorized computer-use review

The user now explicitly requests computer use across all screens and supplied an example of narrow-screen clipping. Review the existing live tab at desktop, mobile portrait and short landscape in both languages. Current observed defects: the running main grid's implicit auto minimum track expands from header text, forcing the right edge outside the viewport; the fixed 340px dog frame can overflow a smaller cue; the English lever caption wraps to three lines and overlaps the knob; Endurance has almost no drum inset. Fix the grid minimum at the source, fit header text using the caption/numeric roles while retaining same-line labels, scale the decorative dog frame with its own relative baseline offset, and give drum lettering/lever captions room. Tighten countdown explanatory copy to the body role. Record screenshots and inspect the rest of the existing flow before choosing any further changes. No new components, content model or workout logic.

## Completed verification

Computer use covered the machine, ticket including footer, countdown, running cue, end confirmation, result and language picker in English and Traditional Chinese. Reviewed desktop, 320px/390px portrait and 844×390 landscape layouts. Both running locales now have a 320×640 main and document at a 320×640 viewport, with header, next cue and End fully visible. The existing browser was returned to the English machine and its temporary viewport reset.

45 tests across 12 files, lint, typecheck/production build and diff whitespace checks pass. 48 E2E specifications parse; the full browser suite was not run. Nine native Canvas exports cover every template in both languages, plus long, early-ended and empty sessions; text bounds and recorded-duration sums pass, and stalled font loading falls back within the existing deadline. Current font subset covers every authored Chinese glyph; actual imported weights and equal numeral advances were inspected. Browser download-event completion and physical devices were not verified. Evidence and changed-file scope are recorded in [the review](../reviews/bilingual-typography-evidence/README.md).
