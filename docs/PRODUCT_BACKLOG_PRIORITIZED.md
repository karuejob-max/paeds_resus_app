# Paeds Resus — Product backlog (impact-prioritized)

> **Purpose:** Single **prioritized** view of what to build next, ordered by **user + business impact**, not by completion history.  
> **Complements:** `docs/BACKLOG_BOARD.md` (scrum / Done archive) and `docs/INSTITUTIONAL_BACKLOG_BOARD.md` (B2B scrum).  
> **How to use:** Work **top-down** within each tier. When an item ships, move it to the appropriate scrum board **Done** row and trim or re-rank this file.

**Last updated:** 2026-02-25  
**Owner:** Product + engineering (shared)

---

## Impact × feasibility (recommended order)

Use this when choosing the **next** piece of work. **Impact** = clinical safety, revenue, trust, or growth. **Feasibility** = time to ship safely with current codebase and team bandwidth.

| Zone | Meaning | Action |
|------|---------|--------|
| **A — High impact, high feasibility** | Strong ROI; small risk | **Do next** (this week / sprint) |
| **B — High impact, lower feasibility** | Worth it; must be sliced | **Thin vertical slice**, then iterate |
| **C — Lower impact, high feasibility** | Polish / hygiene | **Batch** after A or in cooldown weeks |
| **D — Lower impact, lower feasibility** | Expensive nice-to-haves | **Defer** until A/B clear |

### A — Do next (impact + feasibility)

| Item | Why here |
|------|----------|
| **P0-PAY-1 (ops)** | One **live** small STK + webhook check using `MPESA_PRODUCTION_CHECKLIST.md` — highest revenue/trust leverage, **no code** if env is right. |
| **M-Pesa env consistency** | Align **`MPESA_ENV`** vs **`MPESA_ENVIRONMENT`** usage across `mpesa-real` / services / readiness so prod/sandbox is never ambiguous (**S** code + doc tweak). |
| **Test & type hardening** | Fix **flaky or failing** Vitest (e.g. M-Pesa critical flow expectations, Kaizen mocks) and worst **TS** debt on hot paths — improves feasibility of everything else (**S–M**). |
| **P1-CERT-1 (notifications)** | **Email (or SMS) nudge** when `expiryDate` within N days — builds on existing cert data + renewal CTAs; clear B2B/B2C revenue loop (**M**, bounded scope). |

### B — Slice thin (high impact, heavier lift)

| Item | First slice |
|------|-------------|
| **P1-RESUS-1** | **End-of-session summary** only: structured fields + “Copy summary” / PDF one-pager — no full “handoff v2” yet. |
| **P2-BULK-1** | **Create + list** `trainingSchedules` in UI (tenant-scoped); **attendance** in a second slice. |
| **P3-GOV-1** | **Incidents CSV** export (institution-scoped, redacted columns) before PDF/committee polish. |

### C — Batch when capacity allows

| Item | Notes |
|------|--------|
| **P2-LAND-1 (full)** | Dedicated `/` or `/start` chooser vs ResusGPS-first — good UX, not blocking revenue. |
| **P0-NAV-1 (BottomNav)** | Provider surfaces only; small UI win. |
| **Observability** | Structured fields on M-Pesa webhook + Sentry (or similar) in prod. |

### D — Defer

| Item | Notes |
|------|--------|
| **P3-ML-1** | Governance + validation cost too high until metrics baseline exists. |
| **P3-INT-1 (broad)** | Start with **audit CSV** only if enterprise pull is real. |
| **P3-LOC-1 (broad offline)** | Scope to **one protocol bundle** or don’t start. |

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
| **P0-ENROLL-1** | **Unify Enroll → Payment → Certificate** | Users who enroll must be able to pay the **same** enrollment and receive a cert; today `/enroll` and `/payment` can diverge (see platform audit §2). | M | **Shipped (core):** `enrollment.getById` (owner-scoped), Payment locks course + M-Pesa enrollment guard; `enrollment.create` returns real id. |
| **P0-PAY-1** | **End-to-end M-Pesa truth test in production** | Revenue and certs depend on STK + webhook + DB; validate on live env with real small transaction. | S–M | **Shipped (supporting):** `mpesa.getOperationalReadiness` (admin), `docs/MPESA_PRODUCTION_CHECKLIST.md`. **Ops:** run live small STK test per checklist. |
| **P0-NAV-1** | **Referral & high-value tools discoverable** | Referrals and impact journeys are underused if hidden; slows adoption and Safe-Truth narrative. | S | **Shipped:** Header + Home hub. Optional: `BottomNav` on clinical surfaces. |

