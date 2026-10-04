# Institutional OS — Architectural Hardening & Trust Closure

**Status:** Implemented in code on feature branch; production deployment and migration verification are separate gates.

## Product decision

Paeds Resus Institutional is one hospital operating surface with four customer-facing lanes:

- **Readiness:** workforce coverage, competency evidence, response, equipment, drills, and emergency governance.
- **Workforce:** training, CPD, competency progression, and rosters.
- **Quality:** Care Signal, Code Signal, structured QI, action ownership, and effectiveness review.
- **Governance:** people, roles, subscriptions, invoices, data lifecycle, exports, and audit evidence.

The Institutional Command Centre answers **“What needs attention today?”** without inventing a black-box safety score. It shows explicit attention signals and labels unavailable data as unavailable.

## Canonical safety invariants

| Invariant | Enforcement |
|---|---|
| Institutional authority requires an active institutional relationship | Existing institution access and product-role guards; QI action owners additionally require active membership. |
| Institutional objects cannot cross tenant boundaries | Every QI report, department, owner, event, invoice, and product lookup is institution-scoped. Existing staging authorization suites remain required. |
| Department identity is canonical | QI report creation rejects inactive or foreign departments. |
| Assigned, accepted, and active are different states | Existing IERS membership/duty state machines remain authoritative. |
| Training completion is not competency or emergency authorization | UI copy explicitly avoids presenting learning completion as an authorization score. |
| QI closure requires effectiveness evidence | Closure accepts only effective/partially-effective reviews with no unresolved follow-up. |
| QI transitions are reconstructable | `institutionalQiReportEvents` stores from/to state, actor, role, reason, and time. |
| Provider callback is not settlement | Webhooks now create `payment_received` / `disputed`; only finance reconciliation reaches `reconciled`. |
| Client input is not commercial truth | Invoice issuance requires an approved platform-created commercial contract. |
| Missing product infrastructure cannot imply access | Institutional catalog missing-table errors return an explicit degraded/precondition failure. |
| Historical records survive expiry | Existing subscription/product history model is retained; expiry blocks new operations, not historical evidence. |

## Explicit billing lifecycle

```text
DRAFT → ISSUED → PAYMENT_PENDING → PAYMENT_RECEIVED
                                   ↓
                            DISPUTED (mismatch)

PAYMENT_RECEIVED → SETTLEMENT_CONFIRMED → RECONCILED
                                      ↘ REFUNDED
```

The current webhook records the provider event and amount/currency comparison but does not activate access. Platform finance reconciliation records the settlement decision and audit note.

## Scenario evidence required for the release gate

1. Institution onboarding: two admins → departments → roles → contract → invoice → payment.
2. Department governance: admin → ERCo → roster → acceptance → replacement.
3. Emergency activation: UTL → ERTL → response states → arrival → evidence → debrief.
4. QI: report → triage → action → evidence → independent review → effectiveness → closure.
5. Staff departure: membership ends, future duty is blocked, historical records remain readable.
6. Tenant attack: Institution A cannot read or mutate Institution B staff, departments, QI, invoices, or reports.
7. Database degradation: required institutional ledger missing → explicit degraded state; no plausible access state.

Existing staging suites cover important IERS tenant/role paths. The new invariant tests cover payment settlement, QI closure, and degraded-state semantics. Production verification must still execute the full matrix against a disposable or staging tenant.

## Four release statuses

Every capability must be reported separately as:

1. **Code complete** — implementation merged.
2. **Test verified** — automated and scenario tests pass.
3. **Deployed** — release is running in the target environment.
4. **Production verified** — authenticated smoke test and migration verifier pass against the deployed system.

Only the fourth status is suitable for an external endorsement claim.

## Operational commands

```bash
pnpm run db:apply-0171
pnpm run db:verify-0171
pnpm exec vitest run server/lib/institutional-trust-invariants.test.ts
pnpm run check
pnpm run build
```

The migration is idempotent. Run it from Render Shell or another allowlisted production path, then record the verifier output in `docs/WORK_STATUS.md`. Do not treat a successful local build as production verification.

## Deferred, intentionally not hidden

- Legal/finance approval of Kenyan tax/eTIMS treatment and contract language.
- Clinical-owner review and labelled two-device/manikin validation.
- Full authenticated scenario execution against the deployed production release.
- Consolidation/archival of historical documentation entropy. This specification is the current implementation record; older plans should be archived rather than used as competing authority.
