# Cardio Slot visual direction

Approved 17 September 2026. The former flat console/two-column configurator is historical.

## Cabinet

One physical enclosure: cream enamel with darker sidewalls, rolled chrome perimeter, red CARDIO SLOT marquee, recessed dark glass drums, and a right-hand lever rail with bracket, pivot, rod and red knob. The three drums reveal one coordinated workout type: a mirrored line-art mark frames Endurance, Hills, or Speed. Side marks are decorative reinforcement and never separate workout settings. Integrated controls align the 15, 30, and 60 minute choices beside their label and give each bookend a wide hardware rocker. A recessed printer well feeds a short leading receipt through a slit behind a foreground lip.

The machine uses the Track finish in cream, red, and chrome; legacy saved finish values normalize to Track. Material tokens remain separate from workout semantics. Barlow Condensed is the display/instruction face; IBM Plex Mono is reserved for timer and language-neutral data. Receipt instructions are at least 16px; interactive targets at least 48×48px.

The cabinet carries no introductory tagline or visual-style selector. “Pull to start” and a finite three-pulse lever cue establish the primary action on initial load and after Pull again; closing an existing ticket does not replay the cue. Installation, help and offline status are secondary. Total includes enabled warm-up, cooldown and recoveries.

A compact utility header places the static CARDIO SLOT wordmark at left and the conditional Install action plus an EN / 中文 segment at right; there is no global footer. The language segment remains available inside native dialogs and as a quiet standalone control during countdown and running, while Install never appears during an active session. English and Traditional Chinese are bundled and work offline. A saved manual choice overrides browser detection; zh-TW, zh-Hant, zh-HK, zh-MO and zh-CN select Traditional Chinese. Changing language translates existing tickets, active cues, accessibility announcements, metadata and result images without regenerating or restarting the workout. CARDIO SLOT remains English, functional labels use natural Taiwan fitness language, and Chinese uses the local system CJK font stack.

## Responsive behavior

Portrait reserves a lever rail and keeps the complete cabinet discoverable at 390×844. The 360px layout preserves text and control sizing. Short landscape (`orientation: landscape` and `max-height: 540px`) reflows to a lower/wider cabinet: marquee and drums span the width, duration and bookends share the deck, finishes and outlet occupy its lower row. Exceptionally short configuration views scroll vertically.

Receipt uses a native modal dialog almost filling the dynamic viewport. Its fixed heading reads “Workout of the day,” shows the selected workout type once, and shows total time. A prominent red “Before you start” safety callout follows. The effort guide presents colored Easy, Strong, Max, and Walk / Easy terms whose concise explanations appear on one line when hovered or keyboard-focused. Warm-up, Recovery, and Cool-down use consistent transition strips with textual effort labels and structural side rails, so color is never their only distinction. Main blocks are accordion summaries with duration and a chronological, duration-proportional semantic-color strip. Block 1 opens initially, only one main block opens at a time, and the open block may close. Expanded intervals use compact cards with exact time, semantic effort label, and incline; hidden cards stay mounted as the canonical timeline. Ticket actions are Start workout and Pull again. Close preserves the preview, and View ticket reopens it. Paper and modal use the same leading layout; a non-modal handoff measures the source in viewport coordinates and scales/reveals the real receipt before the dialog opens and takes focus. Resize, unavailable animation, and reduced motion settle directly into the usable dialog.

Result screens use one stable, session-derived celebratory heading and preview the exact 1080×1350 PNG without repeating its contents in HTML. The image leads with completion state and “Workout type,” then separates overall time from a clearly labeled “Time by effort” section. It omits product branding, the original duration pick, and promotional footer copy. Coarse-pointer/mobile actions prioritize Share image, then Save PNG and Copy summary. Fine-pointer/desktop actions prioritize Download PNG and Copy summary, adding Share image only when file sharing is supported. Native sharing contains the image only; the readable text summary is copied separately. Unsupported actions are omitted.

Running has stable semantic backgrounds until the exact interval boundary. A duration-proportional workout map shows every canonical phase and interval, with compact phase labels, completed/current/future states, recovery notches, and a continuously interpolated playhead. The playhead follows wall-clock time; interval boundaries still drive cue and background changes. Its accessible value names elapsed time, phase, effort, and time left in the interval. The current cue is framed as a payline instrument with the countdown as the primary glance target and incline as a ruled readout. A fixed-height dock keeps the next effort, duration, and incline visible, changing to “NEXT IN” only for the final five seconds without reflow. The destructive action is the quieter “■ End session.” Portrait keeps the map, current cue, next dock, and End in that order. Short landscape retains the 65/35 split, with the current cue dominant and next/End/options in a compact secondary rail. Safe-area insets and dynamic viewport units apply. No orientation restriction in the PWA manifest. Rotation never alters workout or timer state.

| State | Background | Foreground |
| --- | --- | --- |
| Easy | #164B35 | #F4F7EE |
| Strong | #F2BB46 | #231C12 |
| Max | #A52C32 | #FFF5EB |
| Walk / Easy | #DCE9E3 | #173A2D |
| Next | #F9F5E9 | #18251D |

Phase and effort remain textual. NEXT IN appears only within the next panel for the final five seconds, including incline-only changes and final FINISH. The map playhead uses a short linear transition between existing 200ms wall-clock updates; cue changes use one short entrance transition. There is no decorative sheen. System reduced motion suppresses nonessential animation and interpolation without pausing timing.

## Mechanical timing

Lever pull 0–220ms and returns through 520ms. The drums accelerate for roughly 350ms, run at unreadable speed, then settle at 3200/3600/4000ms. Leading paper feeds for 650ms, pauses for 200ms, and completes its automatic handoff at 5500ms. Forward lever pivot stays inside the reserved rail. State-driven fallbacks reach a usable ticket if motion cannot complete, and request IDs guard stale completions. Reduced motion skips the spatial sequence and reveals the dialog immediately.

## Acceptance

Inspect portrait 360×800,390×844,430×932; desktop 1440×900; landscape 844×390,932×430,844×320, all finishes and reduced motion. Timed frames/video are required for mechanics. Physical iPhone Safari and Android Chrome, browser and installed modes, plus a real 15-minute treadmill session remain the final human acceptance gate.

Wake-lock success and request states are silent. Denied or unsupported states display “Keep your screen on — automatic display lock is unavailable.” Pull another returns to the cabinet without the old ticket affordance, then runs the complete mechanical sequence and rejects an exact visible repeat of the completed workout.
