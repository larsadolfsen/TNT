# Batch 4 — Container (`card` → `group`)

**Masterplan:** [2026-08-14-primitive-theme-blocks-master.md](2026-08-14-primitive-theme-blocks-master.md)
**Branch:** egen worktree, fx `claude/horizon-blokke-batch-4`
**Afhænger af:** batch 1. **Rebase på `main` efter batch 1's merge.**
**Locale-prefix:** `blocks_container` → `t:blocks_container.*`

**Dette er den eneste batch der rører live templates.** Den landes helt alene, efter batch 2 og
3 er merget og verificeret, og før batch 5. Forsiden og produktsiden er i spil hele vejen.

---

## Hvorfor sammenlægningen

Horizon har **ingen** merchant-vendt `card` — bekræftet: `blocks/card.liquid` findes ikke i
Horizon-temaet, kun et privat `blocks/_card.liquid` til produkt-/kollektionskort. Deres `group`
er foreningsmængden af vores to blokke: retning, alignment, gap, bredde/højde, baggrund
(farve/billede/video), overlay, border, radius, link, padding.

Vores `card` og `group` duplikerer allerede `span_mobile/tablet/desktop`, `alignment` og alle
tre padding-felter. `card` er `group` plus en overflade.

## De tre stille fejlkilder

Migreringen kan gå galt uden at noget fejler. Alle tre skal verificeres **visuelt** — theme-check
ser dem ikke, og `git diff` ser rigtig ud.

1. **To forskellige værdivokabularer for retning.** `card.grid_direction: "vertical"` og
   `group.layout_direction: "group--vertical"` beskriver det samme med forskellige strenge.
   De skal **oversættes** til `content_direction`, ikke kopieres.
2. **To forskellige værdivokabularer for justering.** `card.alignment` er
   `left`/`center`/`right`; `group.alignment` er `flex-start`/`center`/`flex-end`. Begge bliver
   til `horizontal_alignment`.
3. **Afvigende padding-defaults.** `card` har default 24 på alle tre padding-felter; `group` har
   0. Skriver man ikke eksplicitte værdier ind ved migreringen, mister hvert kort 24px padding
   hele vejen rundt — og siden ser "næsten rigtig" ud, hvilket er værre end at den brækker.

Dertil to felter uden modstykke, som kræver en beslutning i trin 4.1:

- `card.design` (`border` m.fl.) og `card.background_color` (`light`/… — vores token-navne, ikke
  Horizons farvevælger).
- `card.image_aspect_ratio` har **intet** modstykke i Horizons `group`.
- `group.align_left` findes ikke i Horizon og står ikke i speccens beholdes-liste.

---

## Trin 4.1 — Omlæg `group` til Horizons id'er

**Filer:** `blocks/group.liquid` (ændres), `templates/index.json` (3 `group`-instanser),
`locales/en.default.schema.json`

**Settings — hent Horizons `blocks/group.liquid` (11,4 kB) og kopiér id'erne:**
`content_direction`, `vertical_on_mobile`, `horizontal_alignment`, `vertical_alignment`,
`align_baseline`, `gap`, `width`, `custom_width`, `width_mobile`, `custom_width_mobile`,
`height`, `custom_height`, `background_media`, `background_color`, `video`, `video_position`,
`background_image`, `background_image_position`, `toggle_overlay`, `overlay_color`,
`overlay_style`, `gradient_direction`, `border`, `border_width`, `border_opacity`,
`border_color`, `border_radius`, `link`, `open_in_new_tab`, `placeholder`, padding×4.

**Beholdes ud over Horizon** (additive, bryder ikke portabilitet): `span_mobile`, `span_tablet`,
`span_desktop`, `hide_on_mobile`, `hide_on_desktop`, `sticky`. `span_*` driver temaets
`.grid-layout`-system, som Horizon ikke har noget modstykke til.

- [ ] **Beslut og notér i commit-beskeden** hvad der sker med de fire felter uden modstykke:
      `card.design`, `card.background_color`s token-vokabular, `card.image_aspect_ratio` og
      `group.align_left`. Enten mappes de, eller de dokumenteres som droppet. Ingen af dem må
      bare forsvinde ubemærket.
- [ ] `background_color` er hos Horizon en **farvevælger**, hos os et **select af token-navne**
      (`light`, `shade`, …). Vælger vi Horizons type, taber vi token-baseret dark mode
      (failure-log mønster 3); beholder vi vores, taber vi en Horizon-JSON-værdi. **Anbefaling:
      behold Horizons `type: "color"` med `alpha`, men lad tom værdi betyde "arv fra sektionen"
      i stedet for en hardcodet hvid** — så virker begge veje, og dark mode bevares når feltet
      er tomt. Notér valget i `CLAUDE.md`.
