# Ticket and control polish plan

## Direction

- Color: retain paper `#f9f5e9`, ink `#18251d`, enamel `#eee4ce`, easy `#164b35`, and recovery `#dce9e3`; use text and a left rail alongside color.
- Type: keep Barlow Condensed for readable labels and IBM Plex Mono for time and machine state.
- Layout: align the duration choices beside their label, then give each bookend switch a wider hardware footprint. Present warm-up, recovery, and cool-down as consistent transition strips within the workout sequence.

```text
Session minutes | 15 | 30 | 60
Warm-up  |==========|   Cool-down |==========|

| WARM-UP                            3:00 |
| EASY                           Incline 1% |
```

## Principles

- Controls stay adjacent to the settings they change and retain 48 px touch targets.
- Transition phases read as part of one ordered workout, not as standalone decorative cards.
- Phase meaning is explicit in text and structure rather than color alone.
- Tooltips remain brief and render on one line within the viewport.

## Verification

- Check portrait and short-landscape control layouts without overflow.
- Check every effort tooltip at the ticket edges.
- Check warm-up, recovery, and cool-down content and ordering in both browser projects.
- Run unit tests, affected Playwright journeys, typecheck, lint, and build.
