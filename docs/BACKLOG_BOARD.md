# Paeds Resus — Backlog Board

> **For Manus:** This is the **single backlog we must follow**. When you start work, open this file first. Pick from **To Do** (or move a **Backlog** item to To Do), move it to **In Progress**, and when done move it to **Done** and update `docs/WAYFORWARD_EXECUTION_PLAN.md` or the alignment doc as needed. Cursor and the product owner use this board as the source of truth for what’s next.

**Last updated:** 2026-02-25  
**Board owner:** Cursor + Manus (shared)

---

## Considerations — Manus assessment (must follow)

Summary of Manus’s analysis; use this to prioritise and to avoid regressions.

**What’s good**
- High velocity: many tasks delivered end-to-end (backend + frontend + UI).
- Feature completeness: password reset, Safe-Truth notifications, institutional onboarding, admin reporting (referral count, top protocols, conversion funnel) are in place.
- Way Forward and related work (B1 enrollment→payment→cert, B2 institutional onboarding→portal, A3 referral count, A5 Safe-Truth usage, C2 top protocols, C3 conversion funnel) are done.

**What’s concerning (and partly addressed)**
- **M-Pesa webhooks not wired** → **Addressed:** Webhooks are now mounted in Express (`server/_core/index.ts`, `POST /api/mpesa/callback`). See MPESA-0 in Done.
- **Still on M-Pesa sandbox** → In backlog: MPESA-1 (production URL). Real payments need env-based URL switching.
- **No webhook security** → In backlog: MPESA-2 (signature verification). No idempotency yet: MPESA-4.
- **No tests** → In backlog: TEST-1 (vitest for auth, Safe-Truth, payment). Critical before release.
- **ResusGPS sends zero events** → In backlog: A1 (ResusGPS analytics). Admin reports miss core product activity.
- **PRICE-4** → Already done by Cursor (Institutional calculator uses `pricing.ts`).

**Verdict**
- **Blocker before release:** M-Pesa integration (production URL, signature verification, then tests). Webhook *routing* is fixed; production readiness is not.
- **Recommendation:** Do MPESA-1, MPESA-2, then TEST-1 and MPESA-3/4/5 before any release or staging.

**Priority order (from Manus)**

| Priority | Task | Why | Est. |
|----------|------|-----|------|
| P0 | MPESA-1 Production M-Pesa URL | Real payments won’t work | 15 min |
| P0 | MPESA-2 Webhook signature verification | Security vulnerability | 45 min |
| P1 | TEST-1 Vitest tests (P0-4, P0-5, payment) | Can’t ship without confidence | 3 hrs |
| P1 | MPESA-3 Payment status polling | UX | 1 hr |
| P1 | A1 ResusGPS analytics instrumentation | Admin visibility into core product | 30 min |

---

## Board at a glance (Scrum view)

```
┌─────────────────┬──────────────────────────────────────────────────┬──────────────┬────────────────────────────────────────────────────────────┐
│    BACKLOG      │                    TO DO                         │ IN PROGRESS  │                      DONE                                  │
├─────────────────┼──────────────────────────────────────────────────┼──────────────┼────────────────────────────────────────────────────────────┤
│ MPESA-7         │ MPESA-3  Payment status polling         [P1]     │   (none)     │ MPESA-0  Mount webhook                          Cursor 2/25 │
│ MPESA-8         │ MPESA-4  Idempotency                    [P1]     │              │ MPESA-1  Production M-Pesa URL                 Manus  3/15 │
│ REF-1           │ MPESA-5  M-Pesa + critical-flow tests   [P1]     │              │ MPESA-2  Webhook signature verification        Manus  3/15 │
│ DATA-1          │ MPESA-6  Webhook retry / resilience     [P1]     │              │ B1  Enroll→Payment→Cert                       Cursor       │
│                 │ TEST-1   Vitest: P0-4, P0-5, payment    [P1]     │              │ B2  Institutional onboarding→portal           Cursor       │
│                 │ A1       ResusGPS analytics (events)   [P1]     │              │ A3  Referral count (admin)                     Cursor       │
│                 │                                                  │              │ A5  Safe-Truth usage (parent dashboard)       Cursor       │
│                 │                                                  │              │ C2  Top protocols viewed (admin)              Cursor       │
│                 │                                                  │              │ C3  Conversion funnel (admin)                 Cursor       │
│                 │                                                  │              │ P0-1…P0-6, P1-*, P2/P3  Way Forward           Cursor 2/25 │
└─────────────────┴──────────────────────────────────────────────────┴──────────────┴────────────────────────────────────────────────────────────┘
```

---

## How to use this board

| Column | Meaning |
|--------|--------|
| **Backlog** | Not yet scheduled; ready to be pulled when capacity allows. |
| **To Do** | Committed for the current cycle; next up. |
| **In Progress** | Someone is working on it now. |
| **Done** | Completed; update execution plan and push. |

