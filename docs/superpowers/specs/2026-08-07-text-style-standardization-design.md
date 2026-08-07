# Text style standardization — design

## Problem

Text styling across the theme is expressed as long, repeated strings of Tailwind
utility classes (e.g. `text-5xl font-black tracking-tight text-primary
whitespace-nowrap flex items-start select-all`). An audit of every
`text-{size} font-{weight}` combination in `*.liquid` files found 42 distinct
combinations across ~9 visual roles (headings, prices, labels, pills, body
copy, captions, buttons, nav links), most of which turned out to be
accidental drift rather than intentional variation — e.g. six different
combos all rendering as the same "uppercase tracked label," or a page's `<h1>`
using a lighter weight than every other heading of its rank.

## Approach

CSS classes are the source of truth; a thin Liquid snippet is a convenience
wrapper for the common case of "render this text with this style." This
matches how typography is already partially handled in this codebase
(`assets/input.css:131-163` has an unused `.h1`–`.h6` precedent) and how
design tokens are already layered: raw values in `snippets/css-variables.liquid`,
exposed to Tailwind via the `@theme` block in `assets/input.css`.

Two consumption paths, both backed by the same CSS classes:

1. **Liquid snippet** (`snippets/text.liquid`) — for plain, non-interactive
   text nodes: headings, body copy, prices, captions, pills.
   ```liquid
   {% render 'text', style: 'heading-s', text: section.settings.heading %}
   ```
2. **Direct CSS class** — for interactive elements (links, buttons) that
   already carry their own tag/attributes, and for complex nested markup
   (e.g. a price with a superscript cents span) where wrapping in a generic
   snippet would fight the existing structure. Apply `.text-{style}` directly.

