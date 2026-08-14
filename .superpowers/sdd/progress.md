# Product-card typography migration — progress ledger

Plan: `docs/superpowers/plans/2026-08-13-product-card-typography.md`. Branch:
`claude/tnt-typography-product-card-95f99f`. Plan commit: de614cf.

(Prior content of this file was stale leftover from an unrelated, already-
merged Wave 3.5 batch 3 run that reused this worktree directory. Discarded —
recoverable via git log on that batch's branch if ever needed.)

Tasks listed complete below are DONE — do not re-dispatch. Resume at the
first task not marked complete.

- Task 1 (badges): complete (commit bf53810, review clean first pass).
  `.type-badge`/`badge-label` already existed in `assets/output.css` from
  the foundation commit — no new Tailwind utility introduced, so no
  rebuild was needed despite the "rebuild after class change" constraint
  (that constraint targets content-scanned arbitrary-value utilities, not
  reuse of pre-existing custom classes).
- Task 2 (title unification): complete (commit bd02fb5, review clean first
  pass). Both `is_minimal` and standard title branches now `type-md
  type-bold`; hover kept standard-only; `text-primary` dropped.
- Task 3 (price block): complete (commit 9b99196, review clean first
  pass). Pris label -> caption role, headline -> type-lg/type-md type-bold,
  compare-at -> type-sm type-muted line-through, unit suffix -> type-xs
  type-muted.
- Task 4 (unit-price.liquid): complete (commit 7b5491a, review clean first
  pass). size 'xs'/default -> type-xs, 'base' -> type-sm, color ->
  type-muted; variable name and param contract unchanged.
- Task 5 (rating wrapper): complete (commit e1261f0, review clean first
  pass). rating_wrapper_class -> type-sm (standard) / type-xs (minimal),
  star_size unchanged.
- Task 6 (docs): complete (commit 6e81770). F-027 added to failure-log.md,
  typography-inventory.md updated with a closure note.

## Remaining
- Final whole-branch review: complete (opus, one pass, 1 Critical + 2
  Important found). Fixed in commit 52ea797:
  1. CRITICAL: savings-badge.liquid's badge-label role leaked onto the
     `lg` (product-page) variant via unlayered .type-* CSS beating
     Tailwind's layered .text-2xl — shrank "Spar X%" 30px->12px uppercase
     on a live surface. Scoped role render to `size != 'lg'`.
  2. IMPORTANT: caption role has no size class, so "Pris" label inherited
     main's 16px instead of intended 14px. Swapped to explicit
     `type-sm type-muted`.
  3. IMPORTANT: design-mode placeholder card's mock price missed by the
     price-block migration, still `text-xs text-primary`. Moved to
     `type-sm type-bold`.
  Re-review (sonnet) confirmed all three RESOLVED, no new issues, no
  scope creep. F-027 updated to document the fixes.
- Manual browser verification still owed (Task 6 Step 4) — needs the
  user. Final reviewer flagged the product page's savings headline
  (blocks/product-price.liquid, size: 'lg') as a specific must-check
  given how the CRITICAL bug slipped through per-task review.
