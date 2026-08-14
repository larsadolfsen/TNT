# Subcategory Grid: Per-Breakpoint Visible Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `visible_count` setting on the subcategory grid (`sections/collections.liquid`) with three independent per-breakpoint settings (`visible_count_mobile`/`tablet`/`desktop`, step 1), moving the "show first N, hide the rest behind an accordion" logic from a Liquid-time list split to a CSS-driven, viewport-aware show/hide.

**Architecture:** Liquid now renders every subcategory into a single `.collections` grid (no more separate "visible" and "remaining" lists). A mobile-first `:nth-child` CSS cascade hides cards beyond each breakpoint's configured count; a `:has()` selector on the wrapper reveals everything when the accordion (`<details class="collections-more">`) is open, regardless of breakpoint. The accordion trigger's own per-breakpoint visibility is also CSS-driven, computed inline per breakpoint from Liquid booleans.

**Tech Stack:** Shopify Liquid, Tailwind CSS v4 (`assets/input.css` → compiled `assets/output.css`), native HTML `<details>`/`<summary>`, CSS `:has()` (zero JS).

## Global Constraints

- No `!important` in CSS (project rule).
- No hardcoded user-facing text — all copy stays theme settings (unchanged from the prior task: `show_more_label`/`show_less_label`).
- Icons render via `{% render 'icon', ... %}`, never inline `<svg>` (unchanged — `chevron-down` usage stays as-is).
- `visible_count_mobile`/`visible_count_tablet`/`visible_count_desktop` range: min 2, max 12, **step 1**, default 6 each (spec decision — replaces the old single `visible_count`, step 2).
- Breakpoints match the section's existing column-count media queries exactly: `768px` (tablet), `1024px` (desktop).
- `:has()` requires no fallback — this project has no stated legacy-browser floor (per spec).
- After any Tailwind-relevant CSS change, `assets/output.css` must be regenerated via `npm run tailwind:build` and committed alongside `assets/input.css`.
- Verification is `npx shopify theme check` plus manual browser check — no JS test runner in this repo.

---

## File Structure

- **Modify `sections/collections.liquid`** — full rewrite: schema settings, Liquid data logic, style block (per-breakpoint `:nth-child` hide/reveal + `:has()` reveal-all + trigger visibility), markup (single grid, trigger no longer wraps a second grid).
- **Modify `assets/input.css`** — delete the now-dead `.collections-more__grid` rule (there is no longer a second grid nested inside `<details>`); everything else in the `.collections-more*` block is unchanged and still applies.
- **Modify `assets/output.css`** — regenerated, not hand-edited.

---

### Task 1: Per-breakpoint schema, Liquid logic, and CSS cascade

**Files:**
- Modify: `sections/collections.liquid` (full-file rewrite — the whole file is shown below since nearly every part changes)

**Interfaces:**
- Produces: three new section settings replacing `visible_count` — `visible_count_mobile`, `visible_count_tablet`, `visible_count_desktop` (range, min 2, max 12, step 1, default 6). `show_more_label`/`show_less_label` unchanged.
- Produces: markup contract Task 2's CSS cleanup relies on — the `<details class="collections-more">` element no longer contains a nested `.collections-more__grid` div (it only contains the `<summary>`).

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `sections/collections.liquid` with:

