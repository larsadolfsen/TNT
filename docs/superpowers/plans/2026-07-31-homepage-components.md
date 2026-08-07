# Homepage Component Build-out Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 7 missing homepage components (spec: `docs/superpowers/specs/2026-07-31-homepage-components-design.md`) and assemble a full, mobile-first homepage matching the textilogvoksdug.dk reference.

**Architecture:** Each component is a standard Shopify section (`sections/*.liquid`) with an editor-configurable `settings`/`blocks` schema, following this theme's existing conventions (scoped `{%- style -%}` blocks, `.grid-layout` span variables, `content_for 'blocks'`). Two new sections (`product-carousel`, `outlet-banner`) share a compact product-card snippet and a small vanilla-JS carousel controller, since this theme has no existing carousel implementation.

**Tech Stack:** Shopify Liquid, Tailwind v4 (compiled via `npm run tailwind:build`), vanilla JS (no framework — matches `assets/masonry.js` precedent), Material Symbols icon font (matches `blocks/trust-checkmark.liquid` precedent).

## Global Constraints

- No hardcoded merchant-facing copy — every text/image/link is a section or block `setting` (per `ai.md` §7).
- Use semantic color classes (`bg-card-light`, `text-primary`, etc.) from `snippets/css-variables.liquid` — never `bg-white`/`text-black` (per `ai.md` §2).
- Use `.grid-layout` with `--span-mobile` / `--span-expanded` / `--span-large` inline vars for any grid child spanning — never hand-rolled `grid-cols-*` Tailwind classes (per `ai.md` §6).
- After any Liquid/Tailwind class change, run `cmd /c npm run tailwind:build` before committing (per `ai.md` §4).
- Section/block schema `name`/`label`/preset fields: use plain Danish literal strings (matching the existing `blocks/trust-checkmark.liquid` pattern), not `t:` locale keys — this theme's `t:` keys only resolve in `locales/en.default.schema.json` (no Danish schema locale exists), so plain Danish labels are more useful to the merchant in the theme editor.
- No automated test harness exists for Liquid sections in this repo. Verification is manual: preview via the Claude Browser tool or local Shopify CLI theme preview, at mobile (375px) and desktop (1280px) widths, confirming settings drive all content and interactions work by touch and mouse. This is the stated, accepted testing gap from the spec.
- Commit after each task.

---

### Task 1: USP bar (icon + text strip)

**Files:**
- Create: `blocks/usp-item.liquid`
- Create: `sections/usp-bar.liquid`

**Interfaces:**
- Produces: `sections/usp-bar.liquid` accepts child blocks of type `usp-item` via `content_for 'blocks'`. No other task depends on this.

- [ ] **Step 1: Create the `usp-item` block**

`blocks/usp-item.liquid`:
```liquid
<div class="flex items-center gap-2.5 justify-center text-center sm:justify-start sm:text-left" {{ block.shopify_attributes }}>
  <span class="material-symbols-outlined text-2xl text-primary shrink-0">{{ block.settings.icon | default: 'check_circle' }}</span>
  <span class="text-xs sm:text-sm font-medium text-primary leading-tight">{{ block.settings.text }}</span>
</div>

{% schema %}
{
  "name": "USP punkt",
  "class": "shopify-block-usp-item",
  "settings": [
    {
      "type": "text",
      "id": "icon",
      "label": "Ikon (Material Symbols navn)",
      "default": "local_shipping",
      "info": "F.eks. local_shipping, eco, schedule, verified"
    },
    {
      "type": "text",
      "id": "text",
      "label": "Tekst",
      "default": "Fri fragt over 599 kr"
    }
  ],
  "presets": [
    { "name": "USP punkt" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create the `usp-bar` section**

`sections/usp-bar.liquid`:
```liquid
{%- style -%}
  #shopify-section-{{ section.id }} .usp-bar-grid {
    --section-span-mobile: 2;
    --section-span-expanded: 4;
    --section-span-large: 4;
    --grid-gap: 16px;
  }
{%- endstyle -%}

