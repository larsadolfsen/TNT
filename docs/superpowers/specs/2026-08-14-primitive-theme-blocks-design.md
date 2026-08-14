# Primitive theme blocks — design

**Dato:** 2026-08-14
**Status:** godkendt design, klar til implementeringsplan

## Mål

To mål, hvor det andet er bindende for hvordan det første udføres.

**1. Lukke builder-hullet.** Temaet mangler de blok-primitiver merchants forventer af en OS 2.0-builder. Sammenlignet med Shopify Horizon har vi `text`, `card`, `group`, `badge`, `accordion`, `page-title` og en række produkt-/header-specifikke blokke — men ingen `image`, `button`, `icon`, `heading`, `divider`, `spacer`, `video` eller `custom-liquid`. Uden dem kan man reelt ikke bygge en side i theme editoren.

**2. Skift fra Horizon til TNT må ikke ødelægge noget.** Horizon er Shopifys eget flagskibstema, så det er den realistiske kilde en butik kommer fra. En Horizon-butiks `templates/*.json` skal kunne løftes over i TNT og stadig rendere.

Mål 2 dikterer alle navnevalg i mål 1. Blok-indhold lever i template-JSON som `"type": "<filnavn>"` plus settings-nøgler. Hedder en nøgle noget andet hos os, falder værdien på gulvet — Shopify dropper settings der ikke findes i schemaet, så en fallback-læsning i Liquid kan ikke redde den. Der findes ingen mellemvej hvor begge navne virker uden at vise merchanten dobbelte felter.

**Derfor: filnavne og settings-id'er spejler Horizon 1:1, medmindre denne spec eksplicit erklærer en afvigelse.**

## Ikke-mål

- Sektioner. Kun `blocks/`.
- Horizon-paritet for temaets *eksisterende* produkt-, header- og footer-blokke. Kun de blokke der er nævnt her.
- Ny typografi eller nye designtokens.
- `.type-*`-migreringen af resten af temaet (`docs/typography-inventory.md`).

## Designprincip: alt er en wrapper

Ingen af de nye blokke må skrive markup der allerede findes. Hver blok er en tynd `{% render %}`-wrapper om en eksisterende snippet, plus et schema.

| Blok (Horizon-filnavn) | Genbruger | Nyt der skrives |
|---|---|---|
| `_heading` | `snippets/text-style.liquid` | — |
| `button` | `snippets/button.liquid` | snippet udvides: `width`, custom-farve-hooks |
| `image` | `snippets/image.liquid` | — |
| `icon` | `snippets/icon.liquid` + `icon-sprite.liquid` | 45-vejs `select` genereres fra sprite |
| `_divider` | — | ~15 linjer CSS, bruger `--color-outline-variant` |
| `spacer` | — | ~10 linjer CSS |
| `custom-liquid` | mønster fra `sections/custom-liquid.liquid` | — |
| `video` | `snippets/image.liquid` (cover) | `snippets/video-native.liquid`, `snippets/video-external.liquid` |
| `product-card` | `snippets/product-card.liquid` | — |
| `collection-card` | `snippets/collection-card.liquid` | — |
| `email-signup` | `snippets/newsletter-form.liquid` | — |
| `menu` | `linklists` global | — |
| `social-links` | `snippets/icon.liquid` | 13 brand-symbols i sprite |

Ingen nye farvetokens. `_divider` og borders bruger `--color-outline-variant`, som allerede findes.

## Private blokke: `_heading` og `_divider`

Horizon navngiver disse to med understreg. Det er ikke kosmetik — Shopifys dokumentation for theme block targeting: underscore-præfiksede blokke *"would be excluded from appearing in the block picker for blocks and sections that accept blocks with type `@theme`"*.

Vi skal have begge dele: filnavnet skal matche for at Horizon-JSON virker, og blokkene skal kunne vælges af vores merchants. Løsningen er eksplicit targeting i `sections/section.liquid`:

```json
"blocks": [
  { "type": "@theme" },
  { "type": "@app" },
  { "type": "_heading" },
  { "type": "_divider" }
]
```

Samme liste giver samtidig "recommended blocks"-effekten: de nævnte blokke ligger øverst i pickeren, resten under *Show all*.

