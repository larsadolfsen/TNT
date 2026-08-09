# Spec: image `loading` / `fetchpriority` values (Q2)

Date: 2026-08-09
Scope: the 8 external call sites of `{% render 'image', ... %}` listed in the
Wave 3.5 batch 3 plan (Task 1). This spec is the sole source of truth for
Task 2 (mechanical migration) — every value below is final, no judgment
calls left for the implementer.

## 0. Prerequisite: `snippets/image.liquid` needs a one-line change

**Finding: `fetchpriority` does NOT currently pass through `render 'image'`
calls, and `snippets/image.liquid` must be changed before any call site can
use it.**

What was verified:

- Shopify's `image_tag` filter is documented to accept arbitrary keyword
  arguments and emit any that match an HTML attribute name as a literal
  attribute on the rendered `<img>` (confirmed against
  https://shopify.dev/docs/api/liquid/filters/image_tag — the filter's
  "HTML attributes" behavior; `fetchpriority` is a standard `<img>`
  attribute name so it qualifies).
- BUT `snippets/image.liquid` does not pass every parameter it receives
  into the filter automatically — it explicitly names each forwarded
  keyword. The current filter call (lines 86–95) only forwards
  `class`, `style`, `alt`, `loading`, `widths`, `sizes`:

  ```liquid
  {{ image
    | image_url: width: width, height: height, crop: image_crop
    | image_tag:
        class: img_class,
        style: image_style,
        alt: alt,
        loading: loading,
        widths: widths,
        sizes: sizes
  }}
  ```

  There is no `fetchpriority` keyword in this list. A call site doing
  `{% render 'image', ..., fetchpriority: 'high' %}` today would have that
  value silently dropped — the `fetchpriority` variable exists in the
  snippet's local scope but is never read, so it never reaches
  `image_tag` and never appears in the output HTML.

**Required fix (do this first, before editing any call site):** add a
`fetchpriority` parameter to `snippets/image.liquid`, forwarded the exact
same way `loading` is:

1. Add a `@param` doc line (after the existing `loading` one, around line 25):
   ```
   @param {string} [fetchpriority] - The `fetchpriority` attribute value (e.g. 'high')
   ```
2. Add `fetchpriority: fetchpriority` to the `image_tag` filter call:
   ```liquid
   {{ image
     | image_url: width: width, height: height, crop: image_crop
     | image_tag:
         class: img_class,
         style: image_style,
         alt: alt,
         loading: loading,
         fetchpriority: fetchpriority,
         widths: widths,
         sizes: sizes
   }}
   ```

When `fetchpriority` is omitted by a call site, the variable is `nil` and
`image_tag` simply omits the attribute — matching how `loading` already
behaves when unset. This is a purely additive change; it does not alter
output for any of the many other internal `render 'image'` call sites not
covered by this spec.

Task 2 must make this change to `snippets/image.liquid` as its first step,
then proceed with the 8 call-site edits below.

## 1. Above-the-fold cutoff for grids

Three of the 8 call sites are card grids (product-collection grid, and two
sub-collection grids), but they do not all share the same mobile column
count, so they do not all share the same cutoff.

**`sections/collections.liquid` and `blocks/subcollections-grid.liquid`: N =
4 (first 2 rows at 2 mobile columns).** Both have their own `columns_mobile`
schema setting (default 2) driving a `{%- style -%}` block that sets
`grid-template-columns` for the card grid — theme-wide convention confirmed
in both files' schema and style blocks. At a 2-column mobile layout, a
typical phone viewport (~390–430px wide, ~650–750px visible height below a
sticky header/nav) shows roughly 1.5–2 full rows of square-ish cards before
the user scrolls. Cutting off after **2 rows (N = 4 cards)** is a
deliberately slightly-generous above-the-fold boundary: it guarantees every
card that's actually visible on first paint gets `eager`/`high` priority, at
the cost of at most one row of cards below the true fold also being
prioritized (an acceptable trade — better to over-prioritize by one row than
to leave a genuinely visible card lazy-loaded and slow to appear).

