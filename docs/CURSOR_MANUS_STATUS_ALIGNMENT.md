# Cursor / Manus Status Alignment

**Purpose:** Single source of truth so both Cursor and Manus agree on what’s done and what’s left.  
**Last updated:** 2026-02-25 (Cursor) + Manus M-Pesa audit 2026-03-15.

---

## 1. Task status (aligned view)

### P0 — Critical — **All done**

| Task | Done by | Date |
|------|--------|------|
| P0-2a: Real enrollmentId | Cursor | 2026-02-25 |
| P0-2b: Enroll → Payment flow | Cursor | 2026-02-25 |
| P0-1: M-Pesa webhook + certificate | Cursor | 2026-02-25 |
| P0-3: Referral & Personal Impact discoverable | Cursor | 2026-02-25 |
| P0-4: Password reset | Cursor | 2026-02-25 |
| P0-5: Safe-Truth notifications | Cursor | 2026-02-25 |
| P0-6: Backend role checks + audit | Cursor (verified) / Manus | 2026-02-25 / 2026-03-15 |

### P1 — Important — **All done (Cursor 2026-02-25)**

| Task | Status |
|------|--------|
| PRICE-2: Enroll page pricing | Done |
| PRICE-4: Institutional calculator pricing | Done |
| P1-2: Certificate PDF download | Done |
| P1-3: Empty state CTAs | Done |
| P1-4: Remove hardcoded dashboard numbers | Done |
| P1-5: Terminology + explanations | Done |
| P1-6: "For Institutions" nav + public page | Done |
| P1-7: Breadcrumb & support/legal nav | Done |

### P2 / P3 — **All done (Cursor 2026-02-25)**

| Task | Status |
|------|--------|
| P2-1: Route/surface clinical protocols | Done |
| P2-3: SafeTruthAnalytics reachable | Done |
| P3-1: Accessibility (ARIA, keyboard) | Done |

**Progress:** 18/18 tasks in the Way Forward plan are done. The canonical list is in `docs/WAYFORWARD_EXECUTION_PLAN.md`.

---

## 2. M-Pesa: Manus audit and Cursor response

Manus’s audit (2026-03-15) is correct: the integration was **not production-ready** because of several gaps. Below is what Cursor fixed and what remains.

### Fixed by Cursor (this round)

- **Webhooks mounted in Express**  
  The handlers in `server/webhooks/mpesa-webhook.ts` were never registered. They are now mounted in `server/_core/index.ts`:
  - `POST /api/payment/callback` (canonical) and `POST /api/mpesa/callback` (legacy) → same handler; delegates by payload to `handleMpesaWebhook`, `handleMpesaQueryWebhook`, or `handleMpesaTimeoutWebhook`.

So: **M-Pesa callbacks will no longer 404**; payment status and certificate issuance can run when Daraja hits the callback URL.

### Still to do (per Manus audit)

| Priority | Item | Notes |
|----------|------|--------|
| **P0** | Use production M-Pesa URL | Currently sandbox in `server/services/mpesa.ts` (or mock); switch via env e.g. `MPESA_ENVIRONMENT=production` and production base URL. |
| **P0** | Webhook signature verification | Validate Daraja signature on callback so callbacks can’t be forged. |
| **P1** | Payment status polling | Frontend polls or long-polls after STK push so user sees success/failure without refreshing. |
| **P1** | Idempotency | Prevent processing the same callback twice (e.g. by `CheckoutRequestID` or idempotency key). |
| **P1** | Tests | Unit/integration tests for payment flow and webhook handlers. |
| **P1** | Retry / resilience | If DB write fails in webhook, retry or dead-letter so payment isn’t lost. |
| **P2** | Webhook IP whitelist | Optional hardening; restrict to Safaricom IPs if documented. |
| **P2** | Reconciliation job | Periodic job to align our records with M-Pesa. |

**Verdict:** Webhook **routing** is fixed. Production readiness still requires: production URL, signature verification, and (recommended) idempotency, polling, tests, and retry handling.

---

## 3. How to keep status in sync

- **Backlog board (single source for “what’s next”):** `docs/BACKLOG_BOARD.md` — scrum-style board (Backlog | To Do | In Progress | Done). **Manus and Cursor must follow this:** pick from To Do, move to In Progress when starting, move to Done when finished.
- **Execution plan:** Update `docs/WAYFORWARD_EXECUTION_PLAN.md` when a Way Forward task is completed (Status = Done, Done by, Date).
- **This doc:** Use for Cursor/Manus alignment and for M-Pesa “what’s done vs what’s left.” Update when either party fixes an item or re-audits.
