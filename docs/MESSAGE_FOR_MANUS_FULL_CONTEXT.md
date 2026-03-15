# Message to share with Manus — full context (Way Forward + teamwork format)

Copy the text below and send it to Manus (e.g. in a new chat or as a prompt).

---

**Start of message**

---

Hi Manus,

We’ve aligned how Cursor and you work so we can both move the platform forward without stepping on each other. Here’s the picture and what we need from you.

**1. Way Forward is the main plan**

There is a **comprehensive platform plan** (from the unified audits) with clear phases and tasks:

- **Full spec (what to do, where, acceptance):** `docs/COMPREHENSIVE_PLATFORM_PLAN.md` — pricing (BLS 10k, ACLS/PALS 20k, Elite 45k/level), Phase 0 (critical), Phase 1 (important), Phase 2 (orphaned), Phase 3 (polish), and every task’s scope and “where.”
- **Execution tracking (what’s done, by whom, what’s left):** `docs/WAYFORWARD_EXECUTION_PLAN.md` — one place we all update when we complete a task. It has a task table in order with columns: **#**, **Task ID**, **Title**, **Where**, **Status**, **Done by**, **Date**, **Notes.**

**2. What we need you to do**

1. **Pull the repo** so you have the latest (including any updates Cursor or I pushed).
2. **Open `docs/WAYFORWARD_EXECUTION_PLAN.md`** and see what’s **Done**, **In progress**, and **Not started**. Pick the **next task in execution order** that’s still Not started (or another Not started task if we’ve agreed to split work).
3. **Use `docs/COMPREHENSIVE_PLATFORM_PLAN.md`** for the full “what to do,” “where,” and acceptance criteria. The execution plan is only for tracking.
4. **When you finish a task:** In `docs/WAYFORWARD_EXECUTION_PLAN.md`, set that task’s **Status** to **Done**, **Done by** to **Manus**, and **Date** to today (YYYY-MM-DD). Then **commit and push** (or list your changes clearly if you can’t push) so Cursor and I see it and don’t redo the work.
5. **Don’t start a task that’s already Done or In progress** — check the execution plan first.

**3. Teamwork format for all future tasks**

We’ve standardised how we run multi-task work. For **any** task-based initiative (not just Way Forward):

- **Read `docs/TEAMWORK_TASK_FORMAT.md`** — it defines the four artifacts (spec, execution plan, handoff message, Cursor rule) and the standard task table. Use this format for any new initiative you run or suggest, and improve that doc when you have ideas (e.g. new columns, statuses, or templates).
- **Workflow:** `docs/AI_TEAM_WORKFLOW.md` now has a “Task-based initiatives” section that points to this format; pull before work, update the right execution plan when done, commit and push.

**4. Constraints (unchanged)**

- Preserve multi-role auth and the structure in `docs/CEO_Platform_Update_And_Reply_To_AI_Team.md`.
- Extend existing code; don’t replace it. No new pages unless a task explicitly adds one.

**5. Suggested next tasks (if not already Done)**

From the execution plan, good next tasks are usually: **PRICE-2** (Enroll page use pricing.ts), **PRICE-4** (Institutional calculator use pricing.ts), then **P0-1** (M-Pesa webhook), **P0-2** (Enrollment → Payment flow), **P0-4** (password reset), etc. Always confirm against `docs/WAYFORWARD_EXECUTION_PLAN.md` before starting.

Thanks — with this we can work in parallel and keep the platform on track.

---

**End of message**
