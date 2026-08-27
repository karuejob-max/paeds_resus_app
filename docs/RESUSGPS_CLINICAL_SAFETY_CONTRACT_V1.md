# ResusGPS Clinical Safety Contract v1

**Status:** Draft for clinical-owner review  
**Product:** ResusGPS non-arrest and CPR-GPS integrated emergency workflow  
**Date:** 27 August 2026  
**Owner:** Paeds Resus product and clinical governance team

## 1. Purpose and boundary

ResusGPS is a bedside **cognitive aid** for structured emergency assessment, action prompting, reassessment, documentation, and institutional learning. It does not replace clinical judgement, local policy, senior escalation, monitoring, a defibrillator, a hospital alarm system, a diagnostic device, or a physical CPR-quality sensor. The interface must repeat this boundary at the point where reliance could occur, not only in legal or onboarding content.

This contract governs the non-arrest Primary Survey and Secondary Survey work. CPR-GPS remains a separately governed arrest command path. The two paths may share proven context, provenance, persistence, and handover primitives, but CPR-specific timing and arrest decisions must not be changed by non-arrest UI work.

## 2. Non-negotiable clinical flow

The unified route is: activation context when present → structured age and best available weight → governed setting/context → BLS assessment → CPR-GPS/NRP for arrest or XABCDE for non-arrest → Secondary Survey → targeted role report and debrief → optional definitive/fellowship care.

The non-arrest route proceeds in order through X where applicable, then A, B, C, D, and E. A critical or urgent finding creates an immediate treatment/reassessment task. Treatment is never assumed effective because it was started or marked complete. The next survey letter is available only after the current letter's blocking actions and required reassessments have explicit outcomes.

## 3. Context and pack gate

Before age-specific guidance is shown, the case must have:

1. A structured age band or a clearly parsed age with visible interpretation.
2. A best available dosing weight labelled as measured/current, caregiver-reported/last-known, or emergency estimate.
3. Trauma status.
4. Delivery-room newborn status selected explicitly when NRP is intended.
5. Hospital infant/child context mapped to PALS content; adult context mapped to governed ACLS content only when adult content is enabled.
6. The selected pack shown in the active status area before the first intervention and after any context change.

Age alone must never select delivery-room NRP. A low-confidence estimate must never be displayed as a measured weight. Ambiguous or unsupported context must fail closed to a safe confirmation state, not silently choose a pathway.

## 4. Primary Survey contract

Each current letter has one visible current action. The interface may show compact status, threats, and escalation information, but secondary drawers must not compete with the current action. The user can record a normal finding, a concerning finding, an unavailable observation, or a contextually not-applicable finding only when the data model and clinical owner permit it.

Every critical or urgent intervention must end in one explicit disposition:

| Disposition | Meaning | Can the survey continue? | Required record |
|---|---|---:|---|
| Completed and improved | Action delivered and endpoint improved | Yes, after required recheck | Action, time, endpoint, and response evidence |
| Completed, persists | Action delivered but problem remains | No, unless escalation is documented | Response evidence and next escalation |
| Completed, worsened/new problem | Action delivered and patient worsened or new threat identified | No | New finding, escalation, and current owner |
| Repeated | A governed repeat is performed | No until new response is documented | Repeat count, time, and response |
| Escalated | Senior/team/service escalation initiated | Yes only to the explicitly allowed next action | Escalation target, time, and status |
| Unavailable | Recommended resource or expertise unavailable | No silent bypass; proceed only through governed alternative/escalation | Resource gap, alternative if used, escalation owner, reason |
| Deferred | Action intentionally deferred for a documented reason | No silent bypass; must show due condition or owner | Reason, owner, due trigger/time |
| Declined/overridden | Clinician chooses not to follow the prompt | No silent bypass for high-risk actions | Reason, role, timestamp, and escalation acknowledgement |
| Not applicable | Clinical owner has defined the action as not applicable in this context | Yes | Context and rationale |

