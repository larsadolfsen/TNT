# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Shopify Online Store 2.0 theme (Tailwind CSS v4) for `textilogvoksdug.dk`, being prepared for Shopify Theme Store submission. Built on theme blocks/sections (Surface-based architecture), not a legacy static theme.

## Commands

```bash
npm install
npm run dev              # tailwind:watch + `shopify theme dev` concurrently (hot-reload preview)
npm run build             # compile assets/output.css for production (minified)
npm run tailwind:build    # same, one-shot (no watch)
npx shopify theme check   # lint Liquid/JSON — CI runs this on every push via .github/workflows/ci.yml
```

There is no unit test suite/JS test runner in this repo. "Testing" means `shopify theme check` plus manual verification on the live storefront (see Deployment below) — there is no single-test command to run.

**After changing any Tailwind class usage** (new `bg-*`, breakpoint variant, etc. added to a `.liquid`/`.js` file), regenerate `assets/output.css` with `npm run tailwind:build` and commit it — it's a tracked, compiled artifact scanned from `./**/*.{js,json,liquid}`, not generated at deploy time.

## Deployment

This repo pushes directly from GitHub to the live Shopify store — `main` syncs to the published theme "TNT/main" on `textilogvoksdug.dk`. There is no staging theme or build/CI gate in front of the storefront; a push to `main` is a live deploy. `.github/workflows/ci.yml` only runs `theme-check` (lint) on push — it does not deploy and passing it is not evidence the page actually renders correctly (see rules below).

## Project rules

These are load-bearing, not suggestions. **This file is the single source of truth for them** — there is no separate `AGENTS.md`; rules live here and nowhere else.

- **Version bump at merge-to-main time, not per feature-branch push.** Feature branches don't touch the version fields at all — since concurrent sessions each read `main`'s version independently, a shared patch counter races (this happened: 1.0.149→1.0.152 took four bumps for one fix). Instead, run `npm run bump-version` as the last step before pushing to `main` — it derives a date-time version (`1.<YYYYMMDD>.<HHMM>`) from the current time and writes it into all three of `package.json`, `config/settings_schema.json`'s `theme_version`, and `package-lock.json` (its two root `version` fields) in one commit. Since `main` merges are already serialized one-at-a-time (see "Build in parallel, land one at a time" below), and the value is derived from wall-clock time rather than incremented from a shared base, there's nothing left to collide on. `theme_version` is what the Shopify dashboard shows.
- **No `!important`** in CSS. Resolve specificity via CSS variable scoping or selector structure instead.
- **No `[!IMPORTANT]` alert boxes** in markdown artifacts.
- **Build in parallel, land one at a time, verify each before the next.** Agents may develop many features concurrently in separate worktrees — that part is fine and fast. But merging to `main` is a queue, not a batch: push ONE feature, wait for the user to confirm it works in a browser, then push the next. Never merge several unverified features in one go.
  - `theme-check` passing is **not** verification. It proves the Liquid parses, not that the page works. Every bug found on 2026-08-05 (100x pricing, clipped mobile header icons, broken newsletter HTML, dead predictive search) passed theme-check cleanly — all logged in `docs/failure-log.md`.
  - The point is attribution: when one change lands at a time, a regression has exactly one possible cause. Batched, you cannot tell which of sixteen surfaces broke it — and a systemic mistake gets copied into every file before anyone notices.
  - When something can only be verified by the user (anything visual, anything on the live storefront), say precisely what to open and what to look for, then stop and wait. Don't queue more merges behind an unverified one.
- **Finished work does not sit stranded on a branch — but in this repo, merging needs the user's go-ahead.** The general rule is to end a job by merging its feature branch into `main` and pushing to `origin`, *as long as `main` is not the production/live theme*. Here that condition does not hold: per Deployment above, `main` **is** the live storefront, so a merge is a live deploy. Finish the work, push the branch, then say what to verify and wait for an explicit go-ahead before merging.
- **Use your own git worktree.** Multiple sessions run against this repo concurrently. Never create or switch branches in the primary checkout — doing so yanks the working directory out from under another session and can land its commits on your branch. `git status` showing clean is not proof no session is active there.
- **Log every bug in `docs/failure-log.md`.** Whenever a bug is found — reported by the user or spotted by an agent — add an entry in the *same commit as its fix*: take the next free `F-NNN`, insert it at the top of `## Entries`, add a row at the top of the index table, and fill all five fields (Symptom / Root cause / Fix + commit sha / Prevention, plus the date·reach·area line). "Root cause" means the actual mechanism, not a restatement of the symptom. Read the log *before* debugging anything that feels familiar — its `## Recurring patterns` section lists the mistakes this codebase repeats, and it is the reason the file exists, so extend it whenever a new entry is a pattern's second instance. Never delete an entry; if a fix is later reverted or superseded, append an `**Update YYYY-MM-DD:**` line to it.
- **Single-purpose files.** Keep UI markup, JS behavior, and business/pricing logic in separate files rather than combined. Split a component (layout + interaction + data formatting) into small composable pieces instead of growing one file to do everything.
- **Componentize down to primitives.** Icons, buttons, inputs, badges, price displays etc. each live in their own snippet, used via `{% render %}` — never re-inline their markup at call sites (e.g. all icons go through `{% render 'icon', name: '...' %}`, never a raw inline `<svg>`).
- **No hardcoded user-facing text.** Copy/labels/headings should be theme settings (schema `settings`), not hardcoded strings, so merchants can translate/edit them from the theme editor.

