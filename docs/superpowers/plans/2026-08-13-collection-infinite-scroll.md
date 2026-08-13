# Collection Infinite Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On collection pages, the next 24 products load automatically as the customer scrolls, replacing the numbered pagination buttons.

**Architecture:** A single crawlable `<a href="?page=N">` replaces the numbered pagination nav. That anchor is simultaneously the `IntersectionObserver` target, the click fallback, and the no-JS/screen-reader control. A new behaviour-only JS module fetches the next page via the existing `section_id` rendering endpoint, appends its cards, swaps in the next anchor, and rewrites the URL with `replaceState`.

**Tech Stack:** Shopify Liquid (OS 2.0 theme blocks), vanilla JS (no bundler), Tailwind CSS v4.

## Global Constraints

Copied from `CLAUDE.md` and `.agents/AGENTS.md`. Every task's requirements implicitly include these.

- **No `!important`** in CSS. Resolve specificity via CSS variable scoping or selector structure.
- **No hardcoded user-facing text.** Copy and labels are theme settings (schema `settings`) so merchants can translate them.
- **Componentize down to primitives.** Never re-inline a component's markup at a call site. Icons go through `{% render 'icon', name: '...' %}`. Buttons go through `{% render 'button', ... %}`.
- **Single-purpose files.** UI markup, JS behaviour, and business logic live in separate files.
- **Every source file starts with a 2–3 line header comment** stating what it does, what it exposes, and its key dependencies. Liquid snippets use a `{% doc %}` block with `@param` lines; JS files use a `/** ... */` block.
- **Semantic colour classes only** (`bg-card-light`, `bg-card-high`, `bg-background`, `text-primary`, `border-outline-variant`). Never `bg-white` / `text-black` / arbitrary hex — those bypass dark mode.
- **Version bump every push.** Patch-bump *both* `package.json` `version` and `config/settings_schema.json` `theme_version`, in the same commit. Current: `1.0.139` → target `1.0.140`.
- **Regenerate `assets/output.css`** with `npm run tailwind:build` if any Tailwind class usage changed, and commit it. It is a tracked artifact, not generated at deploy time.
- **Land one change at a time.** All four tasks below are one feature; push once, at the end, then stop for live verification.

## Context an implementer needs

- **There is no JS test runner in this repo.** "Testing" means `npx shopify theme check` plus verification against the live store. Do not invent a test framework or add one. Each task below states its concrete verification instead.
- **The live Shopify store is `shopify.textilogvoksdug.dk`**, not `textilogvoksdug.dk` (that domain still serves the old WooCommerce site).
- **Pushing to `main` is a live deploy.** These tasks commit to the branch only. Do not push without the user's go-ahead.
- **Two boxes per theme block.** Not relevant to these files, but see `CLAUDE.md` if a wrapper's box model looks wrong.

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `snippets/collection-load-more.liquid` | Create | Markup for the load-more anchor. Nothing else. |
| `assets/collection-infinite-scroll.js` | Create | Fetch/append/rebind behaviour. Holds no Liquid. |
| `snippets/collection-product-grid.liquid` | Modify | Render the new snippet instead of `pagination`. |
| `sections/main-collection.liquid` | Modify | Pass the label through; load the script; add the schema setting. |
| `assets/main-collection.js` | Modify | Delete the now-unreachable numbered-nav click handler. |
| `CLAUDE.md` | Modify | Add the new asset to the JS inventory. |
| `package.json`, `config/settings_schema.json` | Modify | Version bump. |
| `snippets/pagination.liquid` | **Untouched** | Still rendered by `sections/search.liquid`, `blog.liquid`, `article.liquid`. Do not delete it. |

---

### Task 1: Load-more anchor replaces numbered pagination

Ends with a working, visible change: the collection page shows a "Vis flere produkter" button instead of `1 2 3 ›`, and clicking it loads page 2 as a normal full-page navigation. No JS yet — this task proves the no-JS fallback works on its own.

