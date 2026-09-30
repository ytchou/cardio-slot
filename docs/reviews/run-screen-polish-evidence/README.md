# Running screen polish verification

Implemented in `/Users/ytchou/project/cardio-slot/.worktrees/codex/mobile-ui-tune-up` on `codex/run-screen-polish`. The existing preview server at `http://127.0.0.1:5173/` serves this worktree. No dependency was added.

## Hierarchy and grouping

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/styles.css:242` | NEXT and the upcoming interval were separated by a full-width ruled row. | A bounded, softly inset card gives the label, effort, and metadata shared alignment; compact screens stack the metadata. | Group related information and retain a clear reading order. |
| MEDIUM | `src/styles.css:206` | Timer, character, and incline shared tightly packed spacing even on tall views. | More space separates timer/character and character/incline; short portrait and landscape retain compact spacing. | Use available space for hierarchy without pushing End beyond reach. |

## State and motion

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | `src/components/RunScreen.tsx:30`, `src/styles.css:203` | Completed intervals became brighter than future intervals. | A neutral elapsed overlay advances with the playhead, including the partial current interval. No extra visible context row is added. | History recedes while upcoming effort remains legible. Existing accessibility context remains. |
| MEDIUM | `src/platform/runningDog.ts:6`, `src/styles.css:215` | STRONG/MAX cadence and face differed little from EASY. | EASY remains at 0.8×; STRONG is 2.2× and MAX 3.4×, with faster streaks, focused/open eyes, and panting. Speed eases over 650ms. | Effort has both a static label and distinct motion cues. |
| MEDIUM | `src/platform/runningDog.ts:13` | WALK slowed the same airborne gallop. | A level-body four-footfall cycle uses upright limb rest angles and smaller alternating swings. Walk/run poses blend over 650ms, and the hidden player then pauses. | A named walking state must change its gait, not merely its playback speed. |

## Verification

- `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`: passed.
- `pnpm test`: 44 tests passed.
- `pnpm test:e2e --grep 'complete map and final-five-second|every running cue|rotation|running session|reduced motion'`: eight targeted Chromium/WebKit journeys passed without retries. The runner completed its production build and cleaned up its preview server.
- Headless Chromium visual evidence: EASY, STRONG, MAX, WALK, four animated frames per effort, and the interval transitions in the recorded video.
- English and Traditional Chinese screenshots at 320×640, 360×800, 390×844, 430×932, 1440×900, 844×390, 932×430, and 844×320. No horizontal overflow; End remains reachable. At 320×640, the optional wake-lock guidance can require vertical scrolling.
- 200% CSS zoom: no horizontal clipping; the page scrolls vertically to keep the normal-flow actions reachable.
- Reduced motion: decorative gait is static while the countdown continues; see `inspection.json` for the comparison.

## Assumptions and limitations

The existing timer and next cue provide enough visible context; a repeated phase label/effort legend would add clutter. Facial details are tied to authored groups in this bundled Lottie asset, so replacing that asset requires rechecking the group names and geometry. Walking and running derive from the same licensed character rig and retain its illustration. The screenshot inspection script uses a generated workout and a controlled browser clock; it introduces no product-only test switches.

Not verified: physical devices, a treadmill session, browser-native zoom, an RTL locale (neither supported language uses RTL), or the browser Animations panel at 10% speed. WebKit behavior is covered by the targeted journeys, but the screenshot matrix is Chromium. Existing user preview server PID 86929 was retained; no new persistent server was started.

Approve for the inspected running-screen scope.
