# Result screen polish

## Scope

1. Keep the existing exporter and download flow. Name each PNG from template type, recorded UTC session timestamp including milliseconds, and status. Names remain stable across repeated downloads and languages.
2. Add localized result headings for completed and ended sessions, plus a short save/share prompt. Add a brief decorative CSS confetti burst for completed sessions only; preserve an honest ended-session summary and keep the completion burst enabled regardless of reduced-motion settings, as requested. Keep decorations out of the PNG and pointer/focus paths.
3. Remove block-count metrics from the PNG and equivalent accessible fallback, retaining time and top incline in two equal columns. Delete unused copy keys. Update existing affected download, result and font-fallback journeys.

## Failure check

The most fragile assumption is that adding a heading preserves a usable mobile result page: keep natural vertical scrolling, bounded image sizing and reachable actions. Filename uniqueness uses the recorded timestamp down to milliseconds rather than randomness; downloading the same result again intentionally keeps the same base filename. Results have valid canonical ISO timestamps from the app reducer. Confetti is limited to completed results, runs once per mounted result and remains enabled with reduced motion; revisiting a result may replay it. No new component or dependency.

## Verification

Update existing regression assertions and demonstrate failure before source changes. Run affected result/download/font-fallback journeys across Chrome and Safari, lint and typecheck. Computer-use review of the final result and downloaded image in English/Traditional Chinese, desktop and 320px. Review animation gating, pointer isolation and reduced-motion behavior. Save screenshot proof and restore preview state.

## Verification completed

Before source changes, the updated existing regressions failed on both the obsolete PLANNED BLOCKS metric and the non-specific download name. After changes, all 18 selected Chrome/Safari journeys passed, covering ended/completed results, Chinese export, offline Chinese reload, stalled/failed fonts, rendering failure and the regular ticket-to-run-to-result flow. Completed download names were additionally checked against the exact persisted type and timestamp in both engines. Lint, project typecheck and diff checks passed.

Computer use verified the real 6:53 ended session at 928×954 and 320×720 in English and Traditional Chinese: title, prompt, two equally spaced metrics, summary and both actions remained usable. Screenshot: /tmp/cardio-result-screen-polished.png. Completed-state screenshot: /tmp/cardio-result-confetti-frame.png; the temporary visual probe observed running confetti with visible opacity after reopening a completed result. Decorations use existing effort colors, pointer-events none and aria-hidden; the latest user preference keeps confetti enabled with system reduced motion, while other motion still respects that setting. Original language and viewport restored; updated result retained in the preview.

The in-app browser download-event wait timed out; actual downloadable filenames and image exports were verified by the existing Chrome/Safari tests. No external-service or dependency changes. Not verified: physical devices, enlarged text, animation slowed in DevTools, or a new full-length session through manual computer use. Filenames use UTC, while dates printed in the image follow browser-local display conventions.

A temporary reload-based visual probe cleared a test-only window hook for tracking revoked URLs and caused that probe’s later cleanup assertion to fail. The probe was removed and the original completed-session journey rechecked; it was not a product failure.
