# Institutional Life Support Training Program — End-to-End Mitigation Plan

**Status:** Phase 0 baseline and acceptance contract
**Owner:** Paeds Resus CEO / Product Owner
**Implementation owner:** Paeds Resus engineering
**Clinical owner:** Named Paeds Resus clinical lead and approved instructors
**Last updated:** 2026-08-27

## Purpose

This document converts the ILS pre-mortem into a buildable, testable operating system. The objective is not only to make the ILS page work. The objective is to make an institution-paid competency-training service reliable from institutional order through provider assignment, learning, practical assessment, certification, optional AHA credentialing, reporting, support, and pilot review.

The software must never imply that an online course completion proves practical competence, that a Paeds Resus certificate is an AHA credential, or that ILS completion by itself proves Institutional Emergency Readiness.

## Product boundary

| Product | What it proves | What it does not prove |
|---|---|---|
| Institutional Life Support Training Program | A provider completed the Paeds Resus learning and approved practical-assessment requirements recorded for the programme | It does not issue an AHA certificate or prove that an institution is operationally ready for an emergency |
| IERS Readiness | Institution-scoped emergency-readiness configuration, roles, duties, and evidence | It does not replace provider competency training or a provider certificate |
| Learning / CPD Portal | Learning participation, CPD sessions, attendance, and institutional workforce records | It does not by itself prove practical competence |
| Optional AHA pathway | A paid, separately reviewed request for an AHA credential after Paeds Resus certification | Payment or request submission does not equal AHA approval or certificate issuance |

## Initial pilot segments

The first pilots should be deliberately narrow:

1. **Training providers**, including Paeds Resus, that can deliver or coordinate practical assessment and need institution-level cohort and CPD records.
2. **Faith-based hospitals** with a clear staff cohort, named coordinator, practical venue, equipment plan, and a repeat-training need.

Other audiences remain supported in onboarding, but they should not all be pursued commercially until these two segments produce repeatable delivery and reorder evidence.

## Required operating roles

| Role | Responsibility | Minimum evidence |
|---|---|---|
| Product owner / CEO | Approves claims, pricing, pilot scope, and go/no-go decisions | Signed decision in WORK_STATUS or approved governance record |
| Clinical owner | Approves curriculum, practical checklist, remediation, assessor calibration, and certificate claims | Versioned clinical approval record |
| Approved instructor | Delivers or signs off practical assessment | Instructor identity, approval state, assessment record |
| Institution coordinator | Confirms roster, payment, training date, venue, reminders, and completion follow-up | Institution-linked account and auditable actions |
| Platform operations | Handles payment reconciliation, access exceptions, certificate corrections, and AHA review queue | Operational case or audit record |
| Finance / reconciliation owner | Confirms order totals, receipts, settlement, and unresolved payment exceptions | Order/payment reconciliation record |

## Institution order acceptance gate

An institution-paid order must not be accepted as operationally ready until all of the following are true:

- The institution has a named coordinator with a valid Paeds Resus account.
- Every provider is an existing Paeds Resus account with a confirmed name and email.
- The roster shows the provider count and total as `KES 10,000 × provider count`.
- The coordinator records a final provider-roster confirmation immediately before payment; the server rejects an order without it.
- The institution confirms the preferred training date.
- An approved instructor, venue, equipment plan, and practical-assessment capacity are recorded.
- The coordinator acknowledges the certificate boundary: Paeds Resus certificate, not AHA certificate.
- The order has an owner for reminders, unresolved payments, and non-completion escalation.

## Learner completion gate

A provider may receive a Paeds Resus competency certificate only when the required online learning and practical assessment are both complete. Cognitive completion must not be presented as certification. A practical result must include an assessor, assessment date, checklist evidence, result, and remediation outcome where applicable.

## AHA credentialing boundary

The optional AHA pathway remains separate. The platform may record a request and payment, but only an authorized reviewer may approve or reject it. Within the 90-day window after Paeds Resus certification, the add-on prices are BLS KES 7,500 and ACLS KES 10,000. After the window, full-training prices apply: BLS KES 10,000 and ACLS KES 20,000. No UI, payment status, or request status may imply automatic AHA certification.

