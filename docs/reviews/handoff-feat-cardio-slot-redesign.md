# Cardio Slot redesign — review handoff

Implemented in a fresh linked worktree from `origin/main` (`67a2b66`), branch `feat/cardio-slot-redesign`. Main-session-only override honored. No dependency upgrades or deployment-model changes.

## Implementation and verification

| Approved contract | Evidence |
| --- | --- |
| Exact selected total with enabled bookends and boundary recoveries | `workout.test.ts`: 8,000 plans, independently checked totals, indices, boundaries, MAX limits/recovery, all recipes/finishes, deterministic fallback |
| One enabled timeline and final validation | `timeline.ts`, generator/validator, runtime boundary tests; receipt interval stream checked against persisted plan in E2E |
| Preferences and version-2 persistence | State/storage tests: invalidation, immutable active snapshot, legacy original timing/results, preview discard, malformed records, denied storage getter; browser reload journeys |
| Scheduled countdown, delayed ticks, completion race | State/runtime tests and rotation/reload E2E; scheduled natural timestamp and actual early overlap |
| Durable writes only | Browser test advances ticks without writes, then changes motion and confirms saved active plan/start are unchanged |
| Mechanical cabinet, reel strips and paper handoff | Screenshot matrix and real-time [mechanics recording](redesign-evidence/mechanics.webm); request guards; reduced-motion keyboard and all-stage rotation journeys |
| Modal instruction readability and keyboard behavior | Near-full-height fixed-heading/footer receipt; all intervals; focus entry/Tab/Escape/return and Adjust tested in Chromium and WebKit |
| Landscape running and semantic colors | Screenshot review at all requested sizes; rendered run dimensions show no scrolling at 844×390,932×430,844×320; [contrast measurements](redesign-evidence/rendered-contrast.json) |
| Canvas sharing | Browser boundary receives a real 1080×1350 PNG under user activation; actual download fallback verified |
| Offline and deferred updates | Origin-shutdown fresh-page offline launch passes both engines; changed worker waits through spinning, printing, opening, countdown and running, then saved result survives activation |
| CI/deployment path | Both browser engines added to existing verification job; E2E build and preview both use `/cardio-slot/`; Pages deploy condition unchanged |

Local commands passed: `pnpm lint`, `pnpm typecheck`, `pnpm test` (18 tests, including 8,000-plan sweep), `VITE_BASE_PATH=/cardio-slot/ pnpm build`, and scoped/full Playwright verification (21 passing cases across scoped/full runs; one intentionally skipped Chromium copy of iPhone-only install guidance). No offline WebKit skip remains.

E2E gate: passed — `e2e/workout.spec.ts`, `e2e/offline.spec.ts`, and `e2e/share-fonts.spec.ts` cover all changed critical surfaces and named journeys. Subsequent create-pr coverage authoring is unnecessary.

## Review

Sequential correctness, removed behavior, caller tracing, language, wrapper, cleanup, architecture, conventions, plan alignment, test quality, design and dead-code review completed. Confirmed issues and fixes are recorded in `findings-feat-cardio-slot-redesign-20260917.json`. The storage-getter regression was shown failing with `SecurityError` before the adapter fix and passing afterwards. Modal focus issues were reproduced in browser tests before correction.

The review also hardened legacy chronological validation and request identity; prevented non-spinning reel replay; canceled WAAPI handoff on reduced motion; deduplicated live cues by run/interval identity; preserved outlet focus; confined lever travel; restored a true top-layer install dialog. The first CI run passed after automatically retrying one Chromium sharing timeout. A held-font regression then reproduced a real blocking path in the global `document.fonts.ready` wait. The adapter now loads only its four required font faces in parallel; the regression fails before and passes after in both engines. The follow-up CI run also passed with one Chromium sharing retry, so the held-font defect was not sufficient to explain that CI instability. The combined runtime/share journey now resumes real time before ending the session, before native Canvas preparation begins, matching the dedicated sharing journey. Final CI status is recorded in PR #2; a successful retry is not reported as a clean first-attempt pass.

## Visual evidence

All three skins were captured at 360×800,390×844,430×932,1440×900,844×390,932×430,844×320; receipts and running were also captured with reduced motion at each size. Full capture set stays in the main project root `docs/reviews/redesign-evidence/`; representative images and the recording are tracked here.

- [Track portrait](redesign-evidence/machine-390x844-track.png)
- [Neon portrait](redesign-evidence/machine-430x932-neon.png)
- [Mono desktop](redesign-evidence/machine-1440x900-mono.png)
- [Track landscape](redesign-evidence/machine-844x390-track.png)
- [Short-landscape receipt](redesign-evidence/receipt-844x320-reduced.png)
- [Short-landscape run](redesign-evidence/run-844x320-reduced.png)
- [MAX](redesign-evidence/effort-max.png), [Strong](redesign-evidence/effort-strong.png), [Recovery](redesign-evidence/effort-recovery.png)

Actual rendered foreground/background ratios: Easy 9.27:1, Strong 9.61:1, Max 6.49:1, Recovery 10.01:1, Next 14.58:1. These are sampled computed colors, not only token calculations. Timed frames and video show distinct reel rows, sequential settling, paper occlusion/feed, and enlargement into the real modal. Motion suppression and controls remain independent from session timing.

## Deferred physical validation — user-approved

- [ ] iPhone Safari: browser and installed portrait/landscape, safe areas, rotation, installation, offline relaunch, native OS share, wake lock and reduced motion.
- [ ] Android Chrome: browser and installed modes with the same checks.
- [ ] Complete a real 15-minute treadmill session and assess whether visual-only cues are noticeable enough while exercising.

The user explicitly accepted automated verification for this PR and deferred the physical checks on 17 September 2026. They are no longer a PR acceptance gate. These checks require human devices and exercise; automation and generated references cannot establish them. Browser wake lock was denied in headless verification and remains a progressive enhancement. No real-device or treadmill acceptance is claimed. No manual infrastructure or database migration is needed after merge.