**`sections/collection.liquid`: N = 2 (first 2 rows at 1 mobile column) —
see §2.4 for the full justification.** This section has no `columns_mobile`
setting and no grid-specific CSS of its own; its `.collection-products`
class is styled by the single global rule in `assets/input.css:941–944`:

```css
.collection-products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
}
```

A `minmax(500px, 1fr)` floor means `auto-fill` cannot fit more than one
column on any viewport narrower than ~500px — which covers every mobile
phone. So this grid is genuinely **1 column** on mobile, not 2. Using the
other sites' N = 4 here would prioritize roughly double the cards actually
visible above the fold, directly undermining this task's LCP-optimization
goal. N = 2 (2 rows × 1 column) is the correct mobile-first-paint boundary
for this specific site.

## 2. Per-call-site values

### 2.1 `blocks/contact-map.liquid` (line 31)

```liquid
{% render 'image', image: block.settings.map_image, fill: true, width: 800, height: 600, crop: 'center', loading: 'lazy' %}
```

- `loading: 'lazy'`, no `fetchpriority`.
- Reasoning: this is a static fallback shown only when the merchant hasn't
  set an embed URL, inside a "Contact page supporting-content card" block.
  It's merchant-placed content whose position on the page is not fixed (it
  could be anywhere a theme editor drags the block), it's a single
  secondary image (not a hero), and the contact page is not a
  performance-critical landing route. Default lazy applies.

### 2.2 `blocks/subcollections-grid.liquid` (lines 46–52)

Liquid's `render` tag doesn't support inline ternaries as literal values
inside a `{% render %}` call, so express the condition with a `liquid` block
before the render, then pass plain variables:

```liquid
{% for col_item in display_collections %}
  {%- liquid
    if forloop.index <= 4
      assign card_loading = 'eager'
      assign card_fetchpriority = 'high'
    else
      assign card_loading = 'lazy'
      assign card_fetchpriority = nil
    endif
  -%}
  ...
  {% render 'image',
    class: 'collection-card__image',
    image: col_item.featured_image,
    width: 600,
    height: 600,
    crop: 'center',
    loading: card_loading,
    fetchpriority: card_fetchpriority
  %}
```

- First 4 cards (`forloop.index <= 4`): `loading: 'eager'`,
  `fetchpriority: 'high'`.
- Remaining cards: `loading: 'lazy'`, no `fetchpriority`.
- Reasoning: sub-collection grid, `columns_mobile` default 2 → N = 4 per
  §1. Applies to both the design-mode/live loop over `display_collections`.
  The `request.design_mode` placeholder loop (lines 69–80) renders
  `placeholder_svg_tag`, not `render 'image'` — not in scope.

### 2.3 `sections/cart.liquid` (line 20)

```liquid
{% render 'image', image: item.image, url: item.url, loading: 'lazy' %}
```

- `loading: 'lazy'`, no `fetchpriority`.
- Reasoning: cart line-item thumbnails. The cart page is reached by
  deliberate navigation (never a cold-load landing page for organic/ad
  traffic), thumbnails are small and numerous (one per line item, unbounded
  count), and none of them are the page's LCP candidate (the cart summary
  table and checkout button dominate initial viewport interest). Explicitly
  called out in the plan as staying lazy.

### 2.4 `sections/collection.liquid` (lines 15–22)

```liquid
<div class="collection-products">
  {% paginate collection.products by 20 %}
    {% for product in collection.products %}
      {%- liquid
        if forloop.index <= 2
          assign card_loading = 'eager'
          assign card_fetchpriority = 'high'
        else
          assign card_loading = 'lazy'
          assign card_fetchpriority = nil
        endif
      -%}
      <div class="collection-product">
        {% if product.featured_image %}
          {% render 'image',
            class: 'collection-product__image',
            image: product.featured_image,
            url: product.url,
            width: 400,
            height: 400,
            crop: 'center',
            loading: card_loading,
            fetchpriority: card_fetchpriority
          %}
        {% endif %}
        <div class="collection-product__content">
          <p>{{ product.title | escape | link_to: product.url }}</p>
          <p>{{ product.price | money }}</p>
        </div>
      </div>
    {% endfor %}

    {{ paginate | default_pagination }}
  {% endpaginate %}
</div>
```

