# Session prompt — metervare → app migration

Copy everything below the line into a fresh session.

Recommended model: **Opus** (design judgment, bespoke build — matches the `[O]` tier
`optimization-master-plan.md` assigns to task A3).

---

## Context

You are picking up the **app extraction** work in the TNT Shopify theme repo
(`optimization-master-plan.md`, Wave 1 Track A → Wave 2 B4). Nothing has been
implemented yet. A previous session did an audit only; read it first:

- `docs/superpowers/specs/2026-08-05-metervare-signal-audit.md` — the audit
- `docs/optimization-master-plan.md` — tasks A1–A4 and B4
- `docs/missing-surface-designs.md` — Surface 12 (native unit pricing), incl. its
  open question #1 about retiring the `is_metervare` branch

Do not re-derive the audit's findings; they were verified against the live store on
2026-08-05 via the Admin API. The short version:

- Only **4 of 670** products are metervare. They carry all three signals
  consistently: `productType: "Metervare"`, the category metafield
  `custom.metervare`, and `templateSuffix: "Metervare"`.
- The metafield (`gid://shopify/MetafieldDefinition/369929847117`, boolean,
  constrained to taxonomy category `hg-15-3-6`) is read in exactly **two** places:
  `blocks/product-price.liquid:12-15` (sole gate for the `| times: 100` per-meter
  math and the `pr. meter inkl. moms` suffix, incl. the variant JSON at line 125) and
  `snippets/product-card.liquid:52` (redundant — `product.type == 'Metervare'` is
  already in the same `or` chain). It carries no information `product.type` doesn't.
- **Prices are stored per centimeter** (0,59 / 0,89 / 1,95 …) so the customizer can
  add an arbitrary cut length in cm to the cart as a quantity. The `×100` is a
  display workaround on top of that. None of the 4 products has
  `unitPriceMeasurement` configured.

## The decision already made

The per-meter logic belongs in the **app**, not the theme. So do **not** ship a
standalone theme change that swaps the metafield for `product.type` — fold the
metafield removal into this migration instead. Target end state: **no metervare
trigger in the theme at all**, neither metafield nor product type.

Ownership, from the audit:

| Piece | Today | Target home |
| --- | --- | --- |
| Cut-to-size UI | `blocks/product-customizer.liquid` (~2.400 lines) | App — theme app extension (A3) |
| Cart-line math for an N cm cut | customizer JS + `_metervare_*` line properties + `sections/cart.liquid:38` | App — cart-transform function (A2) |
| "pr. meter" price on product page | `is_metervare` ×100 in `blocks/product-price.liquid` | Shopify native unit pricing |
| "pr. meter" price on cards | ×100 + `or` chain in `snippets/product-card.liquid` | Generic theme code via `snippets/unit-price.liquid` (already built in P4.1) |

## The sequencing constraint — this is the crux

The `×100` cannot be deleted until something else owns the per-cm cart math. With
prices at 0,59 and no `unitPriceMeasurement` set, removing the math today makes cards
read "0,59 kr". So the order is forced:

1. App's cart-transform function owns cart pricing for cut lengths (A2).
2. Only then can prices be restated per meter (59,00) with native
   `unitPriceMeasurement` on the 4 products.
3. Only then can the `is_metervare` ×100 branch, the metafield, and the
   `product.type` trigger all be deleted from the theme.

Any plan that reorders these breaks live prices.

## Two defects to carry into the plan

**a) Live pricing bug on collection cards — needs its own step.** The `or` chain at
`snippets/product-card.liquid:52` also fires on `title contains 'voksdug' /
'bordbeskytter' / 'meter'` and on any `tykkelse:` / `bredde:` / `form:` tag or
matching variant option. Those products already have per-meter prices, so cards
multiply a second time: `Voksdug med danske flag 140 cm` really costs **69,00 kr**,
its product page shows 69,00 kr, its card shows **6.900,00 kr**. ~30+ products match.
Confirmed on `voksdug-med-danske-flag-140-cm`, `voksdug-bla-tern-140-cm`,
`klar-voksdug-0-2-mm-140-cm`, `underlag-antiskrid-hvid-120-cm`.

This will **not** be fixed as a side effect of the app work — the app block owns the
product page, and `product-card.liquid` stays generic theme code through B4. Plan it
explicitly, and it can land early since it doesn't depend on the app.

**b) Dead code in the card.** `thickness`, `width` and `form`
(`snippets/product-card.liquid` lines 20-22, 27-32, 38-47, 56-67) are parsed from tags
and variant options, given hardcoded fallbacks, and then never rendered. Their only
live effect is feeding the `or` chain in (a). Delete them with (a). Keep `badge`
(lines 23, 33-34) — it *is* rendered at line 110.

## Open items to resolve before deleting anything

- **External consumers of `custom.metervare` are unverified.** `appInstallations`
  returns *access denied* with the current MCP scope, so check manually in admin
  (apps, Shopify Flow, product feeds) before deleting the definition or its 4 values.
- `product.type == 'Metervare'` is case-sensitive and becomes the last remaining
  trigger during the transition window. Note the footgun wherever it's documented.
- Confirm with the user whether the app lives in a **new repo** (A1 says yes: move
  `shopify-app/`, strip shop domain / `client_id` / package name) before scaffolding.

## What to produce

Follow the project workflow: brainstorm the design with the user first, then write a
master plan plus one file per batch (not one giant plan file), then execute in small
committed steps. Do **not** start implementing until the user approves the design.

Constraints from the repo that apply here:

- The store is not serving customers yet, so work is verified directly on the store
  via `shopify theme push` / `shopify theme dev` — except **A4, which requires a
  preview theme on the client store plus a real test order before publishing**.
- Version bump on every push (`package.json` is at 1.0.86).
- Single-purpose files; 2–3 line header comment on every file; no `!important`.
- Run `npm run tailwind:build` if anything affecting CSS changes.
- `npx shopify theme check` must not regress against
  `docs/baselines/2026-08-05-theme-check-baseline.txt`.
- There is no automated test runner in the theme. Any layer that can't be
  test-covered must be named as a stated decision, kept thin, and given an explicit
  manual verification step — for the app's cart-transform function, real automated
  tests are expected.
