# Event taxonomy — `analyticsEvents`

**Status:** Living document — **finalize during Sprint 1 (Measurement Truth)** and merge with the audit checklist.  
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
| **`analyticsLastDays`** (`adminStats.getReport`) | **All** `analyticsEvents` in the rolling window, grouped by `eventType` (fallback to `eventName`). **This is the main “product activity” breadth metric.** |
| **`resusGpsAnalyticsLastDays`** | Only rows where `eventType` (or name) **starts with `resus_`**. ResusGPS-specific slice — **not** the whole platform. |

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
| `course_enrollment` | Server-tracked enrollment | `analytics.service.ts` / `events` router | courseType, coursePrice | |
| `payment_initiation` | Server helper | `analytics.service.ts` | amount, paymentMethod | |
| `payment_completion` | Server helper | `analytics.service.ts` | amount, paymentMethod, transactionId | Wire if M-Pesa success path should mirror. |
| `institutional_inquiry` | B2B inquiry | `useAnalytics.ts` | inquiryType | |
| *TBD* | *Fill gaps from* `docs/SPRINT_1_EVENT_AUDIT_TEMPLATE.md` | | | |

---

**Changelog**

| Date | Change |
|------|--------|
| 2026-04-01 | Initial taxonomy scaffold for Sprint 1 Measurement Truth MVP. |
