# ILSP Institutional Enrollment Architecture

**Date:** 2026-10-19
**Status:** Recommended target architecture; implementation backlog prepared
**Scope:** Institutional enrollment and delivery of Paeds Resus ILSP plus BLS, ACLS, PALS, and NRP learning

## Executive recommendation

Do not make ILSP a single course that is stretched to contain every life-support programme. Make ILSP the **institutional delivery and accountability layer**: the place where an institution selects staff, funds seats, assigns learning, tracks completion, coordinates practical delivery, and measures readiness.

The actual learning products remain separate programme records:

- Paeds Resus Institutional Life Support competency programme (`paeds_resus_ils`)
- BLS (`bls`)
- ACLS (`acls`)
- PALS (`pals`)
- NRP (`nrp`)

This preserves accurate certificates, prerequisites, expiry rules, content ownership, and reporting. It also follows the platform source of truth: Fellowship is distinct from AHA and other certification tracks. NRP must not be described as an AHA course unless the specific provider/certificate contract says so.

The institutional product should therefore be presented as **Institutional Training & Readiness**, with ILSP as one Paeds Resus competency programme and a separate **Sponsored Life Support Courses** lane for BLS/ACLS/PALS/NRP.

## Current state and gaps

The current ILSP implementation already supports a useful first slice:

- Institution-paid provider orders.
- Roster selection from institutional staff.
- Delivery sessions and instructor readiness.
- Practical assessment sign-off.
- Paeds Resus certificate issuance.
- Optional BLS/ACLS credentialing after Paeds Resus certification.
- Platform-admin payment operations.

It does not yet provide the complete institutional model requested here:

1. Departmental Heads and Deputies are not first-class ILSP enrollment authorities.
2. Platform administrators can operate payment/admin procedures but do not have a unified team-enrollment wizard across all learning programmes.
3. BLS, ACLS, PALS, and NRP are not represented as one institution-sponsored seat/order model.
4. There is no safe institution-scoped self-enrollment code flow.
5. There is no clear separation between roster nomination, commercial approval, payment, learner activation, and practical delivery.
6. Existing `institutionalTrainingOrders.programType` is limited to `paeds_resus_ils`; extending that column directly would create mixed semantics and make certificate/reporting logic unsafe.

## Target operating model

### 1. One institutional workflow, separate learning products

The institutional workspace should expose one guided action:

> **Enroll and support a team**

The wizard asks for:

1. Institution and department scope.
2. Learning programme(s): ILSP, BLS, ACLS, PALS, NRP.
3. Learners or invitation method.
4. Delivery model: online, blended, instructor-led, or institution-assigned.
5. Funding source: institution-paid, sponsored entitlement, learner-paid, or platform grant.
6. Target completion date.
7. Practical session requirements where applicable.
8. Review and approval.
9. Payment/entitlement confirmation.
10. Learner activation and reminders.

The wizard creates a **training campaign/order** and separate **course enrollments** for each learner and programme. A learner can have BLS and ACLS in the same campaign, but they remain separate enrollment records and certificates.

### 2. Roles and permissions

| Actor | Can nominate learners | Can create draft campaign | Can commit/payment | Scope |
|---|---:|---:|---:|---|
| Platform Admin | Yes | Yes | Yes | Any institution, with mandatory institution selector and audit reason |
| Institution Admin | Yes | Yes | Yes | Whole institution |
| Institutional CPD Coordinator | Yes | Yes | No, unless explicitly delegated | Whole institution for learning operations |
| Departmental Head | Yes | Yes | No by default | Own department only |
| Deputy Departmental Head | Yes | Yes | No by default | Own department only |
| Finance Officer | No clinical roster authority by default | Commercial review only | Yes, if assigned commercial capability | Institution billing scope |
| General Staff | No | No | No | Own learner record |
| Learner | Self-enroll/request only | No | Learner-paid only if the programme permits | Own account |

A Departmental Head or Deputy can prepare a roster and submit an enrollment request. The institution administrator or delegated commercial approver confirms funding. This prevents a department from silently creating institutional financial liability.

