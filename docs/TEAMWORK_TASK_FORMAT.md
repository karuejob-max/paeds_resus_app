# Teamwork task format — use and improve for all future tasks

**Purpose:** Standard way to run multi-task work so Cursor, Manus, and the user stay in sync: one place to see what’s done, by whom, and what’s left. Use this format for **all future task-based initiatives** and improve on it as we learn.

**Status:** Living document — update when we refine the format.

---

## The four artifacts

Every task-based initiative (audit follow-up, platform fixes, feature rollout, etc.) should have:

| # | Artifact | Role | Example |
|---|-----------|------|--------|
| 1 | **Spec / report** | Full “what to do,” scope, acceptance criteria, where (files/routes). Single source of *content*. | `COMPREHENSIVE_PLATFORM_PLAN.md`, `MANUS_HIDDEN_OPPORTUNITIES_REPORT.md` |
| 2 | **Execution plan** | Task list in order with **Status**, **Done by**, **Date**, **Notes**. Single source of *tracking*. Agents and user update this when work is done. | `WAYFORWARD_EXECUTION_PLAN.md`, `EXECUTION_PLAN_CURSOR_AND_MANUS.md` |
| 3 | **Handoff message** | Copy-paste text to give to the other agent so it opens the right doc and follows the same rules. | `MESSAGE_FOR_MANUS_WAYFORWARD.md`, `MESSAGE_FOR_MANUS_SHARED_PLAN.md` |
| 4 | **Cursor rule** | When working in relevant paths: read execution plan first, pick next task, update execution plan when done. | `.cursor/rules/wayforward-tracking.mdc` |

**Principle:** Spec = *what*. Execution plan = *who, when, what’s left*. Handoff = *onboard the other agent*. Rule = *make Cursor follow the format automatically*.

---

## Execution plan table (standard columns)

Use this structure so every initiative looks familiar and is easy to scan:

| # | Task ID | Title | Where | Status | Done by | Date | Notes |
|---|---------|--------|------|--------|--------|------|-------|
| 1 | ID-1 | Short title | `path/to/file` or area | Not started / In progress / Done | Cursor / Manus | YYYY-MM-DD | Optional: blockers, “mark Done when X” |

- **#** — Execution order (1, 2, 3…).
- **Task ID** — Stable id (e.g. P0-1, PRICE-2) so the spec and execution plan can refer to the same task.
- **Title** — One line; enough to know what it is.
- **Where** — Files, routers, or areas to change.
- **Status** — Not started | In progress | Done | Backlog (or similar).
- **Done by** — Who completed it (Cursor, Manus, or human name).
- **Date** — Completion date (YYYY-MM-DD).
- **Notes** — Dependencies, “mark Done when…”, blockers, partial completion.

**Status key** at the bottom of the execution plan: define each status so no one misuses them.

---

## How to create a new initiative (checklist)

1. **Spec / report**
   - Create (or reuse) a doc with: purpose, scope, task list with acceptance criteria and “where,” references.
   - Give each task a **Task ID** (e.g. F-1, F-2 or Phase-Task).

2. **Execution plan**
   - Create `docs/<NAME>_EXECUTION_PLAN.md` (or similar).
   - Add “How to use” (work in order, update Status/Done by/Date when done, use spec for detail).
   - Add the task table with columns above; one row per task in execution order.
   - Add Status key.
   - In the spec, add a line: “**Execution tracking:** Update `docs/<NAME>_EXECUTION_PLAN.md` when you complete a task.”

3. **Handoff message**
   - Create `docs/MESSAGE_FOR_<AGENT>_<NAME>.md` with copy-paste text: open execution plan, work in order, update when done, use spec for detail, constraints.

4. **Cursor rule** (optional but recommended)
   - Create `.cursor/rules/<name>-tracking.mdc` with globs for relevant paths; “Before you start” = read execution plan + spec; “When you finish” = update execution plan, commit and push.

5. **Commit and push** all four so the repo is the single source of truth.

---

## How to improve the format (living doc)

As we use this for more initiatives, improve the format by:

1. **Adding columns** — e.g. **Effort** (S/M/L), **Phase**, **Depends on** (task ID), **Commit** (hash or link) if that helps.
2. **Standardising statuses** — e.g. Not started | In progress | Blocked | Done | Cancelled; define “Blocked” and what goes in Notes.
3. **Linking to commits** — In the execution plan or in Notes, add “Commit: abc123” or “PR: #N” when Done so “who changed what” is one click away.
4. **Handoff message template** — Keep a generic template in this doc or in a `docs/templates/` file and copy it for each new initiative.
5. **Rule globs** — Refine which paths trigger the rule (e.g. only `client/` and `server/` for platform work) to avoid noise.
6. **Multi-agent “In progress”** — If both agents can work in parallel, reserve a task by setting Status = In progress and Done by = “Cursor” or “Manus” when *starting*, then set Done when finished (and Date). Clarify in “How to use” whether “In progress” means “do not start” or “someone is working; pick another task.”
7. **Retrospective** — After an initiative finishes, add a short “What we’d do differently” under a section in this doc or in the execution plan, so the next initiative is better.

When you change the format, update this section and the table/structure above so the next initiative uses the improved version.

---

## Current initiatives using this format

| Initiative | Spec / report | Execution plan | Handoff message | Rule |
|------------|----------------|----------------|------------------|------|
| **Hidden Opportunities** | `MANUS_HIDDEN_OPPORTUNITIES_REPORT.md` | `EXECUTION_PLAN_CURSOR_AND_MANUS.md` | `MESSAGE_FOR_MANUS_SHARED_PLAN.md` | (none; completed) |
| **Way Forward** | `COMPREHENSIVE_PLATFORM_PLAN.md` | `WAYFORWARD_EXECUTION_PLAN.md` | `MESSAGE_FOR_MANUS_WAYFORWARD.md` | `wayforward-tracking.mdc` |
| **Parallel backlog (fellowship and scale)** | `PARALLEL_BACKLOG_FELLOWSHIP_AND_SCALE.md` | `PARALLEL_BACKLOG_EXECUTION_PLAN.md` | `MESSAGE_FOR_MANUS_PARALLEL_BACKLOG.md` | (optional) |

---

## Summary

- **For all future tasks:** Use the four artifacts (spec, execution plan, handoff message, rule) and the standard execution-plan table.
- **Single place for tracking:** Execution plan = Status, Done by, Date; everyone updates it and commits so progress is visible in real time.
- **Improve over time:** Add columns, clarify statuses, link commits, refine rules, and document learnings in this doc.

*Last updated: 2026-02-25.*
