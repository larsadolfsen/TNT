# Produktkort-typografi-migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrér de fem filer der udgør produktkortet til `.type-*`-typografisystemet, og fjern alle forekomster af tekst under 14px der ikke er en versaliseret label/badge.

**Architecture:** Ren Liquid/CSS-klasseudskiftning. Ingen ny CSS eller nye roller tilføjes — kun eksisterende `.type-*`-primitiver, `.type-badge`-surface og `text-style`-roller (`caption`, `badge-label`) anvendes. Hver fil redigeres for sig og verificeres uafhængigt.

**Tech Stack:** Shopify Liquid, Tailwind CSS v4 (`assets/input.css`), `shopify theme check`.

## Global Constraints

- Ingen `!important` i CSS.
- Ingen ny hardkodet brugervendt tekst — kun klasseændringer, ingen copy-ændringer.
- Version bumpes IKKE per opgave/branch — kun ved merge til `main` via `npm run bump-version`, som sidste skridt før push (se CLAUDE.md).
- Efter enhver Tailwind-klasseændring skal `npm run tailwind:build` køres og `assets/output.css` committes.
- `savings-badge.liquid`'s `lg`-variant (produktsiden) må IKKE ændres — kun `sm`.
- `unit-price.liquid`s `unit_price_size_class`-navn og parametrenes betydning (`'xs'`/`'sm'`/`'base'`) bevares uændret for kaldere — kun hvilke klasser der udskrives, ændres.
- Titel unificeres på tværs af `is_minimal` og standard til samme klassestreng (bevidst, godkendt).
- Log alle rettede sub-14px-forekomster i `docs/failure-log.md` med næste ledige `F-NNN`, i samme commit som sidste opgave.

---

### Task 1: Badges — `savings-badge.liquid` og `product-card-image.liquid`

**Files:**
- Modify: `snippets/savings-badge.liquid:22-29` (kun `else`-grenen / `sm`-variant, IKKE `if size == 'lg'`-grenen)
- Modify: `snippets/product-card-image.liquid:38`

**Interfaces:**
- Consumes: `text-style.liquid`'s `role: 'badge-label'` (allerede findes, printer `type-xs type-bold type-caps`), `.type-badge` / `.type-badge--important` (allerede findes i `assets/input.css:210-220`).
- Produces: intet nyt — begge filers offentlige `{% render %}`-signaturer er uændrede.

- [ ] **Step 1: Ret `savings-badge.liquid`s `sm`-gren**

I `snippets/savings-badge.liquid`, erstat linje 26 (`assign badge_class = 'bg-important text-white text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase'`) med:

```liquid
assign badge_class = 'type-badge type-badge--important'
```

Og linje 30 (`<span class="product-savings-badge inline-block {{ badge_class }}">{{ badge_text }}</span>`) — badge-teksten skal nu også have `badge-label`-rollens klasser. Erstat hele linjen med:

```liquid
<span class="product-savings-badge inline-block {{ badge_class }} {% render 'text-style', role: 'badge-label' %}">{{ badge_text }}</span>
```

`lg`-grenen (linje 22-24) røres ikke.

- [ ] **Step 2: Ret `product-card-image.liquid`s tag-badge**

I `snippets/product-card-image.liquid`, erstat linje 38:

```liquid
<span class="absolute top-2 left-2 bg-primary text-on-primary {% if is_minimal %}text-[9px] sm:text-[11px]{% else %}text-[11px]{% endif %} font-bold px-2 py-0.5 rounded-md tracking-wider uppercase z-10">{{ badge }}</span>
```

med:

```liquid
<span class="absolute top-2 left-2 type-badge {% render 'text-style', role: 'badge-label' %} z-10">{{ badge }}</span>
```

(`type-badge` leverer `background: var(--color-primary); color: var(--color-on-primary)` — samme farver som før via `bg-primary text-on-primary`, plus padding/radius, så `rounded-md`/`px-2 py-0.5` droppes som redundante.)

- [ ] **Step 3: Kør theme check**

Run: `npx shopify theme check`
Expected: Ingen nye fejl/warnings i de to filer.

- [ ] **Step 4: Kør tailwind build**