- [ ] **Migrér de 3 eksisterende `group`-instanser i `templates/index.json` i samme commit**
      (failure-log mønster 2 — schema-defaults backfilder ikke gemte settings):

      | Fra | Til | Behandling |
      |---|---|---|
      | `layout_direction: "group--vertical"` | `content_direction: "vertical"` | **oversæt** |
      | `alignment: "flex-start"` | `horizontal_alignment: "left"` | **oversæt** |
      | `alignment: "center"` | `horizontal_alignment: "center"` | oversæt |
      | `alignment: "flex-end"` | `horizontal_alignment: "right"` | oversæt |
      | `padding_top/bottom/sides` | `padding-block-start` / `-end`, `padding-inline-start` + `-end` | omdøb, samme værdi i begge inline-felter |
      | `span_*`, `sticky` | uændret | — |
      | `align_left` | jf. beslutningen ovenfor | — |

- [ ] Bekræft de nøjagtige Horizon-værdier for `content_direction` og `horizontal_alignment`
      fra Horizons fil. Tabellen ovenfor antager `vertical`/`left` — **verificér det**, ellers
      er hele oversættelsen forkert på en måde der ligner "virker næsten".

**Verifikation — på forsiden.**

1. Gem et **fuldsides-screenshot af forsiden før merge**. Uden det er der intet at
   sammenligne med.
2. Efter merge: åbn `https://shopify.textilogvoksdug.dk/`. De tre `group`-områder skal stå
   **identisk** med før — samme retning (over/under vs. side om side), samme justering, samme
   afstande.
3. Er noget gået fra lodret til vandret (eller omvendt), er `content_direction`-værdien ikke
   oversat.
4. Er noget rykket fra venstre til midten, er `horizontal_alignment` ikke oversat.
5. Er alt rykket 0–24px tættere sammen, er padding-nøglerne ikke skrevet ind.
6. Theme editor → forsiden → åbn en `group`: panelet skal vise de nye felter, og
   padding-felterne skal stå med **sidens faktiske værdier**, ikke 0.
7. Skift browservinduet til mobilbredde: layoutet skal opføre sig som før.

---

## Trin 4.2 — Migrér de 11 `card`-instanser i `templates/index.json`

**Filer:** `templates/index.json`

Ingen kodeændring — kun JSON. `blocks/card.liquid` bliver stående indtil trin 4.4, så en
fortrydelse er ét revert væk.

Fuld mapping:

| Fra (`card`) | Til (`group`) | Behandling |
|---|---|---|
| `"type": "card"` | `"type": "group"` | — |
| `grid_direction: "vertical"` | `content_direction` | **oversæt** til Horizons værdi |
| `alignment: "left"/"center"/"right"` | `horizontal_alignment` | **oversæt** |
| `card_link` | `link` | omdøb |
| `block_gap` | `gap` | omdøb (tom værdi = uændret standard) |
| `image` | `background_image` | omdøb |
| `image_placement` | `background_image_position` | omdøb + oversæt værdi |
| `image_aspect_ratio` | — | **intet modstykke**, jf. beslutningen i 4.1 |
| `image_overlay_opacity: 30` | `toggle_overlay: true` + `overlay_color` med alfa | opacity → farve med alfa |
| `background_color: "light"` | `background_color` | jf. beslutningen i 4.1 |
| `design: "border"` | `border` + `border_width` | jf. beslutningen i 4.1 |
| `padding_top/bottom/sides` | padding×4 | **skriv eksplicitte værdier — defaulten var 24, ikke 0** |
| `span_*`, `hide_on_mobile`, `hide_on_desktop` | uændret | identiske |

- [ ] Migrér **alle 11 i én commit** — de sidder i samme fil, og en halv migrering efterlader
      forsiden med to bloktyper der ser ens ud men opfører sig forskelligt.
- [ ] Instanser der **ikke** har en padding-nøgle gemt, kørte på `card`s default 24. De skal
      have `24` skrevet eksplicit ind, ikke udelades.
- [ ] Instanser uden `image_overlay_opacity` skal have `toggle_overlay: false`, ikke et overlay
      med alfa 0.
- [ ] Tæl efter: `grep -c '"type": "card"' templates/index.json` skal give **0**, og
      `grep -c '"type": "group"' templates/index.json` skal gå fra 3 til **14**.

**Verifikation — på forsiden. Det er det vigtigste verifikationstrin i hele planen.**

1. Åbn forsiden ved siden af før-screenshottet fra trin 4.1 og gå den igennem **kort for kort**,
   ikke som et helhedsindtryk. 11 kort — tjek alle 11.
2. For hvert kort: har det stadig sin **indvendige luft** (24px hele vejen rundt hvor det havde
   det)? Klistrer indholdet op ad kanten, er padding-defaulten tabt.
3. Har hvert kort stadig sin **baggrund** og sin **kant**, hvis det havde en?
4. Ligger indholdet stadig **samme vej** (lodret stak vs. vandret række)?
5. Er teksten stadig **venstre-/midterstillet** som før?
6. Kort med baggrundsbillede: ligger billedet stadig rigtigt, og er **overlayet** lige så
   mørkt som før? Et overlay der er forsvundet gør hvid tekst ulæselig — se efter det.
