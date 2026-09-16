# Cardio Slot MVP

Build and deploy an installable, offline-capable treadmill workout PWA at
`https://ytchou.github.io/cardio-slot/`.

The fixed journey is:

`Choose duration/skin → Pull → Reveal → Printed ticket → Start → Hands-free run → Shareable result ticket`

## Scope

- React, Vite, TypeScript, and `vite-plugin-pwa`; no backend, accounts, history,
  analytics, audio, numeric speed targets, or runtime network dependency.
- A pure, deterministic workout domain with typed duration, intensity, reel,
  plan, run, and result models. Generate in exact 30-second units and validate
  safety invariants before exposing a plan.
- Four durations (15/30/45/60), compatible Focus/Pattern/Finish reels, bounded
  generation attempts, and a safe fallback. Warm-up and cool-down are removable
  without regenerating main blocks.
- Reducer flow: configure, spinning, ticket, countdown, running, result.
  Runtime derives from absolute timestamps and persists in one versioned state
  envelope.
- Three responsive skins (Track, Neon, Mono), a mechanical reel animation, one
  reusable plan/result ticket shell, five-second countdown, hands-free run
  display, wake-lock enhancement, install guidance, and concise safety copy.
- Result summaries distinguish natural completion and early ending. A native
  Canvas adapter renders a skin-matched 1080×1350 PNG for native file sharing
  or download fallback.
- Offline app shell, bundled fonts/icons, deferred service-worker update while
  running, GitHub Actions quality checks and Pages deployment at `/cardio-slot/`.

## Safety invariants

- Warm-up/cool-down allocations are 2+2, 3+3, 4+4, and 5+5 minutes and remain
  Easy at 1% incline.
- Main-block counts are 2–3, 3–5, 4–6, and 5–8 respectively.
- Incline is 1–8%. MAX intervals are 30–60 seconds at 1–2%, never adjacent,
  followed by at least equal Easy recovery, and total at most 10% of the plan.

## Verification

- Determinism, complete reel registry/compatibility, safety invariants across a
  large deterministic seed set, and independent bookend removal.
- Absolute countdown/runtime timing, background/reload catch-up, transition
  deduplication, completion summaries, and safe unknown-state handling.
- Chromium and WebKit mobile journeys covering skins, ticket generation,
  reroll, bookends, running, early/natural completion, PNG fallback, and minimum
  touch targets.
- Run lint, typecheck, tests, production build, and Playwright sequentially.