Denne ændring af `section.liquid` hører til batch 1, ikke batch 5 — uden den er `_heading` og `_divider` usynlige og dermed uverificerbare.

## Fælles konventioner

Alle nye filer følger `blocks/text.liquid`s struktur:

1. `{% doc %}`-header med `@example`
2. `{% style %}` med `{% render 'block-padding-vars', block: block %}` mod `#shopify-block-{{ block.id }}.shopify-block`
3. Markup der kun kalder `{% render %}` — ingen inline `<svg>`, ingen genskrevet knap-markup
4. `{{ block.shopify_attributes }}` på rodelementet
5. `{% schema %}` med mindst ét `presets`-objekt med `"category"`, ellers vises blokken ikke i pickeren
6. Alle labels som `t:`-nøgler i `locales/en.default.schema.json` — ingen hardcoded brugervendt tekst

### Padding: logiske nøgler

Nye blokke bruger Horizons `padding-block-start`, `padding-block-end`, `padding-inline-start`, `padding-inline-end` — **ikke** temaets hidtidige `padding_top`/`padding_bottom`/`padding_sides`.

`snippets/block-padding-vars.liquid` udvides til at læse de logiske nøgler først og falde tilbage til de gamle:

```liquid
--block-padding-top: {{ block.settings["padding-block-start"] | default: block.settings.padding_top | default: top_default | default: 0 }}px;
```

Ét snippet, begge konventioner, ingen dobbelte merchant-felter — schemaet afgør hvilke der findes på den enkelte blok. Eksisterende blokke røres ikke.

Bemærk at Horizon har fire uafhængige padding-felter hvor vi har tre (`padding_sides` dækker begge sider). De nye blokke får fire.

`spacer` har ingen padding-felter — blokken *er* afstand.

### Typografi: erklæret afvigelse fra Horizon

Horizons `_heading` og `text` eksponerer `type_preset`, `font`, `font_size`, `line_height`, `letter_spacing`, `case` og `wrap`.

Vi tager `type_preset`, `wrap`, `alignment` og `text_color`. Vi **dropper** `font`, `font_size`, `line_height`, `letter_spacing` og `case`.

Begrundelse: de fem droppede er rå per-instans-værdier. Det er præcis det mønster `.type-*`-migreringen (`docs/typography-inventory.md`) er i gang med at fjerne — 74 tekstvarianter reduceret til syv størrelser. At genindføre dem som merchant-settings ville underminere migreringen mens den kører.

`type_preset` mappes til vores roller i `text-style.liquid`. Horizon-JSON der bærer en `font_size` renderer stadig — teksten kommer bare i preset-størrelsen i stedet for den håndsatte px-værdi. Det er tab af finjustering, ikke af indhold.

Dette er den eneste bevidste paritetsafvigelse i speccen. Alt andet spejler Horizon.

## Blok-specifikationer

Settings-id'er er hentet direkte fra Horizons faktiske schemas.

### `_heading`
`type_preset`, `text`, `read_only`, `alignment`, `show_alignment`, `text_color`, `wrap`, padding×4.
Vores tilføjelse: `source` (custom | page_title | collection_title) og `show_description` — det der gør `page-title` overflødig. Nye id'er der ikke findes i Horizon; de er additive og bryder ikke portabilitet.
Dropper: `font`, `font_size`, `line_height`, `letter_spacing`, `case`.

### `button`
`label`, `link`, `open_in_new_tab`, `style_class`, `custom_button_background`, `custom_button_text`, `custom_button_border`, `link_text_color`, `width`, `custom_width`, `width_mobile`, `custom_width_mobile`.
Ingen padding-felter (Horizon har dem ikke på `button`).
`style_class` er Horizons variant-mekanisme og mappes til `snippets/button.liquid`s `variant`. Snippet udvides med `width` og custom-farve-hooks; begge nye params er valgfri, så eksisterende kaldesteder er upåvirkede.

### `image`
`image`, `link`, `image_ratio`, `width`, `custom_width`, `width_mobile`, `custom_width_mobile`, `height`, `border`, `border_width`, `border_opacity`, `border_color`, `border_radius`, padding×4.
`snippets/image.liquid` dækker allerede fokuspunkt, `fill`, `srcset` og `sizes`.

