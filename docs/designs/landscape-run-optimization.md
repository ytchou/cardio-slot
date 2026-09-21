# Landscape run optimization

Approved 19 September 2026.

Superseded on 21 September 2026 by [Active workout experience](active-workout-experience.md). The 65/35 short-landscape hierarchy remains, while the newer design replaces the progress bar, current cue, upcoming cue, and End treatment.

## Problem

The active workout screen is the screen most likely to remain visible on a treadmill in landscape. At 844×390 and 844×320, the current 50/50 layout gives the live interval and the upcoming interval similar visual weight. When wake lock is unavailable, its guidance creates another competing block. The screen remains usable, but the live effort and countdown are not the obvious glance target.

This optimization applies only to the active workout screen. The machine, ticket, countdown, and result screens remain unchanged.

## Approved design

- Reuse the existing `RunScreen` markup and change only its short-landscape styling. Do not add a second render path, component, preference, or persisted state.
- Weight the landscape grid approximately 65/35. The current phase, effort, countdown, incline, and cue dominate the left; the upcoming interval, End action, and wake-lock guidance form a compact right rail.
- Keep elapsed, progress, remaining, Up next, End, and wake-lock guidance visible. Keep controls at least 48px and preserve safe-area insets.
- Reduce the weight of secondary content and enlarge the live countdown. Exact ratios, type sizes, and spacing may be tuned during visual review.
- Leave portrait styling and runtime behavior unchanged.

Rejected alternatives:

- A nearly fullscreen current interval would maximize glanceability but make the upcoming change and End action harder to find.
- Dedicated landscape markup would provide total layout freedom but duplicate semantics and invite portrait/landscape drift.
- Font scaling alone would leave the existing competing blocks and would not correct the hierarchy.

## Component reuse

| Element | Implementation |
| --- | --- |
| Current interval and countdown | Existing `RunScreen` and `run-cue` |
| Elapsed, progress, and remaining | Existing `run-progress` |
| Upcoming interval | Existing `next-panel` |
| End control | Existing button |
| Wake-lock guidance | Existing status text |
| New component | None |

## Blast radius

| File / symbol | Why it is touched | Callers and importers | Tests affected |
| --- | --- | --- | --- |
| `src/styles.css` short-landscape run rules | Rebalance hierarchy, type, and spacing | Imported by `App`; selectors are rendered by `RunScreen` | Rotation journey in `e2e/workout.spec.ts` |
| `docs/designs/ux/DESIGN.md` | Record the approved responsive behavior | Documentation only | None |
| `docs/designs/landscape-run-optimization.md` | Preserve this decision | Documentation only | None |
| `docs/plans/landscape-run-optimization-plan.md` | Define implementation and verification | Documentation only | None |
| `src/components/RunScreen.tsx` | Inspected but not expected to change | Imported only by `App.tsx` | `RunScreen.test.tsx`; workout E2E |
| Schema, API, environment, configuration | Checked; no changes | None | None |

## Acceptance

- At 844×390, 844×320, and 932×430, the live interval is the dominant glance target and the right rail is visibly secondary.
- Easy, Strong, Max, and Recovery states retain their semantic colors and readable contrast.
- The failed wake-lock message and final-five-second `NEXT IN` state fit without clipping, overlap, or scrolling.
- Elapsed, progress, remaining, upcoming interval, and End remain visible, and interactive targets remain at least 48px.
- Portrait remains visually unchanged.

The assumption most likely to invalidate this design is that the reported problem was visual hierarchy rather than a different landscape screen. Scope was explicitly confirmed as the active workout screen. The silent failure risk is crowding at 844×320 when wake lock is unavailable, so that exact state is required in visual review.
