# Wave 3 batch — progress ledger

Plan: `docs/wave3-batch.md`. Branch: `claude/wave3-refactor-batch`.
Batch start: v1.0.102, commit 9ffcdfe, theme-check 8 errors / 26 warnings.

Tasks listed complete below are DONE — do not re-dispatch. Resume at the
first task not marked complete.

- Pre-batch: fix 2 surviving render-argument filters in footer-localization
  (commit 9ffcdfe, v1.0.102) — complete.
- Task 1: Mobile menu accordions removed (commit 4059943, review clean) —
  complete. Drawer is a flat link list; `initDrawerAccordion` deleted from
  `assets/navigation.js`, desktop mega-menu half intact. theme-check
  8 errors / 25 warnings (one warning better than baseline).
  Note: `navigation.show_submenu` was NOT removed — the brief's premise that
  only the accordion used it was wrong; `blocks/header-navigation.liquid:145`
  uses it for the desktop dropdown trigger's aria-label. Verified twice.

- Task 2 (R1a): header inline script extracted to `assets/header.js`
  (commit e75250c, review: spec PASS, quality approved with findings) —
  complete, but see the two Important findings below. 443 lines moved;
  reviewer diffed the moved JS function by function against the original and
  found no behaviour drift. 13 hardcoded Danish strings externalised to
  locale keys under `cart` in both locale files; `formatMoney` now driven by
  `shop.money_format`. theme-check 8 errors / 25 warnings, unchanged.

## Fixed — the two Task 2 findings, this session

Checked the shop's actual `shop.currencyFormats.moneyFormat` via the Shopify
Admin GraphQL API first, per the brief: it is
`{{amount_with_comma_separator}} kr` — not the space variant, and it carries
no HTML. Both findings were therefore **latent, not live**, on this store
today, but both are now fixed defensively since either format could be
changed in Settings → General at any time.

1. **`amount_with_space_separator` unhandled** — added the missing `case` to
   `formatMoney` in `assets/header.js` (mirrors
   `assets/predictive-search.js:99-101`).
2. **HTML inconsistency on subtotal** — `assets/header.js`'s two
   `cartSubtotal.innerText = ...` assignments changed to `innerHTML`, matching
   how line prices already render and how `{{ 0 | money }}` would render if
   the format ever carries markup.

Not committed as fixed: `predictive-search.js`'s own subtotal-adjacent
rendering, if any — out of scope, not part of the Task 2 review.

## Task 3 (R1b) — done, this session

`sections/main-collection.liquid`'s inline `<script>` (478 lines: color
swatch styling, filter-list truncation, price-filter sync, AJAX
filter/sort/paginate/collection-chip swapping) extracted to
`assets/main-collection.js`. Only Liquid interpolation in the script was
`{{ section.id }}` (3 call sites, all for the `section_id` fetch param) — now
passed through a `#main-collection-config` JSON island, same pattern as
Task 2's `#header-cart-config`. `window.toggleMobileFilter` /
`toggleFilterBlock` / `filterProducts` / `syncPriceFilters` /
`removeFilterChipUrl` / `clearAllFiltersUrl` exposed on `window` for the
section's inline `onclick`/`onchange`/`oninput` handlers.
`sections/main-collection.liquid` is now 405 lines (was 878).
theme-check: 8 errors / 25 warnings, unchanged.

Not yet verified in a browser — needs task 3's checklist below run against
the live storefront.

## Task 9 (R3e) — done, this session

The plan's "565 lines" was stale: task 2 had already pulled 443 lines of
inline `<script>` out, so `sections/header-2.liquid` stood at 148 lines. Split
along the conceptual seams that were left rather than by line count.

Markup → `snippets/header-mobile-drawer.liquid` (takes `menu_handle`),
`snippets/header-cart-drawer.liquid` and `snippets/header-cart-config.liquid`
(the icon captures moved with the island they feed). Section is now a 65-line
shell: header row block area, three renders, two script tags, schema.

JS → `assets/header.js` keeps the mobile menu toggle and search toggle (76
lines, exposes `toggleMobileMenu` / `toggleSearchInput`); `assets/header-cart.js`
takes the cart drawer, config island, money formatter and add/change/remove
(450 lines, exposes `addToCart` / `changeQuantity` / `removeItem` /
`updateCartUI` / `toggleCartDrawer`). Clean seam — the two files share no
state and neither calls into the other; the config island is cart-only. Both
loaded `defer` from the section, so document order is preserved.

