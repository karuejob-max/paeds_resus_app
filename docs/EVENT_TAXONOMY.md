# Event taxonomy — `analyticsEvents`

**Status:** Sprint 1 (Measurement Truth MVP) **frozen** 2026-04-01 — extend via PR; do not rename `eventType` values without a migration note.  
**Storage:** Rows go to MySQL `analyticsEvents` via `server/services/analytics.service.ts` → `trackAnalyticsEvent` (`server/db.ts`).  
**tRPC:** Clients typically call `trpc.events.trackEvent` (`server/routers/events.ts`).

## Field meanings

| Field | Role |
|-------|------|
| **eventType** | Primary bucket for grouping (e.g. `resus_assessment`, `payment_completion`, `enrollment_started`). **Admin “last 7 days”** groups primarily by this field (see below). |
| **eventName** | Human-readable label; may duplicate type info. |
| **eventData** | JSON string: payload (courseId, amount, etc.). |
| **userId** | Actor when known; nullable for anonymous. |
| **sessionId** | Client session when provided. |

## Admin reports — how events surface

| Report slice | What it counts |
|--------------|----------------|
| **`analyticsLastDays`** (`adminStats.getReport`) | **All** `analyticsEvents` in the rolling window (**rolling N×24h from “now”**, not calendar midnight — `rollingHoursAgo` in `server/lib/report-time-windows.ts`), grouped by `eventType` (fallback to `eventName`). **This is the main “product activity” breadth metric.** |
| **`resusGpsAnalyticsLastDays`** | Only rows where `eventType` (or name) **starts with `resus_`**. ResusGPS-specific slice — **not** the whole platform. |

**Verification:** `pnpm run verify:analytics` (requires `DATABASE_URL`) loads rows in the rolling window and applies the **same** bucketing as `adminStats.getReport` (`server/lib/admin-analytics-rollup.ts`). Totals and top buckets should match **Admin → Reports** for the same `lastDays` (default 7).

**Sprint 1 implication:** “Mission + revenue journeys” must show up under **`analyticsLastDays`** (and/or dedicated DB-backed KPIs already on the report). Fixing “mystery zeros” may mean **emitting** events, not only fixing ResusGPS.

## Conventions (target state after Sprint 1)

1. Prefer **stable `eventType`** strings — lowercase, `snake_case`, prefix by domain: `resus_`, `payment_`, `enrollment_`, `safetruth_`, `institution_`, etc.
2. **One pattern per journey:** same helper (`trackEvent` / server `analytics.service`) and same mutation path where possible.
3. **Do not** change existing `eventType` values without a migration note — breaks historical admin charts.

## Taxonomy table (fill / verify in Sprint 1)

| eventType (or pattern) | Meaning | Owning surface / file | Example eventData keys | Notes |
|------------------------|---------|------------------------|---------------------------|-------|
| `resus_*` | ResusGPS lifecycle | `client/src/hooks/useResusAnalytics.ts` | letter, threatType, … | Many subtypes; see hook. |
| `page_view` | Page viewed | `client/src/hooks/useAnalytics.ts` | timestamp, userAgent | |
| `enrollment_started` | User started enrollment flow (client) | `useAnalytics.ts` | courseId, courseName | Verify wired on enroll UI. |
| `payment_initiated` | Client marked payment start | `useAnalytics.ts` | amount, courseId | Distinct from server `payment_initiation`. |
| `course_enrollment` | Server-tracked enrollment row created | `server/routers/enrollment.ts`, `server/routers/mpesa.ts` (inline enroll) | courseType, enrollmentId, source | `trackEvent` → `analytics.service`. **Micro-courses (`enrollWithPayment`):** `eventData.source` = `enroll_with_payment`, `courseType` = `micro_course`, `courseId` = slug, `microCourseId`, `paymentMethod` (`m-pesa` \| `admin-free` \| `promo-code`), `amountPaid`, optional `promoCodeId`. |
| `payment_initiation` | STK payment row created after successful `initiateStkPush` | `server/routers/mpesa.ts`, `server/routers/enrollment.ts` (`enrollWithPayment` M-Pesa path) | amount (KES), paymentMethod | Emitted via `trackPaymentInitiation` → `payment_initiation`. |
| `payment_completion` | M-Pesa payment settled | `server/webhooks/mpesa-webhook.ts`, `server/mpesa-reconciliation.ts` | amount, paymentMethod, transactionId | Authoritative completion; reconcile covers mock / missed webhooks. |
| `institutional_inquiry` | B2B inquiry | `useAnalytics.ts` | inquiryType | |
| `safetruth_submission` | Parent Safe-Truth timeline submitted (server) | `server/routers/parent-safetruth.ts` | submissionId, childOutcome, eventCount | Distinct from monthly `parentSafeTruthSubmissions` KPI; feeds **last 7 days** product activity. |
| `institution_training_schedule_created` | Hospital training session scheduled | `server/routers/institution.ts` | institutionId, scheduleId, programType, trainingType | |
| `care_signal_submission_created` | Care Signal row persisted (server) | `server/routers/care-signal-events.ts` → `trackEvent` | careSignalEventId, eventType, isAnonymous | Distinct from `safetruth_submission` (parent). Feeds **last 7 days** when emitted. |
| `provider_conversion` | Provider funnel and progression steps | `client/src/hooks/useProviderConversionAnalytics.ts`, `client/src/pages/Home.tsx`, `client/src/pages/ProviderDashboard.tsx`, `client/src/components/EnrollmentModal.tsx`, `client/src/components/LearningPath.tsx`, `server/routers.ts` (`auth.updateUserType`) | role, source, courseId, moduleId, amountCents, reason | Added for conversion roadmap execution; complements (does not replace) `enrollment_started`, `payment_initiation`, `course_enrollment`. |
| `admin_ops` | Admin/operator execution telemetry | `server/routers/notifications.ts` (lifecycle batch dispatch) | dryRun, limitUsers, processedUsers, sent, skipped | Used to monitor operational batch execution and dispatch outcomes from admin tools. |

