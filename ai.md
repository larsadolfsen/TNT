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
- `--color-border`: Border and divider color.

## 2. Best Practices for Tailwind & CSS
- **Do NOT hardcode `bg-white` or `text-slate-900` / `text-black`** on panels, cards, drawers, inputs, or headers. Use semantic classes instead:
  - Use `bg-card-light` instead of `bg-white` for cards, headers, modal panels, and inputs.
  - Use `bg-background` for section/page backgrounds.
  - Use `text-primary` instead of `text-slate-900` / `text-black` for main headings and text.
  - Use `text-on-accent` on any element styled with `bg-accent` (e.g. primary buttons) to ensure text remains readable.
  - Use `text-on-primary` on any element styled with `bg-primary` (e.g. secondary/filter buttons).
  - Use `border-outline-variant` or `border-slate-200` (mapped to `--color-border`) for borders.
- Tailwind CSS v4 selector-based dark mode is enabled using `@variant dark (&:where(.dark, .dark *));` in `assets/input.css`.
- If you change files that affect CSS styling, compile the output CSS using `cmd /c npm run tailwind:build`.
