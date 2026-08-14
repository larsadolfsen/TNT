# Collection filters: metafield-driven, zero taxonomy in the theme

Date: 2026-08-14
Status: approved, not yet implemented

## Problem

The collection page appears to define its own filter taxonomy. `sections/main-collection.liquid`
declares a `filter` block type (settings: `title`, `filter_type`, `key`, `display_mapping`) and a
preset that creates five such blocks. The theme editor shows them as *Filter – Tykkelse*,
*Filter – Størrelse / Bredde*, *Filter – Type / Form*, *Filter – Filter*, *Filter – Pris*.

**Those blocks are dead.** The section body never reads `section.blocks` and never calls
`{% content_for 'blocks' %}`. Every filter on the storefront comes from one line:

```liquid
{%- render 'collection-filter-list', filters: collection.filters -%}
```

`collection.filters` is Shopify's native storefront filtering, populated from the Search &
Discovery app config in the admin — which already supports product tags, variant options,
**product metafields**, price and availability. So the correct architecture is already in place
underneath a layer of fiction.

Three consequences:

1. Merchant-facing clutter, and a Theme Store reviewer sees a theme that looks like it defines its
   own filter taxonomy instead of consuming `collection.filters`.
2. The block settings describe data that does not exist. Verified against the live store
   (670 products): every product is `Title / Default Title`, so there are **no variant options** —
   the `option`-type filters (`bredde`, `form`) could never have resolved. Tags are just
   `Voksdug` / `Dækkeserviet`, so the `tag: tykkelse` filter has no data either.
3. The theme hardcodes data that belongs in Shopify (below).

## Store data (ground truth, 2026-08-14)

The store is already fully modeled on metafields, mostly metaobject-backed:

| Metafield | Type | Backing metaobject |
| --- | --- | --- |
| `shopify.color-pattern` (Farve) | `list.metaobject_reference` | `shopify--color-pattern`, 6 entries, each with a `color` hex |
| `shopify.shape` (Form) | `list.metaobject_reference` | `shopify--shape`, 5 entries (Organisk, Oval, Rund, Rektangulær, Firkant) |
| `shopify.fabric` (Stof) | `list.metaobject_reference` | standard |
| `shopify.fabric-structure` (Stofstruktur) | `list.metaobject_reference` | standard |
| `shopify.tablecloth-features` (Dugs egenskaber) | `list.metaobject_reference` | standard |
| `shopify.occasion`, `shopify.theme`, `shopify.care-instructions`, `shopify.product-certifications-standards` | `list.metaobject_reference` | standard |
| `custom.bredde_cm` (Bredde (cm)) | `list.metaobject_reference` | `centimeter`, 6 entries: 90/100/120/140/160/180 |
| `custom.metervare` | `boolean` | — |
| `custom.kemi` | `single_line_text_field` | — |

Plus a legacy duplicate layer of plain-text metafields — `custom.form`, `custom.farve`,
`custom.bredde` — superseded by the metaobject-backed versions above.

`shopify--color-pattern` entries carry real hex values (`Sort #000000`, `Klar #FFFFFF`,
`Brun #9A5630`, `Blå #005BD3`, `Grøn #05AA3D`, `Hvid #FFFFFF`), so Shopify serves these as native
swatches via `value.swatch.color` / `value.swatch.image` when `filter.presentation == 'swatch'`.

## Hardcoded data that duplicates Shopify

**A. Value-label overrides** — `snippets/collection-filter-list.liquid:39-53` rewrites filter
values in Liquid: `41x33 cm → 41x33 cm (Dækkeserviet)`, `Firkantet → Firkantet (Rulle)`,
`Rund → Rund skåret`. These are already stale: the shape metaobject value is `Firkant`, not
`Firkantet` (no match), and `41x33 cm` does not exist in the `centimeter` metaobject at all.
They also violate the no-hardcoded-user-facing-text rule.

**B. Colour-name → hex map** — `assets/main-collection.js:70-137` carries a hand-maintained
~40-entry Danish map (`'lyserød'`, `'sølv'`, `'gennemsigtig'`, `'frosted'`, …) and matches it
against the filter label via `data-color-name` string comparison, to reconstruct swatch colours
that Shopify hands over for free. For six actual colours. `snippets/collection-filter-list.liquid:28`
renders `.swatch-circle` with no background at all — the colour is painted by JS after load.

