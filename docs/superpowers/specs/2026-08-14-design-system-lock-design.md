# Design: locking the design system so approved fixes stay fixed

Date: 2026-08-14
Status: design, approved in principle — implementation plan not yet written

## The problem

Lars standardises a surface by hand. A later session, working from a
different half-applied convention, undoes it. He pays to standardise it
again. The cost is not the fix; it is that every fix is temporary.

This is usually blamed on agents "inventing" components. That is only half
true, and the measured half is smaller than it looks:

- `snippets/button.liquid` is rendered in 12 places, while 14 other files
  hand-roll button markup. Real duplication — but most of it predates the
  snippet.
- `snippets/icon.liquid` has **zero** bypasses. Same rule, same file,
  written the same way. The difference is cost: hand-writing an icon means
  authoring SVG path data, which is expensive and obviously wrong. Writing
  `<button class="rounded-full bg-accent px-4">` is cheaper than looking up
  the snippet's parameters, and it looks fine in review.

So rules do not prevent drift. Cost asymmetry does. Where deviating is
expensive, the rule holds without enforcement; where deviating is cheap, the
rule is decoration.

The second, larger cause is that **five standardisation efforts are open at
once**, none finished:

| Effort | State (2026-08-14) |
|---|---|
| `.type-*` typography | 28 new usages vs 222 old `text-*` — ~11% applied |
| Text-colour tokens | tokens exist; 126 `text-primary/NN` remain |
| Horizon primitive blocks | batches 1–2 merged, 3–5 pending |
| Grid → flexbox | doc written, marked backlog, `.grid-layout` still live |
| Component decomposition | "backlog, deliberately held" |

Each is correct alone. Together they mean the codebase holds two standards
for every decision, so a session that follows the documented system produces
code that clashes with the 222 files that don't, and a session that matches
its surroundings clashes with the documented system. Both read as invention.
A hand-fix made under one standard is genuinely undone by a session working
from another.

Note what is *not* a cause: Tailwind. Removing it was the question that
started this. Its utilities cost ~8 KB gzipped of `assets/output.css`
(measured: 13.5 KB full, 5.2 KB with utilities stripped via `source(none)`),
and the ~4,127 class usages across 117 files would have to be re-expressed
as hand-written CSS, so the net saving is roughly zero for a change touching
nearly every file. Hand-written CSS also lets anyone invent a value.

Nor is it the recent work: `blocks/button.liquid` renders
`snippets/button.liquid`, `blocks/icon.liquid` renders `snippets/icon.liquid`,
`blocks/image.liquid` renders `snippets/image.liquid`. Those batches added
merchant-facing wrappers over one implementation, which is correct layering.

## Goal

Every fix Lars approves becomes a machine-checkable assertion at the moment
he approves it, so undoing it fails a build instead of costing him a browser
pass.

### Non-goals

- Taste. Anything that is a judgement call rather than a rule stays his.
- Merchant settings changed in the Shopify theme editor.
- Pixel-perfect screenshot diffing (see "Rejected alternatives").
- Finishing the five open migrations. That is separate work, though the
  value gate's endgame depends on one of them.

## The shape to copy

The repo already has one discipline that holds: the failure log. Every bug
gets an entry in the same commit as its fix — 38 entries and a
recurring-patterns digest that sessions actually read. It holds because it
fires on an *event* (a bug got fixed), not on an agent remembering a policy.
CLAUDE.md's component rules fire on nothing, which is why they drifted.

This system fires on the event "Lars approved a surface".

## Architecture

### Source of truth

Three JSON files under `docs/design-system/`. Nested under an existing
directory rather than a new top-level one: the GitHub→Shopify sync validates
every file and silently discards what it rejects (F-025), and there is no
reason to discover its tolerance for unknown root directories.

| File | Holds |
|---|---|
| `primitives.json` | The component inventory — one entry per reusable snippet/block |
| `rules.json` | Machine-checkable value and component rules |
| `surfaces.json` | Pages the render gate loads, and what it asserts |

### Data model

**`primitive`**

| Field | Type | Notes |
|---|---|---|
| `id` | string | Its file path, e.g. `snippets/button.liquid`. Unique. |
| `name` | string | Human name, e.g. "Button" |
| `kind` | `snippet` \| `block` | |
| `summary` | string | One line — what it is, for the generated inventory |
| `owns` | string[] | Markup patterns only this primitive may emit, e.g. `<button` |

**`rule`**