```liquid
{% comment %}
  This section is used in the list-collections template to render a list of
  collections.

  https://shopify.dev/docs/storefronts/themes/architecture/templates/collection
{% endcomment %}
{%- liquid
  assign display_collections = blank
  if collection != blank and collection.metafields.custom.child.value != blank
    assign display_collections = collection.metafields.custom.child.value
  endif

  assign visible_count_mobile = section.settings.visible_count_mobile | default: 6
  assign visible_count_tablet = section.settings.visible_count_tablet | default: 6
  assign visible_count_desktop = section.settings.visible_count_desktop | default: 6
  assign total_count = display_collections.size

  assign smallest_visible_count = visible_count_mobile | at_most: visible_count_tablet | at_most: visible_count_desktop
  assign show_trigger = false
  if total_count > smallest_visible_count
    assign show_trigger = true
  endif
-%}

{%- style -%}
  #collections-wrap-{{ section.id }} .collections {
    grid-template-columns: repeat({{ section.settings.columns_mobile | default: 2 }}, minmax(0, 1fr));
    --grid-gap: {{ section.settings.grid_gap | default: 16 }}px;
  }

  #collections-wrap-{{ section.id }} .collections > .collection-card:nth-child(n+{{ visible_count_mobile | plus: 1 }}) {
    display: none;
  }

  #collections-wrap-{{ section.id }} .collections-more {
    display: {% if total_count > visible_count_mobile %}block{% else %}none{% endif %};
  }

  @media screen and (min-width: 768px) {
    #collections-wrap-{{ section.id }} .collections {
      grid-template-columns: repeat({{ section.settings.columns_tablet | default: 2 }}, minmax(0, 1fr));
    }

    #collections-wrap-{{ section.id }} .collections > .collection-card:nth-child(n+{{ visible_count_mobile | plus: 1 }}) {
      display: flex;
    }
    #collections-wrap-{{ section.id }} .collections > .collection-card:nth-child(n+{{ visible_count_tablet | plus: 1 }}) {
      display: none;
    }

    #collections-wrap-{{ section.id }} .collections-more {
      display: {% if total_count > visible_count_tablet %}block{% else %}none{% endif %};
    }
  }

  @media screen and (min-width: 1024px) {
    #collections-wrap-{{ section.id }} .collections {
      grid-template-columns: repeat({{ section.settings.columns_desktop | default: 3 }}, minmax(0, 1fr));
    }

    #collections-wrap-{{ section.id }} .collections > .collection-card:nth-child(n+{{ visible_count_tablet | plus: 1 }}) {
      display: flex;
    }
    #collections-wrap-{{ section.id }} .collections > .collection-card:nth-child(n+{{ visible_count_desktop | plus: 1 }}) {
      display: none;
    }

    #collections-wrap-{{ section.id }} .collections-more {
      display: {% if total_count > visible_count_desktop %}block{% else %}none{% endif %};
    }
  }

  #collections-wrap-{{ section.id }}:has(.collections-more[open]) .collections > .collection-card {
    display: flex;
  }
{%- endstyle -%}

{%- if display_collections != blank or request.design_mode -%}
<div id="collections-wrap-{{ section.id }}">
  <div class="collections">
    {% for col_item in display_collections %}
      {% render 'collection-card', collection: col_item %}
    {% else %}
      {% if request.design_mode %}
        {% for i in (1..4) %}
          {% render 'collection-card', placeholder_index: i %}
        {% endfor %}
      {% endif %}
    {% endfor %}
  </div>

  {%- if show_trigger -%}
    <details class="collections-more">
      <summary class="collections-more__trigger">
        <span class="label-closed">{{ section.settings.show_more_label }}</span>
        <span class="label-open">{{ section.settings.show_less_label }}</span>
        {% render 'icon', name: 'chevron-down' %}
      </summary>
    </details>
  {%- endif -%}
</div>
{%- endif -%}


{% schema %}
{
  "name": "t:general.collections_grid",
  "settings": [

    {
      "type": "range",
      "id": "columns_mobile",
      "min": 1,
      "max": 6,
      "step": 1,
      "label": "Antal kolonner på mobil",
      "default": 2
    },
    {
      "type": "range",
      "id": "columns_tablet",
      "min": 2,
      "max": 8,
      "step": 1,
      "label": "Antal kolonner på tablet",
      "default": 2
    },
    {
      "type": "range",
      "id": "columns_desktop",
      "min": 2,
      "max": 12,
      "step": 1,
      "label": "Antal kolonner på desktop",
      "default": 3
    },
    {
      "type": "range",
      "id": "grid_gap",
      "label": "t:labels.grid_gap",
      "min": 0,
      "max": 50,
      "step": 2,
      "unit": "px",
      "default": 16
    },
    {
      "type": "range",
      "id": "visible_count_mobile",
      "min": 2,
      "max": 12,
      "step": 1,
      "label": "Antal synlige underkategorier (mobil)",
      "default": 6
    },
    {
      "type": "range",
      "id": "visible_count_tablet",
      "min": 2,
      "max": 12,
      "step": 1,
      "label": "Antal synlige underkategorier (tablet)",
      "default": 6
    },
    {
      "type": "range",
      "id": "visible_count_desktop",
      "min": 2,
      "max": 12,
      "step": 1,
      "label": "Antal synlige underkategorier (desktop)",
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
  ],
  "presets": [{ "name": "t:general.collections_grid" }]
}
{% endschema %}
```

- [ ] **Step 2: Verify the file is well-formed**

