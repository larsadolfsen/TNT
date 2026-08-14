# Batch 1 — Layout & tekst

**Masterplan:** [2026-08-14-primitive-theme-blocks-master.md](2026-08-14-primitive-theme-blocks-master.md)
**Branch:** egen worktree, fx `claude/horizon-blokke-batch-1`
**Afhænger af:** intet. **Blokerer:** batch 2–5.
**Locale-prefix:** `blocks_layout` → `t:blocks_layout.*`
**Ejer disse delte filer alene:** `snippets/block-padding-vars.liquid`, `sections/section.liquid`

Læs masterplanens **Kilde til Horizon-schemas** før du skriver et schema. Speccens
settings-lister er en oversigt; Horizon-filen er kontrakten.

---

## Rækkefølge og hvorfor

`block-padding-vars` først, fordi alle nye blokke læser den. `_heading` før `_divider`, fordi
`_heading` er den første blok der beviser at både padding-nøglerne og targeting-mekanismen
virker. `text`-omlægningen sidst blandt blokkene, fordi den rører 24 gemte instanser og derfor
er den eneste i batchen der kan gå ud over eksisterende sider.

Ét commit per trin. Hvert trin slutter med en manuel verifikation — commit'en er ikke
afslutningen.

---

## Fælles for batchen: to nye snippets

To ting bruges af både `_heading` og `text`, og må derfor kun skrives ét sted (projektregel:
samme mønster anden gang = udtræk først).

### `snippets/type-preset-class.liquid` (ny, oprettes i trin 1.2)

Oversætter Horizons `type_preset`-værdi til vores `.type-*`-klassestreng via
`snippets/text-style.liquid`. Det er her den erklærede typografi-afvigelse bor.

| Horizon `type_preset` | vores rolle | resultat |
|---|---|---|
| `rte` | `body` | tom streng (14px/400 arves) + `.rte` på wrapperen |
| `paragraph` | `body` | tom streng |
| `h1` | `title-page` | `type-2xl type-bold type-serif` |
| `h2` | `title-section` | `type-xl type-bold type-serif` |
| `h3` | `title-card` | `type-lg type-bold type-serif` |
| `h4` | `title-row` | `type-md type-strong` |
| `h5` | `body-strong` | `type-strong` |
| `h6` | `label` | `type-xs type-bold type-caps type-muted` |
| `custom` | `body` | tom streng — vi har droppet de fem felter `custom` ellers styrer |

Ukendt/manglende værdi → `body`, samme degradering som `text-style.liquid` selv bruger.

### Farve: Horizons `color`, ikke `text_color`

**Speccen skriver `text_color`. Det rigtige id er `color`.** Værdierne er CSS-strenge:
`var(--color-foreground)`, `var(--color-foreground-heading)`, `var(--color-primary)`.

Behold **option-værdierne ordret** — de står i Horizon-JSON og skal matche — men skriv dem
ikke direkte ud i CSS (vi har ikke `--color-foreground`). Mappes i Liquid med en `case`:

| Horizon-værdi | vores klasse |
|---|---|
| `var(--color-foreground)` | ingen (arver `--color-text`) |
| `var(--color-foreground-heading)` | ingen (samme token i vores tema) |
| `var(--color-primary)` | `text-primary` |

Ingen nye farvetokens. Mappingen lægges i `snippets/type-preset-class.liquid` sammen med
preset-mappingen, så begge blokke kalder ét snippet.

---

## Trin 1.0 — Testside

**Filer:** `templates/page.blok-test.json` (ny)

Al blok-verifikation i batch 1–3 foregår på denne side, ikke på forsiden. Begrundelsen står i
masterplanens **Verifikationsopsætning**: temaet er GitHub-forbundet, så editor-ændringer
committes tilbage til `main` — testblokke på forsiden ryger i `templates/index.json`.

- [ ] Opret `templates/page.blok-test.json` efter mønsteret fra `templates/page.contact.json`:
      én `main`-agtig sektion plus **én tom `section`-sektion** (`"type": "section"`) med
      `"blocks": {}` og `"block_order": []`.
