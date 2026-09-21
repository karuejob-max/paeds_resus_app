# Institutional QI, Pricing, Consent, and Billing Implementation

**Status:** Implementation release candidate

**Approved commercial decision:** Founding Partner access uses a **5-year initial term** and renews at **50% of the then-current Standard tier rate**, provided the institution remains eligible under the agreed consent and participation rules.

## Product boundary

The Institutional Emergency Readiness System and CPD Portal are annual institutional products. Institutional Life Support Training remains a cohort/provider-priced offering and is not silently converted into a subscription.

The QI system is the structured learning layer. The initial report types are **Safety Event** and **Improvement Project**. Care Signal and Code Signal are source channels that contribute to the same institutional participation-quality model; they are not treated as disconnected reporting products.

## Structured QI workflow

Reports use the following lifecycle:

`Draft → Submitted → Triaged → Action planned → In progress → Effectiveness review → Closed`

A report may be `Reopened` from a submitted, triaged, action-planned, in-progress, effectiveness-review, or closed state when new information or failed effectiveness evidence requires further work. A report cannot be closed without a verified effectiveness review.

The database captures report type, source channel, department, care area, age group, harm status, severity, problem statement, expected process, observed gap, contributing factors, baseline and target measures, actions, owners, evidence, reviewer, effectiveness outcome, confidentiality level, and timestamps.

## Participation-quality policy

Eligibility is based on reports reaching **Closed with a verified effectiveness review** during the trailing quarter. The starting floor is facility-scaled:

| Facility level | Minimum closed-and-verified reports per quarter |
|---|---:|
| Level 4 | 1 |
| Level 5 | 2 |
| Level 6 | 3 |

Care Signal and Code Signal activity is recorded alongside the closed-report count for visibility and future analytics. Raw submission count alone does not determine commercial eligibility.

When a consented facility falls below its floor, the scheduler records a participation snapshot and starts a 30-day cure period. If participation remains below the floor after the cure period, the status becomes `lapsed` from that point forward. Pricing is not retroactively changed. Re-consent is an explicit administrative action.

## Pricing and currency

KES is the Kenya invoice and settlement currency. USD is the internal reference currency for cross-country consistency. Every invoice stores the original KES amount, USD reference amount, currency, exchange-rate snapshot, effective timestamp, and pricing inputs.

The commercial price book is versioned outside the UI calculation layer. The application must not recalculate a historical invoice from a new FX rate.

Founding Partner pricing is 50% of the Standard tier and has a five-year initial term. At renewal, it remains 50% of the then-current Standard tier for an eligible institution. Standard pricing may apply a 30% private-mode premium where the institution does not permit the agreed aggregate learning use.

## Renewal and payment policy

Annual invoice-based renewal is the default. Institution administrators receive advance renewal notices and may renew through purchase order, bank transfer, M-Pesa payment request, or card checkout. Card autopay is opt-in and only enabled when the processor confirms a reusable mandate/token. M-Pesa is not treated as a silent recurring debit.

The billing state machine is:

`Draft → Issued → Payment pending → Paid`

with terminal or exception states `Void`, `Cancelled`, and `Overdue`. Subscription access transitions independently through `Active`, `Grace`, `Past due`, `Expired`, `Suspended`, and `Cancelled`, preserving historical records.

The payment-provider contract is adapter-based. The core domain stores invoices, payment attempts, provider-event identifiers, idempotency keys, reconciliation status, and receipts. Kenya’s first provider target is Pesapal for M-Pesa/card/invoice/payment-link coverage, with direct M-Pesa and bank transfer as operational fallbacks. A future international provider may be added without changing the invoice or subscription schema.

## Administrative controls

Institution administrators and authorized IERS/CPD governance roles can create and review QI reports within their institution, issue invoices for authorized products, set consent status, attest staff/facility inputs, and select optional card autopay. Platform administrators can record provider events and reconcile payments.

Every pricing, consent, status, and provider-event change is auditable. Data export and retention controls remain product-scoped. No UI claim may promise legal immunity, clinical safety, or absolute anonymity beyond what the stored fields and access controls actually implement.

## Release Definition of Done

- The schema and idempotent production migration exist and are verified.
- A provider can create a structured Safety Event or Improvement Project report and save it as draft or submit it for review.
- Authorized reviewers can triage, plan actions, record an effectiveness review, and close only after verified evidence is recorded.
- Participation quality counts closed-and-verified reports and exposes Care Signal/Code Signal contribution counts.
- The scheduler evaluates eligible institutions, starts a 30-day cure period, and lapses consent non-retroactively when the cure period expires.
- Pricing returns the approved Standard, Founding Partner, and private-mode prices and stores invoice snapshots.
- Institutions can view and issue annual invoices, select payment method, and see provider-neutral payment next actions.
- Pesapal is represented behind an adapter boundary; M-Pesa and bank transfer remain viable fallbacks.
- The institutional workspace exposes QI reporting and billing visibility on mobile and desktop.
- Unit, TypeScript, build, migration syntax, targeted production verification, protected CI, merge, production migration, and deployed smoke checks are recorded in `docs/WORK_STATUS.md`.

## Governance backlog outside code

Kenyan counsel must review the Data Protection Impact Assessment, ODPC obligations, renewal terms, tax/eTIMS treatment, payment-provider contracts, and the final just-culture clause before external publication. The UI and contract must not present those matters as already legally approved.