A platform administrator can act across tenants only after selecting the institution and recording an operational reason. Every cross-tenant action must be append-only audited.

### 3. Safe self-enrollment code

Use a **signed, institution-scoped invitation code**, not a reusable global password.

Each code should contain or reference:

- Institution ID.
- Department ID, optional.
- Campaign/order ID.
- Allowed programme IDs.
- Maximum redemptions and remaining seats.
- Expiry timestamp.
- Whether manager approval is required.
- Issuer and revocation state.
- A cryptographic hash; never store the plaintext code.

Recommended learner flow:

1. Learner signs in or creates a Paeds Resus account.
2. Learner enters or scans the institution code.
3. The platform shows institution, department, programmes, sponsor, and expiry before acceptance.
4. The learner confirms identity and consent.
5. If the campaign is pre-approved, the learner is activated immediately. Otherwise, the learner enters `pending_approval` and the authorized coordinator approves.
6. The code is consumed idempotently and cannot exceed capacity.

A code alone must not grant emergency role authority, clinical credential verification, institution membership beyond the intended training campaign, or access to another department.

### 4. Course and dependency rules

The platform should use a common **Life Support Academy** navigation surface while preserving programme-specific truth.

- **ILSP:** Paeds Resus competency programme; online modules, knowledge checks, practical assessment, and Paeds Resus certificate.
- **BLS:** standalone certification/course record; may be sponsored through an institution.
- **ACLS:** standalone advanced course; prerequisite rules are evaluated against canonical BLS completion where applicable.
- **PALS:** standalone paediatric advanced life-support course.
- **NRP:** standalone neonatal resuscitation course with its own content and certificate rules.
- **AHA evidence:** only displayed where the relevant external evidence is required; do not imply Paeds Resus issues an AHA certificate.
- **Fellowship:** remains a separate learning/progression umbrella and must not be silently granted by an institutional course seat unless the existing platform policy explicitly says that a micro-course starts the Fellowship journey.

The learner dashboard should show one consolidated record per programme and a clear source attribution such as:

> BLS completed — sponsored by Kiirua Hospital — completed through self-pay enrollment.

The same canonical completion may satisfy a prerequisite across IERP, NERP, ILSP-sponsored BLS, or self-pay, but the platform must retain all pathway attributions and never duplicate or overwrite the original certificate.

### 5. Commercial and payment lifecycle

Separate financial state from learning state.

Recommended campaign states:

`draft → roster_pending → approval_pending → ready_for_payment → payment_pending → paid → activation_open → in_delivery → completed → closed`

Failure and exception states:

`blocked`, `cancelled`, `expired`, `partially_refunded`.

Rules:

- Departmental nominations create a draft or approval-pending campaign only.
- Payment is attached to the campaign/order, not directly to an individual course row.
- A successful payment activates only the purchased seats and programmes.
- Payment callbacks never directly create unrestricted access without reconciliation.
- Seat replacement, refund, and cancellation are auditable and do not erase historical learning records.
- A campaign may contain multiple course programmes with separate prices and seat counts.

### 6. Institutional user experience

The institutional workspace should have three role-filtered actions:

**My department**

- Nominate staff.
- View missing accounts or unaccepted invitations.
- Track BLS/ACLS/PALS/NRP/ILSP status.
- Submit a department training request.
- See expiry and non-started priorities.

**Institution training operations**

- Review department requests.
- Combine or split campaigns.
- Approve rosters.
- Confirm funding and payment.
- Schedule practical sessions.
- Assign approved instructors.
- Monitor completion and exceptions.

**Platform operations**

- Cross-institution queue.
- Payment reconciliation.
- Entitlement grants.
- Catalog/course governance.
- Support and audit tools.

Finance users should not see clinical roster or IERS staffing actions. Departmental Heads should not see institution-wide financial controls. The interface should hide irrelevant lanes rather than show them and reject clicks.

### 7. Notifications and accountability

Every stage should produce an in-app task and durable delivery record:

