# Message for Manus — parallel backlog (copy to Manus)

Hi Manus,

We’ve opened a **parallel product backlog** so you and Cursor can work at the same time without stepping on each other. Everything lives in the repo — please **pull `main` first**, then read these in order:

1. **[docs/PARALLEL_BACKLOG_FELLOWSHIP_AND_SCALE.md](./PARALLEL_BACKLOG_FELLOWSHIP_AND_SCALE.md)** — criteria for parallel work (disjoint areas, claim tasks, pull first).  
2. **[docs/PARALLEL_BACKLOG_EXECUTION_PLAN.md](./PARALLEL_BACKLOG_EXECUTION_PLAN.md)** — the task table: claim a row (**Status → In progress**, **Done by → Manus**), commit, then implement.

**Your lane (default):**

- **FB-AN-1** — **Done by Cursor (2026-04-04):** `care_signal_submission_created` is emitted from `server/routers/care-signal-events.ts` after DB insert. Please **verify** in Admin → Reports and `pnpm run verify:analytics` rather than re-implement.  
- **FB-AN-2** — Verify **Admin → Reports** “last 7 days” includes **`care_signal_submission_created`** after you submit a Care Signal with a test user; run **`pnpm run verify:analytics`** with `DATABASE_URL` if available; document result in execution plan **Notes** + short line in [docs/WORK_STATUS.md](./WORK_STATUS.md).  
- **FB-OPS-1** — Cross-check **staging/deploy** docs: **`pnpm run db:apply-0031`** is documented ([RENDER_PREDEPLOY_LOCKED.md](./RENDER_PREDEPLOY_LOCKED.md) §0031); add a one-line pointer in [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) if anything is missing for operators.

**Constraints:**

- **Do not** rename `careSignalEvents` tRPC or `/care-signal` routes — already shipped.  
- Parent **Safe-Truth** stays separate (`safetruth_submission` vs new `care_signal_*`).  
- Read [docs/PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §17 and [docs/AI_TEAM_WORKFLOW.md](./AI_TEAM_WORKFLOW.md) — commit + push when done; update **WORK_STATUS** Done with commit hash.

**Cursor is working next on** **FB-MAP-1** (ResusGPS pathway ↔ fellowship condition map) unless you claim it after coordination.

Claim **FB-AN-2** and **FB-OPS-1** in the execution plan (Status → In progress) so we don’t duplicate effort; then commit/push when done.

— Job / Cursor