**Files:**
- Create: `snippets/collection-load-more.liquid`
- Modify: `snippets/collection-product-grid.liquid` (whole file, 25 lines)
- Modify: `sections/main-collection.liquid:88` and its `{% schema %}` settings array

**Interfaces:**
- Consumes: `snippets/button.liquid` — already exists. Signature: `{% render 'button', label: <string>, variant: 'primary'|'secondary', as: 'button'|'a'|'submit', size: 'md'|'sm', url: <string>, class: <string>, attributes: <raw html string> %}`. Use it; do not hand-write button markup.
- Produces: the DOM contract Task 2 depends on — a `<div data-load-more-wrapper>` containing an `<a data-load-more href="?page=N">`. Task 2 selects on exactly these two attribute names.

- [ ] **Step 1: Create the load-more snippet**

Create `snippets/collection-load-more.liquid` with exactly this content:

```liquid
{% doc %}
  Load-more control for the collection product grid. Renders a single anchor to
  the next page which doubles as the IntersectionObserver target for
  assets/collection-infinite-scroll.js and as the working fallback when
  JavaScript is unavailable. Renders nothing on the last page.

  @param {object} paginate - required. The paginate object from collection-product-grid.
  @param {string} label - required. Button text. Comes from a section setting so merchants can edit and translate it.

  @example
  {% render 'collection-load-more', paginate: paginate, label: load_more_label %}
{% enddoc %}

{%- if paginate.next -%}
  <div class="col-span-full flex justify-center mt-8" data-load-more-wrapper>
    {%- render 'button',
      label: label,
      variant: 'secondary',
      as: 'a',
      url: paginate.next.url,
      attributes: 'data-load-more rel="next"'
    -%}
  </div>
{%- endif -%}
```

Note the `{%- if paginate.next -%}` guard: on the last page this renders nothing, which is how Task 2's JS detects "no more pages".

- [ ] **Step 2: Swap the render call in the grid snippet**

In `snippets/collection-product-grid.liquid`, replace the whole file with:

```liquid
{% doc %}
  Paginated product-card grid for the collection page, with the "no matches"
  empty state and the load-more control that drives infinite scroll.

  @param {object} products - required. collection.products.
  @param {boolean} disable_reviews - required. section.settings.disable_reviews.
  @param {string} load_more_label - required. section.settings.load_more_label, passed through to collection-load-more.

  @example
  {% render 'collection-product-grid', products: collection.products, disable_reviews: section.settings.disable_reviews, load_more_label: section.settings.load_more_label %}
{% enddoc %}

{%- paginate products by 24 -%}
  {%- for product in products -%}
    {%- render 'product-card', product: product, layout: 'minimal', disable_reviews: disable_reviews -%}
  {%- else -%}
    <div class="col-span-full py-12 text-center">
      {%- render 'icon', name: 'frown', class: 'text-4xl text-primary/85 mb-2' -%}
      <p class="text-sm font-semibold text-primary">Ingen produkter matchede dine kriterier.</p>
    </div>
  {%- endfor -%}
  {%- render 'collection-load-more', paginate: paginate, label: load_more_label -%}
{%- endpaginate -%}
```

The old `{%- if paginate.pages > 1 -%}{%- render 'pagination' ... -%}{%- endif -%}` block is gone — the new snippet does its own `paginate.next` guard.

Leave the `by 24` as-is. The live store currently serves 50 per page, which means the published theme is out of sync with `main`; that is a separate issue recorded in the design doc.

- [ ] **Step 3: Pass the label from the section**

In `sections/main-collection.liquid`, change line 88 from:

```liquid
        {%- render 'collection-product-grid', products: collection.products, disable_reviews: section.settings.disable_reviews -%}
```

to:

```liquid
        {%- render 'collection-product-grid', products: collection.products, disable_reviews: section.settings.disable_reviews, load_more_label: section.settings.load_more_label -%}
```

- [ ] **Step 4: Add the label setting to the schema**

In the same file, inside `{% schema %}` → `"settings"`, add this object immediately after the `disable_reviews` checkbox object (which ends `"default": false }`) and before the `columns_mobile` range:

