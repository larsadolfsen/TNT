# Handoff — Wave 3 tasks 5–9 browser verification

Written 2026-08-07 by the session that was interrupted partway. A second
session was started accidentally with the same prompt; this file is for that
session. **Read this before doing anything** — several premises in the
original prompt have already changed.

## Git state — do this first

Worktree: `C:\Users\adolf\Documents\GitHub\TNT\.claude\worktrees\basis-map-7d9c81`
Branch: `claude/wave3-tasks-5-9-verify-862312`, currently at `8f7ce5c`.

`origin/main` (`f1c974e`, v1.0.110) has **already been merged into this
branch**. Do not merge it again — check with:

```powershell
cd C:\Users\adolf\Documents\GitHub\TNT\.claude\worktrees\basis-map-7d9c81; git log --oneline -3
```

Two commits exist on this branch:

- `776137d` — the storefront-blocker note. **Already merged to main.** Its
  content is now false and step 1 below deletes it.
- `acb1a95` — `docs/superpowers/specs/2026-08-07-r2-card-consolidation-design.md`,
  a design spec for task 10 (R2). Written before the user said task 10 gets
  its own session. **Leave it alone** — it is committed, it is not task 10
  implementation, and it is worth keeping. Mention it to the user at the end.

## Environment gotchas — these cost time to rediscover

1. **The in-app Browser MCP (`mcp__Claude_Browser__*`) cannot take
   screenshots** in this session. Every `computer{action:"screenshot"}` call
   fails with "the Browser pane is not displayed, so the page is not
   compositing frames." Its `read_page`, `get_page_text`, `javascript_tool`,
   `read_console_messages` and `read_network_requests` all work fine.
2. **Use the Playwright MCP instead** (`mcp__plugin_playwright_playwright__*`)
   — it screenshots headlessly and works. Load it with one ToolSearch call:
   `select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_take_screenshot,mcp__plugin_playwright_playwright__browser_resize,mcp__plugin_playwright_playwright__browser_console_messages,mcp__plugin_playwright_playwright__browser_network_requests,mcp__plugin_playwright_playwright__browser_click,mcp__plugin_playwright_playwright__browser_snapshot,mcp__plugin_playwright_playwright__browser_evaluate,mcp__plugin_playwright_playwright__browser_wait_for`
3. **Playwright writes screenshots to the worktree root, not to
   `.playwright-mcp/`**, despite what its result message implies. Pass a
   `filename` and then `Read` the file at the worktree root.
4. `shopify theme dev` is not needed and does not help — it demanded the store
   password even when the CLI was authenticated. Verify against the live
   storefront directly.

## Untracked artifacts to clean up before committing

```powershell
cd C:\Users\adolf\Documents\GitHub\TNT\.claude\worktrees\basis-map-7d9c81; Remove-Item -Recurse -Force .playwright-mcp; Remove-Item -Force t9-desktop-home.png, t9-desktop-cartdrawer-empty.png
```

Add more `Remove-Item` entries for any screenshots you take. Nothing under
`.playwright-mcp/` or any `*.png` at the worktree root should be committed —
`.gitignore` does not cover either.

## Step status against the user's four instructions

| Step | Status |
|---|---|
| 1. Delete the two "blocked" sections | **NOT DONE** |
| 2. Run tasks 5–9 checklists | **PARTIAL** — task 9 only, partway |
| 3. Task 9 specifics (both scripts load, drawer/search/cart) | **PARTIAL** — see below |
| 4. Flip statuses, record, commit, ask before push | **NOT DONE** |

### Step 1 — exact locations

- `docs/wave3-batch.md:71` — the section `### Blocked — storefront is
  password-protected (2026-08-07)`, running to just before `### 1 — Mobile
  menu: remove accordions`.
- `.superpowers/sdd/progress.md:94` — the section `## Browser verification of
  tasks 5–9 — attempted, blocked (2026-08-07)`, running to just before
  `## Minor findings deferred to final review`.

