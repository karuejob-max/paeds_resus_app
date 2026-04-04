# Parallel product backlog — fellowship foundations and platform scale

**Status:** Active initiative — **execution tracking:** [PARALLEL_BACKLOG_EXECUTION_PLAN.md](./PARALLEL_BACKLOG_EXECUTION_PLAN.md).  
**Version:** 1.0 · **Date:** 2026-04-04  
**Audience:** Cursor, Manus, CEO, developers.

---

## 1. Purpose

Coordinate **simultaneous** work on:

1. **Fellowship launch prerequisites** ([FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) §11) — Care Signal persistence, analytics, ResusGPS to condition mapping.
2. **CEO priorities** ([WORK_STATUS.md](./WORK_STATUS.md)) — analytics truthfulness, staging discipline, security baseline direction.
3. **Micro-course scale** ([MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md)) — without duplicating catalog rows until product picks SKUs.

**Principle:** Tasks are **parallel** when they touch **disjoint files** or **different layers** (for example schema vs analytics-only) and merge conflicts are unlikely if agents **pull before branch work** and **claim** rows in the execution plan.

---

## 2. Parallel-work criteria (assignments)

| Criterion | Meaning |
|-----------|---------|
| **P1 — Disjoint ownership** | Default file areas: **Cursor** = `server/` schema, tRPC routers, `client/` features, Drizzle SQL. **Manus** = `analyticsEvents` emission patterns, `EVENT_TAXONOMY.md`, admin report verification docs, staging/ops docs, test plans, `WORK_STATUS` / checklist updates. |
| **P2 — Claim before start** | Set execution plan **Status = In progress**, **Done by = Cursor or Manus**, then commit/push so the other picks a different task. |
| **P3 — Pull first** | `git pull` before starting; resolve conflicts in execution plan if both edited. |
| **P4 — Single merge surface** | If both must touch `server/routers.ts`, **sequence** tasks (one Done before the other starts) or split PRs by task ID. |
| **P5 — Done = shippable** | Each task has acceptance criteria; update [ENGINEERING_ACCEPTANCE_CHECKLIST.md](./ENGINEERING_ACCEPTANCE_CHECKLIST.md) where relevant. |
| **P6 — SoT** | Product meaning stays aligned with [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md); fellowship rules in PSoT §17. |

---

## 3. Task overview (see execution plan for full table)

| Lane | Theme | Parallel with |
|------|--------|----------------|
| **A — Data and API** | Care Signal DB + persist `logEvent` | B, D |
| **B — Analytics** | Emit `care_signal_*` events; verify Admin last 7 days | A, C |
| **C — ResusGPS map** | Pathway to fellowship condition config (foundation) | B, D |
| **D — UX / visibility** | Optional: fellowship progress placeholder (mock %) | A, B, C if API contract agreed |
| **E — Ops and docs** | Staging checklist; taxonomy changelog | All (docs-only) |

**Blocked / sequential:** Task **FB-API-1** should follow **FB-DB-1** for real persistence — see execution plan **Depends on** column.

---

## 4. Acceptance — initiative phase 1 complete

Phase 1 is complete when:

- [x] Care Signal events are **stored** in MySQL (not console-only). (`careSignalEvents`, migration **0031**)
- [x] At least one **`care_signal_*`** event flows to **`analyticsEvents`** on successful log (server-authoritative). (`care_signal_submission_created`)
- [x] **EVENT_TAXONOMY.md** lists the emitted type(s); Admin report can show non-zero breadth when tested (`pnpm run verify:analytics` with DB). *(Verification task **FB-AN-2** = Manus)*
- [ ] **ResusGPS to condition** mapping exists as **config + types** (even if not all pathways filled). (**FB-MAP-1**)
- [x] Execution plan table updated; **WORK_STATUS.md** Done entries with commits.

---

## 5. References

- [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §17  
- [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md)  
- [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md)  
- [AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md)

**Execution tracking:** Update [PARALLEL_BACKLOG_EXECUTION_PLAN.md](./PARALLEL_BACKLOG_EXECUTION_PLAN.md) when you complete a task.
