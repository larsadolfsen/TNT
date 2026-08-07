# R2 — card markup consolidation (design)

Wave 3 task 10. Companion to `docs/wave3-batch.md`. Written 2026-08-07 at
v1.0.110 (`a4f148e`).

## Why this spec restates the task

The Wave 3 plan describes R2 as "consolidate card markup onto
`product-card.liquid`" across six surfaces. That premise is stale — most of it
already happened in earlier waves. Measured at v1.0.110:

**Already rendering `{% render 'product-card' %}`**

- `blocks/collection-products-grid.liquid:51` (collection grid)
- `snippets/collection-product-grid.liquid:14`
- `blocks/product-recommendations.liquid:56` (related products)
- `blocks/product-cross-sell.liquid:21,59` (complementary products)

**Two named surfaces do not exist**

- Homepage featured collection — `templates/index.json` contains only
  `hello-world` and `collections`.
- Cart recommendations — `sections/cart.liquid` has no recommendations block;
  its product markup is cart *line items*, a different component.

**Deliberately excluded**

`snippets/predictive-search-product.liquid` is a result *row*, not a card, and
it is a `<template>` hydrated from `/search/suggest.json` by
`assets/predictive-search.js`. A single result cannot be re-rendered through
Liquid per keystroke, so it cannot use `product-card` and must not be folded
into it. Its own doc comment already records this.

So R2's real content is different from its description, and this spec defines
what it actually is.

## What R2 actually covers

Three things, in priority order:

