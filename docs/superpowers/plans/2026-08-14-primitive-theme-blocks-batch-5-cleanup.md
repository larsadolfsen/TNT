# Batch 5 — Oprydning (`page-title` → `_heading`)

**Masterplan:** [2026-08-14-primitive-theme-blocks-master.md](2026-08-14-primitive-theme-blocks-master.md)
**Branch:** egen worktree, fx `claude/horizon-blokke-batch-5`
**Afhænger af:** **batch 1** (hårdt — `_heading` skal findes og virke). Landes sidst, efter
batch 4 er merget og verificeret.
**Locale-prefix:** genbruger batch 1's `blocks_layout` — ingen nye nøgler.

Denne batch rører `templates/collection.json` og `templates/product.json`, altså kollektions-
og produktsiden. Ét commit per template, så en regression har præcis én mulig årsag.

---

## Hvad der migreres

Tre instanser, alle med en **dynamisk kilde gemt i `title_override`** — ikke en tom værdi, som
speccens mappingtabel antager:

| Fil | Linje | `title_override` | `show_description` | padding (top/bottom/sides) |
|---|---|---|---|---|
| `templates/collection.json` | ~16 | `{{ closest.collection.title }}` | `true` | 12 / 12 / 0 |
| `templates/product.json` | ~16 | `{{ closest.product.title }}` | `true` | 12 / 0 / 0 |
| `templates/product.json` | ~115 | `{{ closest.product.title }}` | `true` | 12 / 0 / 0 |

Mapping til `_heading`:

| `page-title` | `_heading` |
|---|---|
| `"type": "page-title"` | `"type": "_heading"` |
| `title_override: "{{ closest.collection.title }}"` | `source: "collection_title"`, intet `text` |
| `title_override: "{{ closest.product.title }}"` | `source: "product_title"`, intet `text` |
| `show_description: true` | `show_description: true` (uændret) |
| (implicit `<h1>`, hardcodet `text-2xl md:text-2xl`) | `type_preset: "h1"` |
| `padding_top` | `padding-block-start` |
| `padding_bottom` | `padding-block-end` |
| `padding_sides` | `padding-inline-start` **og** `padding-inline-end` (samme værdi) |

Sidebemærkning fra speccen: `page-title` hardcoder `text-2xl md:text-2xl` — samme værdi på begge
breakpoints, altså en responsiv opsætning der ikke gør noget. Fejlen forsvinder med
`type_preset`. **Forvent derfor at titlen kan skifte størrelse** ved migreringen; det er en
rettelse, ikke en regression. Bekræft med Lars at den nye størrelse er den ønskede, i stedet for
at antage at "uændret" er kriteriet her.

---

## Trin 5.1 — `templates/collection.json`

**Filer:** `templates/collection.json`

- [ ] Én instans, mappingtabellen ovenfor. `blocks/page-title.liquid` bliver stående til trin
      5.3, så en fortrydelse er ét revert væk.
- [ ] `grep -c '"type": "page-title"' templates/collection.json` skal give **0** bagefter.
- [ ] Vær opmærksom på om instansen ligger inde i en `card`/`group` — batch 4 har lige omlagt
      containerne, så rebase først og læs den aktuelle struktur, ikke den her beskrevne.

**Verifikation — på kollektionssiden.**

1. Screenshot af en kollektionsside før merge.
2. Efter merge: åbn samme kollektionsside. **Kollektionens navn skal stå som overskrift** — ikke
   tomt, ikke bogstaverne `{{ closest.collection.title }}`. En rå Liquid-streng på skærmen
   betyder at `source` ikke er slået igennem og at værdien er endt i et tekstfelt.
3. **Kollektionens beskrivelse skal stå under titlen** — `show_description` var slået til.
4. Åbn element-inspektøren på titlen: taggen skal være `<h1>`. Er den blevet til `<div>` eller
   `<h2>`, er det en SEO- og tilgængelighedsregression, ikke kosmetik.
5. Afstanden over og under titlen skal svare til de gamle 12/12. Er den forsvundet, er
   padding-nøglerne ikke omdøbt.
6. Prøv **en anden kollektion**: titlen skal følge med. Gør den ikke det, er kilden bundet til
   den forkerte kollektion.
7. Theme editor → Collection: blokken skal hedde noget andet end "Page Title" i bloklisten og
   kunne åbnes med `source` sat til kollektionstitel.

---

## Trin 5.2 — `templates/product.json`

**Filer:** `templates/product.json`

- [ ] **To** instanser (~linje 16 og ~115). Migrér begge i samme commit; de er sandsynligvis
      to layoutvarianter af samme titel, og halvvejs giver to forskellige overskrifter på
      samme side.