| Field | Type | Notes |
|---|---|---|
| `id` | string | `R-<category>-<slug>`, e.g. `R-value-no-hex`. Unique. |
| `category` | `value` \| `component` \| `render` | Selects the gate that runs it |
| `pattern` | string | Regex for value/component rules; assertion name for render rules |
| `message` | string | What the developer sees, including the fix |
| `primitive_id` | string \| null | FK → `primitive.id`. Set when the rule exists to protect a primitive. |
| `origin` | string | A failure-log id (`F-20260814-161045`) or `approval:YYYY-MM-DD` |
| `allow` | string[] | Paths exempt from this rule, each requiring a reason in `allow_reasons` |
| `allow_reasons` | object | Path → why. An exemption without a reason fails the linter. |

**`surface`**

| Field | Type | Notes |
|---|---|---|
| `id` | string | `S-<slug>`, e.g. `S-product-default`. Unique. |
| `url_path` | string | Path on the preview theme, e.g. `/products/example` |
| `viewports` | number[] | Widths to test, e.g. `[375, 1280]` |
| `assertions` | object[] | Each `{ rule_id, selector, params }`; `rule_id` FK → `rule.id` |

Relationships: `rule.primitive_id` → `primitive.id` (many-to-one, optional);
`surface.assertions[].rule_id` → `rule.id` (many-to-one, required).

Every rule carries an `origin`, so no rule exists because an agent thought it
sounded sensible. Each traces to a bug that happened or a surface Lars
approved. `allow` exists because real exemptions occur; requiring a written
reason keeps an exemption from being the silent default.

### The inventory cannot drift

`primitives.json` is the source of truth. The human-readable inventory
section in CLAUDE.md is **generated** from it by
`scripts/generate-inventory.mjs`, and CI fails when the committed CLAUDE.md
does not match — the same freshness pattern the existing `js-build-freshness`
job uses for `assets/*.min.js`.

This matters because agents do not read `primitives.json`; they read
CLAUDE.md, which is already loaded every session. Generating one from the
other is what puts the component in front of an agent at the moment it
decides between reuse and invention. Maintaining both by hand would create a
second thing that drifts from the first — the exact bug being fixed.

### File structure

| File | Purpose |
|---|---|
| `scripts/design-lint.mjs` | Runs `value` and `component` rules over tracked files |
| `scripts/generate-inventory.mjs` | Renders the CLAUDE.md inventory section from `primitives.json` |
| `scripts/design-system/load.mjs` | Reads and validates the three JSON files (shared by both scripts) |
| `tests/design-lint/*.test.mjs` | Fixture-driven tests, one per rule |
| `tests/render/*.spec.mjs` | Playwright specs for the render gate |

Each is single-purpose per CLAUDE.md. `load.mjs` exists so validation of the
data model lives in one place rather than being duplicated by each consumer.

## The three gates

Each is a CI job shaped like `js-build-freshness`: it fails the push, names
the file and line, and prints the command that fixes it.

### Gate 1 — values

Applies every `category: "value"` rule via `design-lint.mjs`. Initial rules,
each drawn from an existing failure-log entry:

- `R-value-no-hex` — no raw hex literals in Liquid (F-007: hardcoded hex
  bypasses the token system; also F-009 for palette utilities).
- `R-value-no-arbitrary` — no Tailwind `[...]` arbitrary values. 78
  occurrences today, e.g. `text-[11px]` ×13, `bg-[#c8102e]` ×4.
- `R-value-no-text-opacity` — no `text-primary/NN`. 126 occurrences across
  six ad-hoc levels, replaced by `--color-text-muted` / `--color-text-faint`.

No prerequisites; ships first. Existing violations are recorded as seeded
`allow` entries with `origin` pointing at this spec, so the gate goes green
on day one and the backlog is visible and finite rather than blocking.

**Endgame.** Gate 1 is eventually superseded by a stronger structural lock.
Verified on a probe file: with `@theme { --text-*: initial; --color-*: initial; }`,
`text-sm` and `bg-red-500` generate **no CSS at all**, while `p-4`, `flex` and
the theme's own `text-primary` still work. An agent reaching for an
off-system size then gets visibly broken output instead of a plausible wrong
result — icon-grade cost asymmetry, applied to typography. It cannot be
switched on until the `.type-*` migration retires the 222 remaining `text-*`
usages, and arbitrary values and opacity modifiers survive it (confirmed:
`text-primary/85` still compiles under the lock), so gate 1 stays regardless.

