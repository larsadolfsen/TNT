# Typografi-inventar

Optælling af alle tekst-styles i temaet: størrelse, vægt, linjehøjde, knibning,
versalisering, dekoration og skrifttype. Formålet er at kunne se hvor mange
distinkte tekst-styles temaet reelt bruger, og hvilke der ligger under 14px
(målgruppen er 40+, hvor 12px og derunder er svært læseligt).

**Dette er en optælling, ikke en plan og ikke et fiks.** Ingen filer er ændret.

## Metode

- Scannet: alle `*.liquid`, `*.json`, `*.js` i repoet
- Udeladt: `assets/output.css` (genereret artefakt), `assets/*.min.js` (minificerede kopier), `docs/`
- Optalt pr. forekomst, ikke pr. fil — samme klasse på 5 linjer tæller 5
- Dato for optælling: 2026-08-13

Bemærk to forskellige totaler nedenfor:

- **386 størrelses-utilities** i alt = alt hvad regex finder, inkl. de 34 responsive
  varianter (`sm:text-base` m.fl.) og forekomster inde i Liquid-`assign`-strenge,
  JSON-templates og JS-template-literals.
- **250 stylede tekst-spans** i kombinationstabellen = kun dem der står i et
  egentligt `class="…"`-attribut med en ikke-prefikset størrelse. De resterende
  ~100 lever uden for `class`-attributter og kan ikke pålideligt kombineres med
  vægt/knibning af en tekst-scanner.

---

## 1. Skriftstørrelser

15 distinkte pixelstørrelser, skrevet på 20 forskellige måder.

| px | Skrivemåde | Antal | ≥ 14px |
|---:|---|---:|:---:|
| 9 | `text-[9px]` | 5 | ✗ |
| 10 | `text-[10px]` | 5 | ✗ |
| 11 | `text-[11px]` | 15 | ✗ |
| 12 | `text-xs` | 78 | ✗ |
| 12 | `text-[12px]` | 5 | ✗ |
| 14 | `text-sm` | 123 | ✓ |
| 14 | `text-[14px]` | 8 | ✓ |
| 15 | `text-[15px]` | 8 | ✓ |
| 16 | `text-base` | 39 | ✓ |
| 16 | `text-[16px]` | 28 | ✓ |
| 18 | `text-lg` | 9 | ✓ |
| 18 | `text-[18px]` | 9 | ✓ |
| 20 | `text-xl` | 17 | ✓ |
| 20 | `text-[20px]` | 4 | ✓ |
| 24 | `text-2xl` | 17 | ✓ |
| 24 | `text-[24px]` | 1 | ✓ |
| 30 | `text-3xl` | 6 | ✓ |
| 32 | `text-[32px]` | 1 | ✓ |
| 36 | `text-4xl` | 4 | ✓ |
| 48 | `text-5xl` | 4 | ✓ |

**I alt 386 forekomster. 108 af dem (28 %) er under 14px.**

Fem størrelser findes i to skrivemåder på samme tid: 12, 14, 16, 18, 20 og 24px
har hver både en navngiven Tailwind-klasse og en vilkårlig `text-[Npx]`-variant.
`text-[16px]` bruges 28 gange selvom `text-base` er præcis det samme.

Der er ingen font-størrelses-tokens i `snippets/css-variables.liquid` — kun
farver og typsnitfamilier er tokeniseret. Tailwinds default-skala bruges direkte,
og `@theme`-blokken i `assets/input.css` overskriver ingen `--text-*`.

### Responsive størrelsesvarianter (34)

| Variant | Antal |
|---|---:|
| `sm:text-base` | 12 |
| `sm:text-sm` | 12 |
| `md:text-2xl` | 2 |
| `md:text-3xl` | 2 |
| `md:text-xl` | 2 |
| `md:text-base` | 1 |
| `md:text-lg` | 1 |
| `sm:text-[10px]` | 1 |
| `sm:text-[11px]` | 1 |

De to sidste er *opskaleringer fra endnu mindre mobilstørrelser* — dvs. mobilen
viser noget under 10px de steder.

---

## 2. Skriftvægte

