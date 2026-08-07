# Task 4 — Q14 locale key pruning

Repo: Shopify theme. Locale files: `locales/en.default.json` +
`locales/da.json` (check which locale files actually exist with ls before
assuming).

Six keys in `locales/en.default.json` were found unreferenced by any
`.liquid`/`.js`/`.json` file outside `locales/` (verified 2026-08-07):

- `customers.login.email`
- `customers.login.password`
- `customers.login.submit`
- `customers.login.title`
- `collections.title`
- `contact.heading`

## Do

1. Re-verify each key is unreferenced RIGHT NOW (the repo has changed since
   the audit): for each, grep the whole repo (excluding `locales/`) for the
   dotted key path (e.g. `customers.login.email`) AND for the tail segment
   used with a `t:` prefix or `| t` filter in liquid (e.g.
   `'customers.login.email' | t`, `t:customers.login.email`). Show the grep
   commands + empty results in your report. If ANY key has a reference, leave
   that key in place and note it.
2. Delete the verified-dead keys from EVERY locale file that carries them
   (en.default.json and any sibling), including now-empty parent objects
   (e.g. if `customers.login` becomes empty, remove `customers.login`; if
   `customers` becomes empty, remove it too). Keep the files valid JSON —
   validate with a JSON parse after editing (node -e or python).
3. The `customers.login.*` cluster relates to a customer login page. Confirm
   and state in your report: `templates/customers/` does not exist in this
   theme (so no theme-owned login markup references these keys). Do NOT
   create any templates — just record the fact. (Theme Store requirement for
   customer templates is tracked separately.)
4. Bump `package.json` `"version"` by one patch.
5. Commit (do NOT push).

## Constraints

- Files: `locales/*.json`, `package.json` (version only).
- No other changes.