### Gate 2 — components

Same runner, `category: "component"` rules, driven by each primitive's
`owns` list: raw `<button` outside `snippets/button.liquid`, raw `<svg`
outside the icon sprite, card markup outside its primitive. Requires
`primitives.json`, so it follows the inventory batch.

**Unresolved before batch 3:** "card" has no single owner today —
`blocks/card.liquid`, `snippets/product-card.liquid`,
`snippets/collection-card.liquid` and `snippets/testimonial-card.liquid` all
exist, and `docs/component-decomposition-backlog.md` already records card
markup being reimplemented despite `product-card.liquid` existing. An `owns`
pattern cannot be written until it is decided whether these are four
legitimate components or one with three variants. Batch 3 starts by settling
that; it is a decision for Lars, not a mechanical merge.

The 14 files currently hand-rolling button markup are seeded into `allow`
with a reason, converting an invisible mess into a listed one.

### Gate 3 — render

Playwright loads each `surface` and asserts **geometry and computed styles,
never pixels**. Assertions are aimed at bug classes this theme actually has:

- nothing exceeds the viewport width at 375px (F-003 cart icon clipped off
  the mobile header; F-012 trust bar clipped)
- header children fit within `--row-height` (F-015, F-019, F-024)
- no `.shopify-section` with empty content has non-zero height (F-017)

**Open risk:** this needs the store reachable from CI, including the
storefront password if one is set. Unverified. The batch therefore starts
with a spike that answers reachability before any spec is written; if CI
cannot reach it, the fallback is running the gate locally via a documented
command and treating it as a pre-merge step rather than a push gate.

## Testing

`design-lint.mjs` gets fixture-driven tests using `node:test` (built into
Node 20, already the CI version — no new dependency): for each rule, one
fixture that must fail and one that must pass. An unverified linter silently
stops catching things, which is worse than no linter because it is trusted.

This introduces the first JS test suite in the repo — CLAUDE.md currently
states there is none, and says "testing" means `shopify theme check` plus
manual verification. Batch 1 therefore also adds an `npm test` script and
updates that section of CLAUDE.md, so the next session does not read a
stale claim and skip the tests.

`generate-inventory.mjs` gets a test asserting a known `primitives.json`
renders the expected markdown.

Playwright specs are self-verifying.

Untested by decision: the CI wiring itself. It is verified once by watching
one push go red and one go green, and it is thin — each job runs a single
npm script whose logic is covered above.

## The ritual

One rule added to CLAUDE.md:

> When Lars confirms a surface is correct, add the rule that keeps it
> correct in the same commit, with `origin: approval:<date>`.

Same mechanism as the failure-log rule, which is the discipline in this repo
that has held.

## Rejected alternatives

**Pixel screenshot baselines.** The most complete-feeling lock, but on a
live store the baselines break whenever a product, price or image changes,
so the time saved on browser passes is spent re-approving diffs caused by
nothing. A red pixel diff also reports that *something* moved, not which
rule broke — it surfaces the confusion instead of preventing it.

**A locked-files list.** Files Lars has fixed get marked; agents must
acknowledge before editing. Cheap, but verifies nothing — a speed bump, and
written rules have already been observed to fail here.

**Removing Tailwind.** Addressed under "The problem". Near-zero payload
saving, touches ~117 files at once against the one-at-a-time merge rule, and
does not prevent invented values.

## Phasing

Four batches, per the master-plan-plus-one-file-per-batch convention. Each
ends with something runnable.

| Batch | Delivers | Depends on |
|---|---|---|
| 1 | Value gate end-to-end: `load.mjs`, `design-lint.mjs`, `rules.json` with three seeded rules, tests, CI job | — |
| 2 | `primitives.json` for all 57 snippets + 46 blocks, `generate-inventory.mjs`, CLAUDE.md freshness check | 1 |
| 3 | Component gate: `owns` patterns, component rules, seeded exemptions | 2 |
| 4 | Render gate: reachability spike, then `surfaces.json`, Playwright specs, CI job | 1 |

Batch 1 is deliberately first not because value drift hurts most, but
because it builds the machine batches 2–4 run on: the loader, the rule
runner, the CI job shape and the test pattern. Batch 3 is then largely data
entry.

## Open questions

1. Can GitHub Actions reach the preview theme, and is a storefront password
   set? Answered by the batch 4 spike.
2. Which surfaces belong in `surfaces.json`? Proposed start: home,
   collection, product, cart, search. Confirm before batch 4.
