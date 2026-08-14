# Primitive theme blocks — masterplan

**Dato:** 2026-08-14
**Spec:** `docs/superpowers/specs/2026-08-14-primitive-theme-blocks-design.md` (godkendt)
**Status:** klar til udførelse

> **Til agentiske workers:** PÅKRÆVET SUB-SKILL: brug `superpowers:subagent-driven-development` til at
> udføre en batch-fil trin for trin. Denne fil er kontekst — den indeholder ingen trin.
> Trinnene ligger i de fem batch-filer, ét trin per blok.

---

## Mål

**1. Lukke builder-hullet.** Temaet mangler `image`, `button`, `icon`, `heading`, `divider`,
`spacer`, `video`, `custom-liquid` og en række commerce-primitiver. Uden dem kan en merchant
ikke bygge en side i theme editoren.

**2. En Horizon-butiks `templates/*.json` skal kunne løftes over i TNT og stadig rendere.**

Mål 2 er bindende for mål 1: **filnavne og settings-id'er spejler Shopify Horizon 1:1**,
medmindre speccen eksplicit erklærer en afvigelse. Blok-indhold lever i template-JSON som
`"type": "<filnavn>"` plus settings-nøgler; hedder en nøgle noget andet hos os, dropper Shopify
værdien, og ingen fallback i Liquid kan redde den.

**Eneste bevidste afvigelse:** typografi. Vi tager `type_preset`, `wrap`, `alignment`,
`text_color` — vi dropper `font`, `font_size`, `line_height`, `letter_spacing`, `case`, fordi de
fem er rå per-instans-værdier og dermed præcis det, `.type-*`-migreringen er i gang med at fjerne.
Horizon-JSON med en `font_size` renderer stadig; teksten kommer i preset-størrelse. Tab af
finjustering, ikke af indhold.

## Ikke-mål

Sektioner. Horizon-paritet for temaets eksisterende produkt-/header-/footer-blokke. Nye
designtokens. `.type-*`-migreringen af resten af temaet.

---

## Arkitektur: alt er en wrapper

Ingen ny blok skriver markup der allerede findes. Hver blok er et `{% schema %}` plus ét
`{% render %}`-kald mod en snippet der allerede er i produktion.

| Blok | Genbruger | Nyt der skrives | Batch |
|---|---|---|---|
| `_heading` | `snippets/text-style.liquid` | — | 1 |
| `_divider` | — | ~15 linjer CSS, `--color-outline-variant` | 1 |
| `spacer` | — | ~10 linjer CSS | 1 |
| `custom-liquid` | mønster fra `sections/custom-liquid.liquid` | — | 1 |
| `text` (omlægges) | eksisterende | — | 1 |
| `button` | `snippets/button.liquid` | snippet udvides: `width`, farve-hooks | 2 |
| `image` | `snippets/image.liquid` | — | 2 |
| `icon` | `snippets/icon.liquid` + sprite | 45-vejs `select` genereret fra sprite | 2 |
| `video` | `snippets/image.liquid` (cover) | `video-native.liquid`, `video-external.liquid` | 2 |
| `social-links` | `snippets/icon.liquid` | 13 brand-symbols i sprite | 3 |
| `product-card` | `snippets/product-card.liquid` | — | 3 |
| `collection-card` | `snippets/collection-card.liquid` | — | 3 |
| `email-signup` | `snippets/newsletter-form.liquid` | — | 3 |
| `menu` | `linklists` global | — | 3 |
| `group` (omlægges) | eksisterende `card` + `group` | — | 4 |

Ingen nye farvetokens. Borders og `_divider` bruger `--color-outline-variant`, som findes.

---

## Filstruktur

**Nye blokke (13):** `blocks/_heading.liquid`, `_divider.liquid`, `spacer.liquid`,
`custom-liquid.liquid`, `button.liquid`, `image.liquid`, `icon.liquid`, `video.liquid`,
`social-links.liquid`, `product-card.liquid`, `collection-card.liquid`, `email-signup.liquid`,
`menu.liquid`.

