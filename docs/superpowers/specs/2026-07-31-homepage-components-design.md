# Homepage component build-out — design

Date: 2026-07-31

## Goal

Reference site [textilogvoksdug.dk](https://textilogvoksdug.dk/) defines the target design. This spec covers the components needed to build a complete, mobile-first, Baymard-aligned homepage that matches it. The homepage template (`templates/index.json`) currently only has a placeholder `hello-world` section.

Category-listing and product-detail pages are explicitly **out of scope** — audited against the same reference and found already functionally aligned (existing facets/filters, sticky mobile buy bar, variant customizer, etc.).

## Reference pages audited

- https://textilogvoksdug.dk/ (homepage)
- https://textilogvoksdug.dk/produkt-kategori/voksdug/gennemsigtig-voksdug/ (collection listing)
- https://textilogvoksdug.dk/vask-og-pleje/ (static content page)
- https://textilogvoksdug.dk/shop/voksdug/voksdug-efter-bredde/voksdug-140-cm/klar-voksdug-020/ (product detail)

## Existing components reused as-is

- Header — `sections/header-2.liquid` + header blocks (logo, nav, cart, hamburger, search)
- Footer — `sections/footer.liquid`
- Breadcrumbs — `sections/breadcrumbs.liquid`
- Collection grid + facets/sort (mobile drawer, desktop sidebar) — `sections/main-collection.liquid`, `sections/collection.liquid`
- Category tile grid — `blocks/collections-grid.liquid`, `blocks/collection-grid.liquid`, `blocks/collection-subcollections.liquid`
- Full PDP kit — media gallery, variant/shape customizer, price, buy buttons (incl. mobile sticky bar), accordions, cross-sell, trust checkmarks, urgency/shipping-progress
- Generic `card`, `badge`, `text`, `accordion` blocks

## New components to build

| Component | Type | Purpose |
|---|---|---|
| `hero` | section | Tagline + up to 3 featured-category cards |
| `usp-bar` | section (reused on every page) | 4-icon shipping/eco/dispatch strip |
| `value-props` | section | 4-icon grid incl. Trustpilot rating badge |
| `product-carousel` | section | Reusable for "Recommended products" and "New products"; swipeable scroll-snap on mobile, arrow nav on desktop |
| `outlet-banner` | section | Discounted items, built on `product-carousel` + sale-price card variant |
| `content-block` | section | Heading + rich text/bullets; reused with different settings for brand story, care teaser, eco-commitment |
| Sale-price card variant | extend `blocks/card.liquid` | Show compare-at (strikethrough) price when `variant.compare_at_price` is present, instead of a new component |

All new sections use standard Shopify section/block `settings` schema — no hardcoded text, images, or copy (per `ai.md` §7). Colors/spacing pull from the existing CSS-variable/`.grid-layout` system (per `ai.md` §5–6).

## Mobile-first / Baymard UX rules

- **Hero**: tagline stacks above cards on mobile; category cards become a horizontal scroll-snap row below ~768px instead of a cramped 3-column grid.
- **Carousels** (`product-carousel`, `outlet-banner`): native CSS scroll-snap with a visible partial-next-card peek on mobile so users see more content exists; dot/arrow navigation only appears at desktop breakpoint.
- **USP bar**: icon + short label only on mobile (no full sentences); strip itself never scrolls horizontally.
- **Value props / trust badges**: on mobile, Trustpilot rating collapses to a single compact badge instead of the full 4-up icon grid.
- **Tap targets**: every CTA link/card is ≥44px tall on mobile (WCAG/Baymard minimum).

## Homepage section order

Header → Hero → USP bar → Recommended-products carousel → Category tiles (existing `collections-grid`) → Value props → New-products carousel → Outlet banner → Brand story (`content-block`) → Care teaser (`content-block`) → Eco-commitment (`content-block`) → Footer

## Data model

No persisted data model — all content is Shopify section/block settings (editor-managed) and existing product/collection objects. No new schema/entities.

## Testing

Liquid/Shopify sections have no automated unit-test harness in this repo (theme code, editor-configured). Verification is manual: build each section, preview in the Shopify theme editor / local dev preview at mobile and desktop breakpoints, confirm settings drive all copy/images, and confirm carousel/filter interactions work via mouse and touch. This is a stated, intentional gap — kept as thin as possible since these sections contain markup/settings only, no business logic to unit test.

## Out of scope

- Category-listing page visual polish
- Product-detail page visual polish
- Cart/checkout flow
(These are candidates for separate follow-up specs.)
