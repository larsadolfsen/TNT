# Task 1 — Q7 shared money formatter + Q15 cart-counter query fix

Repo: Shopify theme (Liquid + vanilla JS in `assets/`). No bundler — scripts
load via `<script src defer>` tags; deferred scripts execute in document
order, so a script tagged in `layout/theme.liquid`'s head runs before any
section/block script.

## Q7 — extract the duplicated money formatter

`formatWithDelimiters` + `formatMoney` exist near-verbatim in two files:

- `assets/header-cart.js:43-76` — `formatMoney(cents)` reads `moneyFormat`
  from an enclosing closure (populated from the `#header-cart-config` JSON
  island).
- `assets/predictive-search.js:72-106` — `formatMoney(cents, format)` takes
  the format as a parameter.

Do:

1. Create `assets/money.js` with a 2–3 line header comment (file-header rule)
   exposing ONE global, e.g.:
   `window.themeMoney = { formatMoney: function (cents, format) {...} }`
   — signature takes the format string as a parameter (the
   predictive-search shape, which is the more general one).
   `formatWithDelimiters` stays private inside the IIFE.
   Semantics must match the existing implementations exactly, including the
   `amount_with_space_separator` case and the no-format fallback behavior
   currently in `header-cart.js:56` (if `!format`, format with
   precision 2, thousands `.`, decimal `,` and return the bare number — keep
   that exact fallback inside the shared function when `format` is falsy).
2. Load it from `layout/theme.liquid`: add
   `<script src="{{ 'money.js' | asset_url }}" defer="defer"></script>`
   immediately before the existing script tags in the `<head>` (find where
   other `asset_url` scripts are tagged and put it first among them). This is
   the ONLY liquid file you may touch, and only this one added line.
3. In `assets/header-cart.js`: delete the local `formatWithDelimiters` and
   `formatMoney`; replace calls with a thin local
   `function formatMoney(cents) { return window.themeMoney.formatMoney(cents, moneyFormat); }`
   so call sites stay unchanged.
4. In `assets/predictive-search.js`: delete the local pair; point calls at
   `window.themeMoney.formatMoney(cents, format)`.
5. Grep to confirm no other `assets/*.js` defines `formatWithDelimiters`
   (`assets/header.js` should NOT define one anymore — if it does, migrate it
   the same way and report it).

## Q15 — `querySelectorAll('#cart-counter')`

`#cart-counter` is a unique ID (`blocks/header-cart.liquid:9`). Three call
sites query it with `querySelectorAll` and loop:

- `assets/product-buy-buttons.js:228`
- `assets/header-cart.js:105`
- `assets/header-cart.js:273`

Replace each with `document.getElementById('cart-counter')` + a null guard
(match the style already used at `assets/product-buy-buttons.js:274`).
Preserve the exact update logic each loop body performs.

## Constraints

- Files you may touch: `assets/money.js` (new), `assets/header-cart.js`,
  `assets/predictive-search.js`, `assets/product-buy-buttons.js`,
  `layout/theme.liquid` (one added line only), `package.json` (version bump).
- Bump `package.json` `"version"` by one patch (project rule: version bump on
  every push).
- No behavior change: prices must render identically; cart counter must
  update identically.
- There is no JS test suite in this repo. Verification is: (a) `node --check`
  on every touched/created JS file; (b) a small Node script you write in the
  scratchpad that loads the formatter logic (copy the function body into the
  test, or `require` the file with a stubbed `window`) and asserts, for
  cents=123456: format `{{amount}}` → `1,234.56`, `{{amount_no_decimals}}` →
  `1,235` (verify against implementation: it uses precision 0), 
  `{{amount_with_comma_separator}}` → `1.234,56`,
  `{{amount_no_decimals_with_comma_separator}}` → `1.235`,
  `{{amount_with_space_separator}}` → `1 234,56`, and the falsy-format
  fallback → `1.234,56`. IMPORTANT: derive expected values from the CURRENT
  behavior of the existing code first (run the old function in Node), then
  assert the new shared function matches the old outputs exactly — old
  behavior is the spec, not my table above.
- Commit everything when done (git add + commit on the current branch;
  do NOT push).
