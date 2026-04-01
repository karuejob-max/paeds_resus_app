# Sprint 1 — Event audit worksheet (copy and fill)

**Purpose:** Timeboxed (half to one day) inventory of journey, step, instrumented flag, and owner file.

**Output:** When complete, save as `docs/SPRINT_1_MEASUREMENT_TRUTH_AUDIT_RESULTS.md` or attach to the Sprint 1 PR.

## Instructions

1. For each step, search the codebase for `trackEvent`, `events.trackEvent`, `useResusAnalytics`, and server helpers in `server/services/analytics.service.ts`.
2. Mark instrumented only if the production path persists rows to `analyticsEvents`.
3. Impact: High means revenue, mission, or admin trust; Medium means secondary.

## Audit table (template)

| Journey | Step | eventType or pattern | Instrumented (Y/N) | Owner file(s) | Impact | Notes |
|---------|------|----------------------|----------------------|---------------|--------|-------|
| Enroll to Cert | Open enroll | | | | | |
| Enroll to Cert | Enrollment persisted | | | server/routers/enrollment.ts | | |
| Enroll to Cert | M-Pesa STK initiated | | | server/routers/mpesa.ts | | |
| Enroll to Cert | Payment webhook success | | | server/webhooks/mpesa-webhook.ts | | |
| Enroll to Cert | Certificate issued | | | | | |
| Safe-Truth | Submission created | | | | | |
| Safe-Truth | Response ready | | | | | |
| Institutional | Schedule saved | | | server/routers/institution.ts | | |
| ResusGPS | Session events | resus_* | Y | client/src/hooks/useResusAnalytics.ts | High | Baseline |

## Candidate gaps (pick 2 to 4 for Sprint 1)

| Gap ID | Step | Rationale | Effort S/M/L |
|--------|------|-----------|--------------|
| G1 | | | |
| G2 | | | |
| G3 | | | |
| G4 | | | |

## Sign-off

- Audit owner:
- Review:
- Date:
