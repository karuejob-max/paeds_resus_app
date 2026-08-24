# Paeds Resus IERS Client Onboarding and Operating Manual v1

**Status:** External-facing onboarding and operating manual
**Product:** Paeds Resus Institutional Emergency Readiness System (IERS)
**Related standard:** Institutional Emergency Readiness Management System (IERMS™) Standard
**Version:** 1.0
**Effective date:** 24 August 2026
**Owner:** Paeds Resus
**Audience:** Hospital leadership, institution administrators, Emergency Readiness Committee members, Emergency Response Coordinators, Unit Team Leaders, Emergency Response Team Leaders, linked providers, reviewers, implementation partners, and Paeds Resus support teams

> **Purpose:** This manual explains what IERS is, who should use each part of it, how a facility becomes operational, what each role is allowed to do, and how the system turns readiness and response observations into governed improvement.

## 1. How to use this manual

This is the **client-facing operating manual** for a facility adopting Paeds Resus IERS. It is designed to be used during executive orientation, implementation kickoff, role onboarding, shift-readiness training, quarterly review, and handover when staff or administrators change.

It is not a substitute for the facility’s clinical policies, emergency numbers, scope-of-practice rules, medicines policy, resuscitation training, professional judgement, local law, or formal regulator requirements. ResusGPS remains the Paeds Resus product for structured bedside emergency reference support. IERS records and coordinates readiness, responsibility, response operations, evidence, and improvement; it does not replace the approved clinical record or emergency service.

The manual should be read with the [IERS Documentation Index](./IERS_DOCUMENTATION_INDEX.md). If a technical or product question conflicts with this manual, the [Platform Source of Truth](../PLATFORM_SOURCE_OF_TRUTH.md) governs. If a clinical-content question conflicts with a local approved protocol, the facility’s approved protocol and qualified clinical leadership govern, subject to the applicable Paeds Resus clinical-governance process.

## 2. What IERS is

The **Institutional Emergency Readiness System** is Paeds Resus’s facility-level operating layer for making emergency response more reliable. It connects institutional governance with the providers who must act during a shift. The institution governs membership, access, roster policy, department and pole structure, readiness templates, evidence review, corrective actions, drills, and aggregate reporting. Providers own the truth of their own duty: they accept or decline it, check what they can physically verify, respond when assigned, record factual observations, and progress work assigned to them.

IERS is part of the wider Paeds Resus Adaptive Learning System. Its purpose is not to produce an impressive score or a large amount of data. Its purpose is to make failures visible, assign ownership, verify improvement, and prevent the same operational failure from recurring.

> **The operating principle:** assignment is not acceptance; acceptance is not readiness; readiness is not response; response is not outcome; and a score is not certification.

IERS is distinct from the CPD Portal. The CPD Portal manages professional-development activity, attendance, certificates, and learning records. IERS manages emergency-readiness operations, including governance, rosters, response roles, equipment readiness, activations, drills, evidence, actions, and institutional learning. A CPD attendance record or course certificate does not prove that a provider accepted a dated emergency duty or that a facility was ready for a particular shift.

## 3. The facility operating model

IERS uses two connected surfaces with one canonical record. Providers use the Individual platform for their own duties, acceptance, readiness, response, factual reports, and assigned work. Institution leaders use the Institution workspace for configuration, governance, review, escalation, and aggregate improvement. The two surfaces must not create competing copies of the same fact.

| Surface | Primary users | Primary responsibility | Canonical examples |
|---|---|---|---|
| **Individual provider platform** | Linked nurses, clinical officers, doctors, ERT members, UTLs, ERTL | Own and report personal duty state and factual response activity | Accept/decline duty, readiness check, role report, response acknowledgement |
| **Institution workspace** | Institution admins, ERCo, IERS Lead, reviewers, leadership | Govern access, structure, coverage, evidence, actions, and trends | Departments, poles, ERCo appointments, UTL staffing, template approval, review queue |
| **ResusGPS** | Trained healthcare providers | Structured bedside reference support | ABCDE flows, CPR timing, weight/age-banded calculation support, pathway prompts |
| **CPD Portal** | Providers and education administrators | Professional development records | Sessions, attendance, certificates, learning analytics |

## 4. Who does what

