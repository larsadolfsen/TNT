# Failure-Log Timestamp IDs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the failure log's racing `F-NNN` counter with a wall-clock ID, `F-YYYYMMDD-HHMMSS`, so two parallel sessions can never claim the same ID.

**Architecture:** Documentation and project-rule edits only. Four sites change in one commit: the log's maintenance rules, its `F-020` entry, its `Recurring patterns` list, and the matching rule in `CLAUDE.md`. Existing `F-001`…`F-037` are left untouched, so no anchor link or code comment moves.

**Tech Stack:** Markdown. PowerShell `Get-Date` for minting an ID. No build step, no `theme-check`-relevant change, no Tailwind rebuild.

**Spec:** `docs/superpowers/specs/2026-08-14-failure-log-timestamp-ids-design.md`

## Global Constraints

- New ID format is exactly `F-YYYYMMDD-HHMMSS`, e.g. `F-20260814-161045`. Local time, no timezone suffix.
- The timestamp comes from running `Get-Date -Format 'yyyyMMdd-HHmmss'`. Never guessed, never derived from session context (which carries only a date).
- `F-001` … `F-037` keep their IDs permanently. Do not renumber, do not rewrite their anchors, do not touch the ~9 code comments referencing them in `assets/`, `sections/`, `snippets/`, `layout/`.
- No `!important` and no `[!IMPORTANT]` alert boxes (project rules) — irrelevant here but they still hold.
- This branch does not touch version fields. Version bumping happens at merge-to-main time via `npm run bump-version`, not on a feature branch.
- All four edits land in **one** commit. A commit where `CLAUDE.md` and `docs/failure-log.md` state different ID rules is the exact failure this plan prevents.

---

### Task 1: Switch the failure log's ID scheme to timestamps

**Files:**
- Modify: `docs/failure-log.md:395` (maintenance rules — the ID-allocation bullet)
- Modify: `docs/failure-log.md:206-212` (entry `F-020` — append an Update line)
- Modify: `docs/failure-log.md:388` (end of `## Recurring patterns` — add pattern 17 after item 16)
- Modify: `CLAUDE.md:40` (the "Log every bug" project rule)
- Test: none — this repo has no unit test suite. Verification is by `grep`, spelled out in Steps 6–8.

**Interfaces:**
- Consumes: nothing from earlier tasks. This is the only task.
- Produces: the ID rule that every future failure-log entry follows. No code symbols.

- [ ] **Step 1: Replace the ID-allocation bullet in the maintenance rules**

In `docs/failure-log.md`, find this line (line 395, under `## Maintenance rules`):

