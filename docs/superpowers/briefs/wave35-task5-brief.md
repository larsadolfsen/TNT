# Task 5 (batch 2) — Q1: remove hardcoded googleusercontent fallback images

Two snippets fall back to a hardcoded `https://lh3.googleusercontent.com/aida-public/...`
prototype-mockup URL when a product has no media. Third-party, uncontrolled,
must not ship.

## File 1 — `snippets/product-media-hidden-image.liquid`

The `{%- else -%}` branch (line 16-17) renders the Google URL. Per the
snippet's own doc, the element exists only so third-party cart apps can read
a product image from the DOM — with no product media there is nothing to
mirror. **Delete the else branch entirely** (keep the `{%- if featured_image -%}`
guard and its img). Update the `@param` doc line ("falls back to a
placeholder when blank" → "omitted when blank").

Then check `assets/product-media.js` for `main-product-img` usage: if it does
`getElementById('main-product-img')` without a null guard on any code path
that can run when the element is absent, add the null guard. Report what you
found either way.

## File 2 — `snippets/product-media-gallery-track.liquid`

The `{%- else -%}` branch (lines 60-71) renders a visible `<img>` with the
Google URL and a hardcoded Danish alt ("Klar voksdug"). Replace the whole
`<img ...>` element with Shopify's native placeholder:

```liquid
{{ 'product-apparel-1' | placeholder_svg_tag: 'w-full h-full object-cover select-none text-secondary' }}
```

Keep the wrapping `<div class="w-full h-full flex-shrink-0">`. The svg
inherits `currentColor`; `text-secondary` gives it a token-driven tint. Do
not keep width/height/draggable — placeholder_svg_tag emits an svg, not an
img.

## Verification

- `grep -rn "googleusercontent" --include=*.liquid .` returns nothing.
- `theme-check` (npx or shopify CLI if available; otherwise state it was
  unavailable) error count no worse than before your change — record
  before/after counts.
- Render check is deferred to the controller (live store); state that in the
  report.

## Constraints

- Files: the two snippets, `assets/product-media.js` (null guard only, if
  needed), `package.json` (version bump one patch).
- Commit when done (do NOT push).
