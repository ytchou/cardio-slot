# Submit the current UI worktree

Base resolver selected main (no release policy). Use the existing linked codex/mobile-ui-tune-up worktree, main session only, and preserve primary-checkout changes.

1. Review the full pending UI, animation, font, export and test diff against main; remove only unused additions and misleading verification added by this work.
2. Run the workflow's frozen install, lint, typecheck, unit tests, Pages build and Chromium/WebKit journeys, plus a redacted secret scan. No repository workflow introspector is available, so use the checked-in workflow commands directly. The Playwright runner owns and tears down its temporary server; the user-requested 5173 server remains running.
3. Include the accepted design rules and compact verification documentation, commit and push this worktree, create a PR against main, attach it to the chat and monitor its checks. At most two failure-repair cycles; don't silently rerun unrelated flakes.

Pre-mortem: assuming the changed e2e selectors cover every removed disclosure/language control could leave CI broken; sweep all affected journeys and run both engines before pushing. No database, credentials or deployment-setting changes are expected; the added Lottie dependency is installed automatically by Pages CI and needs frozen installation for manual deployments.
