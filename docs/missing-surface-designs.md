# Design specs: 16 missing Theme Store surfaces

Companion to `docs/missing-designs-brief.md`. One spec per missing surface, each
independently actionable.

## How to use this document

Each surface below is self-contained. **Read "Shared foundations" first, then read
only your assigned surface.** Shared foundations carries the token names,
breakpoints, spacing scale, primitive call signatures, focus/touch rules and dark
mode rules that every surface depends on; the per-surface specs do not repeat all
of it.

Anything a surface needs that contradicts or extends Shared foundations is stated
inside that surface's spec. Where Baymard Institute guidance and the theme's
existing conventions pull in different directions, the tension is recorded in an
**Open questions** list at the end of that surface's spec — do not resolve those
silently; escalate.

### Research sourcing note

Baymard Institute's article and guideline pages return HTTP 403 to automated
fetching, so the findings cited below come from Baymard's public article
summaries and search-surfaced abstracts, plus secondary write-ups of Baymard
guidelines, rather than the full paywalled guideline text. Every citation names
the specific finding it is standing on so it can be re-verified against a Baymard
subscription before build. Sources are listed at the end of the document.

---

# Shared foundations

**Every implementer must read this section.**

## Color tokens

Never write a hex value. All color comes from CSS custom properties declared in
`snippets/css-variables.liquid` (`:root` for light, `.dark` for dark). Both modes
are always live — the theme toggle puts `.dark` on `<html>`, defaulting to system
preference. Design and verify in both.

| CSS variable | Merchant setting (light / dark) | Use for |
|---|---|---|
| `--color-primary` | `primary_color_light` / `_dark` | Body + heading text, icons, borders on emphasis, solid fills that need max contrast |
| `--color-on-primary` | `primary_foreground_color_*` | Text/icons **on** a `--color-primary` fill |
| `--color-accent` | `accent_color_*` | Primary CTA fill only (buy/checkout/submit) |
| `--color-on-accent` | `accent_foreground_color_*` | Text/icons on an accent fill |
| `--color-background` | `background_color_*` | Page background |
| `--color-background-shade` | `background_shade_color_*` | Subtle zoned background |
| `--color-card-light` | `card_light_color_*` | Base card / panel surface |
| `--color-card-high` | `card_high_color_*` | "Raised" surface: a panel sitting on a card, chips, steppers, hovered rows |
| `--color-card-shade` | `background_shade_color_*` | Alias of background-shade for card contexts |
| `--color-surface-container` | `background_shade_color_*` | Image placeholder / inert fill |
| `--color-border` | `border_color_*` | All 1px borders and dividers |
| `--color-foreground` | `foreground_color_*` | Declared but has **no** Tailwind alias — see caveat below |
| `--style-border-radius-inputs` | `input_corner_radius` (0–10px) | Input/field corner radius |

### Tailwind aliases actually available

`assets/input.css` maps only these into utility classes. Use the utility form —
that is the house style:

`bg-primary` `text-primary` `text-on-primary` `bg-accent` `text-on-accent`
`bg-background` `bg-background-dark` `bg-background-shade` `bg-card-light`
`bg-card-high` `bg-card-shade` `bg-surface-container` `border-outline-variant`
(= `--color-border`) `text-secondary` (= accent) `bg-secondary-container`
(= accent).

Opacity modifiers on `primary` are the established way to express text hierarchy:
`text-primary` (full) → `text-primary/85` (secondary text) → `text-primary/70`
(tertiary) → `text-primary/60` (labels, placeholders) → `text-primary/45`
(disabled/decorative).

**Caveat 1 — body text token.** `--color-foreground` exists but is not mapped to a
Tailwind alias and is not used anywhere in the theme; every existing component
uses `text-primary` for body copy. Follow the existing convention (`text-primary`)
so new surfaces match. Do not introduce `--color-foreground` usage unilaterally.

**Caveat 2 — `important_color` is not emitted.** `config/settings_schema.json`
defines `important_color` (default `#e11d48`) but `snippets/css-variables.liquid`
never writes it to CSS, so no error/warning color is reachable today. Several
surfaces below need one.

> **Prerequisite for any surface with an error state:** add
> `--color-important: {{ settings.important_color | default: '#e11d48' }};` to
> `:root` in `snippets/css-variables.liquid` (single value, not a light/dark pair
> — it is deliberately not paired) and `--color-important: var(--color-important);`
> to the `@theme` block in `assets/input.css` so `text-important`,
> `border-important` and `bg-important` exist. Whichever surface is built first
> lands this; later surfaces assume it.

**Caveat 3 — no success color exists.** Success feedback in these specs uses
`text-primary` + a `check_circle` icon rather than inventing a green token. See
the global open questions.

## Breakpoints

`assets/input.css` **overrides** Tailwind's defaults. The real values:

| Utility prefix | Min width | Band name used in these specs |
|---|---|---|
| (none) | 0 | **Mobile** |
| `sm:` | 600px | Large phone / small tablet |
| `md:` | 840px | **Tablet** |
| `lg:` | 1200px | **Desktop** |
| `xl:` | 1600px | Wide desktop |
| `2xl:` | disabled | — |

There is **no 768px or 1024px breakpoint** in this theme. Any spec that says
"mobile" means `< 840px` unless it explicitly names `sm` (600px).

**The mobile↔desktop navigation boundary in these specs is `md` (840px).**
Existing code is inconsistent about this: `blocks/header-hamburger.liquid` hides
itself at `min-width: 768px` and `assets/input.css` has a `max-width: 767px`
rule for sticky bars, while `blocks/header-search.liquid` and
`sections/section.liquid` correctly use 840px/1200px. Build new work at 840px.
See global open questions.

Raw media queries inside `{% style %}` blocks must use literal pixel values
(`@media screen and (min-width: 840px)`) — that is the existing convention in
`blocks/header-search.liquid` and `sections/section.liquid`. Tailwind's
`--theme()` function only works inside `assets/input.css`.

## Spacing scale

Tailwind's default 4px scale. The values actually in circulation, and what they
mean here:

| Value | Utility | Used for |
|---|---|---|
| 4px | `gap-1` / `p-1` | Icon-to-label micro gap |
| 6px | `gap-1.5` | Price row internals |
| 8px | `gap-2` / `p-2` | Tight inline groups; **minimum separation between adjacent touch targets** |
| 12px | `gap-3` / `p-3` | Card padding, list-row padding, stacked form fields |
| 16px | `gap-4` / `p-4` | Default block padding (`--block-padding-left/right` default), panel padding, section inner padding on mobile |
| 24px | `gap-6` / `p-6` | Drawer padding, desktop panel padding, section-to-section rhythm |
| 32px | `gap-8` | Footer column gap |
| 40px | `py-10` | Boxed section vertical padding |
| 48px | `py-12` | Footer vertical padding |

Grid variables from `assets/input.css` (`:root`), for anything laid out on the
page grid: `--grid-gap` 16px, rising to 24px at `lg`; `--grid-row-gap` 12px;
`--grid-padding-y` 24px, rising to 40px at `lg`.

Block padding overrides follow the established pattern — a `{% style %}` block
setting `--block-padding-top/bottom/left/right` scoped to
`#shopify-block-{{ block.id }}.shopify-block`, fed by `padding_top`,
`padding_bottom`, `padding_sides` range settings. Copy the shape from
`blocks/product-price.liquid`.

## Corner radius

The theme uses a small, fixed vocabulary. Match it; do not introduce new radii.

- `rounded-full` — all buttons and pill controls (accent CTAs, quantity steppers,
  chips, badges shaped as pills).
- `rounded-2xl` (16px) — product cards, image wrappers, drawers' inner panels.
- `rounded-3xl` (24px) — boxed section containers (`sections/section.liquid`).
- `rounded-md` (6px) / `rounded` (4px) — small badges, nav hover pills, inline tags.
- `var(--style-border-radius-inputs)` — text inputs, selects, textareas only.

**Known inconsistency:** the brief describes cards as "rounded-md via
input_corner_radius", but shipped code hardcodes `rounded-2xl` on cards and
`--style-border-radius-inputs` is currently referenced nowhere. These specs
follow the shipped code (hardcoded card radius) and put
`--style-border-radius-inputs` on form fields only. Flagged globally.

## Typography

- Headings `h1 h2 h3 h5 h6` → serif (`var(--font-serif)`, default Playfair
  Display). `h4` → sans (`var(--font-sans)`, default Work Sans). This inversion is
  deliberate and already encoded in `assets/input.css`.
- Body, labels, prices, buttons → sans.
- Section headings reuse the existing `.section-section__heading` class
  (serif, bold, `text-primary`, 12px bottom margin → 16px at 840px, `text-xl` →
  `text-2xl` at 840px for `h2`).
- Badge convention: 11px, `font-bold`, `uppercase`, `tracking-wider`/
  `tracking-widest`, pill or `rounded-md`.
- Eyebrow/label convention (from footer): `text-xs font-bold uppercase
  tracking-widest text-primary/60`.

## Primitive snippets

Built in a parallel track. Compose from these; never re-inline their markup.
Per `CLAUDE.md` this is mandatory, not stylistic.

```liquid
{% render 'icon', name: 'search', class: 'text-[20px]', label: 'Search' %}
{% render 'button', label: 'Add to cart', variant: 'primary', as: 'button', class: 'w-full', attributes: 'id="btn-add-to-cart"' %}
{% render 'input', id: 'contact-email', name: 'contact[email]', type: 'email', label: 'Email', value: '', placeholder: '', required: true, autocomplete: 'email' %}
```

- **`icon`** — `name` is a Material Symbols Outlined ligature (`search`, `person`,
  `close`, `expand_more`, `chevron_right`, `shopping_cart`, `storefront`,
  `check_circle`, `error`, `local_shipping`, `language`, `mail`, `code`,
  `schedule`, `location_on`, `call`, `arrow_forward`, `menu`). `label` supplies an
  accessible name; when omitted the icon must render `aria-hidden="true"`.
- **`button`** — `as` is `button` or `a` (`a` requires `url`). Variant vocabulary
  these specs assume:
  - `primary` — `bg-accent text-on-accent font-bold rounded-full shadow-sm`,
    hover `brightness-95`, active `scale-95`.
  - `secondary` — transparent fill, `border border-outline-variant text-primary
    rounded-full`, hover `bg-card-high`.
  - `ghost` — no fill/border, `text-primary font-semibold`, hover `underline`.
  - `icon` — square, no fill/border, `text-primary`, hover `opacity-80`.
  If the parallel track ships different variant names, map onto its vocabulary
  and note the mapping in the PR; do not add a new variant to satisfy one surface.
- **`input`** — renders a **visible `<label>` above the field**, never a
  placeholder-as-label. `placeholder` is for format hints only and may be empty.

## Interaction conventions (audited from shipped code)

- **Hover on filled buttons** = `hover:brightness-95` (not a color swap).
- **Hover on icon/text controls** = `hover:opacity-80 transition-opacity`.
- **Hover on nav items** = a background pill fading in behind the label
  (`--color-surface-container`), 150ms ease — see the `.nav-link-pill::before`
  pattern in `blocks/header-navigation.liquid`.
- **Hover on cards** = `hover:shadow-md hover:border-primary/40`, image
  `scale-105` over 500ms.
- **Active/pressed** on primary CTAs = `active:scale-95`.
- **Transitions** = 150–300ms `ease`. Drawer slide = 300ms. Image zoom = 500ms–1s.
- **Borders over shadows.** The only shadows in use are `shadow-sm` on CTAs,
  `shadow-md` on hovered cards and boxed sections, and `shadow-2xl` on drawers.
  Do not add new elevation.

## Focus — mandatory for every surface

The shipped theme applies `focus:outline-none` on nearly every interactive element
**without a replacement**, so keyboard focus is currently invisible. Every surface
in this document must ship a visible focus indicator. The first surface built adds
this to `assets/input.css`:

```css
.focus-ring:focus-visible,
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: inherit;
}
```

Rules: never use bare `focus:outline-none` without a `focus-visible` replacement.
Focus indicator must be visible in both light and dark mode (it is —
`--color-primary` inverts). Contrast of the indicator against its background must
be ≥ 3:1.

## Touch targets — mandatory for every surface

Baymard's mobile commerce research reports materially higher completion rates for
flows with ≥48×48px touch targets, and ~40% fewer touch errors when adjacent
targets are separated by ≥8px. WCAG 2.2 AA's floor is 24×24px; **this theme
targets 48×48px**, which is above the accessibility minimum, as the brief requires.

- Minimum hit area **48×48px** on every tappable control below 840px, and on
  every icon-only control at any width.
- Minimum **8px** clear space between adjacent targets.
- Header icons currently render a 24px glyph with no padding. New header controls
  must wrap the glyph in a 48×48 flex-centered box (`w-12 h-12 flex items-center
  justify-center`) with the glyph at `text-2xl`. The box may be visually
  transparent — the hit area is what matters.
- Inline text links inside prose are exempt (WCAG 2.2 exception).

## Motion and reduced motion

Wrap every transform/slide animation:

```css
@media (prefers-reduced-motion: reduce) {
  /* transitions collapse to 0.01ms; panels appear/disappear without slide */
}
```

Opacity fades may remain but should be ≤100ms under reduced motion.

## Localization

All merchant-invisible strings go through `locales/en.default.json` +
`locales/da.json` with `{{ 'key' | t }}`. The theme currently ships hardcoded
Danish strings in several files; **new surfaces must not add hardcoded strings** —
Theme Store review checks this. Add keys under a namespace matching the surface
(`account.*`, `navigation.*`, `predictive_search.*`, `newsletter.*`,
`pickup.*`, `recommendations.*`, `localization.*`, `contact.*`).

## Dark mode checklist (apply per surface)

1. No hardcoded hex, `bg-white`, `bg-black`, `text-white`, `text-black`,
   `border-slate-*`, `text-red-600`. (Existing code violates this in
   `sections/header-2.liquid`, `sections/footer.liquid`, `sections/cart.liquid`;
   do not copy those.)
2. Scrims/overlays may use `bg-black/50` — that is mode-agnostic and already the
   drawer convention.
3. Panels floating over content use `bg-card-light` + `border-outline-variant`,
   not `bg-white`.
4. Anything raised on top of a card uses `bg-card-high`.

---
# Surface 1 — Header account access

## What it is / Baymard basis

A persistent account entry point in the header, visible on **both** desktop and
mobile, wrapping Shopify's `<shopify-account>` custom element. Two states:
signed-out and signed-in.

Baymard's checkout research reports that "the site wanted me to create an account"
is the single largest self-reported cause of checkout abandonment (~24% of US
abandonments), and that forgotten passwords block ~19% of account users from
completing checkout. The design consequence: the signed-out state must read as an
**optional convenience**, never as a gate. Concretely — the control is an icon
with a quiet label, not a filled CTA competing with Add to cart; the panel leads
with "Sign in" and offers "Create account" as a peer, not a prerequisite; and
nothing about it implies you must be signed in to shop.

## Files & architecture

- **New block:** `blocks/header-account.liquid` — registered in the `blocks` array
  of `blocks/header-row-2.liquid` **and** available inside `blocks/header-group.liquid`
  (which already accepts `@theme`, so it is automatically available there once the
  block file exists).
- **New snippet:** `snippets/account-panel.liquid` — the signed-out dropdown panel
  contents. Kept separate per `CLAUDE.md` (markup vs. block wiring).
- Composed from `icon`, `button`.
- Default placement: the right-aligned `header-group` in row 1, **between** the
  theme toggle and the cart icon — order becomes `theme-toggle → account → cart`.
  Rationale: cart stays last (rightmost, thumb-reachable, matches universal
  convention); account sits adjacent to it because both are "my stuff"; the theme
  toggle stays outermost because it is the least commerce-critical.
- The mobile drawer (`sections/header-2.liquid`) additionally gets an account row
  — see Responsive.

## Schema settings

| id | type | default | label |
|---|---|---|---|
| `show_label` | checkbox | `false` | Show text label next to icon (desktop only) |
| `label_text` | text | `t:account.account` | Label text |
| `panel_enabled` | checkbox | `true` | Open a panel on click instead of navigating straight to /account |

## Layout & sizing

**Trigger (both states)**

- `<button>` (not a link) when `panel_enabled`, else an `<a href="{{ routes.account_url }}">`.
- Box: `w-12 h-12 flex items-center justify-center` (48×48 hit area) at all widths.
- Signed-out glyph: `person` at `text-2xl` (24px), `text-primary`.
- Signed-in glyph: 28×28 circular avatar, `rounded-full`, `bg-primary`
  `text-on-primary`, containing the customer's initials at `text-xs font-bold`
  `tracking-wider` (first letter of `customer.first_name` + first of
  `customer.last_name`; fall back to first letter of `customer.email`).
  Centered inside the same 48×48 box.
- Optional label (desktop only, `show_label` on): `text-sm font-medium
  text-primary`, `ml-1`, box widens to `h-12 px-3` with `gap-1`.

**Signed-out panel** (`snippets/account-panel.liquid`)

- Anchored dropdown, right-aligned to the trigger, `top: calc(100% + 8px)`.
- Width 288px (`w-72`). Padding 24px (`p-6`). `rounded-2xl`,
  `border border-outline-variant`, `bg-card-light`, `shadow-md`.
- Contents, top to bottom, `gap-4`:
  1. Heading — `h4` (sans per theme convention), `text-base font-bold text-primary`.
     Copy: "Sign in" (`t:account.sign_in_title`).
  2. One line of supporting copy, `text-sm text-primary/85 leading-relaxed`:
     "Faster checkout and your order history — optional, you can always check out
     as a guest." This sentence is the Baymard mitigation; it is not decorative.
  3. `button` variant `primary`, `as: 'a'`, `url: routes.account_login_url`,
     `class: 'w-full h-12'`, label "Sign in".
  4. `button` variant `secondary`, `as: 'a'`,
     `url: routes.account_register_url`, `class: 'w-full h-12'`, label
     "Create account".
  5. Divider: `border-t border-outline-variant`, `pt-4`.
  6. `button` variant `ghost`, `as: 'a'`, `url: routes.account_recover_url`,
     label "Forgot password?", `text-sm`. Present at top level — not hidden behind
     the login page — because Baymard flags forgotten passwords as a ~19% blocker.
- Gap between the two buttons: 8px (`gap-2`). Both full width, stacked — never
  side by side, which would visually rank them.

**Signed-in panel**

Same shell. Contents:
1. Row: avatar (32px) + name (`text-sm font-bold text-primary`) + email
   (`text-xs text-primary/70 truncate`). `gap-3`, `pb-4`,
   `border-b border-outline-variant`.
2. Link list, `flex flex-col`, each row `h-12 flex items-center px-2 -mx-2
   rounded-md text-sm text-primary`: "Orders" (`routes.account_url`),
   "Addresses" (`routes.account_addresses_url`).
3. Divider, then `button` variant `ghost`, `as: 'a'`,
   `url: routes.account_logout_url`, label "Sign out".

**`<shopify-account>` integration.** Shopify's element is what Theme Store
requires. Render it as the wrapper around the trigger so Shopify can hydrate
customer state, and drive the panel from `customer` in Liquid for the initial
render:

```
<shopify-account>  →  trigger button  →  panel (aria-hidden until opened)
```

If `<shopify-account>` renders its own default UI, suppress it with a scoped
`{% style %}` on `#shopify-block-{{ block.id }} shopify-account > :not(.account-trigger) { display: none; }`
rather than by not using the element.

## Color tokens

| Part | Token |
|---|---|
| Trigger glyph | `text-primary` |
| Trigger hover | opacity 0.8 (no color change) |
| Avatar fill / text | `bg-primary` / `text-on-primary` |
| Panel background | `bg-card-light` |
| Panel border | `border-outline-variant` |
| Panel heading / body | `text-primary` / `text-primary/85` |
| Primary button | `bg-accent` / `text-on-accent` |
| Secondary button | transparent + `border-outline-variant` + `text-primary` |
| Link row hover | `bg-card-high` |
| Focus ring | `--color-primary`, 2px, 2px offset |

## States

| State | Treatment |
|---|---|
| Default (signed-out) | `person` glyph, `text-primary` |
| Default (signed-in) | initials avatar |
| Hover | `opacity-80`, 150ms |
| Focus-visible | 2px `--color-primary` ring, 2px offset, on the 48px box |
| Active/pressed | `scale-95` on the glyph box, 100ms |
| Open | Glyph box gets `bg-card-high` `rounded-full` to show the anchor is active; `aria-expanded="true"` |
| Loading | Only if `<shopify-account>` hydrates asynchronously: keep the `person` glyph at `opacity-60` with no spinner. Never show a skeleton in the header — layout shift in a sticky header is worse than a stale glyph. |
| Error (auth check failed) | Fall back to signed-out. Never show an error in the header. |

