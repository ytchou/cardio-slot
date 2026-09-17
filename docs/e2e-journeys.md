# End-to-end journeys

Route: `/cardio-slot/`. CI runs Mobile Chrome (Chromium) and Mobile Safari (WebKit).

| Journey | Spec | Evidence |
| --- | --- | --- |
| Duration/bookends/skin persist; timing edits invalidate; skin preserves plan | workout.spec.ts | Reload preferences; close/reopen; settings focus; unchanged exact total |
| Every printed instruction matches the accepted timeline | workout.spec.ts | Ordered interval identities match the saved plan |
| Rotation during configuration, spinning, printing, opening, receipt, countdown, run and end confirmation | workout.spec.ts | Same plan ID/start timestamp; receipt usable; natural completion persists scheduled endpoint |
| Reload during countdown and running; delayed advancement | workout.spec.ts | Original future start and final scheduled result retained |
| Lever keyboard input/reduced motion/modal focus | workout.spec.ts | Enter/Space; trapped Tab; Escape; lever and outlet focus restoration |
| Timer persistence and motion | workout.spec.ts | Timer ticks cause no durable writes; motion changes preserve the active plan and start |
| Early result and 1080×1350 file sharing | workout.spec.ts | Actual elapsed result; PNG download; native share boundary receives image under user activation |
| Sharing while an unrelated page font stalls | share-fonts.spec.ts | Held HTTP font request does not prevent a real PNG download |
| True offline fresh-page launch | offline.spec.ts | Test-owned HTTP origin is shut down after SW readiness; both engines launch and pull |
| Deferred service-worker activation | offline.spec.ts | Changed SW waits through spinning/printing/opening/countdown/run, activates after saved completion, reload restores result |
| iPhone installation guidance | workout.spec.ts | Safari sees Add to Home Screen instructions (only this platform-specific test skips Chromium) |

Visual artifacts and review notes: `docs/reviews/handoff-feat-cardio-slot-redesign.md`.

Physical acceptance remains open: iPhone Safari and Android Chrome in browser/installed modes, safe areas, rotation, offline relaunch, native OS sharing, wake lock and reduced motion; then a real 15-minute treadmill session. Browser automation does not establish treadmill cue noticeability.