- [ ] Sæt sektionens `padding_top`/`padding_bottom` til noget synligt (fx 24) og
      `background_color` til `"white"`, så blokke er lette at se.
- [ ] **Manuel handling for Lars** (kan ikke gøres fra git): Shopify admin →
      `https://admin.shopify.com/store/mpxdae-40/pages` → **Tilføj side** → titel
      `Bloktest`, handle `blok-test` → i højre side under **Tema-skabelon** vælg
      `page.blok-test` → Gem. Siden må gerne være synlig; den slettes i batch 5.

**Verifikation:**
Åbn `https://shopify.textilogvoksdug.dk/pages/blok-test`. Siden skal loade med 200 og vise
header + footer og et tomt indholdsområde. Åbn derefter theme editoren
(`https://admin.shopify.com/store/mpxdae-40/themes/194474541389/editor`), skift side i
vælgeren øverst til **Pages → Bloktest**, og bekræft at der står en **Section** i venstre panel
med en **Tilføj blok**-knap under sig.

---

## Trin 1.1 — `block-padding-vars`: logiske nøgler

**Filer:** `snippets/block-padding-vars.liquid` (ændres)

Fire nye logiske nøgler læses først, med fallback til de tre gamle. Ét snippet, begge
konventioner, ingen dobbelte merchant-felter — schemaet afgør hvilke nøgler den enkelte blok
overhovedet har.

```liquid
--block-padding-top: {{ block.settings["padding-block-start"] | default: block.settings.padding_top | default: top_default | default: 0 }}px;
--block-padding-bottom: {{ block.settings["padding-block-end"] | default: block.settings.padding_bottom | default: bottom_default | default: 0 }}px;
--block-padding-left: {{ block.settings["padding-inline-start"] | default: block.settings.padding_sides | default: sides_default | default: 0 }}px;
--block-padding-right: {{ block.settings["padding-inline-end"] | default: block.settings.padding_sides | default: sides_default | default: 0 }}px;
```

- [ ] Opdatér `{% doc %}`-headeren: den beskriver i dag kun de tre gamle nøgler.
- [ ] Bemærk `default`-filterets semantik: `0` er ikke `blank`, så en eksplicit `0` i en logisk
      nøgle falder **ikke** igennem til den gamle. Det er den ønskede opførsel. Men bekræft
      det: hvis en blok har `padding-block-start: 0` gemt, skal resultatet være `0px`, ikke
      den gamle `padding_top`.
- [ ] Ingen eksisterende blok ændres i dette trin.

**Verifikation — undtagelsesvis på forsiden, ikke testsiden.** Dette er et regressionstjek af
et snippet der bruges af blokke der allerede er i drift.

Åbn `https://shopify.textilogvoksdug.dk/` før og efter. Forsidens `text`- og `card`-blokke skal
stå **præcis** som før — samme afstande, ingen sammenfald, intet der rykker. Sammenlign gerne
to screenshots. Åbn derefter theme editoren på forsiden, vælg en vilkårlig `text`-blok, træk
**Afstand i toppen** op til 100 og se afstanden vokse i preview'et; sæt den tilbage.

---

## Trin 1.2 — `_heading`

**Filer:** `blocks/_heading.liquid` (ny), `snippets/type-preset-class.liquid` (ny),
`sections/section.liquid` (targeting), `locales/en.default.schema.json`

**Genbruger:** `snippets/text-style.liquid`. Ingen ny typografi.

**Settings — hent Horizons `blocks/_heading.liquid` og kopiér id'erne:**
`type_preset`, `text` (richtext), `read_only`, `alignment`, `show_alignment`, `color`, `wrap`,
`padding-block-start`, `padding-block-end`, `padding-inline-start`, `padding-inline-end`.

- [ ] **Drop** `font`, `font_size`, `line_height`, `letter_spacing`, `case` (den erklærede
      afvigelse). `wrap` beholdes, men fjern dens `visible_if` — den er i Horizon betinget af
      `type_preset == 'custom'`, som vi ikke længere har noget indhold i.
