# AI team workflow - single source of truth in the repo

**For:** Manus, Codex, Cursor (and any developer).  
**Goal:** Everyone sees what should be done, what others have done, and can critique and build on it **without Job pasting responses between tools**. The repo is the single source of truth; sync is via **git** (pull before work, commit after).

---

## How "realtime" works

There is no live push between tools. **Realtime = latest committed state in the repo.** When you run (or when Job pulls), you see the latest. So:

1. **Before you do anything:** Pull the repo. Read `docs/PLATFORM_SOURCE_OF_TRUTH.md` and `docs/WORK_STATUS.md` in full.
2. **Do your work** (code, docs, config) and run the [ENGINEERING_ACCEPTANCE_CHECKLIST.md](./ENGINEERING_ACCEPTANCE_CHECKLIST.md) before calling it done.
3. **Update WORK_STATUS.md:** Add what you did under **Done**, adjust **In progress**, add **Blocked** if needed, and under **Critique / review** add any review of another's work (what you checked, issues, suggestions).
4. **Commit** your changes (code + doc updates) so the next person or tool sees them.

That way Manus, Codex, and Cursor all read and write the same files; no one needs to paste the other's reply into their chat.

---

## Files you must read and update

| File | When to read | When to update |
|------|--------------|----------------|
| **docs/PLATFORM_SOURCE_OF_TRUTH.md** | Start of every session / before any change | When you change a platform decision (and note it in WORK_STATUS) |
| **docs/WORK_STATUS.md** | Start of every session; before claiming something is done | When you complete work, start work, are blocked, or add critique |
| **docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md** | Before marking work done or before merge | Only if we agree to change the checklist |

---

## Scrutinizing each other's work

- When you review code or docs (e.g. after a merge or when checking a feature), add a row to **Critique / review** in WORK_STATUS: date, your name (Codex/Manus/Cursor), subject (e.g. "ResusGPS analytics Phase 1"), what you checked, and any issues or suggestions.
- The next agent (or Job) can then read WORK_STATUS and act on that critique without any pasted response. Build on each other's work by reading the repo and WORK_STATUS.

---

## What Job does

- Job does **not** need to paste your responses into another tool. He can point Codex/Manus/Cursor at the repo and say: "Read the platform brief and work status, do your next task, update the work status and commit."
- Job can open WORK_STATUS and PLATFORM_SOURCE_OF_TRUTH anytime to see what is done, in progress, blocked, and what critique exists.

---

## Summary

- **Single source of truth** = this repo (PLATFORM_SOURCE_OF_TRUTH, WORK_STATUS, code).
- **Realtime** = whatever is last committed; everyone pulls, reads, updates, commits.
- **No pasting** = everyone reads and writes the same docs.
- **Scrutinize and build** = use the Critique / review section in WORK_STATUS and the acceptance checklist so each of you can hold the other to the same standard.
