# Landscape run optimization implementation plan

## Goal

Make the active workout screen easier to read at a glance on a treadmill in short landscape while preserving its content, behavior, accessibility, and portrait layout.

## Dependencies checked

- `RunScreen` is rendered only by `App` and already contains every required region and control.
- Short-landscape layout is isolated in the existing `orientation: landscape` and `max-height: 540px` media query.
- `RunScreen.test.tsx` covers wake-lock visibility; `e2e/workout.spec.ts` covers rotation, timer continuity, Up next, and End visibility.
- No schema, persistence, API, environment, configuration, dependency, or external SDK changes are required.

## Wave 1 — approved guidance

1. Record the active-run-only scope, weighted dashboard hierarchy, rejected alternatives, component reuse, blast radius, and acceptance criteria in the approved design.
2. Update the project UX guidance so short-landscape running describes the dominant current interval and compact secondary rail.

Verification: read the resulting documentation diff and confirm every statement matches the approved design.

## Wave 2 — responsive implementation

1. Reweight the existing landscape grid without changing `RunScreen` markup.
2. Increase the live interval's visual priority and compact secondary typography and spacing using existing tokens.
3. Keep all information and controls visible with 48px targets, including failed wake-lock guidance and final-five-second `NEXT IN`.
4. Leave portrait rules unchanged.

Verification:

- Build the app and inspect fresh screenshots at 844×390, 844×320, and 932×430.
- Review Easy, Strong, Max, Recovery, wake-lock-unavailable, and `NEXT IN` states for hierarchy, contrast, clipping, overlap, and scroll.
- Compare a 390×844 portrait screenshot before and after to confirm the landscape media query did not change portrait.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `VITE_BASE_PATH=/cardio-slot/ pnpm build` sequentially.
- Defer the existing rotation E2E journey to the final review stage; no presentation geometry assertions or screenshot baselines will be added.

## Non-goals

- Machine, ticket, countdown, and result landscape redesigns.
- Runtime, timer, wake-lock, or workout-state changes.
- New components, settings, dependencies, or persisted data.