Run: `npm run tailwind:build`
Expected: Kommando lykkes, `assets/output.css` opdateres (indeholder ikke længere `text-[9px]`/`text-[11px]` for disse call sites — `type-badge`/`.type-xs` var allerede genereret fra basefundamentet).

- [ ] **Step 5: Commit**

```bash
git add snippets/savings-badge.liquid snippets/product-card-image.liquid assets/output.css
git commit -m "feat(typography): migrate product-card badges to .type-badge + badge-label"
```

---

### Task 2: Titel — `product-card.liquid`

**Files:**
- Modify: `snippets/product-card.liquid:27` (placeholder-mockup h3)
- Modify: `snippets/product-card.liquid:82-89` (rigtig h3, minimal + standard grene)

**Interfaces:**
- Consumes: `.type-md`, `.type-bold` (Layer 1-primitiver, allerede i `assets/input.css`).
- Produces: intet nyt.

- [ ] **Step 1: Ret placeholder-titlen (design-mode mockup)**

Erstat linje 27:

```liquid
<h3 class="font-sans text-xs sm:text-sm font-normal text-primary leading-tight">Eksempel produkt {{ placeholder_index }}</h3>
```

med:

```liquid
<h3 class="type-md type-bold">Eksempel produkt {{ placeholder_index }}</h3>
```

- [ ] **Step 2: Ret den rigtige titel — unificér minimal og standard**

Erstat linje 81-89:

```liquid
        {%- if is_minimal -%}
          <h3 class="font-sans text-xs sm:text-sm font-normal text-primary leading-tight mb-1">
            <a href="{{ product.url }}" class="text-primary no-underline">{{ product.title }}</a>
          </h3>
        {%- else -%}
          <h3 class="text-sm sm:text-base font-normal text-primary leading-tight hover:text-secondary mb-1">
            <a href="{{ product.url }}" class="text-primary no-underline hover:text-secondary">{{ product.title }}</a>
          </h3>
        {%- endif -%}
```

med én fælles gren (drop `is_minimal`-forgreningen for titel-typografi — hover-effekten bevares kun på standard-kortet, da minimal-kortet ikke har `hover:text-secondary` i dag):

```liquid
        {%- if is_minimal -%}
          <h3 class="type-md type-bold mb-1">
            <a href="{{ product.url }}" class="no-underline">{{ product.title }}</a>
          </h3>
        {%- else -%}
          <h3 class="type-md type-bold mb-1 hover:text-secondary">
            <a href="{{ product.url }}" class="no-underline hover:text-secondary">{{ product.title }}</a>
          </h3>
        {%- endif -%}
```

(`text-primary` droppes begge steder — arves fra `main`.)

- [ ] **Step 3: Kør theme check**

Run: `npx shopify theme check`
Expected: Ingen nye fejl/warnings i `product-card.liquid`.

- [ ] **Step 4: Kør tailwind build**

Run: `npm run tailwind:build`
Expected: Lykkes.

- [ ] **Step 5: Commit**

```bash
git add snippets/product-card.liquid assets/output.css
git commit -m "feat(typography): unify product-card title on type-md type-bold"
```

---

### Task 3: Prisblok — `product-card-price.liquid`

**Files:**
- Modify: `snippets/product-card-price.liquid:19-40`

**Interfaces:**
- Consumes: `text-style.liquid`'s `role: 'caption'` (printer `type-muted`), Layer 1-primitiver `type-lg`/`type-md`/`type-sm`/`type-xs`/`type-bold`/`type-muted`.
- Produces: intet nyt — `{% render 'product-card-price', ... %}`-signaturen er uændret.

- [ ] **Step 1: Ret "Pris"-labelen**

Erstat linje 20-22:

```liquid
  {%- unless is_minimal -%}
    <span class="text-xs sm:text-sm text-primary/85 leading-none">Pris</span>
  {%- endunless -%}
```

med:

```liquid
  {%- unless is_minimal -%}
    <span class="{% render 'text-style', role: 'caption' %} leading-none">Pris</span>
  {%- endunless -%}
```

- [ ] **Step 2: Ret hovedprisen**

Erstat linje 24:

```liquid
    <span class="{% if is_minimal %}text-xs sm:text-sm md:text-base{% else %}text-sm sm:text-base md:text-lg{% endif %} font-bold text-primary leading-none">
```

med:

