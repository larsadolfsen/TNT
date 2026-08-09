# Wave 3.5 batch 3 — implementation plan

Source: `docs/optimization-master-plan.md`, Wave 3.5 table, rows Q2, Q4, Q5,
Q6, Q9, Q11. Executed via superpowers:subagent-driven-development in worktree
branch `claude/wave-3-5-batch-3-2e8851`.

## Global constraints

- Version bump (`package.json` `version`) on every task that changes theme
  behavior — bump the patch version once per task commit.
- Single-purpose files; no `!important`.
- No visual/behavioral regressions — every task's test is a live-preview or
  `theme-check` check, run before marking DONE.
- Script-extraction tasks (Q4, Q5, Q6) follow the existing convention seen in
  `assets/header-cart.js` (IIFE, 2–3 line header comment) and
  `sections/header-2.liquid:24` (`<script src="{{ 'x.js' | asset_url }}"
  defer="defer"></script>` placed where the inline `<script>` used to be).
  Behavior must be byte-for-byte equivalent — this is extraction, not a
  rewrite.
- `theme-check` must not regress (compare error count to current baseline
  before/after each task).
- R7 (text style standardization) has NOT landed on main beyond its design
  doc (`docs/superpowers/specs/2026-08-07-text-style-standardization-design.md`).
  No implementation files exist yet, so there is no file-list conflict with
  any task below.

## Task 1: Q2 spec — image loading/fetchpriority

Write a short spec (new file:
`docs/superpowers/specs/2026-08-09-image-loading-fetchpriority-spec.md`)
covering all 8 external call sites of `{% render 'image', ... %}`
(`blocks/contact-map.liquid`, `blocks/subcollections-grid.liquid`,
`sections/cart.liquid`, `sections/collection.liquid`,
`sections/collections.liquid`, `sections/product.liquid`,
`snippets/product-card-image.liquid`, `snippets/search-result-row.liquid`).

For each call site, specify the exact `loading` and `fetchpriority` values to
pass:

- Default: `loading: 'lazy'`, no `fetchpriority`.
- Above-the-fold cards: `loading: 'eager', fetchpriority: 'high'` — this
  applies to the **first N** cards in a collection/search grid (pick N based
  on typical above-the-fold row count for the grid's column count at mobile
  breakpoint — state the chosen N and why) and to the PDP hero image
  (`sections/product.liquid:10`).
- Cart drawer/line-item images (`sections/cart.liquid:20`) and any renders
  used only in edit/admin contexts (e.g. block previews) stay lazy —
  document the reasoning per site, don't leave any site unspecified.

Verify `image_tag`'s `fetchpriority` pass-through: Shopify's `image_tag`
filter renders any extra keyword argument as a literal HTML attribute, so
`fetchpriority: 'high'` should render as `fetchpriority="high"` with no
`snippets/image.liquid` change needed. Confirm this against the filter's
current output in `snippets/image.liquid` (it already forwards `loading`
the same way) and note the confirmation in the spec — if it does NOT pass
through, the spec must instead say `snippets/image.liquid` needs a small
change, and Task 2 is blocked until that's resolved.

Output: one spec file listing, per call site, the concrete `loading`/
`fetchpriority` values (and the loop-index condition where an above-the-fold
cutoff applies).

**Model:** Sonnet, medium effort (judgment: choosing above-the-fold cutoffs,
verifying filter behavior).

## Task 2: Q2 mechanical migration

Using the spec from Task 1 (read it — it's the source of truth for every
value), update all 8 call sites listed there to pass the specified `loading`
and `fetchpriority` arguments. Purely mechanical: no snippet changes unless
the spec explicitly says the filter doesn't pass `fetchpriority` through (in
which case implement exactly what the spec prescribes).

**Test:** Preview each touched page type (collection, search, product,
cart, contact) — DevTools Network panel shows offscreen images with
`loading=lazy` deferred (not fetched until scrolled into view) and
above-the-fold images requested immediately with `fetchpriority: high` in
the request. `theme-check` clean.

**Model:** Haiku, low effort (spec has exact values; pure transcription).

## Task 3: Q4 — extract product-shipping-progress inline script