5 vægte i brug via utility-klasser, plus 3 rå CSS-deklarationer.

| Vægt | Klasse | Antal |
|---:|---|---:|
| 900 | `font-black` | 2 |
| 700 | `font-bold` | 92 |
| 600 | `font-semibold` | 61 |
| 500 | `font-medium` | 42 |
| 400 | `font-normal` | 8 |

Rå CSS: `font-weight: 700` (2), `font-weight: 600` (1), `font-weight: bold` (1).
Den sidste er en skrivemåde-dublet af `700`.

`font-bold` og `font-semibold` udgør tilsammen 153 af 205 forekomster — vægt
bruges som primært hierarki-virkemiddel, ikke størrelse.

---

## 3. Linjehøjder

Kun 23 eksplicitte linjehøjder i hele temaet — resten arver Tailwinds default
pr. størrelse.

| Klasse | Værdi | Antal |
|---|---|---:|
| `leading-none` | 1 | 8 |
| `leading-tight` | 1.25 | 7 |
| `leading-relaxed` | 1.625 | 5 |
| `leading-normal` | 1.5 | 3 |

Rå CSS: `line-height: 1` (4), `line-height: 1.4` (1), `line-height: 1.25` (i
`.collection-card__title`).

`leading-none` (8 steder) sætter linjeafstanden lig skriftstørrelsen — det er
den strammeste indstilling der findes og rammer typisk de samme små tekster som
i afsnit 7.

---

## 4. Knibning (letter-spacing)

| Klasse | Værdi | Antal |
|---|---|---:|
| `tracking-wider` | 0.05em | 19 |
| `tracking-tight` | -0.025em | 10 |
| `tracking-widest` | 0.1em | 9 |
| `tracking-wide` | 0.025em | 2 |

I alt 40 forekomster. Rå CSS: `letter-spacing: 0.05em` (1) — dublet af `tracking-wider`.

`tracking-wider`/`tracking-widest` optræder næsten udelukkende sammen med
`text-xs` + `font-bold` + `uppercase` (se afsnit 6) — det er "etiket"-mønsteret.

---

## 5. Versalisering, dekoration og skrifttype

| Kategori | Klasse | Antal |
|---|---|---:|
| Versalisering | `uppercase` | 25 |
| | `capitalize` | 4 |
| | `normal-case` | 1 |
| Dekoration | `no-underline` | 63 |
| | `underline` | 29 |
| | `line-through` | 8 |
| | `italic` | 7 |
| | `not-italic` | 2 |
| Afkortning | `truncate` | 10 |
| Skrifttype | `font-sans` | 10 |
| | `font-serif` | 10 |
| | `font-mono` | 3 |
| Justering | `text-center` | 19 |
| | `text-left` | 10 |
| | `text-justify` | 1 |
| | `text-right` | 1 |

`truncate` (10) og `line-through` (8) er værd at holde øje med sammen med små
størrelser: afkortet tekst i 11px og overstreget førpris i 12px er de sværeste
kombinationer at læse.

---

## 6. Sammensatte tekst-styles

Kombination af størrelse + vægt + knibning + versalisering, optalt over de 250
tekst-spans der står i et `class="…"`-attribut.

**46 distinkte kombinationer.**