- Nomination received.
- Approval requested.
- Learner invitation issued.
- Code redeemed.
- Payment pending/completed/failed.
- Course activated.
- Learner inactive or overdue.
- Practical session scheduled/changed.
- Assessment passed/remediation required.
- Certificate issued/expiring.

The coordinator dashboard should prioritize action rather than only report counts:

- 5 nominated staff without accounts.
- 3 invited staff who have not accepted.
- 8 enrolled but not started.
- 4 overdue for completion.
- 2 with practical assessment pending.
- 1 certificate expiring within 60 days.

## Recommended implementation sequence

### Phase 1 — authorization and product model

- Add a reusable institutional training authority resolver for platform admin, institution admin, CPD coordinator, Departmental Head, and Deputy.
- Add department-scoped enforcement for nominations.
- Add campaign/programme/seat abstractions without changing existing ILSP order semantics.
- Keep the existing ILSP flow working through an adapter.

### Phase 2 — unified sponsored training campaigns

- Add campaign and campaign-programme records.
- Add learner seat records linked to canonical `enrollments`.
- Add multi-programme pricing snapshots.
- Add four-eyes approval for campaigns that create payment liability.
- Add notifications and append-only audit events.

### Phase 3 — institution code enrollment

- Add hashed, scoped, expiring codes.
- Add redemption idempotency and capacity limits.
- Add optional coordinator approval.
- Add clear preview and consent screen.
- Add revocation and reporting.

### Phase 4 — learning and certification integration

- Map each sponsored programme to its existing course/enrollment/certificate logic.
- Add canonical cross-pathway completion resolution.
- Ensure BLS completion from self-pay, IERP, NERP, or ILSP sponsorship is recognized consistently.
- Keep ILSP Paeds Resus certification separate from AHA/NRP certificates.

### Phase 5 — operational analytics and outcome measurement

- Add completion and expiry prioritization.
- Connect training participation to institutional readiness metrics.
- Report training coverage by department, cadre, and programme.
- Do not claim patient-outcome improvement until governed pCOSCA evidence exists.

## What to do now

1. Preserve the current ILSP flow as the stable Paeds Resus competency path.
2. Add the reusable training campaign and seat model before adding codes.
3. Wire Departmental Head and Deputy nomination authority first, with no payment authority by default.
4. Add institution/admin approval and payment reconciliation.
5. Add codes only after campaign capacity and authorization are in place.
6. Add BLS, ACLS, PALS, and NRP as separate selectable programmes under the institutional campaign wizard.

## What to delay

- A single universal code that grants all courses.
- Automatic access based only on email domain.
- Automatic certificate issuance after course enrollment.
- Combining ILSP completion with AHA, PALS, or NRP certification.
- Giving Departmental Heads direct payment authority without an explicit commercial delegation.
- Cross-institution bulk operations without an institution selector and reason.

## What to ignore

- Building a second independent enrollment system for every course.
- Hiding programme identity behind generic “life support” labels.
- Treating roster membership as evidence of competence.
- Treating payment success as clinical certification.
- Using a code as a substitute for authenticated identity and institution scope.

## Definition of done for the full institutional flow

A release is complete only when the QA matrix proves:

- Platform admin can enroll a team in any selected institution with an audit reason.
- Institution admin can approve, pay, activate, replace, and report on seats.
- Departmental Head and Deputy can nominate only their own department.
- Finance can handle approved commercial steps without seeing unrelated clinical operations.
- Learner can redeem a valid code once, see the correct sponsor/programmes, and access only activated courses.
- Expired, revoked, over-capacity, cross-tenant, and wrong-department codes fail closed.
- BLS, ACLS, PALS, NRP, and ILSP remain separate records with correct certificates.
- Existing self-pay and IERP/NERP completion is recognized without duplicate learner records.
- Payment, access, course progress, assessment, and certificate states remain independently auditable.
- Production migration, seed/catalogue verification, role smoke tests, and learner account verification are recorded in `WORK_STATUS.md`.
