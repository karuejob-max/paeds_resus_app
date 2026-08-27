# Institution Accountability, Credentials, and Departmental Leadership

**Status:** Implementation contract for the expanded institutional portal

## Objective

The institutional portal should allow authorised leaders to answer, quickly and accurately:

- Which staff are currently licensed, pending verification, expiring, expired, or revoked?
- Which staff have current Life Support credentials, and which were earned through the Paeds Resus Competency-based Life Support programme versus external AHA certification?
- Which staff are participating in CPD, meeting their personal or departmental targets, and requiring support?
- Which departments are running CPD sessions, achieving attendance, and sustaining learning activity?
- Which Departmental Heads, Education Coordinators, and ERCo governance appointments are producing measurable unit-level results?

This must be achieved without exposing private contact data, unrestricted CPD histories, credential documents, or individual performance to users who do not need them.

## Non-negotiable separation

The platform maintains separate concepts:

1. **Professional identity:** cadre, specialty, experience, biography, and languages.
2. **Professional verification:** regulatory licence evidence and verification state.
3. **Life Support credentials:** Paeds Resus-derived competency/certificate records and external AHA certificates.
4. **Institution membership:** a provider’s relationship to an institution and facility.
5. **Institutional product roles:** CPD, IERS, and connected-service responsibilities.
6. **Department appointments:** Departmental Head, Education Coordinator, and ERCo governance appointments.
7. **Learning/accountability metrics:** CPD sessions, attendance, course completion, targets, and department aggregates.
8. **Operational authority:** accepted, dated IERS duties and scoped emergency permissions.

No one of these states may silently grant another. Learning participation is not clinical competence; a licence is not proof of Paeds Resus competency; institution membership is not an IERS duty; and a Departmental Head appointment is not an emergency response assignment.

## Institutional visibility contract

| Area                         | Institution admin/owner                              | Credential manager                | Departmental Head                                      | Education Coordinator                | CPD viewer/reporter        | General member           |
| ---------------------------- | ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------ | ------------------------------------ | -------------------------- | ------------------------ |
| Institution summary          | Full institution scope                               | Compliance summary                | Assigned department                                    | Assigned department                  | Redacted aggregate         | Own status only          |
| Staff names                  | Scoped full roster                                   | Scoped compliance roster          | Assigned department                                    | Assigned department for session work | No named roster by default | No                       |
| Email/phone                  | Work email when needed; no personal phone by default | Work identifier only              | No phone; work identifier only when needed             | Session work only                    | No                         | Own only                 |
| Licence status/expiry        | Full institution scope                               | Full scoped compliance scope      | Assigned department status only                        | Completion status only               | Aggregate count only       | Own only                 |
| Licence/certificate document | Controlled private access                            | Yes, scoped and audited           | No by default                                          | No                                   | No                         | Own only                 |
| CPD sessions                 | Full institution scope                               | Aggregate/need-to-know            | Assigned department                                    | Assigned department operations       | Aggregate only             | Own participation        |
| Individual CPD attendance    | Authorised appraisal scope, audited                  | No unless required for compliance | Assigned department, target/appraisal scope            | Assigned session scope               | No                         | Own only                 |
| Individual performance       | Explicit governance/appraisal scope, audited         | No                                | Assigned department appraisal scope with clear purpose | No by default                        | No                         | Own only                 |
| Department targets           | Full                                                 | Aggregate                         | Assigned department                                    | Assigned department                  | Aggregate                  | No                       |
| Individual targets           | Full, audited                                        | No                                | Assigned department, purpose-limited                   | Assigned learner/cohort scope        | No                         | Own only                 |
| Product roles and duties     | Admin scope                                          | No                                | Own/department governance scope                        | Own assigned scope                   | No                         | Own accepted duties only |
| Export                       | Explicitly approved and audited                      | Scoped compliance export          | Department aggregate or approved appraisal export      | Assigned department learning export  | Aggregate only             | Own records              |

All access controls must be enforced server-side with field-level projections. Hiding tabs in React is not a security boundary.

## Departmental Head contract

An institution administrator may appoint exactly one active Departmental Head for each active canonical department, with optional historical reassignment records. The appointment is a standing unit-level leadership appointment, not a dated emergency duty.

A Departmental Head may:

- View the assigned department’s aggregate learning and target dashboard.
- View named staff learning/target rows in that department only when the institution policy allows unit-level appraisal, excluding private contact and evidence documents.
- See licence and Life Support status as redacted compliance indicators for the assigned department: current, expiring, expired, pending, or missing; not document contents or full credential numbers.
- Create or coordinate department-scoped CPD sessions when also assigned the CPD Education Coordinator capability, or when the institution explicitly grants the CPD coordination capability.
- View department CPD session counts, attendance, target progress, and trend summaries.
- Contribute department improvement notes and request support.

