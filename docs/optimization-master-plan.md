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
| D0 | Atomic primitives library: `snippets/icon.liquid` (wraps Material Symbols usage), `snippets/button.liquid`, `snippets/input.liquid`, shared price-display snippet. API spec by [S], then mechanical call-site migration by [H]. **Soft-gates Wave 2**: all new surfaces must be built from these primitives (per AGENTS.md rule) | [S]+[H] | Store renders identically after call-site migration; grep confirms no raw primitive markup remains |
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
snippets) — no re-inlined primitive markup, per the AGENTS.md rule.

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

## Wave 4 — Submission package (serial at the end)

| ID | Task | Tier | Test |
|----|------|------|------|
| S1 | Accessibility remediation to Lighthouse ≥90 (audit first, then fix per component) | [S+] | Lighthouse a11y ≥90 mobile+desktop, all 3 page types |
| S2 | Performance tuning to ≥60 | [S+] | Lighthouse perf ≥60 mobile+desktop, all 3 page types |
| S3 | Demo store content, presets, `/listings` folder | [O] | Demo store review against Theme Store demo requirements |
| S4 | Final `theme-check`, exclusivity grep (no credits/affiliate links), package + submit | [S] | Clean check; submission accepted into review |

## Parallelism summary

- **Wave 1:** five tracks (A, B, C, D, E) fully concurrent — up to 5 agents.
- **Wave 2:** five page-area tracks (P1–P5) concurrent + B4 when A4 lands —
  up to 6 agents; within-track tasks serial.
- **Wave 3:** R1's three sections, R3's five files, and R4–R6 partition by
  file — up to ~6 concurrent.
- Critical path: T0.1 → (E1 ∥ D0) → P1 (largest track) → S1/S2 → S3 → S4,
  with A1→A2→A3→A4→B4 as the second-longest chain, running fully parallel
  to it.