## Minimum operational reports

The institutional portal must provide these reports before broad scale:

1. **Order status:** provider count, total amount, payment state, training date, and unresolved exceptions.
2. **Cohort progress:** assigned, activated, cognitive complete, practical scheduled, practical passed/remediation, and certificate issued.
3. **Current competency register:** provider, Paeds Resus certificate state, issue/expiry information, practical status, and separate AHA request/review state.

Reports must distinguish ILS competency, CPD participation, and IERS readiness. They must not collapse them into one readiness score.

## 30-day release gates

### Days 1–7: delivery readiness

- Name the two pilot institutions and cohort sizes.
- Name the clinical owner, lead instructor, backup instructor, coordinator, finance owner, and support owner.
- Confirm the practical checklist, venue, equipment, assessment dates, and remediation policy.
- Calculate true cost per provider and minimum viable cohort size.
- Publish the institution coordinator runbook.

### Days 8–14: failure-mode simulation

- Exercise duplicate accounts, wrong-email prevention, missing provider accounts, partial rosters, failed or timed-out M-Pesa payment, callback amount mismatch, delayed callback, cancelled pending enrollment, order replacement, and access-after-payment behavior.
- Confirm unpaid providers cannot open modules.
- Confirm cognitive completion cannot issue a certificate before practical sign-off.
- Confirm AHA requests remain separate and reviewable.

### Days 15–21: first paid cohort

- Accept only an order with a confirmed practical delivery plan.
- Track every provider from payment to access, module completion, attendance, practical result, remediation, and certificate.
- Record all support cases by reason and resolution time.

### Days 22–30: scale decision

- Review payment-to-access success, activation, completion, time-to-assessment, practical pass/remediation, support time, cost, margin, and coordinator satisfaction.
- Complete clinical-owner review of assessment quality and certificate language.
- Decide whether another coordinator can repeat the process without founder intervention.
- Fix the largest operational failure before accepting the next cohort.

## Pilot success thresholds

The pilot is not successful because the page loads or one institution pays. For two consecutive cohorts, the target thresholds are:

| Metric | Initial target |
|---|---:|
| Payment-to-access success | ≥90% |
| Provider activation within 7 days | ≥80% |
| Cognitive completion within 30 days | ≥80% |
| Paid providers offered a practical assessment within 14 days | ≥90% |
| Certificate supported by documented practical assessment | 100% |
| Unexplained payment/access mismatches | 0 |
| Repeat order or expansion from a pilot institution | ≥1 |

These are operating targets, not claims of clinical outcome improvement. Clinical outcomes require a separately designed and governed evaluation.

## Explicit non-goals for this release

This mitigation programme does not promise automatic AHA certificate issuance, regulator equivalence, guaranteed clinical outcomes, nationwide facility-regulatory mapping, custom curricula for every institution type, installment financing, or individual purchase of the institution-paid base programme.

## Definition of Done

The programme is considered shipped only when:

- Code is merged to `origin/main` with a verified merge hash.
- Required schema migrations are applied to production.
- Required ILS catalog and operational seed content is present in production.
- Targeted tests, repository checks, and production build pass.
- Production read-only verification output is recorded in `docs/WORK_STATUS.md`.
- At least one controlled end-to-end pilot workflow is documented, with clinical-owner and CEO decisions clearly separated from engineering evidence.

## Current phase status

- Phase 0 baseline: **implemented in this document**.
- Engineering work: **implemented on the current feature branch** across the operational data contract, delivery-capacity controls, payment reconciliation, roster lifecycle, practical governance, reminders, support, pilot scorecards, and institutional Learning/CPD reporting; final validation and protected-branch review remain before merge.
- Migration 0141: **not applied**; it requires an authorized production operator after code merge.
- Production pilot: **not claimed** until the release gates above are evidenced.
