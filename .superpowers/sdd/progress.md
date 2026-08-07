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
