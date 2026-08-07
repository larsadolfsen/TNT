# Task 6 (batch 2) — Q3: cart drawer accessibility — report

## Files changed
- `snippets/header-cart-drawer.liquid`
- `assets/header-cart.js`
- `package.json` (1.0.119 -> 1.0.120)

## Markup changes
- Panel `<div class="bg-white w-5/6 ...">` (the `drawer.querySelector("div")`
  target already used by `toggleCartDrawer`) now has `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby="cart-drawer-heading"`.
- The heading `<span>Din Indkøbskurv</span>` now has `id="cart-drawer-heading"`.
  No new hardcoded string was introduced; the existing visible heading is
  reused as the accessible name via `aria-labelledby`, per the brief.
- Close button (`aria-label="Luk kurv"`) is confirmed a real `<button
  type="button">` — focusable, no change needed there.

## Open/close path analysis

There is a single chokepoint: `toggleCartDrawer(open)` in `assets/header-cart.js`.
Every open and close in the codebase goes through it — verified via grep:
- Open: `blocks/header-cart.liquid` inline `onclick` (cart icon trigger), and
  `addToCart()` after a successful `/cart/add.js` call. Both call
  `toggleCartDrawer(true)`.
- Close: the drawer close `<button>`, the "Fortsæt med at handle" button
  (both `onclick="toggleCartDrawer(false)"`), and the backdrop-click handler
  registered on `DOMContentLoaded` (`cartDrawer.addEventListener("click", ...)`
  checking `e.target === cartDrawer`). All three call `toggleCartDrawer(false)`.
- Escape is a fourth close path, added inside `onCartDrawerKeydown`, which
  itself calls `toggleCartDrawer(false)` — so it reuses the same single close
  branch rather than duplicating cleanup logic.

Because every open/close funnels through this one function, the listener
lifecycle is simple and centralized (unlike predictive-search, which has a
per-instance `open`/`close` closure — here there's one drawer, one function,
matching the existing code's structure rather than inventing a duplicate
per-instance pattern):

- **Open branch**: stores `document.activeElement` into module-scoped
  `lastFocusedBeforeCartDrawer`, focuses the first focusable element inside
  the panel (the close button, since it's the first `button`/`a[href]`/`input`
  in DOM order), then adds the `keydown` listener
  (`document.addEventListener("keydown", onCartDrawerKeydown, true)`, capture
  phase, mirroring predictive-search's `true` third arg).
- **Close branch**: removes the same listener
  (`document.removeEventListener("keydown", onCartDrawerKeydown, true)`),
  restores focus to `lastFocusedBeforeCartDrawer` (guarded: only if truthy and
  `typeof .focus === "function"`, same guard predictive-search uses), then
  clears the stored reference to `null`.

Listener leak check: the listener is added only in the `open` branch and
removed only in the `else` (close) branch, both inside the same
`toggleCartDrawer` function, and `toggleCartDrawer` is the sole open/close
entry point (confirmed via grep — no other code calls
`addEventListener("keydown", ...)` for the cart drawer). So the listener is
attached at most once per open and always removed by the matching close call,
regardless of which of the four close triggers fired. Calling `toggleCartDrawer(false)`
while already closed is a harmless no-op re-removal (removeEventListener on an
absent listener is a no-op; focus restore no-ops since
`lastFocusedBeforeCartDrawer` is already `null` after the first close).

## Focus trap and dynamic re-render

`renderCart()` rewrites `#cart-items` via `cartItemsContainer.innerHTML = ...`
while the drawer can be open (e.g. quantity change, remove item, or the
`updateCartUI()` refresh triggered by `toggleCartDrawer(true)` itself). The
Tab handler in `onCartDrawerKeydown` queries
`panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')`
fresh on every `keydown` event rather than caching the list at open-time —
same approach as predictive-search's `onKeydown`. This means the trap can
never go stale after a re-render: quantity +/- buttons, remove buttons, and
the checkout link that get added/removed inside `#cart-items` are picked up
or dropped automatically on the next Tab press.

## What was intentionally not added

The brief scoped this to focus capture/restore, Escape, and Tab cycling —
not the `inert`/`aria-hidden` background-freezing behavior predictive-search
also has for its mobile takeover. That wasn't requested and wasn't added, to
keep the diff to what was asked.

## Verification
- `node --check assets/header-cart.js` — passes.
- Static self-review above (open/close chokepoint, listener lifecycle,
  keydown-time focusable query) — done, no leak found.
- Browser check deferred to controller — no browser available in this
  environment.

## Constraints check
Only `assets/header-cart.js`, `snippets/header-cart-drawer.liquid`, and
`package.json` were touched. No visual/class-toggle/cart-logic changes were
made beyond the added focus/keydown calls.
