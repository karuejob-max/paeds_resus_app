# Paeds Resus ILSP MVP prioritization matrix

## Product boundary

ILSP is the institution-paid operational pathway for a Paeds Resus competency cohort: roster selection, payment, learning access, delivery scheduling, practical assessment, Paeds Resus certificate, reminders, exceptions, and measurable cohort outcomes. It is not an AHA certificate issuer. BLS, ACLS, PALS, and NRP are separate learning/credential tracks that can be surfaced from ILSP, but each must retain its own enrollment, evidence, assessment, and certificate authority.

The MVP therefore uses one learner workspace with separate cards for:

- **ILSP competency:** the Paeds Resus institutional course and its delivery/assessment lifecycle.
- **AHA/NRP coursework:** BLS, ACLS, PALS, and NRP course access and progress, each backed by its canonical course enrollment.
- **Evidence and certificates:** external AHA evidence remains evidence submitted for review; Paeds Resus certificates are issued only by the Paeds Resus certificate boundary.

No product should imply that completing ILSP automatically grants an AHA or NRP credential.

## Prioritization matrix

| Priority | Work package                         | User problem closed                                                                        | MVP acceptance test                                                                                                                                        | Status                                                                                         |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| P0       | Tenant-safe ILSP authority           | A departmental leader could accidentally access another department's cohort data or roster | Platform/institution admins see institution scope; active Departmental Head/Deputy sees only assigned department; unrelated user is denied                 | Implemented in code; migration 0184 pending deployment                                         |
| P0       | Department-scoped cohort order       | Heads/deputies can enroll their own teams without exposing other departments               | Order stores department scope; selected staff must belong to that department; order/register views return only scoped cohorts                              | Implemented in code; migration 0184 pending deployment                                         |
| P0       | Payment and capacity truth           | Two coordinators could overbook a delivery session or mistake a draft for paid access      | Capacity update is conditional; payment status and order status remain separate; no learner access before confirmed payment                                | Existing controls retained; smoke test required                                                |
| P0       | Learning/certificate boundary        | ILSP completion could be mistaken for AHA certification                                    | ILSP certificate says Paeds Resus; AHA evidence is separate; no AHA credential is issued by ILSP                                                           | Existing boundary retained                                                                     |
| P1       | Unified learner workspace            | Learners enter via Home, Learn, ILSP, or Life Support Hub and see different state          | All entry points resolve to one workspace with the same next action, evidence links, and course progress                                                   | Next implementation slice                                                                      |
| P1       | Course-access cards                  | Institutions need one controlled place to offer BLS, ACLS, PALS, and NRP                   | Workspace lists each course with availability, enrollment status, progress, and authoritative destination; no duplicate enrollments                        | Next implementation slice; pricing/entitlement decision required for institutional sponsorship |
| P1       | Institutional enrollment modes       | Cohorts need both managed roster enrollment and safe self-enrollment                       | Admin/Head/Deputy can nominate staff; institution can issue expiring, single-use or bounded invite codes; code use creates an auditable pending assignment | Next implementation slice                                                                      |
| P1       | Cohort operations dashboard          | Coordinators need actionable completion data rather than raw rows                          | Paid, activated, cognitive, practical, certified, overdue, and exception counts are visible by institution and department                                  | Existing metrics foundation; UX wiring and tests pending                                       |
| P1       | Instructor and assessment governance | Practical assessment must not be a self-attested checkbox                                  | Assigned approved instructor, calibrated checklist, second assessor where required, immutable evidence, and correction trail                               | Existing controls; negative-path smoke tests pending                                           |
| P2       | PALS/NRP ILSP commercial packaging   | Platform needs a clear way to sponsor advanced courses                                     | Approved product/pricing decision, entitlement type, payment flow, and course-specific prerequisite policy                                                 | Do not invent prices; requires product owner decision                                          |
| P2       | Reminders and exception handling     | Learners and coordinators miss deadlines or get stuck silently                             | Durable reminder ledger, failed-delivery visibility, support case creation, and next action                                                                | Foundation exists; production delivery test pending                                            |
| P2       | Outcomes and renewal                 | Customers need measurable value and renewal evidence                                       | Cohort dashboard reports time-to-access, activation, cognitive completion, practical opportunity, pass rate, support burden, and cost per provider         | Metrics schema exists; reporting definition and pilot review pending                           |

## Recommended enrollment model

Use **managed cohort enrollment as the default** for hospitals. An authorized platform admin, institutional admin, Departmental Head, or Deputy selects staff from a server-filtered roster, chooses the department scope, selects a confirmed delivery session, confirms claims/roster, and initiates payment. The server must re-check every selected staff member against the actor's current scope.

Add **institution-issued self-enrollment** only as a controlled second mode. An institution admin creates a code with an expiry, maximum uses, allowed department, allowed course(s), and optional email/domain restriction. The learner enters the code, sees the institution and exact scope before accepting, and creates a pending assignment. The institution can approve, reject, or remove the assignment. Codes must be hashed at rest, single-use or bounded, revocable, rate-limited, and fully audited. Never use an unbounded shared password or a code that silently grants access to every course.

For BLS, ACLS, PALS, and NRP, keep the canonical AHA enrollment identity shared across pathways. ILSP should link to or sponsor those course enrollments; it should not create parallel shadow progress rows. The learner workspace should display the source of access (self-pay, institution-sponsored, IERP, NERP, or ILSP) while preserving one canonical progress record.

## Definition of done for the ILSP MVP

1. Role-safe roster, order creation, register, replacement, and metrics reads are tested for institution and department boundaries.
2. Migration 0184 is applied idempotently to staging and the approved local database.
3. QA accounts cover platform admin, institution admin, primary Departmental Head, Deputy, enrolled provider, unrelated department provider, and general staff.
4. A full synthetic cohort run proves: nominate → pay/entitle → access → cognitive progress → delivery readiness → practical assessment → certificate → reminder/exception.
5. A negative matrix proves: cross-department selection denied, unrelated user denied, insufficient capacity rejected, unpaid learner blocked from access, unapproved assessor blocked, and ILSP certificate never represented as AHA certification.
6. The authenticated production smoke test records the exact deployed build, tenant, persona, route, expected result, and observed result.
7. Clinical owner, privacy/accessibility, operational rollback, and public-launch approvals remain explicit gates rather than being represented as engineering test passes.