The facility should name people, not merely assign generic accounts. Every role must have a clear owner, a backup or escalation path where needed, and an explicit boundary against self-approval or silent substitution.

| Role | Main responsibility | IERS actions | Does not mean |
|---|---|---|---|
| **Institution Admin** | Identity, membership, product access, formal institution decisions | Link or remove members, assign product roles, manage subscription and administration, maintain facility structure | Authority to rewrite provider-authored clinical facts or sign a provider’s readiness |
| **IERS Lead / governance lead** | Institutional readiness programme coordination | Configure the IERS operating model, review coverage, coordinate implementation, review trends | Automatic authority to accept another provider’s dated duty |
| **Emergency Readiness Committee (ERC)** | Multidisciplinary governance | Approve policy, local readiness standards, escalation rules, and improvement priorities | Replacement for event-level evidence review |
| **ERCo** | Department-level readiness champion | Maintain the department’s UTL coverage, coordinate exceptions, review readiness gaps, and coordinate improvement | Automatic emergency responder or automatic UTL/ERTL |
| **Assistant ERCo** | Governance continuity | Support the ERCo and preserve continuity when explicitly authorized | Automatic backup responder or unrestricted staffing editor |
| **UTL** | Unit/department shift readiness | Accept or decline a dated UTL duty, check readiness, lead the unit response, report gaps, and escalate | Proof that the whole facility is ready or authority to close their own evidence |
| **ERTL** | Shift-level response leadership | Accept or decline the dated ERTL role, coordinate the ERT during an activation, allocate response roles where permitted, and lead the debrief | Authority to erase history or approve their own evidence and action closure |
| **ERT member** | Assigned operational response role | Accept or decline the assigned role, recommend an alternative, respond, and submit a factual role-at-event report | Automatic clinical authority beyond scope of practice |
| **Linked provider** | Point-of-care truth | See authorized ERT information, accept duties, report readiness and response facts, submit evidence, and progress assigned work | Access to unrelated institutions or other providers’ private records |
| **Independent reviewer** | Evidence and action verification | Review submitted evidence and verify closure independently | Permission to approve their own submission |
| **Senior leadership / Medical Director / DNS** | Executive accountability | Approve the implementation, resource decisions, local policy, and review findings | Delegation of clinical responsibility to the software |
| **Paeds Resus reviewer** | Programme oversight | Review evidence where contracted and issue only the credential supported by evidence | AHA certification, government licence, or regulatory accreditation |

Standing responsibility, active institution membership, product permissions, and a dated duty are separate facts. A provider may be an RN and an active institution member without being the UTL for today’s shift. A provider may be a standing ERCo without being assigned to the active ERT. The platform must preserve these distinctions.

## 5. What the facility must decide before onboarding

Before the first operational shift is configured, the facility should document the following decisions in its local implementation record:

1. Which departments are emergency-operational and require a pole assignment, and which departments remain in the institutional/CPD directory without requiring ERT coverage.
2. Which poles exist, how they are named, and their display order. A facility may use North/South, North/South/East/West, or another locally meaningful arrangement.
3. One current ERCo for each operational department, with an optional Assistant ERCo for continuity.
4. The ERTL rotation rule and the person or process responsible for confirming availability.
5. The exact shift intervals used locally, including overnight shifts and handover expectations.
6. The UTL replacement process when a provider resigns, is redeployed, becomes unavailable, or declines a duty.
7. Which readiness template items are **Immediate** and which are **Accessible**, which age/setting modules apply, who checks them, and how stock, function, expiry, and restocking are documented.
8. The facility’s approved emergency call method, escalation ladder, downtime method, and response-time targets.
9. The independent reviewer for evidence and action closure.
10. The facility’s privacy, retention, notification, and incident-reporting requirements.

The platform can help structure these decisions, but it must not invent them. Local clinical, pharmacy, nursing, biomedical, quality, and executive representatives must approve the facility-specific operating policy.

## 6. Onboarding sequence

### 6.1 Before the kickoff

Paeds Resus and facility leadership confirm the contracting or pilot boundary, decision-makers, implementation contact, departments in scope, expected staff population, device/connectivity constraints, and the difference between IERS, ResusGPS, CPD, Care Signal, and Safe-Truth. No production patient information is needed for onboarding.

