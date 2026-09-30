# Lever entry cue

## Scope and approach

Reuse the existing first-pull attention state and lever markup. Replace the one-shot moving-handle invitation with a repeating soft halo, and add a decorative downward chevron under the localized pull prompt. Reuse knob and spacing tokens; leave pull behavior, layout outside the lever and saved-ticket states unchanged.

## Constraints and failure check

The cue must remain readable in English and Traditional Chinese at 320px, and must stop once pulling begins. Reduced motion keeps a static halo and arrow. The fragile assumption is available space between caption and knob: add a small caption clearance and visually verify short landscape as well as portrait. No new component, dependency or data state.

## Verification

Lint and diff review; existing Chrome/Safari reduced-motion keyboard-to-ticket journey; computer-use inspection of desktop, narrow portrait, and short landscape, plus pull/disabled state. Save a screenshot and restore the viewport and language. UI presentation is verified visually rather than asserting CSS in tests.

## Completed verification

CSS-only change in src/styles.css; removed obsolete moving-handle keyframes and the one-shot shadow animation. Halo animates only transform/opacity using a named shadow and existing knob/spacing tokens. Adjusted lever caption clearance across its existing breakpoints.

Lint and diff checks passed. Existing reduced-motion keyboard/modal/focus-return journeys passed in Mobile Chrome and Mobile Safari (2 tests). Computer use verified 928×954 desktop, 320×720 portrait in English and Traditional Chinese, and 844×390 short landscape. The live ready state has an infinite 2.8-second halo; pulling disables the handle and removes the halo. Reduced-motion static rendering follows the existing global animation override. Original language, 15-minute settings and normal viewport restored. Screenshot: /tmp/cardio-lever-entry-glow.png.

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| MEDIUM | src/styles.css:96 | First-pull cue expires after 4.2 seconds and moves the handle | Repeating soft halo, stationary handle, static direction cue | The entry remains discoverable without implying an automatic pull. |

Approve — inspected layouts and interaction; not verified: physical devices, enlarged text, hover rendering, or 10% playback in the Animations panel.
