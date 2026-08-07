# Testing workflow (Wave 0 — T0.1)

How every task's "test on the live server" step actually runs. The store is
not serving customers yet, so pushing directly to the published theme is
acceptable (see `optimization-master-plan.md`, principle 2).

## Store

- Store: `textilogvoksdug.dk` (myshopify domain: shopify.textilogvoksdug.dk)
- Published theme: **TNT/main** — `gid://shopify/OnlineStoreTheme/191515623757`
- Unpublished: Horizon — `gid://shopify/OnlineStoreTheme/190460559693`
  (note: contains a leftover comment-only `snippets/ccr-push-probe.liquid`
  from verifying API write access; delete it from the admin at leisure —
  file deletion via API is blocked by safety policy)

## From this remote environment (no CLI auth available)

**Writes to the published (MAIN) theme are hard-blocked by the MCP server's
safety policy — `themeFilesUpsert` works on unpublished themes only**
(verified 2026-08-05: upsert to the unpublished Horizon theme succeeded;
upsert to TNT/main was refused). The working flow is therefore:

1. One-time manual step: in Shopify admin → Online Store → Themes,
   **duplicate TNT/main** to create an unpublished staging copy (e.g.
   "TNT/staging"). Record its theme ID here when created.
2. Each task pushes its changed files to the staging theme via
   `themeFilesUpsert` and verifies on the staging theme's preview URL.
3. Publishing the staging theme (when desired) is a manual admin action —
   theme-publish mutations are also blocked from here.

Push changed files via the Admin GraphQL API (`themeFilesUpsert`):

```graphql
mutation {
  themeFilesUpsert(
    themeId: "gid://shopify/OnlineStoreTheme/191515623757",
    files: [{ filename: "sections/foo.liquid",
              body: { type: TEXT, value: "..." } }]
  ) { upsertedThemeFiles { filename } userErrors { field message } }
}
```

- Push only the files changed by the task being verified, then check the
  storefront/theme editor.
- File DELETIONS cannot be done via the API from here (policy-blocked) —
  removals must be mirrored manually in the admin or via CLI locally.
- Binary assets need `body: { type: BASE64, value: ... }`.

## From a local machine (preferred when available)

```bash
npm install
npm run dev        # tailwind watch + shopify theme dev (hot-reload preview)
npm run build      # rebuild assets/output.css before committing CSS changes
npx shopify theme check
```

## Baselines (Wave 0 — T0.2)

- `docs/baselines/2026-08-05-theme-check-baseline.txt`:
  **92 files, 39 offenses (12 errors, 27 warnings).**
  Errors: `ImgWidthAndHeight` ×11 (also a CLS/Lighthouse risk),
  `ParserBlockingScript` ×1 (`masonry.js` via `script_tag`).
- Lighthouse baseline: NOT captured from this environment — the storefront
  isn't reachable through the container's proxy. Run from a local machine
  (`npx lighthouse` or PageSpeed Insights against the storefront URL,
  home/collection/product, mobile+desktop) and drop results in
  `docs/baselines/`.

## Rules that apply to every push

- Bump the patch version in `package.json` AND
  `config/settings_schema.json` before every `git push` (see
  `.agents/AGENTS.md`).
- After merging parallel-track work, run `npx shopify theme check` and
  compare against the baseline — no new errors allowed.
