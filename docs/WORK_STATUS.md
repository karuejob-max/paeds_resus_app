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
| 2026-04-01 | Cursor | **CEO priority order (1→2→3 slice):** (1) **Analytics baseline:** `adminStats.getReport` now uses **rolling N×24h from now** for `analyticsEvents` (`server/lib/report-time-windows.ts`), matching PLATFORM §8; `pnpm run verify:analytics` for DB spot-check; Admin Reports copy clarified; EVENT_TAXONOMY + Sprint 1 checklist updated. (2) **Staging discipline:** [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) § Weekly operator checklist. (3) **Institutional payment clarity:** Hospital Admin bulk-enrollment card explains schedule vs pay path. | `c8059e3` |
| 2026-04-01 | Cursor | **Hospital admin — attendance ↔ roster + UX:** `upsertTrainingAttendance` syncs institutional staff `enrollmentStatus` / `certificationStatus` / dates from session actions (`registered` → enrolled when was pending; `attended` → completed + cert in progress when was not started). `registerAllStaffForTrainingSession` bumps remaining `pending` roster to `enrolled`. **Client:** Roster refetch + invalidate staff/stats; per-row loading instead of disabling whole roster; “Register all” shows spinner; **Add staff member** form ( `addStaffMember` ). **Schedule:** Clearer labels for datetime vs optional HH:MM; note on multi-day gap. **Copy:** Progress tab explains attendance vs individual status. | `228deac` |
| 2026-04-01 | Cursor | **Hospital Admin Dashboard:** Auto-seed minimal `courses` rows for BLS/ACLS/fellowship (and PALS via existing `ensurePalsSeriouslyIllCatalog`) before `createTrainingSchedule` / program change on `updateTrainingSchedule`, fixing “No course catalog entry…” when creating sessions. **Progress tab:** Replaced mock 45/100 and fake names with aggregates from `getTrainingSchedules` (registered vs capacity per program) and individual rows from `getStaffMembers` (enrollment + certification badges, approximate progress). **UI:** Brand gradient/surfaces, semantic KPI colors, ROI placeholder until analytics; schedule copy + accessible hint for optional instructor name (display-only on session/roster). | `6151f56` |
| 2026-04-01 | Cursor | **Institutional onboarding UX + React #185:** Program step used parent `onClick` + Checkbox `onCheckedChange` (double toggle → max update depth). Replaced with `<label>` + single `onCheckedChange`. **Select** uses `undefined` when type unset (Radix). Theme: brand surfaces, `cta` buttons, calmer copy; country editable with Kenya default; hero no longer BLS/ACLS-only. | `96acf5b` |
| 2026-04-01 | Cursor | **Institutional onboarding URL typo:** Dashboard buttons used `/institution-onboarding` while the app route is `/institutional-onboarding`, so the catch-all showed ResusGPS. Fixed navigates in `HospitalAdminDashboard` + `InstitutionalPortal`; added `Redirect` from `/institution-onboarding` → `/institutional-onboarding`. | `2564f8d` |
| 2026-04-01 | Cursor | **PALS `/course/seriously-ill-child` empty:** Server `ensurePalsSeriouslyIllCatalog` (shared with seed script); `learning.getCourses` runs it when `programType=pals` returns no rows so production self-heals. **Header:** `effectiveRole = role ?? map(userType)` so nav and role switcher work before localStorage sync and when switching institutional↔provider. **Branding:** `/favicon.png` (tab + apple-touch), theme-color `#1b3d3d`; header uses icon + text (not full wordmark). **Enroll:** removed temporary PALS “third tile / #course-pals” guide. **LearningPath:** empty catalog message. | `60a7106` |
| 2026-04-01 | Cursor | **M-Pesa STK stuck after PIN:** `getPaymentByCheckoutRequestId` / `getPaymentStatusForEnrollment` call `reconcilePaymentRowByStkQuery` for all pending M-Pesa rows (not only `MOCK_`), so DB updates when webhook is delayed or missed. **`queryStk`:** normalize `ResultCode` with `String()` so numeric `0` from Daraja counts as success. **Client:** `MpesaPaymentForm` — “I’ve paid — check status now”, `cta` button, brand-tinted status, 5s poll. **Theme sweep (shell/marketing):** Start, Institutional, PerformanceDashboard, JoinSession, CPRMonitoring, Help, About, NotFound, Footer, VideoTestimonial, RecommendationsPanel, OfflineIndicator, LearnerDashboard touches; clinical protocol pages largely unchanged. | `ada7201` |
| 2026-04-01 | Cursor | **Brand theme & readability:** CSS tokens `#1B3D3D` / `#F37021`, light default + `ThemeToggle`; `index.css` contrast (muted-foreground, surfaces); Header/Enroll/Payment/LearnerDashboard use semantic colors; `Button` variant `cta`; logo `paeds-resus-logo-brand.png`. | `dcb7679` |
| 2026-04-01 | Cursor | **Enroll UX:** Copy + anchor `#course-pals` on `/enroll` so “The systematic approach to a seriously ill child” (KES 100) is discoverable; E2E doc “where it appears”. | 3add2ec |
| 2026-04-01 | Cursor | **PALS E2E course (seriously ill child, KES 100):** `pricing.ts` PALS title + test price; `seed-pals-seriously-ill-course.ts` + `pnpm run seed:pals-course`; `CourseSeriouslyIllChild` + `/course/seriously-ill-child`; `LearningPath` + `learning.getModuleContent`/`getCourseStats`/`getCourses` fixes; `Payment` `onPaymentComplete` redirect; `docs/E2E_SERIOUSLY_ILL_CHILD_COURSE.md`; README link. | 880f72a |
| 2026-04-01 | Cursor | **Sprint 1 (Measurement Truth MVP) — implementation:** Server `trackEvent` / `trackPayment*` for **revenue + mission + B2B**: `course_enrollment` on `enrollment.create` and inline M-Pesa enroll; `payment_initiation` + `payment_completion` (webhook + `reconcilePaymentRowByStkQuery`); `safetruth_submission` on `parentSafeTruth.submitTimeline`; `institution_training_schedule_created` on `createTrainingSchedule`. **Docs:** `SPRINT_1_MEASUREMENT_TRUTH_AUDIT_RESULTS.md`; `EVENT_TAXONOMY.md` frozen; checklist + `enrollment.test.ts` `trackAnalyticsEvent` mock. **Remaining:** manual § Verification in `SPRINT_1_IMPLEMENTATION_CHECKLIST.md` (Admin Reports / DB). | 1dd79c8 |
| 2026-04-01 | Cursor | **Sprint 1 (Measurement Truth MVP) — docs:** `PRODUCT_BACKLOG_PRIORITIZED.md` Sprint 1 section + CEO sprint sequence; new `EVENT_TAXONOMY.md`, `SPRINT_1_IMPLEMENTATION_CHECKLIST.md`, `SPRINT_1_EVENT_AUDIT_TEMPLATE.md`; README links; WORK_STATUS In progress for Cursor. | c62dbd2 |
| 2026-04-01 | Cursor | **README:** “Documentation map (start here)” — ordered links to PLATFORM_SOURCE_OF_TRUTH, STRATEGIC_FOUNDATION, WORK_STATUS, AI_TEAM_WORKFLOW, ENGINEERING_ACCEPTANCE_CHECKLIST, plus `docs/archive/` note. | 5d8ee27 |
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
| Cursor / product | **Course organization:** Separate AHA-style BLS·ACLS·PALS from Paeds Resus–original offerings in Enroll + `courses` metadata (UX + taxonomy; not implemented yet). |
| Manus | Phase 4: ResusGPS v4 clinical upgrades (undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale). **Note:** CEO priority order puts analytics baseline before v4; align v4 timing with [`PLATFORM_SOURCE_OF_TRUTH.md`](./PLATFORM_SOURCE_OF_TRUTH.md) §12. |

**Sprint 1 note:** Implementation + taxonomy freeze merged; optional **Verification** (Admin Reports / `analyticsEvents`) remains in [`SPRINT_1_IMPLEMENTATION_CHECKLIST.md`](./SPRINT_1_IMPLEMENTATION_CHECKLIST.md).

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
| 2026-04-01 | Cursor | **M-Pesa mock / test rows in DB** | Do **not** bulk-delete real `payments` / `enrollments` on production (audit, finance, certificates). Rows from dev **`MOCK_` CheckoutRequestID** or obvious test users may be removed in **non-prod** only after backup. Prefer **admin reconciliation** + marking failed duplicates over deleting live payment history. |
| 2026-04-01 | Cursor | Manus “repo alignment” audit vs `main` | On latest `main`, `docs/STRATEGIC_FOUNDATION.md` exists; `PLATFORM_SOURCE_OF_TRUTH.md` links it (not 56-line stub); commits `a0d5246` / `359d1a5` are in history. Likely **stale clone or wrong branch** if missing. **Root** `STRATEGIC_VISION_2031.md` was valid concern—**archived** under `docs/archive/` with explicit “not execution truth” framing. |
| (add when you review another's work) | | | |

---

Last structural update: 2025-02 (WORK_STATUS created).
