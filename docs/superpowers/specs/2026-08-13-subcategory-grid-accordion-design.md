# Subcategory grid "show more" accordion — design

Date: 2026-08-13
Branch: `claude/beskrivelsen-ikke-vises-1530f4`

## Goal

On a collection page's subcategory grid (`sections/collections.liquid`, driven by
`collection.metafields.custom.child`), show only the first N cards by default and
reveal the rest via an accordion, instead of dumping every subcategory into one
long grid. N is merchant-configurable, not hardcoded.

## Decisions

| Question | Decision |
|---|---|
| Trigger style | "Show more" text button below the grid, becomes "Show less" when open |
| Visible-count control | New `visible_count` range setting (2–12, step 2, default 6) — matches the existing pattern in `blocks/collection-children.liquid` |
| Reveal mechanism | Native `<details>`/`<summary>` — no JS |
| Label swap | CSS visibility toggle on `[open]`, driven by two theme text settings (no hardcoded copy) |
| No-op case | If total collections ≤ `visible_count`, no trigger renders at all |

### Why `<details>`/`<summary>`

The theme has no bundler and JS is one-file-per-concern; a native disclosure
element gets expand/collapse, keyboard operability, and screen-reader semantics
for free, with zero JS. Label text swap is done in CSS by showing/hiding two
spans based on the `[open]` attribute — same trick used for icon rotation.

## Architecture

### `sections/collections.liquid` changes

- `{%- liquid %}` block: after building `display_collections`, split into
  `visible_collections` (`| slice: 0, visible_count`) and everything after.
- Visible cards render exactly as today, inside the existing `#collections-grid`.
- If `display_collections.size > visible_count`, render a `<details>` block:
  - `<summary>` — the trigger. Contains two `<span>` labels
    (`show_more_label` / `show_less_label`) and a chevron icon via
    `{% render 'icon', name: 'chevron-down' %}`.
  - Inside `<details>`, a second grid (`.collections`, same column-count CSS
    custom properties as the main grid) renders the remaining cards via
    `{% render 'collection-card', collection: col_item %}` — identical call to
    the visible grid.
- Design-mode placeholder path (no `display_collections`) is unaffected — it
  always renders exactly 4 placeholder cards, under `visible_count` in every
  default configuration, so no trigger shows in that branch.

### New schema settings (on the section)

```json
{ "type": "range", "id": "visible_count", "min": 2, "max": 12, "step": 2, "label": "Antal synlige underkategorier", "default": 6 },
{ "type": "text", "id": "show_more_label", "label": "Tekst: vis flere", "default": "Vis flere kategorier" },
{ "type": "text", "id": "show_less_label", "label": "Tekst: vis færre", "default": "Vis færre" }
```

### CSS (`assets/input.css`)

New rules, no `!important`:

```css
details.collections-more summary::-webkit-details-marker { display: none; }
details.collections-more summary { list-style: none; cursor: pointer; }
details.collections-more .label-open { display: none; }
details.collections-more[open] .label-open { display: inline; }
details.collections-more[open] .label-closed { display: none; }
details.collections-more summary svg { transition: transform 0.2s ease; }
details.collections-more[open] summary svg { transform: rotate(180deg); }
```

Any recurring spacing/color values pull from existing tokens, not new literals.

## Testing / verification

No JS test runner in this repo. Verification is `shopify theme check` (schema
validity) plus manual check in the browser preview:

- Collection with > 6 children: first 6 show, "Vis flere kategorier" button
  appears, clicking reveals the rest and flips the label to "Vis færre".
- Collection with ≤ 6 children: no button renders, grid unchanged from current
  behavior.
- Design-mode placeholder (no metafield data): unaffected, still 4 placeholder
  cards, no button.

## Out of scope

- `blocks/collection-children.liquid` and `blocks/subcollections-grid.liquid` —
  not wired into any live template (grep confirms no JSON references them);
  left untouched.