```markdown
- **Assign the next free `F-NNN`** and insert the entry at the **top** of `## Entries`, plus a row at the top of the index table.
```

Replace it with these three bullets:

```markdown
- **Mint the id from the clock, not from a counter.** Run `Get-Date -Format 'yyyyMMdd-HHmmss'` and use the result as `F-<that>` — e.g. `F-20260814-161045`. Never guess the time: session context supplies only the date, and a guessed time is a fabricated id that can collide or misorder. Insert the entry at the **top** of `## Entries`, plus a row at the top of the index table.
- **Why a timestamp:** the old `F-NNN` counter was read from this file at write time, so two sessions running in parallel worktrees both saw the same maximum and both claimed it ([F-020](#f-020--two-parallel-sessions-both-claimed-f-018-and-the-conflict-markers-were-pushed)). A wall-clock id has no shared state to race on. Same fix the theme version already uses (`1.<YYYYMMDD>.<HHMM>`, see `CLAUDE.md`).
- **`F-001` … `F-037` keep their old ids.** The two forms coexist in one index permanently; entries are never renumbered, and the code comments and anchor links pointing at the old ids stay valid.
```

- [ ] **Step 2: Append an Update line to `F-020`**

In `docs/failure-log.md`, `F-020`'s last field is its `- **Prevention:**` bullet ending with `…the danger is not only switching branches under another session, but also leaving a half-finished index/tree behind for one.` (line 212).

Add one line immediately after it, before the blank line that precedes `### F-019`:

```markdown
- **Update 2026-08-14:** Prevention rule (a) above is superseded. Ids are no longer allocated from a counter at all — new entries use `F-YYYYMMDD-HHMMSS` minted from the clock, so there is nothing to renumber at merge time. See `docs/superpowers/specs/2026-08-14-failure-log-timestamp-ids-design.md`. Rule (b), about never leaving a conflicted merge in the primary checkout, still stands, and two sessions can still conflict *textually* at the top of the index and `## Entries` — the difference is that resolution is now "keep both entries" rather than "one of these two bugs must be renumbered along with every reference to it".
```

- [ ] **Step 3: Add recurring pattern 17**

In `docs/failure-log.md`, `## Recurring patterns` currently ends at item `16.` (line 388), followed by a blank line and `---`. Add this as item 17, after item 16:

```markdown
17. **A shared incrementing counter races across parallel sessions — derive the identifier from the wall clock instead.** Any "take the next free N" rule is a read-modify-write against state that several worktrees hold at once, so two sessions read the same N and both write it. This has now happened twice: theme versions went `1.0.149` → `1.0.152` — four bumps for one fix — before `npm run bump-version` switched to `1.<YYYYMMDD>.<HHMM>`, and failure ids collided at F-018 ([F-020](#f-020--two-parallel-sessions-both-claimed-f-018-and-the-conflict-markers-were-pushed)) before moving to `F-YYYYMMDD-HHMMSS`. Before inventing any new sequential id in this repo, ask what two concurrent sessions would each write. A timestamp needs no coordination, still sorts chronologically, and its only cost is length.
```

- [ ] **Step 4: Update the matching rule in `CLAUDE.md`**

In `CLAUDE.md` line 40, the "Log every bug" bullet contains this fragment:

```markdown
take the next free `F-NNN`, insert it at the top of `## Entries`
```

Replace that fragment (leave the rest of the bullet exactly as it is) with:

```markdown
mint the id from the clock — run `Get-Date -Format 'yyyyMMdd-HHmmss'` and use `F-<that>`, e.g. `F-20260814-161045`, never a guessed time and never a counter (`F-001`…`F-037` are the old scheme and keep their ids) — insert it at the top of `## Entries`
```

- [ ] **Step 5: Confirm no old-scheme instruction survives**

Run:

```bash
grep -rn "next free" CLAUDE.md docs/failure-log.md
```

Expected: **no output** (exit code 1). Any hit is a surviving instruction to use the counter — fix it before continuing.

- [ ] **Step 6: Confirm the new rule is stated in both places**

Run:

```bash
grep -rn "yyyyMMdd-HHmmss" CLAUDE.md docs/failure-log.md
```

Expected: at least one hit in `CLAUDE.md` and at least two in `docs/failure-log.md` (the maintenance-rules bullet and the `F-020` update or pattern 17).

- [ ] **Step 7: Confirm no existing entry id was disturbed**

Run:

```bash
git diff --stat
```

Expected: exactly two files changed — `CLAUDE.md` and `docs/failure-log.md`. No file under `assets/`, `sections/`, `snippets/` or `layout/` may appear; those hold the `F-022`/`F-026`/`F-029`/`F-033` code comments and must be untouched.

Then run:

```bash
git diff -U0 docs/failure-log.md | grep -E "^-" | grep -E "F-0[0-9][0-9]"
```

Expected: the only removed lines mentioning an `F-0NN` id are the two you deliberately rewrote (the `Assign the next free F-NNN` bullet, which names no specific entry, produces no hit here). A hit naming a specific entry id means an existing entry or anchor was edited — revert that hunk.

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md docs/failure-log.md
git commit -m "Switch failure-log ids from a counter to timestamps

F-NNN was read from the file at write time, so parallel worktree
sessions both claimed the same id (F-020). New entries use
F-YYYYMMDD-HHMMSS minted with Get-Date, the same wall-clock fix
bump-version already uses for the theme version. F-001…F-037 keep
their ids; no anchor or code comment changes.

Spec: docs/superpowers/specs/2026-08-14-failure-log-timestamp-ids-design.md"
```

- [ ] **Step 9: Push the branch**

```bash
git push -u origin claude/fail-tracking-timestamps-c1bf03
```

Do **not** merge to `main`. `main` is the live storefront in this repo; merging needs Lars's explicit go-ahead.

---

## Verification summary

There is no test suite and no runnable artifact, so "working" means: the two rule sites agree, and nothing else moved. Steps 5–7 are the evidence. The real end-to-end check is the next bug any session logs — it should carry a `F-<timestamp>` id.

`npx shopify theme check` is unnecessary: no Liquid, JSON, JS or CSS file is touched. `npm run tailwind:build` is unnecessary for the same reason.