### 6.2 Days 1–15: leadership and baseline

The facility appoints an executive sponsor, an implementation lead, the ERC, IERS Lead, institution administrators, independent reviewer, and department ERCos. The team completes the baseline readiness review using the [IERMS Standard](./IERMS_STANDARD_V1.md) and [audit scorecard](./IERMS_AUDIT_SCORECARD_V1.md). The baseline should identify staffing, escalation, equipment, training, policy, connectivity, and documentation gaps without blaming individual providers.

### 6.3 Days 16–45: facility structure and ERT

The institution admin confirms the canonical department register. The IERS Lead identifies operational departments and assigns them to poles. People are linked to the institution, their professional profile and canonical department are checked, and product roles are assigned separately from dated duties. ERCo appointments are configured, accepted, and reviewed. Dated UTL/ERTL/ERT assignments are published only after the facility confirms the coverage plan.

### 6.4 Days 46–75: training, readiness, and reporting

The facility maps training to role and scope. Providers learn where to accept or decline duties, how to complete their readiness check, how to report a missing resource, how to use ResusGPS, how to submit a factual IERS role report, and how to use the anonymous Care/Code Signal path. The UTL readiness template is reviewed by clinical, pharmacy, nursing, biomedical, and quality leads before approval.

### 6.5 Days 76–90 and ongoing: review and improvement

The facility reviews role coverage, acceptance, readiness gaps, activation and drill records, response timelines, evidence review, action closure, and provider-reported confusion. The leadership team agrees which gaps require procurement, staffing, policy, training, workflow, or escalation changes. A readiness score is used as an internal improvement signal and never as a substitute for human review or certification.

## 7. Getting people and permissions right

Institution admins use the Institution workspace to link active providers, confirm identity, assign product roles, and maintain memberships. A registered Staff/RN provider appears in department staffing when the provider has an active institutional link, active membership, and the exact canonical department. A profile alone does not grant institutional access.

When a provider leaves, is suspended, or changes institution, the administrator should end the institution membership rather than delete historical records. The platform should preserve accepted duties, attendance, evidence, and event history while revoking future participation and access as required. Server checks must revalidate membership and authorization when reading or responding to a duty.

Do not solve a permission problem by making everyone an administrator. If a user cannot see or operate a surface, first check institution membership, product entitlement, product role, standing responsibility, dated assignment, and acceptance state in that order.

## 8. Shift and role workflow

### 8.1 Before the shift

The institution or authorized ERCo publishes the dated roster. The provider sees the institution, pole, department, date, shift, role, and exact local hours in the Individual platform. The provider chooses **Accept**, **Decline with reason**, or, where enabled, **Recommend an alternative**.

A pending assignment is proposed coverage. An accepted assignment is an accepted responsibility subject to active membership, dates, and further checks. Neither state proves that the provider has arrived or that equipment is ready.

### 8.2 UTL staffing and replacement

The ERCo opens Department UTL staffing, selects the department, searches all eligible Staff/RN practitioners in that department, and assigns one provider to explicitly selected dates and shifts. The ERCo may work day by day or use the practitioner-first flow to select one provider and apply that provider to several checked dates. Exact local start/end times must be retained, including overnight day offset where applicable.

If the provider resigns, is redeployed, or can no longer cover after accepting the duty, the ERCo or authorized staffing operator changes the existing dated assignment rather than deleting history. The outgoing provider’s acceptance and provider-readiness state are reset for that duty. The replacement provider receives a new pending acceptance state. The ERCo must confirm replacement coverage; the platform must not silently infer the first available provider.

### 8.3 ERT visibility and role acceptance

All linked nurses who are authorized for the institution can view the published ERT for their pole and shift. An assigned ERT member accepts or declines the assigned role with a reason. If the provider recommends a different role, the recommendation remains pending until the shift’s ERTL or another authorized role owner approves it.

The ERTL can review recommendations and, where permitted, switch operational roles between ERT members. Every role change records the actor, time, reason, old role, new role, affected providers, and resulting acceptance state. The ERTL cannot erase historical assignments or silently turn a decline into acceptance.

### 8.4 Declined UTL duties