7. Kort med link: klik dem. De skal føre samme sted hen som før.
8. Skift til mobilbredde og gennemgå 2–7 igen. `span_*` skal opføre sig uændret.
9. Theme editor → forsiden: hvert af de 11 skal nu hedde **Group** i bloklisten og kunne åbnes
   uden tomme felter.

---

## Trin 4.3 — Migrér den ene `card`-instans i `templates/product.json`

**Filer:** `templates/product.json`

Samme mapping som 4.2, én instans. Egen commit, fordi produktsiden er en anden risiko end
forsiden — og fordi produktsidens filer historisk er dem GitHub-syncen har haft problemer med
(failure-log F-023, F-025).

- [ ] Én instans, samme tabel som trin 4.2.
- [ ] `grep -c '"type": "card"' templates/product.json` skal give **0** bagefter.
- [ ] **Bekræft efter merge at filen faktisk nåede temaet** — ikke bare at merget landede.
      `templates/product.json` er en af de fem filer Shopifys sync tidligere afviste tavst:

      ```graphql
      { theme(id: "gid://shopify/OnlineStoreTheme/194474541389") {
          files(filenames: ["templates/product.json"], first: 1) {
            nodes { filename size } } } }
      ```

      Er filen der ikke, er den afvist — se failure-log mønster 14 for hvordan man får
      Shopify til at sige hvorfor (upload til et development-tema og læs `userErrors`).
      **Diagnosticér aldrig ved at røre det publicerede tema.**

**Verifikation — på produktsiden.**

1. Screenshot af produktsiden før merge.
2. Efter merge: åbn en produktside. Det migrerede kort skal stå identisk — padding, baggrund,
   kant, retning, justering.
3. **Klik "Læg i kurv".** Varen skal lande i kurven. Produktsiden er hele butikkens
   omsætningsvej, og et brækket JSON-template tager den med sig.
4. Tjek prisen på siden mod produktets pris i admin.
5. Gennemgå produktsidens øvrige blokke — variantvælger, billeder, accordions — de må ikke
   have flyttet sig.

---

## Trin 4.4 — Slet `card`

**Filer:** `blocks/card.liquid` (slettes), `assets/input.css` (evt. `card`-specifik CSS),
`locales/en.default.schema.json`

- [ ] Kør først `grep -rn '"type": "card"' templates/ sections/` — skal give **nul** hits.
      Findes der ét, er trin 4.2 eller 4.3 ikke færdigt, og sletningen ville gøre den template
      ugyldig (failure-log mønster 14: en JSON-template må kun nævne bloktyper der findes).
- [ ] Slet blokkens CSS og eventuelle JS i samme commit (mønster 9: forældreløse regler vinder
      kaskaden på generiske klassenavne som `.card`). Vær varsom — `.card` kan være i brug af
      andre komponenter; grep før du sletter.
- [ ] Fjern dens `t:`-nøgler hvis ingen andre bruger dem.

**Verifikation:**

1. Efter merge: theme editor → **Pages → Bloktest** → Tilføj blok → søg `card`. `card` må ikke
   kunne vælges. `product-card` og `collection-card` fra batch 3 **skal** stadig kunne.
2. Åbn forsiden og produktsiden igen: intet må have ændret sig siden trin 4.3's verifikation.
   Er noget kollapset nu, slettede du CSS der stadig var i brug.
3. Åbn browserkonsollen på begge sider: ingen nye fejl.

---

## Trin 4.5 — Portabilitetstest (batch-niveau)

- [ ] Hent et Horizon-template-JSON fra tema `190460559693` der bruger `group` med
      baggrundsbillede, overlay og indlejrede blokke.
- [ ] Indsæt i `templates/page.blok-test.json`.

**Verifikation:** åbn `https://shopify.textilogvoksdug.dk/pages/blok-test`.

1. `group`-blokken skal rendere med sine **indlejrede** børneblokke — ikke som en tom kasse.
   Det er nestingen der er det egentlige mål her; `group` er den eneste blok i planen der har
   børn.
2. Baggrundsfarve, baggrundsbillede og overlay fra JSON'en skal være synlige.
3. Retning og justering fra JSON'en skal slå igennem — en `group` der ignorerer
   `content_direction` fra Horizon-JSON betyder at værdivokabularet ikke matcher, og så er
   trin 4.1's oversættelse sandsynligvis også forkert den anden vej.
4. Kant, radius og padding fra JSON'en skal være synlige.

---

## Afslutning af batchen

- [ ] Rebase på `main` efter batch 1 (og efter batch 2 og 3 er merget).
- [ ] `npx shopify theme check` — ingen nye fejl mod baselinen.
- [ ] `npm run build`; artefakter committet.
- [ ] `CLAUDE.md`-kortet opdateret: `card` er væk, `group` er containeren, og beslutningerne om
      de fire felter uden modstykke er noteret.
- [ ] `git rev-parse --abbrev-ref HEAD` → push.
- [ ] Fortæl Lars at denne batch rører forsiden og produktsiden, og **vent på go-ahead**.
      Merge ikke selv, og læg ikke batch 5 i kø bag den før den er verificeret.
