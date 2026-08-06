# Wave 3 batch — tasks, order, and per-task browser checklist

Companion to `docs/optimization-master-plan.md` (Wave 3 table). This file
holds the executable task list for the batch and, for each task, **exactly
what a follow-up session must open in a browser to verify it**.

## How this batch was authorised

The standing rule in `.agents/AGENTS.md` is "build in parallel, land one at a
time, verify each before the next". For this batch the user explicitly chose
the opposite trade: *implement everything, then clean up one feature at a
time in a new session each*. That is a deliberate override, not a lapse.

The cost it accepts: every task below lands **lint-verified only**. The
plan's stated test for all of Wave 3 is browser-based, and the storefront is
unreachable from the build container. The mitigation is this file — each task
carries a precise browser script so the follow-up sessions verify rather than
guess.

## Global constraints (bind every task)

- Bump the patch in **both** `package.json` and `config/settings_schema.json`
  on every push.
- No `!important` in CSS.
- `theme-check` must not regress from the **8 errors / 26 warnings** baseline
  at v1.0.102. Run `npx shopify theme check`.
- **Never put a filter inside a `{% render %}` argument.** Precompute with
  `assign`/`capture` immediately before the render and pass the plain
  variable; inside a `{% for %}` loop the assign goes in the loop body.
  `theme-check`'s `UnsupportedFilterArguments` is the detector — a line-based
  grep cannot see multi-line render tags and will report false clean.
- One clear purpose per file; componentise down to the smallest primitive and
  use it via `{% render %}` rather than re-inlining markup.
- Every source file carries a 2–3 line header comment: what it does, what it
  exposes, key dependencies. Add one where missing; update it when the file's
  job changes.
- Recurring CSS values are tokens (`var(...)`) defined once, never repeated
  literals.

## Task order

Ordered so overlapping files are touched once and in a safe sequence. R1
(extract JS) precedes R3 (split files) because extraction shrinks the files
R3 targets. R6 (token sweep) runs last because it touches everything.

**R4 is excluded** — blocked on the product-page mobile-ordering decision in
`docs/grid-to-flexbox-migration.md`.

| # | Task | Files | Status |
|---|------|-------|--------|
| 1 | Mobile menu: remove accordions | `sections/header-2.liquid` | **done** (4059943) |
| 2 | R1a — extract header inline script | `sections/header-2.liquid` → `assets/header.js` | **done** (e75250c), 2 open findings |
| 3 | R1b — extract main-collection inline script | `sections/main-collection.liquid` → `assets/` | **done**, unverified in browser |
| 4 | R1c — extract breadcrumbs inline scripts (2) | `sections/breadcrumbs.liquid` → `assets/` | **done**, unverified in browser |
| 5 | R3a — split `main-collection.liquid` (878 lines) | `sections/main-collection.liquid` | pending |
| 6 | R3b — split `breadcrumbs.liquid` (746) | `sections/breadcrumbs.liquid` | pending |
| 7 | R3c — split `product-buy-buttons.liquid` (796) | `blocks/product-buy-buttons.liquid` | pending |
| 8 | R3d — split `product-media.liquid` (620) | `blocks/product-media.liquid` | pending |
| 9 | R3e — split `header-2.liquid` (565) | `sections/header-2.liquid` | pending |
| 10 | R2 — card markup consolidation | `snippets/product-card.liquid` + card surfaces | pending |
| 11 | R5 — shared padding-CSS boilerplate → snippet | blocks with repeated padding CSS | pending |
| 12 | R6 — hex→token sweep | all remaining files | pending |

## Per-task browser verification

Each entry is the script for the follow-up session that cleans up that task.
Storefront: `https://shopify.textilogvoksdug.dk`.

### 1 — Mobile menu: remove accordions
Open any page at mobile width, tap the hamburger. Every drawer item must be a
plain tappable link that navigates on tap. No expand/collapse chevrons, no
child links, nothing that toggles instead of navigating. Tap 3–4 items and
confirm each lands on its collection page.

### 2 — R1a, header script extraction
Mobile: hamburger opens and closes the drawer. Desktop: mega menu opens on
hover/focus. Cart icon opens the cart drawer. Search icon opens the search
field and predictive results appear. Check the browser console for errors on
load — an extraction that drops a Liquid-dependent value usually shows up as
`undefined` there.

Then exercise the cart drawer specifically, since 443 lines of it moved:
add a product, change its quantity with `+` and `−`, remove it, and empty the
cart completely. **Watch the prices.** Every price in the drawer must match
the product page, and the subtotal must match the line totals. The formatter
was rewritten to read `shop.money_format`, and there is a known open gap
(`amount_with_space_separator`, see `.superpowers/sdd/progress.md`) that would
show as `1,234.56` where the rest of the site says `1.234,56`. Also confirm
the empty-cart message reads Danish and not a raw `cart.…` key.

### 3 — R1b, collection script extraction
Open a collection page. Filters apply and clear; sort dropdown reorders;
pagination or infinite scroll advances. Console clean.

### 4 — R1c, breadcrumbs script extraction
Open a product inside a nested collection. The breadcrumb trail renders the
full path and each crumb navigates. Console clean.

Note: of the section's two `<script>` tags, only the scroll/drag/fade
behaviour script moved to `assets/breadcrumbs.js` (it had no Liquid
dependency, so no config island was needed). The JSON-LD block is pure
Liquid-rendered structured data with no JS logic to extract — moving it to a
JS file would make it client-injected instead of present in the initial
HTML, a real SEO tradeoff, so by decision it stays inline.

### 5–9 — R3 file splits
Per file, the test is *no visible change at all*. Open the surface the file
owns before and after, at mobile and desktop, and compare: collection page
(5), breadcrumb trail (6), product page buy buttons incl. quantity and
add-to-cart (7), product gallery incl. thumbnails, zoom and variant image
switching (8), header at both widths (9).

### 10 — R2, card consolidation
Every surface that renders a product card: collection grid, search results,
related products, complementary products, cart recommendations, homepage
featured collection. Check price, badge, image aspect and hover state on
each, in **both light and dark mode**. This is the task most likely to
produce a subtle visual regression.

### 11 — R5, padding snippet
Spot-check blocks that had custom padding settings: change a block's padding
in the theme editor and confirm it still applies.

### 12 — R6, token sweep
Sweep light and dark mode across homepage, collection, product, cart and
footer. Look for any element whose colour did not follow the theme switch —
that is a hex that was tokenised to the wrong token.

## Known-good baseline at batch start

- Version 1.0.102, branch `claude/wave3-refactor-batch`.
- `theme-check`: 8 errors / 26 warnings. The 8 errors are 7×
  `ImgWidthAndHeight` (`sections/cart.liquid:17`,
  `sections/collection-subcategories.liquid` ×6) and 1×
  `ParserBlockingScript` (`layout/theme.liquid:72`). All pre-existing.
