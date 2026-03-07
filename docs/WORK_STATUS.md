# Work status - single place for done, in progress, critique

**Purpose:** One file that Manus, Codex, and Cursor read and update. No pasting of responses; sync via git.  
**Workflow:** See AI_TEAM_WORKFLOW.md in this folder.

---

## How to use this file

- **Before you start work:** Read PLATFORM_SOURCE_OF_TRUTH.md and this file (full).
- **When you complete something:** Add a dated entry under Done (who, what, commit/PR if any).
- **When you start something:** Add or update In progress (who, what).
- **When something is blocked or needs a decision:** Add to Blocked / needs decision.
- **When you review another's work:** Add to Critique / review (date, who you are commenting on, what you checked, any issues or suggestions). The next agent or Job can then act on it.

---

## Current priorities (from CEO)

1. Analytics instrumentation (ResusGPS and others to analyticsEvents; admin reports show real activity)
2. Staging (develop to staging, main to production)
3. Security baseline (password, session, audit logging)
4. ResusGPS v4 (undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale)

---

## Done

| Date | Who | What | Commit/PR |
|------|-----|------|----------|
| 2025-03-07 | Manus | Phase 1: Analytics Instrumentation — created useResusAnalytics hook, integrated event tracking at ResusGPS lifecycle points (assessment start, questions, interventions, cardiac arrest, ROSC), events flow to analyticsEvents table, admin reports now show real activity | f5caca0e (webdev checkpoint) |

---

## In progress

| Who | What |
|-----|------|
| Manus | Phase 2: Staging Environment — set up develop branch → staging Render, main → production; branch-based deploys with PR verification on staging before production |

---

## Blocked / needs decision

| Item | Blocking reason or decision needed |
|------|-------------------------------------|
| (add when stuck or when CEO/product decision needed) | |

---

## Critique / review

Any agent can add here. Format: date, reviewer (Codex/Manus/Cursor), subject (e.g. Manus Phase 1 analytics), what you checked, and any issues or suggestions. This lets others scrutinize and build on each other's work without Job pasting responses.

| Date | Reviewer | Subject | Notes |
|------|----------|---------|-------|
| (add when you review another's work) | | | |

---

Last structural update: 2025-02 (WORK_STATUS created).
