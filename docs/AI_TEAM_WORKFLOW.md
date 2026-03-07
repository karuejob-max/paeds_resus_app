# Paeds Resus — AI Team Workflow

Last updated: 2026-03-07
Applies to: Codex, Manus, Cursor, and future team players

## 1) Source-of-truth docs to read before any work

Every contributor must read these before proposing or implementing changes:

1. `docs/PLATFORM_SOURCE_OF_TRUTH.md`
2. `docs/WORK_STATUS.md`

These files are mandatory pre-work context.

## 2) How work is coordinated

- Realtime state = latest committed and pushed git state.
- Team sync happens through git + docs updates, not manual forwarding by Job.
- No duplicate implementation: review existing code/routes/components first.

## 3) Work status updates (mandatory)

When you start, progress, finish, or critique work, update `docs/WORK_STATUS.md` under one of:

- **Done**
- **In progress**
- **Blocked**
- **Critique / review**

Minimum entry format:

- Date/time (UTC)
- Owner/agent
- Scope (what was worked on)
- Files touched (if any)
- Next step / risk
- Commit reference (if committed)

## 4) Commit and push (mandatory for everyone)

This is part of team DNA and applies to all current and future team players.

- Always commit when you finish a slice of work, with a clear message.
- Push when you can.
- If your environment supports `git push`, push after commit and record commit ref (or short summary) in `WORK_STATUS` under **Done**.

### If you cannot push

Say so clearly and list exactly what changed:

- files changed
- one-line summary per file

This allows Job (or another human with push access) to commit/push reliably.

### How to know someone else pushed

- Run `git pull`
- Check host commit history
- Check `WORK_STATUS` **Done** entries with commit refs

## 5) What Job does

Prompting and leadership flow:

- Job provides direction and priorities.
- Team executes, updates work status, then commits and pushes if possible.
- If an agent cannot push, Job (or another human with push access) commits and pushes using the listed change summary.

This is a fixed operating rule for all future team players.

## 6) Conserving time and credits

- Prefer targeted, incremental changes.
- Avoid broad speculative rewrites unless explicitly requested.
- Avoid repeated questions already answered in source-of-truth docs.
- If prompts or activity are consuming unnecessary credits/tokens, call it out.
