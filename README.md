# TNT — Shopify Theme

A Tailwind CSS v4-based Shopify Online Store 2.0 theme with light/dark mode support, being prepared for Shopify Theme Store submission.

## Getting started

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) – helps you download, upload, preview themes, and streamline your workflows

### Installation

```bash
npm install
```

### Development

Start Tailwind CSS in watch mode and run the Shopify theme development server:

```bash
npm run dev
```

### Build

Compile the CSS for production:

```bash
npm run build
```

## Theme architecture

```
.
├── assets          # Stores static assets (CSS, JS, images, fonts, etc.)
├── blocks          # Reusable, nestable, customizable UI components
├── config          # Global theme settings and customization options
├── layout          # Top-level wrappers for pages (layout templates)
├── locales         # Translation files for theme internationalization
├── sections        # Modular full-width page components
├── snippets        # Reusable Liquid code or HTML fragments
└── templates       # Templates combining sections to define page structures
```

## Project docs

- [`docs/optimization-master-plan.md`](./docs/optimization-master-plan.md) – Master plan tracking development phases and optimization tasks
- [`docs/component-decomposition-backlog.md`](./docs/component-decomposition-backlog.md) – Backlog of components awaiting decomposition into reusable blocks
- [`docs/grid-to-flexbox-migration.md`](./docs/grid-to-flexbox-migration.md) – Plan for migrating CSS Grid layouts to Flexbox
- [`docs/missing-designs-brief.md`](./docs/missing-designs-brief.md) – Design mockups and requirements for missing sections
- [`docs/theme-store-compliance-brainstorm.md`](./docs/theme-store-compliance-brainstorm.md) – Theme Store submission requirements and compliance tracking

## Project rules

Internal work follows the guidelines in [`.agents/AGENTS.md`](./.agents/AGENTS.md) and this repository's optimization master plan.

## License

Licensed under the MIT License. See [LICENSE.md](./LICENSE.md) for details.
