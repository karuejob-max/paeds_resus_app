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
| 2026-03-25 | Cursor | M-Pesa: canonical Daraja STK callback path **`/api/payment/callback`** (Safaricom naming); `server/lib/mpesa-callback-path.ts`; Express mounts payment + legacy mpesa alias; defaults in `mpesa-real`, `services/mpesa`, `mpesa` router use `defaultStkCallbackUrl`. Docs updated. | 13aa3a7 |
| 2026-03-25 | Cursor | M-Pesa 404 diagnosis: `VITE_TRPC_URL` optional in `main.tsx` when www/API split; `MPESA_CALLBACK_URL` default from `APP_BASE_URL` + `/api/mpesa/callback` (not example.com); clearer Daraja 404 message + server log `url=`. Docs callback path vs Manus `/api/payment/callback` typo. | b4ec87f |
| 2026-03-25 | Cursor | M-Pesa: `server/mpesa.ts` now uses **real Daraja** (`mpesa-real`) by default so `mpesa.initiatePayment` triggers STK on phone; mock only when `MPESA_USE_MOCK` or Vitest. `mpesa-real` accepts `DARAJA_*` keys and `MPESA_PAYBILL` as shortcode fallback. Docs `.env.example` + `MPESA_CONFIG_REFERENCE.md`. | b03694e |
| 2026-03-25 | Cursor | Ops: `pnpm run db:apply-0026` idempotent script + `RENDER_PREDEPLOY_LOCKED.md` section for production missing `certificates.renewalReminderSentAt` (fixes Render/Aiven ER_BAD_FIELD_ERROR). | 1f1792a |
| 2026-03-25 | Cursor | HI-B2B-1: `updateTrainingSchedule`, `deleteTrainingSchedule` (tenant-scoped; delete clears `trainingAttendance` for that session); `getTrainingSchedules` joins `courses` for `programType`. Hospital Admin **Schedule** tab: edit dialog, mark cancelled, delete confirm. HI-PLAT-2 slice: `server/lib/structured-log.test.ts`. | 77ab344 |
| 2026-03-25 | Cursor | HI-PLAT-1 / HI-SAFE-1 / HI-CLIN-3 / HI-ENT-1 (slices): `server/lib/structured-log.ts` + `logStructured` on M-Pesa STK callback and Safe-Truth `markResponseReady`; `getSafeTruthStats.reviewedSubmissionsCount` + prominent alert on `ParentSafeTruth`; `adminStats.getReport.resusGpsAnalyticsLastDays` (`resus_*` events) + Reports UI card; `adminStats.getAdminAuditLog` + CSV + preview on Admin Reports; Safe-Truth response-ready email line about spam folder. | 50d44ed |
| 2026-03-25 | Cursor | HI-B2B-2: training attendance — `getTrainingAttendanceForSchedule`, `upsertTrainingAttendance`, `registerAllStaffForTrainingSession` in `institution` router; Hospital Admin Schedule tab **Roster** UI; `enrolledCount` synced from attendance rows. Vite `chunkSizeWarningLimit` 900 for deploy chunk warning. | d2c28f8 |
| 2026-03-25 | Cursor | Render deploy: fixed esbuild error in `server/routers/enrollment.ts` — mixed `??` and `||` without parentheses in `adminConfirmOfflinePayment`; clarified as `(input.amountPaid ?? pendingSum)` then fallback to `enrollment.amountPaid` and `0`. | 01a48f0 |
| 2025-03-07 | Manus | Phase 1: Analytics Instrumentation — created useResusAnalytics hook, integrated event tracking at ResusGPS lifecycle points (assessment start, questions, interventions, cardiac arrest, ROSC), events flow to analyticsEvents table, admin reports now show real activity | 7041295, 337aa52 |
| 2025-03 | Manus | Phase 2: Staging Environment — STAGING_DEPLOYMENT.md with branch model (main/develop), manual deploy workflow, staging Render/Aiven setup guide, PR verification checklist, rollback procedure | (pushed) |
| 2025-03 | Cursor | Phase 3: Security baseline — SECURITY_BASELINE.md; password complexity (min 8 chars, one letter + one number); session max age via SESSION_MAX_AGE_MS (default 1 year); adminAuditLog table + middleware; EAT for admin reports "this month" (startOfMonthEAT/endOfMonthEAT). | (this commit) |

---

## In progress

| Who | What |
|-----|------|
| Manus | Phase 4: ResusGPS v4 clinical upgrades (undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale). |

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