| # | Størrelse | Vægt | Knibning | Versaler | Antal | ≥ 14px |
|---:|---|---|---|---|---:|:---:|
| 1 | `text-sm` | – | – | – | 45 | ✓ |
| 2 | `text-xs` | – | – | – | 26 | ✗ |
| 3 | `text-sm` | `font-semibold` | – | – | 25 | ✓ |
| 4 | `text-sm` | `font-medium` | – | – | 19 | ✓ |
| 5 | `text-sm` | `font-bold` | – | – | 14 | ✓ |
| 6 | `text-xs` | `font-semibold` | – | – | 9 | ✗ |
| 7 | `text-xs` | `font-bold` | `tracking-wider` | – | 9 | ✗ |
| 8 | `text-xs` | `font-bold` | `tracking-widest` | `uppercase` | 8 | ✗ |
| 9 | `text-base` | – | – | – | 8 | ✓ |
| 10 | `text-xs` | `font-bold` | `tracking-wider` | `uppercase` | 7 | ✗ |
| 11 | `text-base` | `font-bold` | – | – | 7 | ✓ |
| 12 | `text-base` | `font-semibold` | – | – | 6 | ✓ |
| 13 | `text-xs` | `font-bold` | – | – | 6 | ✗ |
| 14 | `text-lg` | `font-bold` | – | – | 4 | ✓ |
| 15 | `text-xl` | `font-bold` | `tracking-tight` | – | 4 | ✓ |
| 16 | `text-xs` | `font-normal` | – | – | 4 | ✗ |
| 17 | `text-2xl` | `font-bold` | – | – | 4 | ✓ |
| 18 | `text-[11px]` | `font-semibold` | – | `uppercase` | 3 | ✗ |
| 19 | `text-[11px]` | – | – | – | 3 | ✗ |
| 20 | `text-[9px]` | `font-semibold` | – | – | 3 | ✗ |
| 21 | `text-sm` | `font-normal` | – | – | 2 | ✓ |
| 22 | `text-xl` | `font-bold` | – | – | 2 | ✓ |
| 23 | `text-xs` | `font-medium` | – | – | 2 | ✗ |
| 24 | `text-lg` | `font-semibold` | – | – | 2 | ✓ |
| 25 | `text-5xl` | `font-black` | `tracking-tight` | – | 2 | ✓ |
| 26 | `text-[10px]` | – | – | – | 2 | ✗ |
| 27 | `text-[11px]` | `font-semibold` | – | – | 2 | ✗ |
| 28 | `text-[15px]` | `font-bold` | – | – | 2 | ✓ |
| 29 | `text-3xl` | `font-bold` | `tracking-tight` | – | 2 | ✓ |
| 30 | `text-[12px]` | – | – | – | 2 | ✗ |
| 31 | `text-3xl` | `font-bold` | – | – | 1 | ✓ |
| 32 | `text-[10px]` | `font-semibold` | – | – | 1 | ✗ |
| 33 | `text-[11px]` | `font-bold` | `tracking-wide` | `uppercase` | 1 | ✗ |
| 34 | `text-[11px]` | `font-bold` | `tracking-wider` | `uppercase` | 1 | ✗ |
| 35 | `text-[11px]` | `font-bold` | `tracking-widest` | `uppercase` | 1 | ✗ |
| 36 | `text-[11px]` | `font-medium` | – | – | 1 | ✗ |
| 37 | `text-[11px]` | `font-semibold` | `tracking-wider` | `uppercase` | 1 | ✗ |
| 38 | `text-[12px]` | `font-medium` | – | – | 1 | ✗ |
| 39 | `text-[16px]` | – | – | – | 1 | ✓ |
| 40 | `text-[16px]` | `font-bold` | – | – | 1 | ✓ |
| 41 | `text-[9px]` | – | – | – | 1 | ✗ |
| 42 | `text-[9px]` | `font-bold` | `tracking-wider` | `uppercase` | 1 | ✗ |
| 43 | `text-2xl` | `font-bold` | `tracking-tight` | – | 1 | ✓ |
| 44 | `text-2xl` | `font-bold` | `tracking-wide` | – | 1 | ✓ |
| 45 | `text-[12px]` | `font-normal` | – | – | 1 | ✗ |
| 46 | `text-2xl` | `font-semibold` | – | – | 1 | ✓ |

**23 af de 46 kombinationer (halvdelen) er under 14px.** De dækker 92 af de 250
tekst-spans.

Fire af dem er reelt samme design i fire skrivemåder — "lille fed etiket med
versaler": nr. 8, 10, 33, 34, 35, 37 og 42 er alle en variation over
*11–12px + bold/semibold + wider/widest + uppercase*.

---

## 7. Alt under 14px — placeringer

108 forekomster fordelt på 105 linjer i 48 filer.

