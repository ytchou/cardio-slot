# Ticket reading polish

Work in the existing `codex/run-screen-polish` worktree and preserve its pending running-screen/result changes.

- Put each complete safety sentence on its own line using a translated newline and `white-space: pre-line`; do not split translated text by punctuation.
- Move each duration-proportional effort strip above the interval headings and table. Add a spacing-token gap between the section title and its content.
- Use a content-sized label column and concise English/Traditional Chinese descriptions so all four effort rows fit one line at supported portrait widths without shrinking fonts, truncating instructions, or widening the paper.

Verification: update stale copy assertions, observe their failure before the wording changes and pass afterward, run lint/typecheck plus targeted ticket and language journeys, and visually inspect both languages at 320/390/928px. Keep wrapping available at extreme zoom; never force safety content offscreen. The fragile assumption is that the longest localized guide description fits beside the longest effort label; inspect the narrowest receipt, not only desktop.

## Verification completed

- Ticket regression: failed before the copy change (missing “Full sentences”), then both existing ticket tests passed.
- Four targeted ticket journeys passed across Mobile Chrome and Mobile Safari; lint, project typecheck, and diff whitespace checks passed.
- Computer-use inspection: English and Traditional Chinese guide descriptions each occupied one line at 320, 390, and 928px; safety guidance remained readable with its explicit sentence break. Viewport override and original English preference restored.
- Proof: `/tmp/cardio-ticket-reading-polish.png`. Physical-device and enlarged-text behavior were not verified in this task; text remains free to wrap.

## Writing review

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| LOW | src/i18n/catalog.ts:38,144 | Full-sentence explanations occupying multiple rows | Concise talk-test and walk/jog cues in both locales | Plain words, consistent vocabulary, easier scanning without smaller text. |
| LOW | src/i18n/catalog.ts:60,166 | Pace and stop guidance running together | Separate printed lines | Clearer instructional grouping without adding a warning heading. |

Approve — inspected ticket copy only.

## Follow-up: alignment, actions, and support-phase concepts

- Right-align guide descriptions while retaining the shared label track and natural wrapping.
- Remove ticket-only button shape, border, color, and hover overrides so existing primary/secondary styles match result actions. Preserve footer layout and 48px target size.
- Generate three preview-only PNG concepts: compact single rows, quiet two-line waypoints, and margin annotations. Await selection before changing support-phase rendering.

Verification: inspect the settled receipt in both languages at 320px and desktop; inspect computed ticket-action styles and compare the shared style cascade with result actions, run lint, and self-review the CSS diff. No presentation assertions or new dependencies. The fragile assumption is that shared button styles remain appropriate on paper; review the actual footer before accepting.

Follow-up verification completed: lint and diff whitespace checks passed. English and Traditional Chinese inspected at 320px; desktop English inspected at 928px. Buttons render with shared 7px corners, 48px minimum height, red primary surface and outlined transparent secondary surface. Original language and viewport restored. CSS-only presentation changes did not require additional behavioral tests. Support-phase rendering awaits a selection; PNG concepts and generation brief live in main-root `docs/designs/ticket-support-phase-options/`.
