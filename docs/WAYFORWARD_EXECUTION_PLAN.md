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
| 7 | P0-6 | Role checks on backend + admin audit log | server/_core/trpc.ts, routers | Done | Cursor | 2026-02-25 |

### P1 — Important (pricing, certificate, empty states, terminology)

| # | Task ID | Title | Where | Status | Done by | Date |
|---|---------|--------|------|--------|--------|------|
| 8 | PRICE-2 | Enroll page: use pricing.ts (done: courses from pricing) | Enroll.tsx | Done | Cursor | 2026-02-25 |
| 9 | PRICE-4 | Institutional calculator: use pricing.ts only | Institutional.tsx | Done | Cursor | 2026-02-25 |
| 10 | P1-2 | Certificate download (PDF) | certificates router, LearnerDashboard | Done | Cursor | 2026-02-25 |
| 11 | P1-3 | Empty state CTAs on data-dependent pages | PerformanceDashboard, InstitutionalPortal, etc. | Done | Cursor | 2026-02-25 |
| 12 | P1-4 | Remove hardcoded dashboard numbers | LearnerDashboard.tsx | Done | Cursor | 2026-02-25 |
| 13 | P1-5 | Terminology + one-place explanation | Nav, footer/About | Done | Cursor | 2026-02-25 |
| 14 | P1-6 | "For Institutions" and landing "/" | Header, Institutional.tsx | Done | Cursor | 2026-02-25 |
| 15 | P1-7 | Breadcrumb and support/legal nav | navigation.ts | Done | Cursor | 2026-02-25 |

### P2 / P3 — Orphaned pages, polish

| # | Task ID | Title | Status |
|---|---------|--------|--------|
| 16 | P2-1 | Route or surface clinical protocols | Done |
| 17 | P2-3 | SafeTruthAnalytics reachable | Done |
| 18 | P3-1 | Accessibility (ARIA, keyboard) | Done |

*Full list in PLATFORM_AUDIT_WHAT_IS_MISSING.md §7.3.*

---

*Last updated: 2026-02-25. Update Status / Done by / Date when you complete a task.*

**Next work (M-Pesa, tests, ResusGPS analytics):** See **`docs/BACKLOG_BOARD.md`** — scrum board (To Do / In Progress / Done). That is the single backlog Cursor and Manus must follow. If you don’t see that file, pull latest; it was added in the same pass as this note.