> **Opdatering 2026-08-13:** Produktkort-overfladen er migreret til
> `.type-*`-systemet — `snippets/product-card.liquid`,
> `product-card-price.liquid`, `product-card-image.liquid`,
> `savings-badge.liquid` (kun `sm`-varianten) og `unit-price.liquid`. De
> 9-11px-forekomster fra disse fem filer nævnt nedenfor (badge på
> produktbillede, enhedssuffiks i `product-card-price.liquid`,
> produktkort-metatekst/rating-wrapper) er lukket. Se
> `docs/superpowers/specs/2026-08-13-product-card-typography-design.md`
> og `docs/failure-log.md` F-029 for detaljerne. Denne optælling er
> stadig et snapshot fra 2026-08-13 og er ikke genkørt — øvrige linjer
> nedenfor er fortsat uændrede.

### 9px (5)

| Fil | Linje | Hvad det er |
|---|---:|---|
| `snippets/collection-toolbar.liquid` | 24 | "Sorter"-label under ikon |
| `snippets/collection-toolbar.liquid` | 35 | "Filtrer"-label under ikon |
| `snippets/collection-filter-list.liquid` | 32 | Filterantal |
| `snippets/product-card-image.liquid` | 38 | Badge på produktbillede |
| `snippets/product-card-price.liquid` | 38 | Enhedssuffiks (`/ pr. meter`) |

### 10px (5, heraf 1 kun på mobil)

| Fil | Linje | Hvad det er |
|---|---:|---|
| `sections/footer.liquid` | 84 | Footer-finprint |
| `snippets/collection-filter-list.liquid` | 31 | Filter-metatekst |
| `snippets/product-card.liquid` | 107 | Produktkort-metatekst |
| `snippets/star-rating.liquid` | 16 | Kun i dokumentationskommentar — ikke aktiv kode |
| — | — | `sm:text-[10px]` opskalering, dvs. under 10px på mobil |

### 11px (15)

| Fil | Linje |
|---|---|
| `assets/product-buy-buttons.js` | 405, 418 |
| `blocks/badge.liquid` | 77 |
| `snippets/cart-discount-chip.liquid` | 14 |
| `snippets/collection-active-filters.liquid` | 25, 34 |
| `snippets/localization-picker.liquid` | 82 |
| `snippets/metafield-pill.liquid` | 14 |
| `snippets/predictive-search-product.liquid` | 46, 47 |
| `snippets/product-card-image.liquid` | 38 |
| `snippets/savings-badge.liquid` | 26 |
| `snippets/search-result-row.liquid` | 44 |
| `snippets/unit-price.liquid` | 24 |
| — | `sm:text-[11px]` opskalering, dvs. under 11px på mobil |

### 12px som `text-[12px]` (5)

| Fil | Linje |
|---|---|
| `snippets/breadcrumbs-nav.liquid` | 93, 105 |
| `snippets/cart-discount-chip.liquid` | 15 |
| `snippets/product-buy-sticky-bar.liquid` | 23 |
| `snippets/product-card-price.liquid` | 34 (overstreget førpris) |

### 12px som `text-xs` (78)

Grupperet efter overflade:

**Kurv (13)**
`sections/cart.liquid` 40, 75, 107, 111, 166, 176 · `assets/header-cart.js` 223, 245, 259 ·
`snippets/header-cart-config.liquid` 18, 21 · `snippets/header-cart-drawer.liquid` 26 ·
`snippets/cart-discount-chip.liquid` (se 11/12px ovenfor)

**Kollektion og filtre (16)**
`sections/collection-subcollections.liquid` 55, 85, 95, 98, 101, 104 ·
`snippets/collection-filter-list.liquid` 56, 68, 69, 70 ·
`snippets/collection-active-filters.liquid` 21, 49 ·
`snippets/collection-toolbar.liquid` 16 ·
`snippets/collection-mobile-filter-drawer.liquid` 30 ·
`sections/main-collection.liquid` 101, 104 · `assets/main-collection.js` 153

**Produktkort og pris (8)**
`snippets/product-card.liquid` 27, 28, 82, 104 ·
`snippets/product-card-price.liquid` 21, 24 · `snippets/unit-price.liquid` 28 ·
`blocks/badge.liquid` 71