- First 2 products (`forloop.index <= 2`): `loading: 'eager'`,
  `fetchpriority: 'high'`.
- Remaining products: `loading: 'lazy'`, no `fetchpriority`.
- Reasoning: this section has **no** `columns_mobile` setting and no
  grid-specific CSS of its own — unlike `sections/collections.liquid` and
  `blocks/subcollections-grid.liquid`, which each define their own
  `columns_mobile` schema setting (default 2) driving a `{%- style -%}`
  block. `sections/collection.liquid`'s `.collection-products` class is
  styled only by the global rule at `assets/input.css:941–944`:
  `display: grid; grid-template-columns: repeat(auto-fill, minmax(500px,
  1fr));`. A 500px `minmax` floor collapses `auto-fill` to a single column
  on any mobile viewport (~390–430px wide), so this grid is genuinely
  1 column, not 2. Using this file's own N = 2 (2 rows × 1 column) keeps the
  above-the-fold prioritization accurate for its actual mobile layout,
  instead of over-prioritizing roughly double the visible cards.

### 2.5 `sections/collections.liquid` (lines 39–45)

```liquid
{% for col_item in display_collections %}
  {%- liquid
    if forloop.index <= 4
      assign card_loading = 'eager'
      assign card_fetchpriority = 'high'
    else
      assign card_loading = 'lazy'
      assign card_fetchpriority = nil
    endif
  -%}
  ...
  {% render 'image',
    class: 'collection-card__image',
    image: col_item.featured_image,
    width: 600,
    height: 600,
    crop: 'center',
    loading: card_loading,
    fetchpriority: card_fetchpriority
  %}
```

- First 4 cards (`forloop.index <= 4`): `loading: 'eager'`,
  `fetchpriority: 'high'`.
- Remaining cards: `loading: 'lazy'`, no `fetchpriority`.
- Reasoning: identical shape and identical `columns_mobile: 2` default to
  §2.2 (this is the section version of the same sub-collections grid
  pattern); N = 4 per §1. The `request.design_mode` placeholder loop again
  uses `placeholder_svg_tag`, not `render 'image'` — not in scope.

### 2.6 `sections/product.liquid` (line 10) — PDP hero image

As with §2.2, `render` doesn't accept inline ternaries as arguments, so
express the condition via a `liquid` block:

```liquid
<div class="product-images">
  {% for image in product.images %}
    {%- liquid
      if forloop.first
        assign img_loading = 'eager'
        assign img_fetchpriority = 'high'
      else
        assign img_loading = 'lazy'
        assign img_fetchpriority = nil
      endif
    -%}
    {% render 'image', class: 'product-image', image: image, loading: img_loading, fetchpriority: img_fetchpriority %}
  {% endfor %}
</div>
```

