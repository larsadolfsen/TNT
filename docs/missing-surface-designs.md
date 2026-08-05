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
Per `.agents/AGENTS.md` this is mandatory, not stylistic.

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
  contents. Kept separate per `.agents/AGENTS.md` (markup vs. block wiring).
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
  accordion toggling. Per `.agents/AGENTS.md`, behavior does not live inline in the
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
<!-- CHUNK-END -->
