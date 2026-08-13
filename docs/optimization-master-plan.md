# Optimization master plan

Covers everything scoped so far: app extraction, theme genericization,
Theme Store compliance features (`theme-store-compliance-brainstorm.md`,
`missing-designs-brief.md`), component decomposition
(`component-decomposition-backlog.md`), and the grid→flex migration
(`grid-to-flexbox-migration.md`).

## Operating principles

1. **Maximum parallelism via file ownership.** Tasks run in parallel only
   when their file sets don't overlap. Every task lists the files it owns;
   a task that needs a file owned by an active task waits or joins that
   track. This is the only serialization rule — everything else runs
   concurrently.
2. **Every step is testable on the live server.** The store is not serving
   customers yet, so work is pushed directly to the store's theme
   (`shopify theme push` / `shopify theme dev`) and verified there — no
   preview-theme indirection needed. Each task below names its concrete
   verification. Features that require store configuration not yet set up
   (selling plans, local pickup locations, markets/multi-currency) get that
   test data configured on the store as part of the task. Revisit this and
   switch to unpublished preview themes the moment the store goes live.
3. **Cheapest capable model per task.** Tier legend:
   - **[H]** = Haiku, low effort — mechanical, fully specified, low blast
     radius. Safe to delegate once a spec exists.
   - **[S]** = Sonnet, medium effort — integration work, some judgment.
   - **[S+]** = Sonnet, high effort — cross-cutting or risky refactors.
   - **[O]** = Opus, high effort — design judgment, bespoke builds,
     quality-bar work.
   **Spec-first delegation:** where a task is [H] but underspecified, a
   stronger model writes the spec once (cheap, one file) and [H] executes.
   Never send an underspecified task to [H].
4. Existing project rules apply to every task: version bump on every push,
   single-purpose files, no `!important`.

## Branching

The project is not live, so all work runs directly on `main`. Parallel
tracks may use short-lived feature branches purely to avoid stepping on
each other mid-task, merging back to `main` as soon as their step is
verified on the store. No production/integration branch split until the
store launches.

---

## Wave 0 — Setup (serial, fast; blocks everything)

| ID | Task | Tier | Test on live server |
|----|------|------|---------------------|
| T0.1 | Wire repo → store theme push (`shopify theme push`/`theme dev`); document the flow | [S] | Store renders the theme from a fresh push |
| T0.2 | Record baselines: Lighthouse (home/collection/product, mobile+desktop) + `theme-check` output | [H] | Baseline numbers captured from the store |

## Wave 1 — Independent parallel tracks (no shared files)

**Track A — App extraction** (owns: `shopify-app/**`, new repo)

| ID | Task | Tier | Test |
|----|------|------|------|
| A1 | New repo; move `shopify-app/`; delete `test_*.js`/`get_*.js`; strip shop domain, `client_id`, package name | [H] | App builds; `shopify app dev` deploys to dev store |
| A2 | Generalize cart-transform function (remove client product assumptions) | [S] | Function fires correctly on a dev-store test product |
| A3 | Build theme app extension: by-the-meter app block, schema-driven (configurable SKU/handle/unit price) | [O] | Install on dev store; add block in theme editor; complete an end-to-end test order |
| A4 | Client migration: install app on client store; swap `product.Metervare.json` to the app block; verify | [S] | Preview theme on **client store** + real test order; only then publish |
| A4.5 | **Rename the metafield family to English before A5 ships** — see table below. Do it now: the app has never been deployed, so nothing in production depends on the current names. Only the store's existing definition (`gid://shopify/MetafieldDefinition/369929847117`) and its 4 values need updating, on a dev store, for one real product. After deploy this becomes a data migration | [S] | Fresh grep for `metervare` returns nothing in either repo except changelog/plan history; test cut still bundles correctly |
| A5 | App owns its data model: create the `custom.cut_to_length` definition and its `cut_to_length_*` siblings via `metafieldDefinitionCreate` on install, instead of the README's manual admin steps. Needs `write_products` added to `access_scopes` (currently `write_cart_transforms,read_cart_transforms`) | [S] | Fresh install on a dev store: definitions appear in Settings → Custom data with no manual setup |
| A6 | When a merchant enables metervare on a product, the app also writes native `unitPriceMeasurement` (`1 cm` / `1 m`) + `showUnitPrice` via `productVariantsBulkUpdate`. Removes double configuration: merchant sets it once in the app, and both app behavior and theme display light up. Depends on A5's `write_products` scope | [S] | Enable metervare on a test product → admin shows "Stykpris 79,00 kr./m" without the merchant touching it; theme card leads with the per-meter price |

**A4.5 rename map** — `metervare` is Danish and should not ship in an app that
may be sold. `cut_to_length` chosen over `by_the_meter` because it is
unit-agnostic (a merchant selling by the yard or foot gets sensible names).

| Current | English |
|---|---|
| `custom.metervare` | `custom.cut_to_length` |
| `metervare_min_length` / `_max_length` / `_length_step` | `cut_to_length_min` / `_max` / `_step` |
| `metervare_width` / `_width_option` | `cut_to_length_width` / `_width_option` |
| `metervare_shape_variants` | `cut_to_length_shape_variants` |
| `metervare_width_surcharge_variant` | `cut_to_length_width_surcharge_variant` |
| `metervare_price_variant` / `_carrier_variant` | `cut_to_length_price_variant` / `_carrier_variant` |
| `_metervare_variant_id` (line property) | `_cut_variant_id` |
| `_metervare_title` (line property) | see A4.6 — likely deleted, not renamed |

