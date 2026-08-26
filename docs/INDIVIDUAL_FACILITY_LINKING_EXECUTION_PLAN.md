# Individual-to-Registered-Facility Linking — Execution Plan

**Initiative spec:** `docs/INDIVIDUAL_FACILITY_LINKING_SPEC.md`
**Owner:** Manus
**Branch:** `feat/account-facility-linking-e2e`
**Migration reservation:** `0124`

## How to use

Work through the tasks in order. Before starting a task, set its status to **In progress** and add the agent name and date. When the task is verified, set it to **Done** and record the commit or PR in the notes. Other agents must not modify a task marked **In progress** without first coordinating through Git and updating this file. If a task becomes unsafe because `main` moved or another PR owns the same lines, mark it **Blocked** and explain the exact overlap.

## Task board

| # | Task ID | Title | Where | Status | Done by | Date | Notes |
|---:|---|---|---|---|---|---|---|
| 1 | P0-1 | Establish clean base, feature branch, and migration reservation | Git branches; migration reservation | Done | Manus | 2026-08-26 | `main` synchronized at `b7cf1170`; feature branch pushed; remote reservation `migration-reserved-0124` created. |
| 2 | P0-2 | Inspect open PR overlap and lock data/access contract | `AGENTS.md`, `WORK_STATUS.md`, PSOT, open PRs | Done | Manus | 2026-08-26 | PRs #441, #446, and #589 touch `server/routers/institution.ts`; implementation isolates new logic in new files where possible. |
| 3 | DB-1 | Add request schema and idempotent migration | `drizzle/schema.ts`; `scripts/apply-0124-facility-membership-requests.mjs`; `scripts/apply-iers-migrations.mjs`; `package.json` | Done | Manus | 2026-08-26 | Migration 0124 is idempotent and included in the guarded IERS sequence. No production SQL has been applied. |
| 4 | API-1 | Add provider request/status/withdraw procedures | `server/routers/facility-linking.ts`; `server/routers.ts` | Done | Manus | 2026-08-26 | Provider request, status, duplicate prevention, and owner-only withdrawal are implemented. |
| 5 | API-2 | Make admin approval atomically materialize membership and staff link | `server/routers/facility-linking.ts`; `server/routers/institution.ts` | Done | Manus | 2026-08-26 | Approval/rejection and the legacy compatibility mutation use transaction-scoped general membership/staff materialization; IERS roles remain separate. |
| 6 | UI-1 | Add provider request and status surface | `/records`; facility search display | Done | Manus | 2026-08-26 | Added explicit provider request/status/withdraw UI and surfaced institutional ownership in facility search. |
| 7 | UI-2 | Add admin queue with reason-required review | `/institution` Access & links | Done | Manus | 2026-08-26 | Unified explicit requests with a de-duplicated legacy repair queue; rejection requires a reason. |
| 8 | TEST-1 | Add focused unit and opt-in staging coverage | `server/routers/facility-linking.test.ts`; optional staging fixture | Done | Manus | 2026-08-26 | Added two real-router staging scenarios. Disposable local MariaDB run passed: 2 tests covering duplicate prevention, tenant isolation, atomic approval, no product-role escalation, reason-required rejection, and provider withdrawal. |
| 9 | VERIFY-1 | Run check, tests, build, diff checks, and migration dry validation | repository scripts | Done | Manus | 2026-08-26 | TypeScript, 761 unit tests, production build, clinical lint, branch-base, CI workflow verification, diff check, and both migration scripts’ syntax checks passed. |
| 10 | HANDOFF-1 | Re-fetch main, inspect shared-file drift, create PR, and update status | `WORK_STATUS.md`; GitHub PR | Done | Manus | 2026-08-26 | Protected PR [#593](https://github.com/karuejob-max/paeds_resus_app/pull/593) squash-merged into `origin/main` as `96ffc01f` after the required `CI / gate (pull_request)` passed in run [#32994109662](https://github.com/karuejob-max/paeds_resus_app/actions/runs/32994109662). The feature and migration-reservation branches were deleted after merge. Migration 0124 remains present in `main` but unapplied to production; run it only through the guarded deployment approval path. |

## Status key

- **Not started:** available for future work.
- **In progress:** owned by the named agent; do not edit the same task or shared lines without coordination.
- **Done:** implementation and required checks for the task are complete, with evidence recorded.
- **Blocked:** work cannot safely proceed; the notes must name the dependency, collision, or decision required.

## Shared-file protocol

The four collision-prone files are `drizzle/schema.ts`, `package.json`, `docs/WORK_STATUS.md`, and `AGENTS.md`. Every edit to one of them must be preceded by `git fetch origin main`, followed by a targeted diff against `origin/main`, and repeated immediately before PR creation and merge. A clean Git merge is not sufficient proof that the intended lines survived. Migration number `0124` is reserved remotely; it must not be reused by another task.
