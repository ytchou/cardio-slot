# Three-Template Workout Engine Plan

## Goal

Replace the independent Focus / Pattern / Finish generator with one seeded Endurance, Hills, or Speed template while preserving the three-reel cabinet as a coordinated visual reveal.

## Domain

- Add `TemplateType` and a fourth `recovery` intensity displayed as WALK / EASY.
- Generate on a 15-second grid with exact totals, type-specific block ranges, interval caps, incline rules, MAX budgets, and recovery after every MAX and between blocks.
- Use continuous Easy/Strong work plus one final MAX for Endurance, incline-led work plus alternating MAX finishes for Hills, and mixed sprint-repeat/progression blocks for Speed.
- Validate template-specific invariants and produce only generation-version-3 plans.

## Product surfaces

- Coordinate the three reels as matched mark / template name / matched mark; only the template name affects generation.
- Update tickets, running cues, summaries, share output, effort colors, and accessibility labels for the template and WALK / EASY state.
- Persist version-3 plans, discard older workout state, and migrate only compatible preferences.

## Verification

- Cover all durations, bookend combinations, templates, and deterministic seed samples.
- Verify exact timing, block ranges, MAX/recovery/incline constraints, persistence migration, and updated visible/accessibility behavior.
- Run lint, typecheck, unit tests, build, and the affected Chromium/WebKit workout journeys.
