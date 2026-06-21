# Project Rules

- Always bump the patch version in **both** `package.json` and `config/settings_schema.json` before every `git push`. Increment the last number in each (e.g. `1.0.23` → `1.0.24` and `0.1.23` → `0.1.24`) and include both changes in the commit. The `theme_version` field in `settings_schema.json` is what the Shopify dashboard displays.