A declined UTL duty is a coverage exception, not a disciplinary finding. The system should notify the department ERCo and place the shift in a visible **UTL coverage required** queue. The ERCo confirms the replacement UTL, publishes the replacement dated duty, and confirms that the replacement provider accepts it. A shift must not be treated as covered solely because a notification was sent.

## 9. UTL readiness and crash-cart governance

The UTL readiness function is a structured verification and escalation tool. It is not an autonomous prescribing system and does not replace local crash-cart policy. The facility must approve its own template before using it operationally.

The recommended template structure is a governed universal core plus age/setting modules. The core may include categories such as airway and ventilation equipment, oxygen and breathing support, suction, circulation and vascular access, monitoring and defibrillation, glucose measurement, PPE and sharps safety, communication/escalation, documentation aids, and restocking controls. The facility then adds the appropriate newborn-at-birth, infant/child, adolescent/adult, maternity, trauma, or other approved modules.

Every item should state whether it is Immediate or Accessible, its expected location, quantity or availability rule, storage/expiry requirement, function check, local policy/version, and responsible verifier. A missing, expired, damaged, inaccessible, or nonfunctional item creates a visible gap and escalation; it must never trigger an improvised dose or an unapproved substitution.

The UTL completes the checklist against the exact dated duty. A readiness result should distinguish **Ready**, **Ready with non-critical gaps**, and **Not ready / critical blocker**. The institution sees the canonical record and owns the action response. The UTL does not independently verify closure of their own corrective action.

Newborn resuscitation is not interchangeable with general infant, child, adolescent, or adult arrest preparation. Age and setting modules must be reviewed by qualified clinical and pharmacy leaders, and the facility must follow current local policy and applicable professional guidance.[1] [2] [3]

## 10. Activation and response

The bedside emergency flow remains stable:

> **Open the app → enter findings or trigger the activation → receive priority next actions → reassess and record the response.**

IERS adds the operational team layer around that flow. An authorized provider or institutional operator activates the IERS response according to the facility’s policy. The platform creates a durable activation context, resolves the current eligible team, and presents urgent response work separately from ordinary learning or account notifications.

The status of an activation must remain explicit: notifying, acknowledged, responding, at scene, stabilized, debrief pending, and closed. Alert delivery is not acknowledgement. Acknowledgement is not response. Response is not arrival. A provider records their own movement and arrival where permitted; a witnessed arrival for another provider requires an authorized actor, timestamp, source, and reason.

The ERTL leads the operational response within their scope. Providers use ResusGPS and the facility’s approved clinical protocols when appropriate. IERS does not dispatch an ambulance, guarantee message delivery, diagnose, prescribe, or replace senior clinical review.[4]

## 11. Reporting boundaries

IERS has two different reporting paths that must not be merged.

### 11.1 Targeted ERT role report

An assigned ERT member can submit a short, named, activation-linked report describing what they observed or did in their assigned role. The report should capture role-at-event, phase, factual observation, resource or process issue, and any immediate handover or improvement implication. It should not include patient names, hospital numbers, phone numbers, photographs, or unnecessary clinical narrative. The report is linked to an immutable activation-team snapshot so later roster changes do not rewrite who was assigned at the time.

### 11.2 Anonymous Care/Code Signal

Any eligible provider may submit an anonymous Care/Code Signal about a care event, near miss, resuscitation, or observed system concern, whether or not they were assigned to the ERT. This path is separate from the named role report and must display its own privacy explanation. Anonymous reporting must not be used to hide an urgent safety issue that requires immediate escalation through the facility’s emergency or incident process.

IERS, Care Signal, the approved clinical record, and mandatory statutory reporting are different channels. Providers should follow the facility’s reporting policy for serious incidents while using the platform’s no-patient-identifier rule.

## 12. After the event: debrief, evidence, and action

The ERTL leads a structured debrief after a labelled drill or real activation according to facility policy. Participants contribute factual observations. The institution reviews the timeline, role coverage, equipment and escalation gaps, and the difference between intended and actual execution.

A provider may submit evidence and progress an assigned action. An independent reviewer accepts or rejects evidence. Closure requires verification by an authorized reviewer and supporting evidence. The person who created or performed an action should not be the sole person who verifies its closure.