### Care Signal — further `care_signal_*` types

Additional fellowship/QI events may use the same prefix (e.g. streak milestones). **Do not** reuse `safetruth_submission` for staff flows. See [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) and [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §17.

---

**Changelog**

| Date | Change |
|------|--------|
| 2026-04-13 | Added degraded-channel fallback policy for lifecycle sends (`channelReliability.fallbackPolicy` + fallback error markers) and `channelFallbackActivations` rollup in lifecycle dispatch summary for operator monitoring. |
| 2026-04-13 | Added channel health alert rollup (`channelHealthAlerts`) in `notifications.getLifecycleDispatchSummary` using delivery-rate thresholds from channel sent/failed outcomes, and surfaced alert banners in `AdminReports`. |
| 2026-04-13 | Added channel failure diagnostics rollup (`channelFailureTop`) in `notifications.getLifecycleDispatchSummary` by parsing `channelReliability.lastError` when channel status is failed, and surfaced top reasons in `AdminReports`. |
| 2026-04-13 | Added lifecycle channel reliability payload to `provider_conversion/lifecycle_timed_nudge_sent` (`channelReliability` with retry policy, attempts, lastError per channel) and surfaced 7d/30d delivery-rate trend in `AdminReports`. |
| 2026-04-13 | Added admin lifecycle summary channel rollup in `notifications.getLifecycleDispatchSummary` from `provider_conversion/lifecycle_timed_nudge_sent` payload (`inApp`, `sms`, `email` sent/failed/skipped) for operator reporting in `AdminReports`. |
| 2026-04-13 | Extended `provider_conversion/lifecycle_timed_nudge_sent` payload with `email` channel status and added lifecycle nudge email dispatch path via `notifications.dispatchLifecycleNudges*`. |
| 2026-04-13 | Extended `provider_conversion/lifecycle_timed_nudge_sent` payload with per-channel status (`inApp`, `sms`) and added SMS dispatch path for lifecycle nudges via `notifications.dispatchLifecycleNudges*`. |
| 2026-04-13 | Added `admin_ops/lifecycle_batch_dispatch_run` analytics events and admin summary reporting path for lifecycle dispatch run monitoring. |
| 2026-04-13 | Added provider lifecycle automation send/click instrumentation under `provider_conversion`: `lifecycle_timed_nudge_sent` (server executor, idempotent 24h/72h sends) and `lifecycle_timed_nudge_clicked` (in-app CTA click). |
| 2026-04-13 | Added lifecycle automation conversion events under `provider_conversion`: `lifecycle_timed_nudge_clicked` (24h/72h reminder CTA) and continued `lifecycle_resume_nudge_clicked` for in-app recovery nudges on provider learner dashboard states. |
| 2026-04-12 | **CLI ↔ Admin parity:** shared rollup in `server/lib/admin-analytics-rollup.ts`; `verify:analytics` uses the same buckets as Admin Reports (not SQL `GROUP BY eventType` only). |
| 2026-04-13 | Added `provider_conversion` funnel events for provider role selection, core CTA clicks, enrollment modal transitions, and learning path starts/completions (Phase 1 conversion implementation). |
| 2026-04-11 | **`enrollWithPayment`** emits **`course_enrollment`** (+ **`payment_initiation`** after successful STK) for micro-course M-Pesa / admin-free / promo paths. |
| 2026-04-04 | **`care_signal_submission_created`** emitted from `care-signal-events.ts` on successful DB insert. |
| 2026-03-31 | Planned `care_signal_*` events (distinct from `safetruth_submission`); PSoT §17 / fellowship doc. |
| 2026-04-01 | Sprint 1 freeze: server `course_enrollment`, `payment_initiation`, `payment_completion` (webhook + reconcile), `safetruth_submission`, `institution_training_schedule_created`; see `SPRINT_1_MEASUREMENT_TRUTH_AUDIT_RESULTS.md`. |
| 2026-04-01 | Admin report window: `analyticsLastDays` uses **rolling N×24h** via `rollingHoursAgo` (not calendar midnight); `pnpm run verify:analytics`. |
| 2026-04-01 | Initial taxonomy scaffold for Sprint 1 Measurement Truth MVP. |
