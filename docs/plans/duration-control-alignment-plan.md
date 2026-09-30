# Duration control alignment

Make the targeted fix in the existing mobile-ui-tune-up worktree, main session only; preserve other pending work and do not commit or push.

1. Change the English duration label and its accessible legend to Duration through the existing translation key.
2. Reuse the toggle width as a local CSS token; derive the desktop duration label column from the first bookend column so the 15 button starts at the warm-up rocker and the 60 button ends at the cool-down rocker. Retain existing narrow-screen stacking and short-landscape layout.
3. Review the live desktop and mobile controls in both languages, run lint/typecheck and the affected locale tests, and review the incremental diff. Visual evidence replaces presentation assertions.

The failing assumption would be that both rows share their parent’s content width and gap; verify those values in the live layout. No component or workout behavior changes are needed.

## Result

Changed only `src/i18n/catalog.ts` and `src/styles.css` in the existing worktree. English visible copy and accessible legend now use Duration. The first duration track is derived from half the bookend width minus its gutter, rocker width and duration gutter; both outer control edges therefore share their row boundaries. Existing mobile stacking and landscape flex rules remain.

The three affected locale tests, lint, typecheck and diff whitespace checks pass. The live Vite responses serve the new label and alignment rule. Browser inspection repeatedly timed out before accessing the page; the documented native Codex-app capture fallback was rejected by the computer-use tool’s safety policy. Final visual acceptance in English/Chinese and narrow viewports could not be completed in this turn. No temporary viewport or persistent process was started, and no commit/push/PR was created.