- [ ] `read_only` og `show_alignment` beholdes med `"visible_if": "{{ false }}"` præcis som
      Horizon: de er skjulte flag som forældre-presets sætter, ikke merchant-felter.
- [ ] **Vores tilføjelser** (additive, bryder ikke portabilitet):
      `source` (select: `custom` | `page_title` | `collection_title` | **`product_title`**,
      default `custom`) og `show_description` (checkbox, default false, `visible_if` på
      `source != 'custom'`). Det er dem der gør `page-title` overflødig i batch 5.
      Brug samme kilder som `blocks/page-title.liquid` gør i dag — læs den før du skriver.
- [ ] **`product_title` er ikke valgfri, selv om speccen ikke nævner den.** Batch 5 skal
      migrere tre `page-title`-instanser, og alle tre har en dynamisk kilde gemt i
      `title_override` — `{{ closest.collection.title }}` i `collection.json` og
      `{{ closest.product.title }}` **to gange** i `product.json`. Uden `product_title` er de
      to sidste ikke migrerbare.
- [ ] Grunden til at kilden skal være et `select` og ikke bare en dynamisk kilde i tekstfeltet:
      `page-title.title_override` er `type: text`, som understøtter dynamiske kilder.
      `_heading.text` er `richtext` (Horizons type, som vi skal matche), og det gør den ikke.
- [ ] `show_description` skal hente beskrivelsen fra samme objekt som `source` peger på —
      `collection.description` ved `collection_title`, `product.description` ved
      `product_title`. Alle tre eksisterende instanser har `show_description: true`, så den vej
      er i brug og skal virke fra dag ét.
- [ ] **Horizons `_heading` har ingen `presets`.** Tilføj ét (`"category": "t:…layout"`),
      ellers kan blokken ikke vælges hos os. Additivt; ændrer intet for Horizon-JSON.
- [ ] Overskriftsniveau: `type_preset` `h1`–`h6` skal også styre **taggen**, ikke kun klassen —
      en `h2`-preset der renderer et `<div>` er en tilgængeligheds- og SEO-regression.
      `rte`/`paragraph`/`custom` → `<div class="rte">`.
- [ ] Tilføj `{ "type": "_heading" }` til `"blocks"`-arrayet i `sections/section.liquid`
      **i denne commit** — ikke før. Nævner targeting-listen en bloktype der ikke findes,
      afviser GitHub-syncen filen uden at sige noget (failure-log mønster 14).
- [ ] `t:blocks_layout.*`-nøgler for alle labels.

**Verifikation:**
Theme editor → **Pages → Bloktest** → Section → **Tilføj blok**. `_heading` skal ligge
**øverst** i pickeren (targeting giver "recommended blocks"-effekten), ikke under *Vis alle*.

1. Tilføj blokken. Skriv `Test overskrift` i tekstfeltet — den skal vises i preview'et.
2. Skift **Preset** gennem `h1`, `h2`, `h3`: teksten skal blive **synligt mindre for hvert
   trin** og være serif og fed. `h4` skifter til sans-serif. `h6` bliver lille, versal og dæmpet.
3. Sæt Preset til `Standard` (`rte`): teksten skal falde tilbage til almindelig brødtekst i
   14px — ingen fed, ingen serif.
4. Skift **Justering** til centreret og til højre: teksten skal flytte sig begge gange.
5. Træk **Afstand i toppen** til 60: der skal komme luft over overskriften. Det verificerer
   samtidig at trin 1.1's logiske nøgler virker.
6. Åbn browserens element-inspektør på overskriften: taggen skal være `<h2>` når preset er
   `h2`. (Det er den eneste del af dette trin der ikke kan ses i preview-billedet alene.)
7. Sæt **Kilde** til `Sidetitel`: teksten skal skifte til `Bloktest`, og tekstfeltet skal
   forsvinde fra panelet. Slå **Vis beskrivelse** til: sidens indhold skal komme frem under
   overskriften.