### `icon`
`icon`, `image_upload`, `width`, `link`, `open_in_new_tab`, `icon_color`.
`icon`-select genereres fra `grep -oE '<symbol id="[^"]+"' snippets/icon-sprite.liquid`, så listen ikke driver fra spriten. Horizon-værdier der ikke findes i vores sprite falder tilbage til intet ikon frem for et brækket `<use>`.

### `_divider`
`thickness`, `corner_radius`, `divider_color`, `width_percent`, `padding-block-start`, `padding-block-end`.

### `spacer`
`size`, `percent_size`, `pixel_size`, `custom_mobile_size`, `size_mobile`, `percent_size_mobile`, `pixel_size_mobile`.

### `custom-liquid`
`custom_liquid`. Ét felt.

### `video`
`source`, `video`, `video_url`, `video_autoplay`, `video_loop`, `cover_image`, `alt`, `custom_width`, `custom_width_mobile`, `aspect_ratio`, `border`, `border_width`, `border_opacity`, `border_color`, `border_radius`, padding×4.

To render-veje, hver i sin snippet:
- `snippets/video-native.liquid` — `video_tag` med poster fra `cover_image`
- `snippets/video-external.liquid` — facade: coverbillede + afspil-knap; iframe indsættes først ved klik

Facaden er ikke valgfri: en autoloaded YouTube-iframe koster Core Web Vitals og sætter cookies før samtykke.

### `product-card`
`product`, `product_card_gap`, `width`, `custom_width`, `width_mobile`, `custom_width_mobile`, `background_color`, `border`, `border_width`, `border_opacity`, `border_color`, `border_radius`, padding×4. Al rendering gennem `snippets/product-card.liquid`.

### `collection-card`
`collection`, `placement`, `horizontal_alignment`, `vertical_alignment`, `collection_card_gap`, `background_color`, `border`, `border_width`, `border_opacity`, `border_color`, `border_radius`. Gennem `snippets/collection-card.liquid`.

### `email-signup`
`width`, `custom_width`, `heading`, `heading_text_color`, `heading_preset`, `border_style`, `input_style`, `border_width`, `border_radius`, `input_background_color`, `input_text_color`, `input_border_color`, `input_type_preset`, `style_class`, `custom_button_background`, `custom_button_text`, `custom_button_border`, `link_text_color`, `display_type`, `label`, `integrated_button`, `button_type_preset`, padding×4.
Den bredeste settings-flade i batchen. Rendering gennem `snippets/newsletter-form.liquid`.

### `menu`
`menu`, `heading`, `menu_spacing`, `show_as_accordion`, `accordion_icon`, `accordion_dividers`, `background_color`, `text_color`, `heading_preset`, `link_preset`, padding×4.

### `social-links`
`icon_color` plus 14 URL-felter: `facebook_url`, `instagram_url`, `youtube_url`, `tiktok_url`, `twitter_url`, `threads_url`, `linkedin_url`, `bluesky_url`, `snapchat_url`, `pinterest_url`, `tumblr_url`, `vimeo_url`, `custom_url`.

Alle 13 netværk deklareres, så Horizon-JSON er tabsfri. Det kræver 13 nye `<symbol>` i `snippets/icon-sprite.liquid`, hentet fra Simple Icons med samme 24×24 viewBox som resten af spriten, så `icon.liquid`s `1em`-sizing holder.

## Datamodel og migreringer

Blok-instanser lever i template-JSON. Blok*typen* er filnavnet; instans-id'et genereres af Shopify. Migrering betyder: skriv nye `"type"`-værdier og oversæt settings-nøgler i JSON'en.

### `product-banner-text` → slettes uden migrering

Refereret fra **ingen** template. Ren død kode. Funktionen dækkes fremover af `image` + `_heading` + `text` i en `group`.

### `page-title` → `_heading`

Brugt i `templates/collection.json` og `templates/product.json`.

| `page-title` | `_heading` |
|---|---|
| (implicit `<h1>`) | `type_preset` for sidetitel |
| `title_override` tom | `source: "page_title"` |
| `title_override` sat | `source: "custom"`, `text: <værdien>` |
| `show_description` | `show_description` (uændret) |
| `padding_top/bottom/sides` | `padding-block-start` / `padding-block-end` / `padding-inline-start` + `-end` |

