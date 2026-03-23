# Paeds Resus — Institutional backlog board

> **Purpose:** Scrum-style board for **institutional (B2B / hospital)** work only.  
> **How to use:** Before starting, check **In Progress** (avoid duplicate work). Move cards **To Do → In Progress → Done**. Always set **Owner** when In Progress, and **Done by + Date** when complete.  
> **Last updated:** 2026-02-25 (INST-11 institutional email via `email-service`)  
> **Owner:** Product + Cursor + Manus (shared)

**Related:** Full gap analysis and prioritization → `docs/INSTITUTIONAL_PLATFORM_AUDIT.md`  
**Main platform board (M-Pesa, tests, etc.):** `docs/BACKLOG_BOARD.md`

---

## Board at a glance

```
┌─────────────────┬──────────────────────────────────────────────┬──────────────┬────────────────────────────────────────────────────────┐
│    BACKLOG      │                    TO DO                     │ IN PROGRESS  │                      DONE                            │
├─────────────────┼──────────────────────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ INST-12         │                                                 │   (none)     │ INST-0 … INST-11 (see Done)                            │
│ INST-13         │                                                 │              │                                                        │
│ INST-14         │                                                 │              │                                                        │
└─────────────────┴──────────────────────────────────────────────┴──────────────┴────────────────────────────────────────────────────────┘
```

\* Hospital admin now resolves **`institutionId` via `getMyInstitution`** (no hardcoded `1`).

---

## Column definitions

| Column | Meaning |
|--------|--------|
| **Backlog** | Not committed this cycle; prioritized but unpulled. |
| **To Do** | Ready to pick; ordered roughly by **impact × ease** (see audit). |
| **In Progress** | Active work — **one owner per card** recommended. |
| **Done** | Shipped / verified; include **Done by** and **Date**. |

---

## Backlog

| ID | Title | Priority | Impact | Ease (1–5) | Notes |
|----|--------|----------|--------|------------|--------|
| INST-12 | Training schedules tab: API + UI wired to `trainingSchedules` / attendance | P2 | M | 2 | Schema exists; portal is shell only. |
| INST-13 | Incidents tab: list + create tied to `incidents` + institution scope | P2 | M | 2 | Align with Safe-Truth / clinical governance later if needed. |
| INST-14 | `institutionalAnalytics` rollup job (nightly) for portal charts | P3 | M | 2 | Optional once raw stats are correct. |

---

## To Do

| ID | Title | P | Owner | Notes |
|----|--------|---|-------|--------|
| — | *None* | — | — | Pull from **Backlog** when ready. |

---

## In Progress

| ID | Title | P | Owner | Started |
|----|--------|---|-------|---------|
| — | *None* | — | — | — |

---

## Done

| ID | Title | P | Done by | Date | Notes |
|----|--------|---|---------|------|--------|
| INST-0 | Public institutional page + calculators + ROI | P0 | Cursor | 2026-02-25 | `Institutional.tsx`, `pricing.ts` |
| INST-0b | tRPC `institution` router (register, details, staff, stats, quotations, contracts) | P0 | Cursor | 2026-02-25 | `server/routers/institution.ts` |
| INST-0c | Hospital Admin Dashboard calls `getStats` / `getStaffMembers` | P1 | Cursor | 2026-02-25 | Superseded by `getMyInstitution` (see INST-1 row) |
| INST-0d | Post-onboarding welcome alert on portal | P1 | Cursor | 2026-02-25 | `sessionStorage` flag; onboarding now persists via INST-6 |
| INST-1 | `getMyInstitution` — resolve account(s) by `userId` | P0 | Cursor | 2026-02-25 | `server/routers/institution.ts` |
| INST-2 | `register` uses `ctx.user.id`; idempotent if account exists | P0 | Cursor | 2026-02-25 | **Breaking:** register is now **protected** (auth required). |
| INST-3 | Tenant authz on all `institutionId` procedures; admin bypass | P0 | Cursor | 2026-02-25 | `assertInstitutionAccess` in `server/lib/institution-access.ts` |
| INST-4 | Portal KPIs + program overview from `getStats` | P0 | Cursor | 2026-02-25 | `InstitutionalPortal.tsx` |
| INST-5 | Portal staff tab: list + `StaffBulkImport` + invalidate queries | P0 | Cursor | 2026-02-25 | |
| INST-6 | `completeOnboarding` + onboarding UI requires sign-in | P0 | Cursor | 2026-02-25 | Creates account + `institutionalInquiries` row |
| — | Hospital admin: `getMyInstitution`, empty state → onboarding | P0 | Cursor | 2026-02-25 | `HospitalAdminDashboard.tsx` |
| INST-7 | `submitLeadInquiry` + `InstitutionalLeadForm` saves to DB + WhatsApp | P1 | Cursor | 2026-02-25 | `institution.submitLeadInquiry` |
| INST-8 | `/institutional-portal` → `/hospital-admin-dashboard`; welcome on dashboard | P1 | Cursor | 2026-02-25 | Single institutional UX |
| INST-9 | `bulkEnrollFromStaffRoster` + fixed `processBulkEnrollment` enroll/payment ids | P1 | Cursor | 2026-02-25 | Staff tab |
| INST-10 | Quotations tab (`getQuotations`) on hospital admin | P2 | Cursor | 2026-02-25 | List view; PDF export later |
| INST-11 | Institutional notifications — SendGrid/Mailgun via `email-service` | P2 | Cursor | 2026-02-25 | `institutionalNotificationsRouter`: enrollment + completion + batch (`recipientEmails`); tenant `assertInstitutionAccess` |

---

## Sync with main board

- **DATA-1** (InstitutionalPortal KPIs): **done** in this pass (INST-4). Update `BACKLOG_BOARD.md` DATA-1 to Done when you sync the main board.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-25 | Initial board + audit split from platform-wide backlog. |
| 2026-02-25 | INST-1–6 implemented (backend tenant model + portal/onboarding). |
| 2026-02-25 | INST-7–10: lead capture, portal redirect, bulk enroll API, quotations tab. |
| 2026-02-25 | INST-11: institutional email templates + `sendEmail` in notifications router; shared `institution-access` lib. |