Run:
```bash
npx shopify theme check
```
Expected: 0 offenses (the branch's current baseline, per the last run on this branch — confirm no new errors/warnings appear on `sections/collections.liquid`).

- [ ] **Step 3: Commit**

```bash
git add sections/collections.liquid
git commit -m "feat(collections): make subcategory visible-count responsive per breakpoint"
```

---

### Task 2: Remove the dead nested-grid CSS rule

**Files:**
- Modify: `assets/input.css:1006-1008` (delete the `.collections-more__grid` rule)
- Modify: `assets/output.css` (regenerated by build command, not hand-edited)

**Interfaces:**
- Consumes: Task 1's markup contract — `<details class="collections-more">` no longer contains an element with class `collections-more__grid`, so this rule is unreachable dead code.

- [ ] **Step 1: Delete the dead rule**

In `assets/input.css`, find and delete exactly this block (currently at lines 1006-1008, immediately before the `/* Flex group component styles */` comment):

```css
.collections-more__grid {
  margin-top: var(--grid-row-gap);
}
```

Leave every other `.collections-more*` rule in place unchanged (the trigger, label-swap, and chevron-rotation rules all still apply — only the nested-grid spacing rule is dead).

- [ ] **Step 2: Rebuild the compiled CSS**

Run:
```bash
npm run tailwind:build
```
Expected: exits 0. Confirm the deleted selector is gone and the rest survived:
```bash
grep -c "collections-more" assets/output.css
```
Expected: a nonzero count (the surviving rules are still present), and:
```bash
grep "collections-more__grid" assets/output.css
```
Expected: no output (rule fully removed).

- [ ] **Step 3: Commit**

```bash
git add assets/input.css assets/output.css
git commit -m "style(collections): remove dead nested-grid rule after responsive-count rework"
```

---

### Task 3: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the local preview**

Run:
```bash
npm run dev
```

- [ ] **Step 2: Configure distinct per-breakpoint counts on a test collection**

In the theme editor, on a collection with 10+ subcategories in its `custom.child` metafield, set (via the "collections" section's settings):
- Antal synlige underkategorier (mobil) → 4
- Antal synlige underkategorier (tablet) → 6
- Antal synlige underkategorier (desktop) → 8

- [ ] **Step 3: Verify mobile width**

Resize the preview (or browser devtools) to under 768px width.

Expected: exactly 4 cards visible, "Vis flere kategorier" trigger shown below. Opening it reveals all remaining cards; the label flips to "Vis færre" and the chevron rotates. Closing hides back down to 4.

- [ ] **Step 4: Verify tablet width**

Resize to 768–1023px width (reload not required — this is pure CSS, it should respond live to the resize).

Expected: exactly 6 cards visible by default (not 4), trigger present, same open/close behavior, revealing the rest.

- [ ] **Step 5: Verify desktop width**

Resize to 1024px+.

Expected: exactly 8 cards visible by default, trigger present, same behavior.

- [ ] **Step 6: Verify a decreasing-count edge case**

Temporarily set desktop count to 3 (lower than tablet's 6) on the same test collection.

Expected: at 1024px+, exactly 3 cards show by default (not 6, not 8) — confirms the mobile-first reset-then-hide CSS cascade correctly handles a smaller count at a larger breakpoint. Revert the setting back to 8 afterward.

- [ ] **Step 7: Verify the no-trigger-needed case**

On a collection with fewer subcategories than every breakpoint's configured count (e.g. 3 total, with mobile/tablet/desktop all still at their default of 6).

Expected: no trigger appears at any breakpoint, all 3 cards always visible — identical to the plain-grid behavior before either accordion task existed.

- [ ] **Step 8: Report results**

Tell the user exactly what was checked and what was seen at each breakpoint — per `CLAUDE.md`, UI changes require this browser verification before being called done.

---

## Self-Review Notes

- **Spec coverage:** three per-breakpoint settings replacing `visible_count`, step 1 ✓ (Task 1 schema); single grid, no Liquid split ✓ (Task 1 markup); mobile-first `:nth-child` reset-then-hide cascade including a decreasing-count case ✓ (Task 1 style block, verified in Task 3 Step 6); `:has()` reveal-all on open, no DOM-order dependency ✓ (Task 1 style block); per-breakpoint trigger visibility ✓ (Task 1 style block `.collections-more` display rules); dead `.collections-more__grid` rule removed ✓ (Task 2).
- **Type consistency:** `visible_count_mobile`/`visible_count_tablet`/`visible_count_desktop`/`total_count`/`smallest_visible_count`/`show_trigger` are used identically throughout Task 1's single file — no cross-task signature drift since this is a one-file change.
- **No placeholders:** every step has literal code and an exact command with expected output.
