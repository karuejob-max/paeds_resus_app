# AI team workflow - single source of truth in the repo

**For:** Manus, Codex, Cursor (and any developer).  
**Goal:** Everyone sees what should be done, what others have done, and can critique and build on it **without Job pasting responses between tools**. The repo is the single source of truth; sync is via **git** (pull before work, commit after).

> ## Sandbox is not production
>
> **Manus, Codex, and Cursor** must not mark work **Done** when changes exist only locally or in an isolated sandbox. **Done** requires artifacts on **`origin/main`** (merge commit), verification command output, and a WORK_STATUS entry with PR link — see [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) §2–3.  
> **Manus:** if you cannot push or merge, status = **Handoff** with branch + PR URL + Kolb reflection — [MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md).

**Governance (all agents):** [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md) · [CRITICAL_FIX_PLAYBOOK.md](./CRITICAL_FIX_PLAYBOOK.md)

---

## How "realtime" works

There is no live push between tools. **Realtime = latest committed state in the repo.** When you run (or when Job pulls), you see the latest. So:

1. **Before you do anything:** Pull the repo. Read `docs/PLATFORM_SOURCE_OF_TRUTH.md` and `docs/WORK_STATUS.md` in full. For **why** the platform exists and **how** the products fit together holistically, read `docs/STRATEGIC_FOUNDATION.md` (especially before major feature or positioning work).
2. **Do your work** (code, docs, config) and run the [ENGINEERING_ACCEPTANCE_CHECKLIST.md](./ENGINEERING_ACCEPTANCE_CHECKLIST.md) before calling it done.
3. **Update WORK_STATUS.md:** Add what you did under **Done**, adjust **In progress**, add **Blocked** if needed, and under **Critique / review** add any review of another's work (what you checked, issues, suggestions).
4. **Commit and push** (see section below) so the next person or tool sees your work.

That way Manus, Codex, Cursor, and future team players all read and write the same files; no one needs to paste the other's reply into their chat.

---

## Commit, push, PR, merge (mandatory for everyone)

This is part of our DNA. Every team player (**Manus, Codex, Cursor**, and any future agent) must follow this so the repo stays the single source of truth.

| Agent | MUST |
|-------|------|
| **Manus** | Push branch when possible; open PR; merge or **Handoff** with PR URL — never **Done** with sandbox-only work ([MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md)) |
| **Codex** | Same as Manus: branch → PR → merge `main` or Handoff with PR URL + verify commands |
| **Cursor** | Same loop; update WORK_STATUS with merge commit after merge |

- **Always commit** your changes (code + doc updates) when you finish a slice of work. Use a clear commit message (e.g. what you did and, if useful, your name/tool).
- **Push when you can:** If your environment has access to the remote (e.g. you can run `git push`), **push after you commit**. Open a PR with `gh pr create`. Merge when CI is green unless CEO-only blocked.
- **Done requires merge on `main`:** WORK_STATUS **Done** entries need PR link + merge commit hash + verify output (`pnpm run check`, `test:unit`, or targeted script). See [AGENT_AUTONOMY.md](./AGENT_AUTONOMY.md).
- **If you cannot push or merge:** Status = **Handoff**, not Done:
  - **Say so clearly** in your response and WORK_STATUS.
  - **List exactly what you changed** (files and a one-line summary per file).
  - Include **Kolb reflection** for non-trivial fixes (see handoff template below).
- **How to know if someone else pushed:** Run `git pull`. Check GitHub commit history. WORK_STATUS **Done** entries with merge commit refs confirm who shipped what.

### Handoff template (Manus / Codex / Cursor)

Use when PR is open but not merged, or when push access is missing. Full template: **[MANUS_AGENT_RULES.md](./MANUS_AGENT_RULES.md)**.

```markdown
**Status:** Handoff | Done (merge: `<hash>`) | Blocked (CEO: …)
**PR:** <url or "need push access">
**Branch:** `<name>` @ `<short-hash>`
**Verify:** check / test:unit / build — pass/fail (+ targeted scripts)
**On main vs blocked:** …
**Kolb:** reproduce → root cause → playbook → runtime patch + merge plan
```

---

## How to see who changed what

Use this whenever you want to know what was done, by whom, and when. Applies to Job, Manus, Codex, Cursor, and any future team player.

1. **Pull first:** Run `git pull` so you see the latest. What you see locally is only as recent as your last pull.
2. **Commit history:** Run `git log --oneline -20` (or open the repo on GitHub/GitLab) to see recent commits. Commit messages often name the agent or feature (e.g. "Manus: Phase 1 analytics", "Codex: staging config"). The author name on each commit (if set in that environment) shows who ran the commit.
3. **WORK_STATUS.md:** Open `docs/WORK_STATUS.md`. The **Done** table should list who did what, when, and the commit hash or PR. If everyone updates it, this is the quickest way to see who changed what.
4. **Single file or line:** To see who last changed a specific file or line, run `git log -1 -- <file>` or `git blame <file>`. Useful for code review or debugging.

If WORK_STATUS is empty or out of date, the commit history (and, when available, the host’s PR/branch info) is the fallback. Encouraging everyone to update WORK_STATUS after each slice keeps "who changed what" visible without digging through git.

---

## Task-based initiatives (multi-task work)

For any **new multi-task initiative** (audit follow-up, platform fixes, feature rollout), use the **teamwork task format** so everyone can work on different parts and see what’s done and by whom in real time:

- **Read:** [docs/TEAMWORK_TASK_FORMAT.md](./TEAMWORK_TASK_FORMAT.md) — the standard format (spec + execution plan + handoff message + Cursor rule) and how to improve it.
- **Create** for each new initiative: (1) a spec/report, (2) an execution plan with task table (Status, Done by, Date), (3) a handoff message for the other agent, (4) optionally a Cursor rule. Update the execution plan when you complete a task; commit and push so others see progress.
- **Improve:** When you refine the format (e.g. new columns, statuses, or templates), update TEAMWORK_TASK_FORMAT.md so all future tasks use and improve on it.

Current initiatives using this format: Hidden Opportunities (see EXECUTION_PLAN_CURSOR_AND_MANUS.md), Way Forward (see WAYFORWARD_EXECUTION_PLAN.md).

---

## Files you must read and update

| File | When to read | When to update |
|------|--------------|----------------|
| **docs/AGENT_AUTONOMY.md** | Start of every session | When governance / Definition of Done changes |
| **docs/MANUS_AGENT_RULES.md** | Manus: before closing any task | When Manus handoff rules change |
| **docs/CRITICAL_FIX_PLAYBOOK.md** | Before any production/learner bug fix | When a new fix category is added |
| **docs/PLATFORM_SOURCE_OF_TRUTH.md** | Start of every session / before any change | When you change a platform decision (and note it in WORK_STATUS) |
| **docs/WORK_STATUS.md** | Start of every session; before claiming something is done | When you complete work, start work, are blocked, or add critique |
| **docs/ENGINEERING_ACCEPTANCE_CHECKLIST.md** | Before marking work done or before merge | Only if we agree to change the checklist |
| **docs/TEAMWORK_TASK_FORMAT.md** | When starting or creating a new task-based initiative | When improving the format (new columns, statuses, templates, learnings) |

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
