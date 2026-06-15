# AI Coding Guidelines for TNT Theme

This project supports both **Light** and **Dark** themes. Follow these rules to ensure any changes maintain theme compatibility.

## 1. Theme Color System (Material Design 3)
Theme colors are configured in the Shopify Customizer under separate "Lys Tema / Light Theme" and "Mørk Tema / Dark Theme" headers. They map to CSS variables in `snippets/css-variables.liquid`:
- Light variables are defined on `:root`.
- Dark variables are defined on `.dark`.

We use a Material Design 3 (MD3) color theme system. The full palette of MD3 tokens (e.g. `--md-sys-color-primary`, `--md-sys-color-surface-container`, etc.) is declared globally. Legacy variables are mapped directly to their MD3 counterparts:
- `--color-primary`: maps to `--md-sys-color-primary` (Primary gold/ochre brand accent)
- `--color-on-primary`: maps to `--md-sys-color-on-primary` (Text/icons on primary color)
- `--color-accent`: maps to `--md-sys-color-tertiary` (Tertiary green accent)
- `--color-on-accent`: maps to `--md-sys-color-on-tertiary` (Text/icons on tertiary color)
- `--color-background`: maps to `--md-sys-color-background` (Page background)
- `--color-card-light`: maps to `--md-sys-color-surface-container` (Cards, panels, headers, sidebars)
- `--color-card-high`: maps to `--md-sys-color-surface-container-high` (Buttons, inputs, dropdowns inside cards)
- `--color-border`: maps to `--md-sys-color-outline-variant` (Dividers, borders)
- `--color-foreground`: maps to `--md-sys-color-on-surface` (Primary text color)

## 2. Best Practices for Tailwind & CSS
- **Do NOT hardcode colors**: Use semantic classes mapped to MD3 variables:
  - Use `bg-card-light` (or `bg-md-surface-container`) instead of `bg-white` / `bg-slate-50` for cards, panels, sidebars, headers, and footers.
  - Use `bg-card-high` (or `bg-md-surface-container-high`) for components that sit *inside* a card/panel.
  - Use `bg-background` (or `bg-md-background`) for page background.
  - Use `text-primary` (or `text-md-on-surface`) instead of `text-slate-900` / `text-black` for body text and headings.
  - Use `text-on-accent` / `text-on-primary` for text sitting on accent/primary backgrounds.
  - Use `border-outline-variant` (or `border-md-outline-variant`) for dividers and borders.
- Tailwind CSS v4 selector-based dark mode is enabled using `@variant dark (&:where(.dark, .dark *));` in `assets/input.css`.
- **Tailwind Color System**: All Tailwind color classes are dynamically mapped to the global theme variables in `assets/input.css` (under `@theme`).
  - Always use classes like `bg-primary`, `text-card-light`, and `border-outline-variant` in preference to arbitrary color overrides (`bg-[#123456]`).
  - If you introduce a new custom color setting, declare it as a CSS variable in `css-variables.liquid` and map it inside the `@theme` directive in `assets/input.css` before using it in templates.
- If you change files that affect CSS styling, compile the output CSS using `cmd /c npm run tailwind:build`.

## 3. Material Design 3 Surface Mapping Reference
Our theme uses a three-tier elevation system to prevent visual blending in dark mode:
1. **Surface (Base)**: `bg-background` (`--color-background` / `--md-sys-color-background`). Used for the main page body background.
2. **Surface Container**: `bg-card-light` (`--color-card-light` / `--md-sys-color-surface-container`). Used for headers, footers, product cards, testimonials, sidebar filters, and modal drawers.
3. **Surface Container High**: `bg-card-high` (`--color-card-high` / `--md-sys-color-surface-container-high`). Used for buttons, variant swatches, inputs, select dropdowns, stepper pills, and payment badges that sit *inside* a Surface Container.

## 4. Git and Deployment Workflow
- **Compilation**: Always build Tailwind CSS after changing styling classes in liquid files by running `cmd /c npm run tailwind:build`.
- **Theme Sync**: Commits pushed to the `main` branch of the remote Git repository (`https://github.com/larsadolfsen/TNT.git`) are automatically deployed to the live Shopify theme (`TNT/main`) via Shopify webhooks.
- **Workflow**:
  1. Make modifications and verify locally.
  2. Run `cmd /c npm run tailwind:build` to compile.
  3. Run `git add .` and commit changes.
  4. Run `git pull --rebase` to integrate remote changes.
  5. Run `git push origin main` to deploy.

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


