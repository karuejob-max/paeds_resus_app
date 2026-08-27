# Institutional Life Support Training Program

## Clinical and operational governance

This document is the minimum operating contract for the Institutional Life Support Training Program (ILS). The platform records enrolment, payment, learning progress, practical assessment, certificates, reminders, support cases, and pilot metrics. It does not replace the approved clinical curriculum, local policy, instructor judgement, or regulator requirements.

ILS is an **institution-paid provider-cohort programme**. The institution selects linked Paeds Resus accounts, pays one bulk order at KES 10,000 per provider, and is responsible for coordinating attendance and practical completion. Individual providers do not purchase the base ILS programme from the learner page.

ILS produces a **Paeds Resus competency certificate** after the cognitive and practical requirements are complete. It is not an AHA certificate and must not be described as an AHA equivalent. An optional AHA credentialing request may be made after Paeds Resus certification within 90 days, subject to payment and authorized review.

## Order acceptance gate

An institution must not pay for a cohort until all of the following are confirmed in the platform:

| Gate | Required evidence | Owner |
|---|---|---|
| Institution | Active institutional account and named coordinator | Institution coordinator |
| Roster | Existing Paeds Resus account for each provider; name/email reviewed; final roster confirmation recorded immediately before payment | Institution coordinator |
| Capacity | Maximum capacity is greater than or equal to the selected provider count | Operations owner |
| Instructor | Approved and certified Paeds Resus instructor assigned | Clinical owner |
| Venue | Venue or delivery location confirmed | Institution coordinator |
| Equipment | Required training equipment available for the session | Lead instructor |
| Date | Practical assessment date confirmed | Coordinator and instructor |
| Claims | Certificate and AHA boundary acknowledged | Coordinator |
| Payment | One aggregated M-Pesa order shows provider count × KES 10,000 | Finance/coordinator |

The platform must block payment if the delivery session is not confirmed or if any readiness gate is incomplete. A successful M-Pesa callback must also match both the order total and the payment-ledger amount; a mismatch fails the payment, releases reserved capacity, blocks the order, and opens a high-priority reconciliation case.

## Practical assessment policy

The clinical owner must approve the current practical checklist before a pilot begins. The checklist should identify the required skills, scenario performance, team communication, escalation and safety behaviors, scoring method, pass standard, remediation standard, and assessor sign-off requirements.

Only an approved and certified Paeds Resus instructor assigned to the delivery session, or an authorized platform administrator acting under the documented governance process, may record a practical result. A practical pass must not be recorded from attendance alone. The platform stores the assessor note and evidence summary; it does not invent a clinical pass standard.

Possible results are `pass`, `remediation_required`, `fail`, and `no_show`. A remediation-required result must include a follow-up due date and creates an operational case. A pass triggers the normal idempotent Paeds Resus certificate gate only after cognitive completion and payment confirmation are also present.

## Certificate policy

The Paeds Resus competency certificate may be issued only when all of the following are true:

1. The institution-paid ILS order is payment-confirmed.
2. The learner has completed the cognitive modules and final knowledge check.
3. An approved instructor has recorded a practical pass.
4. The certificate record is created through the platform’s idempotent certificate path.

The certificate must state its programme name, issue date, expiry policy, verification method, and non-AHA boundary. It must not claim licensure, regulatory equivalence, or guaranteed clinical outcomes unless a qualified owner has approved that exact claim.

## AHA credentialing boundary

AHA credentialing is a separate optional pathway. During the open 90-day window after Paeds Resus certificate issue, the learner may request and pay for an add-on at:

- BLS credentialing: KES 7,500.
- ACLS credentialing: KES 10,000.

The request must move through payment confirmation and authorized review. Payment does not automatically issue an AHA certificate. After the 90-day window, a new full training enrolment is required at the applicable full-training price. The learner page must show requested, payment-confirmed/awaiting-review, approved, rejected, and expired states distinctly. Unpaid requests are expired by the scheduled control at the deadline; a late-settling payment is retained for audit and routed to manual reconciliation rather than auto-approved.

## Pilot operating model

The first two controlled pilot segments are:

- Training providers such as Paeds Resus that need to train and track a provider cohort.
- Faith-based hospitals with a defined emergency-team or staff-cohort need.

Each pilot cohort requires a named clinical owner, operational owner, institution coordinator, target provider count, minimum provider count, start date, venue, equipment plan, instructor, and practical date. The institution must be able to complete the workflow without a parallel spreadsheet for the core roster, payment, session, assessment, or certificate state.

## Support and response targets

Every operational exception should be recorded as a support case rather than repaired silently. Failed or amount-mismatched ILS payments release capacity and open a high-priority case; cases are categorized as payment, roster, access, delivery, assessment, certificate, AHA credentialing, or general support. The platform records priority, owner, SLA due time, first response time, resolution notes, and final state.

Default response targets are:

| Priority | Response target |
|---|---:|
| Critical | 4 hours |
| High | 24 hours |
| Normal | 72 hours |
| Low | 7 days |

A payment-confirmed provider who cannot access the programme is a high-priority case. A possible duplicate payment or certificate identity error is critical until reconciled.

## Reminder policy

Reminders are deduplicated and auditable. The standard events are provider activation, payment follow-up, practical assessment, remediation, and AHA credentialing. Reminder delivery failures must be visible to Platform Ops; a failed email must not be treated as a completed reminder.

## Pilot scorecard

The coordinator should record a scorecard after each pilot cohort. Required measures are:

- Payment-to-access success percentage.
- Provider activation within seven days.
- Cognitive completion within 30 days.
- Practical opportunity within 14 days.
- Practical pass percentage.
- Support minutes per provider.
- Cost per provider and margin per provider.
- Coordinator satisfaction score.

The scorecard measures operational performance. It must not be presented as proof of improved mortality or clinical outcomes. Clinical outcome claims require a separately approved measurement design.

## Scale gate

Do not expand beyond the two pilot segments until two consecutive cohorts meet the agreed operational thresholds, the clinical owner has reviewed assessment quality, and at least one institution has repeated or expanded its order without exceptional founder intervention. Any failed gate should create an operational case and a documented mitigation before the next cohort is accepted.

## Claims register

Approved plain-language claims:

- ILS is a Paeds Resus competency-based training programme.
- Institutions pay for provider places in bulk.
- The programme includes online learning, knowledge checks, practical assessment, and a Paeds Resus competency certificate.
- Optional AHA credentialing can be requested separately within the stated window and remains subject to authorized review.

Claims requiring explicit owner approval before publication:

- Regulatory recognition or CPD-credit equivalence in any jurisdiction.
- Equivalence to AHA courses or credentials.
- Guaranteed improvement in patient outcomes.
- Legal or employment requirement statements.
- Claims that completion proves institutional emergency readiness.

## Definition of operational readiness

ILS is operationally ready for a cohort only when the institution can show a confirmed session, named approved instructor, available capacity and equipment, selected existing-account providers, one reconciled payment order, a reminder owner, a practical assessment process, a certificate policy acknowledgement, and a plan for resolving exceptions. A working page alone is not operational readiness.
