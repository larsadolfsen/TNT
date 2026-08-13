# Wave 3.5 batch 3 — progress ledger

Plan: `docs/superpowers/plans/2026-08-09-wave35-batch3-plan.md`. Branch:
`claude/wave-3-5-batch-3-2e8851`. Batch start: v1.0.122, commit 691c1cf
(main), plan commit 00c7964.

Tasks listed complete below are DONE — do not re-dispatch. Resume at the
first task not marked complete.

(Prior content of this file was stale leftover from an unrelated Wave 3
batch run in the same worktree directory; discarded, recoverable via git
log on branch `claude/wave3-refactor-batch` if ever needed.)

- Task 1 (Q2 spec): complete (commits 00c7964..5a3862d, review clean after
  one fix round — corrected `sections/collection.liquid`'s mobile column
  count claim). Spec: `docs/superpowers/specs/2026-08-09-image-loading-fetchpriority-spec.md`.
- Task 2 (Q2 mechanical migration): complete (commit ecb32d1, review clean
  first pass). theme-check unchanged at 8 errors/21 warnings.
- Task 3 (Q4 shipping-progress extraction): complete (commit b521a14,
  review clean). theme-check unchanged at 8 errors/21 warnings.
  `assets/product-shipping-progress.js` new.
- Task 4 (Q5a product-surface scripts): complete (commit db09787, review
  clean). trust-countdown, product-variant-picker, product-price,
  product-urgency extracted; `variant-changed` custom event contract
  verified intact between picker/price/urgency. theme-check unchanged.
- Task 5 (Q5b forms + pickup scripts): complete (commits db09787..23f8ce2,
  review clean after one fix round — reverted an unrequested data-attribute/
  multi-instance generalization in testimonial/pickup-availability back to
  Task 4's id-prefix pattern). contact-form, product-testimonial,
  newsletter-form, product-pickup-availability extracted. theme-check
  unchanged.
- Task 6 (Q5c accordion + badge scripts): complete (commits 23f8ce2..828d0b8,
  review clean after one fix round — added bind-guard to accordion.js/
  badge.js to fix a real multi-instance duplicate-listener bug; multi-
  instance querySelectorAll adaptation itself was verified correct/
  necessary, not scope creep). badge, product-accordions, accordion
  extracted. theme-check unchanged. Note: product-accordions.js and
  accordion.js share near-identical toggle logic — flagged as a future
  consolidation candidate, out of scope here.
- Task 7 (Q6 subcollections dedup): complete (commit f9ebcc7, review clean
  first pass, all claims independently re-verified by reviewer).
  `sections/collection-subcollections.liquid` survives (script extracted to
  `assets/collection-subcollections.js`); deleted `blocks/collection-
  subcollections.liquid` (exact duplicate, unreachable — no schema names it)
  and `sections/collection-subcategories.liquid` (dead, already broken —
  called undefined `applyQuickFilter`). theme-check improved 8/21 → 2/14.
  Accepted residual risk: no live-admin section-picker re-verification
  possible in this environment (repo-side grep evidence only) — human
  should spot-check on the live store before this ships.
- Task 8 (Q9 shared panel primitive): complete (commits f9ebcc7..4645e4d,
  review clean after one fix round — reviewer caught a real focus-management
  regression: panel.js always restored focus on close, but the original
  header-account.js deliberately did NOT restore on outside-click. Fixed via
  `data-panel-restore-focus="escape-only"`). New `assets/panel.js` primitive;
  `blocks/header-account.liquid` + `blocks/footer-localization.liquid`
  migrated (the latter off native <dialog>); `assets/header-account.js`
  deleted; `assets/localization.js` trimmed.
- Task 8b (Q9 full scope): complete (commit 3946332). User ratified the
  brief's literal 4-file scope over the implementer's proposed 2-file
  narrowing, so `blocks/header-search-icon.liquid`'s mobile overlay was also
  migrated onto panel.js, removing predictive-search.js's duplicated
  initMobileOverlay(). Verified complete; needed no fixes.
  (`snippets/account-panel.liquid` genuinely has no logic — pure content
  rendered inside header-account's panel shell. Nothing to migrate there.)

## Merge with upstream main — 2026-08-13 (commit 5862d8a)

Branch was based on 691c1cf; main had advanced 46 commits (Wave 3.75,
Lucide SVG icon-sprite migration, homepage components). Merged main in,
9 conflicts, all resolved. theme-check after merge: **0 errors / 0 warnings**
across 139 files.

Decisions taken during the merge:
- **Kept Task 7's deletions** (user decision). Upstream had refactored both
  files (556944a extracted `snippets/subcategory-tile-content.liquid` purely
  to dedupe `sections/collection-subcategories.liquid`), but the dead-code
  evidence still held on current main: zero template refs for either file,
  and `applyQuickFilter` — called 6× by collection-subcategories' onclick
  handlers — is still defined nowhere in the repo, so those buttons throw a
  ReferenceError. Deleted the orphaned tile snippet too.
- **`assets/product-shipping-progress.js` was created independently on both
  sides** (our b521a14 vs upstream d1d2396 — duplicated effort). Kept ours
  for its header-comment/IIFE consistency with the rest of the batch, paired
  with main's more robust `| json` config-island encoding.
- Six content conflicts resolved by combining both intents (our script
  extraction + upstream's icon markup).

Two real breakages caught and fixed during resolution, neither a conflict
git would have flagged:
- `accordion.js`, `product-accordions.js`, `product-price.js` still queried
  the `.material-symbols-outlined` class that upstream's icon migration
  removed — chevron rotation and the price info tooltip would have silently
  broken. Updated to the new `.icon`/SVG-sprite markup.
- `snippets/collection-card.liquid` (main's new card dedup) had none of Q2's
  `loading`/`fetchpriority` work — extended it so the LCP optimization
  survives.

- Task 9 (Q11 JS minify build step) — complete. Added `esbuild` devDependency
  and `scripts/build-js.mjs` (per-file minify via esbuild's JS API, no
  bundling — glob-filters out `*.min.js` so re-runs don't cascade). New
  `js:build` npm script wired into `build` alongside `tailwind:build`.
  25 source files (186.9KB) -> 25 `.min.js` files (86.9KB, ~53% smaller);
  all 25 committed like `output.css`, since this theme deploys via GitHub
  sync and an uncommitted artifact wouldn't exist live. Updated all 28
  `<script src="{{ 'x.js' | asset_url }}">` references across 24 liquid
  files (blocks/sections/layout) to `x.min.js` — cross-checked, no dead
  JS files, no missed references. theme-check stays clean (0 offenses in
  theme code; installing esbuild's devDependency pulled in `node_modules`
  which inflates the tool's "files inspected" count with unrelated
  @shopify/cli bundled-template warnings — verified via `-o json` that
  those 3 warnings are 100% inside `node_modules`, not the theme).

## Remaining

- Final whole-branch review — not yet run.
- **Live verification still owed** for the whole batch: nothing here has been
  seen in a browser. Highest-risk surfaces are the Q9 panels (header account
  dropdown, footer localization modal — now off native <dialog>, and the
  mobile search overlay) and the Q6 deletion (spot-check the live store's
  section picker before this ships).