Touch points: `extensions/cart-transform/src/run.graphql` + `run.js`,
`extensions/by-the-meter-block/**`, the app README, and the store's metafield
definition + values.

| ID | Task | Tier | Test |
|----|------|------|------|
| A4.6 | Theme reads app data via `item.properties._metervare_title` in `sections/cart.liquid:38` and `sections/header-2.liquid:246` — app coupling that B5 does not remove. The cart-transform already sets the bundle title (`{product} ({Shape} {w}x{l} cm)`), so the theme should render `item.title` natively and drop the special-casing entirely. Verify at deploy, then delete both reads | [S] | Cart and cart drawer show the bundle title with no `_`-property special-casing; theme grep for `metervare` returns nothing |

**Track B — Genericization** (owns: `config/settings_schema.json` [branding
sections], `sections/header-2.liquid` [contact markup only],
`sections/footer.liquid` [defaults], `ai.md`, `scratch/`, root docs)

| ID | Task | Tier | Test |
|----|------|------|------|
| B1 | Hardcoded phone/email in `header-2.liquid` → theme settings | [H] (spec: [S]) | Editor shows new settings; preview renders values; blank = hidden |
| B2 | Branding sweep: `theme_name`/`theme_author`, favicon rename, footer default copy, `ai.md` cleanup, delete `scratch/` | [H] | Editor + preview inspection; `theme-check` passes |
| B3 | Rewrite README / CONTRIBUTING / CODE_OF_CONDUCT as own product docs; no designer-credit links in theme files | [H] | Docs only; `theme-check` passes |

**Track C — `layout/theme.liquid`** (owns: `theme.liquid`,
`snippets/css-variables.liquid` if needed)

| ID | Task | Tier | Test |
|----|------|------|------|
| C1 | Skip-to-content link + font-loading fix: drop hardcoded Google Fonts, route via native font_picker; decide Material Symbols strategy (self-host or SVG sprite) | [S] | Preview: fonts follow merchant settings; keyboard tab shows skip link; Lighthouse perf ≥ baseline |

**Track D — Cheap refactor slices** (owns: the named files only — none are
touched by Wave 2)

| ID | Task | Tier | Test |
|----|------|------|------|
| D0 | Atomic primitives library: `snippets/icon.liquid` (wraps Material Symbols usage), `snippets/button.liquid`, `snippets/input.liquid`, shared price-display snippet. API spec by [S], then mechanical call-site migration by [H]. **Soft-gates Wave 2**: all new surfaces must be built from these primitives (per CLAUDE.md rule) | [S]+[H] | Store renders identically after call-site migration; grep confirms no raw primitive markup remains |
| D1 | Trust-checkmark → one shared snippet (3 call sites) | [H] | Store product page: visually identical |
| D2 | Badge consolidation: 3 implementations → 1 configurable block | [S] | Editor presets migrate; preview identical |
| D3 | Rename `collection-grid` / `collections-grid` for clarity (incl. template refs) | [H] (spec: [S]) | Editor loads both blocks; existing templates unbroken |
| D4 | Hex→token sweep in `search.liquid`, `password.liquid`, `section.liquid` (fixed mapping table written once by [S]) | [H] | Preview light + dark mode: identical rendering |

**Track E — Design pass** (no repo files; consumes
`docs/missing-designs-brief.md`)

| ID | Task | Tier | Test |
|----|------|------|------|
| E1 | Produce designs for all 16 missing surfaces per the brief (Baymard-grounded, token-based) | [O] | Review artifact; gates Wave 2 |

## Wave 2 — Compliance build-out (needs E1 + D0; parallel by page area)

All new surfaces are composed from the D0 primitives (icon/button/input/price
snippets) — no re-inlined primitive markup, per the CLAUDE.md rule.

Each track owns its page area's files; no cross-track overlap by
construction. Within a track, tasks run serially (same files).

**P1 — Header** (owns: `sections/header-2.liquid`, `header-group.json`,
`blocks/header-*.liquid`)

| ID | Task | Tier | Test |
|----|------|------|------|
| P1.1 | `<shopify-account>` component, desktop + mobile (known styling-control gotchas — scope around them) | [S+] | Preview: visible both breakpoints; sign-in flow works |
| P1.2 | Multi-level nav (desktop dropdown + mobile drawer accordions per design) | [S] | Preview with a 3-level test menu; keyboard + touch |
| P1.3 | Predictive search panel | [S] | Preview: live suggestions against real products; empty/loading states |
| P1.4 | Follow on Shop button (placement per design; unmodified branded colors) | [H] | Renders on preview; Shop-app follow flow |

**P2 — Product page** (owns: `blocks/product-*.liquid`, `sections/product*.liquid`, `templates/product.json`)

| ID | Task | Tier | Test |
|----|------|------|------|
| P2.1 | Accelerated checkout buttons (`payment_button`) | [H] | Dynamic checkout button renders on preview; test checkout |
| P2.2 | Shop Pay Installments banner | [H] | Renders near price on preview (Shop Pay enabled store) |
| P2.3 | Native unit pricing (product side) per design | [H] (spec from E1) | Dev-store product with unit price set; renders per design |
| P2.4 | Pickup availability | [S] | Dev store with a pickup location; both availability states |
| P2.5 | Related recommendations (native API section) | [S] | Preview: recommendations populate on live products |
| P2.6 | Complementary products (native API; verify/replace bespoke cross-sell) | [S] | Dev store with Search & Discovery complementary set |
| P2.7 | Variant images + 3D model (`model_viewer`) verify/fix | [S] | Dev-store product with variant images + a 3D model |