8. `collection_title`- og `product_title`-vejene kan ikke testes på testsiden — de har ingen
   kollektion eller produkt i konteksten. De verificeres i batch 5, hvor de tages i brug på
   de rigtige templates. Bekræft her blot at de to valg findes i dropdownen og ikke får
   blokken til at fejle eller forsvinde når de vælges på en side uden kollektion/produkt.

---

## Trin 1.3 — `_divider`

**Filer:** `blocks/_divider.liquid` (ny), `assets/input.css` (+ regenereret `output.css`),
`sections/section.liquid` (targeting), `locales/en.default.schema.json`

**Settings — Horizons faktiske liste:** `thickness` (range 0.5–5, step 0.5, default 1),
`corner_radius` (select `square`|`rounded`, `visible_if` på `thickness > 1`),
`width_percent` (range 5–100%, default 100), `padding-block-start`, `padding-block-end`.

- [ ] **Speccen lister `divider_color`. Det findes ikke i Horizon.** Udelad det. Streget
      tegnes med `--color-outline-variant`, som allerede findes.
- [ ] Kun to padding-felter (ikke fire) — sådan er Horizons.
- [ ] ~15 linjer CSS i `assets/input.css`, ikke inline i blokken. Ingen `!important`.
- [ ] Tilføj `{ "type": "_divider" }` til `sections/section.liquid` i denne commit.
- [ ] `npm run tailwind:build` og commit `assets/output.css` **i samme commit**
      (failure-log mønster 11).

**Verifikation:**
Theme editor → Bloktest → Tilføj blok → `_divider` skal ligge øverst i pickeren.

1. Tilføj blokken under overskriften fra trin 1.2. En vandret streg skal være synlig med det
   samme — ikke et tomt område.
2. Træk **Tykkelse** fra 1 til 5: stregen bliver tydeligt tykkere, og **Hjørneradius** skal
   først dukke op i panelet når tykkelsen passerer 1.
3. Sæt Hjørneradius til `Rundet`: stregens ender bliver runde.
4. Træk **Længde** ned til 30 %: stregen bliver kortere.
5. Slå dark mode til på storefronten (`/pages/blok-test`, temaskifteren i headeren): stregen
   skal stadig være synlig mod den mørke baggrund. En hardcodet farve er usynlig her
   (failure-log mønster 3).

---

## Trin 1.4 — `spacer`

**Filer:** `blocks/spacer.liquid` (ny), `assets/input.css`, `locales/en.default.schema.json`

**Settings:** `size`, `percent_size`, `pixel_size`, `custom_mobile_size`, `size_mobile`,
`percent_size_mobile`, `pixel_size_mobile`. Hent Horizons fil for option-værdier og
`visible_if`-kæderne — de er indbyrdes afhængige og kan ikke gættes.

- [ ] **Ingen padding-felter.** Blokken *er* afstand. Kald derfor heller ikke
      `block-padding-vars`.
- [ ] `custom_mobile_size` styrer om mobil-felterne er synlige; uden den slået til arver mobil
      desktop-værdien.
- [ ] Failure-log mønster 10: højden sættes på wrapperen `#shopify-block-{id}.shopify-block`.
      Sæt ikke en px-højde på et indre element — så annullerer de to bokse hinanden.

**Verifikation:**
Theme editor → Bloktest.

1. Læg en `spacer` **mellem** `_heading` og `_divider` fra de foregående trin.
2. Sæt størrelse til en fast pixelværdi, fx 80: afstanden mellem overskrift og streg skal vokse
   synligt. Sæt den til 0: de to skal støde sammen igen.
3. Skift til procent-størrelse: afstanden skal ændre sig når browservinduet gøres smallere.
4. Slå **Tilpas på mobil** til og sæt en anden mobilværdi. Klik mobil-ikonet i editorens
   nederste værktøjslinje: afstanden skal være mobilværdien, ikke desktopværdien.

---

## Trin 1.5 — `custom-liquid`

