DESIGN BRIEF: Missing UI surfaces for a Shopify Theme Store submission

CONTEXT

This is a Shopify theme (built on Shopify's skeleton-theme) headed for Theme
Store submission. A code-level audit against Shopify's official requirements
found ~14 mandatory features with no UI at all yet, plus 2 missing template
structures. I need actual designs for these — layout, states, responsive
behavior, interaction — detailed enough that an engineer (Claude Code) can
implement them directly in Liquid/CSS without inventing the missing
decisions. This brief is for the design work only; implementation is a
separate downstream step.

Theme Store review explicitly penalizes generic/boilerplate implementations
of these exact surfaces (nav, account access, search, recommendations) —
reproducing another theme's identity via default components is disqualifying.
So these aren't "add a checkbox and a default snippet" — they need a
deliberate visual point of view that reads as part of one coherent system,
not bolted-on defaults.

EXISTING DESIGN SYSTEM (stay inside this — don't introduce a new one)

Tokens (config/settings_schema.json), light/dark pairs, merchant-editable:
- primary_color / primary_foreground_color
- accent_color / accent_foreground_color
- background_color / background_shade_color
- card_light_color / card_high_color (base card bg vs "raised" bg)
- border_color
- foreground_color (body text)
- important_color (single warning/error color, not paired light/dark)
- input_corner_radius (0–10px, merchant-controlled, applies theme-wide)

Typography: header font and body font are both merchant-selectable via
Shopify's native font picker (type_header_font / type_body_font settings).
Current defaults lean editorial serif (Playfair Display) + clean sans
(Work Sans). Material Symbols Outlined used as the icon font throughout.

Mode: light/dark theme toggle exists (class-based, `.dark` on `<html>`),
user-controlled via localStorage, defaults to system preference. Every
design must work in both modes using the token pairs above — don't design
against one hardcoded palette.

Existing component patterns to match, not reinvent:
- Cards: rounded-md (via input_corner_radius token), border + card_light/
  card_high backgrounds, no heavy shadows
- Badges: small uppercase, letter-spaced (tracking-widest), pill/rounded,
  11px, bold
- Buttons/interactive elements: flat, border-based rather than shadow-based,
  hover = opacity shift not color-swap in some places — audit current
  buy-button and nav styles for the actual convention before designing new
  interactive elements so they match
- Layout is built on Tailwind utility classes compiled to output.css; blocks
  and sections follow Shopify's Online Store 2.0 block/section schema
  pattern (each visual element is its own configurable block)

APPLY BAYMARD INSTITUTE UX RESEARCH

Ground every design decision below in Baymard Institute's published
e-commerce UX research, not just visual taste. Baymard's research is
continuously updated, so look up their current guidance for each surface
rather than relying on dated assumptions — but at minimum, apply these
well-established findings relevant to this specific brief:

- Mega-menus / multi-level nav (#3): wide, forgiving hover-intent zones
  (menus shouldn't collapse the instant a cursor drifts off-target), bounded
  menu depth, clear visual grouping over dense link lists, and menus that
  don't obscure page content unpredictably. This directly informs the
  desktop dropdown vs. mobile accordion decision.
- Predictive/autocomplete search (#4): suggestions should show real product
  thumbnails, price, and enough context to disambiguate near-duplicate
  results — not plain text lists. Baymard's autocomplete research is one of
  their most cited areas; treat the empty/loading/result states as equally
  important to the "happy path."
- Related vs. complementary product recommendations (#9, #10): Baymard
  research specifically flags that near-identical, overlapping
  recommendation sections erode trust and get ignored — the design must make
  the *purpose* of each section (related / complementary / the existing
  cross-sell block) legible at a glance, not just visually distinct.
- Account access (#1): account creation/sign-in should never read as a
  blocking gate — the signed-out state of the account component should feel
  low-friction, consistent with Baymard's guest-checkout and account-creation
  friction findings.
- Newsletter signup (#7): avoid a design that reads as an interruption or
  demands excessive input — Baymard's research on form friction applies even
  to a single-field footer form (label clarity, visible success/error
  feedback, no ambiguous placeholder-as-label pattern).
- Faceted filtering / unit pricing legibility (#12 and existing collection
  filtering): pricing and unit-price information should be scannable at the
  same glance as the main price, not require extra parsing — consistent with
  Baymard's product-list and pricing-clarity research.
- Mobile commerce generally: apply Baymard's mobile usability findings across
  every surface in this brief — adequate touch target sizing beyond the bare
  accessibility minimum, sticky/persistent key actions (e.g. add-to-cart)
  where Baymard research supports it, and avoiding desktop-pattern dropdowns
  that don't translate to touch.

Where Baymard's guidance and this theme's existing visual conventions pull in
different directions, flag the tension explicitly rather than silently
picking one — that's a decision for review, not something to resolve
unilaterally in the design pass.

MISSING SURFACES TO DESIGN

For each: layout + all states (default, hover, focus, active, loading,
empty/error where applicable) + mobile/tablet/desktop behavior +
accessibility notes (focus order, ARIA roles, touch target sizing —
accessibility is a known weak point in this theme, so bake it into the
design, don't leave it to implementation).

1. Header account access — the `<shopify-account>` component must be visible
   in both desktop and mobile headers. Design its placement alongside the
   existing header blocks (logo, nav, search icon, cart, theme toggle) —
   header-2.liquid and header-row-2.liquid currently manage this row. Needs
   a treatment for both signed-in (avatar) and signed-out states.

2. Follow on Shop button — placement in header or footer. Note: Shopify
   mandates the button's own branded colors can't be changed, so the design
   task is really "where does it live and how does it sit next to
   custom-styled neighbors without looking discordant," not restyling it.

3. Multi-level navigation — current nav (blocks/header-navigation.liquid) is
   flat, single-level only. Design a dropdown/mega-menu pattern for nested
   menu items, desktop (hover/click dropdown) and mobile (the hamburger
   drawer already exists — design how nested items expand within it,
   e.g. accordion-style sub-lists).

4. Predictive search — design the results dropdown/panel: product results
   (image, title, price), collection/page results, empty state, loading
   state. Desktop dropdown vs. mobile full-screen takeover — specify which.

5. Accelerated checkout buttons — placement and spacing relative to the
   existing primary "Add to cart" button on both product page
   (blocks/product-buy-buttons.liquid) and cart page (sections/cart.liquid).
   Native Shopify styling applies to the buttons themselves; design is about
   surrounding layout/spacing/divider treatment.

6. Cart discount display — how an applied discount line reads in the cart
   (sections/cart.liquid): line-item vs. order-level discounts, strikethrough
   original price treatment, discount code chip/tag if applicable.

7. Newsletter signup form — needs a home for it (footer is the obvious spot,
   sections/footer.liquid exists). Design input + submit button + success/
   error state, consistent with existing form styling conventions elsewhere
   in the theme.

8. Pickup availability — product page element showing local pickup status.
   Design the default (available/unavailable) and expanded (store address +
   hours, if shown) states.

9. Related product recommendations — product page section showing algorithmic
   recommendations. Should visually relate to but be distinguishable from
   the existing product-cross-sell block — design how a shopper tells them
   apart if both appear on the same page.

10. Complementary products — same distinction question as above; design how
    "related" vs "complementary" vs the existing bespoke cross-sell block
    read as three different, purposeful sections rather than three near-
    identical product grids.

11. Shop Pay Installments banner — placement on the product page near price/
    buy buttons. Native Shopify-rendered element; design is about surrounding
    spacing and visual weight relative to price.

12. Unit pricing display — collection card, product page, and cart line item
    all need a unit-price treatment (e.g. "$4.00 / 100g"), rebuilt from
    scratch since the only prior unit-price code was client-specific and is
    being removed. Design typography/hierarchy relative to the main price.

13. Image focal point support — not really a new UI, but confirm/design how
    cropped images (card, hero, collection banners) respect a focal point
    across all existing image-bearing components rather than always
    center-cropping.

14. Country selector / language selector — typically footer or header
    utility area. Design the trigger (current country/language flag or
    text + chevron) and the dropdown/modal picker list.

15. "Custom Liquid" section — needs a section with a `type: liquid` setting
    (raw code input) as an app insertion point. Minimal design need — mainly
    needs a clear "this is a developer/app tool" visual treatment so
    merchants don't mistake it for a content section, plus an empty state
    for when no code is entered yet.

16. Contact page template (page.contact.json) — full page layout: contact
    form (name/email/message via Shopify's native contact form), plus room
    for supporting content (map, hours, address) as optional blocks.

DELIVERABLE FORMAT

For each surface, produce enough detail that no implementation decisions are
left ambiguous:
- Structural layout (what's a section vs. block vs. snippet, per Shopify's
  architecture — reuse the existing block-per-element convention)
- Spacing/sizing values (use the theme's existing spacing scale where one
  exists; otherwise propose one consistent with Tailwind defaults)
- Color usage expressed as token names (e.g. "background: card_high_color,
  border: border_color"), never hardcoded hex — everything must work
  through the light/dark token pairs
- All interaction states listed above
- Mobile breakpoint behavior explicitly called out, not assumed
- Accessibility requirements per surface (focus order, ARIA labeling,
  min. touch target size, keyboard operability)

Do not touch or redesign any section/block that isn't in the missing-surfaces
list above — everything else in the theme is out of scope for this brief.
