# Theme handoff — 2026-08-05

Start here, then `docs/optimization-master-plan.md` → "Status and remaining
sequence". The app is a **separate repo and a separate session**:
`larsadolfsen/tnt-by-the-meter-app`, see its own `HANDOFF.md`.

## Context

This is a client Shopify theme being genericised for Shopify Theme Store
sale. **It is a development store, not production** — no real customers, no
revenue at risk. Bugs are must-fix-before-launch, not incidents.

Live at `shopify.textilogvoksdug.dk`. GitHub → Shopify sync is enabled, so
**pushing to `main` deploys**. The sync is two-way: always `git fetch` and
rebase before pushing, or you'll collide with "Update from Shopify" commits.

Current version: see `package.json`. Bump the patch in **both**
`package.json` and `config/settings_schema.json` on every push
(`.agents/AGENTS.md`).

## State

Waves 0–2 of the plan are complete: app extraction, genericisation, the
atomic primitives library, and all 16 missing Theme Store surfaces.
theme-check sits at **8 errors / 34 warnings** — below the original 12-error
baseline. Don't let it regress.

## The lesson from today: theme-check proves nothing

A browser pass found four real bugs in ten minutes that theme-check was
blind to, because valid Liquid can still produce broken pages. Anything not
opened in a browser should be assumed unverified.

Fixed today:
- **100× card pricing** — an eight-way `or` chain multiplied ~30
  already-per-meter products a second time (69,00 kr rendering as 6.900,00).
- **Per-cm headline price** — cards and the product page led with "0,79 kr"
  (reads as 79 øre). Now leads with the unit price when
  `unit_price_measurement` exists. Gated on that alone — no product type, no
  metafield — so the theme stays free of app coupling.
- **Account + cart icons clipped off the mobile header** — the centre header
  group had `flex-grow: 1` *and* `width: 100%` while the side groups were
  `flex-shrink: 0`, so the row overflowed and swallowed whatever sat last.
  Latent since v1.0.47; adding the account block in Wave 2 exposed it.

## In flight when this was written

**Filters do not evaluate inside `{% render %}` keyword arguments.** The
literal unfiltered string is passed. Confirmed from live rendered HTML, not
theory — this is the same limitation that broke the app's deploy.

It causes at least three visible failures:
- `newsletter-form.liquid` — `label: 'newsletter.submit' | t` renders the
  raw key, and an unfiltered `attributes:` string ends in an **unterminated
  quote** that swallows following markup, producing structurally broken HTML
  (the error `<p>` lost its `class="hidden"` and is permanently visible).
- `header-search-icon.liquid:115` — the panel gets `id: 'mobile-'` instead of
  `mobile-<block id>`, so it no longer matches the input's `aria-controls`
  and **predictive search silently finds no results panel**.
- ~16 call sites total across product-card, localization-picker,
  account-panel, contact-form, trust-countdown, product-description.

An agent was fixing these. **Check `git log` and any
`.claude/worktrees/agent-*` branches** — if the work is uncommitted or
partial, finish it. Detection grep:

```
grep -rn "render '" --include="*.liquid" sections/ blocks/ snippets/ layout/ \
  | grep -v product-customizer | grep -E "render '[a-z-]+',[^%]*\|"
```

Fix pattern: precompute with `assign`/`capture` immediately before the
render, pass the plain variable. Inside `{% for %}` loops the assign must go
in the loop body.

## Next up

1. **Mobile menu: remove accordions.** Decided: every drawer item becomes a
   plain link; child links are not shown at all (collection pages already
   list subcategories). Touches header files — do it after the render-filter
   fix lands.
2. **Finish the browser pass.** Not yet opened: cart page (discount rows +
   summary panel), footer country/language selector, `/pages/contact`,
   related & complementary recommendations, pickup availability (the store
   *does* have pickup configured — checkout shows Afsend/Afhentning).
3. **Wave 3** (`R1`–`R6`): extract inline JS, consolidate card markup, split
   oversized files, grid→flex, token sweep. **Deliberately held** until the
   browser pass finishes — R1/R3 rewrite `header-2.liquid` and
   `main-collection.liquid`, and refactoring unverified code makes any
   regression unattributable. `R4` is separately blocked, see below.
4. **Wave 4**: accessibility ≥90 and performance ≥60 (Lighthouse), demo
   store, `/listings` folder, submit.

## Open decisions

- **Grid→flex product page** (`docs/grid-to-flexbox-migration.md`) — blocks
  R4 only. Accept Title/Trust moving below the gallery on mobile in exchange
  for deleting a duplicate-content hack, or keep that component on Grid.
- **The 3 test Metervare products** — configure, unpublish, or delete.
- **Lighthouse baseline still not captured.** The storefront is unreachable
  from the build container (proxy denies CONNECT), so it must be run from a
  local machine before Wave 4 targets can be measured.

## Blocked on the app session

- **B4** — delete `blocks/product-customizer.liquid` (2 680 lines, the single
  largest file) and `templates/product.Metervare.json`.
- **A4.6** — remove the theme's `item.properties._metervare_title` reads in
  `sections/cart.liquid` and `sections/header-2.liquid`. These are the last
  metervare references in the theme; the cart-transform already sets the
  bundle title, so the special-casing is probably redundant.

Until both land, the theme keeps a little client-specific code. Everything
else about metervare is already gone.