**Nye snippets (2):** `snippets/video-native.liquid`, `snippets/video-external.liquid`.

**Omlagte blokke (2):** `blocks/text.liquid` (batch 1), `blocks/group.liquid` (batch 4).

**Slettede blokke (3):** `blocks/product-banner-text.liquid` (batch 1),
`blocks/card.liquid` (batch 4), `blocks/page-title.liquid` (batch 5).

**Delte filer:** `snippets/block-padding-vars.liquid` og `sections/section.liquid` (kun batch 1),
`snippets/button.liquid` (kun batch 2), `snippets/icon-sprite.liquid` (kun batch 3),
`locales/en.default.schema.json` (alle), `assets/output.css` (alle).

**Migrerede templates:** `templates/index.json` + `templates/product.json` (batch 4),
`templates/collection.json` + `templates/product.json` (batch 5).

**Midlertidig:** `templates/page.blok-test.json` — oprettes i batch 1, slettes i batch 5.

Blokfiltal: 39 i dag → 49 efter. Loftet er 300. Ingen risiko.

---

## Globale konventioner

Alle nye blokfiler følger `blocks/text.liquid`s struktur:

1. `{% doc %}`-header med `@example` (projektregel: 2–3 linjers filhoved på hver ny fil)
2. `{% style %}` med `{% render 'block-padding-vars', block: block %}` mod
   `#shopify-block-{{ block.id }}.shopify-block`
3. Markup der **kun** kalder `{% render %}` — ingen inline `<svg>`, ingen genskrevet knapmarkup
4. `{{ block.shopify_attributes }}` på rodelementet
5. `{% schema %}` med mindst ét `presets`-objekt **med `"category"`** — uden det vises blokken
   ikke i pickeren
6. Alle labels som `t:`-nøgler i `locales/en.default.schema.json` — ingen hardcoded brugervendt tekst

### Padding: logiske nøgler

Nye blokke bruger Horizons `padding-block-start`, `padding-block-end`, `padding-inline-start`,
`padding-inline-end` — ikke temaets `padding_top`/`padding_bottom`/`padding_sides`.
`snippets/block-padding-vars.liquid` udvides i batch 1 til at læse de logiske nøgler først og
falde tilbage til de gamle. Ét snippet, begge konventioner, ingen dobbelte merchant-felter.
`spacer` har ingen padding-felter — blokken *er* afstand.

### Globale constraints (projektregler, `CLAUDE.md`)

- Ingen `!important`. Løs specificitet via CSS-variabel-scoping eller selektorstruktur.
- Ingen hardcodede brugervendte strenge — alt gennem `t:`-nøgler.
- Ingen hardcodede farver. Semantiske klasser / tokens, ellers er dark mode blind
  (failure-log mønster 3).
- Ikoner altid via `{% render 'icon', name: '…' %}`, aldrig inline `<svg>`.
- `{% render %}`-argumenter tager kun literaler og variabel-opslag — ingen sammenligninger,
  ingen filtre. `assign` først (failure-log mønster 1; en parsefejl her dræber hele sektionen).
- Efter enhver ændring i Tailwind-klassebrug: `npm run tailwind:build` og commit
  `assets/output.css` i **samme commit** (failure-log mønster 11).
- `npm run bump-version` køres som **sidste** trin før push til `main` — aldrig på feature-branches.

### Faldgruber fra failure-loggen der rammer denne opgave direkte

- **Mønster 2 — schema-defaults backfiller ikke gemte settings.** Når `text` og `group`
  omlægges til nye settings-id'er, skal de gemte instanser i `templates/*.json` opdateres i
  **samme commit**. Ellers evaluerer nøglen `nil` på hver eksisterende instans.
