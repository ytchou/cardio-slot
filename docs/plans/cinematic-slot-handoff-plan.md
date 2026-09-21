# Cinematic Slot and Ticket Handoff

## Goal

Make the lever the clear primary action, give the reels a convincing four-second slot-machine spin, and carry the printed ticket into the workout dialog as one continuous automatic handoff.

## Implementation

1. Add a finite idle lever cue for each new session, change the prompt to “Pull to start,” and preserve a static reduced-motion affordance.
2. Retune reel motion to accelerate, travel at unreadable speed, and stop at 3.2, 3.6, and 4 seconds with a restrained settle.
3. Chain the machine stages from the current flow instead of scheduling overlapping absolute timers: four-second spin, 650 ms print, 200 ms pause, and 650 ms handoff.
4. Move the opening animation into a non-modal ticket handoff; open and focus the dialog only when the visual handoff completes. Settle immediately on reduced motion, resize, or animation failure.
5. Hide the machine-style legend visually, remove the printer label, enlarge bookend switches, and document the motion hierarchy.

## Verification

- Add focused state-sequence coverage before changing the timing, then update implementation until it passes.
- Update stale Playwright timing and visible-text references for the affected machine journey.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and affected Playwright specs.
- Review the machine and ticket flow at desktop and mobile sizes, including reduced motion.