**C. Label sniffing** — `snippets/collection-filter-list.liquid:23` decides whether a filter is a
swatch filter with `filter.presentation == 'swatch' or filter_label_down contains 'farve' or
filter_label_down contains 'color'`. Only the first clause is correct.

**D. Hardcoded heading** — `sections/main-collection.liquid:69` renders a literal `Filtre`.

## Principle

**The theme renders `collection.filters` and owns zero taxonomy.** Which filters exist, their
order, their labels, their values and their swatch colours all come from Shopify admin. The theme's
only job is presentation: accordion, swatch circle, checkbox row, price range, active-filter chips.

## Changes

### Step 1 — Remove the dead blocks

- `sections/main-collection.liquid`: delete the `blocks` array (schema lines 205-247) and the
  `blocks` entries inside `presets` (lines 251-286).
- Add a theme setting for the sidebar heading (default `Filtre`) and use it at line 69, replacing
  the hardcoded string.

Storefront output is otherwise byte-identical — nothing reads `section.blocks` today. Risk: none
beyond the heading. Verification: collection page renders unchanged; the theme editor no longer
lists filter blocks.

### Step 2 — Native swatches

- `snippets/collection-filter-list.liquid`: key the swatch branch on `filter.presentation == 'swatch'`
  only; drop the `contains 'farve' / 'color'` sniff.
- Paint the circle in Liquid from `value.swatch.color`, or an `<img>` from `value.swatch.image`
  when present. Keep the existing checked-ring and tooltip markup.
- `assets/main-collection.js`: delete `getColorSwatchStyles` and `enhanceColorSwatches` and their
  call sites (~60 lines).
- Remove the now-unused `data-color-name` attribute.

Risk: a colour filter whose metaobject entry has no `color` and no `image` renders as an empty
circle. All six current entries have a hex, so this is not a live risk today; entries added later
without a colour are a merchant-side data gap, visible and fixable in admin — which is the correct
failure mode, versus silently guessing.

Depends on: Search & Discovery exposing `shopify.color-pattern` (not the legacy `custom.farve`
text metafield) as the colour filter. A text metafield reports `presentation == 'text'` and will
render as a checkbox list, not swatches. See admin work below.

### Step 3 — Delete the stale value overrides

- `snippets/collection-filter-list.liquid`: delete lines 39-53 and render `value.label` directly.

Caveat: `shopify--shape` is Shopify's *standard* taxonomy, so its entries (`Firkant`, `Rund`, …)
are not renameable in admin. If the "Firkantet (Rulle)" / "Rund skåret" wording is genuinely needed
for customers, the fix is to use the store's own `custom.form` metaobject as the filter source
instead of the standard `shopify.shape` — an admin decision, not a theme one. This step assumes
the standard labels are acceptable; if not, do the admin switch first.

### Step 4 — Failure-log entry

Add an `F-NNN` entry to `docs/failure-log.md` covering the guessed swatch colours (symptom: swatch
colours are string-matched from Danish label text and fall back to `background: <raw label>`, so
any colour outside the 40-entry map renders as an unstyled circle; root cause: theme reconstructing
data Shopify already serves via `value.swatch.color`; prevention: consume `collection.filters`
data as given, never re-derive it).

## Admin work (Lars, not code)

1. In Search & Discovery, enable the metafield filters to expose: Farve (as swatch), Form, Stof,
   Bredde (cm), Metervare, Dugs egenskaber.
2. Decide the fate of the legacy text metafields `custom.form`, `custom.farve`, `custom.bredde` —
   if left enabled they surface as duplicate filters alongside the metaobject-backed ones.
3. If customer-facing shape wording matters, switch the Form filter source from `shopify.shape` to
   a custom metaobject (see Step 3 caveat).

## Sequencing and verification

Three separate merges to `main`, verified one at a time per the project rule: Step 1, then
Step 2 + Step 4, then Step 3. `theme-check` passing is not verification — each step needs the
collection page opened in a browser and the filter sidebar inspected before the next one lands.

## Testing

This repo has no JS test runner, so there is no automated coverage for any of this — a stated gap,
not a silent one. Verification is `npx shopify theme check` plus manual inspection of the collection
page (desktop sidebar and mobile drawer) after each step:

- Step 1: filter sidebar renders exactly as before; heading is editable in the theme editor.
- Step 2: colour filter shows six correctly coloured circles; checked state rings correctly;
  mobile drawer matches.
- Step 3: value labels read as they do in the Shopify admin metaobject entries.

Step 2 removes logic rather than adding it, so the main regression risk is markup, which only
visual inspection catches.
