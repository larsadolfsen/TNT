# Batch 3 — Commerce

**Masterplan:** [2026-08-14-primitive-theme-blocks-master.md](2026-08-14-primitive-theme-blocks-master.md)
**Branch:** egen worktree, fx `claude/horizon-blokke-batch-3`
**Afhænger af:** batch 1. Udvikles parallelt, **rebase på `main` efter batch 1's merge** før
verifikation.
**Locale-prefix:** `blocks_commerce` → `t:blocks_commerce.*`
**Ejer denne delte fil alene:** `snippets/icon-sprite.liquid`

Læs masterplanens **Kilde til Horizon-schemas** før hvert schema. Alle fem filnavne er bekræftet
i Horizon-temaet. `email-signup.liquid` er den største fil i hele opgaven (17,9 kB hos Horizon)
og har batchens bredeste settings-flade — læs den grundigt før du skriver dens schema.

---

## Rækkefølge og hvorfor

Sprite-symbolerne først, fordi `social-links` ikke kan verificeres uden dem. Derefter de fire
kort-/formular-blokke i stigende kompleksitet, så `email-signup` — batchens sværeste — ligger
efter at mønsteret er indarbejdet.

Ét commit per trin.

---

## Trin 3.1 — 13 brand-symboler i spriten

**Filer:** `snippets/icon-sprite.liquid` (ændres)

`social-links` skal kunne vise 13 netværk. Spriten har 45 Lucide-symboler i dag og ingen
brand-mærker.