**P3 — Cart** (owns: `sections/cart.liquid`, `templates/cart.json`)

| ID | Task | Tier | Test |
|----|------|------|------|
| P3.1 | Discount display (line-item + order-level) | [S] | Dev-store discount codes; both types render |
| P3.2 | Selling plans in cart | [S] | Dev store with a subscription selling plan |
| P3.3 | Unit pricing (cart side) | [H] | Same product as P2.3; cart line matches |

**P4 — Collection/search** (owns: `snippets/product-card.liquid`,
`snippets/image.liquid`, `sections/main-collection.liquid` [card markup only])

| ID | Task | Tier | Test |
|----|------|------|------|
| P4.1 | Unit pricing on cards | [H] | Collection preview shows unit price per design |
| P4.2 | Image focal-point support in `image.liquid` (propagates everywhere) | [S] | Set focal point in admin; verify crops on cards/heroes |

**P5 — Structural + footer** (owns: `templates/page.contact.json`, new
Custom Liquid section, `sections/footer.liquid`, `footer-group.json`)

| ID | Task | Tier | Test |
|----|------|------|------|
| P5.1 | `page.contact.json` + contact form page | [H] (spec from E1) | Submit test message on preview; arrives in admin |
| P5.2 | Custom Liquid section (`type: liquid` setting) | [H] | Add section in editor; paste test Liquid; renders |
| P5.3 | Newsletter signup form (footer) | [H] | Submit on preview; customer appears with consent in admin |
| P5.4 | Country + language selectors | [S] | Dev store with 2 markets/languages; switch both on preview |

**B4 — Customizer removal** (needs A4; owns: `blocks/product-customizer.liquid`,
`templates/product.Metervare.json`, footer textile badges)

| ID | Task | Tier | Test |
|----|------|------|------|
| B4 | Delete customizer block, Metervare template, OEKO-TEX/Phthalat badges | [H] | Preview product pages unaffected; `theme-check` passes |

**B5 — Retire the metervare per-meter display** (independent of A4/B4; owns:
`blocks/product-price.liquid`, `snippets/product-card.liquid`)

Replaces the client-specific `×100` per-meter math with Shopify's native unit
pricing, removing the last metervare trigger from the theme. Background and
signal analysis: `docs/superpowers/specs/2026-08-05-metervare-signal-audit.md`.

**Product data reality (verified 2026-08-05):** of the 4 products carrying
`productType: "Metervare"`, only **`voksdug-gra-jeanslook-med-hvid-bladranke-160-cm`
is a real product**. The other three (`klar-gennemsigtig-voksdug-*`,
`kraftig-gennemsigtig-voksdug-1-3-mm`) are test products. So the data migration
is one variant, not eight — and it was configured manually in admin on
2026-08-05 (Samlet mængde `1 cm` / Basismål `1 m` → renders "89,00 kr./m").

**The per-cm price must never be the headline.** A variant priced 0,79 kr/cm
renders as "0,79 kr" today, which reads as 79 øre and is actively misleading —
nobody buys 1 cm. Where the corrected price comes from depends on the surface:

| Surface | Owner | Why |
|---|---|---|
| Product page price for a cut-to-length product | **App block** | The app already computes the cut price (its summary shows per-meter rate, unit total, total). Merchant removes the theme's price block from that product template and the app block owns the display. |
| Collection card / search result price | **Theme** | No app-block slot exists inside a collection grid — a theme app extension cannot render per card. Unavoidably theme code. |

**Theme-side signal: presence of `unit_price_measurement`, not any metervare
trigger.** Unit pricing is configured on exactly the per-cm products and
nothing else, so for this catalog "has unit pricing" ≡ "is metervare" — but the
theme never learns the client-specific concept, which keeps it sellable. A
merchant selling rope or cable gets identical behaviour by configuring unit
pricing. (Known limitation: a catalog that *also* sells pack-priced goods with
unit pricing — a 500 g coffee showing "50 kr/kg" — would wrongly lead with the
per-kg figure. Not the case here; add a generic per-product metafield override
if it ever becomes one.)

| ID | Task | Tier | Test |
|----|------|------|------|
| B5.1 | Data: per-cm products need unit pricing set (`1 cm` / `1 m`) for their price to render correctly. **Not a blocker** — this is a development store, so mid-migration inconsistency is expected and fine; the catalog gets tidied as products are converted. Verified 2026-08-05: `beige-voksdug-...-i-brun-140-cm` is 0,79/cm with unit pricing, its two visually identical siblings still 79,00/m with none. A per-cm product missing unit pricing simply renders its raw price until configured — no code change depends on catalog-wide consistency | [H] | Spot-check one converted product shows its per-meter price |
| B5.2 | `snippets/product-card.liquid`: delete `is_meter_product` + `×100`. When `unit_price_measurement` is present, render the **unit price as the headline** and suppress the raw per-cm price; otherwise unchanged | [S] | Beige product's card shows "79,00 kr/m" as the main price, no "0,79 kr" anywhere; a normal product's card is untouched |
| B5.3 | `blocks/product-price.liquid`: delete the `is_metervare` branch, `×100`, and `pr. meter inkl. moms` suffix (incl. the per-variant JSON payload and `updatePrice()` JS path). Same headline rule as B5.2 for non-app-owned templates | [S] | Cut-to-length product page shows the per-meter price as headline; variant switching keeps it correct; normal products unchanged |
| B5.4 | Product template: remove the theme price block from the cut-to-length product template so the app block owns product-page pricing (needs A4) | [H] | Product page shows only the app block's pricing, no duplicate price row |
| B5.5 | Verify no metervare trigger remains: grep `metervare`, `Metervare`, `times: 100`, `pr. meter` across the theme | [H] | Only hits are app-owned line-item properties in cart/header, if any |
| B5.6 | Remove `product.type == 'Metervare'` from the theme. Verified 2026-08-05: exactly one live call site (`snippets/product-card.liquid:35`), deleted by B5.2; other hits are inside `product-customizer.liquid`, deleted by B4. `templateSuffix` is a separate per-product admin setting and is unaffected | [H] | grep for `'Metervare'` returns nothing outside the customizer |