## Architecture

### Directory roles

Standard Shopify OS 2.0 layout: `sections/` (modular full-width page components, each with a `{% schema %}`), `blocks/` (nestable UI components used inside sections via theme blocks — the primary composition unit here), `snippets/` (shared Liquid partials, no schema), `templates/` (JSON page compositions), `layout/theme.liquid` (page shell), `config/` (theme settings schema + `settings_data.json` merchant values), `locales/`, `assets/` (JS/CSS, one file per concern).

### Theme blocks pattern

Sections and blocks use Shopify's native theme block nesting (`{% content_for 'blocks' %}`, `block.shopify_attributes`, `{{ block.id }}`). Shopify auto-wraps each rendered block in a `div#shopify-block-{{ block.id }}.shopify-block`; a block's own `{% style %}` targets that wrapper by ID to size/position it, while the block's own markup renders as a child *inside* that wrapper. When editing a block's box model, remember there are two boxes in play — the auto-wrapper (styled via `#shopify-block-{{ block.id }}.shopify-block` in the `{% style %}` tag) and the block's own root element (styled via its `class`/inline `style` in the markup) — a hardcoded pixel size on the inner element will not automatically respect padding declared on the outer wrapper; use `100%`/`calc()` against a shared CSS custom property instead so the two stay in sync.

### Header (`sections/header-2.liquid`)