Verified by diffing the old file's non-blank lines against the union of the
two new ones: every code line accounted for, differences are comments and the
duplicated IIFE/`DOMContentLoaded` scaffolding only. Same check on the Liquid.

theme-check: 9 errors / 28 warnings, identical to the v1.0.109 baseline
measured at the start of this session (the docs' "8 errors / 26 warnings" was
stale — corrected in `docs/wave3-batch.md`).

Not yet verified in a browser. Tasks 5–8 were also never browser-verified.

## Browser verification of tasks 5–9 — done (2026-08-07)

Password protection lifted; ran the full checklists in `docs/wave3-batch.md`
against `https://shopify.textilogvoksdug.dk` (confirmed live theme via
`window.Shopify.theme`: `TNT/main`, id `191515623757`, `schema_version
1.0.110`), at mobile (375px) and desktop widths, console open throughout.

- **Task 5 (main-collection)**: collection grid, sort (price-ascending
  re-ordered correctly), availability filter (`?filter.v.availability=1`
  correctly narrowed 279 → 4 products with an active-filter chip), pagination
  (`?page=2`) all work. Console clean.
- **Task 6 (breadcrumbs)**: trail renders on collection and product pages
  (`Forside > Duge > Voksdug > …`), all crumbs link correctly, "Vis hele
  stien" present. Console clean.
- **Task 7 (product-buy-buttons)**: quantity stepper +/− updates price
  correctly (369 → 738 kr at qty 2); add-to-cart succeeded on an in-stock
  product (200) and correctly surfaced the Danish error toast on an
  out-of-stock one (422, "... er allerede udsolgt" — real inventory state,
  not a bug: most catalog items in this store are out of stock). One thing
  worth noting for whoever reads network traces later: Shopify's
  `shopify-perf-kit` script inlines `assets/product-buy-buttons.js`'s content
  directly into the page instead of leaving it as an external `<script src>` —
  confirmed by diffing the served HTML (cache-busted, no-store) against the
  repo file; content matches exactly. Not a stale deploy, just an edge
  optimization — flagging so it isn't mistaken for one next time.
- **Task 8 (product-media)**: gallery, thumbnails (desktop) and dots (mobile)
  both switch the active image and update active-state styling correctly on
  click. Console clean.
- **Task 9 (R3e header split)**: both `assets/header.js` and
  `assets/header-cart.js` load (200) and are wired correctly. Hamburger opens
  the mobile drawer (flat link list, no accordions — matches task 1); search
  icon opens the field with working predictive results on mobile and desktop;
  cart icon opens the drawer. Full cart cycle verified against a real
  in-stock product: add → drawer opens with correct item/price (79,00 kr);
  `+` → qty 2, 158,00 kr; `−` → qty 1, 79,00 kr; delete → empty-cart Danish
  message + 0,00 kr subtotal, all matching product-page prices exactly.
  Backdrop click closes both the cart drawer and the mobile menu drawer
  (verified via the `e.target === drawer` listener actually firing). Console
  clean throughout.

No regressions found. Tasks 5–9 flipped to verified in `docs/wave3-batch.md`.

## Minor findings deferred to final review

- ~~`assets/header.js` is 519 lines covering three concerns~~ — **fixed in
  task 9**, split into `header.js` + `header-cart.js`.
- The money formatter is duplicated in `header-cart.js` and
  `predictive-search.js`. Should become one shared asset. (Line refs below are
  post-task-9; the cart half now lives in `assets/header-cart.js`.)
- Island-missing fallback (`assets/header-cart.js:56`) emits a bare number with
  no currency at all; the old code at least appended `Kr.`.
- `text('removeItem')` is interpolated unescaped into an `aria-label`
  (`assets/header-cart.js:247`); a `"` in a translation would break the
  attribute.