---

## P1 — Highest-impact product features (differentiation + growth)

| ID | Initiative | Impact | Effort | Notes |
|----|------------|--------|--------|--------|
| **P1-RESUS-1** | **ResusGPS: outcomes + handoff** | Core clinical differentiator; ties analytics to real resuscitation quality. | L | Structured end-of-session summary, optional export, tighter protocol adherence prompts where evidence supports. |
| **P1-SAFE-1** | **Safe-Truth: parent metrics from DB** | Hardcoded parent dashboard numbers erode trust (`PLATFORM_AUDIT` §3.3). | S–M | **Shipped:** Parent Learner dashboard + `getSafeTruthStats.totalSubmissions`; ParentSafeTruth wired. **Shipped:** Institution role on Learner dashboard uses `institution.getStats` (replaces hardcoded zeros). |
| **P1-INST-1** | **Institutional funnel clarity** | “For Institutions” vs gated portal confuses buyers (`PLATFORM_AUDIT` §3.2). | M | **Shipped:** Funnel strip on `/institutional` (quote vs portal); `#quote` anchor; `/contact` → quote section. |
| **P1-CERT-1** | **Certificate renewal & reminders** | Drives repeat revenue and compliance for hospitals. | M | **Shipped (UX):** Expiry warnings, renew CTAs to `/enroll` on Learner dashboard. **Future:** email/SMS hooks from `certificates`. |
| **P1-ADM-1** | **Admin: operational dashboards** | Faster support and fraud/payment investigation. | M | **Shipped:** `/admin/mpesa-reconciliation` (stale list, STK reconcile, CSV); `getUsers` search + CSV export in Reports; `getOperationalReadiness`. |

---

## P2 — Strong impact, can follow P1

| ID | Initiative | Impact | Effort | Notes |
|----|------------|--------|--------|--------|
| **P2-LAND-1** | **Role-aware landing (`/`)** | Improves first-time comprehension without blocking power users. | M | **Shipped (light):** Anonymous Header links (Parents, Institutions, Help). Full `/` chooser still optional. |
| **P2-SUP-1** | **Support & legal routes** | Reduces confusion; needed for schools and partners. | S–M | **Shipped:** `/help`, `/privacy`, `/terms`, `/about`; `supportNavItems` updated; `/faq` → help. |
| **P2-BULK-1** | **Institutional: create training schedules + attendance from UI** | Completes B2B loop beyond read-only schedule list. | L | CRUD on `trainingSchedules`, `trainingAttendance` with tenant checks. |
| **P2-REF-1** | **Referrals: in-app status for referring clinician** | REF-1 backend exists; surface status timeline in UI. | M | **Shipped (v1):** Status timeline + copy on `Referral.tsx` list cards. |
| **P2-MPESA-1** | **Reconciliation UI for finance** | Uses `getStaleMpesaPendingForReconciliation` / `adminReconcileMpesaPayment` without SQL. | S–M | **Shipped:** Same as admin M-Pesa reconciliation page. |

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

## Suggested next three sprints (impact × feasibility)

1. **Sprint 1:** **P0-PAY-1 live test** + **M-Pesa env alignment** + **fix worst test/TS regressions** (unblocks confident shipping).  
2. **Sprint 2:** **P1-CERT-1 notifications** (expiry email/SMS MVP) + **P1-RESUS-1 slice** (session summary export only).  
3. **Sprint 3:** **P2-BULK-1** (schedules create/list) *or* **P3-GOV-1** (incidents CSV), whichever matches sales/governance pressure.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-25 | Initial impact-prioritized backlog created from mission, README, and `PLATFORM_AUDIT_WHAT_IS_MISSING.md`. |
| 2026-02-25 | P0-ENROLL-1 / P0-NAV-1 / P1-SAFE-1 (partial): `enrollment.getById`, Payment lock + M-Pesa enrollment guard, Home hub cards, `getSafeTruthStats.totalSubmissions`, LearnerDashboard parent KPIs. |
| 2026-02-25 | Remaining backlog pass: P0-PAY-1 support (readiness + runbook), P1-INST-1 funnel, P1-CERT-1 renewal UX, P1-ADM-1 + P2-MPESA-1 reconciliation UI, P2-SUP-1 routes, P2-LAND-1 header links, P2-REF-1 referral timeline, institution stats on Learner dashboard, admin user search/CSV. |
| 2026-02-25 | Added **Impact × feasibility** section and re-ordered suggested sprints around ops closure, env consistency, test/TS hardening, cert notifications, then thin ResusGPS / B2B slices. |
