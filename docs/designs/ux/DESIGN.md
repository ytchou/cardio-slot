# Cardio Slot visual direction

Approved 17 September 2026. The former flat console/two-column configurator is historical.

## Cabinet

One physical enclosure: cream enamel with darker sidewalls, rolled chrome perimeter, red CARDIO SLOT marquee, recessed dark glass drums, and a right-hand lever rail with bracket, pivot, rod and red knob. Repeated different registered labels move through each drum. Integrated controls put duration above bookend rockers, then compact finishes. A recessed printer well feeds a short leading receipt through a slit behind a foreground lip.

Track uses cream/red/chrome; Neon uses navy lacquer/cyan trim/magenta; Mono uses brushed metal/graphite. All share geometry. These material tokens are separate from workout semantics. Barlow Condensed is the display/instruction face; IBM Plex Mono is the timer/data face. Receipt instructions are at least 16px; interactive targets at least 48×48px.

The sole introduction is “Pull a workout. Run by feel.” Installation, help and offline status are secondary. Total includes enabled warm-up, cooldown and recoveries.

## Responsive behavior

Portrait reserves a lever rail and keeps the complete cabinet discoverable at 390×844. The 360px layout preserves text and control sizing. Short landscape (`orientation: landscape` and `max-height: 540px`) reflows to a lower/wider cabinet: marquee and drums span the width, duration and bookends share the deck, finishes and outlet occupy its lower row. Exceptionally short configuration views scroll vertically.

Receipt uses a native modal dialog almost filling the dynamic viewport. Its heading and actions remain fixed while the body scrolls independently. A distinct “Before you start” safety callout follows the heading. Every workout phase remains visible as an accordion summary with duration, interval count, effort labels, and a proportional semantic-color strip; one phase expands at a time and Block 1 opens initially. Hidden interval rows stay mounted as the canonical timeline. Landscape actions form one horizontal row. Close preserves the preview, Adjust focuses the deck, and View ticket reopens it. Paper and modal use the same leading layout; handoff measures the source in viewport coordinates, scales/reveals the real receipt, and settles on resize.

Result screens preview the exact 1080×1350 PNG. Coarse-pointer/mobile actions prioritize Share image, then Save PNG and Copy summary. Fine-pointer/desktop actions prioritize Download PNG and Copy summary, adding Share image only when file sharing is supported. Native sharing contains the image only; the readable text summary is copied separately. Unsupported actions are omitted.

Running has stable semantic backgrounds until the exact interval boundary. Portrait emphasizes effort/countdown above next and End. Short landscape puts elapsed/progress/remaining across the top, gives the current phase and countdown roughly two-thirds of the content width, and keeps next/End/options in a compact secondary rail. Safe-area insets and dynamic viewport units apply. No orientation restriction in the PWA manifest. Rotation never alters workout or timer state.

| State | Background | Foreground |
| --- | --- | --- |
| Easy | #164B35 | #F4F7EE |
| Strong | #F2BB46 | #231C12 |
| Max | #A52C32 | #FFF5EB |
| Recovery | #DCE9E3 | #173A2D |
| Next | #F9F5E9 | #18251D |

Phase and effort remain textual. NEXT IN appears only within the next panel for the final five seconds, including incline-only changes and final FINISH. Progress-track sheen is the only ongoing decorative motion. User suppression never pauses timing; system reduced motion takes precedence.

## Mechanical timing

Lever pull 0–220ms, return through 520ms; drums settle at 1420/1820/2220ms; hold until 2470ms; leading paper feeds through 3070ms; dialog handoff settles at 3570ms. Forward lever pivot stays inside the reserved rail. No animation event is necessary to reach a usable ticket. Request IDs guard stale completions.

## Acceptance

Inspect portrait 360×800,390×844,430×932; desktop 1440×900; landscape 844×390,932×430,844×320, all finishes and reduced motion. Timed frames/video are required for mechanics. Physical iPhone Safari and Android Chrome, browser and installed modes, plus a real 15-minute treadmill session remain the final human acceptance gate.

Wake-lock success and request states are silent. Denied or unsupported states display “Keep your screen on — automatic display lock is unavailable.” Pull another returns to the cabinet without the old ticket affordance, then runs the complete mechanical sequence and rejects an exact visible repeat of the completed workout.
