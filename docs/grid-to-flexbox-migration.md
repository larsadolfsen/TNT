# Grid → Flexbox migration scoping

Status: backlog, part of the broader site-optimization pass. One input into
the wider plan, not the whole scope — captured here as its own doc because
the product-page case has a genuine structural tradeoff that needs a human
decision before any code changes.

## Current state

The product page isn't a single hand-written layout — it's composed by a
generic page-builder system:

- `sections/section.liquid` wraps every block/section in a shared
  `.grid-layout` container and positions it with per-breakpoint
  `grid-column-start` / `grid-column-end: span N` / `order`, all driven by
  theme-editor settings (`column_start_*`, `column_span_*`, `order_*`).
  Confirmed at `sections/section.liquid:122-174`.
- `templates/product.json` uses this to lay out the real page: on desktop
  (3-column grid), the Product Media section spans columns 1–2 (2/3 width)
  and a sidebar section (Title, Trust, Price, Urgency, Buy Buttons) spans
  column 3 (1/3 width), positioned side-by-side via explicit `column_start`.
- On mobile, Title + Trust need to appear above the media gallery. Because
  grid placement alone can't reorder content across sections, this is
  currently done by duplicating the Title + Trust block into a second
  section (`section_ndBcy7`) that's hidden on tablet/desktop
  (`hide_on_tablet: true`, `hide_on_desktop: true` — confirmed in
  `templates/product.json`) — i.e. there are two copies of the same content
  today, kept in sync manually.

## Why flex isn't a clean 1:1 swap here

This specific pattern — one tall block (media) with several shorter blocks
stacked in a column beside it, but those same shorter blocks needing to
appear *above* the tall block on mobile — is a structural flexbox
limitation, not a syntax gap. `flex-wrap` doesn't preserve column position
across wrapped lines (each wrapped line restarts at the container's edge),
so a single flat flex container can't produce "tall media on the left,
stacked items on the right" while also freely reordering individual stacked
items before/after the media on mobile.

## Options identified

1. **Nest into two flex containers** (gallery wrapper + sidebar wrapper).
   Removes the duplicate-content hack — genuinely simpler backend — but
   changes mobile behavior: Title/Trust would move to *after* the gallery in
   the DOM-driven mobile stack instead of before it, unless they live as a
   third sibling, which reintroduces the same problem this option was meant
   to solve.
2. **Keep CSS Grid for this one component** and spend the flex migration
   budget on parts that genuinely simplify: plain N-column product/collection
   listing grids (safe, low-risk swap to `flex-wrap` + `flex-basis`),
   testimonial grids, and the generic per-block `order` reordering (maps 1:1
   to flex `order`, no loss).

## Other grid usage surveyed (for the wider migration, not just this page)

- `assets/input.css` — product/collection listing grids, the `.grid-layout`
  12/8/4-col span system, and two `repeat(auto-fill, minmax(...))`
  responsive grids with no flex equivalent (confirmed: `minmax(500px, 1fr)`
  and `minmax(200px, 1fr)`, `assets/input.css:921,1023`).
- `blocks/collection-grid.liquid`
- `blocks/collections-grid.liquid`
- `blocks/product-materials.liquid`
- `blocks/product-testimonial.liquid`

## Open decision

For the product page: is it acceptable for Title/Trust to shift to just
after the media gallery on mobile (in exchange for removing the
duplicate-block hack and simplifying the backend), or does the current
mobile ordering need to stay pixel-identical (in which case this component
stays on Grid, and only the rest of the theme migrates to Flex)?