Both are false now. Password protection is off and the storefront serves the
real site.

## Verification results so far — all task 9, all PASS

Storefront confirmed live: `https://shopify.textilogvoksdug.dk` returns title
`textilogvoksdug.dk` and the real nav (Tekstilduge / Voksduge / Bolig), not
the lock page.

**Both scripts load — the thing the user specifically flagged.** Fetched at
runtime from the homepage:

- `header.js` → **200**
- `header-cart.js` → **200**

No 404, so the silent-cart-death failure mode did not happen.

**All seven globals are defined** (`typeof === 'function'`):
`toggleMobileMenu`, `toggleSearchInput` from `header.js`; `addToCart`,
`changeQuantity`, `removeItem`, `updateCartUI`, `toggleCartDrawer` from
`header-cart.js`.

**All three new snippets render.** `#mobile-menu-drawer`, `#cart-drawer` and
`#header-cart-config` are all present in the DOM. The config island parses and
carries `"moneyFormat": "{{amount_with_comma_separator}} kr"` — matching what
`.superpowers/sdd/progress.md` recorded from the Admin API.

**Console clean on the homepage:** 0 errors. One warning, and it is *not*
theme code — a `shop.app/pay/assets/sprite.svg` preload warning from
Shopify's own accelerated-checkout iframe. Do not report it as a regression.

**Cart drawer opens at desktop (1280×900)** on clicking the header cart icon.
Screenshot showed: title "Din Indkøbskurv", close X, empty-state basket icon,
**"Din indkøbskurv er tom."** — proper Danish, not a raw `cart.…` key, which
was an explicit check in the task 2 checklist. Subtotal reads **`0,00 kr`** —
comma decimal separator, correct for the Danish format, so the
`amount_with_comma_separator` path is working. Footer shows "Fragt beregnes
ved kassen. Fri fragt ved køb over 499 kr.", "Gå til betaling", "Fortsæt med
at handle". Backdrop dims the page behind it.

**No regressions found so far.** Nothing has been reported to the user as
broken because nothing is.

## What still needs running

Everything below is untouched. Work from the checklists in
`docs/wave3-batch.md` under "Per-task browser verification"; this is the
remaining set, not a replacement for them.

**Task 9, remaining:** close the drawer via the X *and* via the backdrop;
hamburger opens/closes the mobile drawer at mobile width (375×812); search
icon opens the field and predictive results appear; then the cart lifecycle —
add a product, `+`/`−` quantity, remove, empty the cart. Watch every price
against the product page and check the subtotal equals the line totals. Confirm
`#cart-counter` bumps on add. Console clean throughout.

**Task 5** (`main-collection.liquid` split) — collection page at both widths:
filters apply and clear, sort reorders, pagination/infinite scroll advances.
No visual change vs. before the split.

**Task 6** (`breadcrumbs.liquid` split) — product inside a nested collection:
full trail renders, each crumb navigates, scroll/drag/fade behaviour intact.

**Task 7** (`product-buy-buttons.liquid` split) — quantity stepper `+`/`−`,
add-to-cart with correct price and optimistic counter bump, and the mobile
sticky bar's price/text sync plus its show/hide on scroll and on cart-drawer
open/close.

**Task 8** (`product-media.liquid` split) — mobile swipe/drag through all
media; desktop dot and thumbnail clicks both navigate and highlight; video
slides show the play overlay and hide it on play; variant switching slides to
the matching image.

Do both mobile (375×812) and desktop (1280×900) with the console open.

## Ground rules from the user

- **Do not start task 10.** It is substantial and gets its own session. A
  design spec for it already exists at
  `docs/superpowers/specs/2026-08-07-r2-card-consolidation-design.md`.
- **Report any regression before fixing it.**
- Commit when done, then **ask before pushing or merging**.
- Commands handed to the user must be **Windows PowerShell 5.1** syntax: `;`
  not `&&`, `Remove-Item -Recurse -Force` not `rm -rf`, and every command
  starts with an explicit `cd` to its target directory.
