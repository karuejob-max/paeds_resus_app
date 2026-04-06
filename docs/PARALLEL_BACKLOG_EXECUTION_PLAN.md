# Parallel backlog — execution plan

**Spec:** [PARALLEL_BACKLOG_FELLOWSHIP_AND_SCALE.md](./PARALLEL_BACKLOG_FELLOWSHIP_AND_SCALE.md)  
**How to use:** `git pull` → pick a task with **Status = Not started** (or coordinate if you need a sequenced task) → set **In progress** + your name in **Done by** → commit that row only (or with your WIP) → implement → set **Done** + **Date** + **Notes** (commit hash) → push → update **WORK_STATUS.md**.

**Status key:** `Not started` | `In progress` | `Blocked` | `Done`

---

| # | Task ID | Title | Where | Depends on | Parallel with | Status | Done by | Date | Notes |
|---|---------|--------|------|------------|---------------|--------|---------|------|-------|
| 1 | FB-DB-1 | **Care Signal — DB table + migration** | `drizzle/`, `drizzle/schema.ts`, `scripts/apply-*` pattern | — | FB-AN-1, FB-MAP-1, FB-OPS-1 | Done | Cursor | 2026-04-04 | `0031_care_signal_events.sql`, `pnpm run db:apply-0031`, RENDER_PREDEPLOY_LOCKED §0031 |
| 2 | FB-API-1 | **Care Signal — persist in `careSignalEvents.logEvent`** | `server/routers/care-signal-events.ts`, DB insert | FB-DB-1 | FB-AN-1 after emit hook exists | Done | Cursor | 2026-04-04 | Drizzle insert; returns real `eventId` |
| 3 | FB-AN-1 | **Emit `analyticsEvents` on Care Signal success** | `server/services/analytics.service.ts` or existing `trackEvent` path, `care-signal-events.ts` | FB-API-1 optional: can emit with console path first using userId + timestamp | FB-DB-1 | Done | Cursor | 2026-04-04 | `care_signal_submission_created`; see EVENT_TAXONOMY |
| 4 | FB-AN-2 | **Verify Admin + `verify:analytics`** | Admin UI, `pnpm run verify:analytics`, docs note | FB-AN-1 | — | In progress | Manus | 2026-04-06 | Migration 0031 applied; careSignalEvents table created; test suite validates event emission path; `pnpm run verify:analytics` shows 0 events (expected—no submissions yet); commit fc89a39 |
| 5 | FB-MAP-1 | **ResusGPS pathway ↔ fellowship condition map** | New `server/lib/` or `shared/` config + types; PSoT pointer if needed | — | FB-DB-1 | Not started | Cursor | | Start with known pathways (e.g. septic shock); extensible list |
| 6 | FB-UX-1 | **Fellowship progress placeholder (optional)** | `client/` learner hub or `/home` | FB-MAP-1 partial OK | After FB-API-1 for “events logged” count | Not started | | | Read-only % or copy only; no false “Fellow” badge |
| 7 | FB-OPS-1 | **Staging / deploy checklist note** | `docs/STAGING_DEPLOYMENT.md` or RENDER doc | — | All | In progress | Manus | 2026-04-06 | Added §0031 notes to STAGING_DEPLOYMENT.md; documented idempotent migration pattern; updated PR approval checklist; commit pending |

---

## Owner split (default)

| Agent | Primary tasks | Rationale |
|-------|----------------|-----------|
| **Cursor** | FB-DB-1, FB-API-1, FB-MAP-1, FB-UX-1 | Schema, Drizzle, tRPC, React — core repo patterns |
| **Manus** | FB-AN-1, FB-AN-2, FB-OPS-1 | Analytics instrumentation, admin verification, ops/docs; can pair on FB-AN-1 if Cursor owns insert hook |

**If Manus cannot run migrations:** Manus takes FB-AN-1 + FB-AN-2 + FB-OPS-1 only; Cursor must complete FB-DB-1 + FB-API-1 first, then Manus wires tracking in a follow-up commit.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-04-04 | Initial tasks FB-DB-1 … FB-OPS-1 |
