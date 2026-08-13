# Design: migrér produktkortet til `.type-*`-systemet

Dato: 2026-08-13

## Formål

Produktkortet er den værste overflade i `docs/typography-inventory.md`: 9px
enhedspris, 10px metatekst, 9px badge på mobil. Migrér de fem filer der
udgør produktkortet til det allerede godkendte `.type-*`-typografisystem
(`assets/input.css`, `snippets/css-variables.liquid`,
`snippets/text-style.liquid`), og fjern samtidig alt tekst under 14px der
ikke er en versaliseret label/badge.

## Omfang

Fem filer:
- `snippets/product-card.liquid`
- `snippets/product-card-price.liquid`
- `snippets/product-card-image.liquid`
- `snippets/savings-badge.liquid` (kun `sm`-varianten — `lg` bruges på
  produktsiden og røres ikke)
- `snippets/unit-price.liquid`

Ikke i scope: produktsidens brug af `savings-badge` (`lg`), `star-rating.liquid`
selv (kun den `wrapper_class`-streng der sendes ind fra `product-card.liquid`),
`main { font-size: 16px }`-basen, og alle andre overflader i
typografi-inventaret.

## Mapping

### 1. Titel (`product-card.liquid`, begge varianter: `is_minimal` og standard)

Før (to forskellige, begge responsive):
```
font-sans text-xs sm:text-sm font-normal text-primary leading-tight
text-sm sm:text-base font-normal text-primary leading-tight hover:text-secondary
```
Efter (samme klasse begge steder — unificerer minimal/standard):
```
type-md type-bold
```
`text-primary` droppes (arves allerede fra `main`). `hover:text-secondary`
og `mb-1` bevares som layout/interaktions-modifiers ved call site, ikke del
af typografisystemet.

### 2. Badges (`savings-badge.liquid` sm-variant, `product-card-image.liquid` tag-badge)

Begge er reelt `.type-badge`-brug (surface, ikke tekststil — jf. kommentaren
i `input.css:207-209`). Erstat baggrund/padding/typografi samlet:

`savings-badge.liquid` sm, før:
```
bg-important text-white text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase
```
efter:
```
type-badge type-badge--important {% render 'text-style', role: 'badge-label' %}
```

`product-card-image.liquid` tag-badge, før (9px på mobil):
```
{% if is_minimal %}text-[9px] sm:text-[11px]{% else %}text-[11px]{% endif %} font-bold px-2 py-0.5 rounded-md tracking-wider uppercase
(baggrund: bg-primary text-on-primary)
```
efter (fast 12px, ingen minimal-forgrening):
```
type-badge {% render 'text-style', role: 'badge-label' %}
```

### 3. Prisblok (`product-card-price.liquid`)

- **"Pris"-label**, før `text-xs sm:text-sm text-primary/85`, efter:
  `{% render 'text-style', role: 'caption' %}` (14px, `type-muted`).
- **Hovedpris** — ingen rolle passer til en fed prisvisning, så Layer 1
  komponeres direkte ved call site:
  - standard: `type-lg type-bold` (18px)
  - minimal: `type-md type-bold` (16px)
  (erstatter de responsive `text-xs sm:text-sm md:text-base` /
  `text-sm sm:text-base md:text-lg`-spring)
- **Førpris** (gennemstreget), før `text-[12px] text-primary/70 line-through`,
  efter: `type-sm type-muted line-through` (14px — `line-through` er en
  Tailwind-utility, ikke del af typografisystemet, og bevares som den er).
- **Enhedssuffiks** (`/ pr. meter`), før `text-[9px] sm:text-[10px] text-primary/75 font-semibold`,
  efter: `type-xs type-muted` (12px, fast — ingen mobil-nedskalering).

### 4. `unit-price.liquid`

`size`-parameteren mapper nu til token-klasser i stedet for Tailwind-vilkårlige værdier:
| `size` | Før | Efter |
|---|---|---|
| `'xs'` | `text-[11px]` | `type-xs` |
| default (`'sm'`) | `text-xs` | `type-xs` |
| `'base'` | `text-sm` | `type-sm` |

Farve: `text-primary/70` → `type-muted`.

### 5. Rating-wrapper (`product-card.liquid`)

`rating_wrapper_class`, før `text-[10px]` (minimal) / `text-xs sm:text-sm` (standard),
efter: `type-xs` (minimal, 12px) / `type-sm` (standard, 14px).

## Verifikation

Ingen automatiseret testsuite for Liquid/CSS i dette repo (jf. CLAUDE.md).
Verifikation sker via:
1. `npx shopify theme check` (linting)
2. `npm run tailwind:build` (regenerer `assets/output.css` — skal committes)
3. Manuel visuel gennemgang i browser: produktkort i kollektionsvisning,
   både `minimal`- og standard-layout, mobil + desktop bredde, med og uden
   tilbud/badge, med og uden enhedspris — sammenlignet før/efter screenshot.
4. Opdatér `docs/typography-inventory.md`s status for de linjer der er fikset,
   og log de rettede sub-14px-forekomster i `docs/failure-log.md` (næste
   ledige `F-NNN`) i samme commit.

## Risici / bevidste afvigelser

- Titel unificeres på tværs af minimal/standard — ændrer minimal-kortets
  titel fra 12-14px normal til 16px bold. Bevidst, godkendt af bruger.
- Hovedpris og enhedssuffiks mister deres responsive nedskalering til
  mindre skærme — konsistent med systemets "ét fast token, ingen `sm:`-spredning"-princip.
- `type-xs` (12px) bruges til enhedssuffiks og `unit-price`'s `xs`/`sm`, selvom
  tokenkommentaren i `css-variables.liquid` siger "12px — uppercase labels only".
  Disse to er ikke versaler. Accepteret som en pragmatisk undtagelse, fordi de
  allerede var betydeligt mindre (9-11px) og 12px er markant bedre, uden at
  sprænge den visuelle balance ved siden af hovedprisen.