**Filer:** `blocks/custom-liquid.liquid` (ny), `locales/en.default.schema.json`

**Settings:** `custom_liquid` (type `liquid`). Ét felt. Plus padding×4 hvis Horizon har dem —
tjek filen.

- [ ] Mønsteret findes allerede i `sections/custom-liquid.liquid`. Læs den; blokken er samme
      indhold i blok-indpakning.
- [ ] Ingen escaping og ingen sanitering — `liquid`-settingtypen er merchant-input og
      renderes råt. Det er Shopifys egen semantik for feltet, og at "sikre" det ville gøre
      blokken ubrugelig.

**Verifikation:**
Theme editor → Bloktest → tilføj `custom-liquid`.

1. Indsæt `<p>Hej fra custom liquid</p>` i feltet: teksten skal vises i preview'et.
2. Erstat med `{{ shop.name }}`: der skal stå `textilogvoksdug.dk`. Det beviser at Liquid
   faktisk evalueres og ikke bare printes som tekst.
3. Erstat med `{{ 2 | plus: 2 }}`: der skal stå `4`.

---

## Trin 1.6 — `text` omlægges til Horizon-paritet

**Filer:** `blocks/text.liquid` (ændres), `templates/index.json` (23 instanser),
`templates/product.json` (1 instans), `locales/en.default.schema.json`

Det farligste trin i batchen: 24 gemte instanser står på eksisterende, live sider.

**Settings — Horizons liste:** `text`, `width` (`fit-content`|`100%`), `max_width`
(`narrow`|`normal`|`none`), `alignment`, `type_preset`, `color`, `background` (checkbox),
`background_color` (color, alpha, default `#00000026`), `corner_radius` (range 0–50), padding×4.

- [ ] Drop de fem typografifelter, som i trin 1.2. Genbrug
      `snippets/type-preset-class.liquid` — skriv ikke mappingen igen.
- [ ] `alignment` har i Horizon `"visible_if": "{{ block.settings.width == '100%' }}"`.
      Behold den.
- [ ] **Failure-log mønster 2 — det er her det går galt hvis det går galt.** Schema-defaults
      backfilder ikke gemte settings. De 24 instanser har `padding_top`/`padding_bottom`/
      `padding_sides` gemt; efter omlægningen findes de nøgler ikke i schemaet.
      `block-padding-vars` læser dem stadig via fallback fra trin 1.1, **men** merchanten kan
      ikke længere justere dem fra editoren, og værdien er usynlig i panelet.
      **Derfor: omskriv alle 24 instanser i samme commit** — `padding_top` →
      `padding-block-start`, `padding_bottom` → `padding-block-end`, `padding_sides` →
      **både** `padding-inline-start` og `padding-inline-end` (samme værdi i begge; Horizon har
      fire uafhængige felter hvor vi havde tre).
- [ ] `alignment`-værdierne er uændrede (`left`/`center`/`right`) — de skal ikke oversættes.
- [ ] Tæl før og efter: `grep -c '"type": "text"' templates/index.json` skal give 23,
      `templates/product.json` 1. Og bagefter må `grep -c 'padding_top' templates/index.json`
      ikke finde nogen inde i en `text`-blok.

**Verifikation — undtagelsesvis på forsiden og produktsiden.**

1. Åbn `https://shopify.textilogvoksdug.dk/` **før** merge og gem et screenshot af hele siden.
2. Efter merge: åbn den igen. Alle 23 tekstblokke skal stå med **samme afstande og samme
   justering** som før. Der skal ikke være nogen blok der pludselig klistrer op ad naboen —
   det er præcis den fejl en tabt padding-nøgle giver.
3. Åbn en produktside og bekræft det samme for dens ene tekstblok.
4. Theme editor → forsiden → vælg en tekstblok: panelet skal nu vise **Bredde**, **Maks.
   bredde**, **Preset**, **Baggrund** og fire padding-felter — og padding-felterne skal stå
   med de **værdier siden faktisk bruger**, ikke 0. Står de på 0 mens siden ser rigtig ud, er
   JSON-migreringen ikke slået igennem og fallbacken maskerer det.
