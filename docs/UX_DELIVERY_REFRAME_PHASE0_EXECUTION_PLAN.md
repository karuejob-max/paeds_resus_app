# UX Delivery Reframe - Phase 0 Execution Plan

**Spec reference:** `docs/UX_DELIVERY_REFRAME_PHASE0_SPEC.md`  
**Tracking rule:** Update this table immediately when task status changes.

---

## How to use

- Work in order unless a task is explicitly marked parallel-safe.
- Mark `In progress` when starting; set `Done` only when acceptance criteria are met.
- Fill `Done by`, `Date`, and `Notes` on completion.
- Link commit hash in `Notes` when merged.

---

## Task table

| # | Task ID | Title | Where | Status | Done by | Date | Notes |
|---|---------|-------|-------|--------|---------|------|-------|
| 1 | P0-1 | Baseline perf profiling (login/dashboard/ResusGPS) | `docs/UX_DELIVERY_REFRAME_PHASE0_P0-1_PROFILING_METHOD.md` + app traces | In progress | Manus | 2026-04-14 | Started; method and SLO evidence template published |
| 2 | P0-2 | Define provider "next best action" state machine + tie-break rules | `docs/UX_DELIVERY_REFRAME_PHASE0_SPEC.md` | Done | Cursor | 2026-04-14 | Implemented in provider dashboard state machine and role-safe CTA routing; see execution slices through `ca63e12`, `e78a57c`, `67a9767` |
| 3 | P0-3 | Build role access matrix (UI nav + routes + APIs) | `docs/UX_DELIVERY_REFRAME_PHASE0_P0-3_ACCESS_MATRIX.md` | In progress | Job | 2026-04-14 | Matrix scaffold added; route/API inventory counts pending |
| 4 | P0-4 | Create dependency DAG + owner map for Weeks 1-4 | `docs/UX_DELIVERY_REFRAME_PHASE0_P0-4_DEPENDENCY_DAG.md` | Done | Cursor | 2026-04-14 | DAG + owner map locked and used to drive Week 1-4 execution slices; blockers and contingencies operationalized |
| 5 | P0-5 | Define test strategy (role leaks + perf gates + smoke cadence) | `docs/UX_DELIVERY_REFRAME_PHASE0_P0-5_TEST_STRATEGY.md` | In progress | Manus | 2026-04-14 | Role/perf gate strategy template added; automation mapping to finalize |
| 6 | P0-6 | Define rollout/rollback protocol for auth-routing changes | `docs/UX_DELIVERY_REFRAME_PHASE0_P0-6_ROLLBACK_RUNBOOK.md` | Done | Cursor | 2026-04-14 | Runbook thresholds and rollback protocol defined and integrated into release hardening + verification workflow |
| 7 | P0-7 | Team alignment review (Cursor + Manus + Job) and Phase 0 sign-off | `docs/UX_DELIVERY_REFRAME_PHASE0_P0-7_SIGNOFF.md` + `docs/WORK_STATUS.md` | Not started | Job | 2026-04-17 | Scheduled target: 2026-04-17 09:00 UTC; evidence pack prepared in `docs/UX_REFRAME_FINAL_EXECUTION_EVIDENCE.md` |

---

## Ownership split (initial)

- **Cursor:** P0-2, P0-4, P0-6
- **Manus:** P0-1, P0-5
- **Job:** P0-3 validation + clinical/product sign-off for P0-2 and P0-7

Parallel-safe from day 1: P0-1, P0-2, P0-3.

---

## Timeline lock

- 2026-04-14: Owner activation and P0-1/P0-2/P0-3 started
- 2026-04-15: P0-4/P0-5/P0-6 active with first drafts complete
- 2026-04-16: Gap review and close all open Phase 0 action items
- 2026-04-17 09:00 UTC: P0-7 sign-off
- 2026-04-18: Week 1 execution start gate (only if Phase 0 entry criteria pass)

---

## Status key

- **Not started:** no active owner execution yet
- **In progress:** actively being worked on by assigned owner
- **Done:** acceptance criteria met and committed
- **Blocked:** waiting on dependency/decision
- **Cancelled:** intentionally removed from scope