## Responsive

- **Mobile (<840px):** trigger is icon-only regardless of `show_label`. Tapping it
  does **not** open a dropdown — it navigates directly to `routes.account_url`
  (Shopify redirects to login when signed out). Rationale: Baymard's mobile
  research warns against desktop dropdown patterns that don't translate to touch;
  a 288px floating panel under a 48px target in a 56px-tall header is exactly
  that pattern. Implement by rendering the trigger as `<a>` under 840px.
  Additionally, `sections/header-2.liquid`'s mobile drawer gains an account row at
  the **top** of the nav list (above the menu links, below the "Menu" title, with
  a `border-b border-outline-variant` beneath): 48px tall, `person` icon +
  "Sign in / Create account" when signed out, avatar + first name when signed in.
- **Tablet (840–1199px):** dropdown panel enabled. Panel width 288px, right-aligned;
  clamp with `max-width: calc(100vw - 32px)`.
- **Desktop (≥1200px):** as tablet, plus the optional text label.

## Accessibility

- Trigger: `<button type="button" aria-expanded="false" aria-controls="account-panel-{{ block.id }}" aria-haspopup="true">`;
  accessible name from `{% render 'icon', ..., label: %}` — "Account" signed out,
  "Account — {{ customer.first_name }}" signed in. Do not rely on the glyph
  ligature text for the name; the icon primitive must mark the glyph
  `aria-hidden="true"`.
- Panel: `role="dialog"` `aria-label="Account"`, `hidden` when closed (use the
  `hidden` attribute, not just a class, so it leaves the a11y tree).
- Keyboard: `Enter`/`Space` toggles. On open, focus moves to the panel's first
  focusable element. `Tab` cycles within the panel (focus trap). `Escape` closes
  and returns focus to the trigger. Clicking outside closes.
- Focus order in the header row: hamburger → logo → search → account → cart →
  theme toggle, matching visual left-to-right order. If DOM order and visual order
  diverge because of `header-group` alignment, fix DOM order — never use
  `tabindex` > 0.
- Avatar initials must have `aria-hidden="true"` (they are decorative; the button
  already carries the name).
- Touch target 48×48 at all widths; ≥8px from the cart icon.
- Contrast: initials on `--color-primary` are guaranteed by the
  `primary`/`on-primary` token pairing. If a merchant sets a low-contrast pair
  that is a merchant-side problem, but the design must not add a third color.

## Open questions

1. **Panel vs. direct navigation on desktop.** Baymard's account-friction findings
   favor minimum ceremony, which argues for the trigger going straight to
   `/account` everywhere and dropping the panel entirely. The panel is specified
   because it surfaces "Forgot password?" and the guest-checkout reassurance
   without a page load. Decide whether the extra surface is worth the extra
   interaction; `panel_enabled` exists so this can be flipped without a rebuild.
2. **Reassurance copy accuracy.** The panel promises guest checkout is available.
   That is a Shopify **checkout setting**, not a theme setting — if the merchant
   requires accounts, the copy becomes a lie. Options: hide the sentence behind a
   block setting, or omit it. Needs a decision.
3. **Header density.** Adding account makes the right-hand group three icons
   (theme toggle, account, cart) at 48px each plus 8px gaps = 160px. On a 360px
   phone with the hamburger and logo on the left, that is tight. Candidate
   resolutions: move the theme toggle into the mobile drawer, or drop the theme
   toggle from the mobile header entirely. Not resolved here because the theme
   toggle is out of this brief's scope.

---

# Surface 2 — Follow on Shop button

## What it is / Baymard basis

Shopify's `<follow-on-shop>` element. Its colors, corner radius and typography are
fixed by Shopify and **must not be restyled** — the design problem is placement
and how it sits next to custom-styled neighbors without reading as a foreign body.

No direct Baymard guideline applies. The relevant general finding is that
recommendation and social surfaces which read as ambiguous or unexplained get
ignored (same mechanism as the recommendations research in Surfaces 9/10), so the
button gets a short label rather than floating unexplained.

## Files & architecture

- **New snippet:** `snippets/follow-on-shop.liquid` — renders the element plus its
  optional label and container. Single responsibility; two call sites.
- **New block:** `blocks/header-follow-on-shop.liquid` — thin wrapper that renders
  the snippet, registered in `blocks/header-row-2.liquid`'s `blocks` array so it
  can be placed in any header group. **Off by default.**
- **Footer call site:** rendered from `sections/footer.liquid` in the trust-badge
  row (the `flex gap-4` row currently holding the OEKO-TEX / Phthalat-fri chips),
  gated by a new `show_follow_on_shop` section setting, default `true`.

**Recommended primary home: the footer.** Reasons: (a) the header's right group is
already at capacity once account lands (Surface 1); (b) the button's fixed Shop
purple/black cannot be tokenized, and a fixed-color element in a sticky header is
the most visually discordant place to put it; (c) the footer trust row is already a
zone of third-party marks (certification chips, `powered_by_link`), so a
Shopify-branded mark is contextually at home there.

## Schema settings

On `sections/footer.liquid`:

| id | type | default | label |
|---|---|---|---|
| `show_follow_on_shop` | checkbox | `true` | Show "Follow on Shop" button |
| `follow_on_shop_label` | text | `t:follow_on_shop.label` | Label above button |

On `blocks/header-follow-on-shop.liquid`: no settings (placement is the setting).

## Layout & sizing

**Footer placement**

Inside the existing bottom row (`pt-8 border-t border-outline-variant flex
flex-col items-center gap-4 text-center`), insert **above** the certification
chips:

```
[ label: "Stay in touch" ]        ← text-xs uppercase tracking-widest text-primary/60
[ <follow-on-shop> ]              ← Shopify-rendered, untouched
[ gap-4 ]
[ OEKO-TEX® ] [ Phthalat-fri ]    ← existing chips
[ gap-4 ]
[ © copyright line ]              ← existing
```

- Wrapper: `flex flex-col items-center gap-2`.
- Label to button gap: 8px.
- Button to chips gap: 16px (inherited from the row's `gap-4`).
- **Isolation treatment** — the one design lever available. Give the wrapper
  `px-4 py-3 rounded-2xl bg-card-high` (no border). This reads as a deliberate
  "third-party module" slot rather than a stray button, and the `card_high`
  surface is exactly the theme's "raised" affordance. It also means the Shop
  brand color is set against a neutral token surface in both light and dark mode
  instead of directly against the footer's `card_light`.
- Do **not** add a border — the button's own edge plus a container border reads
  as double-chrome against the theme's flat, border-based idiom.
- Max width 320px, centered.

**Header placement (opt-in)**

- Sits in the right-aligned `header-group`, **left of** the theme toggle
  (outermost-but-one), so the commerce-critical trio (account, cart) stays
  rightmost.
- No label, no container fill in the header — the header row is 56px and cannot
  absorb a raised chip. `flex items-center h-12`.
- `blocks/header-follow-on-shop.liquid` must set
  `@media (max-width: 839px) { display: none; }` on `#shopify-block-{{ block.id }}` —
  the header has no room for it on mobile.

## Color tokens

| Part | Token |
|---|---|
| Wrapper fill (footer) | `bg-card-high` |
| Label | `text-primary/60` |
| Button itself | **Shopify-controlled — do not style.** No token applies. |

Do not set `color`, `background`, `border-radius`, `font-family` or `box-shadow`
on `<follow-on-shop>` or any descendant. Do not wrap it in anything that clips it
(`overflow: hidden`).

## States

All interaction states (hover, focus, active, loading, followed) are rendered and
owned by Shopify's element. The theme contributes exactly one state:

| State | Treatment |
|---|---|
| Element unavailable (Shop app not enabled / element fails to define) | The wrapper collapses. Implement with `<follow-on-shop>:not(:defined) { display: none; }` plus `.follow-on-shop-wrapper:not(:has(follow-on-shop:defined)) { display: none; }` so the label and the `card_high` chip do not linger around an empty box. |

The theme must **not** add its own focus ring to the element — Shopify's element
manages its own focus indication. The `focus-visible` rule in Shared foundations
targets `button`/`a`/`input`; scope it so it does not reach inside
`<follow-on-shop>`.

## Responsive

- **Mobile (<840px):** footer placement only. Wrapper is full width up to 320px,
  centered. Header block hidden.
- **Tablet (840–1199px):** footer as above. Header block available but still not
  recommended.
- **Desktop (≥1200px):** unchanged. If the header block is enabled, verify the
  right group total width (follow-on-shop + theme toggle + account + cart) does
  not push the centered search bar off-center; the search block's `max_width`
  setting is the escape hatch.

## Accessibility

- The element supplies its own accessible name; do **not** add `aria-label` to it
  or to its wrapper.
- The label above it is decorative context, not a label-for. Use a plain `<p>`,
  not `<label>`.
- The wrapper must not be focusable — no `tabindex`.
- Touch target is Shopify's; do not shrink it with `transform: scale()`. Ensure
  ≥8px clearance from the certification chips below.
- Focus order in the footer: menus → follow-on-shop → newsletter → localization →
  legal links. (Newsletter is Surface 7, localization Surface 14 — if either lands
  first, insert follow-on-shop before them.)

## Open questions

1. **Header vs. footer as the shipped default.** This spec ships footer-on,
   header-off. Theme Store reviewers look for the button's presence, not its
   location, so footer satisfies the requirement — but if the intent is
   discoverability, header wins. Recommend confirming with whoever owns the
   submission checklist.
2. **The `card_high` chip is a judgement call.** It solves "fixed brand color
   dropped onto the footer" but it is the only raised chip in the footer and
   slightly breaks the footer's flat rhythm. Alternative is no container at all.
   Worth a visual review in both modes before locking.
3. **Dark mode contrast is outside our control.** Shopify's button has fixed
   colors; on `--color-card-high` in dark mode (default `#222f40`) the contrast is
   acceptable but a merchant can set `card_high_color_dark` to anything. There is
   no mitigation available within the "don't restyle" constraint. Accept and note.

---
# Surface 3 — Multi-level navigation

## What it is / Baymard basis

`blocks/header-navigation.liquid` currently renders one flat `<ul>` of top-level
links. Shopify link lists support three levels (`link.links[].links[]`). This
surface adds level 2 and 3: a desktop dropdown/mega-menu and a mobile accordion
inside the existing hamburger drawer.

Baymard findings applied:

- **Hover intent.** Baymard's drop-down research finds menus that open or close on
  incidental cursor movement are a top source of misleading interaction, and
  recommends the pointer be stationary before a hover-dependent element appears
  (the cited figure is ~0.5s). Applied as: an **open delay** plus a generous
  **close grace period**, not instant open/instant close.
- **Bounded depth and grouping over dense lists.** Baymard favors clear visual
  grouping over long undifferentiated link lists. Applied as: level 2 becomes a
  column heading, level 3 becomes its links; depth is hard-capped at 3.
- **Menus that don't obscure content unpredictably.** Applied as: the panel is
  anchored and full-bleed-within-page-width with a defined top edge, plus a scrim,
  so it never partially covers content in an ambiguous way.
- **Mobile must deviate from desktop.** Baymard's mobile navigation benchmark
  reports 69% of e-commerce sites rate mediocre or worse on mobile main
  navigation, and that mobile menus have to depart significantly from the desktop
  mega drop-down. Both accordion-in-drawer and multi-screen drill-down are
  validated patterns; this spec picks **accordion** (the ASOS-style inline
  expansion) because it preserves the user's place in the parent list.

## Files & architecture

- **Modified block:** `blocks/header-navigation.liquid` — top-level `<ul>` gains
  nested rendering and hover/keyboard wiring.
- **New snippet:** `snippets/nav-dropdown-panel.liquid` — the desktop level-2/3
  panel for one top-level link. Rendered inside each `<li>` that has children.
- **New snippet:** `snippets/nav-drawer-tree.liquid` — the mobile accordion tree.
  Rendered from `sections/header-2.liquid`'s existing `#mobile-menu-drawer`,
  **replacing** the current flat `{% for link in linklists[...].links %}` loop.
- **New asset:** `assets/navigation.js` — hover-intent timers, keyboard handling,
  accordion toggling. Per `CLAUDE.md`, behavior does not live inline in the
  block.
- Composed from `icon` (`expand_more`, `chevron_right`), `button`.

## Schema settings (added to `blocks/header-navigation.liquid`)

| id | type | default | label |
|---|---|---|---|
| `menu` | link_list | `main-menu` | *(exists)* |
| `item_padding` | range 0–72, step 2 | 12 | *(exists)* |
| `dropdown_style` | select `panel` / `list` | `panel` | Dropdown style |
| `dropdown_columns` | range 2–5, step 1 | 4 | Max columns in panel |
| `open_on` | select `hover` / `click` | `hover` | Desktop open behavior |

`list` style = a single-column dropdown, used when a top-level link has only
level-2 children and fewer than 6 of them. `panel` = multi-column mega panel. The
block picks automatically when `dropdown_style: panel`: **if a top-level link has
≤5 children and no grandchildren, render `list`; otherwise render `panel`.** This
is the "grouping over dense lists" rule made mechanical.

## Desktop layout & spacing (≥840px)

**Trigger row** — unchanged geometry. Each top-level `<li>` keeps the existing
`.nav-link-pill` treatment (`h-full`, `padding-inline` from `item_padding`,
`text-sm font-medium text-primary`, hover pill via `::before` filling with
`--color-surface-container`, 150ms). Links **with** children additionally get:

- `expand_more` icon at 18px, `ml-1`, `text-primary/70`, rotating 180° over 200ms
  when the panel is open.
- The nav row must become `overflow: visible` when a panel is open. The current
  `overflow-x-auto hide-scrollbar` on the `<nav>` will clip the panel. Fix: keep
  `overflow-x-auto` only below 840px; at ≥840px set `overflow: visible` and let
  the list wrap-free row size naturally.

**`list` dropdown**

- Anchored to its `<li>`, `top: 100%`, left-aligned to the trigger (flip to
  right-aligned if it would overflow the page width).
- Width `min-w-[240px] max-w-[320px]`.
- `bg-card-light`, `border border-outline-variant`, `rounded-2xl`, `shadow-md`,
  `p-2`.
- Each item: `h-11 flex items-center px-3 rounded-md text-sm text-primary`,
  hover `bg-card-high`.
- Vertical offset from the trigger: **0px** — the panel touches the header's
  bottom border. A gap creates a dead zone the pointer crosses, which is the
  classic hover-intent failure Baymard flags.

**`panel` mega menu**

- Anchored to the header, not the `<li>`: `left: 0; right: 0` within the header's
  content container so it spans the full page width. `top: 100%`.
- `bg-card-light`, `border-t border-outline-variant`,
  `border-b border-outline-variant`, `rounded-b-2xl`, `shadow-md`.
- Padding: `px-6 py-8` (24/32). At ≥1200px `px-8 py-10`.
- Inner grid: `grid gap-x-8 gap-y-6`, columns =
  `min(dropdown_columns, number-of-level-2-items)`, via
  `grid-template-columns: repeat(var(--nav-cols), minmax(0, 1fr))`.
- Column content:
  - Level 2 = heading. `h4`-styled (sans, per theme convention):
    `text-sm font-bold text-primary`, `mb-3`. If the level-2 item has a URL it is
    an `<a>`; if it is a `#` placeholder it is a `<span>`. Hover on the heading
    link: `underline`.
  - Level 3 = `<ul>` beneath, `flex flex-col gap-2`, each
    `text-sm text-primary/85`, hover `text-primary` (no pill — pills at this
    density become noise).
- **Featured slot (optional, right-most column):** if the top-level link has an
  associated collection image available via `collections[link.object.handle]`,
  render a 1:1 `rounded-2xl` image card with the collection title beneath at
  `text-sm font-bold text-primary`. Uses `snippets/image.liquid` with focal-point
  support (Surface 13). This is the single strongest lever against
  "generic/boilerplate nav" in Theme Store review — it makes the panel look
  designed rather than dumped.
- **Max height** `calc(100vh - var(--header-height) - 24px)` with
  `overflow-y: auto` and `hide-scrollbar`. Never let a panel exceed the viewport.
- **Scrim:** a `fixed inset-0 bg-black/50 z-40` layer beneath the panel
  (`z-50` on the panel) fading in over 200ms. This is the "doesn't obscure content
  unpredictably" mitigation — the page dims deliberately rather than being
  partially covered.

**Hover intent timing**

- **Open delay: 250ms** of continuous pointer presence over the trigger before
  the panel opens. If the pointer leaves before 250ms, nothing happens.
- **Instant open when a panel is already open**: moving from one top-level
  trigger to another swaps panels with **0ms** delay. Re-applying the delay
  between siblings is the single most-complained-about mega-menu behavior.
- **Close delay: 400ms** after the pointer leaves both the trigger and the panel.
  Re-entering either within 400ms cancels the close.
- **Corridor:** the panel's top edge is flush with the trigger row, so the
  pointer never crosses uncovered ground. No "safe triangle" geometry needed.
- Timers live in `assets/navigation.js`; `pointerenter`/`pointerleave`, not
  `mouseover`/`mouseout`.
- Under `prefers-reduced-motion: reduce`, keep the timers (they are intent, not
  motion) but drop the fade to 0.01ms.

`open_on: click` variant: trigger toggles on click, no timers, panel closes on
outside click or `Escape`. Everything else identical.

## Mobile layout & spacing (<840px)

Rendered by `snippets/nav-drawer-tree.liquid` inside the existing
`#mobile-menu-drawer` panel (`bg-card-light w-5/6 max-w-sm h-full p-6` — note the
existing markup uses `bg-white`; change to `bg-card-light` while you are in there,
since it is broken in dark mode).

- Level 1 rows: `min-h-[48px] flex items-center justify-between w-full py-2
  text-base font-semibold text-primary`, separated by
  `border-b border-outline-variant/40` (existing convention).
- A level-1 row **with children** is a `<button>`, not a link, containing:
  label (left) + `expand_more` icon 24px (right, inside a 48×48 box so the
  disclosure has its own full target). Icon rotates 180° over 200ms when open.
  - **If the level-1 item also has its own URL**, the row splits: the label is an
    `<a>` occupying the left portion with a 48px min height, and the disclosure
    `<button>` is a separate 48×48 target on the right, separated by 8px. Never
    make users choose between "go to the category" and "see subcategories" — that
    is a documented mobile nav failure.
- Level 2 list: revealed inline (accordion), `pl-4`, `border-l-2
  border-outline-variant`, `ml-1`, `flex flex-col`. Rows
  `min-h-[48px] text-sm font-medium text-primary py-2`.
- Level 3: same pattern nested one more time, `pl-4` again. Cap here — no level 4
  exists in Shopify and none should be invented.
- Only **one** level-2 accordion open at a time (auto-close siblings). Level-3
  accordions inside an open level-2 may be independently open.
- Expansion animation: `max-height` 0 → `scrollHeight`, 250ms `ease`, plus
  opacity. Under reduced motion, snap.
- After expanding, scroll the opened row to the top of the drawer's scroll
  container if its children would fall below the fold
  (`scrollIntoView({ block: 'start' })`).
- Drawer body gets `overflow-y-auto` — the current markup has no scroll container,
  so a 3-level menu will overflow.

## Color tokens

| Part | Token |
|---|---|
| Trigger label | `text-primary` |
| Trigger hover pill | `--color-surface-container` (existing `::before`) |
| Trigger active/open | `--color-card-high` fill on the pill |
| Panel background | `bg-card-light` |
| Panel border | `border-outline-variant` |
| Level-2 heading | `text-primary` |
| Level-3 link | `text-primary/85`, hover `text-primary` |
| List-item hover | `bg-card-high` |
| Scrim | `bg-black/50` (mode-agnostic, matches drawer convention) |
| Drawer accordion rail | `border-outline-variant` |
| Focus ring | `--color-primary` 2px, 2px offset |

## States

| State | Desktop | Mobile |
|---|---|---|
| Default | Pill transparent, chevron down | Row collapsed, chevron down |
| Hover | Pill fills `--color-surface-container` 150ms | (n/a — touch) |
| Focus-visible | 2px ring on the trigger, inset so it isn't clipped by the row | 2px ring on the row / on the disclosure button |
| Open | Pill fills `--color-card-high`; chevron rotated 180°; `aria-expanded="true"`; scrim visible | Children visible; chevron rotated 180°; `aria-expanded="true"` |
| Active/pressed | `opacity-80` for 100ms | Row background `bg-card-high` while pressed |
| Current page | Existing `nav-menu-item--active` class retained; add a 2px `bg-primary` underline on the trigger's bottom edge and `font-semibold` on the label | `text-primary font-bold` + a 2px `border-l` in `--color-primary` on the row |
| Empty (link has no children) | No chevron, no panel, plain link | No disclosure button, plain link |
| Menu not set / empty link list | Block renders nothing (existing `{% if menu_handle != blank %}` guard) | Drawer shows only the "Forside" home link |

There is no loading state — menus are server-rendered.

## Responsive

- **<840px:** hamburger drawer + accordion. Desktop panels are not rendered at all
  (`display: none` on the panel markup below 840px is not enough — gate the whole
  `snippets/nav-dropdown-panel.liquid` render behind CSS only if the markup is
  cheap; it is, so render once and hide with CSS to keep one DOM).
- **840–1199px (tablet):** desktop pattern, but `open_on` behaves as **click**
  regardless of the setting when the primary pointer is coarse
  (`@media (pointer: coarse)`). Hover-intent timers are meaningless on touch and
  produce the "first tap opens, second tap navigates" trap. Detect with
  `matchMedia('(hover: hover) and (pointer: fine)')` in `assets/navigation.js`.
- **≥1200px:** full spec, `panel` padding steps up to `px-8 py-10`, mega grid may
  use up to `dropdown_columns` columns.
- **≥1600px:** panel max width clamps to `var(--page-width)` and centers.

## Accessibility

- Structure: `<nav aria-label="Main">` → `<ul>` → `<li>`. Keep the existing
  `aria-label` but move it to a translated string.
- Trigger with children: `<button type="button" aria-expanded="false"
  aria-controls="nav-panel-{{ forloop.index }}">`. The chevron icon is
  `aria-hidden="true"`.
- Panel: `id` matching `aria-controls`, and the `hidden` attribute when closed so
  it leaves the accessibility tree. Do not use only `opacity: 0`.
- Do **not** use `role="menu"`/`role="menuitem"` — this is site navigation, not an
  application menu; ARIA menu semantics break expected link behavior for screen
  reader users. A disclosure pattern (`button` + `aria-expanded` + list of links)
  is correct.
- Keyboard, desktop:
  - `Tab` reaches each top-level trigger.
  - `Enter`/`Space` on a trigger toggles its panel; focus stays on the trigger
    (open) so `Tab` then enters the panel in DOM order.
  - `Escape` closes the open panel and returns focus to its trigger.
  - `ArrowDown` on a focused trigger opens the panel and moves focus to its first
    link. `ArrowLeft`/`ArrowRight` on a trigger move between top-level triggers.
  - Focus must not be trapped in the panel — `Tab` past the last panel link moves
    to the next top-level trigger and closes the panel.
  - Hover-opened panels must also be keyboard-openable; never make hover the only
    path.
- Keyboard, mobile drawer: focus is trapped inside the open drawer (it is a modal
  overlay). `Escape` closes it and returns focus to the hamburger button. The
  drawer's close button is the first focusable element.
- Touch targets: every mobile row and every disclosure button ≥48×48, ≥8px apart.
  Desktop triggers must be ≥40px tall (they are — the nav row is 40px in the
  shipped `header-group.json`; if `row_height` is set to 40 the pill's 32px
  `::before` still leaves the full 40px row clickable, which is acceptable on a
  fine pointer but must be 48px on coarse pointers — add
  `@media (pointer: coarse) { min-height: 48px }`).
- Scrim: `aria-hidden="true"`, click closes.
- Motion: all rotation/expansion honors `prefers-reduced-motion`.
- Announce nothing on open/close — `aria-expanded` is sufficient. No live regions.

## Open questions

1. **Open delay: 250ms vs Baymard's ~0.5s.** Baymard's cited guidance is that the
   pointer should be stationary ~0.5s before a hover-dependent element displays.
   This spec uses 250ms because 500ms in a primary nav reads as broken to users
   who *are* deliberately targeting the menu, and because the 0ms sibling-swap
   rule already removes most accidental opens. This is a direct, knowing deviation
   from the cited figure — needs sign-off, or an A/B. The value should be a single
   constant in `assets/navigation.js` so it is trivially tunable.
2. **Scrim on desktop mega panel.** The scrim satisfies Baymard's "don't obscure
   content unpredictably" but no other surface in this theme dims the page on
   hover, and a scrim that appears on *hover* (not click) is unusual. Alternative:
   no scrim, and rely on the panel's full-width border-bottom to delimit it.
   Recommend reviewing live.
3. **Nav row `overflow-x-auto` conflict.** The existing block scrolls the nav
   horizontally, which is load-bearing on narrow tablets but structurally
   incompatible with anchored dropdowns. This spec switches to `overflow: visible`
   at ≥840px, which means a long menu will wrap or overflow instead of scrolling.
   If merchants have long menus this is a regression. Alternative is rendering the
   panel in a portal at the header level. Needs a decision before build.
4. **Hamburger breakpoint mismatch.** `blocks/header-hamburger.liquid` hides at
   768px but this spec's desktop nav starts at 840px, leaving a 768–839px band
   with *neither* a hamburger nor (per the shipped `header-group.json`, where the
   nav row is always present) a usable nav. Fixing `header-hamburger.liquid` to
   840px is a one-line change but that block is not in the missing-surfaces list.
   Flagging rather than silently editing.
5. **Featured collection image in the panel.** Depends on the merchant's menu
   items pointing at collections and those collections having images. When they
   don't, the last column silently vanishes and the grid reflows. Acceptable, but
   confirm that a "sometimes 3, sometimes 4 columns" panel is wanted rather than a
   fixed grid with an empty slot.

---
# Surface 4 — Predictive search

## What it is / Baymard basis

A live results panel under the existing header search input
(`blocks/header-search.liquid`), backed by Shopify's
`/search/suggest.json?q=…&resources[type]=product,collection,page,article&resources[limit]=…`
endpoint.

Baymard findings applied — autocomplete is one of their most-cited areas:

- Autocomplete's value is **not** typing speed; it is guiding users toward better
  queries, teaching domain terminology, avoiding typos, and letting users pick the
  right scope. Applied as: a query-suggestion group *and* a product group, not
  products alone.
- Product suggestions must carry enough context to disambiguate near-duplicates —
  **thumbnail, title, price**, minimum. Plain text lists fail. Applied literally.
- Empty and loading states matter as much as the happy path. Applied as: four
  fully specified non-result states.
- Baymard's product-list research notes price clarity must be scannable at the
  same glance as the item — so price sits in the row, not in a hover state.
- Mobile: desktop dropdown patterns that don't translate to touch are a documented
  failure. Applied as: **full-screen takeover below 840px**, dropdown above.

## Files & architecture

- **Modified block:** `blocks/header-search.liquid` — gains the panel container,
  ARIA combobox wiring, and a `predictive_search` enable setting.
- **New snippet:** `snippets/predictive-search-panel.liquid` — the panel shell and
  its four states' markup skeleton.
- **New snippet:** `snippets/predictive-search-product.liquid` — one product
  result row. Deliberately **not** `snippets/product-card.liquid`: a search row is
  a horizontal 2-line list item, a product card is a vertical merchandising unit.
  Reusing the card here would be wrong at every size.
- **New asset:** `assets/predictive-search.js` — fetch, debounce, abort, keyboard,
  render.
- Composed from `icon`, `input`, `button`.

## Schema settings (added to `blocks/header-search.liquid`)

| id | type | default | label |
|---|---|---|---|
| `predictive_search` | checkbox | `true` | Show suggestions as you type |
| `results_products` | range 3–8 | 5 | Max product suggestions |
| `results_other` | range 0–5 | 3 | Max collection/page suggestions |
| `show_queries` | checkbox | `true` | Show query suggestions |

## Desktop panel layout (≥840px)

- Anchored to the search form: `position: absolute; top: calc(100% + 8px); left: 0; right: 0;`
  so the panel matches the input's width exactly (which, per the shipped
  `header-group.json`, is up to 700px centered). `z-50`.
