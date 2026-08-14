# Batch 2 — Medier & handling

**Masterplan:** [2026-08-14-primitive-theme-blocks-master.md](2026-08-14-primitive-theme-blocks-master.md)
**Branch:** egen worktree, fx `claude/horizon-blokke-batch-2`
**Afhænger af:** batch 1 (`block-padding-vars`, targeting-mønsteret, testsiden). Udvikles
parallelt, men **skal rebase på `main` efter batch 1 er merget** før den kan verificeres.
**Locale-prefix:** `blocks_media` → `t:blocks_media.*`
**Ejer denne delte fil alene:** `snippets/button.liquid`

Læs masterplanens **Kilde til Horizon-schemas** før hvert schema. Alle fire filnavne er
bekræftet at findes i det installerede Horizon-tema: `blocks/button.liquid`, `image.liquid`,
`icon.liquid`, `video.liquid`.

---

## Rækkefølge og hvorfor

`snippets/button.liquid` først og alene, fordi den bruges af produktsidens "Læg i kurv" og
derfor er batchens eneste regressionsrisiko — den skal stå isoleret i sin egen commit så en
fejl har præcis én mulig årsag. Derefter de tre rene wrappere. `video` sidst og delt i to, fordi
den eksterne facade er den eneste del af batchen der ikke kan ses i preview-billedet alene.

Ét commit per trin.

---

## Trin 2.1 — `snippets/button.liquid` udvides

**Filer:** `snippets/button.liquid` (ændres)

Snippetten kan i dag `label`, `variant`, `as`, `size`, `url`, `class`, `attributes`. Den skal
kunne to ting mere, som Horizons `button`-blok eksponerer.

- [ ] Nyt valgfrit `width`-param: en CSS-bredde der sættes på knappen (Horizon sender
      `fit-content` / `100%` / en px-værdi). Sættes som inline `style`, ikke som klasse —
      værdien er fri tekst fra et merchant-setting.
- [ ] Nye valgfrie farve-hooks: `background`, `text_color`, `border_color`. Når de er tomme,
      skal knappen se **nøjagtig ud som i dag** — variant-klasserne styrer den. Når de er sat,
      overskriver de via CSS-variabler scoped til elementet, **ikke** via `!important`
      (projektregel).
- [ ] Alle tre er valgfri, så eksisterende kaldesteder er upåvirkede. Bekræft det:
      `grep -rn "render 'button'" blocks/ sections/ snippets/` — ingen af dem må skulle ændres.
- [ ] Opdatér `{% doc %}`-headeren med de nye params og et `@example`.
- [ ] Tailwind-klasseændringer → `npm run tailwind:build` i samme commit.

**Verifikation — undtagelsesvis på produktsiden, ikke testsiden.** Dette er et regressionstjek.

1. Åbn en produktside på `https://shopify.textilogvoksdug.dk/`. **"Læg i kurv"-knappen skal se
   uændret ud** — samme farve, samme højde, samme pille-form, samme tryk-animation.
2. Klik den. Varen skal lande i kurven og kurv-badget tælle op. En parsefejl i en
   `{% render %}`-parameter dræber hele sektionen inklusive dens `<script>`-tags og giver
   præcis dette symptom (failure-log F-014, mønster 1 og 6). Tjek browserkonsollen for fejl.
3. Gennemgå de øvrige knapper på siden (fx "Se alle produkter") — ingen må have skiftet
   udseende.

---

## Trin 2.2 — `button`

**Filer:** `blocks/button.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/button.liquid` fra trin 2.1. Ingen genskrevet knapmarkup.

**Settings — hent Horizons fil:** `label`, `link`, `open_in_new_tab`, `style_class`,
`custom_button_background`, `custom_button_text`, `custom_button_border`, `link_text_color`,
`width`, `custom_width`, `width_mobile`, `custom_width_mobile`.

- [ ] **Ingen padding-felter** — Horizons `button` har dem ikke. Kald derfor ikke
      `block-padding-vars`.
- [ ] `style_class` er Horizons variant-mekanisme. Mappes til vores `variant`
      (`primary`/`secondary`). Hent Horizons faktiske option-værdier; gæt dem ikke.
