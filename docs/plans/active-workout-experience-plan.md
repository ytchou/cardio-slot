# Active workout experience implementation plan

Approved 21 September 2026.

## Scope

- Add a private duration-accurate `WorkoutMap` to `RunScreen.tsx`, preserving canonical interval identity and runtime interfaces.
- Restyle the active cue as a payline, compact the upcoming cue, and rename the confirmed destructive action to `End session`.
- Keep the 200ms runtime clock and use CSS only to interpolate the playhead between snapshots, respecting system reduced motion.
- Simplify the result page to a varied stable heading plus its generated image; remove duplicate HTML statistics and heading copy.
- Simplify the generated image hierarchy to completion state, workout type, total time, main blocks, time by effort, and top incline.
- Update the accepted UX documentation and mark the earlier landscape-only design as superseded.

## Verification

- Component tests cover canonical workout-map order, accessible progress text, and the final-five-second next cue.
- Workout journeys cover timer continuity, reload and rotation, interval changes, result actions, image text, and the renamed End action.
- Offline and font-failure journeys use the renamed control and still restore or download the result.
- Run lint, typecheck, unit/integration tests, production build, and Mobile Chrome/Safari Playwright suites.
