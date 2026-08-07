# Task 7 (batch 2) — Q8: migrate raw material-symbols markup to icon.liquid

`snippets/icon.liquid` is the theme's icon primitive (read its `{% doc %}`
first — params: `name` required; optional `class`, `label`, `style`,
`attributes`). Its own rule: icon usage always goes through the snippet.
These files still inline `<span class="material-symbols-outlined">…</span>`:

- `snippets/breadcrumbs-nav.liquid` (14 occurrences)
- `snippets/breadcrumbs-mobile-link.liquid`
- `sections/collection-subcollections.liquid`
- `sections/collections.liquid`
- `sections/main-collection.liquid`
- `blocks/product-price.liquid`
- `blocks/accordion.liquid`
- `blocks/product-accordions.liquid`

## Migration rule (mechanical, per occurrence)

For each inline span:

1. Icon name = the span's text content → `name:`.
2. Every class OTHER than `material-symbols-outlined` → `class:` (verbatim,
   same order).
3. `aria-label="X"` present → `label: 'X'`. `aria-hidden="true"` present or
   no aria attribute → omit `label` (the snippet emits aria-hidden itself).
4. `style="..."` → `style:` verbatim.
5. Any OTHER attribute (id, data-*, title, onclick, …) → pass through
   `attributes:` verbatim as one string.
6. Result: `{% render 'icon', name: '...', class: '...' %}` etc.

CAUTION — cases that are NOT mechanical; handle explicitly and list each in
your report:

- A span whose text content is a LIQUID EXPRESSION (e.g.
  `{{ some_var }}`): pass the expression to `name:` without quotes
  (`name: some_var`) — check the surrounding code to get the variable right.
- A span inside a `{% capture %}` or used in a JS template string in an
  inline <script>: `{% render %}` works inside capture; but if the span
  markup lives inside a JavaScript string (JS building HTML), LEAVE IT
  UNCHANGED and list it as a deliberate skip — JS-built markup can't call
  Liquid at runtime.
- A span with conditional Liquid INSIDE its attributes (e.g.
  `class="{% if x %}a{% endif %} b"`): keep the conditional inside the
  `class:` argument only if it stays a single expression; otherwise assign
  the class string to a variable with `{% capture %}`/`{% assign %` just
  above and pass that. Show one example in the report.

## Verification

- `grep -rn "material-symbols" --include=*.liquid .` — after the change, the
  ONLY hits outside `snippets/icon.liquid` must be either (a) inside JS
  strings you deliberately skipped, or (b) CSS selectors (e.g. a
  `.material-symbols-outlined` rule in a {% style %} block) — list every
  surviving hit with its justification.
- Occurrence accounting: report a table of file → spans found → spans
  migrated → spans skipped (with reason).
- `node --check` is N/A (liquid); instead run
  `npx --yes @shopify/cli theme check --path .` and compare error/warning
  count against the parent commit (2f4e846) — must be no worse. (This
  command is known to work in this environment; a prior reviewer ran it.)
- Rendering identity is deferred to the controller's browser check; say so.

## Constraints

- Files: the 8 listed liquid files + `package.json` (version bump one
  patch). If you find a 9th file with inline material-symbols markup, list
  it in the report but do NOT touch it.
- Commit when done (do NOT push).
