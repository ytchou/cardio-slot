# Active workout experience

Approved 21 September 2026. This design supersedes the active-screen details in the earlier landscape-only optimization while preserving its 65/35 short-landscape hierarchy.

## Intent

The countdown remains the primary glance target. A compact workout map provides orientation without turning the running screen into another ticket: every phase and interval appears once, in canonical order, and its width represents real duration. The map distinguishes completed, current, and future work and uses a playhead that advances continuously between the existing wall-clock updates.

The current cue is a payline-style instrument with phase, effort, countdown, a ruled incline readout, and the existing coaching cue. The upcoming cue is a fixed-height dock reading `NEXT · effort · duration · incline`; during the final five seconds its label becomes `NEXT IN n…` without moving the contents. The destructive action is demoted and renamed `■ End session`, with its existing confirmation retained.

## Behavior and accessibility

- Each map interval retains its canonical `data-interval-id`; segment widths are proportional to duration.
- The map progressbar announces elapsed time, the current phase and effort, and remaining interval time.
- The playhead uses the unchanged 200ms runtime snapshot cadence plus a short linear CSS interpolation.
- System reduced motion removes decorative cue motion and playhead interpolation, but never changes timing.
- Portrait and short landscape reuse one semantic DOM. Short landscape preserves the established 65/35 current/secondary split.
- Generation, persistence, wake lock, interval announcements, and end confirmation are unchanged.

## Result screen follow-through

The result page shows one playful, deterministic completion heading and the generated image, avoiding a second HTML copy of the same statistics. Completed and manually ended sessions draw from separate plain-language heading sets; the choice is stable across reloads for the same result.

The image removes duplicate product branding, “Original pick,” and promotional footer copy. It describes the selected template as “Workout type,” labels the duration breakdown “Time by effort,” and uses one text color for all effort totals so color is not the only organizing cue.

## Acceptance

Verify exact canonical map order, duration-based segment sizing, wall-clock recovery after background/reload, interval boundaries, final-five-second next state, end confirmation, all four effort colors, wake-lock-unavailable guidance, and timer stability across rotation. Visually inspect the densest 60-minute Speed plan at 360×800, 390×844, 430×932, 844×390, 844×320, and 932×430.

The assumption most likely to fail is that proportional segments remain legible in dense Speed sessions. The silent failure risk is preserving all interval identities while a narrow segment becomes visually tiny; therefore identity/order are tested independently from visible labels, and narrow recovery remains a notch rather than carrying text.
