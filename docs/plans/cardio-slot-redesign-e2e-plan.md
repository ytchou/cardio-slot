# Browser verification — Cardio Slot redesign

Actors: runner configuring, reading, running and resuming a workout. No accounts or database; isolated browser contexts use localStorage and clock control. Route `/cardio-slot/`. Projects: Mobile Chrome and Mobile Safari. Destination: `e2e/workout.spec.ts`.

1. Configure duration/bookends/finish, pull, read every instruction, close/reopen, adjust/invalidate. Expect selected total unchanged, one new seed per accepted pull, theme preservation. Risk: stale or shortened workout.
2. Keyboard lever and reduced motion. Expect usable dialog, trapped focus, Escape and focus return. Risk: inaccessible machine or animation dependency.
3. Rotate configuration, spinning, printing/opening, open receipt, countdown, running, end confirmation. Expect unchanged request, preferences and timestamp; complete/early results accurate. Risk: rotation restarts session or loses receipt.
4. Reload during countdown and running; delayed clock skips directly; natural completion wins end race. Expect scheduled endpoint and full total. Risk: extra time or missed intervals.
5. End early, share as native file or PNG fallback. Expect result reflects elapsed overlap, file is generated. Risk: incorrect or inaccessible result.
6. Offline launch on both engines and iPhone installation guidance; defer service worker updates through mechanical/countdown/run stages. Expect cached session accessible and no premature activation. Risk: interrupted or lost session.
7. Capture all skins/reduced motion at portrait 360/390/430, desktop, landscape 844×390,932×430,844×320; timed real-animation frames/video. Inspect visual artifacts for hardware, paper handoff, readable instructions, targets, contrast, overflow and NEXT/End visibility. No layout geometry assertions in regression specs.

Physical acceptance: iPhone/Android browser and installed modes, safe areas, native sharing, wake lock and real treadmill session remain a human device check.