- **Mønster 10 — en theme block er to bokse.** Wrapperen `#shopify-block-{id}.shopify-block`
  *og* blokkens eget rodelement. En hardcodet px-værdi på det indre element annullerer
  wrapperens padding; brug `100%`/`calc()` mod en delt custom property.
- **Mønster 14 — GitHub-syncen smider filer væk uden at sige noget.** Reglerne er en overmængde
  af `theme-check`s: schema-`label` ≤ 70 tegn, ingen tom `"default"` på et `text`-setting, og en
  JSON-template må kun nævne bloktyper der findes i `blocks/`. **Konsekvens for denne plan:**
  `sections/section.liquid`s targeting-liste må ikke nævne `_heading`/`_divider` før de filer
  findes — derfor tilføjes hver targeting-linje i samme commit som sin blok, ikke før.
- **Mønster 4 — `theme-check` er ikke verifikation.** Se nedenfor.
- **Mønster 15 — mappen du står i er ikke bevis for repoet du er i.** `git rev-parse
  --abbrev-ref HEAD` før ethvert push. Fjern aldrig en worktree hvis session stadig kører.

---

## Kilde til Horizon-schemas — læs denne før du skriver et eneste schema

Butikken har et **ægte Horizon-tema installeret**: `Horizon`, id `190460559693`, upubliceret.
Dets filer kan læses via Admin API. Det er den **autoritative kilde** til hvert settings-id,
hver option-værdi, hver `min`/`max`/`step`/`default` og hver `visible_if`.

```graphql
{
  theme(id: "gid://shopify/OnlineStoreTheme/190460559693") {
    files(filenames: ["blocks/_heading.liquid"], first: 1) {
      nodes {
        filename
        body { ... on OnlineStoreThemeFileBodyText { content } }
      }
    }
  }
}
```

**Gør dette for hver blok, før du skriver dens schema.** Speccens settings-lister er skrevet i
hånden og er en *oversigt*, ikke en kontrakt — hvor de to er uenige, **vinder Horizon-filen**.
Det er allerede konstateret én gang: speccen lister `divider_color` på `_divider`, men den
rigtige Horizon-`_divider` har kun `thickness`, `corner_radius`, `width_percent`,
`padding-block-start`, `padding-block-end`. Havde vi fulgt speccen, var der kommet et
merchant-felt uden modstykke i Horizon.

Kopiér **ikke** Horizons Liquid-krop — den kalder deres egne snippets (`{% render 'divider' %}`
osv.), som vi ikke har og ikke skal have. Det er kun `{% schema %}`-blokken der er kilden;
kroppen skrives mod vores egne snippets, jf. wrapper-tabellen ovenfor.

Horizons egne `t:`-nøgler (`t:names.divider`, `t:settings.thickness`, …) matcher ikke vores
locale-fil. Oversæt dem til batchens eget prefix (se konflikttabellen nedenfor) — nøglens *navn*
er ikke en del af portabilitetskontrakten, kun settings-`id` og bloktypens filnavn er.

## Verifikationsopsætning

*Alle batch-filers verifikationstrin refererer hertil. Ret det ét sted, ikke tretten.*

Butikken er stadig under opbygning og betjener ikke kunder (besluttet af Lars, 2026-08-14), så
der oprettes **ikke** et separat preview-tema. Verifikation sker på det GitHub-forbundne tema
efter merge til `main`.

| | |
|---|---|
| **Tema** | `TNT/main`, id `194474541389` — **publiceret (MAIN)**, forbundet til branch `main` |
| **Theme editor** | `https://admin.shopify.com/store/mpxdae-40/themes/194474541389/editor` |
| **Storefront** | `https://shopify.textilogvoksdug.dk/` — apex-domænet viser *ikke* temaet |
| **Testside** | theme editor → sidevælgeren øverst → **Pages → Bloktest** (template `page.blok-test`) |

### Testsiden