- [ ] `custom_width` gælder kun når `width` står på den brugerdefinerede værdi — Horizon
      styrer det med `visible_if`. Kopiér betingelsen.
- [ ] `label` uden værdi skal ikke rendere en tom knap. Renderer blokken intet, skal wrapperen
      også kollapse (failure-log mønster 10).

**Verifikation:**
Theme editor → **Pages → Bloktest** → Section → Tilføj blok → `button`.

1. Blokken skal vise en knap med standard-labelen i preview'et med det samme.
2. Skift **Label** til `Køb nu`: teksten skal ændre sig i preview'et.
3. Sæt **Link** til forsiden. Åbn `/pages/blok-test` på storefronten og klik knappen — den skal
   navigere til forsiden. (Klik virker ikke i editorens preview; det skal testes på
   storefronten.)
4. Slå **Åbn i nyt faneblad** til og klik igen: den skal åbne i en ny fane.
5. Skift **Typografi/stil** mellem de to varianter: knappen skal skifte mellem accentfarvet og
   den lyse kort-variant med kant.
6. Sæt **Bredde** til fuld: knappen skal strække sig over hele blokkens bredde. Skift til
   tilpasset og træk værdien: bredden skal følge med.
7. Sæt en **brugerdefineret baggrundsfarve** og en tekstfarve: knappen skal skifte farve, og
   den skal stadig være læselig i dark mode.
8. Klik mobil-ikonet i editorens værktøjslinje og sæt en anden mobilbredde: bredden skal kun
   ændre sig i mobilvisningen.

---

## Trin 2.3 — `image`

**Filer:** `blocks/image.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/image.liquid` — den dækker allerede fokuspunkt, `fill`, `srcset` og
`sizes`. Skriv ikke ny `<img>`-markup.

**Settings — hent Horizons fil:** `image`, `link`, `image_ratio`, `width`, `custom_width`,
`width_mobile`, `custom_width_mobile`, `height`, `border`, `border_width`, `border_opacity`,
`border_color`, `border_radius`, padding×4.

- [ ] Uden et billede skal blokken vise Shopifys placeholder i editoren, ikke et tomt hul —
      ellers kan merchanten ikke finde blokken hun lige har tilføjet.
- [ ] `width` og `height` skal sættes på `<img>`, ikke kun i CSS. `ImgWidthAndHeight` er en
      eksisterende theme-check-fejl ×11 i baselinen; tilføj ikke en tolvte.
- [ ] Borders bruger `--color-outline-variant`, ikke en hardcodet farve.
- [ ] `image_ratio` styrer beskæringen; brug `snippets/image.liquid`s `fill` mod en
      `aspect-ratio`-boks som beskrevet i dens `{% doc %}`.

**Verifikation:**
Theme editor → Bloktest → tilføj `image`.

1. Uden billede: der skal stå en placeholder-figur, ikke et usynligt tomt område.
2. Vælg et billede fra mediebiblioteket: det skal vises i preview'et.
3. Skift **Billedformat** gennem mindst tre værdier (fx kvadratisk, portræt, landskab):
   billedet skal beskæres forskelligt hver gang, uden at strække sig.
4. Sæt **Bredde** til 50 %: billedet skal fylde halvdelen. Skift til mobilvisning og sæt en
   anden mobilbredde.
5. Slå **Kant** til, træk **Tykkelse** op og sæt **Hjørneradius** til noget stort: der skal
   komme en synlig ramme og runde hjørner. Træk **Gennemsigtighed** ned: kanten skal blegne.
6. Sæt **Link** til forsiden, åbn `/pages/blok-test` på storefronten og klik billedet: det
   skal navigere.
7. Åbn element-inspektøren på `<img>`: den skal have både `width`- og `height`-attributter, og
   `srcset` skal være udfyldt.

---

## Trin 2.4 — `icon`

**Filer:** `blocks/icon.liquid` (ny), `locales/en.default.schema.json`

**Genbruger:** `snippets/icon.liquid` + `snippets/icon-sprite.liquid`. Aldrig inline `<svg>`
(projektregel).

