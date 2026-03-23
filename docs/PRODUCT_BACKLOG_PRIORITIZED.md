# Paeds Resus — Product backlog (impact-prioritized)

> **Purpose:** Single **prioritized** view of what to build next, ordered by **user + business impact**, not by completion history.  
> **Complements:** `docs/BACKLOG_BOARD.md` (scrum / Done archive) and `docs/INSTITUTIONAL_BACKLOG_BOARD.md` (B2B scrum).  
> **How to use:** Work **top-down** within each tier. When an item ships, move it to the appropriate scrum board **Done** row and trim or re-rank this file.

**Last updated:** 2026-02-25  
**Owner:** Product + engineering (shared)

---

## Prioritization lens

| Factor | Weight (guidance) |
|--------|-------------------|
| **Clinical / child safety** | Highest — wrong flow or missing signal in training or point-of-care hurts the mission. |
| **Revenue & completion** | High — enroll → pay → cert, institutional contracts, M-Pesa reliability. |
| **Trust & retention** | High — accurate data, privacy, parent/provider confidence. |
| **Reach** | Medium-high — discoverability (nav, landing), mobile, low connectivity. |
| **Scale & ops** | Medium — admin tooling, observability, cost control. |

**Effort** is noted qualitatively (**S** / **M** / **L**) to help sequencing, not to override impact for P0 items.

---

## P0 — Must-fix or must-ship (wrong or broken without these)

These unblock money, certificates, or core trust.

| ID | Initiative | Impact | Effort | Notes / pointers |
|----|------------|--------|--------|-------------------|
| **P0-ENROLL-1** | **Unify Enroll → Payment → Certificate** | Users who enroll must be able to pay the **same** enrollment and receive a cert; today `/enroll` and `/payment` can diverge (see platform audit §2). | M | Redirect to payment with `enrollmentId`, or single combined flow; fix `enrollment.create` to return **real** `enrollmentId` (not placeholder `1`). |
| **P0-PAY-1** | **End-to-end M-Pesa truth test in production** | Revenue and certs depend on STK + webhook + DB; validate on live env with real small transaction. | S–M | Confirm `transactionId` / CheckoutRequestID / receipt alignment with callback; monitor logs. |
| **P0-NAV-1** | **Referral & high-value tools discoverable** | Referrals and impact journeys are underused if hidden; slows adoption and Safe-Truth narrative. | S | Add **Referral** (and Personal Impact if kept) to **Header** or **Home** hub; or ship `BottomNav` on provider surfaces (`PLATFORM_AUDIT_WHAT_IS_MISSING.md` §1). |

---

## P1 — Highest-impact product features (differentiation + growth)

| ID | Initiative | Impact | Effort | Notes |
|----|------------|--------|--------|--------|
| **P1-RESUS-1** | **ResusGPS: outcomes + handoff** | Core clinical differentiator; ties analytics to real resuscitation quality. | L | Structured end-of-session summary, optional export, tighter protocol adherence prompts where evidence supports. |
| **P1-SAFE-1** | **Safe-Truth: parent metrics from DB** | Hardcoded parent dashboard numbers erode trust (`PLATFORM_AUDIT` §3.3). | S–M | Wire `getSafeTruthStats` (or equivalent) to all displayed KPIs. |
| **P1-INST-1** | **Institutional funnel clarity** | “For Institutions” vs gated portal confuses buyers (`PLATFORM_AUDIT` §3.2). | M | Public **marketing / contact** path vs **signed-in portal**; clear CTAs (quote, demo, register). |
| **P1-CERT-1** | **Certificate renewal & reminders** | Drives repeat revenue and compliance for hospitals. | M | Expiry from `certificates`, email/SMS hooks, simple “renew” path. |
| **P1-ADM-1** | **Admin: operational dashboards** | Faster support and fraud/payment investigation. | M | Stale M-Pesa reconciliation UI (expose existing tRPC), user/enrollment search, export CSV. |

---

## P2 — Strong impact, can follow P1

| ID | Initiative | Impact | Effort | Notes |
|----|------------|--------|--------|--------|
| **P2-LAND-1** | **Role-aware landing (`/`)** | Improves first-time comprehension without blocking power users. | M | Short chooser: ResusGPS vs Parent vs Institutional vs Sign in; optional keep deep link to ResusGPS. |
| **P2-SUP-1** | **Support & legal routes** | Reduces confusion; needed for schools and partners. | S–M | Real `/help`, `/privacy`, `/terms` or single help centre; fill `supportNavItems` / `legalNavItems`. |
| **P2-BULK-1** | **Institutional: create training schedules + attendance from UI** | Completes B2B loop beyond read-only schedule list. | L | CRUD on `trainingSchedules`, `trainingAttendance` with tenant checks. |
| **P2-REF-1** | **Referrals: in-app status for referring clinician** | REF-1 backend exists; surface status timeline in UI. | M | `getReferrals` + status badges + optional push/email prefs. |
| **P2-MPESA-1** | **Reconciliation UI for finance** | Uses `getStaleMpesaPendingForReconciliation` / `adminReconcileMpesaPayment` without SQL. | S–M | Small admin page or CMS section. |

---

## P3 — Later / experimental

| ID | Initiative | Impact | Effort | Notes |
|----|------------|--------|--------|--------|
| **P3-LOC-1** | Offline / low-bandwidth mode for key protocols | Reach in poor connectivity settings. | L | Cache critical bundles; scope narrowly first. |
| **P3-GOV-1** | Incident export (CSV/PDF) for committees | Governance and grant reporting. | M | Incidents + Safe-Truth exports with redaction options. |
| **P3-INT-1** | EMR-adjacent hooks (identifiers, not full HL7) | Enterprise sales. | L | Start with audit log + manual CSV bridge. |
| **P3-ML-1** | Risk / triage assist (governed) | High upside but high validation burden. | L | Only after measurement baseline exists. |

---

## Cross-cutting (always in flight)

| Theme | Why it matters |
|--------|----------------|
| **Observability** | Structured logs for M-Pesa, webhooks, enrollments; error tracking (e.g. Sentry) in production. |
| **Security** | Secrets in env only; rotate after leaks; optional `MPESA_CALLBACK_IP_ALLOWLIST` in prod. |
| **Performance** | DB indexes on hot paths (`payments.transactionId`, `enrollments.userId`, institutional FKs). |
| **Accessibility** | Keyboard + contrast on clinical flows (P2/P3 in Way Forward). |
| **Tests** | Keep Vitest growing on payment, enrollment, webhook, and institutional tenant boundaries. |

---

## Suggested next three sprints (example)

1. **Sprint A:** P0-ENROLL-1 + P0-NAV-1 (unblock cert path + discoverability).  
2. **Sprint B:** P0-PAY-1 + P1-SAFE-1 (production payment confidence + honest parent metrics).  
3. **Sprint C:** P1-INST-1 + P1-ADM-1 (B2B clarity + admin ops).

Adjust based on your sales cycle (e.g. push **P1-INST-1** earlier if enterprise pipeline is hot).

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-25 | Initial impact-prioritized backlog created from mission, README, and `PLATFORM_AUDIT_WHAT_IS_MISSING.md`. |
