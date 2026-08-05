# AI Coding Guidelines for TNT Theme

This project supports both **Light** and **Dark** themes. Follow these rules to ensure any changes maintain theme compatibility.

## 1. Theme Color System
Theme colors are configured in the Shopify Customizer under separate "Lys Tema / Light Theme" and "Mørk Tema / Dark Theme" headers. They map to CSS variables in `snippets/css-variables.liquid`:
- Light variables are defined on `:root`.
- Dark variables are defined on `.dark`.

### Color Roles:
- `--color-primary`: Brand primary color (typically black/dark blue in Light mode, white in Dark mode).
- `--color-on-primary`: Text/foreground color on top of a primary background.
- `--color-accent`: CTA/Highlight color (typically yellow `#FFD814` in both modes).
- `--color-on-accent`: Text/foreground color on top of an accent background.
- `--color-background`: Main page background color.
- `--color-card-light`: Card/Panel background color (white in Light mode, slate/dark in Dark mode).
- `--color-card-high`: Elevated card background color (light grey in Light mode, elevated slate in Dark mode). Used for inputs, swatches, and steppers inside cards.
- `--color-border`: Border and divider color.

## 2. Best Practices for Tailwind & CSS
- **Do NOT hardcode `bg-white` or `text-slate-900` / `text-black`** on panels, cards, drawers, inputs, or headers. Use semantic classes instead:
  - Use `bg-card-light` instead of `bg-white` for cards, headers, footers, modal panels, and sidebars.
  - Use `bg-card-high` for buttons, inputs, dropdowns, stepper pills, and swatches that sit *inside* a card/panel. This prevents them from blending into the card background.
  - Use `bg-background` for section/page backgrounds.
  - Use `text-primary` instead of `text-slate-900` / `text-black` for main headings and text.
  - Use `text-on-accent` on any element styled with `bg-accent` or `bg-secondary` (e.g. primary buttons, savings badges) to ensure text remains readable.
  - Use `text-on-primary` on any element styled with `bg-primary` (e.g. filter buttons, cart badges) to ensure text remains readable.
  - Use `border-outline-variant` or `border-slate-200` (mapped to `--color-border`) for borders.
- Tailwind CSS v4 selector-based dark mode is enabled using `@variant dark (&:where(.dark, .dark *));` in `assets/input.css`.
- **Tailwind Color System**: All Tailwind color classes are dynamically mapped to the global theme variables in `assets/input.css` (under `@theme`).
  - Always use classes like `bg-primary`, `text-card-light`, and `border-outline-variant` in preference to arbitrary color overrides (`bg-[#123456]`).
  - If you introduce a new custom color setting, declare it as a CSS variable in `css-variables.liquid` and map it inside the `@theme` directive in `assets/input.css` before using it in templates.
- **Avoid Redundant Styles & Markup**: Keep the code as lean and clean as possible:
  - Avoid adding unnecessary/redundant utility classes (such as adding `shadow-none` to an element that has no shadow by default).
  - Avoid nesting unnecessary `div` elements; keep the HTML markup flat and semantic where possible.
- If you change files that affect CSS styling, compile the output CSS using `cmd /c npm run tailwind:build`.

## 3. Material Design 3 Surface Mapping Reference
Our theme uses a three-tier elevation system to prevent visual blending in dark mode:
1. **Surface (Base)**: `bg-background` (`--color-background`). Used for the main page body background.
2. **Surface Container**: `bg-card-light` (`--color-card-light`). Used for headers, footers, product cards, testimonials, sidebar filters, and modal drawers.
3. **Surface Container High**: `bg-card-high` (`--color-card-high`). Used for buttons, variant swatches, inputs, select dropdowns, stepper pills, and payment badges that sit *inside* a Surface Container.

## 4. Git and Deployment Workflow
- **Compilation**: Always build Tailwind CSS after changing styling classes in liquid files by running `cmd /c npm run tailwind:build`.
- **Workflow**:
  1. Make modifications and verify locally.
  2. Run `cmd /c npm run tailwind:build` to compile.
  3. Run `git add .` and commit changes.
  4. Run `git pull --rebase` to integrate remote changes.
  5. Push commits to the remote repository to deploy.

## 5. CSS Customization & Specificity Guidelines
- **Global CSS Variables & Defaults**: Define core style values as CSS variables globally (on `:root` or `.dark` in `snippets/css-variables.liquid`). Component stylesheets should reference these variables (with optional fallbacks).
- **Scope Overrides for Customization**: When sections or blocks have custom settings (e.g. customized text/background colors or spacing configured in the Shopify Customizer), apply these customizations by overriding the CSS variables locally on the section or block wrapper:
  ```html
  <!-- Section level override -->
  <div style="--color-background: {{ section.settings.custom_bg_color }};">
  ```
  This allows all child elements to inherit the customized styling automatically without repeating CSS declarations or hardcoding colors inline on every child.
- **Avoid `!important`**: Do NOT use `!important` to force style changes. Instead, manage specificity using CSS variable scoping overrides, clean selector hierarchy, or proper utility sequencing.

## 6. Grid Layout System
- **Use `.grid-layout` for standard page grids**: Instead of writing custom Tailwind grid classes (e.g., `grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12`), use the predefined `.grid-layout` class.
- **Set Responsive Column Spanning using Variables**: Control child column spans by setting CSS variables inline instead of using standard Tailwind classes (like `col-span-2 lg:col-span-4`):
  ```html
  <div class="grid-layout">
    <div style="--span-mobile: 4; --span-expanded: 4; --span-large: 6;">
      <!-- Spans 4 columns on mobile/tablet, 6 on desktop -->
    </div>
  </div>
  ```

## 7. Content Customization & Shopify Settings
- **Avoid Hardcoded Text**: All user-facing text, headings, labels, button text, and copy should be exposed as customizable settings in the section/block schema (`settings` in JSON schema) instead of being hardcoded in liquid templates. This enables merchants to easily translate, customize, and edit the copy directly from the Shopify theme editor.