**Settings — hent Horizons fil:** `icon`, `image_upload`, `width`, `link`, `open_in_new_tab`,
`icon_color`.

- [ ] `icon`-selectens options **genereres** fra spriten, ikke skrives i hånden:
      `grep -oE '<symbol id="icon-[^"]+"' snippets/icon-sprite.liquid` (45 symboler pr.
      2026-08-14). Så driver listen ikke fra spriten.
- [ ] Horizon-værdier der ikke findes i vores sprite skal falde tilbage til **intet ikon**,
      ikke til et brækket `<use>`. Skriv fallbacken eksplicit; et `<use>` mod et manglende
      `id` fejler tavst (failure-log mønster 6).
- [ ] `image_upload` overskriver ikonet med et uploadet billede når det er sat.
- [ ] Størrelse styres af `font-size` (spriten er `1em` kvadratisk) — sæt ikke `width`/`height`
      på `<svg>`. Horizons `width`-setting mappes derfor til en `font-size`, ikke til en bredde.

**Verifikation:**
Theme editor → Bloktest → tilføj `icon`.

1. Der skal vises et ikon med det samme (standardvalget), ikke et tomt felt.
2. Åbn **Ikon**-dropdownen: den skal indeholde ~45 navne. Vælg tre forskellige (fx `search`,
   `x`, `star`) og se ikonet skifte hver gang.
3. Træk **Størrelse** fra lille til stor: ikonet skal skalere jævnt og forblive skarpt (det er
   en SVG — bliver det pixeleret, er der et `<img>` involveret et sted det ikke skal være).
4. Sæt **Ikonfarve**: ikonet skal skifte farve. Slå dark mode til og bekræft at det stadig er
   synligt.
5. Sæt **Link** og klik ikonet på storefronten: det skal navigere.
6. Upload et billede i **Billede**-feltet: billedet skal erstatte ikonet. Fjern det igen:
   ikonet skal komme tilbage.
7. Åbn element-inspektøren: markup'en skal være `<svg><use href="#icon-…">`, ikke et indlejret
   `<path>`. Er der `<path>` direkte i blokken, er ikonet inlinet i strid med projektreglen.

---

## Trin 2.5 — `video`, native kilde

**Filer:** `blocks/video.liquid` (ny), `snippets/video-native.liquid` (ny),
`locales/en.default.schema.json`

**Settings — hent Horizons fil:** `source`, `video`, `video_url`, `video_autoplay`,
`video_loop`, `cover_image`, `alt`, `custom_width`, `custom_width_mobile`, `aspect_ratio`,
`border`, `border_width`, `border_opacity`, `border_color`, `border_radius`, padding×4.

Dette trin implementerer **kun** `source: native`. Den eksterne vej kommer i trin 2.6.

- [ ] `snippets/video-native.liquid`: Shopifys `video_tag` med `poster` fra `cover_image`.
      Coverbilledet renderes gennem `snippets/image.liquid`.
- [ ] `video_autoplay` skal indebære `muted` og `playsinline` — en autoplay-video med lyd
      blokeres af browseren og giver en video der bare ikke starter.
- [ ] Uden autoplay skal der være synlige afspilningskontroller.
- [ ] `aspect_ratio` styrer boksen; videoen fylder den med `object-fit`.
- [ ] Vælg `source`-værdierne så de matcher Horizons ordret — det er dem der står i
      template-JSON'en.

**Verifikation:**
Theme editor → Bloktest → tilføj `video`, lad kilden stå på den native værdi.

1. Upload eller vælg en video i mediebiblioteket: den skal vises i preview'et med
   afspilningskontroller.
2. Åbn `/pages/blok-test` på storefronten og klik afspil: videoen skal spille med lyd.
3. Slå **Autoplay** til, genindlæs storefronten: videoen skal starte af sig selv og være
   **lydløs**. Gør den ikke det, mangler `muted`/`playsinline`.
4. Slå **Loop** til: videoen skal starte forfra når den slutter.
5. Vælg et **Coverbillede** og genindlæs uden autoplay: billedet skal stå som plakat før
   afspilning — ikke en sort firkant.
