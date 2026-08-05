# Project Rules

- Always bump the patch version in **both** `package.json` and `config/settings_schema.json` before every `git push`. Increment the last number in each (e.g. `1.0.23` → `1.0.24` and `0.1.23` → `0.1.24`) and include both changes in the commit. The `theme_version` field in `settings_schema.json` is what the Shopify dashboard displays.
- Do not use `!important` in CSS styles.
- Do not use `[!IMPORTANT]` alert boxes in markdown artifacts.
- Each file (section, block, snippet, JS/CSS asset) should have a single, clear purpose. Don't grow one file to handle multiple unrelated concerns — e.g. keep UI markup, cart/JS behavior, and pricing/business logic in separate files rather than combining them. When a component needs several concerns (layout, interaction, data formatting), split it into small composable pieces (a block per UI element, JS extracted to its own asset or snippet, etc.) instead of one large file. This applies from the start to new components, not just as a later cleanup pass.