This keeps the snippet simple (no block/slot support needed — Shopify Liquid
`render` doesn't have slots) while keeping every call site, snippet or
direct-class, styled from one definition.

## The catalog — 11 styles + 2 modifiers

All weights are folded to a single non-body weight (600 semibold) to cut the
number of font files loaded; body/caption stay at 400, with a `strong`
modifier available on the two body styles for the rare case that needs
emphasis inline. Opacity-based text color (`text-primary/60`, `/70`, `/85`)
is replaced by two explicit CSS variables — no more transparency math.

| Style | Values | Default tag | Notes |
|---|---|---|---|
| `heading-l` | 44px · 600 · tracking -0.02em · serif | `div` | hero display text (banners, section headers) — rarely the document's actual `<h1>`, so it defaults to a non-heading tag and call sites override with `tag:` when it genuinely is one |
| `heading` | 26px · 600 · serif | `h1` | page-level headings |
| `heading-s` | 18px · 600 · serif | `h2` | panel/card/drawer/section titles — merges the old separate 18px and 16px tiers |
| `label` | 12px · 600 · uppercase · no letter-spacing | `span` | eyebrow text, form labels, **and button text** |
| `pill-text` | 12px · 600 | `span` | filter/status pill & chip text |
| `price-l` | 44px · 600 · tracking -0.02em · sans | `span` | PDP hero price only |
| `price` | 18px → 14px responsive · 600 · sans | `span` | every other price display |
| `body` | 14px · 400 (`strong` → 600) · `var(--color-text)` | `p` | default paragraph/description copy |
| `body-l` | 16px · 400 (`strong` → 600) · `var(--color-text)` | `p` | larger reading copy (long-form RTE blocks) |
| `caption` | 12px · 400 · `var(--color-text-muted)` | `span` | meta/timestamp/micro text |
| `nav-link` | 14px · 600 | *(CSS class only — see below)* | navigation links |

**`nav-link` and `label`-as-button-text are CSS-class-only**, not consumed via
the snippet: both apply to elements (`<a>`, `<button>`) that already carry
their own href/type/attributes, so wrapping them in the generic text snippet
would add indirection without benefit. Call sites add `class="text-nav-link"`
or `class="text-label"` directly.

### New CSS variables

`snippets/css-variables.liquid` needs one new token, following the existing
light/dark pattern next to `--color-text`:

```
--color-text-muted: #8a8a8a; /* light */
--color-text-muted: <dark equivalent>; /* .dark override */
```

`--color-text` (`#595959`) already exists and is reused as-is for `body`/`body-l`.

## Snippet interface

`snippets/text.liquid`:

| Param | Required | Default | Purpose |
|---|---|---|---|
| `style` | yes | — | one of the 11 catalog names above |
| `text` | yes | — | the text content (HTML-escaped by Liquid as usual) |
| `tag` | no | per-style default (table above) | override the wrapping element, e.g. `h3` instead of `h2` for a `heading-s` used deeper in the document outline |
| `strong` | no | `false` | only meaningful for `body`/`body-l`; applies the 600-weight modifier |
| `class` | no | — | passthrough for layout-only utilities that aren't part of the text style (e.g. `whitespace-nowrap`, `flex items-start`) |

Implementation renders `<{{ tag }} class="text-{{ style }}{% if strong %}
text-strong{% endif %} {{ class }}">{{ text }}</{{ tag }}>`.

## CSS classes (implementation target: `assets/input.css`)

A new "Text styles" section replaces the current unused `.h1`–`.h6` block
with the 11 classes above (`.text-heading-l`, `.text-heading`,
`.text-heading-s`, `.text-label`, `.text-pill-text`, `.text-price-l`,
`.text-price`, `.text-body`, `.text-body-l`, `.text-caption`,
`.text-nav-link`) plus one modifier class `.text-strong` (font-weight: 600,
combinable with `.text-body`/`.text-body-l`).

## Migration

All 42 audited combinations map onto the 11 styles (full mapping was reviewed
interactively; see the summary below). Two pre-existing inconsistencies get
fixed as a side effect of the migration rather than preserved:

- `page-title.liquid:12` — the page's actual `<h1>` used a lighter weight
  (`font-semibold`) than every comparable heading; now uses `heading` like
  its peers.
- Button text — previously split across three inconsistent
  weight/size combos (`text-sm font-bold`, `text-sm font-semibold`,
  `text-base font-bold`); now uses `label` uniformly.

**One case needs a manual (non-mechanical) fix during migration:**
`cart.liquid:39,68,103,105` uses the same class string
(`text-sm sm:text-base font-semibold`) for both the cart line-item title and
its price on the same row. These are two different roles (`body`/`nav-link`-ish
for the title, `price` for the number) that happen to share a class today —
migrating this file requires splitting the two elements onto their correct
styles individually rather than a mechanical find-and-replace.

Every other file is a mechanical swap: replace the old utility-class string
with either `{% render 'text', style: '...', ... %}` or a direct
`class="text-{style}"`, per the table below (role group → new style):

| Old role group | New style |
|---|---|
| Eyebrow/uppercase label, form labels | `label` |
| Filter/status pills | `pill-text` |
| Panel/card/drawer titles (was `text-lg font-bold` etc.) | `heading-s` |
| Nested sub-headings (was `text-base font-bold` etc.) | `heading-s` |
| Page/hero `<h1>`s | `heading` |
| PDP hero price | `price-l` |
| All other prices | `price` |
| Body/description copy | `body` or `body-l` (see size note below) |
| Meta/caption/micro text | `caption` |
| Buttons | `label` |
| Top nav, dropdown links, drawer links | `nav-link` |
| Dropdown column headers | `label` |

`body` vs `body-l`: call sites currently at `text-base` (16px) — e.g.
`accordion.liquid:14`, `product-banner-text.liquid:40` — become `body-l`,
which is unchanged from their current size. Call sites currently at
`text-sm` (14px) become `body`.

## Testing / verification

This is a CSS/markup change with no business logic, so there's no meaningful
unit-test surface. Verification is:

1. **Automated regression guard**: a grep-based check (run manually before
   declaring migration complete, and something we can wire into CI later)
   that fails if any of the 42 removed class combinations reappear in
   `*.liquid` files — prevents the old inconsistent patterns from creeping
   back in.
2. **Shopify theme-check** passes (existing tooling, catches broken Liquid
   syntax from the snippet/class swap).
3. **Manual visual QA** in the browser, before/after, on the pages that
   exercise the most style variety: homepage, PDP (both with and without
   unit pricing / sale price), cart, a collection page with filters, account
   panel, and search. This is the one layer that can't be automated for a
   theme like this — explicitly calling it out per the "untested layer must
   be named" rule, kept as thin as possible since all the actual logic here
   is static CSS values, not runtime behavior.

## Out of scope

- Dark-mode color values for `--color-text-muted` are a placeholder (#8a8a8a)
  pending an exact value from whoever owns the dark-mode palette — flagged
  as a follow-up, not blocking the rest of the migration.
- Editing `snippets/button.liquid` and `snippets/input.liquid` to consume
  `text-label`/`text-nav-link` internally is part of this migration; adding
  new button/nav variants is not.