Batch 1 opretter `templates/page.blok-test.json` og en Shopify-side med handle `blok-test`.
**Al blok-verifikation foregår der**, ikke på forsiden eller produktsiden. To grunde:

1. Temaet er GitHub-forbundet, så ændringer i theme editoren committes tilbage til `main`.
   Verificerer man ved at droppe testblokke ind på forsiden, ryger de i `templates/index.json`
   og dermed i git.
2. Testsiden er også hvor Horizon-JSON indsættes i portabilitetstesten.

Undtagelser er eksplicit markeret i batch-filerne: regressionstjek der *skal* ske på forsiden
eller produktsiden (batch 1 trin 1.1, batch 2 trin 2.1, hele batch 4).

Siden slettes i batch 5 trin 5.4.

### Tre lag

**Automatisk:** `npx shopify theme check`. Beviser at Liquid parser og at schema-JSON er gyldig.
Beviser **ikke** at siden virker — hver bug i `docs/failure-log.md` fra 2026-08-05 passerede
theme-check rent. Ingen af de tre lag kan erstatte de andre.

**Manuel, per blok:** hvert trin i batch-filerne angiver præcis hvad der åbnes, hvilke settings
der ændres, og hvad der skal ses. Det er trinnets afslutning — ikke commit'en.

**Portabilitetstest, per batch:** sidste trin i hver batch-fil. Et Horizon-template-JSON der
bruger batchens blokke indsættes i `templates/page.blok-test.json`, og siden skal rendere med
indholdet intakt. Det er den eneste direkte måling af mål 2 og kan ikke erstattes af theme-check
— en ikke-matchende settings-nøgle er gyldig JSON og gyldig Liquid, den er bare tom.
Kildemateriale: det upublicerede tema **Horizon** (`190460559693`) i samme butik er et ægte
Horizon-tema; dets `templates/*.json` kan hentes via Admin API eller theme editorens kodeeditor.

---

## Batches

Fem batches. Hver er sin egen worktree/branch, udvikles sideløbende, merges én ad gangen efter
Lars' eksplicitte go-ahead. Inden for en batch: **ét commit per blok**, så en regression kan
spores til én fil.

| # | Batch | Fil | Indhold | Afhænger af |
|---|---|---|---|---|
| 1 | Layout & tekst | [batch-1](2026-08-14-primitive-theme-blocks-batch-1-layout-text.md) | testside, `block-padding-vars`, `_heading`, `_divider`, `spacer`, `custom-liquid`, `text`-paritet, slet `product-banner-text` | — |
| 2 | Medier & handling | [batch-2](2026-08-14-primitive-theme-blocks-batch-2-media-action.md) | `button` (+snippet), `image`, `icon`, `video` (+2 snippets) | rebase efter 1 |
| 3 | Commerce | [batch-3](2026-08-14-primitive-theme-blocks-batch-3-commerce.md) | 13 sprite-symbols, `social-links`, `product-card`, `collection-card`, `email-signup`, `menu` | rebase efter 1 |
| 4 | Container | [batch-4](2026-08-14-primitive-theme-blocks-batch-4-container.md) | omlæg `group`, migrér 15 instanser, slet `card` | rebase efter 1 |
| 5 | Oprydning | [batch-5](2026-08-14-primitive-theme-blocks-batch-5-cleanup.md) | migrér `collection.json`/`product.json` til `_heading`, slet `page-title`, slet testsiden | **batch 1** |

**Merge-rækkefølge: 1 → 2 → 3 → 4 → 5.**

Batch 1–4 er uafhængige på filniveau, men batch 2–4 bygger på batch 1's `block-padding-vars` og
skal rebase på `main` efter batch 1 er merget. Det er accepteret; alternativet er at duplikere
padding-logikken i fire branches.

**Batch 4 rører live templates (forsiden og produktsiden) og landes helt alene, sidst før 5.**

### Delte filer og konflikthåndtering