1. **Decompose `snippets/product-card.liquid`.** At 196 lines it bundles five
   inline sub-components. The project file-structure rule ("each subfeature
   gets its own file"; "any recognizable UI element is its own component")
   says these are components, not markup.
2. **Remove the two genuine duplications** that remain: the hardcoded mock
   cards in `blocks/product-cross-sell.liquid`, and the savings badge shared
   between `product-card` and `blocks/product-price.liquid`.
3. **Give `sections/search.liquid` product results a card.** Not strictly
   consolidation — the page is currently unstyled — but it is the last surface
   that renders product markup by hand.

## Pre-existing bug found while scoping (fixed by R2e)

`snippets/product-card.liquid:185` styles the card's buy button
`bg-accent ... text-primary`. From `config/settings_data.json`:

| token | light | dark |
|---|---|---|
| `accent_color` | `#ffd814` | `#ffd814` |
| `primary_color` | `#0e1a28` | `#ffffff` |
| `accent_foreground_color` | `#0e1a28` | `#0e1a28` |

In dark mode that renders `#ffffff` on `#ffd814` — roughly 1.4:1, against the
4.5:1 WCAG AA floor for normal text. Every "Køb" button on every product card
is affected. In light mode `primary` and `accent_foreground` happen to hold
the same value, which is why it was never visible during development.

`snippets/button.liquid:27` already gets this right with `text-on-accent`
(`#0e1a28` on `#ffd814`, ~12.6:1). R2e fixes the card by adopting that
snippet. This is pre-existing, not introduced by Wave 3.

## Target structure

`snippets/product-card.liquid` drops from 196 to roughly 75 lines: the setup
`{% liquid %}` block (badge-from-tags, variant, price, unit-price rule,
rating), the card wrapper, the title `<h3>`, and five renders.

### New snippets

| File | Params | Purpose | Other callers |
|---|---|---|---|
| `snippets/savings-badge.liquid` | `savings` (int), `size` (`sm`\|`lg`) | The percentage-off badge | `blocks/product-price.liquid` |
| `snippets/star-rating.liquid` | `rating`, `reviews_count`, `star_size` (default 14), `wrapper_class` | Half-star-capable 5-star row | — |
| `snippets/product-card-image.liquid` | `product`, `is_minimal` | Image zone, placeholder, tag badge | — |
| `snippets/product-card-price.liquid` | `product`, `variant`, `price`, `original_price`, `has_unit_price`, `unit_suffix`, `is_minimal` | Headline / unit / compare-at price | — |

`star-rating.liquid` takes `wrapper_class` rather than `is_minimal` because the
only thing `is_minimal` controlled in the original rating block was the
container's text-size classes (`text-[10px]` vs `text-xs sm:text-sm`). Passing
the classes keeps the snippet free of card-layout knowledge.

R2g adds a fifth new snippet, `snippets/search-result-row.liquid`, described
under "R2g detail" below. It is listed separately because it belongs to the
search page, not to the card decomposition.

The title `<h3>` stays in `product-card.liquid`. It is four lines whose only
variation is two Tailwind class sets; extracting it would fragment without
producing a component anything else could use. Recorded as a decision, not an
oversight.

### Changed snippet

`snippets/button.liquid` gains a `size` param, `md` (default, current
behaviour: `h-12 px-6 text-base`) or `sm` (`py-2 px-3 text-xs sm:text-sm`, no
fixed height). No existing caller passes `size`, so all keep today's output.

The card's two button-specific attributes survive through the existing
`attributes` param, which `button.liquid` appends verbatim: the
`onclick="window.addToCart('…')"` handler and the
`aria-label="Køb {{ product.title | escape }}"`. Both must be built with
`capture` before the render — a filter inside a `{% render %}` argument is a
hard constraint violation in this repo.

### Naming

`savings-badge` and `star-rating` are generic — they are not card-specific and
other surfaces may want them. `product-card-*` follows the established prefix
convention (`product-media-*`, `product-buy-*`, `breadcrumbs-*`, `header-*`).

## Deliberate output-preservation rules

**Savings-badge label.** The two call sites use different text today:
`product-card` uses `settings.savings_badge_text` (`"[savings] % rabat"`),
`product-price` hardcodes `"Spar {{ savings }}%"`. The snippet derives the
label from `size` so both keep byte-identical output. Unifying the label is a
content decision, out of scope here, and is recorded in the backlog below.

**Savings-badge styling.** `sm` = `bg-[#c8102e] text-white text-[11px]
font-semibold px-2 py-0.5 rounded-md uppercase`. `lg` = `text-[#c8102e]
text-2xl font-bold leading-none`. Both preserved exactly.

**Hex literals.** Centralising these snippets collapses `#c8102e` from three
sites to one and `#FFB800` from three to one. Converting them to CSS tokens is
R6's job, not R2's — but R2 makes R6 a one-line change instead of a sweep.

## Task breakdown

Seven tasks. Each is independently committable, ends in its own commit, and
bumps the patch in **both** `package.json` and `config/settings_schema.json`.

| # | Task | Files | Visual change |
|---|---|---|---|
| R2a | `savings-badge.liquid`; point both callers at it | `snippets/savings-badge.liquid` (new), `snippets/product-card.liquid`, `blocks/product-price.liquid` | none |
| R2b | `star-rating.liquid`; point `product-card` at it | `snippets/star-rating.liquid` (new), `snippets/product-card.liquid` | none |
| R2c | `product-card-image.liquid` | `snippets/product-card-image.liquid` (new), `snippets/product-card.liquid` | none |
| R2d | `product-card-price.liquid` | `snippets/product-card-price.liquid` (new), `snippets/product-card.liquid` | none |
| R2e | Card buy button → `button.liquid` + new `size: 'sm'` | `snippets/button.liquid`, `snippets/product-card.liquid` | **yes — dark-mode button text colour** |
| R2f | Delete the two mock cross-sell cards | `blocks/product-cross-sell.liquid` | none in practice (see below) |
| R2g | Search results: products → `product-card` grid, articles/pages → row snippet | `sections/search.liquid`, `snippets/search-result-row.liquid` (new) | **yes — page is currently unstyled** |

R2a–R2d are order-independent but all touch `product-card.liquid`, so they run
sequentially to avoid conflicts. R2e depends on nothing. R2f and R2g are
independent of everything.

### R2f detail

`blocks/product-cross-sell.liquid:22-54` and `60-92` are `{% else %}` branches
rendering hardcoded placeholder cards: invented Danish product names
("Dugholdere i stål", "Opbevaringspose"), invented prices (`49,00 kr.`,
`89`), `lh3.googleusercontent.com` image URLs, a static five-filled-star row,
and `btn-cross-sell` buttons. Those buttons have **no event listener anywhere
in the theme** — grep finds the two `<button>` tags and nothing else, so they
are inert even when rendered. Both live templates
(`templates/product.standard.json:681`, `templates/product.Metervare.json:702`)
populate `cross_sell_1` and `cross_sell_2`, so the branches do not render
today. They are deleted; an unset slot renders nothing.

### R2g detail

`sections/search.liquid:41-56` renders every result — product, article or page
— through `search-result` / `search-result__image` / `search-result__content`.
None of those three classes has a CSS rule anywhere in `assets/input.css` or
`assets/output.css`; only the `.search-results` wrapper and its pagination are
styled. The page therefore renders as unstyled stacked items today.

After R2g: products render as `product-card` in a responsive grid matching the
collection page; articles and pages render through a new
`snippets/search-result-row.liquid` (thumbnail, title link, type label). The
`{% paginate %}` wrapper and `default_pagination` output are unchanged.

## Verification, and what it cannot prove

There is no Liquid test suite in this theme, and the storefront is
password-protected and unreachable (see "Blocked" in `docs/wave3-batch.md`).
This spec does not pretend otherwise.

**Per task, what will actually run:**

1. `npx shopify theme check` — must hold at exactly **9 errors / 28 warnings**,
   the v1.0.109 baseline. Measure before and after; diff the runs, do not
   compare against a number quoted in a doc.
2. A line-by-line diff of extracted markup against the original, recorded in
   the commit message — the technique task 9 used. Every non-blank source line
   of the original must be accounted for in the new files, with differences
   limited to comments and render-call scaffolding.
3. Global constraint check: no filter inside a `{% render %}` argument
   (precompute with `assign`/`capture`); no `!important`; header comment on
   every new file.

**What this does not establish.** None of the above renders a page. It is a
code-identity argument for R2a–R2d and R2f, and no argument at all for R2e and
R2g, which change appearance deliberately. Those need a browser.

**Deferred browser checklist** (append to `docs/wave3-batch.md` alongside the
blocked tasks 5–9):

- R2a–R2d: collection grid, related products, complementary products at mobile
  and desktop, light and dark. Card must be pixel-identical to v1.0.110.
- R2e: the "Køb" button on a product card in **dark mode** — text must be dark
  navy on yellow and clearly readable. Confirm light mode is unchanged.
- R2f: a product page's complementary-products row still shows both cards.
- R2g: search for a term matching products, articles and pages; confirm the
  product grid matches the collection page and the article/page rows are
  styled and navigate.

## Out of scope, recorded for the backlog

- **`blocks/product-price.liquid`'s JS duplication.** Its inline script
  (`:243-259`, `:266+`) rebuilds the whole price container's `innerHTML` as
  template strings on variant change, so the entire on-sale and not-on-sale
  price markup exists twice in that file. R2a fixes only the Liquid half; the
  JS copy of the savings badge remains. Restructuring the script to update text
  nodes instead of rebuilding markup is a product-page behaviour change and
  needs its own task and its own browser verification.
- **Savings-badge label divergence** — `"[savings] % rabat"` on cards vs
  `"Spar X%"` on the product page. A content decision for the merchant.
- **`#c8102e` / `#FFB800` → CSS tokens.** R6.
