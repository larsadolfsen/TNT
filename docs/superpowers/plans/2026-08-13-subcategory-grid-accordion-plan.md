# Subcategory Grid "Show More" Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the collection page's subcategory grid (`sections/collections.liquid`), show only the first `visible_count` cards by default and reveal the rest through a native `<details>`/`<summary>` accordion, with the visible count and trigger labels configurable as theme settings.

**Architecture:** Split the existing `display_collections` list in Liquid into a visible slice and a remaining slice. The visible slice renders in the existing `.collections` grid unchanged. When a remaining slice exists, it renders inside a `<details>` element styled to look like a second `.collections` grid, with a `<summary>` trigger whose label text is swapped via CSS `[open]` selectors (no JS) and a chevron icon that rotates on open.

**Tech Stack:** Shopify Liquid, Tailwind CSS v4 (`assets/input.css` → compiled `assets/output.css`), native HTML `<details>`/`<summary>` (zero JS).

## Global Constraints

- No `!important` in CSS (project rule, see `CLAUDE.md`).
- No hardcoded user-facing text — all copy must be a theme setting (project rule).
- Componentize down to primitives — icons render via `{% render 'icon', ... %}`, never inline `<svg>` (project rule).
- After any new Tailwind class usage, regenerate `assets/output.css` with `npm run tailwind:build` and commit it (project rule; this plan uses plain CSS in `input.css` rather than new Tailwind utility classes, but the build step is still required since `input.css` changed).
- `visible_count` range: min 2, max 12, step 2, default 6 (spec decision, matches `blocks/collection-children.liquid`).
- Verification is `npx shopify theme check` plus manual browser check — there is no JS test runner in this repo (per `CLAUDE.md` Commands section).

---

## File Structure

- **Modify `sections/collections.liquid`** — schema settings, Liquid slicing logic, markup restructure (wrap grid + accordion in a shared container so one `{% style %}` block can target both grids by class instead of duplicating per-ID media queries).
- **Modify `assets/input.css`** — new `.collections-more` rules appended after the existing `.collection-card__description` rule (~line 970).
- **Modify `assets/output.css`** — regenerated, not hand-edited.

---

### Task 1: Schema settings + slicing logic + accordion markup

