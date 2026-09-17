# Cardio Slot ticket and sharing follow-up — implementation plan

Approved 17 September 2026. Work in `.worktrees/feature/cardio-slot-ticket-sharing` from current `origin/main`; keep implementation in the main session.

## Wave 1 — generation and lifecycle

- Add a pure visible-workout signature and bounded generator beside `generateWorkout`. Compare request settings, reel selections, phases, durations, intensities, inclines, and cues while excluding seeds and internal IDs.
- Retain the completed plan only in transient `App` state while configuration is shown. Use it to reject an exact repeat, and clear it after a successful pull. Do not change persisted state.
- Regression: the colliding initial seed advances to a valid different plan; bounded exhaustion throws the existing safe-generation error shape.

## Wave 2 — ticket, result, and wake-lock UI

- Convert the plan ticket body to a single-open accessible accordion. Keep every phase summary and every interval node mounted, start with Block 1 open, support disclosure keyboard navigation, and add the safety callout immediately below the heading.
- Remove seed and trailing block/incline summaries. Preserve the fixed ticket header/body/actions and existing printer/dialog reuse.
- Preview the generated 1080×1350 PNG through a temporary object URL with cleanup. Add adaptive Share image, Save/Download PNG, and Copy summary actions; native share receives only the image and remains directly in the click handler.
- Hide wake-lock request/success text; show the approved actionable message only for denied or unsupported states.

## Wave 3 — verification and drift updates

- Update browser journeys for the accordion, full Pull another sequence, visible difference, PNG preview/file parity, action ordering/capability omission, direct native image share, download, summary copy, and wake-lock messaging.
- Review portrait and short-landscape layouts at 360×800, 390×844, 844×390, and 844×320, including a 60-minute ticket.
- Run sequentially: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `VITE_BASE_PATH=/cardio-slot/ pnpm build`, and `pnpm test:e2e`.

## Pre-mortem

The implementation fails if “different” is accidentally based on seed or IDs rather than rendered workout content. Silent failures are stale object URLs, a share call delayed beyond user activation, hidden intervals removed from the DOM, or the prior completed plan leaking into persistence. Verification must inspect each boundary explicitly.

## Constraints

No new component, dependency, backend, environment variable, storage version, or public data schema. Physical iPhone/Android and treadmill checks remain deferred; automated verification is the acceptance gate.
