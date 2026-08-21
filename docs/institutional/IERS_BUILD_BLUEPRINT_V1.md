# IERS Build Blueprint v1

**Status:** Phase 0 baseline contract  
**Owner:** Paeds Resus  
**Purpose:** Define the minimum end-to-end operating model before implementing the IERS platform rebuild.

## 1. Product promise

Paeds Resus IERS is a shared institutional operating system for emergency readiness. It is not only an administrator dashboard and it is not only a provider learning tool. Institutional leaders configure the system, but providers operate it at the point of care. Readiness therefore belongs to the institution **and** to the named clinicians, Unit Team Leaders, Emergency Response Team Leaders, responders, equipment checkers, QI reviewers, and implementation owners who create the evidence.

The product must prove the complete loop:

> Configure the facility → confirm every shift has a responsible team → activate an emergency → notify and escalate responders → record response and stabilization → capture a safe debrief → convert gaps into owned actions → verify closure → update readiness evidence and reports.

The system must never imply that a facility is ready merely because staff were enrolled, a score was submitted, or a roster exists.

## 2. Operating principles

| Principle | Product rule |
|---|---|
| **Provider responsibility** | Providers must see assigned shifts, readiness tasks, activations, drills, action items, policy attestations, and evidence requests in their own workspace. Institutional admins cannot be the only users who drive readiness. |
| **Institutional accountability** | Institutional admins configure scope, roles, policies, equipment ownership, review permissions, and accreditation submissions. |
| **Evidence before claims** | Scores and accreditation status are derived from criterion evidence and review state, not free-form domain sliders. |
| **Clinical safety first** | The existing bedside ResusGPS flow remains stable. IERS adds context and evidence without interrupting emergency guidance. |
| **Closed-loop QI** | Every material gap has an owner, due date, severity, action, verification method, and re-check. |
| **Offline and low-resource resilience** | Activation, bedside guidance, downtime fallback, and later synchronization must work when connectivity is unreliable. |
| **Privacy by design** | Facility analytics are aggregate by default; patient identifiers are prohibited; AI findings are suggestions, not clinical or accreditation decisions. |
| **Least privilege and dual control** | Configuration, clinical sign-off, QI closure, and accreditation approval are separate permissions where possible. |
| **Portability** | Facilities can export their roster, audits, actions, reports, and evidence metadata without platform lock-in. |

## 3. Shared provider–institution responsibility model

### Institutional roles

| Role | Core responsibilities |
|---|---|
| **Executive sponsor** | Approves scope, resources, policy, and institutional readiness decision. |
| **Institution coordinator** | Owns the implementation plan, roster completeness, deadlines, and coordination with Paeds Resus. |
| **Clinical governance lead** | Reviews incidents, drills, policy drift, and QI patterns; approves clinical system changes. |
| **ERT/ERTL coordinator** | Maintains poles, departments, shift coverage, ERTL rotation, backup responders, and activation drills. |
| **Equipment lead** | Owns inventory, daily seal checks, monthly audits, deficits, restock requests, and re-verification. |
| **QI reviewer** | Reviews Care Signal, Code Signal, ResusGPS, incident, and action-log evidence without punitive provider surveillance. |
| **Accreditation reviewer** | Performs or reviews criterion-level audits independently from the person who configured the score. |
| **Finance/procurement officer** | Manages commercial scope, payment, purchase orders, and renewal. |

### Provider roles

| Role | Core responsibilities |
|---|---|
| **Responder** | Maintains profile and competency, receives activations, acknowledges or declines with reason, attends when assigned, and records response evidence. |
| **Shift UTL** | Confirms shift coverage, equipment readiness, responder presence, handover, and escalation backup. |
| **ERTL / scene commander** | Leads the response, confirms arrival, assigns roles, records stabilization and handover, and initiates debrief. |
| **Clinical provider** | Uses ResusGPS, records resource unavailability and overrides with rationale, submits Care/Code Signal reports, and participates in debrief/QI. |
| **Equipment checker** | Performs assigned checks, reports deficits, attaches evidence where appropriate, and verifies restoration. |
| **QI/action owner** | Accepts assigned gap actions, records system changes, submits closure evidence, and requests verification. |
| **Policy attestor** | Reads and acknowledges current local protocols and declares gaps or questions. |
| **Drill participant/observer** | Participates in drills, records observed timing and communication performance, and contributes to psychologically safe debrief. |