- `bg-card-light`, `border border-outline-variant`, `rounded-2xl`, `shadow-md`,
  `overflow: hidden`.
- Max height `min(70vh, 560px)`, `overflow-y: auto`, `hide-scrollbar`.
- No scrim. The panel is narrow and clearly attached; dimming the page for a
  typeahead is disproportionate.

**Internal structure, top to bottom:**

1. **Query suggestions** (when `show_queries`, and only while the query is
   non-empty). Group header omitted — these read as continuations of what the user
   is typing.
   - Row: `h-11 flex items-center gap-3 px-4 text-sm text-primary`.
   - `search` icon 18px, `text-primary/45`.
   - Matched substring in the suggestion is `font-normal`; the **completion** is
     `font-bold`. (Bolding the *un*typed portion is the pattern that teaches
     terminology; bolding the typed portion just echoes the user.)
   - Max 4 rows.
2. **Divider** `border-t border-outline-variant` when both groups present.
3. **Products** group.
   - Group header: `px-4 pt-4 pb-2`, `text-xs font-bold uppercase tracking-widest
     text-primary/60`, copy "Products".
   - Row (`snippets/predictive-search-product.liquid`):
     - `flex items-center gap-3 px-4 py-2 min-h-[64px]`.
     - **Thumbnail:** 48×48, `rounded-md`, `object-cover`,
       `bg-surface-container`, `border border-outline-variant`. Focal-point aware
       (Surface 13). `loading="lazy"`. No image → `image` glyph at
       `text-primary/45` centered on `bg-surface-container`.
     - **Middle column** (`flex-1 min-w-0 flex flex-col gap-0.5`):
       - Title: `text-sm font-medium text-primary`, clamped to 2 lines
         (`line-clamp-2`), never truncated to one line — truncation is what makes
         near-duplicate products indistinguishable, the exact failure Baymard
         flags.
       - Context line: `text-xs text-primary/70`. Contains, joined by ` · `: the
         variant/option that differentiates it (e.g. width or thickness) when
         available, and `product.type`. Omit the line entirely if both are blank
         rather than rendering an empty row.
     - **Right column** (`flex flex-col items-end gap-0.5 shrink-0 pl-2`):
       - Price: `text-sm font-bold text-primary whitespace-nowrap`. `Fra ` prefix
         when `price_varies`.
       - Compare-at (if any): `text-xs text-primary/60 line-through`.
       - Unit price (if any): rendered via `snippets/unit-price.liquid`
         (Surface 12) at its `xs` size.
       - Sold out: replace price with a `text-[11px] font-bold uppercase
         tracking-wider text-primary/60` label "Sold out".
4. **Collections & pages** group (when `results_other > 0`).
   - Group header as above, copy "Collections" / "Pages".
   - Row: `h-11 flex items-center gap-3 px-4 text-sm text-primary`, leading icon
     `storefront` (collections) or `description` (pages) at 18px `text-primary/45`.
5. **Footer action.** Sticky to the panel bottom (`sticky bottom-0`),
   `bg-card-light`, `border-t border-outline-variant`, `px-4 py-3`.
   - `button` variant `ghost`, full width, `justify-between`, label
     "See all results for "{query}"" + trailing `arrow_forward` icon 18px.
   - Submits the form (`/search?q=…`). Always present when there is ≥1 result.

**Row hover/active:** `bg-card-high` across the full row width, no radius (rows
are edge-to-edge). Keyboard-highlighted row uses the **same** `bg-card-high` plus
an inset 2px `--color-primary` left border, so mouse-hover and keyboard-cursor are
distinguishable — they are different concepts and must not share one visual.

## Mobile full-screen takeover (<840px)

Triggered by the existing `header-search-icon` block / `toggleSearchInput()`.

- Overlay: `fixed inset-0 z-50 bg-background`, no scrim (it is opaque, not a
  layer). Enters with a 200ms fade + 8px upward translate; reduced motion → fade
  only.
- **Top bar**, `h-14 px-4 flex items-center gap-2`,
  `border-b border-outline-variant`, `bg-background`, `sticky top-0`:
  - Back/close `button` variant `icon`, 48×48, `arrow_back` glyph, leftmost.
  - The search `input` — full remaining width, `h-12`, `rounded-full`,
    `bg-card-high`, `border border-outline-variant`, `pl-4 pr-10`,
    `text-base` (**16px minimum — anything smaller triggers iOS zoom-on-focus**),
    `placeholder:text-primary/60`.
  - Clear `button` variant `icon` (`close` glyph, 18px in a 44×44 box) absolutely
    positioned inside the input's right edge, shown only when the field is
    non-empty.
- **Results** fill the rest of the viewport, `overflow-y-auto`,
  `overscroll-behavior: contain`, `padding-bottom: env(safe-area-inset-bottom)`.
- Same groups and rows as desktop, with mobile sizing: thumbnail **56×56**, row
  `min-h-[72px]`, `px-4 py-3`, title `text-sm`, price `text-sm font-bold`.
  Every row is ≥48px tall by construction.
- Footer action becomes a fixed bottom bar: `sticky bottom-0`,
  `border-t border-outline-variant`, `bg-background`, `p-4`,
  `button` variant `primary`, `w-full h-12`, label "See all results".
- The input is focused on open, which raises the keyboard. Do not auto-scroll.
- Closing returns focus to the search icon that opened it.

## States