Derefter slettes `blocks/page-title.liquid`.

Sidebemærkning: `page-title` hardcoder `text-2xl md:text-2xl` — samme værdi på begge breakpoints. Fejlen forsvinder med `type_preset`.

### `text` → Horizon-paritet

Vores eksisterende `text.liquid` bruger `text`, `alignment`, `padding_top/bottom/sides`. Horizons bruger `text`, `width`, `max_width`, `alignment`, `type_preset`, `text_color`, `background`, `background_color`, `corner_radius`, padding×4.

`text` opdateres til Horizons id'er (minus de fem droppede typografifelter). Den bruges i eksisterende templates, så den kræver samme migreringsdisciplin som `card` — men er langt enklere, da kun padding-nøglerne skifter navn.

### `card` → `group`

Horizons `group` er foreningsmængden af vores `card` og vores `group`: retning, alignment, gap, bredde/højde, baggrundsfarve/-billede/-video, overlay, border, radius, link, padding. Horizon har **ingen** merchant-vendt `card` — deres `_card.liquid` er privat og kun til produkt-/kollektionskort.

Vores to blokke duplikerer allerede `span_mobile/tablet/desktop`, `alignment` og alle tre padding-felter. `card` er `group` + overflade.

`group` omlægges til Horizons id'er:
`content_direction`, `vertical_on_mobile`, `horizontal_alignment`, `vertical_alignment`, `align_baseline`, `gap`, `width`, `custom_width`, `width_mobile`, `custom_width_mobile`, `height`, `custom_height`, `background_media`, `background_color`, `video`, `video_position`, `background_image`, `background_image_position`, `toggle_overlay`, `overlay_color`, `overlay_style`, `gradient_direction`, `border`, `border_width`, `border_opacity`, `border_color`, `border_radius`, `link`, `open_in_new_tab`, `placeholder`, padding×4.

**Beholdes ud over Horizon:** `span_mobile`, `span_tablet`, `span_desktop`, `hide_on_mobile`, `hide_on_desktop`, `sticky`. `span_*` driver temaets `.grid-layout`-system, som Horizon ikke har noget modstykke til; de er additive og bryder ikke portabilitet.

Settings-mapping for de 15 instanser (12 `card`, 3 `group`):

| Fra | Til | Note |
|---|---|---|
| `card.grid_direction: "vertical"` | `content_direction` | **forskelligt værdivokabular** — oversættes, ikke kopieres |
| `group.layout_direction: "group--vertical"` | `content_direction` | ligeledes |
| `card.card_link` | `link` | omdøbt |
| `card.alignment` (text_alignment: left/center/right) | `horizontal_alignment` | **oversættes** |
| `group.alignment` (flex-start/center/flex-end) | `horizontal_alignment` | **oversættes** |
| `card.block_gap` | `gap` | omdøbt |
| `card.image`, `image_placement`, `image_aspect_ratio` | `background_image`, `background_image_position` | delvis; `image_aspect_ratio` har intet modstykke |
| `card.image_overlay_opacity` | `toggle_overlay` + `overlay_color` | opacity bliver til farve med alfa |
| `padding_*` (default 24 i `card`, 0 i `group`) | padding×4 | **defaults afviger** — eksplicitte værdier skal skrives ind |
| `span_*`, `hide_on_*`, `sticky` | uændret | identiske |

De tre fremhævede rækker er hvor migreringen kan gå stille galt. De skal verificeres visuelt, ikke kun med theme-check.

`card` slettes først når begge templates er migreret og verificeret i browseren.

## Batches

Fem batches. Hver er sin egen worktree/branch, udvikles sideløbende, merges én ad gangen efter brugerens godkendelse. Inden for en batch: **ét commit per blok**, så en regression kan spores til én fil.

| # | Batch | Indhold | Afhænger af |
|---|---|---|---|
| 1 | Layout & tekst | `_heading`, `_divider`, `spacer`, `custom-liquid`, `text`-paritet, targeting i `section.liquid`, slet `product-banner-text` | — |
| 2 | Medier & handling | `image`, `icon`, `button`, `video` | — |
| 3 | Commerce | `product-card`, `collection-card`, `email-signup`, `menu`, `social-links` + 13 sprite-symbols | — |
| 4 | Container | omlæg `group` til Horizon-id'er, migrér 15 instanser i `index.json`+`product.json`, slet `card` | — |
| 5 | Oprydning | migrér `collection.json`/`product.json` til `_heading`, slet `page-title` | **batch 1** |

