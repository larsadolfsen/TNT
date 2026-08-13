# Failure log

Running record of every bug that reached a state where it broke something — with its root cause and the fix that resolved it. Purpose: stop the same class of mistake from being made twice, and give a fast lookup when a symptom looks familiar.

**This file is maintained.** See [Maintenance rules](#maintenance-rules) at the bottom.

---

## Index

Newest first. `Live` = reached the published storefront; `Caught` = found before or without a live deploy.

| ID | Date | Reach | Area | Symptom |
|----|------|-------|------|---------|
| [F-025](#f-025--three-schema-and-liquid-errors-made-the-github-sync-drop-five-files-without-a-word) | 2026-08-13 | Live | Deploy / product page | Five product-page files never reached any theme; sync reported success |
| [F-024](#f-024--nav-pills-coarse-pointer-touch-target-was-4px-taller-than-the-row-it-sits-in) | 2026-08-13 | Live | Header / navigation | Nav pills overflowed the header row by 4px on touch devices |
| [F-023](#f-023--the-github-sync-has-been-silently-dropping-the-product-page-files) | 2026-08-13 | Live | Deploy / product page | Quantity stepper showed the words "remove"/"add" instead of − / + icons |
| [F-022](#f-022--section-rendering-api-404d-on-sectionid-so-collection-filters-did-nothing) | 2026-08-13 | Live | Collection filters | Clicking a filter changed the URL but not the products |
| [F-021](#f-021--textcontent-on-an-inline-svg-wiped-the-collection-filter-toggle-icon) | 2026-08-13 | Live | Collection page | Filter block's expand/collapse icon disappeared permanently after first click |
| [F-020](#f-020--two-parallel-sessions-both-claimed-f-018-and-the-conflict-markers-were-pushed) | 2026-08-13 | Live | Repo / process | `docs/failure-log.md` on `main` contained `<<<<<<<` conflict markers |
| [F-019](#f-019--nav-hover-highlight-was-a-fixed-32px-band-not-the-items-hit-area) | 2026-08-13 | Live | Header / navigation | Nav item hover highlight shorter than the item it belongs to |
| [F-018](#f-018--js-source-edit-made-on-a-branch-predating-the-minified-build) | 2026-08-13 | Caught | Collection / build | Sort-drawer close delay would have shipped dead |
| [F-017](#f-017--empty-sections-still-reserved-a-grid-row-and-its-gaps) | 2026-08-13 | Live | Collection page | 42px of blank space between collection description and product grid |
| [F-016](#f-016--default-shopify-block-padding-not-overridden-on-header-leaf-blocks) | 2026-08-13 | Live | Header | Hamburger/logo/cart/search icons carried large unexplained padding |
| [F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it) | 2026-08-13 | Live | Header | Row padding setting had no visible effect |
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

### F-025 — Three schema and Liquid errors made the GitHub sync drop five files without a word

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** (this commit)
- **Symptom:** The resolution of [F-023](#f-023--the-github-sync-has-been-silently-dropping-the-product-page-files). Five files — `blocks/product-buy-buttons.liquid`, `blocks/product-price.liquid`, `blocks/product-recommendations.liquid`, `templates/product.json`, `templates/product.standard.json` — were committed to `main` but present on no theme: not the published one, not the freshly-connected one, not the CLI development theme. Every sync reported success, `theme-check` passed 140 files with 0 offenses, and the other ~115 files updated normally. On the live storefront this showed up as a product page frozen at commit `98dfa48` (2026-06-22).
- **Root cause:** Three unrelated per-file validation failures, each of which Shopify rejects on write and the GitHub sync then discards **without surfacing an error anywhere** — not in the sync status, not in the theme editor, not in CI.
  1. `blocks/product-buy-buttons.liquid` — the `show_dynamic_checkout` setting's `label` was 71 characters (`"Vis hurtige betalingsknapper (Shop Pay / PayPal m.fl.) under Læg i kurv"`). Shopify caps schema **labels** at 70: `setting with id="show_dynamic_checkout" label er for lang (maks. 70 tegn)`. The cap applies to `label` only — `info` is not limited, and three synced files carry `info` strings of 77–213 characters.
  2. `blocks/product-price.liquid` — the `price_suffix` setting declared `"default": ""`. An empty default is rejected on a `text` setting: `setting with id="price_suffix" default skal angives`. It is *not* rejected on a `select` whose options include an empty value, which is why `blocks/card.liquid`'s `block_gap` has the same literal and syncs fine.
  3. `blocks/product-recommendations.liquid` — used `{% recommendations %}` / `{% endrecommendations %}`, which is not a Shopify Liquid tag and never has been: `Liquid syntax error (line 9): Unknown tag 'recommendations'`. Product recommendations require a *section* reading the `recommendations` object, fetched over `/recommendations/products?section_id=…&product_id=…&intent=…`. The file also read `.performed` and `.products.size` where the real object exposes `performed?` and `products_count`. This block has therefore never rendered on any theme.
  4. Both templates were pure collateral. A JSON template naming a theme-block `type` that does not exist in `blocks/` is itself invalid — `Ugyldig værdi for type i blokken "b1". Den givne temablok-type skal være defineret i mappen med temablokke.` `product.json` references (1) and (2); `product.standard.json` references (1), (2) and (3). Neither template had a defect of its own.
- **Fix:** Shortened the `show_dynamic_checkout` label to 45 characters and moved the provider list into `info`; dropped the empty `"default"` key from `price_suffix`; deleted `blocks/product-recommendations.liquid` and the two section rows that held it (`row_RelPrd1`, `row_ComPrd1`) from `templates/product.standard.json`. A working recommendations block is a separate task — the `recommendations.related_eyebrow` / `complementary_eyebrow` locale keys are left in place for it. Each corrected file was then upserted to the development theme (`194234384717`) via `themeFilesUpsert` and accepted with zero `userErrors`.
- **Outcome:** After the fixes, `blocks/product-buy-buttons.liquid` and `blocks/product-price.liquid` synced to theme `194474541389` immediately. The templates did not, for two *different* reasons, neither of them a defect in the fix: `templates/product.json` was not in that commit's diff, so the sync never re-attempted it and it simply stayed missing from the original failed sync — a whitespace-only touch in the next commit brought it across. `templates/product.standard.json` **was** in the diff but shipped in the same push as the blocks it references, and was still refused after a re-touch. Its remaining cause was not identified: file size (30 KB against a 512 KB cap), section count (10 of 25), block count (36 of 1,250) and nesting depth (3 of 8) are all far inside the documented [theme limits](https://shopify.dev/docs/storefronts/themes/architecture/limits), and a local check of every setting value against its block's schema found nothing that `templates/product.json` does not also do and get away with. On the merchant's call the template was **deleted**, to be rebuilt from scratch in the theme editor; the two products carrying `template_suffix: standard` fall back to the default `product.json` layout meanwhile.
- **Process note — the investigation cost far more than the bug.** The defect was three ordinary coding errors and the fix was three lines plus a deletion, but diagnosing it ran to disconnecting the live theme from GitHub, reconnecting it, and building a second theme from scratch. None of that was necessary. The one diagnostic that actually worked — `themeFilesUpsert` — is permitted against a **development** theme, and `194234384717` existed the whole time; a single call against it returns all three error messages, after which the fix ships to the published theme through the ordinary sync. Worth stating plainly because the detour reads scarier than it was: the store was never down. `191515623757` stayed `MAIN` and kept serving customers throughout — it was disconnected from GitHub, not unpublished. **Never disconnect, unpublish or rebuild a live theme to diagnose a sync problem.** A development theme answers the same question, costs nothing, and cannot affect the storefront.
- **Prevention:** **`themeFilesUpsert` against an unpublished theme is the only way to see Shopify's file validator.** The GitHub sync runs the same validator and throws its output away; `theme-check` implements a different, weaker rule set and misses all three of these (a 71-char label, an empty `text` default, and an entirely fictional Liquid tag all pass it). When a file is missing from a theme but present in `main`, do not diff, re-encode, or re-push it — upload it with `themeFilesUpsert` to a **development or unpublished** theme and read `userErrors[].message`. Two traps found while doing so: the mutation returns **one error per file**, so a file can fail again for a second reason after the first is fixed; and a `body` of `type: URL` **silently no-ops** — it returns an empty `upsertedThemeFiles` with no `userErrors`, indistinguishable from the bug being investigated. Use `type: TEXT`. And a corollary from the two templates above: **the sync only re-attempts files that appear in the commit's diff.** A file rejected once stays missing indefinitely, however many later syncs succeed, until something changes it — so fixing a rejected file's *dependency* is not enough, the file itself needs a touch in a commit of its own. Now [Recurring pattern 14](#recurring-patterns).

### F-024 — Nav pill's coarse-pointer touch target was 4px taller than the row it sits in

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** (this commit)
- **Symptom:** On touch devices, `.nav-link-pill` measured 48px tall inside a header row whose content box is 44px — the pills overflowed the row by 2px above and below. Because `blocks/header-navigation.liquid` sets `overflow-x: auto` on the `<nav>` below 840px and CSS computes the other axis to `auto` when one axis is not `visible`, the over-tall child also made the nav vertically scrollable. Found while fixing [F-019](#f-019--nav-hover-highlight-was-a-fixed-32px-band-not-the-items-hit-area), which is what exposed the real pill height.
- **Root cause:** `@media (pointer: coarse) { .nav-link-pill { min-height: 48px } }` was a fixed pixel floor written to guarantee a WCAG touch target, chosen independently of the row it lives in. The row already guarantees exactly that target: `blocks/header-row-2.liquid` offers `row_height` 56 (with `row_padding_y: 6`) or 44 (with `0`), so its content box is 44px either way — the WCAG 2.5.5 minimum — and `header-group` sizes itself to `calc(var(--row-height) - (var(--row-padding-y) * 2))`. A 48px floor could therefore never be satisfied without breaking out of the row; the accessibility guarantee it was protecting was already met at 44px.
- **Fix:** Express the floor in the row's own terms — `min-height: calc(var(--row-height, 56px) - (var(--row-padding-y, 6px) * 2))`, the identical formula `header-group` uses. The pill now tracks the row's content box exactly instead of racing it, whatever `row_height` the merchant picks.
- **Prevention:** Third instance of the pattern behind [F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it) and [F-019](#f-019--nav-hover-highlight-was-a-fixed-32px-band-not-the-items-hit-area), now [Recurring pattern 13](#recurring-patterns): a descendant of the header row must never state its height in raw pixels, because the row's height is a theme setting exposed as `--row-height`/`--row-padding-y` — always `calc()` against those. Also: before adding a fixed-pixel accessibility minimum, check whether the containing layout already satisfies it; a floor that exceeds its container does not improve the target, it just overflows. Numbered F-024 rather than the F-022 this branch was written against, per [F-020](#f-020--two-parallel-sessions-both-claimed-f-018-and-the-conflict-markers-were-pushed)'s rule.

### F-023 — The GitHub sync has been silently dropping the product-page files

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** unresolved at time of writing — see below
- **Symptom:** On the live product page (`/products/vareprve`) the quantity stepper rendered the literal words `remove` and `add` where the − and + icons belong. The repo's own source has rendered proper icons since `6055cbd`, and `theme-check` was clean.
- **Root cause:** Not a code bug — a deploy gap. The published theme (`TNT/main`, id `191515623757`) still held `blocks/product-buy-buttons.liquid` as it was at commit `98dfa48` (2026-06-22, v1.0.65): 29,423 bytes, byte-identical to that git blob, `updatedAt` frozen at 2026-06-22T19:23:15Z. That version predates `1f1314e`, which split the block into `snippets/product-buy-*.liquid`, so the live page rendered the block's own inlined stepper markup — `<span class="material-symbols-outlined">remove</span>` / `add` — and never reached `snippets/product-buy-quantity-selector.liquid` at all. Those spans were Material Symbols ligatures; `6055cbd` removed that icon font in favour of the Lucide sprite, so the ligature names rendered as plain text. Every commit touching the block since (`62a7fa2`, `186113f`, `c35baa6`) pushed fine to GitHub and never reached the theme. Same family as [F-021](#f-021--textcontent-on-an-inline-svg-wiped-the-collection-filter-toggle-icon): both are Material Symbols ligature names surviving the sprite migration, but this one survived *on the storefront only*, which is why the source looked clean.
- **Scope:** An Admin API sweep of all ~120 theme files against the repo (subtracting line count from local byte size to normalise CRLF) found the live theme current everywhere else, including files from commits minutes old. A second stale file surfaced: `templates/product.standard.json` (live 28,677 B vs git 31,836 B). Reconnecting the repo then built a fresh theme (id `194474541389`) that came up **missing five files outright** — `blocks/product-buy-buttons.liquid`, `blocks/product-price.liquid`, `blocks/product-recommendations.liquid`, `templates/product.json`, `templates/product.standard.json` — while delivering 21/21 sections, 53/53 snippets and every asset. `blocks/product-recommendations.liquid` has never existed on any theme despite being committed. So the defect is not one frozen file: the sync drops the product-page cluster specifically, and `templates/product.json` is plausibly collateral (a JSON template referencing a block type the theme lacks is itself invalid).
- **Fix:** Unresolved. Ruled out: encoding (all five are clean UTF-8, no BOM), lint (`theme-check` passes 140 files, 0 offenses), schema shape (the three blocks' `presets`/`category` is shared with twelve blocks that sync fine), and `.shopifyignore` (comments only). Both automated write paths against the *published* theme are closed — the Shopify MCP blocks `themeFilesUpsert` on a MAIN-role theme, and the local Shopify CLI is not authorized for this store. `themeFilesUpsert` **is** permitted against an unpublished theme, which is the fallback if a sync probe (touching the five paths so Shopify sees them as changed) does not bring them across.
- **Update 2026-08-13:** Resolved — see [F-025](#f-025--three-schema-and-liquid-errors-made-the-github-sync-drop-five-files-without-a-word). The cause was three independent per-file validation errors that Shopify rejects and the sync discards silently; the two templates were collateral, exactly as suspected above.
- **Prevention:** A merge to `main` is not evidence of a deploy, and neither is a green sync. The theme's own file list is the only source of truth for what the storefront runs — `theme(id:) { files { filename updatedAt size } }` via the Admin API, compared against the repo. Worth a periodic sweep: a file can silently stop syncing, or never arrive at all, while everything around it updates, and nothing in git, CI or `theme-check` will ever mention it. Extends pattern 4 — passing lint says the Liquid parses; it says nothing about which Liquid the storefront is actually serving, or whether it is being served at all.

### F-022 — Section Rendering API 404'd on `section.id`, so collection filters did nothing

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** this commit
- **Symptom:** On a collection page, ticking a filter updated the address bar to `?filter.v.availability=1&sort_by=most-relevant` but the product grid never changed. No console error, no visible failure — the page just quietly ignored the filter. Same for sorting and for the filter chips.
- **Root cause:** `sections/main-collection.liquid` published `{{ section.id }}` into the `#main-collection-config` island, and `assets/main-collection.js` appended it as the `section_id` query parameter. Inside a JSON template, `section.id` resolves to the fully-qualified `template--28450753839437__main-collection`, but the Section Rendering API expects the section's *key* as written in `templates/collection.json` — `main-collection`. The long form returns **404 with an empty body**. `filterProducts()` calls `.then(res => res.text())` without checking `res.ok`, so the empty body parsed into a document with no `#product-grid`, the `if (newGrid && productGrid)` guard failed, and the function carried on to `pushState` the new URL and clear the loading state. Every failure path looked like a success.
- **Fix:** Derive the short key with `assign section_render_id = section.id | split: '__' | last` and publish that instead. Verified against the live store: `?section_id=main-collection` returns 200 and honours the params (unfiltered 50 cards, `filter.v.availability=1` 39 cards, `sort_by=price-ascending` reorders), while `?section_id=template--28450753839437__main-collection` returns 404.
- **Prevention:** Two rules. (1) In a JSON template, `section.id` is not the Section Rendering API's section id — derive the template key. (2) **Check `res.ok` before parsing a fetch response.** This bug was invisible for as long as it was because a 404 was treated as a successful render of an empty page; a `if (!res.ok) throw` would have surfaced it in the console the first time anyone clicked a filter. See also [F-002](#f-002--predictive-search-never-activated-on-the-live-store) — another live JS failure with no console error. Numbered F-022 rather than F-015 (the id this branch was written against) per [F-020](#f-020--two-parallel-sessions-both-claimed-f-018-and-the-conflict-markers-were-pushed)'s prevention rule: assign the id against `origin/main` at merge time, not write time.
- **Update 2026-08-13:** Prevention rule (2) implemented. All three `fetch(...)` chains in `assets/main-collection.js` (`filterProducts()`, the collection-chip click handler, `fetchAndSwapUrl()`) now `throw` on `!res.ok` before `.text()`, matching `assets/collection-infinite-scroll.js`. The existing `.catch()` blocks log the error and clear the `opacity-50 pointer-events-none` loading state, so a non-200 now surfaces in the console and the grid recovers instead of a failure rendering as an empty success. The `F-015` reference in `collection-infinite-scroll.js`'s comment (written before the renumber) was corrected to `F-022` in the same commit.

### F-021 — `textContent` on an inline `<svg>` wiped the collection filter toggle icon

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** (this commit)
- **Symptom:** On a collection page with filters, clicking a filter block's header to collapse it made its expand/collapse icon disappear permanently — it never came back on subsequent clicks.
- **Root cause:** `toggleFilterBlock()` in `assets/main-collection.js` set `.toggle-icon.textContent = 'remove'`/`'add'` — leftovers from the old Material Symbols ligature-font icon implementation, where the element's text content *was* the glyph. The Lucide SVG-sprite migration turned `.toggle-icon` into an `<svg><use href="#icon-minus"></use></svg>`; setting `.textContent` on it destroys the `<use>` child, and the stale ligature names ('remove'/'add') don't match the sprite's symbol ids anyway.
- **Fix:** Target the `<use>` child and rewrite its `href` instead of the SVG's text, matching the pattern `layout/theme.liquid` already uses for the same icon system (`use.setAttribute('href', '#icon-minus'/'#icon-plus')`).
- **Prevention:** Same family as [F-011](#f-011--textcontent-on-an-inline-svg-wiped-the-theme-toggle-icon) — this is the second instance of the pattern, now folded into [Recurring pattern 9](#recurring-patterns). A grep across all `assets/*.js` for `.textContent`/`.innerText` assignments on icon elements found no further instances at the time of this fix. Numbered F-021 rather than F-018 (the id this branch was written against) per [F-020](#f-020--two-parallel-sessions-both-claimed-f-018-and-the-conflict-markers-were-pushed)'s prevention rule: assign the id against `origin/main` at merge time, not write time.

### F-020 — Two parallel sessions both claimed F-018, and the conflict markers were pushed

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** this commit
- **Symptom:** `docs/failure-log.md` on `main` (and therefore on the live theme) contained two unresolved `<<<<<<< HEAD` / `=======` / `>>>>>>>` blocks — one in the index table, one in `## Entries` — with two different bugs both numbered F-018.
- **Root cause:** Two chains of causation, both from concurrent sessions. (1) The log's ID allocation rule ("take the next free `F-NNN`") is read at the moment a branch is written, not at merge time, so two branches open at once both saw F-017 as the newest and both wrote F-018 — a guaranteed conflict in the index row *and* the entry, since both insert at the top of the same two lists. (2) The resulting conflict was left in the working tree of the **primary checkout** while this session paused to back up another session's uncommitted files; a parallel session then committed and pushed everything in that tree, markers included. `theme-check` does not lint markdown, and nothing else checks for conflict markers, so nothing blocked the push.
- **Fix:** Renumber this session's entry F-018 → F-019 (the other session's F-018 reached `main` first, so its number stands), keep both index rows, and add this entry as F-020.
- **Prevention:** Two rules. (a) Assign the `F-NNN` id against `origin/main` at merge time, not at write time — when merging, always expect the log's top rows to conflict and renumber your own entry rather than the one already on `main`. (b) Never leave a conflicted merge sitting in the primary checkout: resolve it or `git merge --abort` before doing anything else, because a parallel session there will commit whatever it finds. Restated from the existing worktree rule in `CLAUDE.md`, which this violated in the reverse direction — the danger is not only switching branches under another session, but also leaving a half-finished index/tree behind for one.

### F-019 — Nav hover highlight was a fixed 32px band, not the item's hit area

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `bcacdb3`
- **Symptom:** Hovering a main-nav item in header row 2 drew a rounded highlight noticeably shorter than the item itself — DevTools showed the `a.nav-link-pill` at 48px tall while the highlight measured 32px, leaving 8px of un-highlighted pill above and below.
- **Root cause:** `blocks/header-navigation.liquid`'s `.nav-link-pill::before` (the highlight layer, also used for the `--open` state) was positioned with `inset-inline: 0; top: 50%; transform: translateY(-50%);` and a hardcoded `height: 32px`. The pill's own height is not fixed — it is `h-full` of the row (`row_height: 44` for header row 2, per `sections/header-group.json`) and gains `min-height: 48px` under `@media (pointer: coarse)`. So the highlight was a constant 32px against a pill that is 44–48px depending on row setting and input type, and could never match it.
- **Fix:** Replace the fixed-height centred band with `inset: 0`, so the pseudo-element fills the pill's box whatever height the row resolves to. Border radius unchanged.
- **Prevention:** A decoration layer for an element whose size comes from a setting or a media query must be sized relative to that element (`inset: 0`, `100%`, `calc()` against a shared custom property) — never a hardcoded pixel height that happens to look right at one row height. Same family as [F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it): a hardcoded pixel size placed alongside a height that is actually derived from a theme setting.

### F-018 — JS source edit made on a branch predating the minified build

- **Date:** 2026-08-13 · **Reach:** Caught · **Fix:** this commit
- **Symptom:** A 250ms delay added to `selectSortOption` in `assets/main-collection.js` would have deployed with no effect at all — the sort drawer would still have closed instantly.
- **Root cause:** The branch was cut at `1.0.140`, when `sections/main-collection.liquid` still loaded `assets/main-collection.js` directly. While the branch was open, `main` gained an esbuild minify step (`scripts/build-js.mjs`, `npm run js:build`) and every section switched its `<script src>` to the `.min.js` build. Editing the source file was correct when the edit was made and wrong by the time it merged; `npm run tailwind:build` regenerates only `output.css`, so nothing rebuilt the stale `main-collection.min.js` that the page actually loads. `theme-check` cannot see this — both files parse fine.
- **Fix:** Run `npm run js:build` (or `npm run build`, which does both) as part of resolving the merge, and commit the regenerated `assets/main-collection.min.js`.
- **Prevention:** After merging `main` into a long-lived branch, run the full `npm run build` — not just the tailwind step — and check whether the section that loads your edited asset still points at the file you edited. Compiled artifacts (`output.css`, `*.min.js`) are tracked in this repo, so a merge that changes the build pipeline silently invalidates work done against the old one.

### F-017 — Empty sections still reserved a grid row (and its gaps)

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `61f7578`
- **Symptom:** On collection pages (e.g. `/collections/tekstildug`, mobile 412px) there were 54px of blank space between the collection description and the product grid, where a single 12px gap was expected. DevTools showed the dead space as two grid-gap bands inside `main#MainContent`.
- **Root cause:** Two of the four sections in `templates/collection.json` render nothing but still occupy a row of `main`'s CSS grid (`row-gap: 12px`). (1) `sections/collections.liquid` correctly suppresses its markup when `collection.metafields.custom.child` is blank — but Shopify still emits the `.shopify-section` wrapper `<div>`, which contains only the section's `<style>` tag. A 0-height grid item is still a grid item: it adds an empty row plus a second row-gap. (2) `section_eUpcwy` is a `sections/section.liquid` instance with zero blocks; it always renders its outer/inner divs, so its padding (18px mobile / 24px desktop) plus another row-gap became visible whitespace. Measured: header bottom 277 → product grid top 331 = 54px, of which only 12px was legitimate.
- **Fix:** Two collapse rules, both keyed on "renders no content", not on this template's specific section ids. `assets/input.css`: `main > .shopify-section:not(:has(> :not(style):not(script):not(link):not(template))) { display: none; }` removes any wrapper holding only its own `<style>`/`<script>`. `sections/section.liquid`'s `{% style %}` adds `#shopify-section-{{ section.id }}:not(:has(.section-content > *)) { display: none; }`, guarded by `{%- unless request.design_mode -%}` so an empty Section stays visible (and droppable) in the theme editor. Verified live by injecting both rules on the real page: gap 54px → 12px, and a fetch-based sweep of `/`, `/cart`, `/search`, `/pages/kontakt`, `/collections/all` confirmed nothing else matches either selector.
- **Prevention:** Suppressing a section's *markup* with `{% if %}` does not remove the section from the layout — Shopify's `.shopify-section` wrapper is always emitted, and in a gapped grid an empty wrapper costs a full row-gap. Any "render nothing" branch in a section must also collapse its wrapper (`display: none` on `#shopify-section-{{ section.id }}`, or a generic `:has()` rule), and any such rule must be guarded with `request.design_mode` if merchants need to select the section in the editor. Same family as [F-016](#f-016--default-shopify-block-padding-not-overridden-on-header-leaf-blocks)/[F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it): the auto-generated wrapper box is a real box with its own layout effects, whatever the section's own markup does.
- **Update 2026-08-13:** Half of this fix was silently lost minutes after it shipped. Merge `a8b9664` (branch `claude/button-circle-design-fd4a04`, one of several sessions pushing to `main` in parallel) resolved `assets/input.css` and `assets/output.css` to its own older copies, deleting the `main > .shopify-section:not(:has(...))` rule while leaving the `sections/section.liquid` half intact. Nothing failed: `theme-check` and CI stayed green on every run, so the storefront just kept showing the original gap. Restored in `1.0.146`. **Prevention:** when parallel sessions/branches are live on this repo, a merge that touches `assets/input.css` must be checked for lost rules afterwards (`git show origin/main:assets/input.css | grep <your rule>`), and `assets/output.css` — a generated artifact — should always be resolved by re-running `npm run tailwind:build` on the merged `input.css`, never by picking one side. A green CI is not evidence your change is still on `main`.

### F-016 — Default `.shopify-block` padding not overridden on header leaf blocks

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `ed23469`
- **Symptom:** The mobile hamburger button (and, latently, several other header icon blocks) had large, unexplained padding around it. DevTools showed the hamburger's `#shopify-block-*.shopify-block` wrapper at 76×68px around a 44×44px button.
- **Root cause:** Shopify's platform CSS applies a default padding to every block wrapper — `.shopify-block, shopify-block, [class*=shopify-block-] { padding-left: 16px; padding-right: 16px; padding-top: 12px; padding-bottom: 12px; }` (76 = 44 + 16 + 16, 68 = 44 + 12 + 12, confirming the source). Only 4 of the header's 11 block types (`header-group`, `header-row-2`, `header-account`, `header-navigation`) had ever added their own `padding: 0` override to their `#shopify-block-{{ block.id }}.shopify-block` rule. `header-hamburger`, `header-logo`, `header-cart`, `header-search`, `header-search-icon`, `header-follow-on-shop` and `header-theme-toggle` never did, so each carried the platform's 16px/12px inset on top of the row's own padding.
- **Fix:** Add `padding: 0;` to those 7 blocks' `#shopify-block-{{ block.id }}.shopify-block` rule in their `{% style %}` tag.
- **Prevention:** Every theme block's `{% style %}` must explicitly set `padding` (even if `0`) on its own `.shopify-block` wrapper rule — the platform default is never zero, and it's invisible until someone measures the wrapper in DevTools. Same family as [F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it): two different bugs from not fully accounting for the auto-generated wrapper box that theme-block markup sits inside. Non-header blocks with no wrapper-padding override at all (`accordion`, `contact-address`/`contact-hours`/`contact-map`, `footer-localization`, `trust-checkmark`, `trust-countdown`) likely carry the same latent padding and haven't been audited yet.

### F-015 — Header row padding had zero effect because a child height cancelled it

- **Date:** 2026-08-13 · **Reach:** Live · **Fix:** `81e5406`
- **Symptom:** `blocks/header-row-2.liquid`'s row padding (declared on the block wrapper) had no visible effect — content still touched the row's edges regardless of the padding value set.
- **Root cause:** The wrapper (`#shopify-block-{{ block.id }}.shopify-block`) declared `padding-top/bottom` plus `box-sizing: border-box` and a fixed `height`. But the block's own root `<div>`, rendered as that wrapper's child, also set an inline `style="height: {{ row_height }}px"` — the exact same pixel height as the wrapper's total border-box. Centered via `align-items: center`, a child whose height equals the parent's full border-box height always renders flush to the border edges no matter what padding the parent declares: for symmetric padding `p` and total height `H`, the child's centered offset is `p - (H - (H - 2p)) / 2 = p - p = 0`, for any `p`. The padding was real CSS but structurally unable to ever do anything.
- **Fix:** Change the inner div's height from the hardcoded pixel value to `height: 100%`, so it respects the wrapper's actual (now genuinely padded) content box instead of overriding it.
- **Prevention:** When a theme block's own root markup duplicates a size the auto-wrapper already declares via `{% style %}`, use a relative unit (`100%`/`calc()` against a shared CSS custom property) — never a second hardcoded pixel value equal to the first. Two independent sizes that happen to be numerically equal will silently fight, and whichever wins erases the other's intent. Do the arithmetic (as above) before assuming padding + a fixed child height compose the way they look like they should.

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
9. **Delete a feature's CSS/JS with the feature.** Orphaned rules win the cascade on generic class names ([F-013](#f-013--dead-placeholder-css-stretched-every-icon-to-300px)), and stale JS keeps writing to a shape that no longer exists — twice now, both from the Material Symbols → Lucide migration: [F-011](#f-011--textcontent-on-an-inline-svg-wiped-the-theme-toggle-icon) (theme toggle) and [F-021](#f-021--textcontent-on-an-inline-svg-wiped-the-collection-filter-toggle-icon) (collection filter toggle). Setting `.textContent`/`.innerText` on an icon element is always wrong post-migration — target the `<use>` child's `href` instead.
10. **A theme block is two boxes, not one** — the auto-generated `#shopify-block-{{ block.id }}.shopify-block` wrapper (which carries the platform's own default padding unless overridden, [F-016](#f-016--default-shopify-block-padding-not-overridden-on-header-leaf-blocks)) and the block's own root element inside it (which silently cancels the wrapper's padding if it duplicates the wrapper's size with a hardcoded pixel value instead of a relative one, [F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it)). Every new block's `{% style %}` should account for both. The same holds one level up: Shopify always emits the `.shopify-section` wrapper even when the section's Liquid renders nothing, and in a gapped grid that empty wrapper still costs a row plus a row-gap ([F-017](#f-017--empty-sections-still-reserved-a-grid-row-and-its-gaps)) — a "render nothing" branch must collapse the wrapper too.
11. **Compiled artifacts are tracked, so edits to sources need a rebuild in the same commit.** `output.css` after any Tailwind class change, and `*.min.js` after any JS change ([F-018](#f-018--js-source-edit-made-on-a-branch-predating-the-minified-build)) — `npm run build` covers both. Neither `theme-check` nor a source diff will tell you the artifact is stale.
12. **What's in `main` is not necessarily what the storefront runs.** A single file can silently stop syncing from GitHub and stay frozen for weeks while everything around it updates ([F-023](#f-023--the-github-sync-has-been-silently-dropping-the-product-page-files)). When a live symptom contradicts the source, verify the *theme's* copy of the file (Admin API `theme { files { filename updatedAt size } }`) before debugging code that is already correct. This is the deploy-side twin of pattern 11: the artifact the browser loads is the one that matters, not the source you edited.
13. **Inside the header, never state a height in raw pixels.** The row's height is a merchant setting published as `--row-height`/`--row-padding-y`; anything nested in it must size itself with `calc()` against those, exactly as `header-group` does. A hardcoded pixel value that happens to match one setting will cancel the row's padding ([F-015](#f-015--header-row-padding-had-zero-effect-because-a-child-height-cancelled-it)), undershoot the element it decorates ([F-019](#f-019--nav-hover-highlight-was-a-fixed-32px-band-not-the-items-hit-area)), or overflow the row outright ([F-024](#f-024--nav-pills-coarse-pointer-touch-target-was-4px-taller-than-the-row-it-sits-in)). Corollary from F-024: check whether the layout already satisfies an accessibility minimum before hardcoding one — a floor taller than its container does not enlarge the target, it just breaks out.
14. **A file missing from a theme is a rejected file, not a lost one — and only Shopify will say why.** The GitHub sync validates every file and silently discards the ones that fail ([F-025](#f-025--three-schema-and-liquid-errors-made-the-github-sync-drop-five-files-without-a-word)); nothing in git, the sync status, the theme editor, CI or `theme-check` mentions it. To see the real error, `themeFilesUpsert` the file to a development or unpublished theme (never the published one — the API blocks it) and read `userErrors[].message`. Fix one error, re-upload: it reports one per file. Use `body: { type: TEXT }`, because `type: URL` silently no-ops and looks exactly like the bug. The sync also only re-attempts files present in the commit's diff, so a once-rejected file stays missing until a commit touches it again — fixing its dependency is not enough. The rules it enforces are a superset of `theme-check`'s: schema `label` ≤ 70 chars (`info` is unbounded), no empty `"default"` on a `text` setting, and a JSON template may only name block types that exist in `blocks/`. Deploy-side companion to pattern 12 — that one is about a file being *stale*, this one about it never arriving. **Diagnose on a development theme, never by touching the live one.** Disconnecting, unpublishing or rebuilding the published theme answers nothing that a throwaway development theme cannot, and in F-025 that detour consumed most of the elapsed time while the actual defect was three lines.

---

## Maintenance rules

- **Add an entry whenever a bug is found** — whether the user reports it or an agent finds it. Log it when the fix is known, in the same commit as the fix.
- **Assign the next free `F-NNN`** and insert the entry at the **top** of `## Entries`, plus a row at the top of the index table.
- **Every entry needs all five fields:** Symptom (what was observed), Root cause (why, precisely), Fix (what changed + commit sha), Prevention (the rule that stops a repeat), and the date/reach/area header line.
- **Root cause means root cause.** "Wrong CSS" is not a root cause; "`flex-grow: 1` and `width: 100%` on the same child made the row demand >100% width" is.
- **Update `## Recurring patterns`** when a new entry is the second instance of something — link both entries from the pattern. That section is the reason this file exists.
- **Don't delete entries.** A fixed bug stays logged; that's the record. If a fix is later reverted or superseded, append a `**Update YYYY-MM-DD:**` line to the existing entry.
- **Cross-link related entries** with anchor links, as done above.
