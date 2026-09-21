# End-to-end journeys

Route: `/cardio-slot/`. CI runs Mobile Chrome (Chromium) and Mobile Safari (WebKit).

| Journey | Spec | Evidence |
| --- | --- | --- |
| Duration/bookends/skin persist; timing edits invalidate; skin preserves plan | workout.spec.ts | Reload preferences; close/reopen; settings focus; unchanged exact total |
| Unstarted ticket refresh | workout.spec.ts | Reload clears the preview and View ticket affordance while preserving configuration preferences |
| Coordinated template reveal | workout.spec.ts | Three reels remain present; matched marks frame one Endurance, Hills, or Speed result and the accessible status announces that single template |
| Every printed instruction matches the accepted timeline | workout.spec.ts | Ordered interval identities match the saved plan |
| Selected ticket interval cards | workout.spec.ts | Every main block uses compact cards while preserving exact time, effort, incline, order and interval identity; recovery and bookends remain static; ticket cues and legacy next-block labels stay absent |
| Ticket safety and main-block disclosure | workout.spec.ts | Safety guidance and four-state Easy/Strong/Max/Walk-Easy guide are present; Block 1 opens first; blocks switch or all close; summaries, effort strips, regions and arrow-key focus remain accessible |
| Rotation during configuration, spinning, printing, opening, receipt, countdown, run and end confirmation | workout.spec.ts | Same plan ID/start timestamp; receipt usable; natural completion persists scheduled endpoint |
| Reload during countdown and running; delayed advancement | workout.spec.ts | Original future start and final scheduled result retained |
| Lever keyboard input/reduced motion/modal focus | workout.spec.ts | Enter/Space; trapped Tab; Escape; lever and outlet focus restoration |
| Timer persistence | workout.spec.ts | Timer ticks cause no durable writes and preserve the active plan and start |
| Completed result repull | workout.spec.ts | Pull another removes the old ticket, revokes its preview URL, runs the full mechanics, and rejects the completed visible workout |
| Early result and adaptive 1080×1350 file sharing | workout.spec.ts | Exact preview; coarse/fine action order; PNG download; summary copy/failure; native image-only share under user activation; unsupported actions omitted |
| Sharing while an unrelated page font stalls | share-fonts.spec.ts | Held HTTP font request does not prevent a real PNG download |
| True offline fresh-page launch | offline.spec.ts | Test-owned HTTP origin is shut down after SW readiness; both engines launch and pull |
| Deferred service-worker activation | offline.spec.ts | Changed SW waits through spinning/printing/opening/countdown/run, reload clears unstarted previews, and saved runs/results still restore |
| iPhone installation guidance | workout.spec.ts | Safari sees Add to Home Screen instructions (only this platform-specific test skips Chromium) |

Visual artifacts and review notes: `docs/reviews/handoff-feat-cardio-slot-redesign.md`.

Physical acceptance remains open: iPhone Safari and Android Chrome in browser/installed modes, safe areas, rotation, offline relaunch, native OS sharing, wake lock and reduced motion; then a real 15-minute treadmill session. Browser automation does not establish treadmill cue noticeability.