```json
    {
      "type": "text",
      "id": "load_more_label",
      "label": "Tekst på \"Vis flere\"-knappen",
      "default": "Vis flere produkter"
    },
```

Watch the JSON commas — the preceding object needs a trailing comma and this one ends with one.

- [ ] **Step 5: Verify Liquid parses**

Run: `npx shopify theme check`

Expected: no new errors or warnings referencing `collection-load-more.liquid`, `collection-product-grid.liquid`, or `main-collection.liquid`. Pre-existing findings elsewhere in the theme are fine — compare against the output of the same command on a clean checkout if unsure.

`theme-check` passing proves only that the Liquid parses. It does not prove the page renders. Do not report this task as verified on the strength of theme-check alone.

- [ ] **Step 6: Commit**

```bash
git add snippets/collection-load-more.liquid snippets/collection-product-grid.liquid sections/main-collection.liquid
git commit -m "feat: replace collection numbered pagination with a load-more anchor"
```

---

### Task 2: Auto-load on scroll

**Files:**
- Create: `assets/collection-infinite-scroll.js`
- Modify: `sections/main-collection.liquid` (add one `<script>` tag)

**Interfaces:**
- Consumes: the `[data-load-more-wrapper]` / `[data-load-more]` DOM contract from Task 1. Also `#main-collection-config`, the JSON island already rendered at `sections/main-collection.liquid:108-110`, whose `sectionId` key holds the value needed for the `section_id` query parameter.
- Produces: nothing global. The module exposes no `window.*` symbols — `assets/main-collection.js` needs no knowledge of it, and vice versa.

- [ ] **Step 1: Create the infinite-scroll module**

Create `assets/collection-infinite-scroll.js` with exactly this content:

```js
/**
 * Collection infinite scroll: auto-loads the next page of products when the
 * load-more anchor scrolls into view and appends them to #product-grid.
 *
 * Exposes nothing globally. Reads the section id from the
 * #main-collection-config JSON island rendered by sections/main-collection.liquid,
 * and re-binds itself via MutationObserver because assets/main-collection.js
 * replaces #product-grid's innerHTML when filters or sorting change.
 */
(function () {
  // No IntersectionObserver means no auto-loading — the anchor is a real link,
  // so it keeps working as an ordinary page-to-page navigation. Bail before
  // registering the click handler so that native behaviour is preserved.
  if (!('IntersectionObserver' in window)) return;

  var grid = document.getElementById('product-grid');
  if (!grid) return;

  var sectionId = '';
  var configEl = document.getElementById('main-collection-config');
  if (configEl) {
    try {
      sectionId = (JSON.parse(configEl.textContent) || {}).sectionId || '';
    } catch (e) {
      sectionId = '';
    }
  }

  // Start fetching before the customer reaches the bottom so the next batch is
  // usually already in place by the time they scroll to it.
  var ROOT_MARGIN = '600px';

  var loading = false;
  var observer = null;

  function currentAnchor() {
    return grid.querySelector('[data-load-more]');
  }

  function loadNext(anchor) {
    if (loading) return;
    var href = anchor.getAttribute('href');
    if (!href) return;

    loading = true;
    anchor.setAttribute('aria-busy', 'true');
    anchor.classList.add('opacity-50', 'pointer-events-none');

    var url = new URL(href, window.location.origin);
    var params = new URLSearchParams(url.search);
    params.set('section_id', sectionId);

    fetch(url.pathname + '?' + params.toString())
      .then(function (res) {
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newGrid = doc.getElementById('product-grid');
        if (!newGrid) throw new Error('No #product-grid in load-more response');

        var wrapper = anchor.closest('[data-load-more-wrapper]') || anchor;
        var incoming = Array.prototype.slice.call(newGrid.children);
        var newWrapper = null;

        incoming.forEach(function (node) {
          if (node.matches('[data-load-more-wrapper]')) {
            newWrapper = node;
            return;
          }
          grid.insertBefore(node, wrapper);
        });

        if (newWrapper) {
          grid.replaceChild(newWrapper, wrapper);
        } else {
          // Last page reached: drop the control entirely.
          wrapper.remove();
        }

        // replaceState, not pushState: Back should leave the collection, not
        // walk back through every batch the customer scrolled past.
        params.delete('section_id');
        var query = params.toString();
        window.history.replaceState({}, '', url.pathname + (query ? '?' + query : ''));
      })
      .catch(function (err) {
        console.error('Error loading more products:', err);
        anchor.removeAttribute('aria-busy');
        anchor.classList.remove('opacity-50', 'pointer-events-none');
      })
      .finally(function () {
        loading = false;
        bind();
      });
  }

  function bind() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    var anchor = currentAnchor();
    if (!anchor) return;
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) loadNext(anchor);
        });
      },
      { rootMargin: ROOT_MARGIN }
    );
    observer.observe(anchor);
  }

  grid.addEventListener('click', function (e) {
    var anchor = e.target.closest('[data-load-more]');
    if (!anchor) return;
    e.preventDefault();
    loadNext(anchor);
  });

  // assets/main-collection.js replaces grid.innerHTML on filter/sort/chip
  // changes, which destroys the observed anchor. Skip while `loading` is true
  // so our own appends don't churn the observer needlessly.
  new MutationObserver(function () {
    if (loading) return;
    bind();
  }).observe(grid, { childList: true });

  bind();
})();
```