`blocks/product-shipping-progress.liquid` has a 306-line inline `<script>`
(originally lines 107–412; re-locate the exact current range before editing
— other batches may have shifted line numbers). Extract it verbatim to
`assets/product-shipping-progress.js`, following the
`assets/header-cart.js` convention (IIFE wrapper, 2–3 line header comment
describing what it does / exposes / depends on). Replace the inline block
with `<script src="{{ 'product-shipping-progress.js' | asset_url }}"
defer="defer"></script>` at the same position. Any `{{ ... }}` Liquid
interpolation inside the original script (translated strings, settings
values) must be preserved via the same pattern used elsewhere in this theme
for passing server data to external JS (a JSON "config island" `<script
type="application/json">` element the external JS reads — see
`snippets/header-cart-config.liquid` + `header-cart.js`'s `readConfig()`
for the reference pattern). Do not invent a new mechanism if this one
already covers the need.

**Test:** Preview a product with the shipping-progress block: the bar's
behavior (progress calculation, threshold messaging, any animation/update
on quantity change) is unchanged. `theme-check` clean.

**Model:** Sonnet, high effort (306 lines, must correctly identify and
externalize any Liquid interpolation without breaking it — this is the [S+]
tier task in the source plan).

## Task 4: Q5a — extract inline scripts (product surfaces)

Extract the inline `<script>` block from each of these 4 files to its own
`assets/*.js` file, same convention as Task 3 (smaller scripts — a single
config-island read is enough where Liquid values are needed):

- `blocks/trust-countdown.liquid` → `assets/trust-countdown.js`
- `blocks/product-variant-picker.liquid` → `assets/product-variant-picker.js`
- `blocks/product-price.liquid` → `assets/product-price.js`
- `blocks/product-urgency.liquid` → `assets/product-urgency.js`

Each file's script must be self-contained after extraction (no shared state
assumed between these 4 — if two scripts on the same page must coordinate,
that's already true today via the DOM/events and must stay true, not be
newly introduced).

**Test:** Preview a product page carrying all 4 blocks: countdown timer
ticks, variant picker updates the URL/price/media, price block renders and
updates on variant change, urgency block behaves unchanged. `theme-check`
clean.

**Model:** Sonnet, medium effort.

## Task 5: Q5b — extract inline scripts (forms + pickup)

Extract the inline `<script>` block from each of these 4 files to its own
`assets/*.js` file, same convention as Task 3/4:

- `sections/contact-form.liquid` → `assets/contact-form.js`
- `blocks/product-testimonial.liquid` → `assets/product-testimonial.js`
- `snippets/newsletter-form.liquid` → `assets/newsletter-form.js`
- `blocks/product-pickup-availability.liquid` →
  `assets/product-pickup-availability.js`

**Test:** Preview: contact form submits (client-side validation, if any,
still fires); testimonial block behavior unchanged (carousel/rotation if
present); newsletter form submits; pickup-availability block still fetches/
renders availability states. `theme-check` clean.

**Model:** Sonnet, medium effort.

## Task 6: Q5c — extract inline scripts (accordion + badge)

Extract the inline `<script>` block from each of these 3 files to its own
`assets/*.js` file, same convention as Task 3/4/5:

- `blocks/badge.liquid` → `assets/badge.js`
- `blocks/product-accordions.liquid` → `assets/product-accordions.js`
- `blocks/accordion.liquid` → `assets/accordion.js`

`product-accordions.liquid` and `accordion.liquid` may share near-identical
open/close logic — if so, note it in your report (do not fold them into one
shared file as part of this task; that consolidation is out of scope here,
flag it as a follow-up observation only).

**Test:** Preview: badge renders/animates unchanged; product accordions and
generic accordion blocks open/close/keyboard-toggle unchanged.
`theme-check` clean.

**Model:** Sonnet, medium effort.

## Task 7: Q6 — subcollections dedup

Owns: `sections/collection-subcollections.liquid` (225 lines),
`blocks/collection-subcollections.liquid` (235 lines),
`sections/collection-subcategories.liquid` (228 lines) — three
near-identical files with duplicated collapse/expand `<script>` logic. This
task supersedes the "extract inline script" step for these three files —
Q5 does not touch them (avoid double work / conflicting commits).