Composed from nestable blocks: `header-row-2` (a horizontal row; `row_height` schema setting, currently 56px) → `header-group` (flex container with left/center/right alignment) → leaf blocks (`header-hamburger`, `header-logo`, `header-search`, `header-search-icon`, `header-cart`, `header-account`, `header-navigation`, `header-follow-on-shop`). Row height flows down via the `--row-height` CSS custom property, read by `header-group` to compute its own content-box height (`calc(var(--row-height) - <2x row padding>)`). Actual block instance data/config (which blocks are on the store's header, in what order, with what settings) lives in `sections/header-group.json` — a Shopify-managed file (auto-generated banner at the top) but part of the live config, safe to hand-edit for merchant-facing changes like block order or settings values.

### Icon system (`snippets/icon.liquid`)

Single entry point for all icons — a Lucide sprite (`snippets/icon-sprite.liquid`) referenced via `<use>`. Sizing follows font-size (`1em` square) rather than width/height props. `button: true` fixes a clickable icon to a 44×44px touch target (WCAG) via `content-box` padding around a fixed glyph — the glyph is inset from the button's edge by that padding, so a button meant to sit flush against a layout edge needs that padding accounted for (e.g. an offsetting negative margin) if pixel-perfect edge alignment with adjacent non-button content matters.

### Design tokens / theming (`snippets/css-variables.liquid`, `assets/input.css`)

Colors are CSS custom properties set from `settings_*_light`/`settings_*_dark` theme settings — light values on `:root`, dark values on `.dark` (toggled via a `dark` class on `<html>`, driven by `localStorage` + `prefers-color-scheme`, see `layout/theme.liquid`). `assets/input.css`'s `@theme` block maps these variables to Tailwind utility classes (`bg-primary`, `text-on-accent`, `border-outline-variant`, etc.). Per `ai.md`: prefer the semantic classes (`bg-card-light`, `bg-card-high`, `bg-background`) over hardcoded `bg-white`/`text-black`/arbitrary hex values, since those bypass dark-mode theming — `bg-card-light` for headers/cards/panels/drawers, `bg-card-high` for controls nested inside a card, `bg-background` for page/section backgrounds. New custom colors must be declared in `css-variables.liquid` and mapped in `input.css`'s `@theme` before use.

### Typography system (`snippets/text-style.liquid`, `.type-*` in `assets/input.css`)

Two layers. **Layer 1** is a set of CSS primitives in `input.css` named after *size*, not function: seven sizes (`.type-3xl` 48px → `.type-xs` 12px) plus eight modifiers (`.type-medium/strong/bold`, `.type-caps`, `.type-serif`, `.type-muted/faint/error`). A size class sets `font-size` and its line-height and nothing else; colour, weight, case and family are modifiers; margins and widths stay at the call site. Values come from `--type-*` tokens in `css-variables.liquid` — prefixed because Tailwind v4 already owns `--text-xl`/`--text-2xl`/`--text-3xl` at *different* values, so reusing those names would silently resize every existing `text-xl` in the theme.

**Layer 2** is `{% render 'text-style', role: '…' %}`, which prints the class string for a semantic role (`title-page`, `title-card`, `body-strong`, `caption`, `label`, `badge-label`, `error`, …). Call sites say what the text *is*; the CSS says how big it is. `role: 'body'` prints nothing on purpose — 14px/400/full colour is inherited, so plain body text carries no class. An unknown role degrades to body text rather than to unstyled markup.

Text colour is three tokens (`--color-text`, `--color-text-muted`, `--color-text-faint`) replacing the nine ad-hoc `text-primary/NN` opacity levels the theme accumulated. They point at `--color-primary`, which `.dark` already swaps, so they need no dark-mode counterpart. A badge is a *surface* (`.type-badge`), not a text style — its content is the same `.type-xs .type-bold .type-caps` label used elsewhere, so 12px exists in exactly one place.

Migration is in progress: the old Tailwind `text-*` utilities and the new system coexist. See `docs/typography-inventory.md` for what is left and `docs/typography-specimen.html` for the specimen.

### Collection filters (`snippets/collection-filter-list.liquid`)

The theme owns no filter taxonomy — every filter on the collection page comes from `collection.filters` (rendered via `{%- render 'collection-filter-list', filters: collection.filters -%}` in `sections/main-collection.liquid`), which is Shopify's native storefront filtering, populated in admin from Search & Discovery. Which filters exist, their order, labels, values, and swatch colours are all admin data; the snippet's only job is presentation (accordion, swatch circle, checkbox row, price range). Swatch colours render from `value.swatch.color`/`value.swatch.image`, never guessed or looked up from the label. Value labels render as `value.label`, unmodified. See `docs/superpowers/specs/2026-08-14-collection-filters-metafield-driven-design.md` for the full history and `docs/failure-log.md` F-033–F-035 for the bugs this replaced.

### Grid layout (`.grid-layout`)

Responsive grids use the `.grid-layout` utility with per-child CSS custom properties (`--span-mobile`, `--span-expanded`, `--span-large`) set inline, rather than Tailwind's `grid-cols-*`/`col-span-*` utilities directly — see `assets/input.css` for the underlying `--section-span-*` variables.

### JS

Vanilla JS, one file per concern in `assets/` (e.g. `header.js` for header interactions, `header-cart.js` for the cart drawer, `navigation.js` for the nav dropdowns, `predictive-search.js`, `collection-infinite-scroll.js` for auto-loading the next page of collection products), loaded via `<script src="{{ '...' | asset_url }}" defer>` from the section/block that needs it — no bundler.

## Docs worth knowing about

- `docs/failure-log.md` — maintained record of every bug found, with root cause, fix and the rule that prevents a repeat, plus a `Recurring patterns` digest. Maintaining it is a project rule (see above), not optional.
- `docs/optimization-master-plan.md` — the active project plan (phases, parallelization rules, task tiers by model).
- `docs/typography-inventory.md` — optælling af alle tekst-styles i temaet (størrelse, vægt, linjehøjde, knibning, versaler), inkl. fuld placeringsliste over alt under 14px. Inventar, ikke plan.
- `docs/typography-specimen.html` — before/after-specimen for typografisystemet. Del 1 viser de 74 nuværende varianter med de klassestrenge der faktisk står i koden; Del 2 viser `.type-*`-systemet med rolletabellen. Åbn den i en browser; den er selvstændig og kræver ingen server.
- `docs/component-decomposition-backlog.md`, `docs/missing-designs-brief.md`, `docs/missing-surface-designs.md`, `docs/theme-store-compliance-brainstorm.md` — scoped work backlogs.
- `docs/testing-workflow.md` — how live-server verification works for this store, and the (blocked) fallback path for pushing to a theme via the Admin GraphQL API (`themeFilesUpsert`) when no local Shopify CLI auth is available.
