# Current UI PR verification — September 30, 2026

Base: main, resolved with the shared release-flow resolver; no release policy. Existing linked worktree: codex/mobile-ui-tune-up. No ticket ID was provided. Main-session execution only.

## Scope

Submit the pending printed-ticket redesign, chart-led square result export, continuous illustrated corgi and effort/slope effects, session simplification, shared English/Traditional Chinese typography, globe language picker, responsive shrinkable layouts and Duration alignment. Include bundled licensed animation/font assets and font regeneration instructions. Workout generation and saved preference behavior are unchanged; warm-up and cool-down already default on for fresh preferences.

## Preflight

- Reviewed the full source diff and affected callers against main; existing changed e2e journeys cover removed disclosures, language-picker access, recovery labels and exported content.
- No formatter is configured. Project lint and types pass.
- Removed an unused share-only corgi still and a newly added SVG-mock identity test that could not substantiate its claim about actual animation playback. SDK-boundary isolation remains for rendered component behavior.
- E2E gate: skipped — changed e2e specs are newer than the newest changed UI source; no coverage-authoring step or new browser journey was added during create-pr.
- Workflow introspector: none exists in this repository; mirrored `.github/workflows/pages.yml` directly with base main.
- Initial redacted Gitleaks directory scan found no secrets; final committed branch scan will use main..HEAD before push.

## Checks

Frozen pnpm install, lint, typecheck, 44 tests across 12 files, and the Pages production/PWA build pass. The final full Chromium/WebKit browser suite passes: 47 passed, one expected skip (Chromium copy of Safari-only install guidance), with no retries.

The first full browser run produced 45 passes, two failures and one expected skip. Both failures pointed at the same obsolete Before you start heading assertion after the approved safety-footnote redesign. Updated that existing assertion to the retained stop guidance; the subsequent full Chromium/WebKit verification passes in both engines. This was test drift in the current change, not a silently retried unrelated flake.

## Limits and operations

Prior live computer-use review and native Canvas export evidence are in `bilingual-typography-evidence/`; their screenshot dates precede the final Duration alignment. The latest live browser-control connection timed out, so that exact row alignment has not had a fresh visual check. Physical-device/treadmill readability and timed gait aesthetics remain human checks. Automated journeys do not prove those visual qualities.

The only added runtime dependency is Lottie. Pages CI installs it automatically from the lockfile; manual/self-hosted deployments must run pnpm install --frozen-lockfile before building. No database migrations, new environment variables or hosting dashboard changes. The user-requested preview server remains on 5173 (PID 86929; cleanup kill 86929); Playwright owns and cleans up its separate 4173 test server. No primary-checkout commit or branch switch.
