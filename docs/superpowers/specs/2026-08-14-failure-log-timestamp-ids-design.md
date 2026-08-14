# Failure-log IDs: timestamps instead of a shared counter

**Date:** 2026-08-14 · **Status:** approved, not yet implemented
**Scope:** `docs/failure-log.md` + `CLAUDE.md`. Documentation and project rules only — no Liquid, JS, CSS or build output changes.

## Problem

`docs/failure-log.md` identifies entries with a sequential `F-NNN`. Assigning the next ID means reading the current maximum from the file and adding one — a read-modify-write against shared state. Sessions in this repo run concurrently in separate worktrees, so two of them read the same maximum and both claim it.

This has already happened and is logged as `F-020`: two parallel sessions both claimed `F-018`, and the unresolved conflict markers reached `main`.

The identical race hit theme versions (`1.0.149` → `1.0.152`, four bumps for one fix) and was solved by deriving the version from wall-clock time rather than incrementing a shared base — see the version rule in `CLAUDE.md`. This design applies the same fix to failure IDs.

## Design

### ID format

New entries use:

```
F-YYYYMMDD-HHMMSS
```

for example `F-20260814-161045`. Local time, no timezone suffix — the log is single-author-repo and every existing date field is already local.

Seconds granularity, not minutes: two agents in parallel worktrees can plausibly finish fixes within the same minute, and seconds costs two characters. Minute granularity would leave the hole partly open, which is the whole point of the change.

The timestamp is obtained by running:

```bash
Get-Date -Format 'yyyyMMdd-HHmmss'
```

**Never guessed.** Session context supplies only the current date, so a guessed time is a fabricated ID that may collide or misorder.

### Properties this preserves

- **Sorts chronologically as plain text**, so "newest first" in the index table remains a straightforward ordering.
- **Anchor links keep working.** GitHub slugifies `### F-20260814-161045 — <title>` to `#f-20260814-161045--<title>`, the same shape as today's `#f-037--…`. The cross-linking convention is unchanged.
- **No collision requires coordination.** Nothing is read from the file to mint an ID, so there is no shared state to race on.

### Existing entries

`F-001` … `F-037` keep their IDs permanently. They are referenced by roughly 9 code comments (e.g. `// See docs/failure-log.md F-022` in `assets/main-collection.js`) and roughly 100 internal anchor links.

The two ID forms coexist in one index table indefinitely. Renumbering was considered and rejected: per-entry times are unknown, so timestamps would have to be synthetic, and the change would rewrite every anchor and code comment for cosmetic uniformity alone. This also matches the log's own "don't delete entries" rule and the typography migration's precedent of letting the old and new systems coexist.

### Residual limitation (accepted)

Timestamps remove ID collisions. They do not remove *textual* git conflicts: two sessions still insert entries at the top of `## Entries` and the top of the index table, so the same regions collide. The difference is that resolution becomes mechanical — keep both entries — instead of ambiguous, where two different bugs claim one ID and one of them must be renumbered along with all its references.

Splitting entries into one file each, or appending instead of prepending, would address the textual conflict. Both were considered and deliberately deferred: they restructure a working file to solve the smaller half of the problem.

## Changes

Four edits, one commit.

1. **`docs/failure-log.md` — maintenance rules.** Replace *"Assign the next free `F-NNN`"* with the timestamp rule: the `F-YYYYMMDD-HHMMSS` format, the `Get-Date -Format 'yyyyMMdd-HHmmss'` command, and the instruction never to guess the time. Note that `F-001`…`F-037` keep their old form and both coexist.

2. **`docs/failure-log.md` — `F-020`.** Append an `**Update 2026-08-14:**` line recording that the ID scheme moved to timestamps, which removes the mechanism that entry describes. This is the log's own convention for an entry whose situation has been superseded.

3. **`docs/failure-log.md` — `## Recurring patterns`.** Add pattern 17: a shared incrementing counter races across parallel sessions; derive the identifier from wall-clock time instead. This is the pattern's second instance — theme versions first, failure IDs now — and recording it is what stops the next counter from being invented with the same flaw.

4. **`CLAUDE.md` — the "Log every bug" project rule.** It currently instructs taking *"the next free `F-NNN`"*. Update to the timestamp rule so the project instructions and the log's own maintenance rules agree; a stale instruction in either place reintroduces the counter.

## Out of scope

- No renumbering of existing entries.
- No script or npm task. Minting an ID is one `Get-Date` call; a wrapper would be indirection with no payoff.
- No change to file structure, entry fields, the index table shape, or the cross-linking convention.
- No Tailwind rebuild, no `theme-check`-relevant change, no deploy consequence.

## Verification

There is no code change and no test suite in this repo, so verification is diff inspection:

- `docs/failure-log.md` and `CLAUDE.md` state the same ID rule, with no surviving mention of "next free `F-NNN`".
- No existing `F-NNN` occurrence in `docs/`, `assets/`, `sections/`, `snippets/` or `layout/` is modified — confirmed by the diff touching only the four sites above.
- The next bug logged by any session uses the new format, which is the real end-to-end check.