A Departmental Head may not:

- View other departments’ named staff or individual learning history.
- View private phone numbers, licence scans, certificate uploads, or unrelated clinical records.
- Assign IERS product roles, dated responder duties, ERCo appointments, or readiness status unless separately authorised.
- Convert attendance into competence or performance ranking.

The system should support `institutionDepartmentHeads` plus an append-only event table. The active appointment determines department scope; the event table preserves assignment, reassignment, and ending history.

## Education Coordinator and ERCo relationship

Education Coordinators remain responsible for department-scoped learning operations. Departmental Heads receive accountability visibility, not automatic session-management authority. If the same person should hold both responsibilities, the institution may assign both appointments/roles explicitly.

ERCo remains a governance appointment for emergency readiness. The Departmental Head may collaborate with the ERCo on departmental learning and improvement, but neither appointment proves provider acceptance, clinical competence, or emergency dispatch eligibility.

## Credential source-of-truth contract

### Regulatory licence

A structured professional credential record must contain regulator, jurisdiction, cadre/category, licence number, issue date, expiry date or explicit non-expiring state, evidence object key, verification state, reviewer, review date, and review reason. Evidence is private storage, never a public URL.

### Paeds Resus-derived Life Support

The portal automatically projects read-only credential entries from authoritative Paeds Resus records:

- **BLS Cognitive Competency** — only after the cognitive requirement is complete and verified.
- **BLS Simulation Competency** — only after authorised practical/simulation sign-off.
- **BLS Provider** — only after the complete provider certificate is issued.

These entries must preserve the source record and cannot be manually edited as free text.

### External AHA

A provider may submit external AHA certificates separately by course: BLS, ACLS, PALS, NRP, and other supported courses. Each record stores certification date, expiry date, certificate number where present, issuer/training centre, private evidence object key, and verification status. External AHA evidence must never be relabelled as a Paeds Resus-derived competency.

## Expiry notification contract

For licences and Life Support credentials, the daily reminder evaluator creates idempotent events at three calendar months, two calendar months, and one calendar month before expiry, then every seven days after expiry until the credential is renewed, verified, revoked, or resolved.

Notifications go to the credential owner and authorised credential/compliance roles. Institution administrators receive aggregate compliance alerts by default. Ordinary staff and peers never receive another provider’s credential alerts.

Reminder events are durable and deduplicated by credential, reminder stage, and due period. Renewal stops future reminders without deleting historical evidence or reminder history.

## Accountability dashboard contract

The institution dashboard should provide:

- Licensed staff: current, pending review, expiring, expired, revoked, and missing.
- Life Support: current/expiring/expired, separated into Paeds Resus-derived and external AHA sources.
- Learning engagement: sessions held, attendance rate, people attending, individual target progress where authorised, and departments with no activity.
- Department comparison: sessions held, attendance rate, targets met, learning completion, and period-over-period trend.
- Leadership view: Departmental Head, Education Coordinator, and ERCo presence/status by department, with no inference that activity alone proves clinical performance.

Small groups should use an insufficient-cohort state instead of exposing comparative metrics. Individual appraisal data must have a clear purpose, scoped access, and an audit event.

## Implementation order

1. Add structured credential and Departmental Head tables plus idempotent migration.
2. Add server-side credential projection, owner submission, scoped compliance queries, and Departmental Head assignment/query procedures.
3. Add durable reminder-event evaluation and notifications.
4. Add institution-facing compliance/accountability cards and a scoped Departmental Head/education view.
5. Tighten learning dashboard and CSV projections so CPD viewers/reporters do not receive unrestricted individual rows.
6. Add truthful provider profile completion states and structured credential UI.
7. Add authorization, projection, reminder, and migration tests, then pilot with one institution.

## Acceptance criteria

- A general member cannot fetch another user’s licence, certificate, contact, CPD, or performance data.
- A Departmental Head sees only assigned-department accountability data and no private evidence documents.
- Institution administrators can see institution-wide credential and learning status at a glance.
- External AHA records remain separated by BLS/ACLS/PALS/NRP and are visibly pending until verified.
- Paeds Resus competency records appear automatically from authoritative completion/sign-off data.
- Licence and Life Support reminders fire at 3, 2, and 1 calendar month, then weekly after expiry, without duplicate sends.
- Departmental Head appointment history is retained and only one active head exists per canonical department.
- Individual appraisal views are audited and do not become public performance leaderboards.
- The emergency bedside flow remains available regardless of profile-completion state.