**⚠️ Do NOT delete the `custom.metervare` metafield.** An earlier revision of
this plan listed deleting definition `gid://shopify/MetafieldDefinition/369929847117`,
following the audit's note that removal is "safe from the theme's side." That
was written before the app existed and is now wrong — the app depends on it:

- `cart-transform/src/run.js:34` — the metafield is what sets `isMetervare`,
  i.e. whether the cart bundle is built at all.
- `by-the-meter-block` — the same flag gates whether the block renders, plus a
  whole `metervare_*` family (`metervare_width_option`, `metervare_min_length`,
  `metervare_shape_variants`, `metervare_price_variant`, …) carrying the
  per-product configuration.

The metafield stops being a theme concern (B5.2/B5.3 remove the last theme
reads) and becomes the **app's opt-in API**. It gets more load-bearing, not
less. The audit's §2 "unverified external-consumer check" now has an answer:
yes — our own app reads it.

**Why the app can't switch to unit pricing as its trigger** (asked and
verified 2026-08-05, recorded so it isn't re-litigated): the Cart Transform
Function's input schema does not expose unit pricing. Its `ProductVariant`
type offers only `id`, `metafield`, `product`, `requiresShipping`, `sku`,
`title`, `weight`, `weightUnit`, and the string `unitPrice` appears nowhere in
`extensions/cart-transform/schema.graphql`. Shopify Functions run on a minimal
input schema by design, with `metafield()` as the sanctioned extension point.