```liquid
    <span class="{% if is_minimal %}type-md{% else %}type-lg{% endif %} type-bold leading-none">
```

- [ ] **Step 3: Ret førprisen (gennemstreget)**

Erstat linje 34:

```liquid
        <span class="text-[12px] text-primary/70 line-through leading-none">{{ original_price | money }}</span>
```

med:

```liquid
        <span class="type-sm type-muted line-through leading-none">{{ original_price | money }}</span>
```

- [ ] **Step 4: Ret enhedssuffikset**

Erstat linje 38:

```liquid
      <span class="text-[9px] sm:text-[10px] text-primary/75 font-semibold">/ {{ unit_suffix }}</span>
```

med:

```liquid
      <span class="type-xs type-muted">/ {{ unit_suffix }}</span>
```

- [ ] **Step 5: Kør theme check**

Run: `npx shopify theme check`
Expected: Ingen nye fejl/warnings.

- [ ] **Step 6: Kør tailwind build**

Run: `npm run tailwind:build`
Expected: Lykkes.

- [ ] **Step 7: Commit**

```bash
git add snippets/product-card-price.liquid assets/output.css
git commit -m "feat(typography): migrate product-card price block to .type-* tokens"
```

---

### Task 4: `unit-price.liquid`

**Files:**
- Modify: `snippets/unit-price.liquid:22-36`

**Interfaces:**
- Consumes: Layer 1-primitiver `type-xs`/`type-sm`/`type-md`/`type-muted`.
- Produces: intet nyt — `size`-parameterens tre værdier (`'xs'`, `'base'`, default) bevarer deres betydning for kaldere; kun output-klasserne ændres.

- [ ] **Step 1: Ret størrelsesmapningen**

Erstat linje 22-29:

```liquid
  {%- case size -%}
    {%- when 'xs' -%}
      {%- assign unit_price_size_class = 'text-[11px]' -%}
    {%- when 'base' -%}
      {%- assign unit_price_size_class = 'text-sm' -%}
    {%- else -%}
      {%- assign unit_price_size_class = 'text-xs' -%}
  {%- endcase -%}
```

med:

```liquid
  {%- case size -%}
    {%- when 'xs' -%}
      {%- assign unit_price_size_class = 'type-xs' -%}
    {%- when 'base' -%}
      {%- assign unit_price_size_class = 'type-sm' -%}
    {%- else -%}
      {%- assign unit_price_size_class = 'type-xs' -%}
  {%- endcase -%}
```

- [ ] **Step 2: Ret farven på output-spannet**

Erstat linje 36:

```liquid
  <span class="unit-price {{ unit_price_size_class }} text-primary/70">{{ variant.unit_price | money }} / {{ unit_suffix }}</span>
```

med:

```liquid
  <span class="unit-price {{ unit_price_size_class }} type-muted">{{ variant.unit_price | money }} / {{ unit_suffix }}</span>
```

- [ ] **Step 3: Kør theme check**

Run: `npx shopify theme check`
Expected: Ingen nye fejl/warnings.

- [ ] **Step 4: Kør tailwind build**

Run: `npm run tailwind:build`
Expected: Lykkes.

- [ ] **Step 5: Commit**

```bash
git add snippets/unit-price.liquid assets/output.css
git commit -m "feat(typography): migrate unit-price size params to .type-* tokens"
```

---

### Task 5: Rating-wrapper — `product-card.liquid`

**Files:**
- Modify: `snippets/product-card.liquid:102-109`

**Interfaces:**
- Consumes: Layer 1-primitiver `type-xs`/`type-sm`.
- Produces: `rating_wrapper_class`-variablen sendes stadig til `{% render 'star-rating', ..., wrapper_class: rating_wrapper_class %}` uændret i navn og brug — kun værdien ændres.

- [ ] **Step 1: Ret størrelses-mapningen**

Erstat linje 102-109:

```liquid
          {%- liquid
            assign star_size = 14
            assign rating_wrapper_class = 'text-xs sm:text-sm'
            if is_minimal
              assign star_size = 12
              assign rating_wrapper_class = 'text-[10px]'
            endif
          -%}
```

med:

```liquid
          {%- liquid
            assign star_size = 14
            assign rating_wrapper_class = 'type-sm'
            if is_minimal
              assign star_size = 12
              assign rating_wrapper_class = 'type-xs'
            endif
          -%}
```

