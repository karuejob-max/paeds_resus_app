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
| 2026-04-01 | Cursor | **README:** “Documentation map (start here)” — ordered links to PLATFORM_SOURCE_OF_TRUTH, STRATEGIC_FOUNDATION, WORK_STATUS, AI_TEAM_WORKFLOW, ENGINEERING_ACCEPTANCE_CHECKLIST, plus `docs/archive/` note. | (this commit) |
| 2026-04-01 | Cursor | **Strategy docs alignment:** `STRATEGIC_VISION_2031.md` → **`docs/archive/`** (banner + [archive/README.md](./archive/README.md)); **near-term SoT** remains [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md) + [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md). *If another machine does not see `docs/STRATEGIC_FOUNDATION.md` or commits `a0d5246`/`359d1a5`, run `git pull` on `main`.* | bd1ebd3 |
| 2026-03-31 | Cursor | **`docs/STRATEGIC_FOUNDATION.md`**: canonical **strategic** onboarding (single north-star problem, theory of change, LMIC realism, origin narrative, ResusGPS↔learning, institutions/Safe-Truth/Book of the Unforgotten, triage-before-admin pattern, honest outcome claims). **`docs/PLATFORM_SOURCE_OF_TRUTH.md`** links to it from purpose + §2. | a0d5246 |
| 2026-03-31 | Cursor | **`docs/PLATFORM_SOURCE_OF_TRUTH.md`** expanded: single onboarding source for **who we are / why / what / for whom**; mission; offerings table; audiences; surfaces map; stack; guardrails; all prior technical decisions preserved (auth, reports EAT, funnel, deployment, priorities). | 3fcc96e |
| 2026-03-31 | Cursor | M-Pesa STK **AccountReference** (phone “Account no.” line): was **`userId` only** (e.g. `1` → “Account no. 1”). Now **`buildStkAccountReference`**: learner **first name** + **`E{enrollmentId}`** (e.g. `MARYE42`), max 12 chars, normalized in `mpesa-real`. Retry uses same helper. | 6819998 |
| 2026-03-31 | Cursor | M-Pesa STK: **`getDarajaTimestampNairobi()`** (`server/lib/daraja-timestamp.ts`) — Daraja password timestamp must be `YYYYMMDDHHmmss` in **Africa/Nairobi (EAT)**; UTC (`toISOString`) or server TZ (e.g. Render UTC) caused **400.002.02 Invalid Timestamp**. Wired in `mpesa-real.ts` (STK + query) and `services/mpesa.ts` `getTimestamp()`. | 5bc8c77 |
| 2026-03-25 | Cursor | M-Pesa: `resolveStkCallbackUrlFromEnv` appends `/api/payment/callback` when `MPESA_CALLBACK_URL` is origin-only (fixes Daraja HTTP 400); clearer 400 errors + Daraja body in logs; `.env.example` notes `MPESA_ENVIRONMENT=production` for prod keys. | 7b70506 |
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
| 2026-04-01 | Cursor | Manus “repo alignment” audit vs `main` | On latest `main`, `docs/STRATEGIC_FOUNDATION.md` exists; `PLATFORM_SOURCE_OF_TRUTH.md` links it (not 56-line stub); commits `a0d5246` / `359d1a5` are in history. Likely **stale clone or wrong branch** if missing. **Root** `STRATEGIC_VISION_2031.md` was valid concern—**archived** under `docs/archive/` with explicit “not execution truth” framing. |
| (add when you review another's work) | | | |

---

Last structural update: 2025-02 (WORK_STATUS created).