6. Skift **Højde-bredde-forhold** og bekræft at boksen ændrer form uden at videoen strækkes.
7. Slå kant og hjørneradius til og bekræft at de rammer videoens kant, ikke en usynlig
   yderboks (failure-log mønster 10).

---

## Trin 2.6 — `video`, ekstern facade

**Filer:** `snippets/video-external.liquid` (ny), `blocks/video.liquid` (ændres),
`assets/` (lille JS-fil til klik-håndtering)

Facaden er **ikke valgfri**: en autoloaded YouTube-iframe koster Core Web Vitals og sætter
cookies før samtykke.

- [ ] Renderer coverbillede + en afspil-knap. Ingen `<iframe>` i det oprindelige HTML.
- [ ] Iframen indsættes **først ved klik**, med `autoplay=1` så det ene klik er nok.
- [ ] Uden `cover_image` skal der stadig være noget at klikke på — brug videotjenestens eget
      thumbnail eller en neutral flade, aldrig et tomt område.
- [ ] Afspil-knappen skal være et rigtigt `<button>` med tilgængeligt label og et ikon via
      `{% render 'icon' %}` — ikke en klikbar `<div>`, ikke en inline `<svg>`.
- [ ] **Failure-log mønster 7:** en blok kan optræde flere gange på en side. Ét `<script src>`
      per blokinstans betyder N kørsler. Indlæs scriptet én gang og bind med et
      `dataset`-flag per element.
- [ ] JS-ændring → `npm run build` i samme commit (mønster 11).

**Verifikation:**
Theme editor → Bloktest → sæt `video`-blokkens kilde til ekstern og indsæt en YouTube-URL.

1. Preview'et skal vise coverbillede med en afspil-knap ovenpå — **ikke** en YouTube-afspiller.
2. Åbn `/pages/blok-test` på storefronten, åbn **Netværk**-fanen i browserens devtools og
   genindlæs. Filtrér på `youtube`: der skal være **nul requests**. Det er hele pointen med
   facaden, og det kan ikke ses på skærmen — kun i netværkspanelet.
3. Klik afspil-knappen: nu skal YouTube-requests dukke op i netværkspanelet, og videoen skal
   starte af sig selv uden et ekstra klik.
4. Læg **to** video-blokke med ekstern kilde på siden. Klik afspil på den ene: kun den ene må
   starte. Klik derefter den anden: den skal også virke. Starter begge, eller virker kun den
   første, er scriptet ikke idempotent (mønster 7).
5. Tab-navigér til afspil-knappen og tryk Enter: den skal aktivere. Kan den ikke få fokus, er
   den ikke et rigtigt `<button>`.

---

## Trin 2.7 — Portabilitetstest (batch-niveau)

- [ ] Hent et Horizon-template-JSON fra tema `190460559693` der bruger `image`, `button`,
      `icon` og `video`.
- [ ] Indsæt blokkene i `templates/page.blok-test.json` med `"type"`- og settings-nøgler
      **ordret**.

**Verifikation:** åbn `https://shopify.textilogvoksdug.dk/pages/blok-test`.

1. Alle fire bloktyper skal rendere. En manglende blok = filnavn der ikke matcher.
2. Billedet skal vise **sit** billede, knappen **sin** label og sit link, ikonet **sit** ikon.
   Tomme værdier = settings-id der ikke matcher.
3. Bredde- og kant-indstillinger fra JSON'en skal være synlige, ikke nulstillede.
4. Bærer JSON'en et Horizon-ikonnavn vi ikke har i spriten, skal pladsen være **tom** — ikke
   et brækket ikon eller en konsolfejl.
5. Netværkspanelet: stadig nul YouTube-requests før klik, også for en video der kom fra
   Horizon-JSON.

---

## Afslutning af batchen

- [ ] Rebase på `main` efter batch 1's merge, hvis det ikke allerede er sket.
- [ ] `npx shopify theme check` — ingen nye fejl mod baselinen.
- [ ] `npm run build`; artefakter committet.
- [ ] `CLAUDE.md`-kortet opdateret med de nye blokke og de to video-snippets.
- [ ] `git rev-parse --abbrev-ref HEAD` → push.
- [ ] Vent på Lars' go-ahead. Merge ikke selv.
