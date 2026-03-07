# AI team workflow - single source of truth in the repo

**For:** Manus, Codex, Cursor (and any developer).  
**Goal:** Everyone sees what should be done, what others have done, and can critique and build on it **without Job pasting responses between tools**. The repo is the single source of truth; sync is via **git** (pull before work, commit after).

---

## How "realtime" works

There is no live push between tools. **Realtime = latest committed state in the repo.** When you run (or when Job pulls), you see the latest. So:

1. **Before you do anything:** Pull the repo. Read `docs/PLATFORM_SOURCE_OF_TRUTH.md` and `docs/WORK_STATUS.md` in full.
2. **Do your work** (code, docs, config) and run the [ENGINEERING_ACCEPTANCE_CHECKLIST.md](./ENGINEERING_ACCEPTANCE_CHECKLIST.md) before calling it done.
3. **Update WORK_STATUS.md:** Add what you did under **Done**, adjust **In progress**, add **Blocked** if needed, and under **Critique / review** add any review of another's work (what you checked, issues, suggestions).
4. **Commit and push** (see section below) so the next person or tool sees your work.

That way Manus, Codex, Cursor, and future team players all read and write the same files; no one needs to paste the other's reply into their chat.

---

## Commit and push (mandatory for everyone)

This is part of our DNA. Every team player (Manus, Codex, Cursor, and any future agent or developer) must follow this so the repo stays the single source of truth and everyone can see what was done.

- **Always commit** your changes (code + doc updates) when you finish a slice of work. Use a clear commit message (e.g. what you did and, if useful, your name/tool).
- **Push when you can:** If your environment has access to the remote (e.g. you can run `git push`), **push after you commit**. Then add the commit hash (or short description) in WORK_STATUS under **Done** so others know it is on the remote. That way Job and other agents see your work when they pull; no one has to guess whether you pushed.
- **If you cannot push:** Some environments only edit files and cannot push. In that case:
  - **Say so clearly** in your response or in the WORK_STATUS entry (e.g. "Committed locally; cannot push — Job please push").
  - **List exactly what you changed** (files and a one-line summary per file) so Job (or another human with push access) can commit and push on your behalf.
- **How to know if someone else pushed:** Run `git pull` (or refresh the repo). Check the commit history on the host (e.g. GitHub/GitLab). New commits you did not make = someone else pushed. WORK_STATUS **Done** entries with a commit ref help confirm who did what.

---

## How to see who changed what

Use this whenever you want to know what was done, by whom, and when. Applies to Job, Manus, Codex, Cursor, and any future team player.

1. **Pull first:** Run `git pull` so you see the latest. What you see locally is only as recent as your last pull.
2. **Commit history:** Run `git log --oneline -20` (or open the repo on GitHub/GitLab) to see recent commits. Commit messages often name the agent or feature (e.g. "Manus: Phase 1 analytics", "Codex: staging config"). The author name on each commit (if set in that environment) shows who ran the commit.
3. **WORK_STATUS.md:** Open `docs/WORK_STATUS.md`. The **Done** table should list who did what, when, and the commit hash or PR. If everyone updates it, this is the quickest way to see who changed what.
4. **Single file or line:** To see who last changed a specific file or line, run `git log -1 -- <file>` or `git blame <file>`. Useful for code review or debugging.

If WORK_STATUS is empty or out of date, the commit history (and, when available, the host’s PR/branch info) is the fallback. Encouraging everyone to update WORK_STATUS after each slice keeps "who changed what" visible without digging through git.

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

- Job does **not** need to paste your responses into another tool. He can point Codex/Manus/Cursor (or any future team player) at the repo and say: "Read the platform brief and work status, do your next task, update the work status, then commit and push if you can."
- Job can open WORK_STATUS and PLATFORM_SOURCE_OF_TRUTH anytime to see what is done, in progress, blocked, and what critique exists.
- If an agent cannot push, Job (or another human with push access) commits and pushes the agent's changes using the list of changes the agent provided; this is part of the workflow and stays in our DNA for future team players.

---

## Summary

- **Single source of truth** = this repo (PLATFORM_SOURCE_OF_TRUTH, WORK_STATUS, code).
- **Realtime** = whatever is last committed and pushed; everyone pulls, reads, updates, commits, and pushes when possible.
- **No pasting** = everyone reads and writes the same docs.
- **Commit and push** = mandatory; if you cannot push, say so and list your changes so someone with push access can do it. This applies to every current and future team player.
- **Scrutinize and build** = use the Critique / review section in WORK_STATUS and the acceptance checklist so each of you can hold the other to the same standard.