1. **`assets/output.css`** — kompileret artefakt som alle batches regenererer. Garanteret
   konflikt. Løses **ikke** ved tekstfletning: tag `main`s version og kør
   `npm run tailwind:build` på ny som del af merge-committen.
2. **`locales/en.default.schema.json`** — hver batch får sit eget top-level objekt, så to
   batches aldrig skriver samme linje:

   | Batch | Prefix | Eksempel |
   |---|---|---|
   | 1 | `blocks_layout` | `t:blocks_layout.heading` |
   | 2 | `blocks_media` | `t:blocks_media.image` |
   | 3 | `blocks_commerce` | `t:blocks_commerce.menu` |
   | 4 | `blocks_container` | `t:blocks_container.group` |
   | 5 | genbruger batch 1's | — |

   Objektet indsættes umiddelbart før filens afsluttende `}`. Opstår der alligevel konflikt på
   den linje: behold begge objekter — det er altid den rigtige løsning her.
   Bemærk at filen har en `/* … */`-kommentarheader og derfor ikke er parsebar med en almindelig
   JSON-parser; rediger den som tekst.
3. **`snippets/block-padding-vars.liquid`** og **`sections/section.liquid`** — kun batch 1.
4. **`snippets/button.liquid`** — kun batch 2. **`snippets/icon-sprite.liquid`** — kun batch 3.

### Kadence per batch

1. Færdiggør alle trin i batch-filen, ét commit per blok, hvert trin manuelt verificeret.
2. `npx shopify theme check` — ingen nye fejl mod
   `docs/baselines/2026-08-05-theme-check-baseline.txt`.
3. `npm run build`, commit artefakter.
4. `git rev-parse --abbrev-ref HEAD` → push branchen.
5. Fortæl Lars hvad der skal verificeres, og **vent på eksplicit go-ahead**. Merge aldrig selv.
6. Efter go-ahead: merge til `main`, `npm run bump-version`, push. (Push til `main` gøres af
   Lars — agenten er blokeret fra det.)
7. Lars verificerer i theme editoren. **Først derefter** merges næste batch.

---

## Erklærede huller i testdækningen

Bevidste valg, ikke oversete mangler.

- **Ingen automatiseret rendering-test.** Repoet har ingen testrunner; ingen blok får
  programmatisk verifikation af output. Afbødning: al render-logik ligger i snippets der
  allerede er i produktion, og blokfilerne er schema + ét `{% render %}`-kald. Det er derfor
  det per-blok-manuelle lag er obligatorisk og ikke kan skippes.
- **Typografi-paritet er delvis** (den erklærede afvigelse). Portabilitetstesten vil vise tekst
  i preset-størrelse frem for Horizons håndsatte px. Forventet, ikke en fejl.
- **`video`s eksterne facade** kan kun verificeres manuelt: netværkspanelet skal vise nul
  YouTube-requests før klik.
- **`card` → `group`-migreringen** har tre stille fejlkilder (to forskellige værdivokabularer
  plus en afvigende padding-default). Kan kun fanges visuelt på forsiden og produktsiden —
  derfor har batch 4 et verifikationstrin per migreret template, ikke ét til sidst.

## Risici

- **`main` er den publicerede storefront** (tema `194474541389`). Butikken betjener endnu ikke
  kunder, men enhver merge er synlig med det samme. Én batch ad gangen, aldrig to.
- **Batch 4 rører forsiden og produktsiden.** Landes alene med eksplicit visuel godkendelse.
- **`snippets/button.liquid` ændres i batch 2** og bruges af produktsidens "Læg i kurv". Begge
  nye params er valgfri, men knappen verificeres i samme runde (trin 2.1).

## Failure-log

Ingen af disse ændringer er bugfixes, så der oprettes ikke `F-NNN`-poster proaktivt.
Introducerer en batch en regression, logges den efter den normale regel: post i
`docs/failure-log.md` i samme commit som rettelsen.