A drill must be explicitly labelled **NOT A REAL EMERGENCY** and use fictional, non-identifying information. No patient name, hospital number, phone number, image, or family story belongs in an IERS drill, evidence note, action, QR payload, export, or report.

## 13. Adaptive Learning System

The IERS contributes structured observations to the Paeds Resus Adaptive Learning System. The safe sequence is:

| Layer | Meaning | Example |
|---|---|---|
| **Operational truth** | What was recorded as observed or done; immutable | UTL declined a dated shift; a readiness item was missing; a provider arrived at a recorded time |
| **Analytical truth** | A governed pattern detected across observations; versioned and revisable | Repeated missing suction equipment in one setting during a defined period |
| **Actionable truth** | A reviewed change that Paeds Resus or the institution is willing to teach, recommend, or implement | A locally approved restocking process or revised training emphasis |

Raw observations must not become punitive staff scores. Adaptive-learning outputs should be shown with scope, period, denominator, data source, freshness, missingness, and limitations. The system must not infer patient outcomes, blame a person, or claim that a high readiness score proves clinical success.

The institutional Adaptive Learning panel is for improvement review. It should help leaders ask: What repeatedly fails? Where is coverage incomplete? Which equipment gaps remain open? Which actions are overdue? Which response steps are difficult to execute? What intervention should be tested next? The answer must lead to a governed action, not an unsupported clinical recommendation.

## 14. Daily, monthly, and quarterly operating cadence

| Cadence | Owner | Minimum activity |
|---|---|---|
| **Every shift** | UTL / assigned readiness owner | Confirm people, equipment, emergency call route, handover, and critical readiness items; record gaps |
| **Every dated duty** | Assigned provider | Accept or decline; provide a reason when declining; respond to replacement or role changes |
| **Every activation** | ERTL and ERT | Accept roles, respond, record factual operational events, submit role reports where appropriate |
| **After activation or drill** | ERTL, scribe, participants, reviewer | Debrief, submit evidence, assign actions, independently verify closure |
| **Weekly** | ERCo / IERS Lead | Review uncovered duties, declined UTL/ERTL roles, pending acceptance, critical readiness gaps, and overdue replacements |
| **Monthly** | ERC / QI / leadership | Review Care Signal, role reports, readiness gaps, response measures, and action closure without ranking individuals |
| **Quarterly or per facility policy** | Executive sponsor / Paeds Resus support | Reconfirm departments, poles, role owners, template version, escalation contacts, connectivity, and governance decisions |
| **Annually** | Facility leadership and reviewer | Re-audit the IERMS domains and approve renewal or remediation plan |

## 15. What IERS does not claim

IERS does not claim guaranteed emergency dispatch, guaranteed notification delivery, automatic staffing, universal equipment sufficiency, clinical competency from attendance, patient survival improvement from a single metric, regulatory accreditation from a score, or official AHA certification from a Paeds Resus institutional credential.

The facility remains responsible for its emergency policy, staffing, supplies, medicines, equipment maintenance, training, professional accountability, local reporting, and emergency-service arrangements. Paeds Resus provides the platform, structured operating model, and governed improvement support within the agreed scope.

## 16. Troubleshooting and escalation

When a user cannot perform an action, check the state in this order: correct institution context; active membership; account link; canonical department; product entitlement; product role; standing responsibility; dated assignment; assignment acceptance; date and shift validity; and whether the action is institution-owned or provider-owned.

When a provider is missing from a department list, check that the provider profile says Staff/RN or another supported role, the provider is not a student, the account is linked and active, and the canonical department matches exactly. When a UTL is missing, do not select a different department as a workaround; correct the canonical data or explicitly appoint an eligible replacement.

When a readiness result is blocked, record the gap and escalate it. Do not bypass a critical item, invent a local substitute in the platform, or convert a missing resource into a positive readiness statement.

For software failures, capture the route, time, account context, visible message, and non-identifying reproduction steps. Do not include patient data or secrets. Serious clinical incidents follow the facility’s incident pathway independently of software support.

## 17. Facility onboarding completion checklist

A facility is operationally oriented when it can demonstrate the following using a clearly labelled non-clinical drill or administrative test and no patient identifiers:

