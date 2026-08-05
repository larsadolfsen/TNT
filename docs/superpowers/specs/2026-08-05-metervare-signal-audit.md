# Metervare signal audit

**Date:** 2026-08-05
**Status:** Audit only — no code changed. Findings feed the app-extraction work
(`optimization-master-plan.md` Track A + B4).
**Question that triggered it:** can the category metafield `custom.metervare` be
removed and `product.type` take over what it does?

**Answer:** yes, technically — but the per-meter logic itself belongs in the app,
not the theme, so the metafield removal should be absorbed into the app migration
rather than shipped as a standalone theme change. Details below.

---

## 1. The three signals are already perfectly aligned

Verified against the live store on 2026-08-05 via the Admin API:

| Signal | Count | Where it lives |
| --- | --- | --- |
| `productType: "Metervare"` | 4 of 670 products | Shopify admin → Produkttype |
| `custom.metervare` (boolean) | 4 values | Category metafield, definition `gid://shopify/MetafieldDefinition/369929847117`, constrained to taxonomy category `hg-15-3-6` |
| `templateSuffix: "Metervare"` | 4 | `templates/product.Metervare.json` |

The same 4 products carry all three. **The metafield holds no information
`product.type` does not already hold.**

| Handle | Prices (per cm) |
| --- | --- |
| `klar-gennemsigtig-voksdug-140-cm-bred-2mm-tyk-phthalatfri-oko-tex-standard-100` | 0,59 |
| `klar-gennemsigtig-voksdug-0-2-mm` | 0,59 / 0,89 / 0,99 |
| `kraftig-gennemsigtig-voksdug-1-3-mm` | 1,95 / 2,25 / 2,75 |
| `voksdug-gra-jeanslook-med-hvid-bladranke-160-cm` | 0,89 |

None of the four has `unitPriceMeasurement` set — Shopify's native unit pricing is
unconfigured on them. This matters (see §4).

## 2. Where the metafield is read — two places only

1. **`blocks/product-price.liquid:12-15`** — the *only* gate for the `| times: 100`
   math and the `pr. meter inkl. moms` suffix, applied both to the rendered price and
   to the per-variant JSON payload at line 125.
2. **`snippets/product-card.liquid:52`** — one clause in an eight-way `or` chain that
   already contains `product.type == 'Metervare'`. Fully redundant.

Nothing else reads it. `blocks/product-customizer.liquid` resolves its raw metervare
variant by SKU `BTM001` and by handle (`firkantet-dug` / `metervare`), not by the
metafield. `sections/cart.liquid` and `sections/header-2.liquid` read the
`_metervare_title` line-item property, unrelated to the metafield.

**Not verified:** whether an app, a Shopify Flow, or a product feed reads
`custom.metervare`. `appInstallations` returns *access denied* with the current MCP
scope — this must be checked manually in admin before the definition is deleted.

## 3. Two defects found while auditing

**a) Collection cards double-multiply ~30 products.** The `or` chain in
`product-card.liquid:52` also fires on `title contains 'voksdug' / 'bordbeskytter' /
'meter'`, or on any `tykkelse:` / `bredde:` / `form:` tag or matching variant option.
Those products already have per-meter prices, so the card multiplies a second time:

> `Voksdug med danske flag 140 cm` — real price **69,00 kr**. Product page shows
> 69,00 kr. Collection card shows **6.900,00 kr**.

Confirmed on `voksdug-med-danske-flag-140-cm`, `voksdug-bla-tern-140-cm`,
`klar-voksdug-0-2-mm-140-cm`, `underlag-antiskrid-hvid-120-cm` — all 69,00 kr with a
blank product type. Roughly 30+ products match the heuristics.

**b) Dead code.** `thickness`, `width` and `form` (lines 20-22, 27-32, 38-47, 56-67)
are parsed from tags and variant options and given hardcoded fallbacks
(`'1,2 mm'` / `'140 cm'` / `'Firkantet'`) — then **never rendered**. Their only live
effect is feeding the `or` chain in defect (a). `badge` (lines 23, 33-34) *is*
rendered at line 110 and must stay.

## 4. Why the ×100 exists, and why it can't just be deleted

Prices are stored **per centimeter** so the customizer can add an arbitrary cut
length (N cm) to the cart as a quantity. The `×100` is a display workaround on top of
that storage decision.

This is the constraint that drives the sequencing: prices cannot be restated per
meter with native unit pricing until something else owns the per-cm cart math. That
something is the app's cart-transform function (`optimization-master-plan.md` A2).
Until then the `×100` has to stay, because with prices at 0,59 and no
`unitPriceMeasurement` configured, deleting the math would make cards read "0,59 kr".

## 5. Where each piece of metervare behaviour belongs

| Piece | Today | Correct home |
| --- | --- | --- |
| Cut-to-size UI (length / width / form picker) | `blocks/product-customizer.liquid`, ~2.400 lines | **App** — theme app extension (plan A3) |
| Cart-line math for an N cm cut | customizer JS + `_metervare_*` line properties + `sections/cart.liquid:38` | **App** — cart-transform function (plan A2) |
| "59,00 kr pr. meter" on the product page | `is_metervare` ×100 in `blocks/product-price.liquid` | **Neither** — Shopify native unit pricing |
| Same on collection cards | ×100 + `or` chain in `snippets/product-card.liquid` | **Theme, but generic** — `snippets/unit-price.liquid` (built in P4.1) |

This matches what the repo already specifies. `missing-surface-designs.md` Surface 12
calls the ×100 metafield math "client-specific" and native unit pricing "its
Shopify-native replacement", and its open question #1 asks to confirm the
`is_metervare` branch retires in the same work item. `optimization-master-plan.md` B4
then deletes the customizer block and the Metervare template outright.

**End state:** no metervare trigger in the theme at all — neither metafield nor
product type. The metafield removal is therefore a step inside the app migration, not
a change worth shipping on its own.

## 6. What the app session must not lose

- Deleting `custom.metervare` is safe from the theme's side; the only blocker is the
  unverified external-consumer check in §2.
- Defect (a) lives in `snippets/product-card.liquid`, which stays **generic theme
  code** through B4 — the app block owns the product page, not collection cards. It
  will not be fixed as a side effect of the app work and needs its own step.
- `product.type == 'Metervare'` is case-sensitive and is the last remaining trigger
  once the metafield goes. Four products, so a typo shows up immediately as a 0,59 kr
  price on the product page.
- Handoff prompt for that session:
  `docs/superpowers/prompts/2026-08-05-metervare-app-migration-prompt.md`
