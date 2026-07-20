# Paeds Resus — Institutional backlog board

> **Purpose:** Scrum-style board for **institutional (B2B / hospital)** work only.  
> **How to use:** Before starting, check **In Progress** (avoid duplicate work). Move cards **To Do → In Progress → Done**. Always set **Owner** when In Progress, and **Done by + Date** when complete.  
> **Last updated:** 2026-07-20 (INST-16 shipped end-to-end; INST-17, INST-23 shipped; INST-18, 19, 20, 21, 22 backlog)  
> **Owner:** Product + Cursor + Manus (shared)

**Related:** Full gap analysis and prioritization → `docs/INSTITUTIONAL_PLATFORM_AUDIT.md`  
**Main platform (M-Pesa, tests, etc.):** `docs/BACKLOG_BOARD.md`  
**Cross-cutting high-impact roadmap:** `docs/BACKLOG_HIGH_IMPACT.md`

---

## Board at a glance

```
┌─────────────────┬──────────────────────────────────────────────┬──────────────┬────────────────────────────────────────────────────────┐
│    BACKLOG      │                    TO DO                     │ IN PROGRESS  │                      DONE                            │
├─────────────────┼──────────────────────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ INST-18…22       │                                                 │   (none)     │ INST-0 … INST-15, INST-16, INST-17, INST-23 (see Done)│
└─────────────────┴──────────────────────────────────────────────┴──────────────┴────────────────────────────────────────────────────────┘
```

\* Hospital admin resolves **`institutionId` via `getMyInstitution`**.

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

Items INST-16–22 below come from a 2026-07-19 premortem on the Subsidised ACLS/BLS Cohort Program (CEO-requested; see `docs/WORK_STATUS.md` and `AGENTS.md` §10 for the program itself). Sequencing notes are in the premortem plan; P1 items are active leaks/risks today, not future-proofing.

| ID | Title | Priority | Impact | Ease (1–5) | Notes |
|----|--------|----------|--------|------------|--------|
| INST-18 | Wire `individualInstallmentPayments` to actually record each payment | P2 | Medium | 3 | Table exists since migration 0066; nothing inserts into it. `totalPaidAmount` (the aggregate) is correctly computed and live — this is about the missing per-instalment audit trail for dispute resolution ("I paid three times") and payment-plan visibility. |
| INST-19 | Instructor pipeline scaling | P1 | Critical | 1 | The actual ceiling on the whole program — rolling batches of 8 reaching Phase 3 depend entirely on instructor availability, and CEO delivery doesn't scale past one facility. CEO has a method in mind, not yet shared/built. Blocks Kenya-wide spread and EAC expansion regardless of what else ships. |
| INST-20 | Shareable institutional readiness artifact (cohort completion summary a coordinator can hand to a CEO/CNO) | P2 | High | 3 | `CohortProgressWidget`/`getCohortProgress` exist and are real, but they're a private coordinator dashboard, not something designed to trigger the "invite us to sell ERS" moment the program's theory of change depends on. |
| INST-21 | Communicate the Terms of Use 1.1.0 re-consent gate before/alongside rollout | P1 | Medium | 5 | `termsOfUse` was bumped to 1.1.0 (non-refundable cohort clause) — every existing user now hits the consent gate cold, with no heads-up. Cheapest fix on this list; do it fast. |
| INST-22 | EAC expansion readiness (country/admin_level schema, local payment rails, AHA site recognition per country) | P3 | High (long-term) | 1 | Correctly not started yet. Real risk is pressure to build this before the Kenya program has proven completion rates — sequence behind, not alongside, INST-16–20. |

---

## To Do

| ID | Title | P | Owner | Notes |
|----|--------|---|-------|--------|
| — | *None* | — | — | — |

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
| INST-11 | Institutional notifications — SendGrid/Mailgun via `email-service` | P2 | Cursor | 2026-02-25 | `institutionalNotificationsRouter` |
| INST-12 | Training schedules: list API + hospital admin **Schedule** tab | P2 | Cursor | 2026-02-25 | `getTrainingSchedules` |
| INST-13 | Incidents: `getIncidents` + `createIncident` + **Incidents** tab | P2 | Cursor | 2026-02-25 | Tenant-scoped; JSON fields for staff/protocols/gaps |
| INST-14 | `institutionalAnalytics` rollup + nightly cron + Overview card + refresh | P3 | Cursor | 2026-02-25 | `institutional-analytics-rollup.ts`, `03:20` cron, `ENABLE_SCHEDULER` / production |
| INST-15 | Admin-approved instructors + `instructorUserId` on training sessions | P1 | Cursor | 2026-04-01 | `users.instructorApprovedAt`, Admin Reports, Hospital Admin Schedule |
| INST-17 | Nurse instalment-pace gate (KES 2,500/month, no deferral window) | P1 | Claude | 2026-07-19 | `bookHandsOnSession` + `getPhaseSummary` (`nursePaceRequiredByNow`/`nursePaceLockoutActive`) in `courses.ts` |
| INST-23 | BLS-before-ACLS/PALS prerequisite gate (platform-wide) | P1 | Claude | 2026-07-19 | `ensureAhaEnrollment` in `courses.ts`; interpreted "complete" as `practicalSkillsSignedOff`, flagged for CEO confirmation |
| INST-16 | Subsidised-rate eligibility gate (nurse w/ licence, or intern) — designation-input UI | P1 | Claude | 2026-07-20 | Closed the launch-blocking gap: no UI anywhere let anyone set `designation`. Added `DesignationDeclarationCard` (self-service, `LearnerDashboard.tsx`), designation select in `AddStaffForm.tsx`, and a `designation` CSV column + validation in `StaffBulkImport.tsx` |

---

## Sync with main board

- **DATA-1** (InstitutionalPortal KPIs): **done** (INST-4).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-25 | Initial board + audit split from platform-wide backlog. |
| 2026-02-25 | INST-1–6 implemented (backend tenant model + portal/onboarding). |
| 2026-02-25 | INST-7–10: lead capture, portal redirect, bulk enroll API, quotations tab. |
| 2026-02-25 | INST-11: institutional email via `email-service`. |
| 2026-02-25 | INST-12: training schedule list + tab. |
| 2026-02-25 | INST-13/14: incidents UI + analytics rollup + scheduler wiring. |
