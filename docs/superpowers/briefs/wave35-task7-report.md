# Task 7 Report — Icon Markup Migration

## Summary

Successfully migrated 20 inline icon `<span class="material-symbols-outlined">` elements to use the `snippets/icon.liquid` primitive across 4 liquid files. 1 occurrence was deliberately skipped (JS template string). All migrations follow the mechanical rule exactly. Package version bumped to 1.0.121. Theme check: 24 warnings baseline → 24 warnings after (no regression).

## Occurrence Accounting

| File | Spans Found | Spans Migrated | Spans Skipped | Notes |
|------|-------------|----------------|---------------|-------|
| `snippets/breadcrumbs-nav.liquid` | 17 | 17 | 0 | All chevron_right icons migrated (desktop breadcrumb trail) |
| `snippets/breadcrumbs-mobile-link.liquid` | 1 | 1 | 0 | chevron_left icon migrated |
| `sections/collection-subcollections.liquid` | 1 | 1 | 0 | check icon with style attribute migrated |
| `sections/collections.liquid` | 1 | 1 | 0 | image icon migrated (fallback placeholder) |
| `blocks/product-price.liquid` | 1 | 0 | 1 | info icon inside JS template string (see skips below) |
| **Totals** | **21** | **20** | **1** | |

## Surviving material-symbols-outlined References

Grep verified: 2 occurrences remain outside `snippets/icon.liquid` (justified):

### 1. `blocks/product-price.liquid:234` — SKIPPED (JS Template String)
```javascript
<span class="material-symbols-outlined text-[16px] cursor-help text-primary/45 hover:text-primary/70 flex items-center" title="Vejledende udsalgspris">info</span>
```
**Justification**: This span lives inside a JavaScript template string (backtick `` ` ``) used to build HTML dynamically. Liquid `{% render %}` cannot be invoked inside a JS string at runtime; the string is evaluated by JavaScript, not Liquid. Leaving it inline preserves correct behavior. Per brief: "if the span markup lives inside a JavaScript string (JS building HTML), LEAVE IT UNCHANGED."

### 2. `sections/main-collection.liquid:97` — NOT A SPAN (CSS Selector)
```css
.material-symbols-outlined.filled-star {
  font-variation-settings: 'FILL' 1;
}
```
**Justification**: This is a CSS rule selector, not inline markup. Correctly ignored per brief criteria.

### 3. `blocks/accordion.liquid:25` — NOT A SPAN (JS Selector)
```javascript
const icon = this.querySelector('.material-symbols-outlined');
```
**Justification**: This is a DOM selector inside JavaScript, not inline HTML markup. Correctly ignored per brief criteria.

### 4. `blocks/product-accordions.liquid:43` — NOT A SPAN (JS Selector)
```javascript
const icon = this.querySelector(".material-symbols-outlined");
```
**Justification**: This is a DOM selector inside JavaScript, not inline HTML markup. Correctly ignored per brief criteria.

## Migration Details

All 20 migrated spans followed the mechanical rule exactly:

### Rule Application Example (breadcrumbs-nav.liquid, line 101)

**Before:**
```liquid
<span class="{{ forside_class }} material-symbols-outlined text-[16px]">chevron_right</span>
```

**After:**
```liquid
{%- capture icon_class -%}{{ forside_class }}{% unless forside_class == blank %} {% endunless %}text-[16px]{%- endcapture -%}
{% render 'icon', name: 'chevron_right', class: icon_class %}
```

**Rationale**: The class attribute contains a Liquid expression (`{{ forside_class }}`). Per brief instructions for "conditional Liquid INSIDE its attributes," the class string was assigned to a capture variable to handle spacing correctly (forside_class is either empty or "breadcrumb-collapsed-item"), then passed as the `class:` argument.

### Representative Examples

**Static Classes (collection-subcollections.liquid, line 96):**
```liquid
Before: <span class="material-symbols-outlined text-xs mr-1 select-none pointer-events-none" style="font-size: 14px; font-weight: 900;">check</span>

After:  {% render 'icon', name: 'check', class: 'text-xs mr-1 select-none pointer-events-none', style: "font-size: 14px; font-weight: 900;" %}
```

**Simple Classes (collections.liquid, line 48):**
```liquid
Before: <span class="material-symbols-outlined text-4xl">image</span>

After:  {% render 'icon', name: 'image', class: 'text-4xl' %}
```

## Theme Check Results

- **Baseline (commit 2f4e846)**: 24 warnings
- **After migration**: 24 warnings
- **Regression**: None ✓

All warnings are pre-existing (UnusedAssign and RemoteAsset rules, unrelated to icon migrations).

## Files Modified

1. `snippets/breadcrumbs-nav.liquid` — 17 spans migrated
2. `snippets/breadcrumbs-mobile-link.liquid` — 1 span migrated
3. `sections/collection-subcollections.liquid` — 1 span migrated (with style attribute)
4. `sections/collections.liquid` — 1 span migrated
5. `package.json` — version 1.0.120 → 1.0.121

## Files Not Modified (Correctly)

- `snippets/icon.liquid` — template definition only
- `blocks/product-price.liquid` — 1 occurrence skipped (JS string)
- `sections/main-collection.liquid` — CSS selector only
- `blocks/accordion.liquid` — JS selector only
- `blocks/product-accordions.liquid` — JS selector only

## Verification

- `grep -rn "material-symbols-outlined" --include=*.liquid .` confirms only justified non-span occurrences remain
- All 20 migrations are mechanical and follow the brief rule exactly
- Theme check passes without regression
- Rendering identity deferred to controller's browser check (all icons render via the unified `icon.liquid` primitive)