5. Slå **Baggrund** til på én tekstblok, vælg en farve og træk **Hjørneradius** op: der skal
   komme en farvet, afrundet flade bag teksten. Fortryd bagefter.

---

## Trin 1.7 — Slet `product-banner-text`

**Filer:** `blocks/product-banner-text.liquid` (slettes)

- [ ] Bekræft først at den er død kode: `grep -rn "product-banner-text" templates/ sections/`
      skal give **nul** hits. (Bekræftet 2026-08-14, men bekræft igen — en anden session kan
      have taget den i brug.)
- [ ] Slet også blokkens eventuelle CSS/JS i samme commit (failure-log mønster 9: forældreløse
      regler vinder kaskaden på generiske klassenavne).
- [ ] Fjern dens `t:`-nøgler fra locale-filen hvis de ikke bruges af andre.
- [ ] Bemærk: filsletninger kan ikke pushes via Admin API herfra; de kommer med GitHub-syncen
      ved merge.

**Verifikation:**
Efter merge: theme editor → Bloktest → Tilføj blok → søg efter `banner`. Blokken må **ikke**
længere kunne vælges. Åbn derefter forsiden og en produktside og bekræft at intet er forsvundet
— hvis noget er, var blokken ikke død, og sletningen skal rulles tilbage.

---

## Trin 1.8 — Portabilitetstest (batch-niveau)

Den eneste direkte måling af mål 2. Kan ikke erstattes af theme-check: en ikke-matchende
settings-nøgle er gyldig JSON og gyldig Liquid — den er bare tom.

- [ ] Hent et rigtigt Horizon-template-JSON fra det installerede Horizon-tema
      (`190460559693`) via Admin API — vælg et der bruger `_heading`, `text`, `_divider` og
      `spacer`. Fx `templates/page.json` eller en af deres `index`-varianter.
- [ ] Klip den del ud der kun bruger batch 1's bloktyper, og indsæt blokkene i
      `templates/page.blok-test.json`s `section`-sektion. Bevar `"type"`- og
      settings-nøglerne **ordret** — det er hele pointen.
- [ ] Commit og merge sammen med resten af batchen.

**Verifikation:**
Åbn `https://shopify.textilogvoksdug.dk/pages/blok-test`.

1. **Alle** blokke fra Horizon-JSON'en skal rendere. En blok der mangler helt betyder et
   filnavn der ikke matcher.
2. Hver overskrift skal have **sin tekst** — ikke tom. Tom tekst betyder et settings-id der
   ikke matcher.
3. Hver overskrift skal have **en størrelse der følger dens `type_preset`** — h1 større end
   h2 større end h3. At størrelserne ikke er Horizons px-værdier er **forventet** og den
   erklærede afvigelse, ikke en fejl.
4. Afstandene fra `padding-block-*` skal være synlige. Alt fladt betyder at de logiske
   padding-nøgler ikke bliver læst.
5. Theme editor → Bloktest: hver indsat blok skal kunne åbnes og vise sine settings med de
   værdier der stod i JSON'en.

---

## Afslutning af batchen

- [ ] `npx shopify theme check` — ingen nye fejl mod
      `docs/baselines/2026-08-05-theme-check-baseline.txt`.
- [ ] `npm run build`; `assets/output.css` committet.
- [ ] Opdatér `CLAUDE.md`s arkitekturafsnit: de nye blokke, `snippets/type-preset-class.liquid`
      og den logiske padding-konvention (projektregel: kortet opdateres i samme commit som
      filerne).
- [ ] `git rev-parse --abbrev-ref HEAD` → bekræft at du står på batch-branchen → push.
- [ ] Fortæl Lars hvad han skal åbne, og **vent på go-ahead**. Merge ikke selv.
- [ ] Efter go-ahead: merge til `main`, `npm run bump-version`, og giv Lars push-kommandoen.
- [ ] Batch 2–4 skal rebase på `main` efter denne merge.
