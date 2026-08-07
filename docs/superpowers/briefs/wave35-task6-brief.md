# Task 6 (batch 2) — Q3: cart drawer accessibility

The cart drawer (`blocks/header-cart.liquid` markup + drawer markup in
`snippets/header-cart-drawer.liquid`, behavior in `assets/header-cart.js`)
currently has: no `role="dialog"`, no `aria-modal`, no Escape-to-close, no
focus trap, no focus restoration. The theme already contains a correct
reference implementation: the predictive-search mobile takeover in
`assets/predictive-search.js` (~lines 749-800: last-focused capture, Escape
handling, Tab focus cycling between first/last focusable, focus restore on
close). Mirror its approach — do NOT invent a different pattern and do NOT
add any library.

## Required behavior

1. Markup (`snippets/header-cart-drawer.liquid`): the drawer panel element
   gets `role="dialog"`, `aria-modal="true"`, and an `aria-label` — use the
   existing visible heading text ("Din Indkøbskurv") via
   `aria-labelledby` pointing at the heading's id (add an id to the heading
   if it lacks one) rather than hardcoding a new string.
2. JS (`assets/header-cart.js`), in the open/close path (`toggleCartDrawer`
   or wherever open/close actually happens — read the file first):
   - On open: store `document.activeElement`, move focus to the first
     focusable element inside the drawer (the close button if present).
   - While open: `keydown` listener — `Escape` closes the drawer; `Tab`
     cycles focus within the drawer (first/last focusable, mirroring
     predictive-search.js's implementation).
   - On close (any path: close button, backdrop click, Escape): remove the
     keydown listener and restore focus to the stored element (guard: only if
     it still exists and has a .focus function, same as predictive-search).
3. Do not change any visual behavior, class toggling, or the cart update
   logic. The backdrop-click close path must keep working.

## Verification (no browser available to you)

- `node --check assets/header-cart.js`.
- Static self-review: list each open path and close path in the file and
  state where focus goes / which listeners attach-detach for each. Confirm
  the keydown listener cannot leak (attached once per open, removed on every
  close path).
- Confirm by reading `snippets/header-cart-drawer.liquid` that the close
  button is a real <button> (focusable). If the drawer's interactive elements
  are dynamically re-rendered by updateCartUI/renderCart (innerHTML), state
  whether the focus trap queries focusables at keydown-time (predictive-search
  pattern queries at event time — do the same so re-renders can't stale the
  trap).
- Browser check deferred to controller; say so.

## Constraints

- Files: `assets/header-cart.js`, `snippets/header-cart-drawer.liquid`,
  `package.json` (version bump one patch). NOTHING else — if you believe
  another file must change, stop and return NEEDS_CONTEXT with the reason.
- Commit when done (do NOT push).
