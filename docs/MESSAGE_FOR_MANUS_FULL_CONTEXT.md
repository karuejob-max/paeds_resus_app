# Message to share with Manus — full context (Way Forward + teamwork format)

Copy the text below and send it to Manus (e.g. in a new chat or as a prompt).

---

**If Manus says the backlog doesn’t exist:** The backlog was created by Cursor in **`docs/BACKLOG_BOARD.md`** (and related updates in `docs/CURSOR_MANUS_STATUS_ALIGNMENT.md` and the webhook mount in `server/_core/index.ts`). Those changes exist **only in the local repo until they are committed and pushed**. Manus works from the **remote**; they will not see the backlog until you **commit and push**. Run: `git add docs/BACKLOG_BOARD.md docs/CURSOR_MANUS_STATUS_ALIGNMENT.md docs/MESSAGE_FOR_MANUS_FULL_CONTEXT.md server/_core/index.ts` (and any other changed files), then `git commit -m "Add backlog board and M-Pesa webhook mount for Manus"` and `git push`. Then ask Manus to **pull latest** and open `docs/BACKLOG_BOARD.md`.

---

**Start of message**

---

Hi Manus,

We’ve aligned how Cursor and you work so we can both move the platform forward without stepping on each other. Here’s the picture and what we need from you.

**0. The backlog we must follow (start here)**

- **Open `docs/BACKLOG_BOARD.md`** — this is our **scrum-style backlog** (Backlog | To Do | In Progress | Done).
- **You must follow this board:** before starting any task, check the board. Pick work from **To Do** (or agree to move something from **Backlog** to To Do), put it **In Progress** when you start, and move it to **Done** when finished. Update the board and the execution plan so Cursor and the product owner stay in sync.
- The board holds the **M-Pesa production-readiness items** (production URL, webhook verification, polling, idempotency, tests, retry) and other follow-up work. This is the single place we all use for “what’s next.”

**1. Way Forward is the main plan**

There is a **comprehensive platform plan** (from the unified audits) with clear phases and tasks:

- **Full spec (what to do, where, acceptance):** `docs/COMPREHENSIVE_PLATFORM_PLAN.md` — pricing (BLS 10k, ACLS/PALS 20k, Elite 45k/level), Phase 0 (critical), Phase 1 (important), Phase 2 (orphaned), Phase 3 (polish), and every task’s scope and “where.”
- **Execution tracking (what’s done, by whom, what’s left):** `docs/WAYFORWARD_EXECUTION_PLAN.md` — one place we all update when we complete a task. It has a task table in order with columns: **#**, **Task ID**, **Title**, **Where**, **Status**, **Done by**, **Date**, **Notes.**

**2. What we need you to do**

1. **Pull the repo** so you have the latest (including any updates Cursor or I pushed).
2. **Open `docs/BACKLOG_BOARD.md`** and follow the board: pick from **To Do**, move that item to **In Progress**, and when done move it to **Done** and update the board + execution plan.
3. **Open `docs/WAYFORWARD_EXECUTION_PLAN.md`** to see what’s already Done and avoid redoing it. For net-new work (e.g. M-Pesa hardening), the **backlog board** is the source of truth.
4. **Use `docs/COMPREHENSIVE_PLATFORM_PLAN.md`** (or the board’s “Notes” column) for “what to do” and acceptance criteria where applicable.
5. **When you finish a task:** In `docs/BACKLOG_BOARD.md`, move the item to **Done** and add Done by / Date. If it’s from the Way Forward list, also update `docs/WAYFORWARD_EXECUTION_PLAN.md`. Then **commit and push** (or list your changes clearly if you can’t push).
6. **Don’t start a task that’s already In Progress or Done** — check the board and execution plan first.

**3. Teamwork format for all future tasks**

We’ve standardised how we run multi-task work. For **any** task-based initiative (not just Way Forward):

- **Read `docs/TEAMWORK_TASK_FORMAT.md`** — it defines the four artifacts (spec, execution plan, handoff message, Cursor rule) and the standard task table. Use this format for any new initiative you run or suggest, and improve that doc when you have ideas (e.g. new columns, statuses, or templates).
- **Workflow:** `docs/AI_TEAM_WORKFLOW.md` now has a “Task-based initiatives” section that points to this format; pull before work, update the right execution plan when done, commit and push.

**4. Constraints (unchanged)**

- Preserve multi-role auth and the structure in `docs/CEO_Platform_Update_And_Reply_To_AI_Team.md`.
- Extend existing code; don’t replace it. No new pages unless a task explicitly adds one.

**5. Suggested next tasks**

From **`docs/BACKLOG_BOARD.md`**, the current **To Do** items are the M-Pesa production-readiness tasks (MPESA-1 … MPESA-6). Start with **MPESA-1** (production URL) and **MPESA-2** (webhook signature verification) as P0. Always confirm against the board so you don’t duplicate work.

Thanks — with this we can work in parallel and keep the platform on track.

---

**End of message**