- [ ] Hent mærkerne fra **Simple Icons** (den etablerede kilde til brand-SVG'er) for:
      facebook, instagram, youtube, tiktok, x/twitter, threads, linkedin, bluesky, snapchat,
      pinterest, tumblr, vimeo — plus ét neutralt til `custom_url` (brug spritens eksisterende
      `link`-ikon frem for at tilføje et 14.).
- [ ] **Samme `viewBox="0 0 24 24"` som resten af spriten.** Afviger den, holder
      `icon.liquid`s `1em`-sizing ikke, og ikonerne kommer i tilfældige størrelser.
- [ ] Brand-mærker er **fyldte**, ikke stregede — de skal bruge `fill="currentColor"` og ikke
      arve Lucides `stroke`-opsætning. Bekræft at `icon.liquid`s `filled: true` giver det
      rigtige resultat, eller giv symbolerne deres egen fill i spriten.
- [ ] Navngiv `id="icon-facebook"` osv., så `{% render 'icon', name: 'facebook' %}` virker.
- [ ] Tjek licensen: Simple Icons er CC0, men mærkerne selv er varemærker. Det er normal brug
      for et link til profilen; ingen ændring af mærkerne.

**Verifikation:**
Der er ingen blok endnu, så verificér gennem et eksisterende kaldested.

1. Theme editor → **Pages → Bloktest** → tilføj en `custom-liquid`-blok (fra batch 1) og
   indsæt `{% render 'icon', name: 'facebook' %}{% render 'icon', name: 'tiktok' %}
   {% render 'icon', name: 'bluesky' %}`.
2. Alle tre mærker skal vises, i **samme størrelse** og med samme optiske vægt som et
   Lucide-ikon ved siden af (tilføj `{% render 'icon', name: 'search' %}` til sammenligning).
   Er ét mærke tydeligt større eller mindre, er dets `viewBox` forkert.
3. Gentag for alle 13 navne. Et navn der ikke findes giver et tomt hul — det er den eneste
   måde at se en stavefejl på.
4. Slå dark mode til: mærkerne skal skifte farve med teksten (de arver `currentColor`).
5. Fjern test-blokken igen.

---

## Trin 3.2 — `social-links`

**Filer:** `blocks/social-links.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/icon.liquid`.

**Settings:** `icon_color` plus 13 URL-felter — `facebook_url`, `instagram_url`, `youtube_url`,
`tiktok_url`, `twitter_url`, `threads_url`, `linkedin_url`, `bluesky_url`, `snapchat_url`,
`pinterest_url`, `tumblr_url`, `vimeo_url`, `custom_url`. Plus padding hvis Horizon har det.

- [ ] **Alle 13 deklareres**, også dem butikken ikke bruger — ellers er Horizon-JSON ikke
      tabsfri.
- [ ] Et netværk uden URL renderes **ikke**. 13 tomme ikoner er ikke en tom liste.
- [ ] Er alle 13 tomme, skal blokken vise noget i editoren (så merchanten kan finde den) men
      intet på storefronten, og wrapperen skal kollapse (failure-log mønster 10).
- [ ] Hvert link har et tilgængeligt label (`{% render 'icon', …, label: 'Facebook' %}`) —
      ikoner uden label er usynlige for skærmlæsere.
- [ ] Eksterne links: `rel="noopener"`.
- [ ] **Ingen tom `"default"` på et `text`-setting** — GitHub-syncen afviser filen uden at sige
      noget (failure-log mønster 14). Udelad `default` helt frem for at sætte den til `""`.

**Verifikation:**
Theme editor → Bloktest → tilføj `social-links`.

1. Uden URL'er: intet ikonrække på storefronten, men blokken skal kunne findes og vælges i
   editoren.
2. Indsæt en URL i **Facebook**: ét ikon dukker op. Tilføj **TikTok** og **Bluesky**: der skal
   nu stå præcis tre ikoner, i schemaets rækkefølge.
3. Sæt **Ikonfarve**: alle tre skifter farve samtidig.
4. Åbn `/pages/blok-test` på storefronten og klik Facebook-ikonet: det skal åbne den URL du
   indtastede, i en ny fane.
5. Tab-navigér til ikonerne: hvert skal kunne få fokus og have et læsbart navn (hover viser
   det, eller brug element-inspektøren til at se `aria-label`).
6. Slå dark mode til: alle ikoner skal stadig være synlige.

---

## Trin 3.3 — `product-card`

**Filer:** `blocks/product-card.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/product-card.liquid` — **al** rendering gennem den. Bemærk at det
snippet **ikke har en `{% doc %}`-header**; læs filen for at finde dens parametre, og tilføj
headeren mens du er der (projektregel: redigerer du en fil uden header, tilføjer du den).

**Settings:** `product`, `product_card_gap`, `width`, `custom_width`, `width_mobile`,
`custom_width_mobile`, `background_color`, `border`, `border_width`, `border_opacity`,
`border_color`, `border_radius`, padding×4.

- [ ] Uden valgt produkt skal blokken vise et placeholder-kort i editoren, ikke et tomt hul.
- [ ] **Priser: rør ikke ved formateringen.** `snippets/product-card.liquid` håndterer den
      allerede, og en gentagelse er præcis hvordan failure-log F-001 blev til (kollektionskort
      viste 100× den rigtige pris). Send produktet ind og lad snippetten om resten.
- [ ] `background_color` og borders bruger tokens, ikke hex.

**Verifikation:**
Theme editor → Bloktest → tilføj `product-card`.

1. Uden produkt: et placeholder-kort skal være synligt.
2. Vælg et rigtigt produkt: kortet skal vise **billede, titel og pris**.
3. **Sammenlign prisen med produktets rigtige pris** i admin. Er den 100× for stor eller for
   lille, er der en formateringsfejl — se failure-log F-001, den fejl har været her før.
4. Vælg et produkt **på udsalg**: både før- og nu-pris skal vises, som på et kort andre steder
   i temaet.
5. Sæt **Bredde** til 50 % og skift til mobilvisning med en anden mobilbredde.
6. Slå kant til, træk tykkelse og radius: rammen skal ligge om kortet.
7. Åbn `/pages/blok-test` og klik kortet: det skal føre til produktsiden.

---

## Trin 3.4 — `collection-card`

**Filer:** `blocks/collection-card.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/collection-card.liquid` (har `{% doc %}`: `collection`,
`placeholder_index`, `loading`, `fetchpriority`).

**Settings:** `collection`, `placement`, `horizontal_alignment`, `vertical_alignment`,
`collection_card_gap`, `background_color`, `border`, `border_width`, `border_opacity`,
`border_color`, `border_radius`.

- [ ] Ingen padding-felter i speccens liste — bekræft mod Horizons fil.
- [ ] Uden valgt kollektion: brug snippettens indbyggede `placeholder_index`-vej.
- [ ] `placement` styrer om teksten ligger over billedet eller under det;
      `horizontal_alignment`/`vertical_alignment` placerer den inden i. Hent værdivokabularet
      fra Horizon — gæt det ikke.

**Verifikation:**
Theme editor → Bloktest → tilføj `collection-card`.

1. Uden kollektion: et nummereret placeholder-kort.
2. Vælg en rigtig kollektion: billede og titel skal vises.
3. Skift **Placering** mellem værdierne: titlen skal flytte sig mellem *over billedet* og
   *under billedet*, synligt.
4. Med teksten over billedet: skift **Vandret** og **Lodret justering** gennem deres værdier —
   titlen skal flytte sig til hvert hjørne. Det er her et forkert oversat værdivokabular
   afsløres: sker der intet ved et af valgene, matcher værdien ikke CSS'en.
5. Sæt **Baggrundsfarve** og slå kant til.
6. Klik kortet på storefronten: det skal føre til kollektionssiden.
7. Tjek titlen i dark mode — den skal være læsbar både over billedet og under det.

---

## Trin 3.5 — `email-signup`

**Filer:** `blocks/email-signup.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/newsletter-form.liquid`. Skriv ingen ny formular.

**Settings — batchens bredeste flade, hent Horizons fil:** `width`, `custom_width`, `heading`,
`heading_text_color`, `heading_preset`, `border_style`, `input_style`, `border_width`,
`border_radius`, `input_background_color`, `input_text_color`, `input_border_color`,
`input_type_preset`, `style_class`, `custom_button_background`, `custom_button_text`,
`custom_button_border`, `link_text_color`, `display_type`, `label`, `integrated_button`,
`button_type_preset`, padding×4.

- [ ] `heading_preset`, `input_type_preset` og `button_type_preset` er `type_preset`-felter.
      **Genbrug `snippets/type-preset-class.liquid` fra batch 1** — skriv ikke mappingen igen.
- [ ] `snippets/newsletter-form.liquid` læser det omgivende `section`-objekt for at scope
      formularens id'er, så flere formularer på én side ikke kolliderer. Bekræft at det stadig
      holder når snippetten kaldes fra en **blok**: to `email-signup`-blokke i samme sektion
      må ikke få samme felt-id. Gør de det, skal scopingen udvides med `block.id`.
- [ ] `integrated_button` lægger knappen inden i inputfeltet i stedet for ved siden af.
- [ ] `display_type` styrer om labelen vises eller kun er en placeholder. **En formular uden
      synligt label skal stadig have et `<label>` for skærmlæsere** — skjul det visuelt, fjern
      det ikke.
- [ ] Knappen renderes gennem `snippets/button.liquid`. Bemærk: dens farve-hooks kommer fra
      **batch 2** — er batch 2 ikke merget endnu, så rebase eller lad hookene være til sidst.
- [ ] **Failure-log mønster 8:** dansk tekst flyder over i enkeltrækkede flex-layouts. Et
      label som "Tilmeld dig vores nyhedsbrev" ved siden af et inputfelt og en knap skal have
      en wrap-strategi. `flex-grow: 1` og `width: 100%` på samme barn er altid en fejl.

**Verifikation:**
Theme editor → Bloktest → tilføj `email-signup`.

1. Formularen skal vises med overskrift, inputfelt og knap.
2. Skift **Overskrift** og dens **preset**: teksten og størrelsen skal ændre sig.
3. Skift **Inputstil** og **Kantstil** gennem deres værdier: feltets udseende skal ændre sig
   synligt hver gang.
4. Sæt **Inputbaggrund**, **Inputtekst** og **Inputkant** til tydeligt forskellige farver: alle
   tre skal slå igennem, og teksten skal stadig være læsbar.
5. Slå **Integreret knap** til: knappen skal flytte ind i feltet. Slå den fra igen.
6. Sæt **Bredde** til 100 % og gør browservinduet smalt (eller brug mobilvisningen):
   overskrift, felt og knap må **ikke** blive klippet eller løbe ud over kanten. Det er
   mønster 8, og den fejl har været her før.
7. **Indsend formularen med en rigtig e-mail på storefronten** (`/pages/blok-test`). Der skal
   komme en synlig kvitteringsbesked, og abonnenten skal dukke op i Shopify admin under
   Kunder med tagget `newsletter`. Uden det trin er formularen kun pyntet.
8. Indsend med en ugyldig e-mail (`abc`): der skal komme en fejlbesked, ikke en tavs
   indsendelse.
9. Læg **to** `email-signup`-blokke på siden og indsend den nederste: det er den nederste der
   skal kvittere, ikke den øverste. Kvitterer den forkerte, kolliderer felt-id'erne.

---

## Trin 3.6 — `menu`

**Filer:** `blocks/menu.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** Shopifys `linklists`-global. Accordion-adfærden findes allerede i
`blocks/accordion.liquid` — læs den før du skriver noget.

**Settings:** `menu`, `heading`, `menu_spacing`, `show_as_accordion`, `accordion_icon`,
`accordion_dividers`, `background_color`, `text_color`, `heading_preset`, `link_preset`,
padding×4.

- [ ] `heading_preset` og `link_preset` gennem `snippets/type-preset-class.liquid`.
- [ ] Accordion: brug native `<details>`/`<summary>` som resten af temaet gør — ingen JS til
      noget CSS kan.
- [ ] `accordion_icon` vælger chevron-varianten; ikonet gennem `{% render 'icon' %}`.
- [ ] `accordion_dividers` tegner streger mellem punkterne med `--color-outline-variant`.
- [ ] Menuen skal rendere **undermenuer**, ikke kun første niveau — et Horizon-`menu` med
      børn skal ikke tabe dem.

**Verifikation:**
Theme editor → Bloktest → tilføj `menu`.

1. Vælg butikkens hovedmenu i **Menu**: alle dens punkter skal vises som links.
2. Har menuen undermenupunkter, skal de også vises. Gør de ikke, mangler der et niveau.
3. Skift **Overskrift**-teksten og dens preset.
4. Træk **Afstand** op: luften mellem punkterne skal vokse.
5. Slå **Vis som accordion** til: punkterne skal folde sammen bag overskriften med en chevron.
   Klik overskriften på storefronten: den skal folde ud og ind. Skift **Accordion-ikon** og se
   chevronen ændre sig.
6. Slå **Skillelinjer** til: der skal komme streger mellem punkterne — også synlige i dark mode.
7. Sæt **Baggrundsfarve** og **Tekstfarve**.
8. Klik et menupunkt på storefronten: det skal navigere til den rigtige side.

---

## Trin 3.7 — Portabilitetstest (batch-niveau)

- [ ] Hent et Horizon-template-JSON fra tema `190460559693` der bruger `product-card`,
      `collection-card`, `email-signup`, `menu` og `social-links` — Horizons footer- eller
      forside-templates er de mest sandsynlige.
- [ ] Indsæt blokkene i `templates/page.blok-test.json` med nøglerne ordret.

**Verifikation:** åbn `https://shopify.textilogvoksdug.dk/pages/blok-test`.

1. Alle fem bloktyper skal rendere.
2. Horizon-JSON'en peger på **deres** produkt-/kollektions-/menu-handles, som ikke findes hos
   os. Blokkene skal derfor vise deres **placeholder**, ikke fejle og ikke efterlade et tomt
   hul. Det er den rigtige opførsel — noter det, så det ikke fejllæses som en fejl.
3. Alle udseende-settings fra JSON'en (farver, kanter, bredder, presets) skal være synlige.
   Alt der ser ud som blokkens standard, betyder et settings-id der ikke matcher.
4. `social-links` skal vise ikoner for de netværk JSON'en har URL'er til — og intet for de
   øvrige.
5. `email-signup` fra Horizon-JSON skal stadig kunne indsendes.

---

## Afslutning af batchen

- [ ] Rebase på `main` efter batch 1's merge.
- [ ] `npx shopify theme check` — ingen nye fejl mod baselinen.
- [ ] `npm run build`; artefakter committet.
- [ ] `CLAUDE.md`-kortet opdateret: fem nye blokke, og ikon-afsnittet skal nævne at spriten nu
      også rummer 13 brand-mærker ved siden af Lucide-sættet.
- [ ] `git rev-parse --abbrev-ref HEAD` → push.
- [ ] Vent på Lars' go-ahead. Merge ikke selv.