**Files:**
- Modify: `sections/collections.liquid` (whole file — it's 94 lines, shown in full below for reference)
- Test: manual, via `shopify theme dev` preview (see Step 5)

**Interfaces:**
- Produces: three new section settings — `visible_count` (number, range 2-12), `show_more_label` (string), `show_less_label` (string) — consumed only by this file.
- Produces: CSS hooks `#collections-wrap-{{ section.id }}`, `.collections-more`, `.collections-more__trigger`, `.label-closed`, `.label-open` — consumed by Task 2's CSS.

- [ ] **Step 1: Restructure the style block to target both grids by class**

Replace the `{%- style -%}...{%- endstyle -%}` block (current lines 7-24) with:

```liquid
{%- style -%}
  #collections-wrap-{{ section.id }} .collections {
    grid-template-columns: repeat({{ section.settings.columns_mobile | default: 2 }}, minmax(0, 1fr));
    --grid-gap: {{ section.settings.grid_gap | default: 16 }}px;
  }

  @media screen and (min-width: 768px) {
    #collections-wrap-{{ section.id }} .collections {
      grid-template-columns: repeat({{ section.settings.columns_tablet | default: 2 }}, minmax(0, 1fr));
    }
  }

  @media screen and (min-width: 1024px) {
    #collections-wrap-{{ section.id }} .collections {
      grid-template-columns: repeat({{ section.settings.columns_desktop | default: 3 }}, minmax(0, 1fr));
    }
  }
{%- endstyle -%}
```

This is the same three rules as before, just re-targeted from `#collections-grid-{{ section.id }}` to `#collections-wrap-{{ section.id }} .collections` — a descendant selector that will match both the visible grid and the accordion's reveal grid without duplicating the media queries.

- [ ] **Step 2: Replace the Liquid data logic**

Replace the `{%- liquid ... -%}` block (current lines 26-31) with:

```liquid
{%- liquid
  assign display_collections = blank
  if collection != blank and collection.metafields.custom.child.value != blank
    assign display_collections = collection.metafields.custom.child.value
  endif

  assign visible_count = section.settings.visible_count | default: 6
  assign total_count = display_collections.size
  assign visible_collections = display_collections | slice: 0, visible_count

  assign remaining_count = 0
  if total_count > visible_count
    assign remaining_collections = display_collections | slice: visible_count, total_count
    assign remaining_count = remaining_collections.size
  endif
-%}
```

- [ ] **Step 3: Replace the markup block**

Replace the `{%- if display_collections != blank or request.design_mode -%}...{%- endif -%}` block (current lines 33-45) with:

```liquid
{%- if display_collections != blank or request.design_mode -%}
<div id="collections-wrap-{{ section.id }}">
  <div class="collections">
    {% for col_item in visible_collections %}
      {% render 'collection-card', collection: col_item %}
    {% else %}
      {% if request.design_mode %}
        {% for i in (1..4) %}
          {% render 'collection-card', placeholder_index: i %}
        {% endfor %}
      {% endif %}
    {% endfor %}
  </div>

  {%- if remaining_count > 0 -%}
    <details class="collections-more">
      <summary class="collections-more__trigger">
        <span class="label-closed">{{ section.settings.show_more_label }}</span>
        <span class="label-open">{{ section.settings.show_less_label }}</span>
        {% render 'icon', name: 'chevron-down' %}
      </summary>
      <div class="collections collections-more__grid">
        {% for col_item in remaining_collections %}
          {% render 'collection-card', collection: col_item %}
        {% endfor %}
      </div>
    </details>
  {%- endif -%}
</div>
{%- endif -%}
```

- [ ] **Step 4: Add the three new schema settings**

In the `{% schema %}` block, insert these three settings into the `"settings"` array, immediately after the existing `grid_gap` setting (so the array reads `columns_mobile, columns_tablet, columns_desktop, grid_gap, visible_count, show_more_label, show_less_label`):

```json
    {
      "type": "range",
      "id": "visible_count",
      "min": 2,
      "max": 12,
      "step": 2,
      "label": "Antal synlige underkategorier",
      "default": 6
    },
    {
      "type": "text",
      "id": "show_more_label",
      "label": "Tekst: vis flere",
      "default": "Vis flere kategorier"
    },
    {
      "type": "text",
      "id": "show_less_label",
      "label": "Tekst: vis færre",
      "default": "Vis færre"
    }
```

- [ ] **Step 5: Verify the file is well-formed**

Run:
```bash
npx shopify theme check
```
Expected: same result as before this change (currently 1 pre-existing unrelated `OrphanedSnippet` warning on `snippets/text-style.liquid`, 0 errors). No new errors or warnings on `sections/collections.liquid`.

- [ ] **Step 6: Commit**

```bash
git add sections/collections.liquid
git commit -m "feat(collections): cap subcategory grid to visible_count with accordion for the rest"
```

---

### Task 2: CSS for the accordion trigger and reveal grid

**Files:**
- Modify: `assets/input.css` (append after the `.collection-card__description` rule, ~line 970)
- Modify: `assets/output.css` (regenerated by build command, not hand-edited)

**Interfaces:**
- Consumes: CSS hooks from Task 1 — `.collections-more`, `.collections-more__trigger`, `.label-closed`, `.label-open`, `--grid-row-gap` (already defined in `:root`, see `assets/input.css:42`).

- [ ] **Step 1: Add the CSS rules**

In `assets/input.css`, immediately after the `.collection-card__description` rule block (ends around line 970 with a closing `}` and blank line before `/* Flex group component styles */`), insert:

```css
.collections-more {
  margin-top: var(--grid-row-gap);
}
.collections-more summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  list-style: none;
  cursor: pointer;
  font-family: var(--font-sans-family), sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary, #000);
  padding: 0.5rem 0;
}
.collections-more summary::-webkit-details-marker {
  display: none;
}
.collections-more .label-open {
  display: none;
}
.collections-more[open] .label-open {
  display: inline;
}
.collections-more[open] .label-closed {
  display: none;
}
.collections-more summary svg {
  transition: transform 0.2s ease;
}
.collections-more[open] summary svg {
  transform: rotate(180deg);
}
.collections-more__grid {
  margin-top: var(--grid-row-gap);
}
```

- [ ] **Step 2: Rebuild the compiled CSS**

Run:
```bash
npm run tailwind:build
```
Expected: exits 0, `assets/output.css` is modified (contains the new `.collections-more*` rules — spot-check with `grep collections-more assets/output.css`).

- [ ] **Step 3: Commit**

```bash
git add assets/input.css assets/output.css
git commit -m "style(collections): add show-more accordion styles"
```

---

### Task 3: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the local preview**

Run:
```bash
npm run dev
```

- [ ] **Step 2: Test a collection with more than 6 children**

Open a collection page (via the `shopify.` preview subdomain per project convention — see `CLAUDE.md` / memory on preview domain) whose `custom.child` metafield lists more than 6 sub-collections, or open the theme editor and add 7+ items to that metafield on a test collection.

Expected:
- Exactly the first 6 cards show in the initial grid.
- Below them, a centered "Vis flere kategorier" trigger with a chevron icon is visible.
- Clicking/tapping the trigger reveals the remaining cards in a second grid with matching column count, the label flips to "Vis færre", and the chevron rotates 180°.
- Clicking again collapses the reveal grid and flips the label back.
- Keyboard: tab to the trigger, press Enter/Space — it toggles the same way (native `<details>` behavior).

- [ ] **Step 3: Test a collection with 6 or fewer children**

Open a collection whose `custom.child` metafield has ≤ 6 items.

Expected: all cards show in the single grid, no trigger renders, layout matches current production behavior exactly.

- [ ] **Step 4: Test the theme-editor placeholder state**

In the theme editor, open a collection page where `collection.metafields.custom.child.value` is blank (e.g. a collection with no configured children), with the "collections" section added.

Expected: exactly 4 placeholder cards show, no trigger renders (4 < default `visible_count` of 6).

- [ ] **Step 5: Test the `visible_count` setting**

In the theme editor, change "Antal synlige underkategorier" to 2 on a collection with more than 2 children.

Expected: grid immediately shows 2 cards, trigger reveals the rest.

- [ ] **Step 6: Report results**

Tell the user exactly what was checked and what was seen (screenshots if the tool supports it) — per `CLAUDE.md`, UI changes require this browser verification before being called done, and this repo requires one verified change to land before the next merge.

---

## Self-Review Notes

- **Spec coverage:** trigger style (text button, Step 3/Task 1 markup) ✓, visible-count range setting (Task 1 Step 4) ✓, `<details>`/`<summary>` mechanism (Task 1 Step 3) ✓, CSS label swap (Task 2 Step 1) ✓, no-op when total ≤ visible_count (Task 1 Step 2 `remaining_count` guard, verified in Task 3 Step 3) ✓, out-of-scope blocks left untouched (not referenced anywhere in this plan) ✓.
- **Type consistency:** `visible_collections`, `remaining_collections`, `remaining_count`, `total_count` are used with the same names across Task 1's three steps.
- **No placeholders:** every step has literal code to write and an exact command with expected output.
