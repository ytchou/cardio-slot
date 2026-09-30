# Running screen polish

Scope: refine the active running screen in the existing mobile-ui worktree on `codex/run-screen-polish`; keep timing, workout data, and the other screens unchanged.

## Decisions

- Retain the duration-proportional map and playhead. A neutral overlay covers the elapsed portion continuously, including partial intervals; no extra legend or repeated phase label beneath the bar.
- Replace the two full-width next-cue rules with one bounded, softly inset row. Keep NEXT and the final-five-second cue, align the upcoming effort and timing, and retain readable wrapping on compact screens.
- Increase separation above and below the corgi on tall screens, retain compact and landscape layouts, and keep the timer dominant.
- Preserve EASY's existing cadence; increase STRONG/MAX cadence and trailing streak contrast. Change the actual eye, eyebrow, and tongue within the animated head rather than adding an unrelated face overlay. Preserve the running animation instance and ease speed changes over 650ms. WALK uses a second pose cycle generated from the same rig; cross-fade over 650ms and pause the hidden player afterward.

## Pre-mortem

The fragile assumption is that the licensed Lottie asset's head groups are stable: identify groups by authored names, tag only this bundled asset, and verify expressions at several frames. Breakage could silently detach an expression from the moving head. Continuous elapsed shading must use the same overall-progress value as the playhead. Reduced motion must stop every decorative animation without stopping the workout clock.

## Verification

Use the existing unit and browser journeys for progress announcements, canonical map order, final-five-second NEXT, and ending a session. Inspect screenshots and animated frame sequences for all four efforts, smooth transitions, English/Traditional Chinese, supported portrait/landscape sizes, and reduced motion. Run lint, typecheck, unit tests, and the targeted browser journeys. Read the final diff and record limitations; physical treadmill/device testing is outside this software check.

## Upcoming effort palette

The NEXT card reuses the upcoming interval’s effort class and shared background/foreground tokens, independently of the current screen. The final-five-second cue strengthens the card border without replacing its palette. FINISH has no effort class and retains the existing neutral inset surface. No workout timing, announcements, content or data changes.

Verification: 3 existing RunScreen component tests, lint, project typecheck and diff checks passed. All four token-pair contrasts were checked: Easy 9.27:1, Strong 9.61:1, Max 6.49:1, Walk 10.01:1. Computer-use verification at 928×954 and 320×720 showed a Strong card on an Easy screen with exact Strong background/foreground colors. Screenshot: /tmp/cardio-next-effort-color.png. Temporary workout ended; viewport and warm-up preference restored. Not verified visually in this turn: the other three upcoming colors, the five-second border, or FINISH; those mappings and fallback were reviewed in source.
