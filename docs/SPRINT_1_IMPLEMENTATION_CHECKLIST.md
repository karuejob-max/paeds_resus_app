# Sprint 1 — Measurement Truth MVP — implementation checklist

**Sprint goal (one line):** By end of sprint, admin **product activity** (`analyticsLastDays` in `adminStats.getReport`) reflects our main **revenue and mission** journeys—not only ResusGPS—and we have a **written event taxonomy** frozen in repo so we don’t regress.

**Canonical refs:** [PRODUCT_BACKLOG_PRIORITIZED.md § Sprint 1](./PRODUCT_BACKLOG_PRIORITIZED.md), [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md), [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §12.

---

## Pre-sprint (Day 1)

- [x] Run audit using [SPRINT_1_EVENT_AUDIT_TEMPLATE.md](./SPRINT_1_EVENT_AUDIT_TEMPLATE.md)
- [x] Prioritize **2–4** gaps by impact (prefer enroll → pay → completion, Safe-Truth; institutional if **thin**)
- [x] Assign owner per gap (name / tool) — Cursor, single PR

---

## Instrumentation (Days 2–7)

Implement `trackEvent` / server analytics helpers with **one naming convention** — update [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) in the same PR.

- [x] Gap #1: Journey: **Enroll (server)** — `course_enrollment` — PR: `main` (2026-04-01)
- [x] Gap #2: Journey: **M-Pesa STK + completion** — `payment_initiation`, `payment_completion` — PR: `main` (2026-04-01)
- [x] Gap #3: Journey: **Safe-Truth submission** — `safetruth_submission` — PR: `main` (2026-04-01)
- [x] Gap #4: Journey: **Institutional training schedule** — `institution_training_schedule_created` — PR: `main` (2026-04-01)

---

## Verification (Days 8–9)

- [x] **Rolling window:** `adminStats.getReport` uses **rolling N×24h from now** for `analyticsEvents` (see `server/lib/report-time-windows.ts`) — matches PLATFORM_SOURCE_OF_TRUTH §8.
- [ ] Trigger each instrumented journey on **local or staging** (production only if policy allows)
- [ ] Run **`pnpm run verify:analytics`** with `DATABASE_URL` set — confirms rows in **`analyticsEvents`** grouped by the **same admin bucket rule** (`eventType` fallback `eventName`) for the same window as Admin Reports
- [ ] Open **Admin → Reports**: total events and top types match CLI spot-check; **`resusGpsAnalyticsLastDays`** only counts `resus_*`; mission/revenue types appear under **App & Paeds Resus activity**
- [x] Naming review: fixed grouping drift by centralizing admin bucket logic (`eventType` fallback `eventName`) in shared helper used by both `adminStats.getReport` and `verify:analytics` (2026-04-12)

---

## Documentation (Day 10)

- [x] Finalize [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) table
- [x] Save audit result (completed template or `SPRINT_1_MEASUREMENT_TRUTH_AUDIT_RESULTS.md`)
- [x] Update [WORK_STATUS.md](./WORK_STATUS.md) — Done row, clear In progress
- [ ] Optional: link sprint summary in [PRODUCT_BACKLOG_PRIORITIZED.md](./PRODUCT_BACKLOG_PRIORITIZED.md) changelog

---

## Regression prevention

- [x] Add a **Vitest** or smoke note: “events router accepts new types” (if applicable) — `enrollment.test.ts` mocks `trackAnalyticsEvent` for `create` path
- [x] Document **do not rename** existing `eventType` without migration note in EVENT_TAXONOMY

---

## Stretch (only if checklist above is complete)

- [ ] **P1-RESUS-1** thin slice: end-of-session **summary export** (copy / one-pager) — connects bedside → learning without institutional dashboards

---

## Explicitly out of scope (this sprint)

- Staging environment **automation** (separate Render services remain manual); **discipline** documented in [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md) § Weekly discipline
- ResusGPS v4 → after measurement baseline (**CEO priority #4**)
- Institutional dashboard v1 / triage workflow UI / consultancy features → **later**
