# Subcategory Grid: Per-Breakpoint Visible Count — Design

## Context

`sections/collections.liquid` renders a collection's subcategories (from
`collection.metafields.custom.child`) as a card grid, with the count beyond
a threshold hidden behind a "Vis flere kategorier" accordion (added
2026-08-13, see `docs/superpowers/plans/2026-08-13-subcategory-grid-accordion-plan.md`).

That first version has a single `visible_count` setting (range, step 2)
applied at every screen size. Feedback from trying it in the theme editor:

1. The range control should step by 1, not 2.
2. The visible count should be independently configurable per breakpoint —
   mobile/tablet/desktop — the same way `columns_mobile`/`columns_tablet`/
   `columns_desktop` already are in this section.

## Why this is an architecture change, not a tweak

The current implementation splits `display_collections` into a "visible"
Liquid list and a "remaining" Liquid list at render time, then puts the
remaining list inside a `<details>` element. Liquid renders once,
server-side, before the page has a viewport width — it cannot know whether
the visitor is on mobile or desktop. A per-breakpoint split is therefore
not expressible as a Liquid `slice`; it has to become a CSS-driven show/hide
that responds to the same media queries the column-count CSS already uses.

## Design

### Schema

Replace the single `visible_count` setting with three, mirroring the
existing `columns_mobile`/`columns_tablet`/`columns_desktop` settings
exactly in id naming and default:

- `visible_count_mobile` — range, min 2, max 12, **step 1**, default 6
- `visible_count_tablet` — range, min 2, max 12, step 1, default 6
- `visible_count_desktop` — range, min 2, max 12, step 1, default 6

`show_more_label` / `show_less_label` are unchanged.

### Liquid

`sections/collections.liquid` renders **all** matching subcategories in a
single `.collections` grid — the "visible" vs "remaining" Liquid split is
removed entirely. The `<details>` trigger renders once, after the grid,
whenever `total_count` exceeds the *smallest* of the three breakpoint
counts (i.e. there exists at least one breakpoint where something is
hidden). Per-breakpoint precision on whether the trigger itself should be
visible at the *current* breakpoint is a CSS concern (below) — Liquid's job
is only to decide whether the trigger needs to exist in the DOM at all.

### CSS: hiding cards beyond each breakpoint's count

A mobile-first `:nth-child` cascade, matching the existing column-count
media query structure (`768px`, `1024px` breakpoints):

```css
#collections-wrap-{{ id }} .collections > .collection-card:nth-child(n+{{ mobile_count | plus: 1 }}) {
  display: none;
}

@media screen and (min-width: 768px) {
  #collections-wrap-{{ id }} .collections > .collection-card:nth-child(n+{{ mobile_count | plus: 1 }}) {
    display: flex; /* undo the mobile hide */
  }
  #collections-wrap-{{ id }} .collections > .collection-card:nth-child(n+{{ tablet_count | plus: 1 }}) {
    display: none;
  }
}

@media screen and (min-width: 1024px) {
  #collections-wrap-{{ id }} .collections > .collection-card:nth-child(n+{{ tablet_count | plus: 1 }}) {
    display: flex; /* undo the tablet hide */
  }
  #collections-wrap-{{ id }} .collections > .collection-card:nth-child(n+{{ desktop_count | plus: 1 }}) {
    display: none;
  }
}
```

Within each media block the "undo" rule is written before the new "hide"
rule, so equal-specificity, same-block cascade order resolves them
correctly regardless of whether the count goes up or down between
breakpoints (e.g. desktop configured with *fewer* visible cards than
tablet still hides the right ones).

### CSS: revealing everything when the accordion is open

```css
#collections-wrap-{{ id }}:has(.collections-more[open]) .collections > .collection-card {
  display: flex;
}
```

`:has()` lets the trigger stay in its natural DOM position (after the grid,
as today) rather than requiring it to precede the grid for a `~` sibling
selector to work. The selector's specificity (id + `:has()` + class + class)
is higher than any of the per-breakpoint hide rules above, so it wins at
every breakpoint without `!important`.

### CSS: showing/hiding the trigger itself per breakpoint

The trigger should not appear at a breakpoint where it wouldn't reveal
anything (e.g. `total_count` is 5, mobile shows 6 — no need for a trigger
on mobile even if desktop's count is smaller and would need one). The
`{%- style -%}` block sets `display: none` by default and flips to `block`
inside each breakpoint's media query only when `total_count` exceeds that
breakpoint's own count — the same `{% if %}` pattern used for the
column-count values, just applied to a boolean instead of a number.

### Browser support note

`:has()` has broad modern support (Safari 15.4+, Chrome 105+, Firefox
121+, all released well over a year ago) and this project has no stated
older-browser floor, so no fallback is added.

## Testing

No JS test runner in this repo (`CLAUDE.md`). Verification is
`npx shopify theme check` plus manual checks in the theme editor /
storefront preview, covering:

- Each breakpoint independently hides/reveals the correct card count when
  its setting is changed (mobile ≠ tablet ≠ desktop, including a
  desktop-count-smaller-than-tablet-count case).
- The trigger appears/disappears correctly per breakpoint based on whether
  anything is actually hidden there.
- Opening the accordion reveals all cards at any breakpoint; closing hides
  according to that breakpoint's count again.
- A collection with fewer subcategories than every breakpoint's count: no
  trigger anywhere, identical to today's no-accordion-needed case.
