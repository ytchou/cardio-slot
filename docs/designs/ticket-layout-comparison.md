# Ticket layout decision

The local comparison was reviewed on 21 September 2026. Option B, stacked interval cards, was selected as the permanent main-block treatment. The temporary option badges and the table and timeline renderers were removed.

## Shared hierarchy

Keep the existing safety callout, followed by a separate talk-test guide: Easy means full sentences, Strong means short phrases, and Max means a few words. Recovery is a subdued, non-expandable row labeled only “Recovery,” with its duration and “Recover at your own pace.” Warm-up is a compact preparation card; Cool-down is a quieter closing row. Both bookends show duration, effort, and incline without drawers.

Ticket interval details omit cue sentences while workout data, the running screen, sharing, and accessibility announcements retain them. Main blocks remain accordions: Block 1 opens initially, only one block opens at a time, and the open block may be closed.

## Selected treatment

Every expanded main block uses stacked mini-cards led by time, with a semantic effort label and explicit incline. Cards preserve exact interval order and `data-interval-id`; collapsed cards stay mounted as the canonical workout timeline.

## Constraints

Keep the renderer private within the existing Ticket module. Add no public component, API, schema, or dependency. System safety rules, workout timing, persistence, running guidance, sharing, and accessibility announcements remain unchanged.