<div class="py-4 px-4 bg-card-light border-y border-outline-variant/40">
  <div class="grid-layout usp-bar-grid max-w-(--page-width) mx-auto">
    {% content_for 'blocks' %}
  </div>
</div>

{% schema %}
{
  "name": "USP bjælke",
  "class": "shopify-section-usp-bar",
  "blocks": [
    { "type": "usp-item" }
  ],
  "settings": [],
  "presets": [
    {
      "name": "USP bjælke",
      "blocks": [
        { "type": "usp-item", "settings": { "icon": "local_shipping", "text": "Fri fragt over 599 kr" } },
        { "type": "usp-item", "settings": { "icon": "eco", "text": "Öko-Tex certificeret" } },
        { "type": "usp-item", "settings": { "icon": "schedule", "text": "Afsendt samme dag" } },
        { "type": "usp-item", "settings": { "icon": "inventory_2", "text": "Leveres rullet, ikke foldet" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Build CSS and preview**

Run: `cmd /c npm run tailwind:build`
Then preview: add a "USP bjælke" section anywhere in `templates/index.json` (theme editor or by hand — see Task 9 for the real placement) and check in the Claude Browser at 375px and 1280px widths that the 4 items wrap to 2x2 on mobile and stay in a single row on desktop, with no horizontal scrollbar.

- [ ] **Step 4: Commit**

```bash
git add blocks/usp-item.liquid sections/usp-bar.liquid
git commit -m "Add USP bar section with icon+text blocks"
```

---

### Task 2: Hero section

**Files:**
- Create: `blocks/hero-card.liquid`
- Create: `sections/hero.liquid`

**Interfaces:**
- Produces: `sections/hero.liquid` accepts child blocks of type `hero-card` (max 3, enforced by editor via `limit`).

- [ ] **Step 1: Create the `hero-card` block**

`blocks/hero-card.liquid`:
```liquid
<a
  href="{{ block.settings.link | default: '#' }}"
  class="relative flex-none w-[72%] xs:w-[60%] sm:w-auto snap-start rounded-2xl overflow-hidden group block aspect-3/4 sm:aspect-4/5"
  {{ block.shopify_attributes }}
>
  {%- if block.settings.image != blank -%}
    {{ block.settings.image | image_url: width: 800 | image_tag: class: 'absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300', loading: 'lazy' }}
  {%- else -%}
    <div class="absolute inset-0 bg-card-high"></div>
  {%- endif -%}
  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"></div>
  <span class="absolute bottom-4 left-4 right-4 text-white font-bold text-lg leading-tight">{{ block.settings.title }}</span>
</a>

{% schema %}
{
  "name": "Hero kategori-kort",
  "class": "shopify-block-hero-card",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "Billede" },
    { "type": "text", "id": "title", "label": "Titel", "default": "Voksdug" },
    { "type": "url", "id": "link", "label": "Link" }
  ],
  "presets": [
    { "name": "Hero kategori-kort" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create the `hero` section**

`sections/hero.liquid`:
```liquid
<div class="px-4 sm:px-6 py-8 sm:py-12 max-w-(--page-width) mx-auto">
  <div class="mb-6 sm:mb-8 sm:text-center">
    {%- if section.settings.heading != blank -%}
      <h1 class="text-2xl sm:text-4xl font-bold text-primary leading-tight">{{ section.settings.heading }}</h1>
    {%- endif -%}
    {%- if section.settings.subheading != blank -%}
      <p class="mt-2 text-sm sm:text-base text-primary/70 sm:max-w-xl sm:mx-auto">{{ section.settings.subheading }}</p>
    {%- endif -%}
  </div>

  <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
    {% content_for 'blocks' %}
  </div>
</div>

{% schema %}
{
  "name": "Hero",
  "class": "shopify-section-hero",
  "blocks": [
    { "type": "hero-card", "limit": 3 }
  ],
  "settings": [
    { "type": "text", "id": "heading", "label": "Overskrift", "default": "Voksdug og textil til hver anledning" },
    { "type": "text", "id": "subheading", "label": "Underoverskrift", "default": "Skæres efter mål og sendes samme dag." }
  ],
  "presets": [
    {
      "name": "Hero",
      "blocks": [
        { "type": "hero-card", "settings": { "title": "Voksdug" } },
        { "type": "hero-card", "settings": { "title": "Textil" } },
        { "type": "hero-card", "settings": { "title": "Gennemsigtig voksdug" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Build CSS and preview**

Run: `cmd /c npm run tailwind:build`
Preview at 375px: confirm the 3 cards form a horizontal scroll-snap row with a visible partial 4th-edge peek (i.e. the 2nd card is partially cut off at the right edge, signalling more content). At 1280px: confirm a static 3-column grid with no scrolling.

- [ ] **Step 4: Commit**

```bash
git add blocks/hero-card.liquid sections/hero.liquid
git commit -m "Add hero section with scroll-snap category cards"
```

---

### Task 3: Shared carousel JS controller

**Files:**
- Create: `assets/carousel.js`

**Interfaces:**
- Produces: a `Carousel` custom element (`<carousel-track>`) that any section can wrap its scroll-snap row in. Consumed by Task 5 (`product-carousel`) and Task 7 (`outlet-banner`).
- Contract: wrap the scrollable row in `<carousel-track class="..."><div class="carousel-track-inner" data-carousel-inner>...items...</div><button data-carousel-prev>...</button><button data-carousel-next>...</button></carousel-track>`. The element scrolls `data-carousel-inner` by one item-width on prev/next click and hides the buttons below the `sm` breakpoint (touch scroll only on mobile).

- [ ] **Step 1: Write the carousel controller**

`assets/carousel.js`:
```javascript
class CarouselTrack extends HTMLElement {
  connectedCallback() {
    this.inner = this.querySelector('[data-carousel-inner]');
    this.prevBtn = this.querySelector('[data-carousel-prev]');
    this.nextBtn = this.querySelector('[data-carousel-next]');
    if (!this.inner) return;

    this.prevBtn?.addEventListener('click', () => this.scrollByCard(-1));
    this.nextBtn?.addEventListener('click', () => this.scrollByCard(1));
    this.inner.addEventListener('scroll', () => this.updateButtonState(), { passive: true });
    this.updateButtonState();
  }

  scrollByCard(direction) {
    const card = this.inner.querySelector('[data-carousel-item]');
    if (!card) return;
    const style = window.getComputedStyle(this.inner);
    const gap = parseFloat(style.columnGap || style.gap || '0');
    const distance = (card.getBoundingClientRect().width + gap) * direction;
    this.inner.scrollBy({ left: distance, behavior: 'smooth' });
  }

  updateButtonState() {
    if (!this.prevBtn || !this.nextBtn) return;
    const maxScroll = this.inner.scrollWidth - this.inner.clientWidth;
    this.prevBtn.disabled = this.inner.scrollLeft <= 4;
    this.nextBtn.disabled = this.inner.scrollLeft >= maxScroll - 4;
  }
}

customElements.define('carousel-track', CarouselTrack);
```

- [ ] **Step 2: Verify it loads without errors**

This file has no standalone test surface (it's a custom element definition with no visible output until used by a section). Verification happens in Task 5's preview step, where a browser console check for `customElements.get('carousel-track')` returning a defined class confirms registration.

- [ ] **Step 3: Commit**

```bash
git add assets/carousel.js
git commit -m "Add carousel-track custom element for scroll-snap product carousels"
```

---

### Task 4: Shared compact product-card snippet

**Files:**
- Create: `snippets/product-card-compact.liquid`

**Interfaces:**
- Consumes: a `product` variable (Shopify product object) and an optional `show_savings_badge` boolean, passed via `{% render 'product-card-compact', product: product, show_savings_badge: true %}`.
- Produces: a `<a data-carousel-item>` card markup consumed by Task 5 and Task 7.

- [ ] **Step 1: Write the snippet**

`snippets/product-card-compact.liquid`:
```liquid
{%- liquid
  assign current_variant = product.selected_or_first_available_variant
  assign display_price = current_variant.price
  assign compare_price = current_variant.compare_at_price
  assign on_sale = false
  if compare_price != blank and compare_price > display_price
    assign on_sale = true
    assign savings = compare_price | minus: display_price | times: 100 | divided_by: compare_price
  endif
-%}
<a
  href="{{ product.url }}"
  data-carousel-item
  class="flex-none w-[42%] xs:w-[34%] sm:w-[220px] snap-start rounded-2xl border border-outline-variant/40 bg-card-light overflow-hidden block"
>
  <div class="relative aspect-square bg-card-high">
    {%- if product.featured_image != blank -%}
      {{ product.featured_image | image_url: width: 500 | image_tag: class: 'w-full h-full object-cover', loading: 'lazy' }}
    {%- endif -%}
    {%- if show_savings_badge and on_sale -%}
      <span class="absolute top-2 left-2 bg-[#c8102e] text-white text-xs font-bold rounded-full px-2 py-1">-{{ savings }}%</span>
    {%- endif -%}
  </div>
  <div class="p-3">
    <p class="text-sm font-medium text-primary line-clamp-2 leading-snug">{{ product.title }}</p>
    <div class="mt-1.5 flex items-baseline gap-2">
      <span class="text-sm font-bold text-primary">{{ display_price | money }}</span>
      {%- if on_sale -%}
        <span class="text-xs text-primary/50 line-through">{{ compare_price | money }}</span>
      {%- endif -%}
    </div>
  </div>
</a>
```

- [ ] **Step 2: Commit**

```bash
git add snippets/product-card-compact.liquid
git commit -m "Add shared compact product-card snippet with sale-price support"
```

(Verified visually as part of Task 5 and Task 7, where it's first rendered.)

---

### Task 5: Product carousel section (Recommended / New products)

**Files:**
- Create: `sections/product-carousel.liquid`

**Interfaces:**
- Consumes: `snippets/product-card-compact.liquid` (Task 4), `assets/carousel.js` (Task 3, loaded via `{{ 'carousel.js' | asset_url | script_tag }}`).
- Produces: a section type `product-carousel`, placed twice on the homepage in Task 9 (once as "Anbefalede produkter", once as "Nye produkter") with different `collection` settings.

- [ ] **Step 1: Write the section**

`sections/product-carousel.liquid`:
```liquid
<div class="px-4 sm:px-6 py-8 max-w-(--page-width) mx-auto">
  {%- if section.settings.heading != blank -%}
    <h2 class="text-xl sm:text-2xl font-bold text-primary mb-4">{{ section.settings.heading }}</h2>
  {%- endif -%}

  <carousel-track class="relative block">
    <div data-carousel-inner class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden">
      {%- for product in section.settings.collection.products limit: section.settings.product_limit -%}
        {% render 'product-card-compact', product: product, show_savings_badge: true %}
      {%- endfor -%}
    </div>
    <button type="button" data-carousel-prev aria-label="Forrige" class="hidden sm:flex absolute -left-4 top-1/3 -translate-y-1/2 w-10 h-10 rounded-full bg-card-light border border-outline-variant items-center justify-center disabled:opacity-30">
      <span class="material-symbols-outlined text-lg">chevron_left</span>
    </button>
    <button type="button" data-carousel-next aria-label="Næste" class="hidden sm:flex absolute -right-4 top-1/3 -translate-y-1/2 w-10 h-10 rounded-full bg-card-light border border-outline-variant items-center justify-center disabled:opacity-30">
      <span class="material-symbols-outlined text-lg">chevron_right</span>
    </button>
  </carousel-track>
</div>

{{ 'carousel.js' | asset_url | script_tag }}

{% schema %}
{
  "name": "Produkt-karrusel",
  "class": "shopify-section-product-carousel",
  "settings": [
    { "type": "text", "id": "heading", "label": "Overskrift", "default": "Anbefalede produkter" },
    { "type": "collection", "id": "collection", "label": "Kollektion" },
    { "type": "range", "id": "product_limit", "min": 4, "max": 12, "step": 1, "label": "Antal produkter", "default": 6 }
  ],
  "presets": [
    { "name": "Produkt-karrusel" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Build CSS and preview**

Run: `cmd /c npm run tailwind:build`
Preview at 375px: swipe the row by touch/drag and confirm it snaps card-to-card. At 1280px: click the left/right arrow buttons and confirm they scroll by one card width and disable at each end. Open the browser console and confirm no JS errors.

- [ ] **Step 3: Commit**

```bash
git add sections/product-carousel.liquid
git commit -m "Add product carousel section for recommended/new products"
```

---

### Task 6: Value props section

**Files:**
- Create: `blocks/value-prop-item.liquid`
- Create: `sections/value-props.liquid`

**Interfaces:**
- Produces: section type `value-props` accepting `value-prop-item` blocks, plus built-in Trustpilot rating settings (no dependency on other tasks).

- [ ] **Step 1: Create the `value-prop-item` block**

`blocks/value-prop-item.liquid`:
```liquid
<div class="flex flex-col items-center text-center gap-2 p-4" {{ block.shopify_attributes }}>
  <span class="material-symbols-outlined text-3xl text-primary">{{ block.settings.icon | default: 'check_circle' }}</span>
  <span class="text-sm font-medium text-primary">{{ block.settings.text }}</span>
</div>

{% schema %}
{
  "name": "Fordel",
  "class": "shopify-block-value-prop-item",
  "settings": [
    { "type": "text", "id": "icon", "label": "Ikon (Material Symbols navn)", "default": "verified" },
    { "type": "text", "id": "text", "label": "Tekst", "default": "Öko-Tex certificeret" }
  ],
  "presets": [
    { "name": "Fordel" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Create the `value-props` section**

`sections/value-props.liquid`:
```liquid
{%- style -%}
  #shopify-section-{{ section.id }} .value-props-grid {
    --section-span-mobile: 2;
    --section-span-expanded: 4;
    --section-span-large: 4;
    --grid-gap: 8px;
  }
{%- endstyle -%}

<div class="px-4 sm:px-6 py-8 max-w-(--page-width) mx-auto">
  {%- if section.settings.enable_trustpilot -%}
    <div class="flex items-center justify-center gap-2 mb-6 sm:hidden">
      <span class="material-symbols-outlined text-xl text-[#00b67a]">star</span>
      <span class="text-sm font-bold text-primary">{{ section.settings.trustpilot_rating }}/5</span>
      <span class="text-sm text-primary/60">({{ section.settings.trustpilot_review_count }} anmeldelser)</span>
    </div>
  {%- endif -%}

  <div class="grid-layout value-props-grid">
    {% content_for 'blocks' %}
    {%- if section.settings.enable_trustpilot -%}
      <div class="hidden sm:flex flex-col items-center text-center gap-2 p-4" style="--span-mobile: 2; --span-expanded: 4; --span-large: 4;">
        <span class="material-symbols-outlined text-3xl text-[#00b67a]">star</span>
        <span class="text-sm font-bold text-primary">{{ section.settings.trustpilot_rating }}/5 · {{ section.settings.trustpilot_review_count }} anmeldelser</span>
      </div>
    {%- endif -%}
  </div>
</div>

{% schema %}
{
  "name": "Fordele",
  "class": "shopify-section-value-props",
  "blocks": [
    { "type": "value-prop-item" }
  ],
  "settings": [
    { "type": "checkbox", "id": "enable_trustpilot", "label": "Vis Trustpilot badge", "default": true },
    { "type": "text", "id": "trustpilot_rating", "label": "Trustpilot vurdering", "default": "4.9" },
    { "type": "text", "id": "trustpilot_review_count", "label": "Antal anmeldelser", "default": "873" }
  ],
  "presets": [
    {
      "name": "Fordele",
      "blocks": [
        { "type": "value-prop-item", "settings": { "icon": "verified", "text": "Öko-Tex certificeret" } },
        { "type": "value-prop-item", "settings": { "icon": "local_shipping", "text": "Fri fragt over 599 kr" } },
        { "type": "value-prop-item", "settings": { "icon": "recycling", "text": "Ansvarlig produktion" } }
      ]
    }
  ]
}
{% endschema %}
```

- [ ] **Step 3: Build CSS and preview**

Run: `cmd /c npm run tailwind:build`
Preview at 375px: confirm the Trustpilot rating collapses to a single compact badge above the grid, and the grid itself shows 2 columns. At 1280px: confirm the standalone mobile badge is hidden and a 4th grid tile shows the Trustpilot badge inline instead.

- [ ] **Step 4: Commit**

```bash
git add blocks/value-prop-item.liquid sections/value-props.liquid
git commit -m "Add value props section with Trustpilot rating badge"
```

---

### Task 7: Outlet banner section

**Files:**
- Create: `sections/outlet-banner.liquid`

**Interfaces:**
- Consumes: `snippets/product-card-compact.liquid` (Task 4), `assets/carousel.js` (Task 3, same `carousel-track` element).
- Produces: section type `outlet-banner`, placed once on the homepage in Task 9.

- [ ] **Step 1: Write the section**

`sections/outlet-banner.liquid`:
```liquid
<div class="px-4 sm:px-6 py-8 max-w-(--page-width) mx-auto bg-card-light rounded-3xl">
  {%- if section.settings.heading != blank -%}
    <h2 class="text-xl sm:text-2xl font-bold text-primary mb-1">{{ section.settings.heading }}</h2>
  {%- endif -%}
  {%- if section.settings.subheading != blank -%}
    <p class="text-sm text-primary/70 mb-4">{{ section.settings.subheading }}</p>
  {%- endif -%}

  <carousel-track class="relative block">
    <div data-carousel-inner class="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden">
      {%- assign shown = 0 -%}
      {%- for product in section.settings.collection.products -%}
        {%- if product.compare_at_price_max > product.price and shown < section.settings.product_limit -%}
          {% render 'product-card-compact', product: product, show_savings_badge: true %}
          {%- assign shown = shown | plus: 1 -%}
        {%- endif -%}
      {%- endfor -%}
    </div>
    <button type="button" data-carousel-prev aria-label="Forrige" class="hidden sm:flex absolute -left-4 top-1/3 -translate-y-1/2 w-10 h-10 rounded-full bg-card-light border border-outline-variant items-center justify-center disabled:opacity-30">
      <span class="material-symbols-outlined text-lg">chevron_left</span>
    </button>
    <button type="button" data-carousel-next aria-label="Næste" class="hidden sm:flex absolute -right-4 top-1/3 -translate-y-1/2 w-10 h-10 rounded-full bg-card-light border border-outline-variant items-center justify-center disabled:opacity-30">
      <span class="material-symbols-outlined text-lg">chevron_right</span>
    </button>
  </carousel-track>
</div>

{{ 'carousel.js' | asset_url | script_tag }}

{% schema %}
{
  "name": "Udsalgsbanner",
  "class": "shopify-section-outlet-banner",
  "settings": [
    { "type": "text", "id": "heading", "label": "Overskrift", "default": "Udsalg" },
    { "type": "text", "id": "subheading", "label": "Underoverskrift", "default": "Udvalgte varer med rabat, så længe lager haves." },
    { "type": "collection", "id": "collection", "label": "Kollektion (filtreres til varer med rabat)" },
    { "type": "range", "id": "product_limit", "min": 3, "max": 10, "step": 1, "label": "Maks. antal varer", "default": 5 }
  ],
  "presets": [
    { "name": "Udsalgsbanner" }
  ]
}
{% endschema %}
```

Note: `{{ 'carousel.js' | asset_url | script_tag }}` is safe to include twice on the same page (Task 5 also includes it) — the browser caches and only executes the `customElements.define` once; a duplicate `customElements.define('carousel-track', ...)` call would throw, so this relies on the script tag being idempotent at the network/cache level, not re-registering the element. If both sections render on the same page and a duplicate-registration error appears during preview, fix by moving the script tag out of both sections into `layout/theme.liquid` instead (one include for the whole page) before proceeding to Task 9.

- [ ] **Step 2: Build CSS and preview**

Run: `cmd /c npm run tailwind:build`
Preview with a collection that has at least one on-sale product: confirm only on-sale products appear, each with a "-X%" badge and struck-through compare price. Confirm carousel scroll/arrow behavior matches Task 5.

- [ ] **Step 3: Commit**

```bash
git add sections/outlet-banner.liquid
git commit -m "Add outlet banner section for sale products"
```

---

### Task 8: Content block section (brand story / care teaser / eco-commitment)

**Files:**
- Create: `sections/content-block.liquid`

**Interfaces:**
- Produces: section type `content-block`, placed 3x on the homepage in Task 9 with different settings/presets, and reusable later on the `vask-og-pleje` page (out of scope here, per spec).

- [ ] **Step 1: Write the section**

`sections/content-block.liquid`:
```liquid
<div class="px-4 sm:px-6 py-8 max-w-(--page-width) mx-auto {% if section.settings.alignment == 'center' %}text-center{% endif %}">
  <div class="{% if section.settings.narrow %}sm:max-w-2xl{% endif %} {% if section.settings.alignment == 'center' %}mx-auto{% endif %}">
    {%- if section.settings.heading != blank -%}
      <h2 class="text-xl sm:text-2xl font-bold text-primary mb-3">{{ section.settings.heading }}</h2>
    {%- endif -%}
    {%- if section.settings.body != blank -%}
      <div class="prose prose-sm sm:prose-base text-primary/80 max-w-none">{{ section.settings.body }}</div>
    {%- endif -%}
    {%- if section.settings.link_text != blank and section.settings.link != blank -%}
      <a href="{{ section.settings.link }}" class="inline-block mt-4 text-sm font-semibold text-primary underline underline-offset-4">{{ section.settings.link_text }}</a>
    {%- endif -%}
  </div>
</div>

{% schema %}
{
  "name": "Tekstblok",
  "class": "shopify-section-content-block",
  "settings": [
    { "type": "text", "id": "heading", "label": "Overskrift" },
    { "type": "richtext", "id": "body", "label": "Brødtekst" },
    { "type": "text", "id": "link_text", "label": "Link-tekst" },
    { "type": "url", "id": "link", "label": "Link" },
    { "type": "checkbox", "id": "narrow", "label": "Smal bredde (læsevenlig)", "default": true },
    {
      "type": "select",
      "id": "alignment",
      "label": "Justering",
      "options": [
        { "value": "left", "label": "Venstre" },
        { "value": "center", "label": "Centreret" }
      ],
      "default": "center"
    }
  ],
  "presets": [
    { "name": "Tekstblok" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Build CSS and preview**

Run: `cmd /c npm run tailwind:build`
Preview at 375px and 1280px: confirm centered/narrow layout reads comfortably (line length not too wide on desktop), and left-aligned option works when toggled in the editor.

- [ ] **Step 3: Commit**

```bash
git add sections/content-block.liquid
git commit -m "Add reusable content-block section for text+link content"
```

---

### Task 9: Homepage assembly

**Files:**
- Modify: `templates/index.json`

**Interfaces:**
- Consumes: all section types from Tasks 1–8.

- [ ] **Step 1: Replace the placeholder homepage with the full section order**

`templates/index.json`:
```json
{
  "sections": {
    "usp_bar_top": {
      "type": "usp-bar",
      "blocks": {
        "usp1": { "type": "usp-item", "settings": { "icon": "local_shipping", "text": "Fri fragt over 599 kr" } },
        "usp2": { "type": "usp-item", "settings": { "icon": "eco", "text": "Öko-Tex certificeret" } },
        "usp3": { "type": "usp-item", "settings": { "icon": "schedule", "text": "Afsendt samme dag" } },
        "usp4": { "type": "usp-item", "settings": { "icon": "inventory_2", "text": "Leveres rullet, ikke foldet" } }
      },
      "block_order": ["usp1", "usp2", "usp3", "usp4"],
      "settings": {}
    },
    "hero_main": {
      "type": "hero",
      "blocks": {
        "hc1": { "type": "hero-card", "settings": { "title": "Voksdug" } },
        "hc2": { "type": "hero-card", "settings": { "title": "Textil" } },
        "hc3": { "type": "hero-card", "settings": { "title": "Gennemsigtig voksdug" } }
      },
      "block_order": ["hc1", "hc2", "hc3"],
      "settings": {
        "heading": "Voksdug og textil til hver anledning",
        "subheading": "Skæres efter mål og sendes samme dag."
      }
    },
    "carousel_recommended": {
      "type": "product-carousel",
      "settings": {
        "heading": "Anbefalede produkter",
        "product_limit": 6
      }
    },
    "collections_47hUyM": {
      "type": "collections",
      "name": "t:general.collections_grid",
      "settings": {
        "grid_item_width": "collections--full",
        "grid_gap": 10
      }
    },
    "value_props_main": {
      "type": "value-props",
      "blocks": {
        "vp1": { "type": "value-prop-item", "settings": { "icon": "verified", "text": "Öko-Tex certificeret" } },
        "vp2": { "type": "value-prop-item", "settings": { "icon": "local_shipping", "text": "Fri fragt over 599 kr" } },
        "vp3": { "type": "value-prop-item", "settings": { "icon": "recycling", "text": "Ansvarlig produktion" } }
      },
      "block_order": ["vp1", "vp2", "vp3"],
      "settings": {
        "enable_trustpilot": true,
        "trustpilot_rating": "4.9",
        "trustpilot_review_count": "873"
      }
    },
    "carousel_new": {
      "type": "product-carousel",
      "settings": {
        "heading": "Nye produkter",
        "product_limit": 6
      }
    },
    "outlet_main": {
      "type": "outlet-banner",
      "settings": {
        "heading": "Udsalg",
        "subheading": "Udvalgte varer med rabat, så længe lager haves.",
        "product_limit": 5
      }
    },
    "brand_story": {
      "type": "content-block",
      "settings": {
        "heading": "Om Textil og Voksdug",
        "body": "<p>Vi har leveret voksdug og textil skåret efter mål siden [år]. Alle vores stoffer er Öko-Tex certificerede og sendes direkte fra vores lager.</p>",
        "narrow": true,
        "alignment": "center"
      }
    },
    "care_teaser": {
      "type": "content-block",
      "settings": {
        "heading": "Sådan passer du på din dug",
        "body": "<p>Læs vores fulde guide til rengøring og opbevaring af voksdug og textil.</p>",
        "link_text": "Se vask og pleje-guide",
        "link": "/vask-og-pleje",
        "narrow": true,
        "alignment": "center"
      }
    },
    "eco_commitment": {
      "type": "content-block",
      "settings": {
        "heading": "Öko-Tex certificeret",
        "body": "<p>Alle vores produkter er testet og certificeret fri for skadelige stoffer.</p>",
        "narrow": true,
        "alignment": "center"
      }
    }
  },
  "order": [
    "usp_bar_top",
    "hero_main",
    "carousel_recommended",
    "collections_47hUyM",
    "value_props_main",
    "carousel_new",
    "outlet_main",
    "brand_story",
    "care_teaser",
    "eco_commitment"
  ]
}
```

Note: `collection` settings (`carousel_recommended`, `carousel_new`, `outlet_main`) are intentionally left unset here — assign an actual collection to each in the Shopify theme editor after this is deployed, since no collection handles were specified in the design/spec. Until assigned, those sections render an empty (but not broken) product row.

- [ ] **Step 2: Preview the full homepage**

Preview `/` at 375px: scroll top to bottom and confirm every section renders in order, no layout shift/overflow, all carousels swipe correctly, no console errors. Preview at 1280px: same check, confirming grid/carousel-arrow behavior.

- [ ] **Step 3: Commit**

```bash
git add templates/index.json
git commit -m "Assemble full homepage from new sections"
```

---

## Task Order & Dependencies

Tasks 1, 2, 4, 6, 8 have no dependencies on each other and can run in parallel. Task 3 (carousel JS) has no dependencies. Tasks 5 and 7 depend on Tasks 3 and 4. Task 9 depends on all of Tasks 1–8.
