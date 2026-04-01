# Sprint 1 — Measurement Truth MVP — audit results

**Date:** 2026-04-01  
**Owner:** Cursor  
**Method:** Code search for `trackEvent`, `useResusAnalytics`, `analytics.service`, and server paths that persist revenue/mission state without analytics.

## Summary

- **ResusGPS:** `useResusAnalytics` + `ResusGPS.tsx` already emit `resus_*` via `events.trackEvent` — baseline present.
- **Gaps (fixed this sprint):** Server-authoritative **course enrollment**, **M-Pesa initiation and completion**, **Safe-Truth submission**, and **institutional training schedule creation** did not consistently emit `analyticsEvents` for admin **last 7 days** breadth.

## Audit table

| Journey | Step | eventType or pattern | Instrumented (before → after) | Owner file(s) | Impact |
|---------|------|----------------------|---------------------------------|---------------|--------|
| Enroll to Cert | Enrollment persisted (`enrollment.create`) | `course_enrollment` | N → Y | `server/routers/enrollment.ts` | High |
| Enroll to Cert | Enrollment created inside STK flow (no prior row) | `course_enrollment` | N → Y | `server/routers/mpesa.ts` | High |
| Enroll to Cert | M-Pesa STK initiated (payment row created) | `payment_initiation` | N → Y | `server/routers/mpesa.ts` | High |
| Enroll to Cert | M-Pesa success (webhook or STK reconcile) | `payment_completion` | N → Y | `server/webhooks/mpesa-webhook.ts`, `server/mpesa-reconciliation.ts` | High |
| Safe-Truth | Submission created | `safetruth_submission` | N → Y | `server/routers/parent-safetruth.ts` | High |
| Institutional | Training schedule saved | `institution_training_schedule_created` | N → Y | `server/routers/institution.ts` | Medium–High |

## Candidate gaps (implemented)

| Gap ID | Step | Rationale | Effort |
|--------|------|-----------|--------|
| G1 | `enrollment.create` | Revenue funnel truth; matches DB enrollment row | S |
| G2 | `mpesa.initiatePayment` | STK + payment row; initiation + inline enrollment when applicable | S |
| G3 | M-Pesa complete | Authoritative paid journey; webhook for prod, reconcile for mock / missed callbacks | S |
| G4 | `submitTimeline` | Mission (Safe-Truth) visibility in generic product activity | S |
| G5 | `createTrainingSchedule` | Institutional B2B signal in `analyticsLastDays` | S |

## Idempotency note — `payment_completion`

- **Webhook:** Emits once per successful first completion (existing row-level idempotency).
- **Reconcile (`reconcilePaymentRowByStkQuery`):** Emits when this path transitions a row from pending to completed (e.g. mock polling). If the webhook already completed the row, reconcile returns early and **does not** emit again.

## Sign-off

- **Audit owner:** Cursor  
- **Review:** Manus / product (recommended before next sprint)  
- **Date:** 2026-04-01
