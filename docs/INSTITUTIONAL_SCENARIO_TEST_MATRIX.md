# Institutional scenario test matrix

This matrix is the release evidence contract for the Institutional Portal. Unit tests are necessary but do not prove that a hospital can operate safely.

| Scenario | Expected safety property | Automated coverage | Production/staging evidence |
|---|---|---|---|
| A. Institution onboarding | Two administrators can establish one institution, departments, roles, an approved contract, invoice, and workspace without cross-tenant references. | Contract/invoice typecheck; institution role suites. | Run with disposable institution and record authenticated screenshots/logs. |
| B. Department governance | Department head/ERCo scope is explicit; assignment is not equivalent to acceptance or active duty. | `server/routers/iers-provider-duty-staging.test.ts`; department reconciliation staging suite. | Create, accept, replace, and end a dated roster responsibility. |
| C. Emergency activation | Only exact institution/pole/date/shift members can receive or acknowledge activation; timeline is monotonic. | Existing IERS provider authorization and CPR event-link suites. | Exercise activation with two labelled test providers and verify notifications/timeline. |
| D. QI governance | Department and action owner are institution-scoped; every state change has actor/reason; closure requires effectiveness evidence with no unresolved follow-up. | `server/lib/institutional-trust-invariants.test.ts`; QI router checks. | Submit a synthetic report, assign action, review evidence, close, and export ledger. |
| E. Staff departure | Removed provider cannot receive future duty or mutate institutional operations; historical evidence remains visible. | Existing membership/removal staging suites. | Retire a synthetic provider and check future duty, QI history, and audit output. |
| F. Tenant attack | Institution A cannot read or mutate Institution B departments, staff, QI, invoices, readiness reports, or subscriptions. | Existing IERS/facility-linking isolation suites; QI scope guards. | Run a two-tenant authenticated attack matrix and retain denied responses. |
| G. Database degradation | Missing authoritative tables produce an explicit degraded/precondition failure; no fallback can imply access or subscription status. | `institutional-trust-invariants.test.ts`; product catalog fallback guard. | Remove/deny access to a disposable required table and verify fail-closed UI. |
| H. Billing settlement | Provider callback records `payment_received` or `disputed`; only finance reconciliation advances the invoice to `reconciled`; mismatch never activates access. | `institutional-trust-invariants.test.ts`; signed webhook tests. | Signed Pesapal/direct M-Pesa/bank test event, mismatch event, admin reconciliation, invoice history. |

## Evidence labels

Each row must be labelled independently:

- **CODE COMPLETE** — merged implementation exists.
- **TEST VERIFIED** — automated checks pass.
- **DEPLOYED** — target environment is running the merged release.
- **PRODUCTION VERIFIED** — authenticated scenario and migration verification output are recorded.

Until all required rows reach **PRODUCTION VERIFIED**, do not claim external endorsement or global readiness. The honest customer-facing statement is that the platform is **architecturally hardened and ready for controlled verification**, not yet independently endorsed.