- The institution admin can access the Institution workspace and identify IERS versus CPD Portal responsibilities.
- The facility has named an executive sponsor, IERS Lead, ERC, institution admins, ERCo for each operational department, optional Assistant ERCo, ERTL process, UTL owners, and independent reviewer.
- The canonical department list and pole order are confirmed.
- Staff memberships, profile cadres, canonical departments, and product roles are correct.
- A dated UTL and ERTL assignment can be published, viewed, accepted, declined, replaced, and audited.
- All linked nurses can find the ERT for their pole and shift when a team is published.
- The UTL readiness template has been locally reviewed and approved, including age/setting modules and Immediate versus Accessible items.
- A UTL can complete a readiness check and record a gap without creating a false positive.
- An ERT member can accept or decline a role; an ERTL can review an alternative-role recommendation within authority.
- An accepted UTL decline creates a visible ERCo coverage exception and does not silently auto-assign a replacement.
- A named targeted role report is distinguishable from an anonymous Care/Code Signal.
- Activation, response, arrival, debrief, evidence, and action states remain distinct.
- The team can explain what the Adaptive Learning panel can and cannot infer.
- The team knows how to continue safely during connectivity loss and how to escalate a system outage.
- The facility can identify the local policy owner and the independent person who verifies corrective-action closure.

## 18. Agent and implementation-partner handoff

Future agents and implementation partners must not treat this manual as permission to make production changes. Before touching code or data, read `AGENTS.md`, `docs/PAEDS_RESUS_COHERENT_PICTURE.md`, `docs/PLATFORM_SOURCE_OF_TRUTH.md`, and the relevant technical specification. Use the [IERS Documentation Index](./IERS_DOCUMENTATION_INDEX.md) to choose the correct document.

All code changes use a fresh `main` baseline, a focused feature branch, protected PR, green CI, merge, deployment verification, and WORK_STATUS evidence. Any numbered schema migration requires collision reservation, an idempotent migration script, package/runner registration, strict verification, and fresh explicit approval before a production database write. Never use production patient data or a real emergency for testing. Use the labelled test identity and disposable tenant/database procedures defined in the repository runbooks.

Agents must preserve the core emergency flow, avoid broad error suppression, avoid inventing clinical content, and never convert analytical patterns directly into provider-facing clinical recommendations. When a requirement is ambiguous, document the assumption and preserve the safest reversible path.

## 19. Document control

The institution should review this manual at onboarding, after a material IERS release, after a serious incident or near miss, and at least annually. Local appendices may specify facility names, contacts, emergency numbers, policy versions, equipment locations, and approved escalation rules; they must not rewrite the Paeds Resus platform contract without governance review.

**Document owner:** Paeds Resus
**Facility owner:** The adopting institution’s designated executive/clinical governance lead
**Review trigger:** Material role, readiness, reporting, privacy, clinical-scope, or data-governance change

## References

[1]: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001370 "AHA/AAP 2025 Pediatric Basic Life Support"

[2]: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001367 "AHA/AAP 2025 Neonatal Resuscitation"

[3]: https://www.resus.org.uk/library/quality-standards-cpr/acute-care-equipment-and-drug-lists "Resuscitation Council UK: Acute-care equipment and drug lists"

[4]: ../legal/CLINICAL_INTENDED_USE_STATEMENT.md "Paeds Resus clinical intended-use and limitations statement"

[5]: ./IERMS_STANDARD_V1.md "IERMS Standard V1"

[6]: ./IERMS_IMPLEMENTATION_SUITE.md "IERMS 90-Day Hospital Rollout and Readiness Guide"

[7]: ./IERS_NEW_USER_ORIENTATION_GUIDE.md "IERS New-User Orientation Guide"

[8]: ./IERS_PROVIDER_INTEGRATION_AND_INDIVIDUAL_PORTAL_ARCHITECTURE_V1.md "IERS Provider Integration and Individual Portal Architecture V1"

[9]: ../OBSERVATION_ARCHITECTURE_V1_1.md "Observation Architecture V1.1"

[10]: ../EVENT_MODELS_V1.md "Event Models V1"

[11]: ../AGENTS.md "Repository operating and recovery rules"

[12]: ../WORK_STATUS.md "Paeds Resus work-status log"
