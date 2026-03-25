# Paeds Resus - High-impact product backlog (comprehensive)

**Purpose:** Mission-aligned backlog of high-impact capabilities (B2C, B2B, clinical, ops). Use for roadmap reviews, sprint planning, and partner conversations.

**Last updated:** 2026-02-25  
**Also read:** `PRODUCT_BACKLOG_PRIORITIZED.md` (tiered IDs), `BACKLOG_BOARD.md`, `INSTITUTIONAL_BACKLOG_BOARD.md`, `MPESA_PRODUCTION_CHECKLIST.md`.

---

## 1. Impact pillars

| Pillar | Good outcome | Primary users |
|--------|----------------|---------------|
| Clinical safety | Correct point-of-care guidance; safe handoffs | Providers |
| Training and certification | Enroll, pay, certify, renew; hospital compliance | Learners, admins |
| Trust and inclusion | Honest metrics; Safe-Truth; privacy | Parents, providers |
| Revenue and scale | M-Pesa and contracts in prod; admin without SQL | Finance, ops, sales |
| Reach and resilience | Clear journeys; low-connectivity later | All |

---

## 2. Shipped summary (high impact)

- Enroll/payment/certificate alignment; M-Pesa webhook idempotency; env unification (`mpesa-env.ts`); admin M-Pesa reconciliation and readiness.
- Institutional funnel (quote vs portal); hospital admin, tenant checks, staff, stats, bulk enroll.
- Parent and institution Learner dashboard metrics from DB; cert expiry UX and user-triggered renewal email.
- Help/Privacy/Terms/About; referral timeline; admin user search and CSV.
- **HI-B2B-3:** Incidents **governance CSV** export on hospital admin Incidents tab (notes omitted).
- **HI-PLAT-4:** **BottomNav** on ResusGPS + Emergency Protocols (mobile); provider nav = Hub / Resus / Protocols / Refer.
- **HI-CERT-1:** **Scheduled** renewal reminder emails (daily ~10:15 server time when scheduler runs) + `renewalReminderSentAt` dedupe; user-triggered reminder also sets dedupe flag.
- **HI-CLIN-1 (thin slice):** ResusGPS **copy session summary** (clipboard + toast) in top bar, event log dialog, and post-primary screen.
- **HI-PLAT-3 (slice):** **`/start`** role chooser + header/mobile **Start** + **Get started** CTA; anonymous BottomNav updated.
- **HI-B2B-1 (slice):** **`createTrainingSchedule`** + hospital admin **Schedule** tab form (catalog `courses` row per program type required).
- **HI-B2B-2 (slice):** **`getTrainingAttendanceForSchedule`**, **`upsertTrainingAttendance`**, **`registerAllStaffForTrainingSession`** + hospital admin **Roster** panel; syncs `enrolledCount` on the schedule.

---

## 3. Forward backlog by pillar

### Clinical / ResusGPS

| ID | Item | Effort | Notes |
|----|------|--------|-------|
| HI-CLIN-1 | ResusGPS session summary + export | L | **Shipped (slice):** copy-to-clipboard + existing `.txt` export; PDF/modal polish still optional |
| HI-CLIN-2 | Evidence-gated protocol prompts | M-L | Reduce alert fatigue |
| HI-CLIN-3 | Analytics to QI / hospital narrative | M | Link ResusGPS usage to admin story |

### Training, payments, certificates

| ID | Item | Effort | Notes |
|----|------|--------|-------|
| HI-PAY-1 | Production M-Pesa smoke test | Ops | Checklist in repo |
| HI-CERT-1 | Scheduled renewal emails | M | **Shipped (v1):** `server/certificate-renewal-cron.ts` + `scheduler.ts` 10:15 daily; column `renewalReminderSentAt`; run DB migration `0026_*.sql` |
| HI-CERT-2 | SMS renewal (optional) | M | Consent |
| HI-PAY-2 | Real payment id on recordPayment | S | **Shipped:** `createPayment` returns row id; `recordPayment` returns it |

### Safe-Truth / parents

| ID | Item | Effort | Notes |
|----|------|--------|-------|
| HI-SAFE-1 | In-app + email polish for response ready | S-M | |
| HI-SAFE-2 | Aggregate insights for hospitals (redacted) | M | Institutional analytics |

### Institutional B2B

| ID | Item | Effort | Notes |
|----|------|--------|-------|
| HI-B2B-1 | Training schedules CRUD | L | **Shipped (create + list):** `createTrainingSchedule` + Schedule tab UI; edit/delete/attendance = HI-B2B-2 |
| HI-B2B-2 | Attendance UI | L | **Shipped (v1):** roster + status select + register-all; skills score / feedback later |
| HI-B2B-3 | Incidents CSV export | M | **Shipped (v1):** client export from `getIncidents` list; notes excluded |
| HI-B2B-4 | Quote/contract PDF polish | M | |

### Platform

| ID | Item | Effort | Notes |
|----|------|--------|-------|
| HI-PLAT-1 | Structured logs + Sentry | M | M-Pesa correlation |
| HI-PLAT-2 | Vitest + TS hardening | M | Kaizen, ResusGPS, admin-stats |
| HI-PLAT-3 | Full role landing chooser | M | **Shipped (slice):** `/start` + nav CTAs; optional polish on `/` redirect |
| HI-PLAT-4 | BottomNav on clinical surfaces | S | **Shipped:** `ResusGPS.tsx`, `EmergencyProtocols.tsx` + provider BottomNav links |
| HI-PLAT-5 | Offline: one protocol bundle | L | Narrow scope |

### Enterprise (defer)

| HI-ENT-1 | Audit CSV export | M | |
| HI-ENT-2 | ML triage assist | L | After baseline metrics |

---

## 4. Suggested sequencing (6-8 weeks)

1. HI-PAY-1 ops smoke test  
2. HI-PLAT-2 tests/TS  
3. HI-CLIN-1 thin slice (session export)  
4. HI-B2B-1 schedule create/list  
5. HI-CERT-1 scheduled emails  
6. HI-B2B-3 incidents CSV  
Parallel: HI-PLAT-1 observability  

---

## 5. Definition of done

- Clinical flows: no silent wrong defaults; a11y considered on touched UI.  
- Money: sandbox tests; prod checklist for Daraja changes.  
- B2B: tenant tests on institution mutations.  
- Update this file or PRODUCT backlog + scrum Done row.

---

## 6. Metrics (lightweight)

M-Pesa pending to completed; enroll to pay conversion; cert downloads/renewals; institutional completion rates; Safe-Truth monthly submissions; webhook error rate.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-25 | Initial version. |
| 2026-02-25 | M-Pesa webhook: length-safe signature compare. `createPayment` / `recordPayment` return real payment id. |
| 2026-02-25 | HI-B2B-3 incidents CSV; HI-PLAT-4 BottomNav; HI-CERT-1 scheduled renewal + `renewalReminderSentAt`; HI-CLIN-1 copy summary. |
| 2026-02-25 | HI-PLAT-3 `/start` chooser; HI-B2B-1 schedule create API + hospital admin form. |
| 2026-03-25 | HI-B2B-2 training attendance tRPC + hospital admin roster UI; Vite `chunkSizeWarningLimit` 900. |