- Only the first image in the loop (`forloop.first`, i.e. `product.images`
  index 0 — the product's primary/featured image): `loading: 'eager'`,
  `fetchpriority: 'high'`.
- Every other image in `product.images` (`forloop.first` false):
  `loading: 'lazy'`, no `fetchpriority`.
- Reasoning: the plan explicitly names `sections/product.liquid:10` as the
  PDP hero image case. Line 10 sits inside a `for image in product.images`
  loop that renders every product image, not just the featured one — the
  condition must be `forloop.first`, not an unconditional eager/high on the
  whole loop, otherwise every gallery image (including ones far below the
  fold) would be marked high-priority, which defeats the purpose and would
  hurt LCP by contending bandwidth with the actual hero image.

### 2.7 `snippets/product-card-image.liquid` (lines 21–30)

```liquid
{%- render 'image',
  image: product.featured_image,
  fill: true,
  img_class: img_classes,
  width: 480,
  widths: '180, 360, 480, 720',
  sizes: '(max-width: 640px) 180px, 320px',
  alt: product.title,
  loading: 'lazy'
-%}
```

- **No change from current value**: `loading: 'lazy'`, no `fetchpriority`.
  Leave the existing `loading: 'lazy'` argument exactly as-is; do not add a
  `fetchpriority` argument.
- Reasoning: this snippet is called from `snippets/product-card.liquid`
  (line 63) as `{%- render 'product-card-image', product: product,
  is_minimal: is_minimal, badge: badge -%}` — no loop index or
  above-the-fold signal is passed in from any of its callers. `product-card`
  itself is reused across many different contexts theme-wide (search
  results grid, collection grids, homepage featured-collection sections,
  related products, etc.) with no consistent "first N" plumbing. Adding
  positional awareness here would require threading a `forloop.index` (or
  equivalent) parameter through `product-card.liquid` and every one of its
  callers — that is a larger, separate change out of scope for this
  call-site-only migration (it touches files beyond the 8 listed, and
  beyond `product-card.liquid` itself which isn't one of the 8). Keeping
  this site uniformly lazy is the safe, conservative choice: it matches
  current behavior exactly, so this migration introduces zero risk of
  over-prioritizing images that are actually below the fold in most of this
  snippet's call contexts.

### 2.8 `snippets/search-result-row.liquid` (lines 28–35)

```liquid
{%- render 'image',
  image: result_image,
  fill: true,
  img_class: 'group-hover:scale-105 transition-transform duration-500',
  width: 128,
  alt: result.title,
  loading: 'lazy'
-%}
```

- **No change from current value**: `loading: 'lazy'`, no `fetchpriority`.
  Leave the existing `loading: 'lazy'` argument exactly as-is; do not add a
  `fetchpriority` argument.
- Reasoning: called from `sections/search.liquid` (line 91) inside a
  `for result in search.results` loop with no index-based branching passed
  to the snippet. These rows render only for non-product results (articles
  and pages) and are always laid out *after* the product-card grid on the
  search results page (`has_other` block, `mt-8` margin-top when products
  are also present — see `sections/search.liquid` lines 77–95), so they are
  never the first/above-the-fold content on the page even when they do
  happen to render within the initial viewport for a query with no product
  matches. Small 64×64px thumbnails, secondary to the page's title/query
  content. Default lazy applies, consistent with current behavior.

## 3. Summary table

| Call site | File:line | `loading` | `fetchpriority` | Condition |
|---|---|---|---|---|
| Contact map fallback | `blocks/contact-map.liquid:31` | `'lazy'` | none | always |
| Sub-collections grid (block) | `blocks/subcollections-grid.liquid:46-52` | `'eager'` / `'lazy'` | `'high'` / none | `forloop.index <= 4` |
| Cart line-item image | `sections/cart.liquid:20` | `'lazy'` | none | always |
| Collection product grid | `sections/collection.liquid:15-22` | `'eager'` / `'lazy'` | `'high'` / none | `forloop.index <= 2` |
| Collections (sub-collections) grid (section) | `sections/collections.liquid:39-45` | `'eager'` / `'lazy'` | `'high'` / none | `forloop.index <= 4` |
| PDP product image loop | `sections/product.liquid:10` | `'eager'` / `'lazy'` | `'high'` / none | `forloop.first` |
| Product card image | `snippets/product-card-image.liquid:21-30` | `'lazy'` | none | always (unchanged) |
| Search result row thumbnail | `snippets/search-result-row.liquid:28-35` | `'lazy'` | none | always (unchanged) |

## 4. Verification (for Task 2's test plan)

- After the `snippets/image.liquid` change (§0), any call site passing
  `fetchpriority: 'high'` must render `fetchpriority="high"` as a literal
  attribute on the `<img>` tag. Any call site passing `nil`/omitting the
  argument must render no `fetchpriority` attribute at all (same behavior
  as `loading` today when unset).
- `theme-check` must remain clean after both the snippet change and the 8
  call-site edits.