Steps:
1. Confirm none of the three appears in any `templates/*.json` (already
   verified 2026-08-07 per the master plan — re-verify it's still true,
   things may have moved) AND check the store's live templates in Shopify
   admin for section-picker usage before deleting anything — a section only
   reachable via the editor's "Add section" picker is still a real,
   deletable-only-if-unused surface, not automatically dead.
2. Diff the three files against each other to determine which are true
   duplicates vs. which (if any) have diverged in real functionality.
3. Delete whichever are genuinely dead/redundant; keep the surviving
   implementation(s) as the canonical version(s).
4. For whatever survives, extract its collapse/expand script to
   `assets/collection-subcollections.js` (or a name matching the surviving
   file), following the Task 3 convention. If two distinct surviving
   implementations both need this behavior, they may share the one
   extracted JS file if their DOM/markup is compatible — don't force a
   markup rewrite just to enable sharing; if incompatible, two small JS
   files is fine.

**Test:** grep confirms only one (or explicitly justified two) subcollections
implementation remains. Admin template/section-picker check confirms
nothing that's still reachable was deleted. Preview: collapse/expand still
works on whatever page/section exercises the surviving implementation(s).
`theme-check` clean.

**Model:** Sonnet, high effort (judgment call on what's genuinely dead —
this is the [S] tier task in the source plan, but the dead-code
verification step needs care).

## Task 8: Q9 — shared drawer/panel primitive

Owns: `snippets/account-panel.liquid` (68 lines),
`blocks/footer-localization.liquid` (172 lines),
`blocks/header-account.liquid` (166 lines),
`blocks/header-search-icon.liquid` (187 lines). Each currently reimplements
its own open/close/backdrop logic for what is functionally the same
drawer/panel UI pattern.

Read all four files first to find the actual shared shape (open trigger,
backdrop click-to-close, Escape-to-close, focus handling) and the points
where they genuinely differ (panel content, positioning, any
panel-specific data). Design one shared primitive — likely a
`snippets/panel.liquid` (markup/wrapper) plus one shared
`assets/panel.js` (open/close/backdrop/Escape/focus-trap behavior,
parameterized by a data attribute or similar so multiple independent panel
instances on one page don't interfere), modeled on the a11y pattern already
proven in `assets/predictive-search.js` (referenced by Q3, already landed —
read it for the trap/Escape pattern this theme already uses correctly).
Migrate all 4 call sites onto the shared primitive without changing their
visible behavior or content.

**Test:** All 4 panels (account, footer localization, header account,
header search icon) open/close/backdrop-dismiss/Escape-dismiss identically
to before, verified on preview. `theme-check` clean.

**Model:** Sonnet, high effort (cross-cutting refactor — this is the [S+]
tier task in the source plan).

## Task 9: Q11 — JS minification build step

Mirror the existing Tailwind source/output convention in this repo:
`assets/input.css` (source, committed, not referenced by any `.liquid`
file) → `assets/output.css` (built, committed, referenced via
`{{ 'output.css' | asset_url | stylesheet_tag }}`), built by the
`tailwind:build` npm script.

Apply the same split to JS: `assets/*.js` files stay as the human-edited
source (committed, unminified). Add a build step that produces a minified
`assets/*.min.js` counterpart for every `assets/*.js` file, and update every
`<script src="{{ 'x.js' | asset_url }}" ...>` reference across the theme to
point at `x.min.js` instead. Use `esbuild` (already a reasonable, minimal,
well-known choice — no bundling across files, just per-file minify, since
each script currently loads independently per component) as a new
`devDependency`. Add an npm script (e.g. `"js:build"`) that minifies every
`assets/*.js` into its `.min.js` counterpart, and wire it into the existing
`"build"` script alongside `tailwind:build`.

**Test:** `npm run build` produces `assets/*.min.js` for every source file,
visibly smaller (report the before/after total size, current baseline is
131KB across 11 files — note the actual current file count/size, it has
grown since that number was recorded). Preview: every page exercising JS
(header, cart drawer, product page, collection filters, forms, panels)
behaves identically with the `.min.js` files loaded — check DevTools
Network tab confirms `.min.js` filenames are what's actually requested.
`theme-check` clean.

**Model:** Sonnet, medium effort (build tooling + a repo-wide find/replace
of script `src` references — must not miss any).