“Done” without a response or disposition is not a safe terminal state for a high-risk action. The UI must not use reassuring language such as “resolved” unless the recorded endpoint supports it.

## 5. Reassessment contract

Required reassessments are a deterministic queue, ordered by clinical urgency, current letter, and due time. Each queue item shows the intervention, the observation or endpoint required, the due status, and the next allowed choices. Multiple pending reassessments must never be collapsed into an arbitrary single item without preserving the remaining queue.

The allowed outcomes are repeat, escalate, stop/avoid further treatment, improved/resolved, persists, worsened/new problem, unable to assess with reason, or deferred with named owner and trigger. Closing a reassessment surface without one of these outcomes is not permitted for a required check. Reassessment timing is a decision aid; it must not be represented as a hospital alarm or monitoring service.

## 6. Secondary Survey modes

Secondary Survey has two deliberate modes:

### Stabilization and handover minimum

Available after the Primary Survey has no unresolved blocking action, this mode captures enough current status, key interventions, response, outstanding threats, resource gaps, escalation owner, and next reassessment for a safe role handover. It must not be blocked by the full diagnostic evidence catalogue. Missing data remains visibly unknown/not available with rationale.

### Condition-specific diagnostic completion

SAMPLE, structured symptoms, diagnostic evidence, primary diagnosis, and definitive-care steps remain governed by the existing sequence. Every required evidence item is resolved individually as value, present, absent, or not available with a rationale policy. Selecting a diagnosis must not be unlocked merely because the user wants fellowship credit. Fellowship and definitive-care administration stays in Review mode and never competes with active stabilization.

## 7. Canonical records and privacy

When activation-linked, ResusGPS reads the existing IERS activation and writes events to the same canonical case identity. It must not create a duplicate activation, patient identity, QR identity, or parallel QI case. New QI/adaptive-learning projections use activation ID, case key, role, timestamps, action categories, resource gap categories, and outcomes; they do not store patient identifiers.

The non-arrest route must use stable event IDs, idempotent replay, an offline outbox, server acknowledgement, and a visible sync state. The user must be able to export a safe handover while offline, with explicit distinction between local-only and server-confirmed records.

Exports that include patient identifiers require a deliberate warning and a de-identified handover option. Ending a case must clear or lock local state according to facility policy and must not leave patient information exposed on a shared device.

## 8. Content governance

Every high-risk recommendation must have a source, version, effective date, reviewer, age/context scope, indication, contraindication or exclusion, dose/route where relevant, capability assumption, local formulary status, escalation instruction, and deprecation status. Duplicate engines or old pathway registries may be retained for training or history, but only one source is active for each clinical action.

A clinical-owner review is mandatory for airway rescue, oxygen, fluids, vasoactive drugs, antibiotics, seizure medications, glucose treatment, toxicology, burns, trauma, neonatal content, adult content, and any action that can cause harm if applied outside its indication.

## 9. Product quality and release gate

A release is not pilot-ready until the following are demonstrated with synthetic/manikin scenarios and disposable tenants:

- Correct context and life-support pack selection for neonate, infant, child, adolescent, adult, trauma, and non-trauma cases.
- No silent progression past a blocking action or required reassessment.
- Explicit unavailable-resource, defer, escalate, and override records.
- Offline launch, refresh recovery, event replay, duplicate-safe acknowledgement, and clear sync status.
- One activation/case identity across IERS, ResusGPS, role report, debrief, and QI projection.
- Two-device activation/response/arrival workflow.
- Visual alert fallback when audio, haptics, browser permission, screen lock, or background execution is unavailable.
- No PHI exposure after deliberate case end or account switch on a shared device.
- Clinical-owner approval of high-risk content and local escalation/formulary configuration.
- Protected CI, production build, clinical lint, focused unit/component tests, and device-level evidence.

This contract is a design and release-control document. It is not a declaration of clinical validation, regulatory clearance, patient outcome benefit, or device integration.