**Workflow:** Backlog → To Do → In Progress → Done. Only one agent should have a given item In Progress at a time.

---

## Board view

### Backlog

| ID | Title | Priority | Notes |
|----|--------|----------|--------|
| MPESA-7 | Webhook IP whitelist | P2 | Restrict callback to Safaricom IPs if documented. |
| MPESA-8 | Payment reconciliation job | P2 | Periodic job to align our records with M-Pesa. |
| REF-1 | Referral status + notifications | P1 | Use status field; notify recipient facility (per audit). |
| DATA-1 | Wire InstitutionalPortal KPIs | P2 | Staff Enrolled, Certified, Incidents to real data or CTAs. |

---

### To Do

| ID | Title | Priority | Assignee | Notes |
|----|--------|----------|----------|--------|
| MPESA-3 | Payment status polling | P1 | — | Frontend polls after STK push so user sees success/failure without refreshing. UX improvement. |
| MPESA-4 | Idempotency for webhooks | P1 | — | Prevent processing same callback twice (e.g. by `CheckoutRequestID` or idempotency key). |
| MPESA-5 | M-Pesa + critical-flow tests | P1 | — | Vitest: payment flow, webhook handlers. Include in TEST-1 or do first for M-Pesa only. |
| MPESA-6 | Webhook retry / resilience | P1 | — | If DB write fails during webhook, retry or dead-letter so payment isn’t lost. |
| TEST-1 | Vitest tests: P0-4, P0-5, payment | P1 | — | Password reset (auth), Safe-Truth (markResponseReady), payment flow. *Can’t ship without confidence.* |
| A1 | ResusGPS analytics instrumentation | P1 | — | ResusGPS currently sends zero events. Wire events so admin reports show core product activity. |

---

### In Progress

| ID | Title | Priority | Assignee | Notes |
|----|--------|----------|----------|--------|
| *none* | — | — | — | Pick an item from **To Do** and move it here when you start. |

---

### Done

| ID | Title | Priority | Done by | Date |
|----|--------|----------|--------|------|
| MPESA-0 | Mount M-Pesa webhook in Express | P0 | Cursor | 2026-02-25 |
| MPESA-1 | Production M-Pesa URL (environment-based switching) | P0 | Manus | 2026-03-15 |
| MPESA-2 | Webhook signature verification (HMAC-SHA256) | P0 | Manus | 2026-03-15 |
| P0-1 | M-Pesa webhook handler (CheckoutRequestID, receipt, cert); webhook now mounted | P0 | Cursor | 2026-02-25 |
| P0-3 | Referral & Personal Impact in Header | P0 | Cursor | 2026-02-25 |
| P0-4 | Password reset (forgot/reset, auth, email, passwordResetTokens) | P0 | Cursor | 2026-02-25 |
| P0-5 | Safe-Truth markResponseReady + email; parent “Response ready” | P0 | Cursor | 2026-02-25 |
| P0-6 | Backend role checks + audit logging | P0 | Cursor / Manus | 2026-02-25 |
| B1 | Enrollment → Payment → Certificate flow; getMyCertificates; My Certificates UI | P0 | Cursor | 2026-02-25 |
| B2 | Institutional onboarding → portal (welcome flag, banner in InstitutionalPortal) | P1 | Cursor | 2026-02-25 |
| A3 | Referral count in admin reports | P1 | Cursor | 2026-02-25 |
| A5 | Safe-Truth usage in parent dashboard (getSafeTruthStats, “Used X times”) | P1 | Cursor | 2026-02-25 |
| C2 | Top protocols viewed in admin | P1 | Cursor | 2026-02-25 |
| C3 | Conversion funnel in admin (Enrolled vs Completed %) | P1 | Cursor | 2026-02-25 |
| PRICE-4 | Institutional calculator pricing (pricing.ts) | P1 | Cursor | 2026-02-25 |
| P1-* (rest) | Way Forward P1 (cert download, empty states, nav, terminology, etc.) | P1 | Cursor | 2026-02-25 |
| P2-1, P2-3, P3-1 | Protocols, SafeTruthAnalytics, Accessibility | P2/P3 | Cursor | 2026-02-25 |

*Full Done list:* `docs/WAYFORWARD_EXECUTION_PLAN.md` and `docs/CURSOR_MANUS_STATUS_ALIGNMENT.md`.

---

## Quick reference

- **Execution plan (what’s done in the main plan):** `docs/WAYFORWARD_EXECUTION_PLAN.md`
- **Cursor/Manus alignment + M-Pesa detail:** `docs/CURSOR_MANUS_STATUS_ALIGNMENT.md`
- **Message to onboard Manus:** `docs/MESSAGE_FOR_MANUS_FULL_CONTEXT.md`