- [ ] **Step 2: Load the script from the section**

In `sections/main-collection.liquid`, immediately after the existing line:

```liquid
<script src="{{ 'main-collection.js' | asset_url }}" defer="defer"></script>
```

add:

```liquid
<script src="{{ 'collection-infinite-scroll.js' | asset_url }}" defer="defer"></script>
```

- [ ] **Step 3: Verify Liquid still parses**

Run: `npx shopify theme check`

Expected: no new findings.

- [ ] **Step 4: Commit**

```bash
git add assets/collection-infinite-scroll.js sections/main-collection.liquid
git commit -m "feat: auto-load collection products on scroll"
```

---

### Task 3: Remove the unreachable numbered-nav handler

After Task 1, collection pages no longer render `nav[role="navigation"]` inside `#product-grid`, so this click handler can never fire. `assets/main-collection.js` loads only on the collection template, so nothing else reaches it.

**Files:**
- Modify: `assets/main-collection.js` (delete lines 415-456)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This is a deletion; behaviour must be unchanged.

- [ ] **Step 1: Delete the handler**

In `assets/main-collection.js`, inside the `document.addEventListener('click', function(e) { ... })` block, delete everything from the blank line after the collection-chip handler's closing `}` through the end of the `navLink` block. Concretely, delete the block that begins:

```js
    const navLink = e.target.closest('#product-grid nav[role="navigation"] a');
```

and ends with the closing brace of that `if`, immediately before the listener's own `});`. Delete the blank line preceding it too.

After the edit, the tail of that listener must read:

```js
        .catch(err => {
          console.error('Error filtering collection by chip:', err);
          if (productGrid) {
            productGrid.classList.remove('opacity-50', 'pointer-events-none');
          }
        });
      return;
    }
  });
```

Do not touch the `fetchAndSwapUrl` function that follows — it is still used by `removeFilterChipUrl` and `clearAllFiltersUrl`.

- [ ] **Step 2: Update the file's header comment**

The header block at the top of `assets/main-collection.js` still claims the file handles pagination. Change this line:

```js
 * price-filter sync between desktop/mobile, and AJAX filtering/sorting/
 * pagination/collection-chip navigation that swaps #product-grid without a
 * full page reload.
```

to:

```js
 * price-filter sync between desktop/mobile, and AJAX filtering/sorting/
 * collection-chip navigation that swaps #product-grid without a full page
 * reload. Pagination is handled by assets/collection-infinite-scroll.js.
```

- [ ] **Step 3: Verify no other reference survives**