| State | Trigger | Treatment |
|---|---|---|
| **Idle / empty query** | Panel open, input empty | Panel does **not** open on desktop. On mobile the takeover is open but shows a "Popular searches" list: up to 6 merchant-configured terms as `rounded-full border border-outline-variant px-3 h-9 text-sm text-primary` chips in a `flex flex-wrap gap-2 p-4` cloud, under an `text-xs uppercase tracking-widest text-primary/60` header. If no terms are configured, show nothing (no empty box). |
| **Typing, <2 chars** | 1 character entered | No request, no panel. Prevents thrash. |
| **Loading (first query)** | ≥2 chars, request in flight, no prior results | Skeleton: 3 product rows, each a 48×48 `bg-card-high rounded-md` block + two `bg-card-high rounded` bars (70% and 40% width, 12px and 10px tall), `animate-pulse`. Panel opens immediately with the skeleton — never a blank panel. |
| **Loading (refining)** | New request while previous results are shown | Keep the previous results; overlay them at `opacity-60` and show a 2px `bg-primary` indeterminate bar across the panel's top edge. Never blank out results the user is reading. |
| **Results** | Response with ≥1 item | As specified above. |
| **No results** | Response with 0 items | Centered block, `py-10 px-6 text-center`: `search_off` icon 32px `text-primary/45`; `text-sm font-semibold text-primary` "No matches for "{query}""; `text-sm text-primary/70` "Check the spelling, or try a shorter term."; then, if `show_queries` returned anything, up to 3 query-suggestion rows under an "Did you mean" header. Finally the "See all results" footer action remains, because Shopify's full search page can match where suggest does not. |
| **Error** | Network failure / non-200 / timeout >5s | `py-8 px-6 text-center`: `error` icon 24px in `--color-important`; `text-sm text-primary` "Search is unavailable right now."; `button` variant `secondary`, label "Try again", which re-issues the request. Requires the `--color-important` prerequisite from Shared foundations. |
| **Offline** | `navigator.onLine === false` | Same as error, copy "You appear to be offline." |
| **Focus (input)** | — | Existing convention retained: the input wrapper gets `ring-1 ring-primary border-primary` (already in `blocks/header-search.liquid`'s `focus-within` styling). Do not add a second outline around the wrapper. |

**Fetch behavior (normative):** debounce 200ms; minimum 2 characters; `AbortController`
cancels the in-flight request on every new keystroke; 5s timeout; responses that
arrive out of order are discarded by comparing against the latest query string.
Cache the last 10 query→response pairs in memory for instant back-tracking when
the user deletes characters.

## Color tokens

| Part | Token |
|---|---|
| Panel background | `bg-card-light` (desktop) / `bg-background` (mobile takeover) |
| Panel border | `border-outline-variant` |
| Row hover / keyboard cursor | `bg-card-high` |
| Keyboard cursor accent | `border-l-2` in `--color-primary` |
| Group headers | `text-primary/60` |
| Title | `text-primary` |
| Context line | `text-primary/70` |
| Price | `text-primary` |
| Compare-at | `text-primary/60` |
| Thumbnail placeholder | `bg-surface-container`, glyph `text-primary/45` |
| Skeleton bars | `bg-card-high` |
| Error icon | `--color-important` |
| Loading bar | `bg-primary` |
| Chips (popular searches) | `border-outline-variant`, `text-primary` |

## Responsive summary

- **<840px:** full-screen takeover. No dropdown ever.
- **840–1199px:** dropdown, but panel width clamps to
  `min(100%, calc(100vw - 32px))`. Product rows keep desktop sizing. If
  `(pointer: coarse)`, use the mobile 56px thumbnail and 72px row height for
  target size even though the layout is a dropdown.
- **≥1200px:** full dropdown spec.
- **≥1600px:** unchanged; the panel inherits the input's `max_width` setting.

## Accessibility

This is the highest-risk surface in the document for accessibility; the combobox
pattern must be exact.

- Input: `role="combobox"` `aria-expanded="true|false"`
  `aria-controls="predictive-results-{{ block.id }}"` `aria-autocomplete="list"`
  `aria-activedescendant="<id of highlighted option>"` (removed when nothing is
  highlighted) `autocomplete="off"`.
- Results container: `id` matching `aria-controls`, `role="listbox"`,
  `aria-label="Search results"`.
- Each row: `role="option"` with a unique `id`, `aria-selected="true|false"`.
  Rows are `<a>` elements so they remain real links for AT and for
  middle-click/open-in-new-tab.
- Group headers: rendered inside `role="group"` wrappers with
  `aria-label` matching the header text; the visible header itself is
  `aria-hidden="true"` to avoid double announcement.
- **Live region:** a visually hidden `<div role="status" aria-live="polite"
  aria-atomic="true">` outside the listbox, updated on every settled response with
  e.g. "5 products found", "No results found", "Search unavailable". Debounce the
  announcement to 500ms so rapid typing does not spam AT.
- Keyboard:
  - `ArrowDown` / `ArrowUp` move the highlight through **all** rows across groups
    (wrapping from last to first). Highlight changes update
    `aria-activedescendant`; focus never leaves the input.
  - `Enter` navigates to the highlighted row, or submits the form if nothing is
    highlighted.
  - `Escape` — first press clears the highlight and closes the panel; second press
    clears the input.
  - `Tab` closes the panel and moves on normally.
  - `Home`/`End` jump to first/last row.
- Mobile takeover is a modal: focus is trapped, background content gets
  `aria-hidden="true"` (or `inert`), body scroll is locked, `Escape` closes,
  focus returns to the opener.
- Thumbnails: `alt=""` (`aria-hidden`) — the row's link text already names the
  product; a duplicated alt makes every result announce twice.
- Touch: every row ≥48px tall; clear button 44×44 minimum inside the field;
  close button 48×48.
- Reduced motion: skeleton pulse and panel fade both suppressed.
- The panel must remain usable at 200% zoom and at 320px viewport width.

## Open questions

1. **Query suggestions require an endpoint Shopify does not provide.** Shopify's
   `/search/suggest.json` returns products, collections, pages, articles — and
   `queries` only on stores where Search & Discovery supplies them. Baymard's
   "teach better queries" finding leans hard on query suggestions, but the data
   may simply not exist. Options: (a) ship `show_queries` defaulting to `true` and
   let the group silently collapse when empty (spec'd behavior); (b) drop query
   suggestions and lean entirely on product results. Needs confirmation of what
   the target stores return.
2. **"Popular searches" has no data source.** The mobile idle state calls for
   merchant-configured terms, which needs a new block setting (a comma-separated
   text field, or 6 individual text settings). Not added to the schema above
   because it may be judged scope creep. If it is not added, the mobile idle state
   is simply empty.
3. **Unit price in a search row.** Surface 12 wants unit price everywhere prices
   appear, and Baymard's price-clarity research supports it. In a 48px-tall
   dropdown row, a third price line is genuinely cramped. This spec includes it;
   consider suppressing it in the desktop dropdown and keeping it in the mobile
   takeover where there is vertical room.
4. **The existing search block already has an unrelated behavior.** `sections/header-2.liquid`
   wires `#search-input` to a `window.filterProducts()` collection filter and
   preventDefaults the submit when a `#product-grid` exists. Predictive search must
   not fight that. Recommend the new `assets/predictive-search.js` bail out
   entirely when `document.getElementById('product-grid')` is present, and flag
   that dual-purpose input as technical debt outside this brief.
5. **Two search entry points exist** (`header-search` inline bar and
   `header-search-icon` toggle). The mobile takeover is specified as the icon's
   behavior, but the shipped `header-group.json` hides the inline bar on mobile and
   does **not** include the icon block — so today mobile has no search at all.
   Confirm the icon block gets added to the header preset as part of this work.

---

# Surface 5 — Accelerated checkout buttons

## What it is / Baymard basis

Shopify's dynamic checkout buttons (Shop Pay, PayPal, Google Pay — whichever the
merchant has enabled), rendered natively via the `payment_button` filter on a
Liquid `form` object: `{{ form | payment_button }}`. They appear as an alternative
to "Add to cart" on the product page and as an alternative to the cart's
"Checkout" button on the cart page. Their colors, logos and internal layout are
fixed by Shopify and must not be restyled — same constraint as Surface 2's Follow
on Shop button. The design problem is exclusively placement, spacing and the
divider treatment that separates "add to cart, keep shopping" from "buy this
right now."

Baymard basis: accelerated/one-click checkout options are one of the most
effective mitigations Baymard documents for guest-checkout and account-friction
abandonment (the same research cited in Surface 1) — a shopper who does not want
to create an account or fill a full address form can pay through a stored wallet
instead. Baymard's mobile-commerce research also supports keeping the primary
purchase action persistent and reachable; that is why this spec explicitly
excludes dynamic checkout buttons from the mobile sticky bar (see States) rather
than crowding the one persistent action mobile users rely on.

## Files & architecture

- **Modified block:** `blocks/product-buy-buttons.liquid`.
- **Modified section:** `sections/cart.liquid`.
- **Structural prerequisite (product page):** `payment_button` only exists on a
  `form` object produced by Liquid's `{% form %}` tag. `blocks/product-buy-buttons.liquid`
  currently renders a bare `<div>` with a JS-driven `fetch('/cart/add.js', …)` call
  and **no** `{% form %}` tag at all — confirmed by reading the file; the theme's
  only existing `{{ form | payment_button }}` reference lives in the unused
  skeleton default `sections/product.liquid`, which the shipped `templates/product.json`
  does not reference. To render a dynamic checkout button that reflects the
  currently selected variant and quantity, the block's markup must be wrapped in
  `{% form 'product', product, id: 'product-form-buy-buttons' %} … {% endform %}`,
  with the existing `id`/quantity inputs staying inside it. The existing
  `fetch`-based add-to-cart script keeps working unchanged (it still
  `preventDefault()`s and posts via `fetch`); the form wrapper's only job is to
  give Liquid a `form` object to call `.payment_button` on. This is a structural
  change, not a visual one — flagged here because it is a precondition for this
  surface, not an implementation detail to invent later.
- **Structural prerequisite (cart page):** `sections/cart.liquid` uses a raw
  `<form action="{{ routes.cart_url }}" method="post">`, not the `{% form %}` tag.
  Same fix: convert to `{% form 'cart', cart %} … {% endform %}` so `form.payment_button`
  is available. The `{% form %}` tag still emits a standard `<form action="/cart" method="post">`
  with the correct hidden fields, so existing update/checkout behavior is
  unaffected.
- No new snippet — the divider is small enough to inline in both call sites; if a
  third call site is ever added, extract `snippets/checkout-divider.liquid`.

## Schema settings

Added to `blocks/product-buy-buttons.liquid`:

| id | type | default | label |
|---|---|---|---|
| `show_dynamic_checkout` | checkbox | `true` | Show accelerated checkout buttons (Shop Pay / PayPal / etc.) below Add to cart |

Added to `sections/cart.liquid`:

| id | type | default | label |
|---|---|---|---|
| `show_dynamic_checkout` | checkbox | `true` | Show accelerated checkout buttons below Checkout |

## Layout & sizing

**Product page** (inside the existing `flex flex-col gap-4` wrapper in
`blocks/product-buy-buttons.liquid`, directly below the quantity stepper + "Add
to cart" button, above the sticky-info paragraph):

```
[ quantity stepper ]
[ Add to cart — h-14, rounded-full, bg-accent ]
[ ── or ──  ]                    ← divider, only if show_dynamic_checkout
[ dynamic checkout buttons ]     ← {{ form | payment_button }}, Shopify-rendered
[ sticky-info paragraph ]
[ payment badges row ]
```

- Divider row: `flex items-center gap-3 my-1 w-full`, each side a
  `flex-1 border-t border-outline-variant`, center label
  `text-xs font-bold uppercase tracking-widest text-primary/50 shrink-0`, copy
  "or" (`t:checkout.or_divider`).
- Dynamic checkout container: `<div class="dynamic-checkout-wrapper w-full">{{ form | payment_button }}</div>`.
  No fill, no border, no padding — Shopify's buttons already carry their own
  vertical rhythm between multiple wallet options when more than one is enabled.
  Width is 100% of the button column (matches "Add to cart" exactly).
- Gap from "Add to cart" to the divider: 12px (`gap-4` inherited from the parent
  `flex flex-col gap-4` — do not tighten it, 12px is the existing rhythm for this
  column).

**Cart page** (below the existing `<button type="submit" name="checkout">`):

```
[ Checkout — w-full md:w-96, rounded-full, bg-accent ]
[ ── or ──  ]                    ← divider, only if show_dynamic_checkout
[ dynamic checkout buttons ]     ← {{ form | payment_button }}
```

- Same divider treatment, `mt-3` below the Checkout button, `w-full md:w-96` to
  match the Checkout button's own width constraint rather than stretching full
  page width on desktop.

## Color tokens

| Part | Token |
|---|---|
| Divider line | `border-outline-variant` |
| Divider label | `text-primary/50` |
| Dynamic checkout buttons | **Shopify-controlled — do not style.** No token applies (same rule as Surface 2). |

## States

| State | Treatment |
|---|---|
| Enabled, payment methods configured | Divider + buttons render as specified |
| `show_dynamic_checkout` off | Divider and container both omitted entirely — no empty gap |
| No payment methods return a button (Shopify renders nothing) | `.dynamic-checkout-wrapper:empty { display: none; }` and hide the divider alongside it with a `:has()` guard (`.dynamic-checkout-wrapper:empty + .checkout-divider, .checkout-divider:has(+ .dynamic-checkout-wrapper:empty)`) so an "or" divider never floats above nothing. If `:has()` support is a concern, the safe fallback is a tiny inline script toggling a `hidden` class based on `wrapper.children.length === 0` on `DOMContentLoaded`. |
| Variant unavailable / out of stock | Both "Add to cart" and the dynamic checkout buttons are disabled together — Shopify's button already respects `form` validity, but confirm `product-buy-buttons.liquid`'s existing disabled-state script (used for the sticky bar) does not need to separately touch the dynamic checkout container; it manages itself. |
| Loading / redirecting to checkout | Native — Shopify's button shows its own in-button spinner. The theme adds nothing. |
| Focus-visible | Shopify's own focus treatment inside its buttons; the divider has no focusable elements. |

**Mobile sticky bar exclusion (deliberate):** `#mobile-sticky-buy-bar` in
`blocks/product-buy-buttons.liquid` shows **"Add to cart" only**, never the
divider or dynamic checkout buttons. A fixed bottom bar has room for one primary
action; stacking two-to-four wallet buttons underneath it on a 375px-wide screen
would either wrap unpredictably or push the bar's height past what Baymard's
persistent-CTA guidance intends to protect. The full set (divider + dynamic
checkout) is only ever reachable in the static (non-sticky) button block, which
mobile users reach by scrolling to it.

## Responsive

- **Mobile (<840px):** static block as specified; sticky bar shows Add to cart
  only (see above).
- **Tablet/Desktop (≥840px):** unchanged; the button column's max width is
  whatever the parent grid column gives it (per `templates/product.json`, that
  column is roughly a third of the page width at desktop) — the dynamic checkout
  buttons stretch to fill it, matching "Add to cart."
- Cart page: divider + buttons sit under the `w-full md:w-96` checkout button at
  all widths; no separate mobile treatment needed since it is a single stacked
  column already.

## Accessibility

- The divider's "or" text stays in the accessibility tree (not `aria-hidden`) —
  it is meaningful: it tells assistive-technology users that what follows is an
  alternative path, not a continuation of the same action. Use a plain `<span>`,
  not a `role="separator"` (that role expects no text content).
- Do not add `aria-label` to `.dynamic-checkout-wrapper` or its children —
  Shopify's rendered buttons already carry their own accessible names.
- Maintain ≥8px vertical clearance between "Add to cart" / "Checkout" and the
  divider, and between the divider and the dynamic checkout buttons, so touch
  targets don't crowd (this falls out of the 12px gap specified above).
- Focus order: Add to cart / Checkout → dynamic checkout button(s), in that DOM
  order — never reorder them visually only, since that would desync tab order
  from reading order.

## Open questions

1. **The `{% form %}` wrapper requirement is a real code change, not styling.**
   Both prerequisites above (product page and cart page) touch files' Liquid
   structure, not just their markup inside an existing tag. Confirm this is
   understood as in-scope for whoever implements this surface — it cannot be
   done as a pure CSS/spacing change.
2. **Quick-add buttons are explicitly out of scope.** `snippets/product-card.liquid`
   and `blocks/product-cross-sell.liquid` each have their own "Køb" button with no
   `{% form %}` wrapper and no dynamic checkout. The brief scopes this surface to
   the product page and cart page only; extending accelerated checkout to
   quick-add surfaces is a separate decision.
3. **The header cart drawer (`#cart-drawer` in `sections/header-2.liquid`) is a
   third checkout entry point** (`<a href="/checkout">Gå til betaling</a>`,
   hardcoded, not Liquid-rendered) that is not part of the missing-surfaces list
   and is not touched here. Flagging that it will read as inconsistent once the
   cart page gains dynamic checkout buttons and the drawer still shows only a
   single static link.

---

# Surface 6 — Cart discount display

## What it is / Baymard basis

`sections/cart.liquid` currently has **no discount rendering of any kind** —
no line-item discount treatment, no cart-level discount row, and no cart summary
panel at all (it goes straight from the items table to the checkout button).
This surface adds both:

1. **Line-item discounts** — reflected in each row via Shopify's
   `item.line_level_discount_allocations`, showing the pre-discount price struck
   through next to the discounted price, plus a small tag naming the discount.
2. **Order-level (cart-level) discounts** — reflected via
   `cart.cart_level_discount_applications` in a new **cart summary panel**
   (subtotal → discount line(s) → total), which this spec also has to introduce
   since nowhere currently hosts an order-level number.

Baymard basis: Baymard's cart and checkout research consistently finds that
shoppers distrust a total they cannot verify — a lower price with no visible
explanation of *why* it is lower reads as a possible error rather than a benefit,
and increases "is this the wrong price" hesitation right before the highest-
intent step in the funnel. The mitigation is showing the *original* price, the
*discounted* price, and the *name/code* of what caused the difference, all in the
same glance — not just a smaller number. This is the same "scannable at a glance"
principle the brief cites for unit pricing (Surface 12), applied to discounts.
Per the document's sourcing note, this is drawn from Baymard's public
cart/checkout-transparency findings rather than the paywalled guideline text.

## Files & architecture

- **Modified section:** `sections/cart.liquid`.
- **New snippet:** `snippets/cart-discount-chip.liquid` — renders one discount
  tag (`icon` + title), used at both line-item and order level so the two scopes
  visually rhyme without being identical (order-level gets a row, line-item gets
  an inline chip — see Layout).
- Composed from `icon` (new ligature `sell` — not in the vocabulary list in
  Shared foundations; add it there when this surface lands, same as any surface
  that needs a glyph the list doesn't yet cover).
- **New cart summary panel** — introduced in `sections/cart.liquid` between the
  items list and the checkout button. This is the minimum viable host for
  order-level discounts (there is currently nowhere to put a total-minus-discount
  number); flagged as scope this surface must add rather than something
  pre-existing it merely restyles.

## Layout & sizing

**Line-item discount** (inside each item's existing info column, directly below
the title/variant lines and above the quantity controls — the same column that
already renders the metervare price breakdown):

```
[ Product title ]
[ Variant / metervare specs, if any — existing content ]
{%- if item has line-level discounts -%}
  [ ⌢ original price ]  [ discounted price ]
  [ 🏷 CHIP: discount title ]  [ 🏷 CHIP: discount title 2 ]
{%- endif -%}
[ Remove link ]
```

- Price row: `flex items-baseline gap-2`.
  - Original: `{{ item.original_line_price | money }}`, `text-sm text-primary/50 line-through`.
  - Discounted: `{{ item.final_line_price | money }}`, `text-sm sm:text-base font-bold text-primary`.
- Chip row: `flex flex-wrap gap-1.5 mt-1`. One chip per entry in
  `item.line_level_discount_allocations`, via
  `snippets/cart-discount-chip.liquid`:
  `<span class="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-outline-variant bg-card-high text-[11px] font-bold uppercase tracking-wide text-primary">` +
  `{% render 'icon', name: 'sell', class: 'text-[12px]', label: '' %}` (decorative,
  `aria-hidden`) + `{{ allocation.discount_application.title }}` + `</span>`.
  Truncate the title at 24 characters with `truncate max-w-[160px]` if a merchant
  names a discount something unreasonably long; the full title is always
  available in the cart summary panel below.
- If an item has **no** discount, none of this renders — the existing
  single-price line is unchanged. Never show an empty chip row.

**Cart summary panel** (new — sits between `</table>` and the checkout button,
or between the items list and checkout button if the table is later replaced by
a different row treatment; this panel's contract does not depend on that
choice):

- Container: `w-full md:w-96 md:ml-auto mt-6 p-4 rounded-2xl bg-card-high flex flex-col gap-2`
  (right-aligned to match the existing checkout button's `md:w-96` column so the
  numbers sit directly above the action that uses them).
- Row shape, all rows: `flex items-center justify-between gap-4 text-sm`.
  1. **Subtotal:** label `text-primary/70` "Subtotal", value
     `{{ cart.original_total_price | money }}`, `text-primary`.
  2. **One row per `cart.cart_level_discount_applications` entry** (only if any
     exist): label = `t:cart.discount` ("Discount") + a
     `snippets/cart-discount-chip.liquid` chip carrying the discount's title
     inline after the label (`flex items-center gap-2`); value =
     `-{{ discount_application.total_allocated_amount | money }}`,
     `text-primary font-semibold` — **not** a separate color. The theme has no
     "success"/discount green token (Shared foundations Caveat 3); do not invent
     one here. The chip + minus sign carry the meaning, not color.
  3. **Divider:** `border-t border-outline-variant my-1`.
  4. **Total:** label `text-primary font-bold` "Total", value
     `{{ cart.total_price | money }}`, `text-lg font-bold text-primary`.
  5. **Shipping/tax note:** `text-xs text-primary/60`, copy "Shipping and taxes
     calculated at checkout" (`t:cart.shipping_note`) — mirrors the existing
     drawer copy ("Fragt beregnes ved kassen…") so the two surfaces agree.
- If **no** cart-level discount exists, the panel still renders (subtotal →
  total, no discount row, no empty gap) — it is now the cart's only total
  display, not an optional add-on.

## Color tokens

| Part | Token |
|---|---|
| Original (struck-through) price | `text-primary/50` |
| Discounted / final price | `text-primary` |
| Discount chip background | `bg-card-high` |
| Discount chip border | `border-outline-variant` |
| Discount chip text/icon | `text-primary` |
| Summary panel background | `bg-card-high` |
| Summary row labels | `text-primary/70` |
| Summary row values | `text-primary` |
| Discount amount | `text-primary` (no special color — see rationale above) |
| Total | `text-primary` (bold, larger scale, not a new color) |
| Divider | `border-outline-variant` |

## States

| State | Treatment |
|---|---|
| No discounts anywhere | No chips, no discount row in summary; subtotal = total |
| Line-item discount only | Chip(s) under that item; summary panel shows subtotal → total with the reduction baked into `cart.total_price` but **no separate cart-level row**, since Shopify only exposes cart-level rows for `cart_level_discount_applications`, not for line-item ones. This is expected — do not try to sum line-item discounts into a duplicate summary row. |
| Cart-level discount (code or automatic) | Discount row appears in the summary panel with chip + amount |
| Both line-item and cart-level discounts present | Both render independently — no attempt to reconcile them into one number, since Shopify already reflects both in `cart.total_price` |
| Discount removed (code expires mid-session, or item removed) | Standard cart-update page reload; no special transition beyond whatever the existing update flow does |
| Quantity updated on a discounted line | Both prices recalculate on submit (full page reload, matching the rest of this skeleton cart's update model — no AJAX promise made here since none exists today) |
| Free shipping / percentage / fixed-amount discount | All render identically via the same chip + line pattern; the *type* of discount is not distinguished visually, only its title (which merchants typically name descriptively, e.g. "10% off" or "Free shipping") |

## Responsive

- **Mobile (<840px):** summary panel is `w-full` (the `md:w-96` only applies at
  `md`), stacked below the items list, `mt-6`. Chips wrap onto multiple lines
  (`flex-wrap`) rather than truncating harder — a 320px-wide phone can still fit
  one chip per line comfortably at `text-[11px]`.
- **Tablet/Desktop (≥840px):** summary panel narrows to `w-96` and right-aligns,
  matching the checkout button's column exactly so the numbers and the action
  that commits to them share one visual column.

## Accessibility

- Struck-through original price: wrap in `<span class="line-through"><span class="sr-only">{{ 'cart.original_price_label' | t }}</span>{{ item.original_line_price | money }}</span>` — `line-through` is a purely visual cue; a screen reader that ignores CSS text-decoration will otherwise read two prices back-to-back with no indication which is which.
- Discount chip icon (`sell`) is decorative: `aria-hidden="true"` via the `icon`
  primitive's `label: ''`/omitted-label behavior.
- Summary panel: use a `<dl>` (description list) for the row structure —
  `<dt>` label, `<dd>` value — rather than plain `<div>`s, since this is
  genuinely a list of labeled totals; screen readers can navigate a `<dl>`'s
  entries as a group, which plain divs don't offer.
- The total row's visual bold/`text-lg` treatment should correspond to real
  semantic weight — wrap it in `<strong>` inside the `<dd>`, not just a class.
- Touch targets: this surface adds no new interactive controls (no remove/edit
  affordances here — those already exist on each row); nothing new to size.
- Color is never the only signal for "this is a discount" — the chip's icon +
  text label carries the meaning, satisfying WCAG 1.4.1 (use of color) without
  needing a dedicated discount color.

## Open questions

1. **Introducing a cart summary panel is new scope, not a restyle.**
   `sections/cart.liquid` has no subtotal/total display today at all — the brief
   frames this surface as "discount display," but order-level discounts have
   nowhere to live without one. Flagging this explicitly: implementing Surface 6
   necessarily means adding the summary panel described above, not just
   dropping a discount row into an existing structure.
2. **Discount **code entry** is out of scope by the brief's own framing** ("how an
   applied discount line reads," not how one gets applied). This spec assumes
   discounts arrive via a `/discount/CODE` link, an automatic discount, or the
   checkout step — not a code-entry field on the cart page itself. If merchants
   need an on-cart "Enter code" input, that is a different, unscoped surface;
   note it here so it isn't silently assumed to be covered.
3. **The header cart drawer (`#cart-items`, `#cart-subtotal` in
   `sections/header-2.liquid`) is populated by JavaScript from `/cart.js` and has
   its own, separate subtotal display with no discount awareness.** Bringing it
   to parity with this spec means writing equivalent discount-rendering JS
   against the same JSON cart object, which is outside `sections/cart.liquid`
   and outside this brief's file list. Flagged as a follow-up so the two cart
   surfaces don't silently diverge once this ships.
4. **No accent/success color for "you saved money."** Per Shared foundations,
   `--color-accent` is reserved for primary CTA fills and there is no discount-
   green token. This spec deliberately keeps discount amounts in `text-primary`.
   If stakeholders want discounts to visually "pop" more than a same-color
   number allows, that requires either introducing a new token (out of scope
   for a design pass that must "stay inside this system") or accepting the
   chip-plus-minus-sign treatment as sufficient. Needs a call.

---

# Surface 7 — Newsletter signup form (footer)

## What it is / Baymard basis

A single-field (email) signup form in the footer, using Shopify's native
`{% form 'customer' %}` with `contact[tags]` set to `newsletter` (the standard
Shopify pattern for opting a customer into marketing without creating a full
account). Sits in `sections/footer.liquid`, positioned as its own zone within
the existing two-menu-column layout.

Baymard basis, directly from the brief: newsletter signup should never read as
an interruption or demand excessive input. Applied as: exactly one field
(email), a **visible label** (never placeholder-as-label — the `input` primitive
already enforces this per Shared foundations), and clear, non-ambiguous
success/error feedback in place, not via a browser `alert()` or a silent
redirect. Baymard's broader form-friction research (the same family of findings
behind the `input` primitive's visible-label requirement) also argues against
a second "confirm your email" field or a marketing-consent checkbox stacked on
top of the one field being asked for — friction scales with every extra
decision, even a small one.

## Files & architecture

- **Modified section:** `sections/footer.liquid` — new zone inserted between the
  two-menu grid and the existing trust-badge/Follow-on-Shop row.
- **New snippet:** `snippets/newsletter-form.liquid` — the form markup and its
  three states (default, success, error). Kept separate so the same form can
  later be reused in a different section (e.g. a dedicated newsletter section)
  without duplicating markup.
- Composed from `input`, `button`, `icon` (`mail`, `check_circle`, `error`).

## Schema settings

Added to `sections/footer.liquid`:

| id | type | default | label |
|---|---|---|---|
| `show_newsletter` | checkbox | `true` | Show newsletter signup |
| `newsletter_heading` | text | `t:newsletter.heading` | Heading |
| `newsletter_description` | text | `t:newsletter.description` | Supporting line (optional) |

## Layout & sizing

Inserted as its own block between the menu grid (`grid grid-cols-2 gap-8`) and
the trust row (`pt-8 border-t …`), as a **full-width row above that border**,
so it reads as its own zone rather than a third menu column:

```
[ Heading — h4, sans, text-base font-bold text-primary ]
[ Description — text-sm text-primary/70, optional, max-w-sm ]
[ Email input ]  [ Subscribe button ]     ← desktop: side by side
[ feedback region — appears only after submit ]
```

- Wrapper: `flex flex-col gap-3 pt-10 border-t border-outline-variant` (the
  existing border rhythm the footer already uses between zones).
- Heading + description: `max-w-sm`, matching the footer's own brand-description
  block above it for visual consistency (`space-y-1`).
- **Desktop/tablet (≥600px, `sm`):** input and button sit in one row —
  `flex gap-2 max-w-md`. Input `flex-1`, button `shrink-0`.
  - `{% render 'input', id: 'newsletter-email', name: 'contact[email]', type: 'email', label: t:newsletter.email_label, placeholder: '', required: true, autocomplete: 'email' %}` —
    the `input` primitive's visible label sits **visually hidden but present**
    here (`sr-only`) since the heading above already reads as the label in
    context; screen reader users still get a real `<label>` via the primitive,
    satisfying the "never placeholder-as-label" rule without visually
    duplicating "your email" as both a heading and a field label. Input height
    `h-12` to match the button.
  - `{% render 'button', label: t:newsletter.submit, variant: 'primary', as: 'button', attributes: 'type="submit"', class: 'h-12 px-6 shrink-0' %}`.
- **Mobile (<600px):** input and button stack — `flex flex-col gap-2 w-full`,
  both full width, button `h-12`.
- Gap from description to form: 12px. Gap from form to feedback region: 8px.

## Color tokens

| Part | Token |
|---|---|
| Heading | `text-primary` |
| Description | `text-primary/70` |
| Input | Per `input` primitive — `bg-card-light`/`bg-background` border `border-outline-variant`, focus ring `--color-primary` |
| Submit button | `bg-accent` / `text-on-accent` (primary CTA — this is the one place in the footer allowed to use accent, since it is a genuine submit action, not decoration) |
| Success feedback | `text-primary` + `check_circle` icon (no green token — Caveat 3) |
| Error feedback | `text-important` (requires the Shared-foundations `--color-important` prerequisite) + `error` icon |

## States

| State | Treatment |
|---|---|
| Default | Empty input, placeholder blank (label carries meaning), button enabled |
| Focus (input) | Existing input-focus convention: ring + border in `--color-primary` |
| Hover (button) | `hover:brightness-95` |
| Active (button) | `active:scale-95` |
| Submitting | Button label swaps to a `t:newsletter.submitting` string ("Signing up…"), button `disabled`, `opacity-70`, input `disabled`. No spinner icon needed at this scale — the label change is sufficient and avoids an extra glyph in a 48px-tall control. |
| Success | Form (input + button) is replaced in place by a single row: `check_circle` icon `text-primary` 20px + `text-sm font-medium text-primary` "You're subscribed — thanks!" (`t:newsletter.success`). The form does not reappear on the same page load; a page reload (e.g. navigating away and back) resets it. This is a `role="status"` region — see Accessibility. |
| Error — invalid email | Input gets `border-important` (2px) and a helper line below it: `text-xs text-important` "Enter a valid email address" (`t:newsletter.error_invalid`). Rendered client-side before submit via the input's `type="email"` validity, so this never round-trips to the server. |
| Error — already subscribed / server error | Form stays visible; a `role="alert"` line appears above the form (not replacing it, since the user may want to retry with a different address): `error` icon `text-important` 16px + `text-sm text-important` message from Shopify's response, or a generic fallback `t:newsletter.error_generic` ("Something went wrong — try again."). |
| `show_newsletter` off | Entire zone omitted, including its top border, so the footer doesn't show an orphaned rule |

## Responsive

- **Mobile (<600px):** stacked input/button, full width, as specified.
- **≥600px (`sm`) and up:** side-by-side row, `max-w-md` so the form doesn't
  stretch to the full footer column width and become visually disconnected from
  its heading.
- No behavioral difference beyond layout — same states at every width.

## Accessibility

- The `input` primitive's real `<label>` (visually `sr-only` here) reads "Email
  address" (`t:newsletter.email_label`) — never "Enter your email" as a
  placeholder-only cue.
- Success and error feedback both live in a single
  `<div role="status" aria-live="polite" aria-atomic="true">` wrapper so
  assistive technology announces the outcome without needing focus to move
  there. Error-on-submit (server-side) uses the same region; client-side
  invalid-email feedback is tied to the input via `aria-describedby` pointing at
  the helper text's `id`, plus `aria-invalid="true"` on the input while the error
  is showing.
- Submit button: `type="submit"`, real `<button>` — not a `<div>` with a click
  handler.
- Touch targets: input and button both `h-12` (48px) at every width; ≥8px
  clearance between them in the stacked mobile layout (`gap-2` = 8px, the floor).
- Focus order: heading (not focusable) → input → button → (if success) the
  success message is not focused automatically — moving focus away from where
  the user's attention already is would be disorienting for a form this small;
  `aria-live="polite"` is sufficient.
- Motion: none beyond the state swap; no animation to gate behind
  `prefers-reduced-motion`.

## Open questions

1. **Double opt-in.** If the merchant's email platform (via Shopify's native
   `accepts_marketing` flow or an app) requires double opt-in, the "success"
   state above overpromises ("you're subscribed") when really a confirmation
   email is pending. Copy should probably read "Check your inbox to confirm" in
   that case — this is a data question (does the connected marketing platform
   require confirmation?) that determines which copy ships, not a visual one.
2. **Consent checkbox.** Some jurisdictions expect an explicit marketing-consent
   checkbox rather than implied consent from submitting an email. This spec
   intentionally omits one to keep friction at "one field," per the Baymard
   guidance cited above — but that is a legal/compliance call, not a UX-only
   one, and should be confirmed before build.

---

# Surface 8 — Pickup availability (product page)

## What it is / Baymard basis

A product-page element showing whether the selected variant is available for
local pickup, backed by Shopify's native
`variant.store_availabilities` (populated when the merchant has local pickup
enabled on at least one location). Two states: a compact **default** row
("Available for pickup at {location}" / "Pickup unavailable") and an **expanded**
panel showing the location's address and hours when the shopper opts to see them.

Baymard basis: product-page fulfillment information (in-stock, ship time, pickup
availability) needs to be visible near the point of purchase decision, not
implied or buried in a shipping policy link — shoppers factor pickup availability
into the buy decision at the same moment they're evaluating price, and vague
"in stock" language without a location attached increases doubt rather than
resolving it. The expandable address/hours detail follows the same logic Baymard
applies elsewhere in this brief (predictive search, mega-menu): give enough
context to remove doubt without forcing a page navigation away from the product.
Per this document's sourcing note, this is drawn from Baymard's public
fulfillment/availability findings rather than the paywalled guideline text.

## Files & architecture

- **New block:** `blocks/product-pickup-availability.liquid` — added to
  `templates/product.json`'s buy-box section (alongside `product-price`,
  `product-buy-buttons`), so merchants place it themselves like every other
  product-page element.
- **New snippet:** `snippets/pickup-panel.liquid` — the expanded
  address/hours contents, rendered inside a disclosure.
- Composed from `icon` (`storefront`, `check_circle`, `error`, `location_on`,
  `schedule`, `expand_more`).

## Schema settings

| id | type | default | label |
|---|---|---|---|
| `show_hours` | checkbox | `true` | Show store hours in the expanded panel |
| `unavailable_text` | text | `t:pickup.unavailable_default` | Text shown when no location has stock |

No location-picker setting — the block always reflects the variant's real
`store_availabilities`; a merchant with multiple pickup locations sees all of
them listed (see Layout), not a single hardcoded one.

## Layout & sizing

**Default (compact) row**, placed directly below the buy-buttons block in
`templates/product.json`'s ordering, `mt-3`:

```
[ 🏬  Available for pickup at Butik København  ⌄ ]     ← available, collapsed
[ 🏬  Pickup unavailable for this item ]                ← unavailable, no chevron
```

- Row: `flex items-center gap-2 h-12 px-3 rounded-2xl border border-outline-variant bg-card-light w-full`,
  acting as the disclosure trigger when available.
- `storefront` icon 20px, `text-primary/70`.
- Label: `text-sm font-medium text-primary flex-1 truncate` — "Available for
  pickup at {{ location.name }}" when exactly one location has stock;
  "Available for pickup at {{ locations.size }} locations" when more than one.
- Trailing `expand_more` icon 20px `text-primary/60`, rotating 180° on open —
  **present only when available** (nothing to expand into when unavailable).
- Unavailable row: same shell, `error` icon in place of `storefront`,
  `text-primary/60` (unavailable is informational, not an error condition — it
  does not use `--color-important`; the item is still purchasable for shipping,
  this is not a failure state).

**Expanded panel** (`snippets/pickup-panel.liquid`, appears below the row,
pushes content down — not an overlay, since it's inline product-page content,
not a floating menu):

- `mt-2 rounded-2xl border border-outline-variant bg-card-light divide-y divide-outline-variant`.
- One row per location in `variant.store_availabilities` where `.available`:
  `flex items-start gap-3 p-4`.
  - `check_circle` icon 18px `text-primary/70`, `mt-0.5`.
  - Content column, `flex-1 flex flex-col gap-1`:
    - Location name, `text-sm font-bold text-primary`.
    - Address, `text-sm text-primary/70`: `{{ location.address }}` — Shopify's
      address object formatted as a single line via
      `location.address | format_address` or manual concatenation matching the
      theme's existing address-formatting convention if one exists.
    - Pick-up-ready copy, `text-xs text-primary/60`:
      `{{ availability.pick_up_time }}` (Shopify's native human-readable string,
      e.g. "Usually ready in 24 hours").
    - Hours (if `show_hours` and location hours are available via a metafield —
      Shopify's core `location` object does not natively expose store hours, see
      Open questions): `flex items-center gap-1.5 mt-1`, `schedule` icon 14px
      `text-primary/45`, `text-xs text-primary/60`.
  - `call`/`location_on` are available as icons if a phone number or "Get
    directions" link is added per-location later; not required for the default
    spec.

## Color tokens

| Part | Token |
|---|---|
| Row background | `bg-card-light` |
| Row border | `border-outline-variant` |
| Available icon/label | `text-primary/70` / `text-primary` |
| Unavailable icon/label | `text-primary/60` (informational, not `--color-important`) |
| Panel background | `bg-card-light` |
| Panel dividers | `divide-outline-variant` |
| Location name | `text-primary` |
| Address / hours | `text-primary/70` / `text-primary/60` |

## States

| State | Treatment |
|---|---|
| Available, collapsed (default) | As specified — compact row, chevron down |
| Available, expanded | Panel visible, chevron rotated 180°, row gets `bg-card-high` to show it's "open" |
| Unavailable | Compact row only, no chevron, no panel, `unavailable_text` setting used as the label if set |
| Multiple locations, all available | Row summarizes count; panel lists every available location |
| Multiple locations, only some available | Row uses the singular/available-count copy for whichever have stock; unavailable locations are omitted from the panel entirely rather than shown crossed out — a location with no stock is not useful information to a shopper deciding where to pick up |
| Variant changes (via variant picker) | Row and panel content update to the newly selected variant's `store_availabilities` without a full page reload, mirroring the existing `variant-changed` custom event already dispatched by `product-buy-buttons.liquid`'s script — this block listens for that same event |
| Local pickup not enabled anywhere on the shop | Block renders nothing (`{% if variant.store_availabilities.size == 0 %}` guard) — never show a "pickup unavailable" row on a shop that has no pickup locations at all; that would misrepresent pickup as a withdrawn feature rather than a nonexistent one |
| Loading (variant switch, if data requires a `?section_id=` fetch rather than being fully inlined) | Row shows its previous state at `opacity-60` for the duration; no skeleton — this is a small, low-stakes update |

## Responsive

- **Mobile (<840px):** row and panel both full width, same treatment as
  described — this element has no meaningful desktop-only complexity, so there
  is no breakpoint-specific layout change beyond width.
- **Tablet/Desktop (≥840px):** same layout; width is whatever the buy-box column
  gives it (per `templates/product.json`, roughly a third of page width).

## Accessibility

- Row (when available) is a `<button type="button" aria-expanded="false" aria-controls="pickup-panel-{{ block.id }}">`
  wrapping the icon + label + chevron; the chevron icon is `aria-hidden="true"`.
- Row (when unavailable) is a plain `<div>` — not a button, since there is
  nothing to toggle; do not make an inert element focusable.
- Panel: `id` matching `aria-controls`, `hidden` attribute when collapsed.
- Keyboard: `Enter`/`Space` toggles, matching every other disclosure pattern in
  this document (nav dropdowns, account panel).
- Touch target: the full row is the target, `h-12` (48px) minimum, full width —
  comfortably exceeds the 48×48 floor.
- Screen reader summary: when multiple locations are available, the row's
  accessible name includes the count explicitly ("Available for pickup at 3
  locations") rather than relying on a visual "3" the label text already
  contains — it does, so no extra work needed, just confirm the string is not
  split across elements in a way that breaks its being read as one sentence.
- Variant-change updates: since content updates without a page reload, wrap the
  row's label in the same live-region pattern used for predictive search results
  if the update needs to be announced — but because this sits in normal reading
  order right after the buy box (not a floating panel), a live region is
  optional here; recommend omitting it to avoid over-announcing on every variant
  click, and letting the user discover the updated pickup line by normal reading
  order instead.

## Open questions

1. **Store hours have no native Liquid object.** Shopify's `location` object
   exposes name and address but not opening hours — that requires a metafield on
   the Location (or a metaobject) that does not currently exist in this theme.
   `show_hours` is speced as a setting, but until that metafield exists the
   "Hours" row in the expanded panel has no data source and should degrade to
   simply not rendering that line (already the specified behavior for "if
   location hours are available") — confirm whether adding the metafield
   structure is in scope for this surface or a separate data-modeling task.
2. **Address formatting convention.** No existing component in this theme
   formats a Shopify `address` object; `format_address` is the standard Liquid
   filter but its exact output (line breaks vs. commas) should be checked against
   the single-line treatment specced above before build.
3. **Real-time inventory vs. static availability.** `store_availabilities` is
   computed at render/variant-fetch time; if a merchant sells out a pickup
   location between page load and the shopper reaching this block, the row can
   go stale until the next variant-change event or page load. No mitigation is
   proposed here beyond what Shopify's own object already provides — flagging
   it as a known limitation rather than solving it, since real-time inventory
   sync is out of scope for a UI design pass.

---

# Surface 9 — Related product recommendations

## What it is / Baymard basis

A product-page section rendering Shopify's algorithmic recommendations via the
`{% recommendations %}` tag (`intent: 'related'`), sourced by Shopify's own
recommendation engine — merchant does not hand-pick these products. This is
functionally and purposefully different from `blocks/product-cross-sell.liquid`,
which is a **bespoke, merchant-curated** two-product upsell block already shipped
in the theme (see that file: two `product` schema settings the merchant sets by
hand). Both can appear on the same product page. The design's whole job is
making sure a shopper never mistakes one for the other.

Baymard basis, directly from the brief: near-identical, overlapping
recommendation sections erode trust and get ignored. The mitigation is not
"make them look different for the sake of it" — it's making each section's
**purpose** legible at a glance. Related recommendations answer "what else is
like this?" (algorithmic, browse-driven); the existing cross-sell block answers
"what does the merchant specifically want you to also buy?" (curated, sales-
driven); complementary recommendations (Surface 10) answer "what goes with
this?" (algorithmic, but bundling-driven, not similarity-driven). See Surface 10
for the full three-way comparison table — this surface defines the "related"
half of that distinction on its own terms first.

## Files & architecture

- **New block:** `blocks/product-recommendations.liquid` — wraps Shopify's
  `{% recommendations %}` tag. Registered as a product-page block in
  `templates/product.json` alongside the existing `product-cross-sell` block.
- Card rendering reuses `snippets/product-card.liquid` with `layout: 'minimal'`
  — these are lightweight browse cards, not the merchandising-heavy "standard"
  card treatment (no "Køb" button — see Layout for why).
- Composed from `product-card`, `icon` (none required for the header — see
  Layout, this surface deliberately uses text, not an icon, to differentiate
  from Surface 10).

## Schema settings

| id | type | default | label |
|---|---|---|---|
| `heading` | text | `t:recommendations.related_heading` | Heading |
| `products_to_show` | range 2–8 | 4 | Number of products |
| `intent` | select `related` / `complementary` | `related` | Recommendation type — **this single block covers both Surface 9 and Surface 10**; see rationale below |

**Why one block, two intents, not two blocks:** Shopify's `{% recommendations %}`
tag takes an `intent` parameter (`related` or `complementary`) against the same
API; the markup, states and card treatment are otherwise identical between the
two. Building `blocks/product-recommendations.liquid` once with an `intent`
selector — rather than two near-duplicate block files — avoids exactly the kind
of accidental near-identical duplication Baymard's finding warns about at the
*code* level, matching it at the *design* level: the visual differentiation
between "related" and "complementary" lives entirely in the heading copy and
eyebrow label (see Layout), which is the correct place for it, not in two
diverging templates that could silently drift apart.

## Layout & sizing

Section structure, matching the existing `.section-section__heading` convention
from Shared foundations:

```
[ RELATED PRODUCTS ]                          ← eyebrow, text-xs uppercase tracking-widest text-primary/60
[ You might also like ]                       ← h2, section-section__heading
[ card ]  [ card ]  [ card ]  [ card ]        ← horizontal scroll on mobile, grid on desktop
```

- Eyebrow: **present and mandatory** — copy is fixed per `intent`
  (`t:recommendations.related_eyebrow` = "Related products",
  `t:recommendations.complementary_eyebrow` = "Complete the look"), not merchant-
  editable. This is the primary legibility mechanism the Baymard finding calls
  for: a shopper scanning the page sees "RELATED PRODUCTS" and "COMPLETE THE
  LOOK" as clearly different labels before reading a single product card,
  regardless of how similar the grids underneath end up looking with real
  catalog data.
- Heading (`h2`, `.section-section__heading`): merchant-editable via `heading`
  setting, defaults differ per intent (`t:recommendations.related_heading` =
  "You might also like", `t:recommendations.complementary_heading` = "Goes well
  with this").
- Card grid: `grid grid-cols-2 gap-4` on mobile at rest, becoming a horizontal
  `flex gap-4 overflow-x-auto hide-scrollbar` **only if** `products_to_show` > 4
  (matches the existing cross-sell block's horizontal-scroll pattern for
  overflow, but only kicks in when needed rather than always scrolling two
  items). At `md` (840px): `grid grid-cols-4 gap-6`.
- Cards use `layout: 'minimal'` (per `snippets/product-card.liquid`'s existing
  parameter) — **no rating stars, no "Køb" button.** This is the second
  legibility lever: the existing cross-sell block has a visible buy button and
  is visually denser (border, shadow-on-hover, rating); related/complementary
  cards are deliberately lighter-weight browse units that invite a click-through
  to the product, not an instant add. A shopper should be able to tell "this is
  an algorithmic suggestion to go look at, not a curated upsell to buy right
  now" from silhouette alone, before reading any text.
- Placement in `templates/product.json`: **below** the accordion/FAQ row, above
  the footer — after the existing bespoke cross-sell block, not before it. The
  merchant's hand-picked upsell (`product-cross-sell`) gets first position
  because it is deliberately chosen; algorithmic suggestions come after, framed
  as "if you're still browsing."

## Color tokens

| Part | Token |
|---|---|
| Eyebrow | `text-primary/60` |
| Heading | `text-primary` (`.section-section__heading`) |
| Card | Inherits `snippets/product-card.liquid` minimal-layout tokens — `bg-transparent`, image wrapper `border-outline-variant`, title `text-primary` |
| Scroll affordance (mobile) | No visible scrollbar (`hide-scrollbar`), matching cross-sell |

## States

| State | Treatment |
|---|---|
| Recommendations returned (≥1 product) | Grid renders as specified |
| Fewer than requested (e.g. 2 returned when `products_to_show: 4`) | Grid renders with however many came back — never pad with placeholders; a 2-card row on a 4-column desktop grid is fine and honest |
| Zero recommendations (Shopify's engine has nothing for this product — common on very small catalogs) | **Entire block renders nothing**, including the eyebrow/heading — an empty "You might also like" section with no products is worse than no section, and is exactly the kind of "generic boilerplate" Theme Store review penalizes per the brief's framing |
| Loading | None — `{% recommendations %}` is server-rendered by Shopify at page-render time, not fetched client-side; no loading state exists for this tag |
| Product in the grid is out of stock | Card shows Shopify's standard sold-out treatment (existing `product-card` convention — badge or price-row label per whatever the card already does; this surface does not special-case it) |
| Hover (card) | Existing `product-card` hover: `hover:shadow-md hover:border-primary/40`, image `scale-105` |
| Focus-visible (card link) | 2px `--color-primary` ring per Shared foundations |

## Responsive

- **Mobile (<840px):** 2-column grid, or horizontal scroll if more than 4 items
  requested (see Layout).
- **Tablet/Desktop (≥840px):** 4-column grid (or `dropdown_columns`-independent
  fixed 4 — this is unrelated to navigation's column setting). If
  `products_to_show` < 4, the grid simply has fewer columns filled, left-aligned,
  not stretched.
- No takeover, no modal — this is inline page content at every width.

## Accessibility

- Section landmark: `<section aria-labelledby="related-products-heading-{{ block.id }}">`
  with the `h2` carrying that `id`.
- Horizontal scroll (mobile, when active): the scroll container needs
  `tabindex="0"` and `role="region"` with the same `aria-labelledby` if it is the
  only way to reach overflow cards, so keyboard users can scroll it directly
  (arrow keys once focused) rather than only being able to Tab through visible
  cards.
- Card focus order matches visual left-to-right / reading order — inherited from
  `product-card`'s existing single-link-per-card structure, no extra work needed.
- Touch targets: cards are large tap targets already (whole image + title area is
  the link); no sub-48px controls exist in the minimal layout.
- Motion: hover scale/shadow transitions honor `prefers-reduced-motion` per the
  Shared-foundations blanket rule.

## Open questions

1. **Shopify's recommendation engine needs order history / catalog signal to
   return anything.** New stores or very small catalogs may see this block
   render nothing on most products, which is the spec'd (correct) behavior but
   worth setting expectations for — this is not a bug to fix in the design pass.
2. **One block, two intents vs. two separate blocks.** The rationale above
   argues for one block file with an `intent` selector; an alternative is two
   separate block files (`product-recommendations-related.liquid` /
   `product-recommendations-complementary.liquid`) if the merchant-facing block
   picker in the theme editor is judged clearer with two distinctly named
   entries rather than one block with a select setting. Recommend confirming
   with whoever reviews the block list in the editor before build.
3. **Fixed vs. editable eyebrow copy.** The eyebrow text is specced as
   non-editable (fixed per intent) specifically to guarantee the two sections
   stay legibly distinct even if a merchant edits the `heading` field to
   something similar for both. If merchants push back on losing that control,
   the fallback is making the eyebrow editable but defaulting it per-intent —
   which reopens the exact risk this spec is designed to close. Recommend
   keeping it fixed.

---

# Surface 10 — Complementary products

## What it is / Baymard basis

The `intent: 'complementary'` mode of the same `blocks/product-recommendations.liquid`
block defined in Surface 9 — Shopify's `{% recommendations %}` tag with
`intent: 'complementary'` returns products that are frequently bought *alongside*
this one (accessories, add-ons), as distinct from `intent: 'related'`'s
"similar/alternative" products. This surface is specifically about making the
**three** recommendation-shaped things on a product page — related, complementary,
and the existing bespoke cross-sell block — read as three purposeful sections
rather than three near-identical grids.

Baymard basis: identical citation to Surface 9 — near-identical, overlapping
recommendation sections erode trust and get ignored when their purpose isn't
legible at a glance. This surface is where that finding has to be resolved
completely, because it is the point at which all three sections could plausibly
appear on the same page at once.

## The three-way distinction (read this before either Surface 9 or 10 in
isolation)

| | **Cross-sell** (existing, `blocks/product-cross-sell.liquid`) | **Related** (Surface 9, `intent: related`) | **Complementary** (this surface, `intent: complementary`) |
|---|---|---|---|
| Source | Merchant hand-picks exactly 2 products via block settings | Shopify's algorithm — "shoppers who viewed this also viewed…" | Shopify's algorithm — "frequently bought with this" |
| Question it answers | "What do we specifically want you to add?" | "What else is like this?" | "What goes with this?" |
| Eyebrow copy | *(none — see below)* | "Related products" | "Complete the look" |
| Heading copy | *(merchant sets via block, no fixed convention)* | "You might also like" | "Goes well with this" |
| Card treatment | **Standard** card (border, shadow-on-hover, rating stars, visible "Køb" button) | **Minimal** card (no border, no button, browse-weight) | **Minimal** card, same as related |
| Count | Always exactly 2 | 2–8, merchant-configurable | 2–8, merchant-configurable |
| Position on page | First — directly after price/buy-buttons vicinity per its existing placement in `templates/product.json` (`row_Rg3kFD`) | After cross-sell, after the FAQ/accordion row | Immediately after related, same section family |
| Interaction | One tap = added to cart (quick-add) | One tap = navigate to the product page | One tap = navigate to the product page |

**Why cross-sell gets no eyebrow while related/complementary do:** cross-sell is
already visually distinct by construction (border + shadow + rating + buy
button — it is the theme's existing, established "merchandising unit" look,
unchanged by this brief). Adding an eyebrow to it would be redesigning a block
that is explicitly out of scope ("everything else in the theme is out of scope
for this brief"). Related and complementary are the two *new* things being
introduced that risk looking like each other and like cross-sell, so they carry
the eyebrow labels that do the differentiating work — cross-sell doesn't need
one because its whole visual language already says "this is different" to
anything sharing the page with it.

## Files & architecture

Shared entirely with Surface 9 — `blocks/product-recommendations.liquid`,
`intent: complementary` value of the `intent` setting. No separate files. See
Surface 9's Files & architecture for the full breakdown.

## Schema settings

Same block, same settings as Surface 9 (`heading`, `products_to_show`,
`intent`). A merchant adds the block **twice** — once with `intent: related`,
once with `intent: complementary` — to show both sections on one product page,
exactly as they would add two instances of any other repeatable block.

## Layout & sizing

Identical grid/card mechanics to Surface 9 (2-col mobile / 4-col desktop `md`,
`layout: 'minimal'` cards, horizontal scroll only past 4 items). The only
differences are the fixed eyebrow/heading copy defaults noted in the comparison
table above, and **section order when both are present on the same page**:

```
[ existing cross-sell block ]     ← merchant-curated, standard cards, buy button
...FAQ / accordion row...
[ RELATED PRODUCTS — "You might also like" ]        ← algorithmic, minimal cards
[ COMPLETE THE LOOK — "Goes well with this" ]        ← algorithmic, minimal cards
```

- When both related and complementary blocks are present, they sit **adjacent**,
  separated by the standard section-to-section rhythm only (no extra divider,
  no extra spacing beyond the normal `py-10`/`py-12` scale) — they are peers in
  the same "here's more to browse" family, so they should read as two chapters
  of one story, not two unrelated interruptions.
- If a merchant only adds one of the two (common case — most stores will not
  need both), it simply appears alone in that position; nothing in either
  block's layout assumes the other exists.

## Color tokens

Identical to Surface 9 — see that section's Color tokens table. No new tokens.

## States

Identical state table to Surface 9 (recommendations returned / fewer than
requested / zero → block renders nothing / no loading state / sold-out card
handling / hover / focus), with one addition specific to the two-block-adjacent
case:

| State | Treatment |
|---|---|
| Related returns 0, complementary returns products (or vice versa) | Each block's empty-state rule (Surface 9: render nothing) applies **independently** — one section disappearing does not affect the other's rendering or spacing. Never show "Related products" with an empty grid just because complementary has content next to it. |

## Responsive

Identical to Surface 9. When both blocks are present, they stack in the same
single column on mobile with standard section spacing between them — no special
two-up treatment is introduced for having two recommendation sections adjacent.

## Accessibility

Identical to Surface 9, with one addition: when both blocks are present, their
`aria-labelledby` targets are distinct heading `id`s
(`related-products-heading-{{ block.id }}` /
`complementary-products-heading-{{ block.id }}`, each block's own `block.id`
already makes these unique) so screen reader users navigating by landmark/heading
can tell the two sections apart in the same way sighted users do via the eyebrow.

## Open questions

1. **All of Surface 9's open questions apply here too** (recommendation-engine
   data requirements, one-block-two-intents vs. two-block-files, fixed eyebrow
   copy) — not repeated verbatim, see Surface 9.
2. **Three sections on one page is a lot of "more products" real estate.** If a
   merchant enables cross-sell + related + complementary simultaneously, that is
   three product grids between the buy box and the footer. Nothing in this spec
   caps that — Theme Store review may flag excessive recommendation surface area
   even when each section is individually well-differentiated. Worth a content
   guideline (e.g. "enable at most two of the three") in merchant-facing docs,
   which is outside a design spec's scope to enforce structurally.

---

# Surface 11 — Shop Pay Installments banner

## What it is / Baymard basis

Shopify's native Shop Pay Installments messaging widget (the "as low as
{{ amount }}/mo with Shop Pay" line), rendered via
`{{ product.selected_or_first_available_variant.price | payment_terms }}` — a
single native element whose copy, logo and modal (the "learn more" popup it
triggers) are entirely Shopify-controlled. Same restyling constraint as
Surfaces 2 and 5: this spec covers placement and spacing only.

No dedicated Baymard citation — same rationale as Surface 2 (Follow on Shop):
the relevant general principle is that unexplained financial-sounding text near
a price reads as noise unless it's anchored tightly to the number it's
qualifying, so placement (not styling) is the whole job.

## Files & architecture

- **Modified block:** `blocks/product-price.liquid` — insert
  `{{ current_variant.price | payment_terms }}` immediately after the price
  display, before `price_subtext`.

## Schema settings

| id | type | default | label |
|---|---|---|---|
| `show_installments` | checkbox | `true` | Show "as low as X/mo" messaging |

## Layout & sizing

```
[ Price — text-3xl / text-5xl per sale state, unchanged ]
[ suffix, if any ]
[ Shop Pay Installments line ]     ← new, this surface
[ price_subtext, if any — existing ]
```

- Wrapper: `<div class="mt-2">{{ current_variant.price | payment_terms }}</div>`,
  gated by `show_installments`. `mt-2` (8px) — closer to the price than
  `price_subtext`'s `mt-1.5`, since installments math is *about* the price
  directly above it, while `price_subtext` is general reassurance copy.
- No background, no border, no container — Shopify's element renders its own
  compact inline text + icon; wrapping it in a card/chip would overstate its
  visual weight relative to the price it's clarifying.
- Must sit **above** `price_subtext`, not below — installments messaging is
  price-adjacent information; the subtext (shipping/returns reassurance) is a
  separate concern and shouldn't visually separate the price from its
  installment breakdown.

## Color tokens

Shopify-controlled — do not style. No token applies, same rule as Surfaces 2
and 5.

## States

| State | Treatment |
|---|---|
| Shop Pay Installments unavailable (not enabled on the shop, or product ineligible) | Shopify's `payment_terms` filter returns nothing; the wrapper naturally collapses to empty — no `:empty` CSS needed since an empty `<div>` with no visible content already takes no visual space, but add `.installments-wrapper:empty { display: none; }` anyway to avoid leaving a stray `mt-2` gap when it renders nothing. |
| Variant price changes | Re-render on `variant-changed` (the same custom event `product-buy-buttons.liquid` already dispatches) — the installment amount must track the currently selected variant's price, not the page's initial price. |
| `show_installments` off | Wrapper omitted entirely. |

## Responsive

No breakpoint-specific behavior — Shopify's element is a single line of text
that wraps naturally at any width; the theme adds no responsive rules of its
own.

## Accessibility

- Do not add `aria-label` to the element or its wrapper — Shopify's own markup
  carries whatever accessible structure it needs.
- The "learn more" trigger inside Shopify's widget (if present) manages its own
  focus/modal behavior; the theme must not intercept it.
- Touch target for that trigger is Shopify's responsibility, not this spec's.

## Open questions

None — this is a native, fully Shopify-owned element; the only decisions here
(placement above `price_subtext`, `mt-2` spacing, `show_installments` toggle)
are settled above.

---

# Surface 12 — Unit pricing display

## What it is / Baymard basis

A "$X.XX / unit" treatment (e.g. "40,00 kr / 100g") built from Shopify's native
variant fields — `variant.unit_price` and `variant.unit_price_measurement`
(`.reference_value`, `.reference_unit`, `.quantity_value`, `.quantity_unit`) —
populated when a merchant sets unit pricing on a variant in Shopify admin. This
is a ground-up rebuild: the brief notes the only prior unit-price code in this
theme was client-specific (the metervare "pris pr. meter" logic hardcoded into
`blocks/product-price.liquid` and `sections/cart.liquid`, both of which compute
a fake "per-meter" price via `| times: 100` on custom metafields, not Shopify's
real unit-pricing feature) and is being removed. This surface designs its
Shopify-native replacement, appearing in **three** places: collection card,
product page, and cart line item.

Baymard basis, directly from the brief: pricing and unit-price information
should be scannable at the same glance as the main price, not require extra
parsing. Applied as: unit price is always positioned directly beside or beneath
the main price it qualifies, in a consistent, smaller-but-legible type step —
never in a tooltip, never requiring a hover or tap to reveal, and never using a
type size so small it fails to be genuinely scannable (this theme's floor for
unit price is 11px, matching the badge-text convention, not smaller).

## Files & architecture

- **New snippet:** `snippets/unit-price.liquid` — the single source of truth for
  unit-price formatting, parameterized by `size` (`xs` / `sm` / `base`) so all
  three call sites render identically in substance and differ only in scale.
  Referenced already, forward-declared, by Surface 4's predictive-search spec.
- **Modified snippet:** `snippets/product-card.liquid` — unit price row added
  beneath the existing price block.
- **Modified block:** `blocks/product-price.liquid` — unit price row added
  beneath the main price display (both the on-sale and standard layouts, plus
  their JS-driven variant-change re-render paths).
- **Modified section:** `sections/cart.liquid` — unit price row added per line
  item, beneath the existing price display.
- **Removed (out of scope to redesign, but noted):** the client-specific
  "pris pr. meter" logic in `blocks/product-price.liquid` (the `is_metervare`
  branch) and `sections/cart.liquid` (the `item.properties._base_price` branch)
  is the thing being replaced. This spec does not redesign the metervare
  customizer itself — only the generic unit-price display that supersedes its
  bespoke per-meter math wherever Shopify's native unit pricing is what a
  variant actually has configured.

## Schema settings

None — unit price is **data-driven**, not merchant-configured per instance. It
renders automatically whenever `variant.unit_price_measurement` is present, the
same way Shopify's own checkout does. The only setting is global:

Added to `snippets/css-variables.liquid`'s companion settings (or wherever
theme-wide toggles live — `config/settings_schema.json`'s general section):

| id | type | default | label |
|---|---|---|---|
| `show_unit_pricing` | checkbox | `true` | Show unit pricing (e.g. "40,00 kr / 100 g") where available |

## Layout & sizing

**`snippets/unit-price.liquid` contract:**

```liquid
{% render 'unit-price', variant: current_variant, size: 'sm' %}
```

- Renders nothing if `variant.unit_price_measurement == blank` or
  `show_unit_pricing == false`.
- Output shape: `{{ variant.unit_price | money }} / {{ variant.unit_price_measurement.reference_value }}{{ variant.unit_price_measurement.reference_unit }}`
  — e.g. "40,00 kr / 100 g". Shopify's `reference_value` is omitted from the
  string when it equals `1` (native convention: "40,00 kr / g", not
  "40,00 kr / 1 g").
- `size` parameter maps to:
  - `xs` — `text-[11px]` (predictive search rows, dense contexts). This is the
    theme's floor per the Baymard-grounded rationale above — never smaller.
  - `sm` — `text-xs` (12px) (collection card, cart line item — the two contexts
    where the unit price sits beside a compact price, not a hero price).
  - `base` — `text-sm` (14px) (product page — the unit price sits beside the
    large hero price and needs to hold its own visually next to `text-3xl`/
    `text-5xl` digits without disappearing).
- Color at every size: `text-primary/70` (secondary-text tier per the opacity
  scale in Shared foundations) — never `text-primary` full-strength, since the
  main price is the primary number and unit price is supporting context; but
  never below `/60` either, since it must stay independently legible without
  requiring the shopper to first parse the main price.

**Collection card** (`snippets/product-card.liquid`, standard layout — not
`minimal`, which stays deliberately lean per Surface 9's card-weight logic):

```
[ Price label — "Pris" — text-xs text-primary/85 ]
[ 49,00 kr ]  [ 39,00 kr ]        ← main price row, existing
[ 40,00 kr / 100 g ]              ← NEW — unit-price snippet, size: 'sm'
```

- Inserted directly below the existing price row (`flex items-baseline gap-1.5
  flex-wrap`), `mt-0.5`, same left alignment.
- Minimal-layout cards (Surface 9/10's recommendation grids) **omit unit
  price entirely** — those cards are already stripped down to title + price
  only; adding a third price-adjacent line would contradict their "lighter
  browse unit" purpose. `snippets/unit-price.liquid` is simply not called from
  the `is_minimal` branch.

**Product page** (`blocks/product-price.liquid`, both the on-sale and standard
layouts, and their JS re-render counterparts):

```
[ Spar 20%  ]                                    ← on-sale only, existing
[ 159,00 kr   pr. meter inkl. moms ]              ← main price + suffix, existing
[ Normalpris: 199,00 kr  ⓘ ]                       ← compare-at row, on-sale only, existing
[ 40,00 kr / 100 g ]                              ← NEW — unit-price snippet, size: 'base'
```

- Inserted as the last row inside `#product-price-container-{{ block.id }}`,
  after the existing price rows, `mt-1`.
- **Interaction with the existing `suffix` text:** the block already renders a
  free-text `price_suffix` (e.g. "pr. meter inkl. moms") next to the main price
  for the metervare use case. When a variant has **both** a merchant-set
  `price_suffix` **and** genuine Shopify `unit_price_measurement` data, show
  both — they answer different questions ("this number includes tax" vs. "this
  is the per-unit rate") and are not redundant. When only one is present, only
  that one renders. This block's JS `updatePrice()` function must also emit the
  unit-price row on variant change, sourced from the same per-variant JSON
  payload the block already builds (`product-price-variant-data-{{ block.id }}`)
  — extend that JSON to include `unit_price` and `unit_price_measurement` per
  variant.

**Cart line item** (`sections/cart.liquid`, inside each item's info column):

```
[ Product title ]
[ Variant / metervare specs, if any — existing ]
[ 40,00 kr / 100 g ]              ← NEW — unit-price snippet, size: 'sm'
[ discount chips, if any — Surface 6 ]
[ Remove link ]
```

- Inserted directly below the title/variant block, above any Surface 6 discount
  chips (unit price is a property of the item itself; discount chips are a
  transient modifier on top of it — item identity information reads first).
- Uses `item.unit_price` / `item.unit_price_measurement` (Shopify exposes these
  on cart line items directly, mirroring the variant-level fields) rather than
  re-deriving from the variant, since `item` already carries them.

## Color tokens

| Part | Token |
|---|---|
| Unit price text (all sizes/contexts) | `text-primary/70` |
| Unit price on a sale/compare-at layout | Same — `text-primary/70`, never adopts the sale price's `text-primary` full-strength treatment, to keep the visual hierarchy price → compare-at → unit-price in descending emphasis |

## States

| State | Treatment |
|---|---|
| Variant has unit pricing configured | Renders per Layout above |
| Variant has no unit pricing | `snippets/unit-price.liquid` renders nothing — no placeholder, no "N/A" |
| `show_unit_pricing` off (theme-wide) | Renders nothing anywhere, all three contexts |
| Variant changes (product page) | Unit price updates via the same `variant-changed` event / JSON-payload mechanism as the main price — never lags one step behind the price it sits beside |
| Product with `price_varies` ("Fra 99,00 kr") | Unit price for the *default/first available* variant shows, with no "fra" prefix on the unit price itself — unit price is inherently a per-unit rate, not a range, even when the total price varies by variant size; showing a range here (e.g. "fra 40,00 kr/100g") would need every variant's unit price to be comparable, which is not guaranteed (a shopper comparing a 100g and a 500g variant already sees the point of unit pricing resolve itself once they pick one) |
| Minimal-layout product card | Never shows unit price (see Layout) |
| Predictive search product row (Surface 4) | Uses `size: 'xs'` per Surface 4's own spec, which forward-referenced this snippet |

## Responsive

No breakpoint-specific behavior in any of the three contexts — unit price is a
single line of text that wraps naturally; its `size` parameter is chosen per
*context* (collection card vs. product page vs. cart line), not per *viewport
width*. The same `size: 'sm'` collection-card treatment applies identically at
mobile, tablet and desktop.

## Accessibility

- Unit price text is real text content, not an image or icon-only treatment —
  no special ARIA needed beyond normal reading order.
- Where unit price sits directly below a struck-through compare-at price (on-
  sale product page layout), ensure DOM order is main price → compare-at →
  unit price, matching visual order, so screen reader users encounter the
  numbers in the same sequence sighted users scan them in.
- Contrast: `text-primary/70` against `bg-card-light`/`bg-background` must be
  checked per the merchant's actual token values — this is the same caveat
  Shared foundations already raises for any `/70`-opacity text; unit price
  introduces no new risk beyond what already exists for secondary-text tiers
  elsewhere (e.g. the "Pris" label above the main price already uses `/85`).
- Touch: unit price is not interactive — no target-size requirement applies.

## Open questions

1. **Removal of the existing metervare per-meter logic is explicitly out of this
   surface's redesign scope**, but its presence in `blocks/product-price.liquid`
   and `sections/cart.liquid` means an implementer will encounter two competing
   "per-unit" mechanisms in the same files during build — the old
   `is_metervare`/`price_suffix` branch (custom metafield math) and the new
   `snippets/unit-price.liquid` (Shopify-native `unit_price_measurement`).
   Confirm the metervare branch is being retired in the same work item as this
   surface ships, or the two will visually stack in a confusing way for any
   product that happens to have both a metervare metafield and native unit
   pricing configured.
2. **`reference_value` omission rule ("40,00 kr / g" vs. "40,00 kr / 1 g") is a
   judgment call**, not something Shopify's filter does for you automatically —
   confirm the desired locale-formatting convention (Danish shoppers may expect
   "1 g" to stay explicit) before build.

---

# Surface 13 — Image focal point support

## What it is / Baymard basis

Not a new UI element — a **behavioral** requirement that every image-bearing
component in the theme respects a merchant-set focal point when cropping,
instead of always center-cropping. Shopify exposes this natively:
`image.presentation.focal_point.x` / `.y` (percentages, set by the merchant in
the media picker's focal-point tool) on any `image` object. The theme's existing
`snippets/image.liquid` only supports Shopify's fixed named crops
(`crop: 'center' | 'top' | 'bottom' | 'left' | 'right'` passed to `image_url`),
which cannot express an arbitrary focal point — a merchant who sets a focal
point in admin today sees it silently ignored everywhere in this theme.

No dedicated Baymard citation is needed for the mechanism itself (this is a
Shopify platform capability question, not a UX-research one), but the brief's
mobile-usability framing applies to *why* it matters: aggressive mobile
aspect-ratio cropping (square product cards, wide hero banners cropped to a
tighter mobile ratio) is exactly the scenario where center-cropping cuts off a
product's most important visual detail or a hero image's subject, and where a
merchant-set focal point is the mitigation.

## Files & architecture

- **Modified snippet:** `snippets/image.liquid` — gains focal-point-aware
  rendering as its default behavior, not an opt-in parameter.
- **No new files.** Every other image-bearing component (`product-card`,
  `product-media`, collection banners, the nav mega-menu's featured-collection
  image from Surface 3, hero sections) should render through
  `snippets/image.liquid` rather than hand-rolling `image_url`/`image_tag` calls;
  where a component currently does the latter (several do, per the earlier file
  reads — e.g. `product-card.liquid`'s `image_url: width: 480 | image_tag`
  inline call), this surface's implementation work is migrating those call
  sites onto the snippet, not modifying each one independently. That migration
  is implementation work, not a design decision, so it is noted here rather than
  spec'd file-by-file.

## Mechanism (normative)

Shopify's `image_url` filter's `crop` parameter only accepts the five named
positions — it cannot take an arbitrary x/y percentage. Focal-point-aware
cropping therefore cannot be done through `crop:` at all; it requires CSS
`object-position`, driven by the image's real focal point:

```liquid
{%- liquid
  assign has_focal_point = false
  if image.presentation.focal_point.x != blank and image.presentation.focal_point.y != blank
    assign has_focal_point = true
    assign focal_x = image.presentation.focal_point.x
    assign focal_y = image.presentation.focal_point.y
  endif
-%}
{{ image | image_url: width: width, height: height | image_tag:
  class: class,
  style: has_focal_point ? 'object-fit: cover; object-position: ' | append: focal_x | append: '% ' | append: focal_y | append: '%;' : '',
  loading: loading
}}
```

- When a focal point **is** set: request the image **without** a fixed `crop:`
  value (so Shopify serves it at the requested dimensions without pre-cropping
  server-side to a named position), and let `object-fit: cover` +
  `object-position: {x}% {y}%` do the cropping client-side to the focal point.
- When a focal point **is not** set: fall back to today's behavior exactly —
  `crop: 'center'` (or whatever `crop` parameter the call site already passes),
  via `image_url`. No regression for images that have no focal point configured.
- The `width`/`height` aspect-ratio contract `snippets/image.liquid` already
  documents (fixed aspect ratio when both are provided) is unchanged — focal
  point changes *where* the crop centers, not *what shape* the crop is.

## Layout & sizing

No new layout — this surface changes cropping behavior inside existing image
containers (product card's `aspect-ratio: 1/1` wrapper, hero banners, collection
banners, the nav mega-menu's featured image, product gallery thumbnails). Every
container's existing aspect ratio, size and responsive `sizes`/`widths`
attributes are unchanged; only the crop's anchor point changes.

## Color tokens

Not applicable — no visible chrome, no new colored elements. The existing
`bg-surface-container` placeholder-fill convention (shown while an image loads,
or when a product has no image) is unaffected.

## States

| State | Treatment |
|---|---|
| Image has a merchant-set focal point | `object-position` anchors the crop there, at every aspect ratio the image is rendered at across the site (card, hero, gallery — one focal point, many crops, all respecting it) |
| Image has no focal point set | Falls back to existing named-crop behavior (`center` by default) — unchanged from today |
| Focal point is set but the container's aspect ratio is very different from the source image's (e.g. a 1:1 source cropped into a 21:9 hero band) | `object-position` still applies — this is the exact scenario focal point exists to solve; a merchant sees the same anchor point respected even under an aggressive crop, rather than the subject sliding to whichever edge center-cropping happens to leave it at |
| No image at all | Existing placeholder treatment (glyph on `bg-surface-container`), unaffected by this surface |

## Responsive

Focal point is **resolution-independent** — the same `x`/`y` percentage applies
whether the image is being served at a 180px mobile card width or a 1600px
desktop hero width, and whether the container is a small square or a wide
banner. This is the entire value of using a percentage-based `object-position`
rather than a server-side named crop: one merchant decision (set once in admin)
holds correctly across every breakpoint and every aspect ratio this theme uses
it at, with zero per-breakpoint configuration needed.

## Accessibility

- No change to `alt` text handling — focal point is a purely visual cropping
  concern and has no accessibility-tree implications of its own.
- Confirm `object-fit: cover` combined with `object-position` does not break any
  existing `loading="lazy"` / responsive `srcset` behavior already in place
  (it does not, structurally — `object-position` is applied to the rendered
  `<img>` after Shopify has already served whichever `srcset` candidate the
  browser picked; it changes how that image is *cropped inside its box*, not
  which image variant loads).

## Open questions

1. **Migrating existing hand-rolled `image_url`/`image_tag` call sites onto
   `snippets/image.liquid`** (rather than only fixing the snippet itself) is
   real, if mechanical, implementation work across multiple files
   (`product-card.liquid` at minimum, confirmed by this session's file read;
   likely `product-media.liquid` and hero/banner sections not read in this pass).
   Flagging the scope of that migration rather than enumerating every call site
   here — a full-repo audit for `image_url` usage should precede build.
2. **Product page gallery vs. Shopify's zoom/lightbox interaction.** If
   `blocks/product-media.liquid` has its own zoom-on-click behavior, confirm
   that focal-point-based `object-position` doesn't visually conflict with
   whatever crop the zoomed/lightbox view uses (the zoomed view typically wants
   to show the whole image, uncropped, which is a different concern from this
   surface's thumbnail/card cropping and should not use `object-position`
   cropping at all — flagging so it isn't accidentally applied there).

---

# Surface 14 — Country selector / language selector

## What it is / Baymard basis

A footer-anchored trigger (current country/language, flag or text + chevron)
opening a picker for Shopify's native localization forms —
`{% form 'localization' %}` for country/currency (backed by
`localization.available_countries`, `localization.country`) and the same form
shape for language (`localization.available_languages`, `localization.language`)
when the shop has multiple published languages. Both selections POST to
Shopify's `/localization` endpoint, which sets a cookie and reloads.

Baymard basis: Baymard's international/localization UX research is built around
a small set of well-established findings this spec applies directly —
(1) the country/region and currency being shown should be **explicit and
visible**, not inferred silently from IP geolocation with no visible indicator
or escape hatch; a shopper should always be able to see what's currently
selected and change it without hunting; (2) a searchable/filterable list is
necessary once the list is long — scrolling a 190-country unfiltered list is a
well-documented failure mode; (3) flag icons alone are an unreliable identifier
(multiple countries share visual flags, flags don't map to language, and some
shoppers don't recognize flags reliably) — flags should be a *secondary* visual
aid alongside the country name in text, never the only identifier. Per this
document's sourcing note, these are drawn from Baymard's public
localization/geolocation findings rather than the paywalled guideline text.

## Files & architecture

- **New block:** `blocks/footer-localization.liquid` — registered in
  `sections/footer.liquid`'s settings (a checkbox gate + the block itself,
  following the same pattern as Surface 2's footer placement) rather than a
  freeform block list, since `sections/footer.liquid` currently has no
  `{% content_for 'blocks' %}` slot of its own (it is a hand-built section, not
  a `@theme`-block-accepting one) — see Open questions for the alternative.
- **New snippet:** `snippets/localization-picker.liquid` — the modal/panel
  contents, handles both country and language pickers with one shared markup
  shape (two lists, same interaction pattern) rather than two bespoke UIs.
- **New asset:** `assets/localization.js` — search-filter, keyboard nav, submit
  handling for both forms.
- Composed from `icon` (`language`, `expand_more`, `search`, `check_circle`
  reused as the "currently selected" indicator), `input` (the filter field),
  `button`.

## Schema settings

Added to `sections/footer.liquid`:

| id | type | default | label |
|---|---|---|---|
| `show_localization` | checkbox | `true` | Show country/language selector |
| `localization_show_flags` | checkbox | `true` | Show flag icons next to country names |

## Layout & sizing

**Trigger**, placed in the footer's bottom row, alongside the Follow-on-Shop
zone from Surface 2 (`flex flex-col items-center gap-4` row), **before** the
trust-badge chips:

```
[ 🌐  Denmark · Danish  ⌄ ]
```

- `<button type="button">`, `inline-flex items-center gap-2 h-10 px-3 rounded-full border border-outline-variant bg-card-light text-sm font-medium text-primary`.
- `language` icon 18px `text-primary/70` (used regardless of `localization_show_flags`
  — it is the control's own icon, not the country's flag; the flag, if enabled,
  appears **inside the picker list**, not on the trigger, per the Baymard
  "flags alone are unreliable" finding — the trigger leads with the country
  **name** in text, which is the reliable identifier).
- Label: `{{ localization.country.name }}` + (if multiple languages published)
  ` · {{ localization.language.endonym_name | capitalize }}` — the shop's own
  language name for itself (e.g. "Dansk"), not translated into the viewer's
  current language, matching Shopify's own convention for language pickers.
- Trailing `expand_more` 16px, rotates 180° open.
- If the shop has only one country and one language available (no Shopify
  Markets / multi-language setup), the entire block renders nothing — a trigger
  that opens a picker with exactly one, already-selected option is not a
  control, it's decoration.

**Picker** — a centered **modal** (not a footer-anchored dropdown): unlike the
account panel (Surface 1) or nav dropdowns (Surface 3), which anchor naturally
near their trigger in the header, a footer trigger opening upward into a long
scrollable list works poorly at the bottom of a long page — the panel would
either need to open upward and risk clipping above the viewport, or push the
page's scroll position awkwardly. A modal avoids both:

- `fixed inset-0 z-50 flex items-center justify-center p-4`, scrim
  `bg-black/50`.
- Panel: `bg-card-light rounded-3xl border border-outline-variant shadow-2xl
  w-full max-w-md max-h-[80vh] flex flex-col`. `rounded-3xl` — this is a modal
  container, matching the "boxed section container" radius convention from
  Shared foundations, not a floating panel (`rounded-2xl`).
- Header row: `flex items-center justify-between p-6 border-b border-outline-variant`
  — heading `text-lg font-bold text-primary` "Region & language"
  (`t:localization.title`), close `button` variant `icon`.
- **If both country and language pickers apply** (multi-market **and**
  multi-language shop): two tabs, `flex border-b border-outline-variant`, each
  `flex-1 h-11 text-sm font-semibold`, active tab `text-primary border-b-2
  border-primary`, inactive `text-primary/60`. If only one applies (most common
  case — multi-currency without multi-language, or vice versa), no tabs, just
  that one list.
- Filter input (only shown when the active list has >8 entries — not needed for
  a 3-country shop): `{% render 'input', id: 'localization-filter', type: 'search', label: t:localization.search_label, placeholder: t:localization.search_placeholder %}`,
  `m-4`, `h-11`.
- List: `flex-1 overflow-y-auto p-2`. One row per `localization.available_countries`
  (or `.available_languages`): `<button type="submit">` inside the relevant
  `{% form 'localization' %}`, `w-full flex items-center gap-3 h-12 px-3
  rounded-md text-sm text-primary`, hover `bg-card-high`.
  - Flag (if `localization_show_flags`): `country.iso_code`-driven flag glyph or
    small flag image, 20×15px, `rounded-sm border border-outline-variant/50`
    (flags are small enough that even a hairline border helps legibility against
    `bg-card-light` in light mode for pale flags).
  - Country/language name: `flex-1 text-left`. **Text is the primary identifier
    at every row** — flag is decorative alongside it, never the only cue.
  - Currently-selected row: `check_circle` icon 18px `text-primary`, trailing.
  - No currency shown per-row in the list itself (would add a second data point
    per row that isn't needed to identify the option) — but the **trigger**,
    once a country is selected, could optionally reflect currency; this spec
    keeps the trigger to country/language name only for simplicity and flags the
    alternative in Open questions.

## Color tokens

| Part | Token |
|---|---|
| Trigger background | `bg-card-light` |
| Trigger border | `border-outline-variant` |
| Trigger icon/label | `text-primary/70` / `text-primary` |
| Modal scrim | `bg-black/50` |
| Modal panel | `bg-card-light` |
| Modal border | `border-outline-variant` |
| Tab active | `text-primary`, underline `border-primary` |
| Tab inactive | `text-primary/60` |
| List row hover | `bg-card-high` |
| Selected indicator | `text-primary` (`check_circle`) |
| Flag border | `border-outline-variant/50` |

## States

| State | Treatment |
|---|---|
| Default (trigger) | As specified |
| Hover (trigger) | `hover:bg-card-high` |
| Focus-visible (trigger) | 2px `--color-primary` ring, 2px offset |
| Open (modal) | Scrim fades in 200ms, panel scales from `95%`→`100%` + fades, 200ms. Reduced motion → fade only, no scale. |
| Filtering | List updates on every keystroke (client-side substring match against the visible name, no debounce needed — this is a local filter over an already-loaded list, not a network request); non-matching rows are removed from the DOM, not just hidden, so screen readers don't encounter them |
| No filter matches | `py-8 px-4 text-center text-sm text-primary/70` "No matches for "{query}"" (`t:localization.no_matches`) |
| Submitting a selection | The row's `<button type="submit">` triggers a full form POST to `/localization` and a page reload (Shopify's own mechanism — no AJAX alternative is assumed); briefly show the clicked row at `opacity-60` with a disabled state on the rest of the list to prevent a double-submit while the navigation is in flight |
| Currently selected country/language | `check_circle` indicator, `bg-card-high` row background even without hover, so the current selection is visible at a glance when the modal opens, before any interaction |
| Shop has only one country/language | Entire trigger + modal render nothing (see Layout) |

## Responsive

- **Mobile (<840px):** modal is `w-full max-w-none mx-4` (effectively full-width
  minus 16px gutters), `max-h-[85vh]`. Trigger sits full-width in the footer's
  stacked mobile layout if the footer's other zones (newsletter, Follow on Shop)
  are also stacked at that width — matches whatever the surrounding footer
  layout does at mobile, this surface does not force its own column behavior.
- **Tablet/Desktop (≥840px):** modal `max-w-md`, centered, as specified.
- No dropdown variant at any width — Baymard's "avoid desktop-pattern dropdowns
  that don't translate to touch" mobile finding, cited generally in the brief,
  argues for one consistent modal pattern across all widths here rather than a
  footer dropdown on desktop and a takeover on mobile (unlike Surface 4's search,
  which genuinely needs the split because it's a live-typing combobox); a
  country picker is a simple list-and-select interaction that a centered modal
  serves well at every width, so this surface deliberately does **not** mirror
  Surface 4's desktop/mobile split.

## Accessibility

- Trigger: `<button type="button" aria-haspopup="dialog" aria-controls="localization-modal">`.
  Accessible name includes the current selection: "Region and language, currently
  Denmark, Danish."
- Modal: `role="dialog" aria-modal="true" aria-labelledby="localization-modal-heading"`.
  Focus moves to the filter input (if shown) or the first list row on open.
  Focus trapped inside; `Escape` closes and returns focus to the trigger.
  Background content gets `inert` (or `aria-hidden="true"` with all its
  focusable descendants also `tabindex="-1"` if `inert` isn't supported in the
  theme's browser support target).
- Tabs (when both country and language apply): `role="tablist"` /
  `role="tab"` / `role="tabpanel"`, arrow-key navigation between tabs per the
  standard ARIA tabs pattern.
- List rows: real `<button type="submit">` elements inside a real `<form>` —
  never `<div onclick>`. Each row's accessible name is the country/language
  name; the flag image (if shown) is `alt=""` (decorative, name already carries
  the identity — this directly implements the "flags are not the reliable
  identifier" Baymard finding at the markup level, not just visually).
  Currently-selected row gets `aria-current="true"`.
- Filter input: `type="search"`, real `<label>` via the `input` primitive
  (visually may be `sr-only` if the placeholder-equivalent hint text is
  sufficient in context — but a real label element regardless, per the
  no-placeholder-as-label rule).
- Touch targets: trigger `h-10` is under the 48px floor — **exception noted**:
  this is a secondary utility control (matches the visual weight of similar
  footer utility chips elsewhere in the theme, e.g. the certification badges),
  and Shared foundations' 48×48 rule applies to primary/commerce-critical
  controls; if this is judged too small in review, bump to `h-12` — flagged as a
  live tension, not silently resolved. List rows are `h-12` (48px), no exception
  needed there.

## Open questions

1. **`sections/footer.liquid` has no `{% content_for 'blocks' %}` slot.** Unlike
   most sections in this theme, the footer is hand-built with fixed zones
   (brand, two menus, trust row) rather than an `@theme`-block-accepting
   container. This spec adds localization as a **section setting + hardcoded
   render call**, matching how Surface 2's Follow-on-Shop and Surface 7's
   newsletter are speced, rather than as a freely-orderable block — meaning a
   merchant cannot reorder it relative to those other new footer zones without
   a template edit. If footer flexibility is wanted, that's a larger structural
   change to `sections/footer.liquid` outside this brief's scope (the brief
   says not to redesign anything outside the missing-surfaces list).
2. **Header vs. footer placement.** The brief says "typically footer or header
   utility area." This spec picks footer for the same reason Surface 2 did —
   header right-group density, once Surfaces 1 (account) and 2 (optional
   Follow-on-Shop) land, is already tight. If localization is judged
   important enough to need top-of-page discoverability, header placement is
   viable using the same trigger design, just relocated.
3. **Currency-on-trigger.** The trigger currently shows country + language name
   only, not currency. If merchants run multiple currencies per country (or a
   currency selector independent of country), a third label segment or a
   separate control may be needed — not addressed here since Shopify Markets
   typically ties currency to country selection, but flagging in case this
   shop's setup decouples them.
4. **Geolocation redirect banner is a separate, unaddressed surface.** Baymard's
   research (and Shopify's own market behavior) often pairs this picker with a
   "we think you're in X — switch?" banner on first visit. That banner is not
   in the 16-surface list and is not designed here; this spec covers only the
   persistent selector, not an inferred-location prompt.

---

# Surface 15 — "Custom Liquid" section

## What it is / Baymard basis

A section with a single `type: liquid` setting — Shopify's raw-code input,
letting merchants or apps inject arbitrary Liquid/HTML/JS. This is an app/
developer insertion point required for Theme Store approval, not a content
surface; the design need is minimal by the brief's own framing. No Baymard
citation applies — this is a compliance/utility surface, not a shopper-facing
UX decision.

## Files & architecture

- **New section:** `sections/custom-liquid.liquid`.

## Schema settings

| id | type | default | label |
|---|---|---|---|
| `liquid_code` | liquid | *(empty)* | Custom code |

Padding settings follow the theme's existing per-section pattern
(`padding_top`/`padding_bottom`/`padding_left`/`padding_right`, matching
`sections/custom-section.liquid`'s existing convention) so it behaves like every
other section in the page-builder grid.

## Layout & sizing

```liquid
<div class="custom-liquid-section" {{ section.shopify_attributes }}>
  {%- if section.settings.liquid_code != blank -%}
    {{ section.settings.liquid_code }}
  {%- else -%}
    {%- comment %} empty state — theme-editor only {% endcomment %}
    {%- if request.design_mode -%}
      <div class="flex items-center gap-3 p-6 rounded-2xl border border-dashed border-outline-variant bg-card-high">
        {% render 'icon', name: 'code', class: 'text-2xl text-primary/45' %}
        <div class="flex flex-col gap-0.5">
          <p class="text-sm font-bold text-primary">{{ 'custom_liquid.empty_title' | t }}</p>
          <p class="text-xs text-primary/60">{{ 'custom_liquid.empty_description' | t }}</p>
        </div>
      </div>
    {%- endif -%}
  {%- endif -%}
</div>
```

- **Empty state is theme-editor-only** (`request.design_mode`), never shown on
  the live storefront — an empty dashed placeholder box in production would be
  a visible bug, not a helpful hint. Live storefront with no code entered
  renders a genuinely empty `<div>` (effectively invisible, zero height beyond
  padding).
- **"Developer tool" visual treatment** (per the brief's request): the
  theme-editor empty state uses `border-dashed` — the only dashed border
  anywhere in this theme's vocabulary, deliberately, so it reads unmistakably
  as "not a content block" the instant a merchant sees it in the editor,
  distinct from every real (solid-border) card/panel in the system.
- No padding/margin assumptions on the code output itself — whatever the
  injected code renders is the injected code's responsibility; the section
  wrapper contributes only the standard block-padding CSS variables.

## Color tokens

| Part | Token |
|---|---|
| Empty-state border | `border-outline-variant`, `border-dashed` (the one deliberate exception to "borders over shadows, never dashed" — used exactly once, exactly here, to signal "not real content") |
| Empty-state background | `bg-card-high` |
| Empty-state icon | `text-primary/45` |
| Empty-state heading | `text-primary` |
| Empty-state description | `text-primary/60` |

## States

| State | Treatment |
|---|---|
| Code entered | Renders the code as-is, no wrapper styling applied to its output |
| Empty, in theme editor | Dashed placeholder as specified |
| Empty, live storefront | Renders nothing (no placeholder ever reaches a real shopper) |
| Invalid/erroring Liquid | Whatever Shopify's own Liquid-error rendering does at the platform level (typically a visible error comment in editor preview) — this spec adds no custom error handling, since sandboxing/validating arbitrary merchant code is a platform concern, not a design one |

## Responsive

No responsive behavior of its own — the section is a bare content wrapper;
whatever the injected code does at each breakpoint is outside this spec's
control by definition (that's the point of a raw-code insertion point).

## Accessibility

- The empty-state placeholder (editor-only) is decorative context for the
  merchant, not shopper-facing content — no special ARIA needed beyond a
  normal reading order; it never reaches a screen reader on the live site since
  it never renders there.
- Whatever accessibility properties injected code has are the responsibility of
  whoever writes that code (merchant, app, or agency) — explicitly out of this
  section's control, same reasoning as the error-state note above.

## Open questions

None — brief explicitly scopes this as minimal.

---

# Surface 16 — Contact page template

## What it is / Baymard basis

`templates/page.contact.json` — a page template combining Shopify's native
`{% form 'contact' %}` (name/email/phone-optional/message, with
`section.settings` or `form.posted_successfully?` driving confirmation) with
optional supporting-content blocks (map, hours, address) so a merchant can build
a complete contact page without custom code. This template does not currently
exist; `templates/page.json` is the generic fallback every other page uses.

Baymard basis: the same form-friction principles cited for newsletter signup
(Surface 7) apply directly — minimize required fields (name, email, message;
phone genuinely optional, never required), give a clear, unambiguous success
confirmation in place rather than a silent redirect, and use real labels, never
placeholder-as-label. Additionally, Baymard's support/contact research finds
that shoppers trust a contact form more when it sits alongside verifiable
contact information (a real address, phone number, hours) rather than standing
alone as the only way to reach the merchant — which is exactly why this surface
pairs the form with optional address/hours/map blocks rather than shipping the
form in isolation.

## Files & architecture

- **New template:** `templates/page.contact.json` — a `main-page` type section
  hosting the contact form, plus block slots for supporting content.
- **New section:** `sections/contact-form.liquid` — wraps `{% form 'contact' %}`,
  the field set, and the three form states (default, success, error).
- **New blocks**, all optional, added to `sections/contact-form.liquid`'s
  `@theme` block list (or a sibling section below it in the template — see
  layout) so a merchant can compose only what they need:
  - `blocks/contact-address.liquid` — address text + `call`/`mail` rows.
  - `blocks/contact-hours.liquid` — day/hours list.
  - `blocks/contact-map.liquid` — embedded map (merchant-supplied embed URL or
    static image + link-out, see Open questions).
- Composed from `input`, `button`, `icon` (`call`, `mail`, `location_on`,
  `schedule`, `check_circle`, `error`).

## Schema settings

`sections/contact-form.liquid`:

| id | type | default | label |
|---|---|---|---|
| `heading` | text | `t:contact.heading` | Heading |
| `description` | richtext | *(empty)* | Optional intro copy above the form |
| `show_phone_field` | checkbox | `true` | Show optional phone field |

`blocks/contact-address.liquid`:

| id | type | default | label |
|---|---|---|---|
| `address` | textarea | *(empty)* | Address (one line per row) |
| `phone` | text | *(empty)* | Phone number |
| `email` | text | `t:contact.default_email` (defaults to `shop.email`) | Email |

`blocks/contact-hours.liquid`:

| id | type | default | label |
|---|---|---|---|
| `hours_text` | textarea | *(empty)* | Hours (one line per row, e.g. "Mon–Fri: 9–17") |

`blocks/contact-map.liquid`:

| id | type | default | label |
|---|---|---|---|
| `embed_url` | text | *(empty)* | Map embed URL |
| `map_image` | image_picker | *(empty)* | Fallback static map image (used if no embed URL, or if the merchant prefers a static image for performance) |
| `map_link` | url | *(empty)* | "Get directions" link |

## Layout & sizing

**Template structure** (`templates/page.contact.json`), two-column at desktop,
stacked at mobile — form first in DOM order at every width (the primary action),
supporting content second:

```
Desktop (≥840px):
[ Heading ]
[ Description ]
┌─────────────────────┬───────────────────┐
│  Contact form        │  Address           │
│  (name/email/phone/  │  Hours             │
│   message/submit)    │  Map               │
└─────────────────────┴───────────────────┘

Mobile (<840px):
[ Heading ]
[ Description ]
[ Contact form ]
[ Address ]
[ Hours ]
[ Map ]
```

- Page grid: `grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 max-w-screen-xl mx-auto px-4 md:px-6 py-10 md:py-12`.
  Form column wider than the supporting-content column — the form is the
  primary action, supporting content is reference material.
- Heading: `.section-section__heading` convention (serif `h1` here, since this
  is the page's own title, not a section heading — `text-2xl md:text-3xl
  font-bold text-primary`).
- Description (optional `richtext`): `text-sm text-primary/70 max-w-lg mb-6`.

**Contact form** (`sections/contact-form.liquid`):

```
[ Name ]
[ Email ]
[ Phone ]                    ← only if show_phone_field
[ Message — textarea ]
[ Send message ]
```

- `{% form 'contact', class: 'flex flex-col gap-4' %}`.
- Each field via the `input` primitive: `name: 'contact[name]'`,
  `name: 'contact[email]'` (`type: 'email'`, `required: true`),
  `name: 'contact[phone]'` (`type: 'tel'`, not required, only when
  `show_phone_field`), and a textarea variant of the primitive (or a matching
  hand-built `<textarea>` if the `input` primitive doesn't support multi-line —
  flagged in Open questions) for `name: 'contact[body]'`, `rows: 5`, `required: true`.
- Submit: `{% render 'button', label: t:contact.submit, variant: 'primary', as: 'button', attributes: 'type="submit"', class: 'h-12 px-8 self-start' %}` —
  `self-start` (not full-width) at desktop since this is a narrower form
  column, not a full-bleed CTA context; full-width (`w-full`) at mobile.
- Field gap: 16px (`gap-4`), matching the "stacked form fields" value from
  Shared foundations' spacing scale.

**Supporting-content column** — each block is an independent card:

- `blocks/contact-address.liquid`: `p-4 rounded-2xl bg-card-light border
  border-outline-variant flex flex-col gap-3`. Address as plain text (whitespace
  preserved, `text-sm text-primary`), phone row (`call` icon 16px `text-primary/60`
  + `<a href="tel:...">` `text-sm text-primary`), email row (`mail` icon + `<a
  href="mailto:...">`).
- `blocks/contact-hours.liquid`: same card shell, `schedule` icon in the card
  header (`flex items-center gap-2 mb-1`) + heading "Opening hours"
  (`t:contact.hours_heading`), then the hours text as a simple line-per-row list,
  `text-sm text-primary/85`.
- `blocks/contact-map.liquid`: `rounded-2xl overflow-hidden border
  border-outline-variant aspect-[4/3]`. If `embed_url` set: `<iframe>` at full
  width/height of the container, `loading="lazy"`. Else if `map_image` set:
  static image via `snippets/image.liquid` (focal-point aware, per Surface 13),
  with an overlaid `location_on`-icon "Get directions" chip
  (`absolute bottom-3 left-3 h-9 px-3 rounded-full bg-card-light/95 border
  border-outline-variant flex items-center gap-1.5 text-xs font-bold
  text-primary`) linking to `map_link` if set. Else: block renders nothing.
- Cards stack with `gap-4` between them in the supporting column.

## Color tokens

| Part | Token |
|---|---|
| Page heading | `text-primary` |
| Description | `text-primary/70` |
| Form fields | Per `input` primitive |
| Submit button | `bg-accent` / `text-on-accent` |
| Supporting cards | `bg-card-light`, `border-outline-variant` |
| Card icons | `text-primary/60` |
| Card body text | `text-primary` / `text-primary/85` |
| Map "Get directions" chip | `bg-card-light/95`, `border-outline-variant`, `text-primary` |
| Success feedback | `text-primary` + `check_circle` (no green token — Caveat 3) |
| Error feedback | `text-important` + `error` icon |

## States

| State | Treatment |
|---|---|
| Default | Empty form, all fields blank, submit enabled |
| Focus (any field) | Standard input-focus ring per Shared foundations |
| Field validation error (client-side — missing required field, invalid email) | Same pattern as Surface 7: `border-important` on the field, `text-xs text-important` helper line beneath, tied via `aria-describedby` + `aria-invalid` |
| Submitting | Submit button label swaps to `t:contact.submitting` ("Sending…"), `disabled`, `opacity-70`; all fields `disabled` |
| Success | Shopify's native `form.posted_successfully?` becomes true after a full-page POST/redirect (this form does not intercept submission with JS — it uses Shopify's standard server-side contact-form flow, matching the "native contact form" framing in the brief). The **entire form is replaced** by a confirmation block in the same position: `check_circle` icon 24px `text-primary` + `text-base font-bold text-primary` "Message sent" (`t:contact.success_heading`) + `text-sm text-primary/70` "Thanks — we'll get back to you soon." (`t:contact.success_body`). The supporting-content column is unaffected — address/hours/map stay visible whether or not the form just succeeded. |
| Server-side error (Shopify's contact form has no client-visible failure mode under normal use, but network/5xx is possible) | Form remains visible with fields preserved (Shopify repopulates them on error redirect); a `role="alert"` banner appears above the fields: `error` icon + `text-sm text-important` "Something went wrong — please try again." (`t:contact.error_generic`) |
| Map: no `embed_url` and no `map_image` | Block renders nothing, including its card border — never an empty bordered box |
| Address/hours blocks with no content entered | Same rule — render nothing rather than an empty card |

## Responsive

- **Mobile (<840px):** single column, form first, then address, hours, map in
  block order, `gap-6` between the four zones. Submit button `w-full`.
- **Tablet (840–1199px):** two-column grid begins at `md` (840px) per the
  breakpoint table in Shared foundations; column ratio `1.4fr 1fr` may feel
  tight at exactly 840px — acceptable, since the supporting column's cards are
  simple stacked text and don't need much width.
- **Desktop (≥1200px):** as specified, `max-w-screen-xl` caps overall width so
  the form doesn't stretch to an uncomfortable line length on very wide
  viewports.

## Accessibility

- Form: real `<form>` via `{% form 'contact' %}`, every field has a real
  `<label>` via the `input` primitive (or the textarea's equivalent), never
  placeholder-only.
- Required fields marked both visually (a `*` or "(required)" suffix in the
  label — visual-only asterisks alone are insufficient) and programmatically
  (`required` attribute, which also carries `aria-required` semantics in
  modern browsers).
- Success confirmation: since this is a full-page redirect (native Shopify
  contact form, not AJAX), the confirmation content is present on initial page
  load after redirect — no live region needed; standard page-load reading order
  puts the confirmation where the form was, which is the natural place a
  keyboard/screen-reader user's focus/reading position already is after
  submitting. Optionally, set focus to the confirmation heading on load via a
  small inline script gated on `form.posted_successfully?` being true, to make
  the outcome immediately apparent to screen-reader users who don't rely on
  reading order alone (recommended, not strictly required, given the redirect
  already re-anchors the page).
- Supporting-content cards: address/hours are plain readable text, no special
  ARIA. Phone/email links use real `tel:`/`mailto:` hrefs. Map iframe gets a
  `title` attribute describing it ("Map to {{ shop.name }}"); the "Get
  directions" chip is a real link with visible + accessible text (not an
  icon-only control).
- Touch targets: submit button `h-12` (48px) at every width; phone/email links
  in the address card are inline text links (WCAG's inline-link touch-target
  exception applies, matching the exemption already noted in Shared
  foundations for prose links).
- Focus order: heading → description → form fields in visual order → submit →
  (reading order continues to) supporting-content cards. On mobile, where
  supporting content is below the form in DOM order, this is already correct
  by construction; on desktop, where it sits in a second column, confirm DOM
  order still places the form before the supporting column even though they
  render side-by-side, so Tab order matches the "primary action first" intent
  rather than the two-column visual layout.

## Open questions

1. **Does the `input` primitive support a multi-line (`textarea`) variant?**
   Shared foundations only documents `input` with `type` values implying
   single-line fields (`email`, etc.). The message field needs a textarea. If
   the primitive doesn't support one, this surface needs either an extension to
   `input` (add `type: 'textarea'` mapping to a `<textarea>`) or a small
   dedicated `snippets/textarea.liquid` that mirrors its label/error contract.
   Flagged rather than assumed.
2. **Map embed via raw `iframe` src is effectively a second "custom code" input**
   (a merchant pastes a Google Maps embed URL) — lighter-weight than Surface
   15's full custom-Liquid section, but similar in kind. Confirm `url`-type
   schema validation is sufficient guardrail, or whether a stricter mechanism
   (e.g. a `text` field for just an address that the theme itself turns into a
   Google Maps URL, removing the need for the merchant to construct an embed
   URL by hand) is preferred — the latter is more merchant-friendly but commits
   the theme to a specific map provider.
3. **Where do address/hours block settings pull the merchant's real address?**
   This spec defaults `email` to `shop.email` but has the merchant retype the
   physical address and hours by hand into block settings, since Shopify's core
   `shop` object doesn't expose a structured street address or hours natively.
   If the shop has address data elsewhere (e.g. a Location's address, per
   Surface 8's same limitation), pulling from that instead of a duplicate
   manual field would avoid the two ever drifting apart — flagged as the same
   underlying gap Surface 8's Open Questions raise about `location` not
   exposing hours.

---

# Sources

Per the sourcing note at the top of this document, none of the citations below
were pulled from the full paywalled Baymard guideline text — the guideline and
article-detail pages return HTTP 403 to automated fetching in this environment.
Every finding cited across Surfaces 1–16 is drawn from Baymard's public article
summaries, search-surfaced abstracts, or secondary write-ups of Baymard
guidelines, and is named specifically enough in its surface's "What it is /
Baymard basis" section to be re-verified against a full Baymard subscription
before build. The research areas drawn on, by surface:

- **Account creation / guest checkout friction** (Surfaces 1, 5) — checkout
  abandonment attributed to forced account creation and forgotten passwords.
- **Mega-menu / hover-intent and mobile navigation** (Surface 3) — pointer-
  stationary timing before hover-dependent UI appears; mobile menus requiring a
  distinct pattern from desktop mega-menus.
- **Autocomplete / predictive search** (Surface 4) — thumbnail+price+context in
  suggestions; treating empty/loading states as first-class.
- **Recommendation-section differentiation** (Surfaces 9, 10) — near-identical,
  unlabeled recommendation sections eroding trust and being ignored.
- **Cart/checkout price transparency** (Surface 6) — visible discount cause
  (not just a lower number) reducing "is this correct" hesitation.
- **Form friction, single-field forms** (Surfaces 7, 16) — visible labels over
  placeholder-as-label, minimal required fields, clear success/error feedback.
- **Product-page fulfillment/availability information** (Surface 8) — pickup
  and stock information needing to be visible near the purchase decision, not
  buried behind a policy link.
- **Price-list and pricing-clarity** (Surface 12) — unit price scannable at the
  same glance as the main price, not requiring extra parsing or a hover/tap.
- **International UX / localization** (Surface 14) — explicit, visible
  region/language state; searchable long lists; flags as a secondary identifier
  only, never the sole one.
- **Mobile commerce generally** (all surfaces) — ≥48×48px touch targets,
  ≥8px adjacent-target spacing, persistent primary actions, avoiding desktop-
  pattern dropdowns that don't translate to touch.

