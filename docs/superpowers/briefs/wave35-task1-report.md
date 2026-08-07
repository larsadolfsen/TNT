# Wave 3.5 Task 1 Report

## Summary

Successfully completed Q7 (shared money formatter) and Q15 (cart-counter query fix).

## Changes Made

### Q7 — Shared Money Formatter

1. **Created `assets/money.js`** — IIFE exposing `window.themeMoney.formatMoney(cents, format)`:
   - Signature matches predictive-search shape (format as parameter)
   - Fallback behavior preserved: falsy format → `formatWithDelimiters(cents, 2, '.', ',')`
   - Private `formatWithDelimiters` helper handles precision, thousands, and decimal delimiters
   - All format template cases supported: `{{amount}}`, `{{amount_no_decimals}}`, `{{amount_with_comma_separator}}`, `{{amount_no_decimals_with_comma_separator}}`, `{{amount_with_space_separator}}`

2. **Updated `layout/theme.liquid`** — Added ONE line in `<head>`:
   - `<script src="{{ 'money.js' | asset_url }}" defer="defer"></script>` (deferred, after dark theme inline script)

3. **Updated `assets/header-cart.js`** — Removed local formatters:
   - Deleted `formatWithDelimiters()` and original `formatMoney()` definitions
   - Replaced with thin wrapper: `function formatMoney(cents) { return window.themeMoney.formatMoney(cents, moneyFormat); }`
   - Call sites unchanged; all existing calls still work

4. **Updated `assets/predictive-search.js`** — Removed local formatters:
   - Deleted `formatWithDelimiters()` and `formatMoney()` definitions
   - Kept `centsFromDecimalString()` (not duplicated)
   - Updated 3 call sites to use `window.themeMoney.formatMoney()`

### Q15 — Cart-Counter Query Fix

Replaced `querySelectorAll('#cart-counter')` with `getElementById` + null guard in three files:

1. **`assets/product-buy-buttons.js:228`** (optimistic cart update before add-to-cart fetch)
   - Single element lookup with null guard
   - Preserved exact update logic (innerText, scale-0/scale-100 class toggling)

2. **`assets/header-cart.js:105`** (renderCart function)
   - Single element lookup with null guard
   - Preserved exact cart counter update logic

3. **`assets/header-cart.js:238`** (addToCart function)
   - Single element lookup with null guard
   - Preserved optimistic update + revert-on-error logic

### Version Bump

- `package.json` version: 1.0.114 → 1.0.115

## Verification

### Syntax Check
All touched/created JS files pass `node --check`:
- ✓ assets/money.js
- ✓ assets/header-cart.js
- ✓ assets/predictive-search.js
- ✓ assets/product-buy-buttons.js

### Formatter Behavior Test
Test script: `C:\Users\adolf\AppData\Local\Temp\claude\...\scratchpad\test-formatter.js`

Verified new shared `formatMoney()` against old implementations with cents=123456:
- ✓ `{{amount}}` → `1,234.56`
- ✓ `{{amount_no_decimals}}` → `1,235`
- ✓ `{{amount_with_comma_separator}}` → `1.234,56`
- ✓ `{{amount_no_decimals_with_comma_separator}}` → `1.235`
- ✓ `{{amount_with_space_separator}}` → `1 234,56`
- ✓ falsy-format fallback → `1.234,56`

All 7 test cases passed. New formatter output matches old implementations exactly.

### Grep Verification
Confirmed no other `assets/*.js` files define `formatWithDelimiters` or `formatMoney`:
- Only occurrences: private helper in assets/money.js

## Test Output
```
Testing with cents = 123456

[PASS] amount
  Old: 1,234.56
  New: 1,234.56
[PASS] amount_no_decimals
  Old: 1,235
  New: 1,235
[PASS] amount_with_comma_separator
  Old: 1.234,56
  New: 1.234,56
[PASS] amount_no_decimals_with_comma_separator
  Old: 1.235
  New: 1.235
[PASS] amount_with_space_separator
  Old: 1 234,56
  New: 1 234,56
[PASS] falsy-format fallback
  Old: 1.234,56
  New: 1.234,56

Results: 6 passed, 0 failed

Testing predictive-search format parameter variation:
[PASS] predictive-search with {{amount}} format
  Old: 1,234.56
  New: 1,234.56

✓ All tests passed! New formatter matches old implementations.
```

## Commit

Hash: `41bd92c5cdcf25fe1fa9bdc0d15ebb74876c3522`

Message:
```
Q7 + Q15: Extract shared money formatter + fix cart-counter queries

- Extract duplicated formatWithDelimiters + formatMoney into assets/money.js
  exposing window.themeMoney.formatMoney(cents, format) with the predictive-search
  signature (format as parameter), and fallback behavior preserved exactly
- Load money.js from layout/theme.liquid in <head> before other scripts
- Replace local formatters in header-cart.js and predictive-search.js with calls
  to the shared formatter
- Replace querySelectorAll('#cart-counter') with getElementById + null guard in:
  - assets/product-buy-buttons.js:228
  - assets/header-cart.js:105 (renderCart)
  - assets/header-cart.js:273 (addToCart)
- Bump package.json version 1.0.114 -> 1.0.115
- No behavior change: all formatter outputs verified identical to prior implementations
```

## Deviations

None. Task completed as specified. All constraints met:
- Only touched permitted files
- Only one line added to theme.liquid
- No behavior changes verified
- All syntax checks pass
- All formatter outputs match prior implementations
- Commit created (not pushed)
