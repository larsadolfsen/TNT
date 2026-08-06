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

## Minor findings deferred to final review

- `assets/header.js` is 519 lines covering three concerns (mobile menu,
  search toggle, cart drawer) — the project's one-purpose-per-file rule points
  at a split. Natural fit for the R3 stage of this batch.
- The money formatter is now duplicated in `header.js` and
  `predictive-search.js`. Should become one shared asset.
- Island-missing fallback (`assets/header.js:62`) emits a bare number with no
  currency at all; the old code at least appended `Kr.`.
- `text('removeItem')` is interpolated unescaped into an `aria-label`
  (`assets/header.js:285`); a `"` in a translation would break the attribute.
- `assets/header.js` header comment is 12 lines against the stated 2-3.
- Still-hardcoded Danish in `sections/header-2.liquid` markup, including a
  `"Fri fragt ved køb over 499 kr."` policy line, plus an Unsplash
  placeholder URL. Genericisation blockers, out of scope for Task 2.
