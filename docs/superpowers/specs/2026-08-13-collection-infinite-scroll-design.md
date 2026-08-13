# Collection page infinite scroll — design

Date: 2026-08-13
Branch: `claude/lazy-load-collection-products-a73e93`

## Goal

On collection pages, products load automatically as the customer scrolls, instead
of requiring a click on a numbered page button.

## Decisions

| Question | Decision |
|---|---|
| Load trigger | Auto-load on scroll, with a visible button as the fallback anchor |
| Numbered pagination (1 2 3 ›) | Replaced by the load-more anchor on collection pages |
| Back-button behaviour | URL rewrites to `?page=N` as batches append (`replaceState`) |
| Batch size | 24 products |
| Canonical / robots.txt | No code change — already correct (see "SEO findings") |

### Why 24 per batch

Divides evenly into all three column counts (2 mobile / 2 tablet / 3 desktop), so
every appended batch lands on a clean row boundary. Also keeps page 1's
server-rendered Liquid — the critical path for LCP — half the size of the 50 the
live store currently serves.

## Architecture

### New: `snippets/collection-load-more.liquid`

Rendered only when `paginate.next` exists. Emits a real anchor:

```liquid
<a href="{{ paginate.next.url }}" data-load-more>{{ label }}</a>
```

This single element serves four roles at once:

- the `IntersectionObserver` target that triggers auto-loading
- the click fallback when JS runs but the observer hasn't fired
- the working control for no-JS visitors and keyboard/screen-reader users
- the crawlable `href` Google requires, since its crawlers do not scroll or click

Label text comes from a theme setting, per the no-hardcoded-user-facing-text rule.

### New: `assets/collection-infinite-scroll.js`

Behaviour only. On intersect with the anchor:

1. Guard on an in-flight flag (prevents double-fetch from repeated intersections).
2. `fetch(next.url + '&section_id=' + sectionId)`.
3. Parse the response, append its product cards before the anchor.
4. Replace the anchor with the response's own anchor, or remove it if the
   response has none (last page reached).
5. `history.replaceState` the URL to `?page=N` — rewrite, not push, so the
   customer's Back button leaves the collection rather than walking back through
   every batch they scrolled past.

Reads `sectionId` from the existing `#main-collection-config` JSON island, the
same way `main-collection.js` does. Holds no Liquid.

**Re-binding after a grid swap.** `main-collection.js` replaces
`#product-grid.innerHTML` in four places (filter change, sort change, collection
chip click, filter-chip removal), which destroys the observed anchor. Rather than
adding a re-init call at each of those four sites, this module puts a
`MutationObserver` on `#product-grid` and re-binds itself. The two files stay
decoupled and `main-collection.js` needs no knowledge of the observer.

### Edit: `snippets/collection-product-grid.liquid`

Replace `{% render 'pagination', paginate: paginate %}` with
`{% render 'collection-load-more', paginate: paginate %}`.

**Correction (found during implementation):** this design originally claimed
`snippets/pagination.liquid` was still needed by `search`/`blog`/`article`. It is
not — those sections all use Shopify's built-in `default_pagination` filter, and
`collection-product-grid.liquid` was the snippet's only caller. `theme-check`
now reports it as an orphaned snippet. It should be deleted; the deletion was
blocked by a permission prompt during implementation and is pending.

### Edit: `assets/main-collection.js`

Remove the numbered-nav click handler (lines 416-456), which becomes unreachable
once collection pages no longer render `nav[role="navigation"]`. This file only
loads on the collection template, so nothing else depends on it.

### Edit: `sections/main-collection.liquid`

Add the `<script>` tag for the new asset and the load-more label setting to the
schema.

## SEO findings — verified, no code needed

Checked against the live store `shopify.textilogvoksdug.dk` on 2026-08-13.
Shopify's `canonical_url`, already emitted by `snippets/meta-tags.liquid:95`,
produces:

| Requested URL | Canonical emitted |
|---|---|
| `/collections/borddaekning` | `…/borddaekning` |
| `…?page=2` | `…/borddaekning?page=2` (self-canonical) |
| `…?sort_by=price-ascending` | `…/borddaekning` (param stripped) |
| `…?filter.v.price.gte=100` | `…/borddaekning` (param stripped) |
| `…?page=3&filter.v.price.gte=100` | `…/borddaekning?page=3` (page kept, filter stripped) |

Filter and sort parameters already consolidate to the clean collection URL. This
is the duplicate-content fix the Shopify URL-parameters article describes, and it
is already in place.

### Two things deliberately NOT done

**`?page=N` is not canonicalised to page 1.** Google's ecommerce pagination
guidance: *"Don't use the first page of a paginated sequence as the canonical
page. Instead, give each page its own canonical URL."* Collapsing pages 2+ onto
page 1 would drop deep products from the index — the "Billige duge" collection
holds 137 products, so roughly 113 of them would become invisible. Shopify's
self-canonical is already the correct behaviour.

**No `templates/robots.txt.liquid` is added.** Two reasons:

1. The `Disallow: /?sort=` and `Disallow: /?filter=` lines in the article are
   generic examples that do not match Shopify's actual parameter names
   (`sort_by`, `filter.v.*`). Copied literally they would block nothing.
2. `robots.txt` and `rel=canonical` are mutually exclusive on the same URL. A
   URL blocked from crawling is never fetched, so its canonical tag is never
   read and its ranking signals never consolidate. Adding filter Disallow rules
   would *undo* the consolidation confirmed in the table above.

Shopify's default robots.txt already carries `Disallow: /collections/*sort_by*`
and `Disallow: */collections/*filter*&*filter*`.

## Testing

This repo has no JS test runner (see CLAUDE.md), so the untested layer is named
here explicitly rather than left as a silent gap: the infinite-scroll module is
DOM-and-network wiring with no extractable pure logic beyond URL construction.
It is kept thin and verified by:

1. `npx shopify theme check` — Liquid lint.
2. A scripted browser pass against `shopify.textilogvoksdug.dk` after deploy,
   asserting concrete numbers rather than eyeballing:
   - card count grows from 24 to 48 after scrolling to the trigger
   - URL becomes `?page=2`
   - the anchor now points at `?page=3`
   - the anchor disappears on the final page
   - filtering, then scrolling, still appends (proves the MutationObserver
     re-bind works)

## Known discrepancy

The repo says `paginate by 24` on both `main` and `origin/main`, but the live
store serves 50 per page. The published theme is out of sync with `main`. Worth
resolving separately — it is not caused by, and does not block, this change.
