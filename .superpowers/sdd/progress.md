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

## OPEN — fix these first in the next session

Both from the Task 2 review. Neither is committed as fixed.

1. **`amount_with_space_separator` is unhandled in `assets/header.js:66-78`**
   (Important). The money formatter covers four placeholders; the sibling
   `assets/predictive-search.js:84-105` also handles this fifth one, and it is
   a plausible DKK format (`1 234,56 kr`). If the shop uses it, cart-drawer
   prices fall through to `default:` and render `1,234.56` — wrong prices —
   while `{{ 0 | money }}` in the same drawer renders correctly, so the
   subtotal and the line prices visibly disagree. Fix is one extra `case`.
   Check the shop's actual `money_format` first: if it is not the space
   variant, this is latent rather than live.

2. **HTML inside `money_format` renders inconsistently** (Important). The
   subtotal is written with `innerText` so a `<span class="money">` wrapper
   shows as raw text, while line prices are interpolated into an HTML
   template string and render. `{{ 0 | money }}` renders it too, so the
   markup subtotal and the JS subtotal can disagree. Pre-exists in
   `predictive-search.js`; the cart subtotal is higher-traffic.

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