- [ ] `grep -c '"type": "page-title"' templates/product.json` skal give **0** bagefter.
- [ ] **Bekræft efter merge at filen faktisk nåede temaet** — `templates/product.json` er en af
      de fem filer Shopifys sync tidligere afviste tavst (failure-log F-023, F-025, mønster 14):

      ```graphql
      { theme(id: "gid://shopify/OnlineStoreTheme/194474541389") {
          files(filenames: ["templates/product.json"], first: 1) {
            nodes { filename size } } } }
      ```

      Mangler den, er den afvist. Diagnosticér ved at uploade til et **development**-tema og
      læse `userErrors` — aldrig ved at røre det publicerede tema.

**Verifikation — på produktsiden.**

1. Screenshot af en produktside før merge.
2. Efter merge: **produktets navn skal stå som overskrift**, ikke tomt og ikke som rå
   Liquid-streng.
3. Der må kun være **én** synlig titel. Er der pludselig to, renderer begge instanser nu
   samtidig — så var den ene skjult af noget der gik tabt i migreringen.
4. Produktbeskrivelsen skal stå hvor den stod før.
5. Element-inspektøren: `<h1>`.
6. **Klik "Læg i kurv".** Varen skal lande i kurven. Produktsiden er omsætningsvejen, og et
   ugyldigt JSON-template tager den med sig.
7. Prøv **et andet produkt**, og gerne et med en lang dansk titel: den må ikke klippes eller
   løbe ud over kanten (failure-log mønster 8).
8. Tjek både mobil- og desktopbredde — de to instanser er formentlig netop mobil og desktop.

---

## Trin 5.3 — Slet `page-title`

**Filer:** `blocks/page-title.liquid` (slettes), `assets/input.css` (evt.),
`locales/en.default.schema.json`

- [ ] `grep -rn '"type": "page-title"' templates/ sections/` skal give **nul** hits først.
      Findes der ét, ville sletningen gøre den template ugyldig (mønster 14: en JSON-template
      må kun nævne bloktyper der findes i `blocks/`).
- [ ] Slet blokkens CSS/JS i samme commit (mønster 9).
- [ ] Fjern dens `t:`-nøgler hvis ingen andre bruger dem.

**Verifikation:**

1. Efter merge: theme editor → Tilføj blok → søg `title`. `page-title` må ikke kunne vælges;
   `_heading` skal kunne.
2. Åbn kollektionssiden og produktsiden igen: intet må have ændret sig siden trin 5.2.
   Er en titel forsvundet nu, slettede du CSS der stadig var i brug.
3. Browserkonsollen på begge sider: ingen nye fejl.

---

## Trin 5.4 — Fjern testsiden

**Filer:** `templates/page.blok-test.json` (slettes)

Testsiden fra batch 1 trin 1.0 har gjort sit. Den skal væk, så den ikke bliver liggende som en
halvfærdig side på en butik der skal indsendes til Theme Store.

- [ ] Slet `templates/page.blok-test.json`.
- [ ] **Manuel handling for Lars:** Shopify admin →
      `https://admin.shopify.com/store/mpxdae-40/pages` → slet siden **Bloktest**.
      **Rækkefølgen betyder noget:** slet siden i admin *før* eller *samtidig med* at
      templaten fjernes. En side der peger på en slettet template giver en brækket side.
- [ ] Bekræft at intet andet peger på templaten: `grep -rn "blok-test" .` skal kun finde
      planfilerne.

**Verifikation:**

1. `https://shopify.textilogvoksdug.dk/pages/blok-test` skal give **404**, ikke en tom eller
   brækket side.
2. Shopify admin → Pages: `Bloktest` skal være væk.
3. Forsiden, kollektionssiden og produktsiden skal stadig virke.

---

## Afslutning af batchen — og af hele opgaven

- [ ] `npx shopify theme check` — ingen nye fejl mod
      `docs/baselines/2026-08-05-theme-check-baseline.txt`.
- [ ] `npm run build`; artefakter committet.
- [ ] `CLAUDE.md`-kortet opdateret: `page-title` er væk, `_heading` dækker sidetitler.
- [ ] Blokoptælling: der skal være **49** filer i `blocks/` (39 før opgaven, +13 nye, −3
      slettede). Passer tallet ikke, mangler eller overtæller en batch.
- [ ] Sidste tjek af portabilitetsmålet: alle 13 Horizon-filnavne skal findes i `blocks/` —
      `_heading`, `_divider`, `spacer`, `custom-liquid`, `button`, `image`, `icon`, `video`,
      `product-card`, `collection-card`, `email-signup`, `menu`, `social-links` — plus `text`
      og `group` med Horizons settings-id'er.
- [ ] `git rev-parse --abbrev-ref HEAD` → push.
- [ ] Vent på Lars' go-ahead. Merge ikke selv.
- [ ] Efter merge: `npm run bump-version`, og giv Lars push-kommandoen.
