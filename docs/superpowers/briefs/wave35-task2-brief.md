# Task 2 — Q10 Tailwind --minify + Q12 unwire psi

Repo: Shopify theme. `assets/output.css` is a COMMITTED build artifact
(deployed to the store via GitHub sync), built from `assets/input.css` by the
scripts in `package.json`.

## Q10 — minify the committed CSS

1. Add `--minify` to BOTH `tailwind:build` AND `tailwind:watch` in
   `package.json`. Rationale (already decided, don't re-litigate): the watch
   script overwrites the same committed `output.css`; if only `build` minified,
   any dev session would commit an unminified artifact and the two scripts
   would fight. Source readability lives in `input.css`.
2. Rebuild: `npm install` if needed, then `npm run tailwind:build`
   (npx tailwindcss also fine). Commit the regenerated `assets/output.css`.
3. Sanity check and record in your report: (a) file size before/after;
   (b) BOTH the old and new output.css contain the classes
   `bg-card-light`, `text-on-accent`, and the `@layer` structure — i.e. run
   `grep -c "bg-card-light\|text-on-accent" assets/output.css` before and
   after and confirm the count is >0 both times. If the new file is MISSING
   any class the old one had (compare the full set of class selectors old vs
   new, not just those two), STOP and report BLOCKED with the missing list —
   minify must not change the rule set, only whitespace/formatting.

## Q12 — remove the unwired psi devDependency

1. Remove `"psi"` from `devDependencies` in `package.json` and run
   `npm install` so `package-lock.json` updates. Commit both.
2. `docs/testing-workflow.md` mentions psi in prose — update that sentence to
   no longer claim the package is in devDependencies (point at running
   Lighthouse directly instead; keep the edit to that one sentence/paragraph).

## Constraints

- Files: `package.json`, `package-lock.json`, `assets/output.css`
  (regenerated), `docs/testing-workflow.md` (one prose fix).
- Bump `package.json` `"version"` by one patch.
- Commit when done (do NOT push).