Run: `grep -rn "nav\[role=\\\"navigation\\\"\]" assets/ snippets/ sections/`

Expected: matches only in `snippets/pagination.liquid` (the markup itself, still used by search/blog/article). No match in `assets/main-collection.js`.

- [ ] **Step 4: Commit**

```bash
git add assets/main-collection.js
git commit -m "refactor: drop unreachable numbered-pagination handler"
```

---

### Task 4: Docs, Tailwind rebuild, version bump

**Files:**
- Modify: `CLAUDE.md` (JS inventory line)
- Modify: `assets/output.css` (regenerated, not hand-edited)
- Modify: `package.json:3`, `config/settings_schema.json:5`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Add the new asset to the codebase map**

In `CLAUDE.md`, under `### JS`, change:

```
Vanilla JS, one file per concern in `assets/` (e.g. `header.js` for header interactions, `header-cart.js` for the cart drawer, `navigation.js` for the nav dropdowns, `predictive-search.js`), loaded via
```

to:

```
Vanilla JS, one file per concern in `assets/` (e.g. `header.js` for header interactions, `header-cart.js` for the cart drawer, `navigation.js` for the nav dropdowns, `predictive-search.js`, `collection-infinite-scroll.js` for auto-loading the next page of collection products), loaded via
```

- [ ] **Step 2: Regenerate the compiled CSS**

Run: `npm run tailwind:build`

Expected: exits 0 and rewrites `assets/output.css`. The new markup uses `col-span-full`, `flex`, `justify-center`, `mt-8`, `opacity-50`, `pointer-events-none` — all already in use elsewhere in the theme, so the diff may well be empty. An empty diff is a valid outcome; do not force a change.

- [ ] **Step 3: Bump the version in both files**

`package.json` line 3: `"version": "1.0.139",` → `"version": "1.0.140",`

`config/settings_schema.json` line 5: `"theme_version": "1.0.139",` → `"theme_version": "1.0.140",`

Both must change in the same commit. `theme_version` is what the Shopify dashboard displays.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md assets/output.css package.json config/settings_schema.json
git commit -m "chore: bump version to 1.0.140"
```

---

## Live verification (after the user approves the push)

Do not run this before the user gives an explicit go-ahead to push — it requires the change to be deployed, and pushing to `main` is a live deploy.

Against `https://shopify.textilogvoksdug.dk/collections/borddaekning`, assert concrete numbers rather than eyeballing the page:

1. **Initial render** — `#product-grid` holds 24 product cards plus one `[data-load-more-wrapper]`; no `nav[role="navigation"]`.
2. **Auto-load** — scroll the wrapper into view; card count becomes 48, the anchor's `href` becomes `?page=3`, and `location.search` becomes `?page=2`.
3. **Last page** — continue to the final page; the `[data-load-more-wrapper]` is removed from the DOM entirely.
4. **No-JS fallback** — fetch the page HTML and confirm a literal `<a href="/collections/borddaekning?page=2"` is present in the source, since Google's crawlers do not scroll or click.
5. **Filter re-bind** — apply a price filter, then scroll; products still append. This is what proves the `MutationObserver` re-bind works after `main-collection.js` replaces the grid's innerHTML.
6. **Back button** — open a product from page 3, press Back, and confirm the browser returns to the collection at `?page=3` rather than to a blank page 1.

Report the actual observed numbers. If any check fails, add an entry to `docs/failure-log.md` (next `F-NNN`, at the top) in the same commit as the fix.

## Out of scope

Deliberately not part of this plan, per the design doc:

- **Canonical tags.** Verified already correct — Shopify's `canonical_url` self-canonicalises `?page=N` and strips `sort_by` / `filter.v.*`. No change.
- **`templates/robots.txt.liquid`.** Deliberately not added; blocking those URLs would prevent the canonicals above from ever being read.
- **`snippets/pagination.liquid` and the search/blog/article templates.** Untouched.
- **The 24-vs-50 page-size discrepancy** between the repo and the published theme. Recorded in the design doc, resolve separately.
