# Submit ticket, running, and result polish

Base: main, resolved by the shared release-policy resolver. Use the existing codex/run-screen-polish linked worktree; preserve main and other worktrees.

1. Review all pending changes, affected callers, visible-copy expectations, and deployment workflow against main. Include the accepted design documentation and representative visual evidence; no additional UI redesign or new test authoring.
2. Mirror the checked-in workflow: frozen install, lint, typecheck, unit tests, Pages production build, and the complete Chromium/WebKit suite. Playwright owns and cleans up its temporary 4173 server. Scan changed files for credential patterns. No workflow introspector exists in this repository; use its workflow commands directly.
3. Commit the reviewed diff, push codex/run-screen-polish, create and attach a PR targeting main, and monitor CI. No manual deployment setup is needed: Pages deploys automatically after a main push.

Failure check: the fragile assumption is that all existing journeys have been updated for changed ticket/result wording; run the full suite before push. Character expression and walking pose adjustments depend on the bundled rig's group names and geometry. Completion confetti runs once per mounted completed result and may replay on reopening; it remains enabled under reduced motion as explicitly requested. Other decorative motion still honors reduced motion. Filename timestamps are UTC with milliseconds; repeated downloads of the same result keep the same base name.

Validation: lint, typecheck, 44 unit tests, frozen install and changed-file credential-pattern scan passed. The Pages build and full Chrome/Safari suite passed: 47 journeys, one intentional Chrome skip for Safari-only install guidance, no retries. The temporary 4173 server exited. Remote CI is pending PR creation.