- [ ] **Step 2: Kør theme check**

Run: `npx shopify theme check`
Expected: Ingen nye fejl/warnings.

- [ ] **Step 3: Kør tailwind build**

Run: `npm run tailwind:build`
Expected: Lykkes.

- [ ] **Step 4: Commit**

```bash
git add snippets/product-card.liquid assets/output.css
git commit -m "feat(typography): migrate product-card rating wrapper to .type-* tokens"
```

---

### Task 6: Dokumentation og manuel verifikation

**Files:**
- Modify: `docs/failure-log.md` (ny entry, næste ledige `F-NNN`, øverst i `## Entries` og i indekstabellen)
- Modify: `docs/typography-inventory.md` (marker de fem filers linjer som fikset — tilføj en kort note under afsnit 7 om at produktkort-overfladen er migreret, med dato)

**Interfaces:**
- Consumes: ingen — dokumentationsopgave.
- Produces: ingen.

- [ ] **Step 1: Skriv failure-log-entry**

Find næste ledige `F-NNN` i `docs/failure-log.md` (se filens indekstabel for højeste nummer i brug). Tilføj øverst i `## Entries`, med alle fem felter udfyldt (Symptom / Root cause / Fix + commit sha'er fra Task 1-5 / Prevention), og en tilsvarende række øverst i indekstabellen. Dato: 2026-08-13.

- [ ] **Step 2: Opdatér typografi-inventaret**

I `docs/typography-inventory.md`, tilføj under afsnit 7 ("Alt under 14px — placeringer") en kort note (ikke en omskrivning af hele optællingen — den er et snapshot fra optællingsdatoen) om at `snippets/product-card.liquid`, `product-card-price.liquid`, `product-card-image.liquid`, `savings-badge.liquid` (sm) og `unit-price.liquid` er migreret til `.type-*` pr. 2026-08-13, og at de 9-11px-forekomster derfra er lukket.

- [ ] **Step 3: Commit dokumentation**

```bash
git add docs/failure-log.md docs/typography-inventory.md
git commit -m "docs: log product-card typography migration in failure-log and inventory"
```

- [ ] **Step 4: Manuel browser-verifikation (kan IKKE automatiseres — kræver bruger)**

Start dev-server (`npm run dev` eller preview_start) og åbn en kollektionsside. Tjek:
- Produktkort i **standard**-layout: titel, "Pris"-label, hovedpris, evt. gennemstreget førpris, evt. rabat-badge, evt. tag-badge, rating — på mobilbredde (< 640px) og desktop.
- Produktkort i **minimal**-layout: samme tjekliste.
- Et produkt med enhedspris (`unit_price_measurement`) sat, så enhedssuffikset og `unit-price.liquid`s output kan ses.
- Sammenlign visuelt med hvordan siden så ud før migrationen (git stash eller browser-diff), og bekræft at intet er blevet uforholdsmæssigt stort/småt eller brudt i layoutet.

Dette skridt afsluttes IKKE af en agent alene — resultatet skal rapporteres til brugeren, som skal bekræfte at det ser korrekt ud, før branchen er klar til merge (jf. CLAUDE.md's "Build in parallel, land one at a time, verify each before the next").

---

## Self-Review

**Spec coverage:** Alle fem mapping-punkter fra design-spec'en (titel, badges, prisblok, unit-price, rating-wrapper) har hver deres task. `lg`-varianten af `savings-badge` er eksplicit undtaget i Task 1. Failure-log og inventory-opdatering er dækket af Task 6, som spec'en kræver.

**Placeholder-scan:** Ingen "TBD"/"senere"/uspecificeret kode — hvert step viser eksakt før/efter-kode. `F-NNN`-nummeret i Task 6 kan ikke fastlåses her (afhænger af hvad der er committet på merge-tidspunkt), så step 1 instruerer eksplicit i at slå det op i filen frem for at gætte et tal.

**Type-konsistens:** `rating_wrapper_class`, `unit_price_size_class` og `badge_class`-variabelnavnene er uændrede på tværs af tasks — kun deres tildelte strengværdier ændres, så ingen call site uden for de nævnte filer påvirkes.
