# Global Admin Entitlement Contract

## Purpose

Paeds Resus Global needs a controlled way to sponsor, discount, or waive programme access without creating unsafe shareable tokens or bypassing clinical, institutional, payment, or certificate safeguards. This contract defines the entitlement model used by IERP, NERP, Institutional Life Support (ILSP), and individual self-pay learning.

## Operating decision

The platform will use **named-account entitlements**, not redeemable or shareable tokens. A Global Admin selects an existing Paeds Resus account, selects one programme scope, chooses a free or discount benefit, records a business reason, and sets an expiry and redemption limit. The system generates an internal grant reference for audit; that reference is not a credential and cannot be redeemed by another person.

Every entitlement is server-authorized, target-account-bound, programme-scoped, auditable, revocable, and applied at the programme’s own payment boundary. It never bypasses clinical prerequisites, identity verification, practical assessment, certificate gates, regulatory evidence, or institutional roster controls.

## Programme rules

| Programme | Allowed entitlement target | Allowed benefit | Access rule that remains mandatory |
|---|---|---|---|
| IERP | Named existing provider account | Full waiver or percentage discount against the KES 15,000 programme fee | Intern profile, MoH evidence review, programme progression, and certificate rules remain active. A waiver is recorded as sponsored access, not fabricated payment. |
| NERP | Named existing provider account | Full waiver or percentage discount against the NERP offer total | Verified NCK licence, NERP offer eligibility, phase evidence, learning, assessment, and certificate rules remain active. Instalment state is recalculated from the effective sponsored balance. |
| ILSP | Institution account and its bulk order only; never an individual learner | Full waiver or percentage discount against one institution-paid cohort order | Existing institution, coordinator, account-backed roster, final roster acknowledgement, capacity/readiness, delivery, practical assessment, and Paeds Resus certificate controls remain active. ILSP cannot be converted into individual free access. |
| Self-pay | Named existing learner account and one supported self-pay course | Full waiver or percentage discount against the course price | Course prerequisites, enrolment uniqueness, learning, assessment, and certificate rules remain active. No admin-selected learner may be silently enrolled without an entitlement record. |

Aha access grants remain a separate, existing AHA-only mechanism. They are not widened by this contract.

## Benefit calculation

An entitlement has exactly one benefit: `free` or `percentage_discount`. The effective price is calculated server-side from the programme base price, capped at zero, and persisted in the programme’s payment or entitlement ledger. Percentage values are integers from 1 through 99; a full waiver uses `free` rather than a 100% discount. Existing completed payments are never refunded or rewritten automatically. A new entitlement may reduce only the unpaid balance.

For an entitlement to be usable, its target account, programme scope, status, expiry, and remaining redemption limit must all pass. A single entitlement may be consumed once by default. Consumption is atomic and records the resulting programme record, effective amount, and actor. Failed attempts do not consume it.

## Governance and audit requirements

Global Admin is required for creation, revocation, and manual application. The target must be selected from a canonical Paeds Resus user account; free-text email is not sufficient. Creation requires a reason of at least ten characters. The audit record stores the actor, target account, programme, benefit, original price, effective price, reason, expiry, usage, and lifecycle timestamps.

ILSP entitlement creation requires an institution target and must be applied to a draft or payment-pending institution order before payment. It cannot activate an individual learner, alter a completed payment, or bypass an approved provider roster.

An entitlement may be revoked before use. Revocation does not delete historical audit data. A consumed entitlement remains historical and does not retroactively remove access; future progression continues under the programme’s ordinary safeguards.

## Definition of Done

The release is complete only when the entitlement schema and idempotent migration are production-verified; server decisions are enforced at every relevant access/payment boundary; the Global Admin workspace supports account search, programme-specific forms, preview, create, revoke, and history; focused tests cover authorization, scope, expiry, caps, consumption idempotency, price calculation, and each programme; reporting distinguishes sponsored, discounted, and paid access; documentation names the operational owner; and protected CI plus production verification pass.