- Still-hardcoded Danish, now in `snippets/header-mobile-drawer.liquid`
  ("Menu", "Forside", "Brug for hjælp?", "Ring til os", "Luk menu") and
  `snippets/header-cart-drawer.liquid` ("Din Indkøbskurv", "Subtotal", "Gå til
  betaling", and the `"Fri fragt ved køb over 499 kr."` policy line), plus the
  Unsplash placeholder URL in `assets/header-cart.js`. Genericisation
  blockers, out of scope for tasks 2 and 9.

## Task 10 — R2 card consolidation — done (2026-08-07, v1.0.111)

Implemented per `docs/superpowers/specs/2026-08-07-r2-card-consolidation-design.md`,
all seven sub-tasks R2a–R2g. `snippets/product-card.liquid` drops 196 → 130
lines and is now composition + data resolution only.

**New snippets**: `savings-badge.liquid` (sizes `sm`/`lg`, replaces the badge
duplicated between `product-card` and `blocks/product-price.liquid`),
`star-rating.liquid`, `product-card-image.liquid`, `product-card-price.liquid`,
`search-result-row.liquid`. `snippets/button.liquid` gained a `size` param
(`md` default / `sm`); the `md` output is byte-identical to before, so no
existing caller changes.

**Deviation from the design, recorded**: the design's snippet table lists
`product-card-image.liquid` as taking `product` + `is_minimal`, but its prose
keeps the badge-from-tags loop in `product-card`'s setup block. Those are
inconsistent — the badge has to cross the boundary somehow. Kept the loop in
the setup block (as the prose says) and added `badge` as a third param.

**Verification, and its limits.** theme-check went 9 errors / 28 warnings →
9 errors / **26** warnings, the two removed being the `RemoteAsset` offenses
on the mock cross-sell images R2f deleted. Diffed offense-by-offense, not by
totals. Code-identity check for R2a–R2d: extracted every `class="…"` string
from the pre-change `product-card.liquid` and confirmed all but three appear
byte-identical in the new files — the three are the rating wrapper (now
`{{ wrapper_class }}`, caller passes the same two values), the savings pill
(now the `sm` branch, same string) and the buy button (R2e's intended change).
Confirmed theme-wide that no `{% render %}` tag contains a filter, via a
multiline scan, not a line-based grep.

Two things this does **not** establish, and both matter:

1. Nothing here rendered a page. R2e and R2g change appearance on purpose and
   have no lint-level argument at all. Browser checklist for task 10 in
   `docs/wave3-batch.md` was rewritten with the real surface list.
2. theme-check does **not** validate render args against `{% doc %}` params —
   verified by injecting a bogus param and getting zero offenses. So the clean
   run says nothing about whether the five new snippets' parameter contracts
   are correct; that rests on reading. Recorded in `docs/wave3-batch.md`,
   along with the fact that the "Global constraints" section names the wrong
   check for filters-in-render-args (`UnsupportedFilterArguments` never fires;
   it shows up as `UnusedAssign`).

**Pre-existing bug fixed (R2e)**: card buy buttons were `text-primary` on
`bg-accent`, which in dark mode is `#ffffff` on `#ffd814` — ~1.4:1, against a
4.5:1 AA floor. Adopting `button.liquid` makes it `text-on-accent` (~12.6:1).
Side effect accepted: the button also gains `shadow-sm` / `active:scale-95`
and `transition-all` instead of `transition-colors`.

**Backlog untouched, from the design doc**: the JS half of the savings badge
in `blocks/product-price.liquid` (its inline script rebuilds the price
container's `innerHTML`, so the badge markup still exists twice in that file);
the label divergence `"[savings] % rabat"` vs `"Spar X%"`; `#c8102e` and
`#FFB800` → tokens, now one site each instead of three, for R6.

### Task 10 — browser verification (2026-08-07, dev theme #194234384717)

Pushed the branch to the existing development theme and compared it against
live `TNT/main` (#191515623757) by pinning `preview_theme_id` per request.

**Verified good:**

- **R2a–R2d, collection grid**: rendered card HTML compared card-by-card
  across four collections. `/collections/voksdug` (50 cards) and
  `/collections/gennemsigtig-voksduge` (3) are byte-identical to v1.0.110.
  The two collections with a sale badge differ by **exactly two whitespace
  characters** (a space either side of the badge `<span>`, 2360 → 2362 bytes);
  the span's classes and text are identical. Proved harmless: the parent is
  `display:flex`, the whitespace text nodes return 0 client rects, and
  `container.children.length` stays 1.
  A 1.2px price-row difference seen early on was **font-load timing, not
  markup** — proved by injecting live's price markup into the dev page and
  getting the same height for both markups in the same page state.
- **R2e contrast fix**, measured against live tokens with `.dark` applied:
  old `text-primary` on `bg-accent` = **1.39:1**, new `text-on-accent` =
  **12.6:1**. Confirms the design doc's estimate numerically.
- **R2g product grid**: 3 columns / 397.6px at 1280px, 2 columns / 163.6px at
  375px, no horizontal overflow — matches the collection page.

**Two real bugs found and fixed during verification** (both mine, both in
R2g, both silent):

1. `.search-results` (`assets/input.css:1044`) is an auto-fill grid left over
   from the per-item rows R2g replaced. Both new wrappers were single children
   of it, so each was squeezed into one 200px cell instead of the full 1241px.
2. `lg:grid-cols-3` **is not in `assets/output.css`** — it is a prebuilt
   Tailwind file and no file used that class before, so it was purged and did
   nothing. Desktop silently stayed at 2 columns. Same for
   `group-hover:text-secondary` on the row title.

Fixed with a `{% style %}` block in `sections/search.liquid` (the convention
`blocks/collection-products-grid.liquid` already uses) setting the columns and
`grid-column: 1 / -1`, and by dropping the dead `group-hover` class. Added a
check that scans for classes not present anywhere before the commit —
it now reports NONE. **Do not add a Tailwind class to this theme without
checking `output.css`, or rebuild it.**

**Resolved — was not a defect (2026-08-07, dev theme #194234384717):**

The reported `search-result-row` dark-mode contrast bug (`bg-card-light`
painting `#F8F9FD` at ~1.05:1 while `--color-card-light` resolved to
`#1a2635`) **does not exist**. It was an artifact of how it was measured. No
theme file needed changing.

Root cause of the false reading: the repro toggled dark mode at runtime with
`document.documentElement.classList.add('dark')` in an automation tab whose
`document.visibilityState` is `"hidden"`. A hidden tab composites no frames,
so the animation clock never advances. The row carries `transition-all
duration-300`, so the class change started a `background-color` CSSTransition
that stayed `playState: "running"` at `currentTime: 0` — pinned at the *start*
(light) colour indefinitely. `getComputedStyle` faithfully reports that
in-flight value, which is why the variable read `#1a2635` while the paint read
`#F8F9FD`. The same applies to the search form's input wrapper
(`transition-all`, 0.15s) — also not a defect.

That also explains why "most other `bg-card-light` elements were fine": the
footer, nav panels, drawer and predictive-search panel have no colour
transition, so they repaint instantly.

Evidence:

- `row.getAnimations()` → `CSSTransition background-color, running,
  currentTime: 0`. Calling `.finish()` on it immediately yields
  `rgb(26, 38, 53)` = `#1a2635`.
- A clone with the **identical class list in the same parent** renders
  `#1a2635`, while the original renders `#F8F9FD` — so it is element state, not
  CSS. Leave-one-out over all 14 classes never reproduced it on a fresh node.
- On a genuine dark load (`localStorage.theme = 'dark'` set *before* reload, so
  no transition ever runs): row background `rgb(26, 38, 53)` = `#1a2635`, zero
  running transitions, title `#ffffff` at **15.30:1**, type label at 8.19:1,
  icon at 11.40:1. The search form wrapper reads `rgb(30, 41, 59)` = `#1e293b`,
  also correct.
- Light mode: background `#F8F9FD`, title `#0e1a28`, **16.67:1**.

**Two probe traps to avoid when debugging CSS on this theme:**

1. Walking `document.styleSheets[i].cssRules` flatly finds **nothing** — the
   whole of `assets/output.css` is inside `@layer theme/base/utilities`, so
   every rule is nested one level down in a `CSSLayerBlockRule.cssRules`.
   The earlier "no rule sets `background-color` on this element" result was
   this false negative; recursing finds `.bg-card-light` in `@layer utilities`
   exactly as expected. Recurse into any rule exposing `.cssRules`.
2. Never toggle `.dark` at runtime to check colours in a headless/hidden tab.
   Set `localStorage.setItem('theme','dark')` and reload, so the inline script
   in `layout/theme.liquid` applies the class before first paint and no
   transition is involved. (The `computer` screenshot action fails on a hidden
   pane with "the page is not compositing frames" — same underlying cause.)

Also confirmed while here: `dark:` compiles as a class variant
(`&:where(.dark, .dark *)` in `output.css`), not a `prefers-color-scheme`
media query, so `dark:` utilities do follow the manual toggle.

**Could not be verified at all:** every product-page surface — related
products, complementary products (R2f), the R2e button in situ, star-rating,
and R2a's `lg` badge. `shopify theme push` rejects three files for
**pre-existing** reasons (`product-price.liquid` `price_suffix` needs a
default; `product-buy-buttons.liquid` has a >70-char setting label;
`product-recommendations.liquid:36` puts a filter inside the
`{% recommendations %}` tag argument, so the CLI reports "Unknown tag"). All
three are unchanged on `main` and fail identically there. Because
`templates/product*.json` reference those blocks, they fail too and the dev
theme returns **404 for every product page**. The live theme renders them
fine, so the GitHub-connection deploy path is more lenient than `theme push`.
Verifying those surfaces needs either those three pre-existing errors fixed
(their own task) or a merge to main.