**Produktside (10)**
`snippets/product-buy-cta.liquid` 26, 32 ·
`snippets/product-buy-payment-badges.liquid` 25, 26, 27, 28, 29 ·
`blocks/product-variant-picker.liquid` 31 ·
`blocks/product-shipping-progress.liquid` 86 ·
`blocks/product-recommendations.liquid` 45 ·
`sections/product-description.liquid` 50 ·
`snippets/pickup-panel.liquid` 35, 38

**Header, søgning og navigation (10)**
`blocks/header-account.liquid` 79, 96, 123 · `blocks/header-search.liquid` 73 ·
`snippets/header-account-mobile-row.liquid` 23 ·
`snippets/header-mobile-drawer.liquid` 22 ·
`snippets/predictive-search-panel.liquid` 65, 69, 85 ·
`snippets/predictive-search-product.liquid` 35, 39 ·
`snippets/icon.liquid` 62 (kurv-antal-badge)

**Konto, formularer og øvrige sider (12)**
`snippets/account-panel.liquid` 26, 31 · `sections/contact-form.liquid` 73, 89, 110 ·
`sections/password.liquid` 51, 70, 81 · `sections/footer.liquid` 20, 42 ·
`sections/custom-liquid.liquid` 39 · `blocks/contact-map.liquid` 35 ·
`snippets/newsletter-form.liquid` 55 · `snippets/input.liquid` 49 ·
`snippets/button.liquid` 10, 29

---

## 8. Typografi i rå CSS

Ud over utility-klasserne findes disse i `assets/input.css` og i `{% style %}`-blokke.

| Sted | Regel | Bemærkning |
|---|---|---|
| `assets/input.css:58` | `main { font-size: 16px }` | Basisstørrelse for hele sidens indhold |
| `assets/input.css:151–173` | `.h1`–`.h6` | 24 / 20 / 18 / 16px, alle `font-weight: 700`, `leading-tight` |
| `assets/input.css:260–263` | `& h1`–`& h6` i prose-kontekst | Samme skala som `.h1`–`.h6` |
| `assets/input.css:622` | `font-size: 14px` | |
| `assets/input.css:743–758` | `font-size: var(--text-xl)` / `--text-lg` / `--text-2xl` | Responsiv overskrift |
| `assets/input.css:900–907` | `.collection-card__title` | 14px, vægt 600, `line-height: 1.25` |
| `assets/input.css:909–913` | `.collection-card__title` under 640px | **Falder til 12px på mobil** |
| `assets/input.css:914–917` | `.collection-card__description` | **12px, uden mobil-undtagelse** |
| `snippets/product-media-gallery-style.liquid:97` | `font-size: 10px` | **Under 14px** |
| `assets/masonry.js:151` | `font-size: 10px` | Debug-overlay, ikke synligt for kunder |
| `snippets/icon.liquid` | `font-size: {{ star_size }}px` | Ikonstørrelse, ikke tekst |
| `blocks/header-logo.liquid` | `font-size: {{ logo_height }}px` | Ikonstørrelse, ikke tekst |

De tre fremhævede rå CSS-steder rammes **ikke** af en ændring i
utility-klasserne — de skal håndteres for sig.

---

## 9. Opsummering i tal

| Mål | Antal |
|---|---:|
| Distinkte pixelstørrelser | 15 |
| Skrivemåder for de 15 størrelser | 20 |
| Størrelser der findes i to skrivemåder | 6 (12, 14, 16, 18, 20, 24px) |
| Skriftvægte | 5 (+ 3 rå CSS-deklarationer) |
| Eksplicitte linjehøjder | 4 klasser, 23 forekomster |
| Knibningsvarianter | 4 klasser, 40 forekomster |
| Distinkte sammensatte tekst-styles | 46 |
| Sammensatte styles under 14px | 23 (halvdelen) |
| Størrelses-forekomster i alt | 386 |
| Forekomster under 14px | 108 (28 %) |
| Filer med tekst under 14px | 48 |
| Rå CSS-steder under 14px | 3 (heraf 1 kun mobil, 1 kun debug) |
| Font-størrelses-tokens i `css-variables.liquid` | 0 |