A provider without an institutional account link may still use the provider platform. Once linked to an institution, the provider gains institution-scoped tasks and evidence responsibilities according to their assigned role. A provider must never gain access to another institution’s data merely because they have a similar job title.

## 4. End-to-end state model

### Activation state machine

`draft → triggered → notifying → acknowledged → responding → at_scene → stabilized → recovered → debrief_pending → closed`

Exception states are `cancelled`, `false_alarm`, `downtime_pending_sync`, and `failed_escalation`. Every transition records actor, timestamp, reason, and source. The system must support manual activation when a digital trigger is unavailable and later reconcile the paper/phone event without rewriting the original timeline.

### Action state machine

`open → accepted → in_progress → evidence_submitted → verification_pending → completed`

Exception states are `rejected_with_reason`, `blocked`, `overdue`, and `reopened`. An action may not be marked completed without a documented system change and verification evidence. Reopening preserves the prior closure history.

### Audit state machine

`draft → submitted → under_review → changes_requested → approved → superseded`

Only `approved` audits can influence accreditation status. A draft or self-assessment must be clearly labelled and cannot create a certified status.

### Accreditation state machine

`not_assessed → baseline → provisional → certified → exemplar → suspended → expired → renewed`

Critical fail conditions can prevent certification regardless of aggregate points. Validity periods, conditions, reviewer, evidence snapshot, and suspension reasons are preserved.

## 5. Minimum evidence domains

The five IERMS domains remain the product spine:

| Domain | Minimum evidence to support an institutional claim |
|---|---|
| **D1 Governance and ERT activation** | Approved charter, named roles, current shift coverage, activation timeline, acknowledgement/escalation evidence, drill results, and backup coverage. |
| **D2 ResusGPS bedside guidance** | Registered devices or ward access points, content version, offline test, adoption metrics, usage in drills/real events, resource-unavailable and override review. |
| **D3 Safety culture and Care Signal QI** | Care/Code Signal activity, privacy-safe participation, monthly QI review, linked actions, action closure and re-verification. |
| **D4 Workforce competency and AHA mesh** | Role-mapped competency matrix, current credentials, gaps, instructor pipeline, policy attestations, provider participation and expiry alerts. |
| **D5 Physical readiness and equipment** | Itemized inventory, paediatric sizing, quantity and expiry/function checks, daily/weekly/monthly audit history, deficit owner, restock proof, and verifier sign-off. |

## 6. Minimum data entities

The implementation should introduce or extend the following entities without destroying existing data:

- `institutionMemberships`: provider-to-institution link, role, status, invite/acceptance, start/end dates, and permissions.
- `providerReadinessTasks`: provider assignment, task type, due date, status, evidence, and verifier.
- `ertShiftCoverage`: shift, unit/pole, primary and backup ERTL/UTL/responders, competency validity, handover, and sign-off.
- `activationEvents`: trigger, location, state, clinical category, source, shift, timestamps, linked incident/debrief.
- `activationNotifications`: channel, recipient, sent/delivered/acknowledged timestamps, timeout, escalation, and failure reason.
- `drills`: scenario, unit, target, participants, observers, timing, debrief, and resulting actions.
- `equipmentItems` and `equipmentChecks`: canonical item, size, quantity, expiry, function, location, seal, checker, and evidence.
- `readinessDeficits`: source, domain, severity, owner, due date, action, evidence, verification, and re-open history.
- `policyDocuments` and `policyAttestations`: version, owner, approval, effective date, affected units, attestors, and review date.
- `iersAuditInstances` and `iersAuditCriteria`: criterion score, evidence, assessor, review state, critical fail, comments, and snapshot.
- `implementationWorkItems`: phase, owner, dependency, blocker, due date, evidence, acceptance, and sign-off.
- `qiReviews`: period, attendees, agenda, decisions, actions, and sign-off.
- `iersReportSnapshots`: frozen metrics, evidence references, score, limitations, signatories, and generated time.
- `accreditationDecisions`: level, reviewer, validity, conditions, suspension, appeal, and renewal.
- `deviceRegistry`: device/ward, content version, last seen, offline test, custodian, and status.

