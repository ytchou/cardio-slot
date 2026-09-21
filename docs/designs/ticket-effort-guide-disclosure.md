# Ticket effort guide disclosure

Approved 21 September 2026.

## Interaction

Replace the static three-row effort guide with compact tooltips below the safety callout. A visible “Effort guide” label distinguishes these informational terms from workout settings.

Show four equal-width colored chips using the workout effort semantics: green Easy, yellow Strong, red Max, and teal Walk / Easy. Hovering a chip or moving keyboard focus to it reveals a short tooltip; moving away hides it. Tapping a chip focuses it on touch devices.

- **Easy:** You can speak in full sentences.
- **Strong:** You can speak in short phrases.
- **Max:** You can only manage a few words.
- **Walk / Easy:** Walk or jog very easily until ready.

Each chip is a focusable term with a minimum 48px touch target, the existing focus treatment, and `aria-describedby` pointing to its tooltip.

## Alternatives considered

- **Interactive effort pills inside interval cards:** rejected because the pills already communicate workout state; making them controls would give the same element two jobs and repeat the interaction throughout every block.
- **One “How hard?” disclosure:** rejected because it adds a step before the user reaches a specific definition and does not satisfy tapping the individual effort label.
- **Keep all definitions visible:** rejected because the static reference table is visually heavy and disconnected from the workout hierarchy.

Colored chips can resemble workout settings. The visible guide label, informational copy, and verification that chip interaction leaves the persisted workout unchanged mitigate that risk.

## Component reuse

| UI element | Reuse |
| --- | --- |
| Effort guide | Existing private `EffortGuide` in `Ticket.tsx` |
| Chips | Focusable terms and the existing global focus treatment |
| Colors | Existing Easy/Strong/Max and recovery semantic tokens |
| Explanation | Accessible tooltips using existing ticket typography; no new public component |

## Blast radius

| File / symbol | Why it changes | Callers and importers | Tests affected |
| --- | --- | --- | --- |
| `src/components/Ticket.tsx` / `EffortGuide` | Add the tooltip terms and their descriptions | Used only by `Ticket`; `TicketDialog` renders `Ticket` | `e2e/workout.spec.ts` |
| `src/styles.css` / `.ticket-effort-guide` | Replace static rows with chip and explanation styles | No code importers | Responsive ticket journey |
| `e2e/workout.spec.ts` | Verify collapsed, open, switch, close, keyboard, and unchanged plan | Playwright only | Existing Mobile Chrome and Safari run |
| `docs/designs/ux/DESIGN.md` | Record the selected ticket interaction | No runtime callers | None |

No new public component or dependency is introduced. The workout-engine version 3 schema supplies the additional recovery effort used by this guide.

## Verification

- Confirm all definitions are hidden initially.
- Confirm each chip reveals its exact explanation on hover and keyboard focus.
- Confirm focus visibility and accessible tooltip descriptions.
- Confirm the saved workout ID and interval identity do not change.
- Inspect 360×800, 390×844, 430×932, and short landscape.
- Run lint, typecheck, unit tests, and Mobile Chrome/Safari workout E2E.