The app block *could* read `unit_price_measurement` (it's storefront Liquid),
but must not: if the block rendered on unit-pricing presence while the function
fired on the metafield, a product with one and not the other would let a
shopper configure a cut, add it to cart, and receive no bundle — a broken order
surfacing only at checkout. Block and function therefore read the same flag.

Net split — display signal drives display, explicit opt-in drives behavior:

| Consumer | Trigger |
|---|---|
| Theme (cards, price block) | `unit_price_measurement` presence — no metervare knowledge, keeps the theme sellable |
| App block + cart-transform | `custom.metervare` metafield — same flag in both, cannot drift |

**Why not let `custom.metervare` drive the theme too** (considered 2026-08-05,
rejected): it would put `product.metafields.custom.metervare` — a key belonging
to one specific app — inside a theme being prepared for Theme Store sale. That
is dead code for essentially every merchant who buys it, and precisely the kind
of app-specific dependency Theme Store review scrutinizes (§1 exclusivity, §2
uniqueness: a theme must stand on its own).

They are also genuinely different facts, not one fact with two flags:

- **Unit pricing** — "display this price per meter." A pricing attribute; EU
  rules require it for some goods. A merchant can legitimately want it with no
  cutting at all (fixed 1 m pieces priced per cm).
- **`custom.metervare`** — "this product can be cut to an arbitrary length." A
  behavioral capability, and the only signal the Function API can even see.

The double-configuration burden that motivated the question is removed by **A6**
instead: the app writes native unit pricing itself when metervare is enabled, so
the merchant configures once and the theme still reads only native data.

Sequencing note: B5.2–B5.5 need neither the app deploy nor a fully consistent catalog, **not** the app deploy. The
`×100` display and the customizer's cart math are independent concerns — the
audit's §4 constraint ("can't delete the math until something else owns the
per-cm cart total") applies to *restating prices per meter*, which was ruled
out. Native unit pricing leaves prices stored per cm, so the cart math is
untouched and B5 can ship before A4/B4.

## Wave 3 — Deep refactor + flex (after Wave 2; parallel by file ownership)

| ID | Task | Tier | Test |
|----|------|------|------|
| R1 | Extract inline `<script>` → `assets/*.js` (one task per section: header, breadcrumbs, main-collection) | [S] | All interactions work on preview (cart drawer, filters, breadcrumbs) |
| R2 | Card markup consolidation onto `product-card.liquid` (or a small card-snippet set) | [S+] | Visual sweep of every card surface, light + dark |
| R3 | Split oversized files (one task per file: `main-collection`, `breadcrumbs`, `product-buy-buttons`, `product-media`, `header-2`) | [S+] | Per-file before/after preview regression |
| R4 | Grid→flex: safe swaps (listing grids, testimonials, per-block `order`); product page per the pending user decision in `grid-to-flexbox-migration.md` | [S] | Preview at mobile/tablet/desktop breakpoints |
| R5 | Shared padding-CSS boilerplate → snippet | [H] | Spot-check blocks render identically |
| R6 | Full hex→token sweep of remaining files | [H] | Light + dark preview sweep |
| R7 | Text style standardization: build the 11-style CSS class catalog + `snippets/text.liquid` per `docs/superpowers/specs/2026-08-07-text-style-standardization-design.md`, then mechanical call-site migration across ~30 files replacing the 42 audited utility-class combos. `cart.liquid:39,68,103,105` needs a manual (non-mechanical) split — same class currently covers both line-item title and price | [S]+[H] | Grep confirms none of the 42 removed class combos remain in `*.liquid`; visual sweep of homepage/PDP/cart/collection/account/search, light + dark |

## Wave 3.5 — Findings from the post-Wave-3 audit (parallel by file ownership)

Discovered while auditing the repo for optimization opportunities not already
named in Waves 1–3 (see conversation log 2026-08-07). Each task owns only the
files it names; no cross-task overlap by construction.

**Batch 1 DONE (2026-08-07, branch `claude/wave35-batch1`, final review
clean):** Q7+Q15 (41bd92c), Q10+Q12 (0c982c1), Q13 (Admin-API check, no code
change), Q14 (b081da9). Q1–Q6, Q8, Q9, Q11 wait for R6 to land.

**Batch 2 DONE (2026-08-07, merged as 179dea9, v1.0.122, live-verified):**
Q1 (fb1e258 + gallery-guard fix f81ceed), Q3 (2f4e846), Q8 (2019ce2).
Live checks on the deployed theme: cart drawer opens with focus on the close
button, Escape closes, aria-labelledby resolves; money.js formats "1.234,56
kr"; zero googleusercontent references; icons render via the primitive.
Remaining for batch 3: Q2, Q4, Q5, Q6, Q9, Q11 (check R7's file list before
starting those).

**Batch 3 DONE (2026-08-13, merged as `facba43`, v1.0.141, theme-check clean
at 140 files / 0 offenses).** Q2, Q4, Q5, Q6, Q9, Q11 — all nine plan tasks
executed via subagent-driven development, each task-reviewed, plus a final
whole-branch review whose findings were fixed before merge. R7 was checked
first: only its design doc had landed (`dabb7eb`), no implementation files,
so there was no file-list conflict with any of them.

- **Q2** — `loading`/`fetchpriority` across 8 image call sites, spec-driven
  (`docs/superpowers/specs/2026-08-09-image-loading-fetchpriority-spec.md`).
  `snippets/image.liquid` needed a one-line change: it wasn't forwarding
  `fetchpriority` to `image_tag` at all.
- **Q4 + Q5** — twelve inline `<script>` blocks extracted to `assets/*.js`
  using the IIFE + JSON config-island convention.
- **Q6** — subcollections trio deduped. Deleted
  `blocks/collection-subcollections.liquid` (unreachable near-duplicate; no
  schema names it as a block type) and `sections/collection-subcategories
  .liquid` (no template refs, and its `applyQuickFilter` onclick handlers
  call a function defined nowhere in the repo — the buttons were already
  broken), plus the orphaned `snippets/subcategory-tile-content.liquid`.
- **Q9** — new shared `assets/panel.js` primitive. All three panels migrated:
  `header-account`, `footer-localization` (off native `<dialog>`), and
  `header-search-icon`'s mobile overlay. `assets/header-account.js` deleted;
  `predictive-search.js`'s duplicated `initMobileOverlay()` removed.
- **Q11** — esbuild minification, 186.9KB → 86.9KB (~53%). `assets/*.js` are
  now source; `assets/*.min.js` are the built artifacts every `<script src>`
  loads. `npm run dev` gained a `js:watch`, `ai.md` documents the step, and
  CI fails if the committed artifacts are stale.

**Bugs found by review, not by planning** — worth recording because each was
silent: a duplicate-listener bug that made accordions open-then-close on one
click; a focus-restore regression that yanked focus off whatever the user
clicked; a focus trap that leaked because it counted `display:none` elements
(the localization modal hides most language rows); and three extracted
scripts still querying the `.material-symbols-outlined` class that the
upstream Lucide migration had removed mid-batch.

**Still owed: browser verification.** Nothing in this batch has been seen in
a browser. Highest-risk surfaces, in order — the footer country/language
modal on a *mobile product page* (it lost native `<dialog>`'s top-layer
stacking and UA focus containment; both were hand-reimplemented), the mobile
search takeover, the header account dropdown, and a spot-check that the Q6
deletions left nothing reachable in the live store's section picker.

**Separate pre-existing bug, live on main, not from this batch:**
`assets/main-collection.js:245,248` sets `.textContent` on the collection
filter's toggle icon, which the Lucide migration turned into
`<svg><use href="#icon-minus"></use></svg>`. Setting `textContent` on an
`<svg>` wipes its `<use>` child, so that icon disappears permanently on
first click. Needs its own task.

| ID | Task | Tier | Test on live server |
|----|------|------|---------------------|
| Q1 | Remove hardcoded third-party fallback images (`lh3.googleusercontent.com/aida-public/...` prototype mockup URLs) in `snippets/product-media-hidden-image.liquid:17` and `snippets/product-media-gallery-track.liquid:65`; replace with a real placeholder or remove the fallback | [H] | Preview a product with no media: no request to `googleusercontent.com` in network tab |
| Q2 | `loading`/`fetchpriority` spec for `snippets/image.liquid` call sites (12 total): lazy by default, eager+`fetchpriority="high"` for above-the-fold cards (first N collection/search cards, PDP hero). The snippet already accepts a `loading` param — this is purely call-site work, no snippet change. Spec by [S], mechanical call-site migration by [H] | [S]+[H] | Preview: DevTools network shows offscreen images deferred; Lighthouse perf ≥ baseline |
| Q3 | Cart drawer accessibility: `role="dialog"`, `aria-modal`, Escape-to-close, focus trap — model off `assets/predictive-search.js`, the only file in the theme that already does this correctly. Owns `assets/header-cart.js`, `blocks/header-cart.liquid` | [S] | Open cart drawer: focus stays trapped, Escape closes, screen reader announces dialog |
| Q4 | Extract `blocks/product-shipping-progress.liquid`'s 306-line inline `<script>` (lines 107–412) to `assets/product-shipping-progress.js` | [S+] | Preview: shipping-progress bar behavior unchanged |
| Q5 | Extract remaining inline `<script>` blocks to `assets/*.js` (one task per file, same pattern as R1): `blocks/trust-countdown.liquid`, `blocks/product-variant-picker.liquid`, `blocks/product-price.liquid`, `blocks/product-urgency.liquid`, `sections/contact-form.liquid`, `blocks/product-testimonial.liquid`, `blocks/collection-subcollections.liquid` + `sections/collection-subcollections.liquid`, `snippets/newsletter-form.liquid`, `blocks/badge.liquid`, `blocks/product-pickup-availability.liquid`, `blocks/product-accordions.liquid`, `blocks/accordion.liquid` | [S] | Per-file preview regression: interactions unchanged |
| Q6 | Audit the subcollections trio: `sections/collection-subcollections.liquid` (225), `blocks/collection-subcollections.liquid` (235), **and** `sections/collection-subcategories.liquid` (228) — near-identical files with duplicated collapse/expand script. **None of the three appears in any template JSON** (verified 2026-08-07) — they are reachable only via the editor's section picker, so check store-side templates in admin before declaring dead. Remove the dead ones, dedupe the survivors. Coordinate with Q5 (same files) | [S] | grep + admin template check confirm one implementation only; preview unchanged |
| Q7 | Extract shared `formatMoney`/`formatWithDelimiters` helper (currently duplicated near-verbatim in `assets/header-cart.js` and `assets/predictive-search.js`) into a single shared script | [H] | Cart drawer and predictive search prices render identically |
| Q8 | Migrate remaining raw `material-symbols` markup to the `snippets/icon.liquid` primitive (D0 call-site migration was incomplete): `snippets/breadcrumbs-nav.liquid` (14x), `snippets/breadcrumbs-mobile-link.liquid`, `sections/collection-subcollections.liquid`, `sections/collections.liquid`, `blocks/product-price.liquid`, `blocks/accordion.liquid`, `blocks/product-accordions.liquid`, and `sections/main-collection.liquid` (R3's file — coordinate if R3 rework is in flight) | [H] | Preview: icons render identically; grep for raw `material-symbols` outside `snippets/icon.liquid` returns nothing |
| Q9 | Consolidate duplicated drawer/panel open-close-backdrop logic into a shared primitive: `snippets/account-panel.liquid`, `blocks/footer-localization.liquid`, `blocks/header-account.liquid`, `blocks/header-search-icon.liquid` each reimplement their own | [S+] | All 4 panels open/close/backdrop identically on preview |
| Q10 | Add `--minify` to the Tailwind build scripts in `package.json` (`tailwind:build` and its non-watch sibling) | [H] | `assets/output.css` shrinks; preview renders identically |
| Q11 | Introduce a JS bundling/minification step for `assets/*.js` (currently shipped raw, 131KB across 11 files) | [S] | Build produces minified output; preview behavior unchanged |
| Q12 | `psi` devDependency has no npm script wired to it — either add a `lighthouse`/`psi` script or drop the dependency | [H] | `npm run <script>` works, or `package.json` no longer lists `psi` |
| Q13 | ~~Verify `templates/product.standard.json` vs `templates/product.json`~~ **Resolved 2026-08-07 via Admin API: `.standard` is LIVE** — at least 2 ACTIVE products assigned (`daekkeserviet-laeder-raw-organic-curve-sort`, `daekkeserviet-i-klar-plast-organic-raw`); both templates stay. Same check confirmed 3 ACTIVE products still carry the `Metervare` suffix whose template B4 deleted (open decision 2) — they currently fall back to the default template. Remaining user decision: is the `.standard` layout (card wrapper, no product-trust block) intentional for the placemat products? | [S] | Done (API check); layout-intent question logged under open decisions |
| Q14 | 6 unused locale keys in `locales/en.default.json`: `collections.title`, `contact.heading`, and a `customers.login.*` cluster (`.email`/`.password`/`.submit`/`.title`). Check first whether the `customers.login.*` absence signals a missing accessible label on the customer login page (no `templates/customers/login` exists in the repo) before pruning as dead strings | [S] | Customer login page (if it exists/gets built) has accessible field labels; genuinely unused keys removed |
| Q15 | `querySelectorAll('#cart-counter')` (plural query against a unique ID per `blocks/header-cart.liquid:9`) at **three** call sites: `assets/product-buy-buttons.js:228`, `assets/header-cart.js:105`, `assets/header-cart.js:273` — fix all to `getElementById` (`product-buy-buttons.js:274` already does it right) | [H] | Cart counter updates correctly on add-to-cart and cart-drawer changes |

## Wave 3.75 — Findings from a fresh audit while Wave 3.5 batch 3 was in flight (2026-08-09)

Discovered while planning the next wave, scoped deliberately to issues not
already named in Wave 3.5's Q1–Q15 or any other tracked doc. Each task owns
only the files it names; no cross-task overlap by construction, and no
overlap with Wave 3.5 batch 3's remaining files.

| ID | Task | Tier | Test on live server |
|----|------|------|---------------------|
| W1 | R6's hex→token sweep (Wave 3) was marked done but missed 6 hardcoded hex literals across 3 files that duplicate/bypass existing tokens: `snippets/star-rating.liquid:31` (`text-[#FFB800]`, inconsistent with `blocks/product-trust.liquid`'s `text-amber-500` for the same star-rating concept — align both to `text-amber-500`), `snippets/product-media-gallery-style.liquid:71,99` (`border-color: #888888` → `var(--color-border)`, `color: #6b7280` → `var(--color-foreground)` at reduced opacity or `--color-foreground)`), `snippets/savings-badge.liquid:23,26` + `blocks/product-price.liquid:241` (`#c8102e` ×3, a "savings badge" red distinct from `--color-important` — reuse `--color-important` rather than add a new token, since it's the theme's one attention/urgency color). **Excluded as false positives** (verified 2026-08-09, do not re-flag): `blocks/badge.liquid:176,183` (`"default": "#000000"/"#ffffff"` are color-picker schema defaults, the same pattern `important_color` uses in `settings_schema.json`), `sections/section.liquid:128-129` (`default: '#ffffff'`/`'#e2e8f0'` mirrors `css-variables.liquid`'s own dark-mode fallback literals verbatim), `snippets/breadcrumbs-nav.liquid:56,60` (`var(--color-background, #ffffff)` is a CSS custom-property fallback, same convention as `var(--page-width, 1440px)` in `section.liquid`) | [H] | Preview light + dark mode: identical rendering |
| W2 | `layout/password.liquid` independently hardcodes the same Google Fonts `<link>` tags (Playfair Display, Work Sans, Material Symbols) that C1 (Wave 1) removed from `layout/theme.liquid` in favor of the native font_picker — missed because it's a separate layout file | [H] | Preview the password page: fonts still render correctly via font_picker settings; Playfair Display and Work Sans `<link>` tags are gone — only the Material Symbols Google Fonts link remains, kept as a documented exception (not a font_picker-covered family) |
| W3 | Fix the theme-check baseline errors carried as "known, don't regress" since Wave 0: 1× `ParserBlockingScript` (`layout/theme.liquid`'s `masonry.js` `script_tag`, fix via `defer`) — **done this wave.** The 7× `ImgWidthAndHeight` (`sections/cart.liquid:17`, `sections/collection-subcategories.liquid` ×6) were deliberately deferred: 6 are in a file Wave 3.5's Q6 may delete, and the 7th (cart.liquid) needs a sizing decision out of scope for this wave — see `docs/superpowers/plans/2026-08-09-wave-3-75-plan.md` Task 3's "Note". Follow-up needed. | [H] | `npx shopify theme check`: the `ParserBlockingScript` offense no longer appears; the 7 `ImgWidthAndHeight` offenses remain (expected, tracked as follow-up); preview unaffected |
| W4 | Remove the leftover `console.log` in `assets/masonry.js` | [H] | Preview: masonry grid behaves identically, browser console has no log line from this file |
| W5 | ~~3 standalone `UnusedAssign` dead-code sites, independent of the subcollections-trio duplication already covered by Q6: `blocks/product-buy-buttons.liquid:31` (`width`), `blocks/card.liquid:54` (`content_align_class`), `sections/breadcrumbs.liquid:100` (`visible_count`).~~ **Done 2026-08-09.** `width` and its dependent `base_variant` computation were confirmed dead (leftover pre-app-extraction cut-to-length logic) and deleted. `visible_count` was confirmed superseded by the working `has_ellipsis` truncation mechanism and deleted. `content_align_class` was the one half-wired feature: restored and wired into `card_content_classes` in the grid/vertical branch only (where `.grid-layout` had no `align-items` at all before), so `alignment`'s 4 values now vary cross-axis alignment there; the default (`left`/vertical) branch renders identically to before via an explicit `items-stretch`, and the horizontal branch keeps its original literal `items-center` unconditionally, since cross-axis alignment isn't what a horizontal text-alignment setting should drive — `flex_justify` already owns horizontal alignment on the main axis | [H] | `npx shopify theme check`: these 3 `UnusedAssign` offenses no longer appear; preview unaffected |

**Wave 3.75 complete (2026-08-09), branch `claude/wave-3-75-planning-fb7f36`.**
W1–W5 all done, task-reviewed individually and whole-branch reviewed twice
(a Critical uncompiled-CSS-class bug and a version-bump miss were caught and
fixed in the whole-branch pass — task-level review alone would have missed
both since neither is visible from a single task's diff). Follow-ups logged,
not fixed here (all pre-existing, discovered incidentally):
- `assets/product-buy-buttons.js:405,418` — same untokenized `bg-[#c8102e]`
  savings-badge pattern as W1, missed because W1 only covered `.liquid`
  files. Needs the same `bg-important` swap plus a browser check of the
  mobile sticky bar.
- `text-amber-500` (star rating, `snippets/star-rating.liquid` +
  `blocks/product-trust.liquid` + `blocks/product-testimonial.liquid`) is a
  hardcoded Tailwind palette color, not a theme token — won't follow
  merchant color settings. Works today because no merchant customization
  exists for it yet; would need a `--color-rating`-style token to become
  configurable.
- `snippets/product-media-gallery-style.liquid:70` — the thumbnail hover
  border now matches the `.border-primary` (selected) border exactly
  (both `var(--color-primary)`), so hover no longer visually distinguishes
  itself from selected beyond shadow depth. Low priority; strictly better
  than the no-op it replaced.

## Wave 4 — Submission package (serial at the end)

| ID | Task | Tier | Test |
|----|------|------|------|
| S1 | Accessibility remediation to Lighthouse ≥90 (audit first, then fix per component) | [S+] | Lighthouse a11y ≥90 mobile+desktop, all 3 page types |
| S2 | Performance tuning to ≥60 | [S+] | Lighthouse perf ≥60 mobile+desktop, all 3 page types |
| S3 | Demo store content, presets, `/listings` folder | [O] | Demo store review against Theme Store demo requirements |
| S4 | Final `theme-check`, exclusivity grep (no credits/affiliate links), package + submit | [S] | Clean check; submission accepted into review |

## Status and remaining sequence

_Last re-sequenced 2026-08-05 (v1.0.94). Waves 0–2 are complete; the sections
above are kept as the record of what each task delivered._

**Done:** Wave 0 (T0.1, T0.2) · Wave 1 (A1–A3, B1–B3, C1, D0–D4, E1) ·
Wave 2 (P1–P5, all 16 surfaces) · the collection-card 100× pricing fix.
theme-check sits at 8 errors, below the 12-error baseline.

**Not done, and blocked on a human:** the app has never been deployed —
`shopify app config link` + `shopify app deploy` need Partner access. Nothing
in the app has ever executed; expect first-run bugs.

### Remaining sequence

**Stage 1 — app rename, before any deploy** (A4.5). Free now, a data
migration later: the app has never shipped, so only one dev-store definition
and four values carry the Danish names. Must precede A5, which would otherwise
create definitions under names we intend to replace.

**Stage 2 — app self-setup** (A5 → A6, serial; A6 needs A5's `write_products`
scope). A5 makes the app create its own metafield definitions; A6 makes it
write native unit pricing when a merchant enables cut-to-length, so the
merchant configures once and the theme still reads only native data.

**Stage 3 — deploy and verify** (A4, human). Link, deploy, install, configure
a real product, place a test cut order. Everything downstream waits on this
because it is the first time any app code runs.

**Stage 4 — post-deploy theme cleanup** (A4.6; needs Stage 3).
A4.6 removes the theme's `_metervare_title` reads once the cart-transform's
bundle title is confirmed.

**Wave 3.75 — done 2026-08-09.** All 5 tasks (W1–W5) complete: hex→token
sweep, `layout/password.liquid` font-loading fix, `masonry.js` deferred
(`ParserBlockingScript` fixed), `console.log` removal, and 3 dead
`UnusedAssign` sites resolved. See `.superpowers/sdd/progress.md` for the
per-task ledger and commit hashes.

**B4 — done 2026-08-07, ahead of schedule.** User decided the app should own
cut-to-length UI outright rather than waiting on deploy: deleted
`blocks/product-customizer.liquid` (2 680 lines, already dead — no template
instantiated it), `templates/product.Metervare.json` (its product-page
section already used the app's by-the-meter block), and the hardcoded
OEKO-TEX/Phthalat-fri footer badge row. Not gated on A4 after all.

**Runs in parallel with Stages 1–4, no dependency on any of them:**

- **B5.2, B5.3, B5.5** — unit price as the headline on cards and the price
  block, then grep-verify. Independent of the app: the theme's signal is
  native `unit_price_measurement`, which is already configured on the real
  product. *This is the fix for "0,79 kr" showing as a headline price.*
- **Wave 3 (R1–R7)** — refactor and grid→flex. Partitioned by file, ~6
  concurrent. **R4 still blocked on the product-page mobile-ordering decision
  in `grid-to-flexbox-migration.md`** — R1, R2, R3, R5, R6, R7 are not.
- **B5.1** — configure unit pricing on further per-cm products as they are
  converted. Not a blocker; a product without it renders its raw price.

**Stage 5 — submission** (S1 → S2 → S3 → S4, after Wave 3 settles). Note S1/S2
need a Lighthouse baseline that still does not exist — the storefront is not
reachable from the build container, so it must be captured from a local
machine before remediation can be measured.

### Critical path

`A4.5 → A5 → A6 → A4 (human deploy) → A4.6 → S1/S2 → S3 → S4`

The app chain is now the long pole, because the theme work that used to sit on
the critical path (Wave 2) is finished. B5.2/B5.3 and Wave 3 run fully
alongside it and should be started immediately rather than queued behind the
deploy.

### Open decisions blocking work

1. **Product-page mobile ordering** (`grid-to-flexbox-migration.md`) — blocks
   R4 only. Accept Title/Trust moving below the gallery on mobile in exchange
   for deleting the duplicate-block hack, or keep that component on Grid.
2. **The 3 test Metervare products** — configure, unpublish, or delete.
   Note: `templates/product.Metervare.json` no longer exists (deleted with
   B4), so any product still assigned that template suffix now falls back to
   the default product template until reassigned in admin.
3. **Wave 2 has never been seen in a browser.** Predictive search, mega menu,
   cart summary, recommendations, contact page and the localization selectors
   were verified only by theme-check, which is a linter. Refactoring on top of
   unverified code (Wave 3) means a later regression cannot be attributed to
   its cause.
