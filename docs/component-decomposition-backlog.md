# Backlog: breaking files into single-purpose components

Status: backlog, deliberately held until after the Theme Store compliance
feature work (see `theme-store-compliance-brainstorm.md`) is done. These
files work today; splitting them mid-flight risks breaking the live client
theme with no visual QA environment set up here. The rule in
`.agents/AGENTS.md` ("each file should have a single, clear purpose") applies
starting now to new work — this doc is about cleaning up what already exists.

## Findings

Two independent audits of the repo (file-size scan + a separate review
focused on duplication and token drift) agree on the shape of the problem:
the design-token system and component conventions exist and are documented
(`snippets/css-variables.liquid`, `ai.md`), but aren't followed consistently
in practice — this is drift, not a missing foundation.

**Oversized files** (line count, by `wc -l`):
```
2680  blocks/product-customizer.liquid   — already scheduled for removal (moving to shopify-app)
 876  sections/main-collection.liquid
 746  sections/breadcrumbs.liquid
 743  blocks/product-buy-buttons.liquid
 612  blocks/product-media.liquid
 550  sections/header-2.liquid
 505  sections/section.liquid
 478  blocks/product-shipping-progress.liquid
 435  blocks/card.liquid
 432  blocks/product-testimonial.liquid
```

**Duplicated markup that should be shared components** (verified):
- Three badge implementations doing overlapping jobs: `blocks/badge.liquid`
  (156 lines), `blocks/material-badge.liquid` (78), `blocks/product-badges.liquid`
  (89).
- Trust-checkmark markup repeated across `blocks/trust-checkmark.liquid`,
  `blocks/product-trust-checkmarks.liquid`, and `blocks/trust-countdown.liquid`.
- Card markup reimplemented in multiple places despite
  `snippets/product-card.liquid` already existing as the shared component.
- A `#shopify-block-{{ block.id }}` padding-CSS boilerplate block pasted
  near-verbatim across many block files instead of being shared.
- **Not a duplicate** (correcting an earlier pass on this): `blocks/collection-grid.liquid`
  and `blocks/collections-grid.liquid` have near-identical names but different
  jobs — `collection-grid` renders products inside a collection,
  `collections-grid` renders sub-collections (via a metafield). This is a
  naming-clarity problem, not a consolidation candidate — rename one or both
  for clarity rather than merging.

**CSS tokens exist but are bypassed:** only 11 of 57 section/block files
reference `var(--...)` at all. The rest hardcode hex values that literally
duplicate existing tokens (e.g. `#0e1a28`, `#ffffff`, `#e2e8f0` reappear as
raw literals in `sections/search.liquid` and `sections/section.liquid`
instead of the corresponding `--color-*` tokens). `product-customizer.liquid`
forks its own private `--color-important` token outside the shared system
(moot once that file is removed, but a pattern worth watching for elsewhere).

**JS logic living in inline `<script>` tags inside sections** instead of
`assets/*.js`: `sections/main-collection.liquid` (~478 lines of inline
script), `sections/header-2.liquid` (~444), `sections/breadcrumbs.liquid`
(~307). `assets/masonry.js` is the one file already doing this right
(single-purpose, 193 lines, lives in `assets/`) — it's the model to follow,
not the exception.

## Proposed slices (independent sub-projects, each committed/verified on its own)

Roughly in priority order, smallest/lowest-risk first:

- **A. Badge consolidation** — merge the 3 badge implementations into 1
  configurable component.
- **B. Trust-checkmark → shared snippet** — dedupe the 3 copies into one
  `snippets/trust-checkmark.liquid`.
- **C. Card markup consolidation** — audit the ~14 places reimplementing
  card markup, migrate them to `snippets/product-card.liquid` (or split it
  into a proper small set of card snippets if the variants genuinely differ).
- **D. Extract inline `<script>` blocks into `assets/*.js`** — per-section
  (header, breadcrumbs, main-collection first, as the three worst offenders).
- **E. Hardcoded-color sweep** — replace literal hex/px values in style
  blocks with the existing `var(--...)` tokens; fold any stray private
  tokens (like `--color-important` in the customizer) into the shared token
  file.
- **F. Naming fix for collection-grid vs collections-grid** — rename for
  clarity (small, isolated, no logic change).
- **G. Split the largest oversized files** (`main-collection.liquid`,
  `breadcrumbs.liquid`, `product-buy-buttons.liquid`, `header-2.liquid`,
  etc.) into single-purpose sub-components, once B–F have reduced the
  duplication those files currently route around.

`product-customizer.liquid` itself isn't in this list — it's already
scheduled for full removal from the theme (moving to `shopify-app` as a
theme app extension), which resolves the single largest offender without a
decomposition effort.
