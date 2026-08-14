# Tech stack-retrospektiv: hvis temaet skulle bygges igen

Svar på spørgsmålet "hvis du skulle bygge dette tema igen, hvilket tech stack
ville du så bruge?" — skrevet 2026-08-14 efter gennemgang af repoet (128
`.liquid`-filer, ~30 JS-moduler + 27 committede `.min.js`, 79 KB tracked
`output.css`) og hele `docs/failure-log.md` (39 poster, 18
gentagelsesmønstre). Beviserne herunder linker direkte til loggen.

**Dette er et retrospektiv, ikke en plan.** Ingen af skiftene herunder er
besluttet, og de fleste anbefales udtrykkeligt *ikke* gennemført med
tilbagevirkende kraft — se [Migrér eller ej](#migrér-eller-ej) til sidst.

---

## Den bindende præmis

Målet er Shopify Theme Store. Det låser bunden af stakken: **Liquid + Online
Store 2.0 theme blocks + theme editor**. React/Vue/Svelte er kun relevant ved
et skifte til headless (Hydrogen/Oxygen), og det koster theme editoren, Theme
Store-kanalen og merchant-redigerbarheden — et forretningsvalg, ikke et
teknisk. Fundamentet ville derfor være det samme igen.

Frihedsgraderne ligger i fire lag: **CSS, JS, build og deploy/verifikation.**
Tre af dem ville jeg vælge anderledes.

## Det der ville blive genvalgt uændret

- **Theme blocks som primær komposition** (`blocks/` frem for monolitiske
  `sections/`). Rigtig arkitektur, og den Shopify selv er gået med i Horizon.
- **CSS custom properties som design tokens**, sat fra theme settings
  (`snippets/css-variables.liquid`). Eneste måde dark mode og
  merchant-konfigurerede farver kan sameksistere.
- **Én JS-fil pr. concern, ingen bundler, `defer`.** Korrekt for et tema —
  HTTP/2 + Shopifys CDN gør bundling til en dårlig handel, og det holder
  blokke uafhængige af hinanden.
- **Lucide-sprite gennem ét `{% render 'icon' %}`-indgangspunkt.**
- **Horizon-spejlede blok-interfaces.** Primitive-blokkenes 1:1-spejling af
  Horizons filnavne og settings-id'er fortsætter — det er den bevidste
  strategi, ikke en overgangsordning. Kompatibilitetsfladen gør
  Horizon-blokinstanser drop-in-kompatible og lader temaet følge med, når
  Shopify udvikler konventionen. Se skellet mod kode-afledning under
  [basen](#basen-skeleton-er-ikke-bare-et-valg-det-er-reglen).
- **`docs/failure-log.md`.** Den mest værdifulde enkeltfil i repoet; det er
  den, dette dokument står på. Ville blive startet på dag 1 næste gang.

## De fem skift

### 1. Tailwind ud — ren CSS med tokens, `@layer` og nesting ind

Tailwind v4 koster her tre konkrete ting:

- **Et 79 KB tracked build-artefakt.** `assets/output.css` skal genbygges i
  samme commit som enhver klasseændring — det er
  [mønster 11](failure-log.md#recurring-patterns) i failure-loggen og halve
  grunden til CI-jobbet "build freshness".
- **Palette-utilities er angrebsfladen for temaets hyppigste bug-klasse.**
  [F-007](failure-log.md#f-007--hardcoded-hex-literals-bypassed-the-token-system),
  [F-009](failure-log.md#f-009--hardcoded-light-mode-colors-ignored-dark-mode) og
  [F-027](failure-log.md#f-027--header-2-reintroduced-a-hardcoded-bg-white-that-f-009-had-already-fixed)
  er alle "hardcoded farve omgår dark mode" ([mønster 3](failure-log.md#recurring-patterns)).
  `bg-white` findes kun som fristelse fordi Tailwind stiller den til
  rådighed; i ren token-CSS er der intet at skrive i stedet for
  `var(--color-surface)`.
- **[F-005](failure-log.md#f-005--tailwind-breakpoint-set-to-false-emitted-an-invalid-media-query)**
  (`min-width: false`) var en ren Tailwind-konfigurationsbug.

Dertil kører temaet allerede *to* CSS-systemer, der skal enes: Tailwinds
utilities og den Liquid-genererede CSS (`css-variables.liquid`, `{% style %}`
i hver blok). Ét system er enklere. Moderne CSS (nesting, `@layer`,
`:has()`, container queries — alle baseline i dag) dækker langt det meste af
det, Tailwind bidrager med, og både Theme Store-reviewere og merchants læser
temaets CSS direkte.

Det ærlige modargument: Tailwind gør ny markup markant hurtigere at skrive,
og typografi-migrationen er allerede designet oven på Tailwind-underlaget.
Med 128 Liquid-filer og ~212 `text-*`-forekomster er
migrationsomkostningen i dag langt større end gevinsten — se
[Migrér eller ej](#migrér-eller-ej).

### 2. Custom Elements i stedet for ad hoc-idempotens

I dag har `assets/` nul `customElements`-registreringer; idempotens
håndhæves manuelt med `window`-guards (`video-external.js`) og
`dataset`-flag (kun `breadcrumbs.js`), fordi ét `<script>`-tag pr.
blok-instans betyder N udførelser
([F-006](failure-log.md#f-006--one-script-tag-per-block-instance-causes-duplicate-listeners),
[mønster 7](failure-log.md#recurring-patterns)).

Med web components forsvinder den fejlklasse strukturelt:
`connectedCallback` kører præcis én gang pr. instans, per definition — ingen
guard at glemme. Det løser også halvdelen af
[mønster 9](failure-log.md#recurring-patterns) (forældede selectors/JS der
overlever deres markup): når komponentens JS ejer sit eget subtree, dør den
sammen med markup'en i stedet for at blive ved med at ramme noget, der
tilfældigvis matcher
([F-011](failure-log.md#f-011--textcontent-on-an-inline-svg-wiped-the-theme-toggle-icon),
[F-013](failure-log.md#f-013--dead-placeholder-css-stretched-every-icon-to-300px),
[F-021](failure-log.md#f-021--textcontent-on-an-inline-svg-wiped-the-collection-filter-toggle-icon)).

Ingen framework oveni — ingen Alpine, ingen HTMX. Bare
`class X extends HTMLElement`, som Dawn og Horizon gør det.

### 3. `// @ts-check` + JSDoc + `tsc --noEmit` i CI

Rigtig typekontrol på alle JS-moduler uden nye kompilerede artefakter og
uden `.ts`-filer. Havde fanget
[F-010](failure-log.md#f-010--toggletheme-was-never-defined) (`toggleTheme`
aldrig defineret) og
[F-011](failure-log.md#f-011--textcontent-on-an-inline-svg-wiped-the-theme-toggle-icon)/[F-021](failure-log.md#f-021--textcontent-on-an-inline-svg-wiped-the-collection-filter-toggle-icon)
(`.textContent` sat på `SVGElement`) på commit-tidspunktet i stedet for på
den live butik. Stylelint på CSS'en hører til i samme kurv.

### 4. Drop de 27 committede `.min.js`

Shopifys CDN serverer brotli-komprimeret; minify-gevinsten *oven på* brotli
er få procent på filer i denne størrelse. Prisen er et build-step, et
CI-job, en hel bug
([F-018](failure-log.md#f-018--js-source-edit-made-on-a-branch-predating-the-minified-build),
[mønster 11](failure-log.md#recurring-patterns)) og debugging på minificeret
kode i produktion. Send læsbar kilde — eller lad deploy-pipelinen (skift 5)
minificere, så outputtet aldrig committes.

### 5. Det vigtigste: eksplicit deploy-pipeline i stedet for den native GitHub-sync

Den native GitHub→Shopify-sync er kilden til de to grimmeste bugs i loggen:
[F-023](failure-log.md#f-023--the-github-sync-has-been-silently-dropping-the-product-page-files)
(en fil holdt stille op med at synce og stod frossen i ugevis) og
[F-025](failure-log.md#f-025--three-schema-and-liquid-errors-made-the-github-sync-drop-five-files-without-a-word)
(fem filer stille afvist uden ét ord fra git, CI eller theme editor) —
[mønstrene 12 og 14](failure-log.md#recurring-patterns). Det er ikke en bug,
man koder sig ud af; det er kanalen.

I stedet, som GitHub Action på `main`:

```
shopify theme push --unpublished
  → Playwright-smoke-suite mod preview-URL'en
  → Lighthouse CI mod Theme Store-budgetterne
  → shopify theme publish
```

`theme push` **rapporterer** de valideringsfejl, syncen sluger. Og pipelinen
giver stedet at hænge den reelle mangel op:

**Playwright er den enkeltinvestering med højest afkast.**
[Mønster 4](failure-log.md#recurring-patterns) siger det direkte:
"`theme-check` passing is not verification."
[F-001](failure-log.md#f-001--collection-cards-showed-100x-the-real-price)
(100× pris),
[F-002](failure-log.md#f-002--predictive-search-never-activated-on-the-live-store)
(død predictive search),
[F-003](failure-log.md#f-003--mobile-header-icons-clipped-off-the-row)
(afklippede mobilikoner) og
[F-014](failure-log.md#f-014--liquid-comparison-in-a-render-argument-killed-the-cart)
(dødt add-to-cart) bestod alle theme-check rent og nåede alle den live
butik. Alle fire er trivielle assertions:

- pris på et kollektionskort matcher `/\d{1,3}(\.\d{3})*,\d{2} kr/`
- 375 px viewport: cart- og account-ikon er inde i viewporten
- skriv i søgefeltet → dropdown bliver synlig
- add-to-cart → cart count går 0 → 1

Plus `@axe-core/playwright`, som Theme Store-tilgængelighedskravene alligevel
peger på. En maskinel smoke-suite erstatter ikke Lars' visuelle verifikation
(reglen "land én ad gangen, verificér hver") — den flytter bare bundniveauet,
så det aldrig igen er en *død indkøbskurv*, der venter på et menneskeblik.

## Stakken, samlet

| Lag | I dag | Ville vælge |
|---|---|---|
| Template | Liquid, OS 2.0 theme blocks | **uændret** |
| CSS | Tailwind v4 → tracked `output.css` | Ren CSS: tokens, `@layer`, nesting |
| JS | Vanilla, ad hoc-guards | Vanilla **Custom Elements** |
| Typer | ingen | `@ts-check` + JSDoc, `tsc --noEmit` i CI |
| Build | esbuild → 27 tracked `.min.js` | intet — send kilder |
| Lint | theme-check | theme-check + `tsc` + Stylelint |
| Test | ingen | **Playwright** + axe + Lighthouse CI |
| Deploy | native GitHub-sync direkte til live tema | `theme push --unpublished` → test → `publish` |
| Base | Skeleton theme | **uændret** — Skeleton er den eneste godkendte kodebase (se nedenfor) |

### Basen: Skeleton er ikke bare et valg, det er reglen

Theme Store-kravene (§2, "Uniqueness from other themes") afgør det spørgsmål
for os, ordret:

> "Shopify's Skeleton Theme is the only approved codebase for Theme Store
> development. Otherwise, themes must be built with fully original code.
> New theme submissions built on or derived from Dawn or Horizon are not
> eligible for the Shopify Theme Store."

Et tema bygget *på* Horizon (eller Dawn) kan altså ikke sælges i Theme Store.
Repoet gjorde det rigtige fra start — det er bygget på Skeleton
(`shopify-skeleton-tailwind`).

Skellet, der er værd at holde skarpt:

- **Tilladt — interface-spejling, og det fortsætter.** Primitive-blokkene
  spejler Horizons *filnavne og settings-id'er* 1:1 (masterplanen i
  `superpowers/plans/2026-08-14-primitive-theme-blocks-master.md`), så en
  Horizon-blokinstans i en `templates/*.json` kan limes ind og rendere.
  Det er konfigurations-kompatibilitet, ikke afledt kode — implementeringen
  bag id'erne er dette temas egen. Spejlingen er den blivende strategi for
  nye blokke, ikke noget dette dokument ruller tilbage.
- **Forbudt — kode-afledning.** Kopiering af Liquid/CSS/JS fra Horizon ind i
  temaet gør det "derived from Horizon" og dermed uegnet til indsendelse.
- **Risiko — design-spejling.** Horizon ligger selv i Theme Store, og
  uniqueness-kravet forlanger, at et tema er "fundamentally different from
  other themes on the Shopify Theme Store". Så også det *visuelle* udtryk
  skal holde tydelig afstand til Horizon; id-kompatibilitet er usynlig for
  revieweren, lookalike-design er ikke.

## Det der stadig ville blive fravalgt

- **Hydrogen/React** — kun relevant hvis Theme Store og theme editor opgives
  bevidst.
- **Vite/Rollup med Liquid-plugin** — kæmper mod Shopifys asset-pipeline
  uden gevinst.
- **Alpine.js/HTMX** — ekstra kilobytes på hver side for noget, Custom
  Elements giver gratis.
- **Monorepo/workspaces** — ét tema, én pakke.

## Migrér eller ej

Retrospektiv ≠ migrationsplan. Vurdering pr. skift, hvis noget skulle
gennemføres på det *eksisterende* tema:

| Skift | Migrér nu? | Hvorfor |
|---|---|---|
| 5. Deploy-pipeline + Playwright | **Ja** | Ingen ændring af temaets kode; fjerner de to farligste fejlklasser (stille filafvisning, uverificeret live-deploy). Kan indføres trinvist: smoke-suiten kan køre mod et development theme længe før syncen erstattes. |
| 3. `@ts-check` i CI | **Ja** | Rent additivt, fil for fil. |
| 4. Drop `.min.js` | Overvej | Lille, mekanisk oprydning (referencer i Liquid skal peges om), men vent til skift 5 findes, så beslutningen "hvem minificerer" tages ét sted. |
| 2. Custom Elements | Kun for *nye* komponenter | Eksisterende JS virker; omskrivning er risiko uden symptom. Ny konvention fremadrettet. |
| 1. Tailwind ud | **Nej** | 128 filer og ~212 `text-*`-forekomster; omkostningen overstiger gevinsten, og typografi-migrationen er designet oven på det nuværende underlag. Gælder kun et hypotetisk greenfield. |

Kort version: **fundamentet var rigtigt, værktøjslaget lidt for tungt, og
verifikationslaget manglede helt.** Den ene ting, der ville have ændret mest
med tilbagevirkende kraft, er ikke Tailwind — det er Playwright plus en
deploy, der kan sige fra.
