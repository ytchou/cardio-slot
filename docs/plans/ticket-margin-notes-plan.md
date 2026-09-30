# Ticket supporting phases: margin notes

User selection: C, a margin itinerary with quieter compact supporting phases.

## Implementation

1. Keep the existing TicketPhase and IntervalCards. Main blocks retain their numbered heading, duration, strip and interval table. Supporting phases print their name and exact interval time/effort/incline as a compact row with a decorative margin dot, without redundant table headings, strip or large number. Preserve each interval ID, list semantics and accessible incline label.
2. Connect phase markers with a thin margin rule. Reuse current fonts, color and spacing tokens. Keep heading, guide and action styles. Let narrow supporting rows wrap without clipping, hiding data or shrinking the main table.
3. Verify existing ticket tests and targeted Chrome/Safari journeys, lint/typecheck, and inspect English/Traditional Chinese at 320px and desktop. Save screenshots, restore language/viewport.

## Assumptions and failure check

Supporting phases normally have one interval, but rendering must retain every interval rather than indexing only the first. Main block numbering uses the canonical mainBlockIndex and matches the localized block heading, excluding supporting phases. The fragile assumption is that phase names and values fit the narrow receipt: use wrapping and verify the longest English supporting label. No workout generation, timing, persistence or data-shape changes.

## Verification completed

- Both existing Ticket component tests passed, including all-interval coverage and the scheduled recovery incline.
- Four targeted ticket journeys passed across Mobile Chrome and Mobile Safari; lint and project typecheck passed.
- Computer-use inspection in English and Traditional Chinese at 320px and desktop: all supporting-phase values remained visible without horizontal overflow, main interval tables retained their rows, and the unchanged footer remained available by scrolling.
- Screenshot: `/tmp/cardio-ticket-margin-notes.png`. Original English preference and normal viewport restored.
- No new component, dependency, workout-data change, or disclosure. Physical devices and text enlargement were not tested in this task.

## Numbering correction

The printed index now uses the same mainBlockIndex as the localized block heading. Removed the obsolete overall-phase index prop. The existing all-interval test also checks every main-block number with warm-up, recoveries and cool-down present: it failed before the fix (01 missing; 02 printed for Block 1), then passed after the fix. Lint and project typecheck passed. Screenshot: `/tmp/cardio-ticket-main-block-numbers.png`. No workout data or order changes.

## Footer alignment polish

Guide and safety note now share the main content inset, derived from the ticket-wide margin-index and gutter tokens. Guide heading uses the quieter control role; safety uses the secondary-text role, retaining dark text and the explicit sentence break. Guide explanations remain right-aligned and normal-sized. Its column gap follows the responsive ticket gutter so all four descriptions still fit on one line at 320px. Footer actions retain their full-width controls.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | src/styles.css:146 | Guide and safety reset to the outside paper edge after the inset margin itinerary | Shared content-column inset, quieter hierarchy and grouped spacing | Align to shared edges; notes read as supporting reference content instead of another main phase. |

Verification: English and Traditional Chinese visually checked at 320px and 928px, guide lines inspected in the settled dialog, safety copy and actions remained visible with normal sheet scrolling. Lint and diff checks passed. Source-only CSS change: no new behavioral tests. Original language and viewport restored. Proof: `/tmp/cardio-ticket-footer-polish.png`. Not verified: physical devices, 200% text enlargement, other viewport widths and RTL (the app supports EN/zh-TW).

Approve — for the inspected widths and languages.

## Footer correction after user review

The previous inset footer was superseded: it left a dead gutter once the itinerary ended. Closing reference content now uses the whole paper width, with lightly ruled guide rows sharing the existing columns through CSS subgrid. Right-aligned explanations, the quiet heading, smaller dark footnote, and separate safety sentences are retained. No new markup, copy, component or dependency.

Verification: lint and diff checks passed; the existing all-interval/guide journey passed in Mobile Chrome and Mobile Safari (2 tests). English and Traditional Chinese inspected at 320px and 928px; explanations fit and footer controls remain reachable. Language and viewport restored. Screenshot: `/tmp/cardio-ticket-full-width-footer.png`. Physical devices, enlarged text and older browser versions were not verified.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | src/styles.css:146 | Inset footer preserved an empty timeline gutter | Full-width ruled reference footer | Grouping and hierarchy need an explicit layout boundary, not alignment alone. |

Approve — inspected footer widths and current supported test engines.

## Compact color key and safety removal

Removed the safety note, its unused EN/zh-TW catalog entries and CSS. The full-width effort guide now reads as a compact color key with a muted caption, narrow markers using the existing strip classes, dark labels and right-aligned secondary-size descriptions, without row rules. This uses small accents rather than filled row backgrounds to retain the paper character. Assumption: the requested row colors refer to the effort guide; interval tables retain their existing presentation.

Verification: the existing component regression failed before removal and passed after (2 tests); four targeted ticket journeys passed across Mobile Chrome and Mobile Safari. Lint, project typecheck and diff checks passed. Computer-use inspection confirmed all descriptions fit on one line at 320px in English and Traditional Chinese, with actions visible and no safety note. Desktop screenshot: `/tmp/cardio-ticket-color-key.png`. Original language and viewport restored. Physical devices and enlarged text were not tested.