Batch 1–4 er uafhængige på filniveau. Kun batch 5 er blokeret.

`sections/section.liquid` flyttes fra batch 5 til batch 1, fordi `_heading` og `_divider` ellers er usynlige i pickeren og dermed uverificerbare.

**Merge-rækkefølge:** 1 → 2 → 3 → 4 → 5. Batch 4 er den eneste der rører live templates og landes helt alene.

### Delte filer og konflikthåndtering

1. **`assets/output.css`** — kompileret artefakt som alle batches regenererer. Garanteret konflikt. Løses **ikke** ved tekstfletning: tag `main`s version og kør `npm run tailwind:build` på ny som del af merge-committen.
2. **`locales/en.default.schema.json`** — alle batches tilføjer `t:`-nøgler. Hver batch får en aftalt nøgle-prefix, så to batches aldrig skriver samme linje.
3. **`snippets/block-padding-vars.liquid`** — udvides med logiske nøgler. **Kun batch 1** rører den; batch 2–4 bygger videre på resultatet og skal derfor rebase på `main` efter batch 1 er merget.
4. **`sections/section.liquid`** — **kun batch 1**.

### Efter hver merge

`npm run bump-version` → push til `main` → brugeren verificerer i browseren → først derefter merges næste batch.

## Verifikation

Repoet har ingen testrunner. Verifikation er tre lag:

**Automatisk:** `npx shopify theme check`. Beviser at Liquid parser og at schema-JSON er gyldig. Beviser **ikke** at siden virker — hver bug i `docs/failure-log.md` fra 2026-08-05 passerede theme-check rent.

**Manuel, per blok:** planen angiver for hver blok præcis hvad der skal åbnes i theme editoren på preview-temaet, hvilke settings der skal ændres, og hvad der skal ses.

**Portabilitetstest, per batch:** et Horizon-template-JSON der bruger batchens blokke lægges ind i preview-temaet, og siden skal rendere med indholdet intact. Det er den eneste direkte måling af mål 2, og den kan ikke erstattes af theme-check — en ikke-matchende settings-nøgle er gyldig JSON og gyldig Liquid, den er bare tom.

### Erklærede huller i testdækningen

Bevidste valg, ikke oversete mangler:

- **Ingen automatiseret rendering-test.** Ingen blok har programmatisk verifikation af output. Afbødning: al render-logik ligger i snippets der allerede er i produktion; blokfilerne er schema + ét `{% render %}`-kald.
- **Typografi-paritet er delvis** (se afvigelsen ovenfor). Portabilitetstesten vil vise tekst i preset-størrelse frem for Horizons håndsatte px. Det er forventet og ikke en fejl.
- **`video`s eksterne facade** kan kun verificeres manuelt: netværkspanelet skal vise nul YouTube-requests før klik.
- **`card` → `group`-migreringen** har tre stille fejlkilder (to værdivokabularer + padding-default). Kan kun fanges visuelt på forsiden og produktsiden.

## Risici

- **`main` er den live storefront.** Batch 4 rører forsiden og produktsiden. Landes alene, sidst, med eksplicit visuel godkendelse.
- **Batch 1 er reelt blokerende alligevel.** Den ændrer `block-padding-vars` og `section.liquid`, som batch 2–4 bygger på. De kan udvikles parallelt, men skal rebase efter batch 1's merge. Det er accepteret — alternativet er at duplikere padding-logikken i fire branches.
- **`snippets/button.liquid` ændres** i batch 2 og bruges af produktsiden. Begge nye params er valgfri, men produktsidens "Læg i kurv" verificeres i samme runde.
- **300-blok-loftet.** 39 blokfiler i dag, 49 efter denne spec. Ingen risiko.

## Failure-log

Ingen af disse ændringer er bugfixes, så der oprettes ikke `F-NNN`-poster proaktivt. Introducerer en batch en regression, logges den efter den normale regel: post i `docs/failure-log.md` i samme commit som rettelsen.
