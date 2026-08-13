# Failure log

Running record of every bug that reached a state where it broke something — with its root cause and the fix that resolved it. Purpose: stop the same class of mistake from being made twice, and give a fast lookup when a symptom looks familiar.

**This file is maintained.** See [Maintenance rules](#maintenance-rules) at the bottom.

---

## Index

Newest first. `Live` = reached the published storefront; `Caught` = found before or without a live deploy.

| ID | Date | Reach | Area | Symptom |
|----|------|-------|------|---------|
| [F-014](#f-014--liquid-comparison-in-a-render-argument-killed-the-cart) | 2026-08-13 | Live | Header / cart | Cart icon gone, add-to-cart dead site-wide |
| [F-013](#f-013--dead-placeholder-css-stretched-every-icon-to-300px) | 2026-08-13 | Live | CSS | Every icon 300px wide |
| [F-012](#f-012--trust-bar-clipped-on-mobile) | 2026-08-13 | Live | Homepage | Trust bar showed one stray checkmark on mobile |
| [F-011](#f-011--textcontent-on-an-inline-svg-wiped-the-theme-toggle-icon) | 2026-08-13 | Live | Theme toggle | Toggle icon invisible on first paint |
| [F-010](#f-010--toggletheme-was-never-defined) | 2026-08-13 | Live | Theme toggle | Clicking the toggle did nothing |
| [F-009](#f-009--hardcoded-light-mode-colors-ignored-dark-mode) | 2026-08-13 | Live | Theming | Header/drawer stayed white in dark mode |
| [F-008](#f-008--theme-check-ci-job-could-not-post-results) | 2026-08-13 | Caught | CI | "Resource not accessible by integration" |
| [F-007](#f-007--hardcoded-hex-literals-bypassed-the-token-system) | 2026-08-09 | Caught | Theming | 6 colours immune to theming |
| [F-006](#f-006--one-script-tag-per-block-instance-causes-duplicate-listeners) | 2026-08-09 | Caught | JS | N accordions = N handlers per click |
| [F-005](#f-005--tailwind-breakpoint-set-to-false-emitted-an-invalid-media-query) | 2026-08-07 | Caught | Tailwind | Dead `@media (min-width:false)` rule |
| [F-004](#f-004--filters-inside-render-arguments-are-silently-ignored) | 2026-08-05 | Live | Footer | Localization panels lost their aria wiring |
| [F-003](#f-003--mobile-header-icons-clipped-off-the-row) | 2026-08-05 | Live | Header | Account + cart icons invisible on mobile |
| [F-002](#f-002--predictive-search-never-activated-on-the-live-store) | 2026-08-05 | Live | Search | Search dropdown never appeared, no console error |
| [F-001](#f-001--collection-cards-showed-100x-the-real-price) | 2026-08-05 | Live | Pricing | 69,00 kr rendered as 6.900,00 kr |

---

## Entries

### F-014 — Liquid comparison in a `render` argument killed the cart

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `38af7e1`
- **Symptom:** The cart icon disappeared from the header and every product-card "add to cart" button stopped responding.
- **Root cause:** `blocks/header-cart.liquid` passed `badge_hidden: cart.item_count == 0` to `{% render %}`. Render arguments accept only literals and variable lookups — a comparison there is a parse error, which took down the entire `header-2` section render, including the `<script src="header-cart.js">` tag it emits. Without that script, `window.addToCart` and `window.toggleCartDrawer` were undefined.
- **Fix:** Resolve the boolean with `assign` first, then pass the variable. The bad pattern was also corrected in `snippets/icon.liquid`'s doc example, which had been modelling it.
- **Prevention:** Never put an expression or a filter in a `{% render %}` argument — see also [F-004](#f-004--filters-inside-render-arguments-are-silently-ignored). One Liquid parse error takes down a whole section, not just one block.

### F-013 — Dead placeholder CSS stretched every icon to 300px

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `8952168`
- **Symptom:** Every icon on the site rendered 300px wide, pushing adjacent labels out of view.
- **Root cause:** Leftover CSS from the old hello-world placeholder section (`.welcome`, `.highlights`, `.highlight`, `.icon { width: 300px }`) was still in `assets/input.css`. Its `.icon` class collided with the Lucide icon component's `.icon`, and being declared later it won the cascade.
- **Fix:** Delete the dead block so the icon component's own `1em` sizing applies again.
- **Prevention:** Remove a section's CSS in the same commit that removes the section. Generic class names (`.icon`, `.card`) in global CSS are collision bait.

### F-012 — Trust bar clipped on mobile

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `6661a09`
- **Symptom:** The homepage trust bar (4 checkmarks under the hero) showed only a stray checkmark on mobile.
- **Root cause:** `flex-wrap: nowrap` + `overflow: hidden` with no way for items to shrink. The Danish sentences don't fit one row at mobile width, so they were clipped.
- **Fix:** Let the items wrap onto multiple rows below the `md` breakpoint.
- **Prevention:** Danish copy is longer than English — any single-row flex layout holding sentences needs a wrap or shrink strategy. Same family as [F-003](#f-003--mobile-header-icons-clipped-off-the-row).

### F-011 — `textContent` on an inline `<svg>` wiped the theme toggle icon

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `14e2b72`
- **Symptom:** The theme toggle button was invisible on first paint.
- **Root cause:** `updateToggleIcons()` set `.textContent` on the toggle's SVG to ligature names (`light_mode`/`dark_mode`) — leftovers from an old icon-*font* implementation. On an inline `<svg>`, setting `textContent` replaces the `<use>` child with an inert text node, erasing the icon.
- **Fix:** Swap the `<use>` element's `href` between `#icon-moon` and `#icon-sun`; added the missing sun symbol to the sprite.
- **Prevention:** After the icon-font → SVG-sprite migration, any JS that writes icon *names* as text is stale. Icons are swapped by `href`, never by text content.

### F-010 — `toggleTheme()` was never defined

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `c54dc33`
- **Symptom:** Clicking the dark/light toggle did nothing.
- **Root cause:** The button's `onclick` called `toggleTheme()`, but no such function existed anywhere in the theme. Only the initial system/`localStorage` detection IIFE ran on load.
- **Fix:** Define and expose `toggleTheme` globally — flip light/dark, persist to `localStorage`, update the icon.
- **Prevention:** An inline `onclick="fn()"` fails silently-ish and is easy to ship untested. Grep that the handler name actually exists in an asset before shipping any inline handler.

### F-009 — Hardcoded light-mode colors ignored dark mode

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `dd9a179`
- **Symptom:** With dark mode on, the site header stayed white; so did the cart drawer, product metafields panel, metafield pills, quantity stepper, sticky buy bar, gallery dots and shipping progress bar.
- **Root cause:** Those components used hardcoded Tailwind `slate-*`/`white` utilities instead of the semantic theme classes, so they were not wired to the CSS custom properties that dark mode swaps.
- **Fix:** Replace with `bg-card-light` / `bg-card-high` / `text-primary` etc.
- **Prevention:** Per CLAUDE.md, never use `bg-white`, `text-black` or a raw palette colour — they bypass theming by construction. Same root as [F-007](#f-007--hardcoded-hex-literals-bypassed-the-token-system).

### F-008 — Theme Check CI job could not post results

- **Date:** 2026-08-13 · **Reach:** Caught · **Fix:** `780cac5`
- **Symptom:** CI failed on every push with "Resource not accessible by integration". A second job failed with "Input required and not supplied: cla-token".
- **Root cause:** The default `GITHUB_TOKEN` only had `contents:read`; the Theme Check action needs `checks:write` to post its results. The CLA job referenced a `CLA_TOKEN` secret this repo has never had.
- **Fix:** Grant `checks:write` in the workflow; disable the CLA job with `if: false` rather than deleting it, so it can be re-enabled once a token exists.
- **Prevention:** GitHub Actions permissions are least-privilege by default — any action that writes back to the PR needs its scope declared explicitly.

### F-007 — Hardcoded hex literals bypassed the token system

- **Date:** 2026-08-09 · **Reach:** Caught · **Fix:** `0c408dc`
- **Symptom:** Six colours (`#FFB800`, `#888888`, `#6b7280`, `#c8102e` ×3) were immune to theming and to any future palette change.
- **Root cause:** Written as literals instead of referencing the existing CSS custom properties. An earlier sweep had missed them.
- **Fix:** Replace with `--color-border`, `--color-foreground`, `--color-important` or the matching Tailwind named colour.
- **Prevention:** A recurring hex value must become a token first. `grep -rn "#[0-9a-fA-F]\{3,6\}" blocks/ sections/ snippets/` before calling a colour task done.

### F-006 — One `<script>` tag per block instance causes duplicate listeners

- **Date:** 2026-08-09 · **Reach:** Caught · **Fix:** `828d0b8`
- **Symptom:** With N accordion or badge blocks on a page, every trigger fired its handler N times.
- **Root cause:** `blocks/accordion.liquid` and `blocks/badge.liquid` each emit their own `<script src>` tag. Every tag executes independently, and each execution registered listeners across *all* matching elements on the page.
- **Fix:** Add the dataset-flag bind-guard already used in `product-accordions.js`.
- **Prevention:** Any asset loaded from a block that can appear more than once per page must be idempotent — guard binding with a `dataset` flag.

### F-005 — Tailwind breakpoint set to `false` emitted an invalid media query

- **Date:** 2026-08-07 · **Reach:** Caught · **Fix:** `b659c42`
- **Symptom:** `assets/output.css` contained a dead `@media (min-width:false)` rule with `max-width:false` inside `.container`.
- **Root cause:** `assets/input.css` set `--breakpoint-2xl` to the literal string `false`. Tailwind v4 disables a breakpoint by *omitting* it, not by assigning a falsy value.
- **Fix:** Remove the line, rebuild `output.css`.
- **Prevention:** Tailwind v4 `@theme` values are CSS values, not JS config — there is no boolean. Check the compiled `output.css` after touching `@theme`.

### F-004 — Filters inside `render` arguments are silently ignored

- **Date:** 2026-08-05 · **Reach:** Live · **Fix:** `9ffcdfe` (follow-up to the v1.0.100 sweep)
- **Symptom:** In `blocks/footer-localization.liquid`, the country and language panels no longer matched their tabs' `aria-controls`.
- **Root cause:** The panel ids were built with `'prefix-' | append: section.id` *inside* `{% render %}` arguments, so each panel received the literal unfiltered prefix.
- **Fix:** Compute the id with `assign` before the render call.
- **Prevention:** The earlier sweep missed these because its detection grep was line-based and these `render` tags span multiple lines with the filter three lines below the match. **`theme-check` is the detector for this class (`UnsupportedFilterArguments`); a grep is only a smoke test.** Same rule as [F-014](#f-014--liquid-comparison-in-a-render-argument-killed-the-cart).

### F-003 — Mobile header icons clipped off the row

- **Date:** 2026-08-05 · **Reach:** Live · **Fix:** `e77d66f` (v1.0.98)
- **Symptom:** The account and cart icons disappeared entirely from the mobile header; only the theme toggle survived.
- **Root cause:** The centre header group carried `flex-grow: 1` **and** `width: 100%`, while the left/right groups are `flex-shrink: 0`. The row therefore demanded more than 100% width and overflowed, clipping whatever sat last. The `width: 100%` dated from v1.0.47 ("make search bar expand fully") and stayed latent until Wave 2 added a third icon to the right group.
- **Fix:** `flex: 1 1 0%` plus `min-width: 0`. The `min-width: 0` is required because flex items default to `min-width: auto` and refuse to shrink below their content width.
- **Prevention:** `flex-grow: 1` and `width: 100%` together are always wrong on a flex child. Latent layout bugs surface when a sibling is added — re-check the row after adding any header block.

### F-002 — Predictive search never activated on the live store

- **Date:** 2026-08-05 · **Reach:** Live · **Fix:** `8e86866` (v1.0.97)
- **Symptom:** The search dropdown never appeared on the live store. The console showed **no errors** — nothing ran at all.
- **Root cause:** The `header-search` and `header-search-icon` blocks in `sections/header-group.json` were saved by the theme editor *before* the `predictive_search` setting existed, so their saved settings had no such key. `block.settings.predictive_search` evaluated `nil`, so neither the `data-ps-*` attributes nor the `<script>` tag were rendered — `assets/predictive-search.js` was on the store but nothing loaded it.
- **Fix:** Add the key explicitly to both blocks' saved settings. Schema defaults only apply to newly added blocks, never to already-saved ones.
- **Prevention:** **Adding a setting to a schema does not backfill existing block data.** Whenever a new setting gates rendering, update `sections/*.json` saved settings in the same commit. A feature failing with a silent console is the signature of this bug.

### F-001 — Collection cards showed 100x the real price

- **Date:** 2026-08-05 · **Reach:** Live · **Fix:** `869ff43` (v1.0.88)
- **Symptom:** ~30 products showed a 100× price on collection cards while the product page was correct — e.g. `voksdug-med-danske-flag-140-cm`, real price 69,00 kr, rendered as 6.900,00 kr.
- **Root cause:** `snippets/product-card.liquid` gated its per-meter ×100 math on an eight-way or-chain matching product titles containing "voksdug"/"bordbeskytter"/"meter", plus any `tykkelse:`/`bredde:`/`form:` tag or matching variant option — including an option merely *named* "type". Products already priced per meter were multiplied a second time.
- **Fix:** Gate strictly on `product.type == 'Metervare'` and the `custom.metervare` metafield, which the audit confirmed are perfectly aligned across the 4 real metervare products. Also removed the thickness/width/form parsing, which was never rendered and existed only to feed the faulty chain.
- **Prevention:** Never infer business meaning from free-text product titles or loosely-named options. Pricing logic keys off structured data (`product.type`, metafields) only. Ref `docs/superpowers/specs/2026-08-05-metervare-signal-audit.md`.

---

## Recurring patterns

Distilled from the entries above. These are the mistakes this codebase actually makes.

1. **`{% render %}` arguments take literals and variable lookups only.** No comparisons ([F-014](#f-014--liquid-comparison-in-a-render-argument-killed-the-cart)), no filters ([F-004](#f-004--filters-inside-render-arguments-are-silently-ignored)). Resolve with `assign` first. A parse error here takes down the whole section, including any `<script>` tags it renders.
2. **Schema defaults do not backfill saved block settings.** Adding a setting to `{% schema %}` leaves existing instances in `sections/*.json` without the key, where it evaluates `nil` ([F-002](#f-002--predictive-search-never-activated-on-the-live-store)). Update the saved JSON in the same commit.
3. **Hardcoded colours bypass theming, always.** Raw hex ([F-007](#f-007--hardcoded-hex-literals-bypassed-the-token-system)) or Tailwind palette utilities like `bg-white`/`slate-*` ([F-009](#f-009--hardcoded-light-mode-colors-ignored-dark-mode)) are invisible to dark mode. Semantic classes only.
4. **`theme-check` passing is not verification.** [F-001](#f-001--collection-cards-showed-100x-the-real-price), [F-002](#f-002--predictive-search-never-activated-on-the-live-store), [F-003](#f-003--mobile-header-icons-clipped-off-the-row) and [F-014](#f-014--liquid-comparison-in-a-render-argument-killed-the-cart) all passed it cleanly while broken on the storefront. It proves Liquid parses; nothing more.
5. **A grep is a smoke test, not a detector.** Line-based greps miss multi-line tags ([F-004](#f-004--filters-inside-render-arguments-are-silently-ignored)) and later sweeps find what earlier ones missed ([F-007](#f-007--hardcoded-hex-literals-bypassed-the-token-system)). Prefer a real linter where one exists.
6. **Silence is a symptom.** A feature that does nothing with a clean console usually means the script never loaded ([F-002](#f-002--predictive-search-never-activated-on-the-live-store), [F-014](#f-014--liquid-comparison-in-a-render-argument-killed-the-cart)) or the function never existed ([F-010](#f-010--toggletheme-was-never-defined)). Check the Network tab before debugging logic.
7. **Blocks repeat; their scripts must be idempotent.** One `<script src>` per block instance means N executions ([F-006](#f-006--one-script-tag-per-block-instance-causes-duplicate-listeners)). Guard binding with a `dataset` flag.
8. **Danish copy overflows single-row flex layouts.** Anything holding a sentence needs a wrap or shrink strategy, and `flex-grow: 1` + `width: 100%` on the same child is always a bug ([F-003](#f-003--mobile-header-icons-clipped-off-the-row), [F-012](#f-012--trust-bar-clipped-on-mobile)).
9. **Delete a feature's CSS/JS with the feature.** Orphaned rules win the cascade on generic class names ([F-013](#f-013--dead-placeholder-css-stretched-every-icon-to-300px)), and stale JS keeps writing to a shape that no longer exists ([F-011](#f-011--textcontent-on-an-inline-svg-wiped-the-theme-toggle-icon)).

---

## Maintenance rules

- **Add an entry whenever a bug is found** — whether the user reports it or an agent finds it. Log it when the fix is known, in the same commit as the fix.
- **Assign the next free `F-NNN`** and insert the entry at the **top** of `## Entries`, plus a row at the top of the index table.
- **Every entry needs all five fields:** Symptom (what was observed), Root cause (why, precisely), Fix (what changed + commit sha), Prevention (the rule that stops a repeat), and the date/reach/area header line.
- **Root cause means root cause.** "Wrong CSS" is not a root cause; "`flex-grow: 1` and `width: 100%` on the same child made the row demand >100% width" is.
- **Update `## Recurring patterns`** when a new entry is the second instance of something — link both entries from the pattern. That section is the reason this file exists.
- **Don't delete entries.** A fixed bug stays logged; that's the record. If a fix is later reverted or superseded, append a `**Update YYYY-MM-DD:**` line to the existing entry.
- **Cross-link related entries** with anchor links, as done above.
