# Way Forward — Execution Plan (Cursor & Manus)

**Purpose:** Single place to track what's done and what's left on the platform plan. Update this file when you complete a task.

**Source (full spec):** `docs/PLATFORM_AUDIT_WHAT_IS_MISSING.md` (unified priority list §7.3), pricing in codebase.

---

## How to use this plan

1. **Work in order** — Pick the next task that's **Not started**. If **Done**, skip.
2. **When you finish a task** — Set **Status** to **Done**, **Done by** to `Cursor` or `Manus`, **Date** to YYYY-MM-DD. Commit and push.
3. **Use the audit** — For "what to do" and "where," use `docs/PLATFORM_AUDIT_WHAT_IS_MISSING.md` and §7.3.

---

## Task list (execution order)

### P0 — Critical (Enroll ↔ Payment, nav, auth)

| # | Task ID | Title | Where | Status | Done by | Date |
|---|---------|--------|------|--------|--------|------|
| 1 | P0-2a | Return real enrollmentId from enrollment.create | `server/db.ts`, `server/routers/enrollment.ts` | Done | Cursor | 2026-02-25 |
| 2 | P0-2b | Enroll → Payment: redirect with enrollmentId; Payment use existing enrollment | Enroll.tsx, Payment.tsx, mpesa.initiatePayment (enrollmentId), MpesaPaymentForm | Done | Cursor | 2026-02-25 |
| 3 | P0-1 | M-Pesa webhook: match payment, issue certificate | `server/webhooks/mpesa-webhook.ts`, mpesa router | Done | Cursor | 2026-02-25 |
| 4 | P0-3 | Referral & Personal Impact discoverable | Header.tsx, Home.tsx, or BottomNav | Done | Cursor | 2026-02-25 |
| 5 | P0-4 | Password reset | Login.tsx, auth router | Done | Cursor | 2026-02-25 |
| 6 | P0-5 | Safe-Truth: notify parent when response ready | parent-safetruth router, ParentSafeTruth.tsx | Done | Cursor | 2026-02-25 |
| 7 | P0-6 | Role checks on backend + admin audit log | server/_core/trpc.ts, routers | Done | Manus | 2026-03-15 |

### P1 — Important (pricing, certificate, empty states, terminology)

| # | Task ID | Title | Where | Status | Done by | Date |
|---|---------|--------|------|--------|--------|------|
| 8 | PRICE-2 | Enroll page: use pricing.ts (done: courses from pricing) | Enroll.tsx | Done | Cursor | 2026-02-25 |
| 9 | PRICE-4 | Institutional calculator: use pricing.ts only | Institutional.tsx | Not started | — | — |
| 10 | P1-2 | Certificate download (PDF) | certificates router, LearnerDashboard | Not started | — | — |
| 11 | P1-3 | Empty state CTAs on data-dependent pages | PerformanceDashboard, InstitutionalPortal, etc. | Not started | — | — |
| 12 | P1-4 | Remove hardcoded dashboard numbers | LearnerDashboard.tsx | Not started | — | — |
| 13 | P1-5 | Terminology + one-place explanation | Nav, footer/About | Not started | — | — |
| 14 | P1-6 | "For Institutions" and landing "/" | Header, Institutional.tsx | Not started | — | — |
| 15 | P1-7 | Breadcrumb and support/legal nav | navigation.ts | Not started | — | — |

### P2 / P3 — Orphaned pages, polish

| # | Task ID | Title | Status |
|---|---------|--------|--------|
| 16 | P2-1 | Route or surface clinical protocols | Not started |
| 17 | P2-3 | SafeTruthAnalytics reachable | Not started |
| 18 | P3-1 | Accessibility (ARIA, keyboard) | Not started |

*Full list in PLATFORM_AUDIT_WHAT_IS_MISSING.md §7.3.*

---

*Last updated: 2026-03-15. Update Status / Done by / Date when you complete a task.*