Each new entity must be institution-scoped, indexed for its key queries, auditable, and covered by tenant-isolation tests.

## 7. Provider experience contract

The provider home/dashboard must include a compact **My Institutional Readiness** area when the provider is linked to an institution. It should show current role, next shift, readiness tasks, active/acknowledgement-required activations, overdue actions, expiring credentials, policy attestations, assigned equipment checks, upcoming drills, and a clear link to report a safety gap. The provider must be able to complete tasks from the provider platform without entering an administrator-only dashboard.

During an activation, the provider view must become task-oriented: location, urgency, assigned role, acknowledgement control, backup/escalation state, and safe handoff. It must never obscure the main ResusGPS bedside flow. After the event, the provider sees only the records and QI tasks permitted by role and privacy policy.

## 8. Institutional admin experience contract

The institutional dashboard must focus on exceptions and evidence rather than static cards. The landing view should answer: which shifts are uncovered, which critical equipment deficits are unresolved, which actions are overdue, which providers have pending readiness tasks, which activations/drills failed to meet target, which policies need attestation, and whether the latest evidence supports the current accreditation state.

Static report, ROI, billing, and upgrade controls must remain hidden or visibly labelled until implemented. Every executive metric must show its denominator, period, freshness, source, and limitation.

## 9. Safety and release gates

A phase cannot be considered complete unless it passes the following gates:

| Gate | Required outcome |
|---|---|
| **Clinical flow stability** | Open app → enter findings → receive next action → reassess remains unchanged and tested. |
| **Tenant isolation** | Provider, institution admin, reviewer, and platform admin tests prove no cross-institution read/write leakage. |
| **Audit integrity** | Scores, evidence, reviewers, and snapshots are reproducible and immutable after approval. |
| **Offline resilience** | Critical provider flow has a visible offline state, safe local queue, conflict policy, and recovery test. |
| **Data quality** | Invalid denominators, impossible percentages, stale scores, and unmatched facility identities are surfaced rather than silently displayed. |
| **Human factors** | Provider and coordinator can discover the required next action under pressure without relying on hidden documentation. |
| **Operational rollback** | Each migration is additive or reversible, with backup/export and a documented rollback path. |
| **Commercial honesty** | Product claims match deployed capability; pilot, provisional, certified, and exemplar states are distinct. |

## 10. Phase sequence

Phase 0 freezes this contract and the current baseline. Phase 1 links providers and institutions with explicit roles. Phase 2 introduces activation, notification, and acknowledgement data. Phase 3 delivers provider-led shift and emergency workflows. Phase 4 upgrades physical/policy/device evidence. Phase 5 replaces self-scored accreditation with criterion evidence and dual review. Phase 6 connects clinical, QI, incident, drill, and action data. Phase 7 turns the 90-day tracker into an owned implementation board. Phase 8 creates trustworthy reports and snapshots. Phase 9 hardens privacy, AI governance, authorization, and data quality. Phase 10 validates and stages production deployment. The final release package includes runbooks, pilot scripts, exports, rollback instructions, and an updated audit.

## 11. Out of scope until the core loop is safe

The build should defer vanity benchmarks, broad ROI claims, unreviewed AI accreditation, complex subscription upgrades, cross-facility league tables, and new dashboard widgets that do not close an operational loop. The priority is not to make the dashboard look more complete; it is to make the system trustworthy when a real provider, shift, equipment deficit, or emergency event occurs.
