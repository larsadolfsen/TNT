# Brainstorm: getting the code to comply with Theme Store requirements

BACKGROUND

I'm converting a client's WooCommerce store to Shopify. The theme (built on
Shopify's official skeleton-theme) is being genericized so it can also be
submitted to the Shopify Theme Store as a separate product. This brainstorm
is scoped purely to the engineering work of making the codebase compliant —
not whether to pursue Theme Store, pricing, or positioning.

One client-specific feature — a "by the meter" fabric-cutting customizer — is
being extracted out of the theme entirely into a separate custom Shopify app
(theme app extension), so the theme itself ships with zero client coupling.

CURRENT STATE (confirmed via full repo audit + line-by-line diff against
Shopify's official Theme Store requirements doc)

Mechanical cleanup needed (not architecturally interesting, just needs doing):
hardcoded phone/email in header markup, hardcoded shop domain/client_id in
app config, "Skeleton"/"Shopify" left as theme_name/theme_author, client
brand copy in footer defaults, unmodified Shopify skeleton-theme boilerplate
in README/CONTRIBUTING/CODE_OF_CONDUCT, dev-machine scratch scripts,
stock-photo fallback URLs, textile-specific badges.

MISSING mandatory features (Theme Store §4), confirmed absent via grep:
- Follow on Shop button (login_button filter)
- <shopify-account> component in header (desktop + mobile)
- Accelerated checkout buttons on product + cart pages
- Multi-level (nested/dropdown) menus — current nav is flat, single-level only
- Newsletter signup form
- Pickup availability on product page
- Related product recommendations (native API)
- Predictive search
- Selling plans shown in cart (subscriptions)
- Shop Pay Installments banner on product page
- Native unit pricing (variant.unit_price) on collection/product/cart — the
  only unit-price code in the repo is the client's custom fabric-cutting
  math, which is being deleted along with the customizer, so this needs to
  be built from scratch, not salvaged
- Image focal points
- Country selector / Language selector
- Discounts displayed in cart

NEEDS VERIFICATION (present in some form, unclear if it satisfies the spec):
- Complementary products (bespoke cross-sell block exists, may not use
  Shopify's native complementary-products API — needs a read-through)
- Rich product media (video/external_video confirmed working, 3D model
  support via model_viewer unconfirmed)
- Variant images (no variant.image association found in product-media.liquid
  or product-variant-picker.liquid yet)

STRUCTURAL gaps (Theme Store §5):
- Missing required template: page.contact.json
- Missing required "Custom Liquid" section — a section with a setting of
  type `liquid`, used by Shopify/apps as an insertion point. The existing
  custom-section.liquid is a generic background/blocks wrapper, doesn't have
  this setting type

ACCESSIBILITY / PERFORMANCE (Theme Store requires avg Lighthouse ≥90
accessibility, ≥60 performance, mobile + desktop, across home/collection/product):
- No skip-to-content link anywhere in layout/theme.liquid
- Thin ARIA coverage (15 of 63 .liquid files use any aria-* attribute)
- Hardcoded external Google Fonts (Playfair Display, Work Sans, Material
  Symbols) loaded unconditionally in theme.liquid, running alongside —
  not replacing — the theme's own native font-picker settings
  (settings.type_header_font/type_body_font). Two font-loading systems
  active at once.

RELEVANT ARCHITECTURAL NOTE
Theme Store review explicitly wants "architectural-level" differentiation —
its own language is that a theme's identity should not be reproducible via
settings or a few added sections; it should require substantial structural
changes to copy. This matters here specifically because several of the
missing features (nav, account access, search, recommendations) are exactly
the kind of core UX surfaces where a generic/boilerplate implementation vs a
deliberately-designed one is the difference between passing and failing
review — so implementation approach, not just presence/absence, is in scope
for this brainstorm.

WHAT I WANT FROM THIS BRAINSTORM (code/implementation only)

1. Build order: which of the ~14 missing items are safe to batch as
   mechanical/low-risk (e.g., Follow on Shop is a one-line filter call) vs.
   which touch shared architecture and should be sequenced carefully (e.g.,
   account component and multi-level nav both live in the header — do them
   together or does one block the other?).
2. For each missing feature, what's the right Shopify-native implementation
   pattern (Liquid objects/filters/APIs to use, whether it needs a new
   section vs. a new block vs. a snippet, whether it needs JS or is
   server-rendered)? Flag any known gotchas (e.g., the shopify-account
   component has had community-reported stability/styling-control
   complaints — worth scoping around that risk).
3. The font-loading conflict: what's the correct fix — drop the hardcoded
   Google Fonts links entirely and route Playfair Display/Work Sans/Material
   Symbols through the native font_picker/font_url system, or is there a
   legitimate reason (e.g., Material Symbols as icon font) to keep one of
   them outside the font-picker system?
4. Accessibility: concrete plan to get from "15/63 files have any aria-*" to
   passing a 90+ Lighthouse accessibility audit — where are the highest-risk
   components (cart drawer, nav, filters, accordions) and what's the
   remediation pattern for each?
5. For the "needs verification" items (complementary products, rich media,
   variant images), what should I actually check in the code to confirm
   compliance vs. rebuild?
6. Any missing feature that, if implemented thoughtfully rather than
   minimally, could double as one of the "architectural differentiation"
   elements Theme Store review is looking for (per the note above) — i.e.
   where compliance work and uniqueness work overlap so it's not wasted effort?

Stay strictly on implementation — no questions about market positioning,
pricing, or whether this is worth doing.
