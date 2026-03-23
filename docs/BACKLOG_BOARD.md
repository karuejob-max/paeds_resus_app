# Paeds Resus — Backlog Board

> **For Manus:** This is the **single backlog we must follow**. When you start work, open this file first. Pick from **To Do** (or move a **Backlog** item to To Do), move it to **In Progress**, and when done move it to **Done** and update `docs/WAYFORWARD_EXECUTION_PLAN.md` or the alignment doc as needed. Cursor and the product owner use this board as the source of truth for what’s next.

**Last updated:** 2026-02-25 (MPESA-7/8 shipped; DB 0025 script + referrals table prerequisite)  
**Board owner:** Cursor + Manus (shared)

---

## Considerations — Manus assessment (must follow)

Summary of Manus’s analysis; use this to prioritise and to avoid regressions.

**What’s good**
- High velocity: many tasks delivered end-to-end (backend + frontend + UI).
- Feature completeness: password reset, Safe-Truth notifications, institutional onboarding, admin reporting (referral count, top protocols, conversion funnel) are in place.
- Way Forward and related work (B1 enrollment→payment→cert, B2 institutional onboarding→portal, A3 referral count, A5 Safe-Truth usage, C2 top protocols, C3 conversion funnel) are done.

**What’s concerning (and partly addressed)**
- **M-Pesa webhooks not wired** → **Addressed:** Webhooks mounted in Express (`server/_core/index.ts`, `POST /api/mpesa/callback`). See MPESA-0 in Done.
- **Still on M-Pesa sandbox** → MPESA-1 (production URL) in Done; use env for production.
- **Webhook security** → MPESA-2 signature verification in Done; idempotency MPESA-4 in Done.
- **Tests** → **Expanded:** `server/lib/async-retry.test.ts` (webhook retry helper); existing Vitest suites (`mpesa-integration`, `daraja`, `p0-6-role-checks`, `parent-safetruth`, etc.). See TEST-1 in Done.
- **ResusGPS** → A1 in Done (`useResusAnalytics`).

**Verdict**
- **Release readiness:** Continue monitoring M-Pesa in production; MPESA-7/8 remain backlog (IP whitelist, reconciliation).

**Priority order (from Manus)** — historical; many items now Done.

| Priority | Task | Why | Est. |
|----------|------|-----|------|
| P0 | MPESA-1 Production M-Pesa URL | Real payments | Done |
| P0 | MPESA-2 Webhook signature verification | Security | Done |
| P1 | TEST-1 Vitest tests | Confidence | Done (partial + ongoing) |
| P1 | MPESA-3 Payment status polling | UX | Done |
| P1 | A1 ResusGPS analytics | Admin visibility | Done |

---

## Board at a glance (Scrum view)

```
┌─────────────────┬──────────────────────────────────────────────────┬──────────────┬────────────────────────────────────────────────────────────┐
│    BACKLOG      │                    TO DO                         │ IN PROGRESS  │                      DONE                                  │
├─────────────────┼──────────────────────────────────────────────────┼──────────────┼────────────────────────────────────────────────────────────┤
│ (see Done)      │                                                  │   (none)     │ MPESA-0 … MPESA-8, TEST-1, REF-1, …                       │
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
| *TBD* | Next product priorities | — | Pull from roadmap / audit docs when ready. |

---

### To Do

| ID | Title | Priority | Assignee | Notes |
|----|--------|----------|----------|--------|
| *none* | — | — | — | Pull from **Backlog** when ready. |

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
| DATA-1 | Wire InstitutionalPortal KPIs (`getStats`, staff list, CSV) | P2 | Cursor | 2026-02-25 | See **INST-4** in `docs/INSTITUTIONAL_BACKLOG_BOARD.md`. |
| MPESA-3 | Payment status polling (tRPC + `MpesaPaymentForm` UI) | P1 | Manus / Cursor | 2026-03-16 | `getPaymentByCheckoutRequestId`, enrollment fallback |
| MPESA-4 | Webhook idempotency (`idempotencyKey` + row checks); `transactionId` stays CheckoutRequestID for polling | P1 | Manus / Cursor | 2026-03-16 | `mpesa-webhook.ts` |
| A1 | ResusGPS `useResusAnalytics` payloads aligned with ResusGPS callers | P1 | Cursor | 2026-02-25 | Events via `events.trackEvent` |
| MPESA-5 | M-Pesa + critical-flow Vitest coverage | P1 | Manus / Cursor | 2026-03-16 | Includes Manus suite + `server/lib/async-retry.test.ts`, `mpesa-integration`, `daraja` |
| MPESA-6 | Webhook retry / resilience | P1 | Cursor | 2026-02-25 | `runWithRetries` on success path; **500** after exhaustion for Daraja retry |
| TEST-1 | Vitest: auth, Safe-Truth, payment-related coverage | P1 | Manus / Cursor | 2026-03-16 | `async-retry.test.ts`; `p0-6-role-checks`, `parent-safetruth`, M-Pesa tests — expand as needed |
| REF-1 | Referral status + notifications | P1 | Cursor | 2026-02-25 | `facilityContactEmail` on `clinicalReferrals`; `referrals.submitReferral` + `adminUpdateReferralStatus`; templates in `email-service.ts`; SQL `drizzle/0025_add_facility_contact_email.sql` |
| MPESA-7 | Webhook IP allowlist (opt-in) | P2 | Cursor | 2026-02-25 | `MPESA_CALLBACK_IP_ALLOWLIST` + `TRUST_PROXY`; `server/lib/mpesa-callback-ip.ts`; `POST /api/mpesa/callback` |
| MPESA-8 | M-Pesa reconciliation (admin) | P2 | Cursor | 2026-02-25 | `mpesa.getStaleMpesaPendingForReconciliation`, `mpesa.adminReconcileMpesaPayment`; `server/mpesa-reconciliation.ts` |

*Full Done list:* `docs/WAYFORWARD_EXECUTION_PLAN.md` and `docs/CURSOR_MANUS_STATUS_ALIGNMENT.md`.

---

## Quick reference

- **Execution plan (what’s done in the main plan):** `docs/WAYFORWARD_EXECUTION_PLAN.md`
- **Cursor/Manus alignment + M-Pesa detail:** `docs/CURSOR_MANUS_STATUS_ALIGNMENT.md`
- **Message to onboard Manus:** `docs/MESSAGE_FOR_MANUS_FULL_CONTEXT.md`
- **Institutional platform (audit + scrum board):** `docs/INSTITUTIONAL_PLATFORM_AUDIT.md`, `docs/INSTITUTIONAL_BACKLOG_BOARD.md`
