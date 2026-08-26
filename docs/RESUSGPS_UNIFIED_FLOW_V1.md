# ResusGPS Unified Emergency Flow v1

**Status:** Implemented on an isolated feature branch; local validation complete; protected release pending.

**Purpose:** Define one coherent ResusGPS pathway from IERS activation to bedside assessment, cardiac-arrest care, post-ROSC care, role reporting, debrief, and optional fellowship learning. This document is the implementation and handoff contract for developers, clinical reviewers, institutional implementers, and future agents.

## 1. Product decision

ResusGPS is one emergency workflow, not a collection of competing clinical screens. A provider may enter from the individual platform, an IERS activation deep link, or the ordinary ResusGPS route, but the bedside path is the same after case context is loaded:

> Confirm the patient’s age and weight, perform the BLS gate, branch to CPR-GPS when cardiac arrest is suspected, otherwise begin XABCDE, complete the secondary survey, close the loop with role reporting and debrief, and offer definitive care only when fellowship or local clinical governance requires it.

The software is clinical decision support for trained providers operating under local policy and senior review. It is not a substitute for certification, a defibrillator manufacturer’s instructions, a facility protocol, or a clinician’s judgment.

| Stage | Provider action | System behavior | Completion signal |
|---|---|---|---|
| ERT activation | Activate from IERS or open a case | Carries location, resources, team and case context without patient identifiers | Activation context loaded |
| Case setup | Confirm age and actual weight | Rejects impossible weights; does not fabricate a dose weight; stores unknown weight as `null` | Verified demographics |
| BLS gate | Check responsiveness, breathing and pulse | Uses age-appropriate pulse-site cue and fail-safe arrest decision | `cardiac_arrest` or `no_cardiac_arrest` |
| Arrest branch | Start CPR-GPS | Opens the integrated CPR surface; parent ResusGPS owns demographics and ROSC | CPR-GPS active |
| Non-arrest branch | Start immediate-threat assessment | Begins universal XABCDE, with hemorrhage before airway | X → A → B → C → D → E |
| Recovery | Confirm ROSC or complete primary/secondary survey | Opens post-cardiac-arrest checklist or secondary-survey workflow | Recovery/diagnosis state |
| Close the loop | Submit role report; authorized lead records debrief | Reuses IERS targeted-report and activation closure contracts | Case and readiness evidence |
| Learning | Choose definitive care when eligible | Keeps fellowship work separate from immediate emergency actions | Optional fellowship record |

## 2. Age and clinical-setting routing

Age is necessary but is not always sufficient to select a resuscitation curriculum. The 2025 AHA CPR and ECC algorithm index publishes separate neonatal, paediatric, adult BLS, foreign-body airway obstruction, paediatric cardiac-arrest, adult cardiac-arrest, and post-cardiac-arrest algorithms.[1] NRP is specifically a delivery-room/newborn context; a newborn in a ward or prehospital setting must not be labelled NRP solely because the patient is young.[2]

ResusGPS therefore uses the following routing contract:

| Patient/context | CPR-GPS/NRP route | Safety rule |
|---|---|---|
| Delivery-room or newborn-at-birth context | Embedded NRP branch | The provider must explicitly select delivery-room context. NRP is never inferred from age alone. |
| Infant or child outside delivery-room context | PALS paediatric arrest branch | Weight-based calculations require verified weight. |
| Adolescent/adult context according to the configured age boundary | ACLS adult arrest branch | Defibrillator energy follows the device manufacturer’s adult biphasic setting/range; the software must not display paediatric joules. |
| Uncertain age or setting | Immediate assessment remains available; dose-bearing content stays gated | The provider must clarify the context before calculated medication or energy guidance. |

The age parser now handles days, weeks, months, and years as distinct units. A one-month-old is classified as an infant; a one-day-old is classified as neonatal. This prevents substring or whole-number parsing from moving a newborn into an adult or child vital-sign band.

## 3. BLS gate

The first clinical screen is now explicit. It asks three questions: responsiveness, normal breathing, and pulse. Gasping is not normal breathing. Pulse assessment is limited to ten seconds and presents a practical age-specific site cue: brachial for neonates/infants, carotid or femoral for children, and carotid for adolescents/adults.

A confirmed absent pulse selects cardiac arrest even if another observation conflicts. An unresponsive patient with abnormal or absent breathing and an unknown pulse also selects the arrest branch. The gate does not permit incomplete observations to silently enter either pathway.

## 4. CPR-GPS design

The integrated arrest screen has one primary action surface. The current arrest state is prominent, the cycle timer remains visible, and secondary controls are grouped behind a labelled Tools menu. Voice, metronome, team, QR, arrest summary, Hs and Ts, and advanced-airway actions remain available but do not compete with the current arrest action on a phone-sized display.

The CPR surface requires a deliberate second tap to confirm ROSC. The confirmation asks the operator to verify a sustained pulse and signs of circulation, then stops the arrest timer and returns control to the parent ResusGPS post-cardiac-arrest pathway. This avoids an accidental ROSC transition while preserving a rapid recovery action.

| CPR pack | Medication behavior | Defibrillation display | Implementation boundary |
|---|---|---|---|
| PALS | Weight-based epinephrine and antiarrhythmic calculations | Weight-based paediatric joules | Verified weight required |
| ACLS | Adult fixed-dose epinephrine and adult antiarrhythmic wording | Adult biphasic device-selected range | Follow the actual defibrillator and local ACLS protocol |
| NRP | Not routed through the generic CPR clock | Uses the embedded delivery-room NRP component | NRP context must be explicit |

The generic CPR clock must not be treated as a complete neonatal delivery-room algorithm. The NRP component is embedded inside the ResusGPS case surface, with the confirmed birth weight passed into the branch and a return control to the parent flow. Its clinical content requires a separate governed review against the institution’s adopted NRP edition before clinical sign-off.

## 5. XABCDE and choking guidance

Every non-arrest case begins with X for exsanguinating hemorrhage, followed by A, B, C, D and E. The visible progress indicator matches the engine order. The airway screen displays the age-aware foreign-body airway obstruction cue before the provider chooses an obstruction response:

| Age group | Initial cue shown |
|---|---|
| Infant, including one month | Five back blows followed by five chest thrusts |
| Child/adult | Five back blows followed by five abdominal thrusts |

The airway cue is a concise first-action reminder, not a replacement for the complete governed algorithm or local training. If the patient becomes unresponsive, the screen directs the provider to the arrest pathway and the appropriate CPR algorithm.

## 6. Patient safety and 3am behavior

The first thirty seconds must not depend on a network call, a prior patient, or a remembered weight. ResusGPS now clears prior-patient demographics when a new case is started, rejects impossible weights at the shared engine boundary, and prevents definitive-care or condition-protocol builders from silently using a fabricated 10 kg value. Missing weight is represented as unknown rather than as zero.

The practical 3am test is not just whether the application builds. It asks whether a tired provider can identify the next correct action, whether a wrong patient cannot inherit the previous patient’s weight, whether an adult cannot receive paediatric joules, whether a newborn is not silently treated as an NRP case, and whether a CPR timer or high-risk action can be accidentally hidden or triggered.

| 3am question | Current position |
|---|---|
| Can the provider start immediate assessment? | Yes, after age and weight are confirmed at case setup; BLS does not wait for a perfect history. |
| Can incomplete BLS observations branch silently? | No; all three observations are required. |
| Can absent pulse be sent to routine XABCDE? | No; absent pulse is fail-safe arrest. |
| Can missing/invalid weight produce calculated dose content? | No; shared guards fail closed. |
| Can a new case inherit old demographics? | No; New case clears prior patient demographics. |
| Can an adult receive paediatric joules from the integrated CPR clock? | The integrated ACLS branch uses an adult device-selected range; physical device behavior still requires phone/defibrillator simulation. |
| Can a ROSC tap be accidental? | A confirmation step is required. |
| Can the operator reach IERS reporting and debrief? | Yes, when activation context is present; the handoff reuses existing IERS contracts. |

## 7. Secondary survey, reporting, debrief and learning

After primary survey completion, ResusGPS presents the structured secondary survey in the existing SAMPLE → diagnostic evidence → diagnosis order. Vitals are shown with age-specific context. Abnormal values receive a clear text label and stronger contrast rather than relying only on a subtle border.

After the diagnostic process is unlocked, the activation-aware close-the-loop card directs the assigned provider to the existing IERS role-specific report. The authorized ERTL, UTL, ERCo coordinator, or institution administrator records the activation debrief and closes or calls off the IERS event. ResusGPS does not create a duplicate report store and does not place patient identifiers in IERS notification or report prompts.

Fellowship definitive care remains optional and is offered after the immediate emergency path. Its purpose is structured learning, not to delay ABCDE, CPR, ROSC care, or escalation. Case-scoped analytics now link Care Signal post-event activity to the exact ResusGPS clinical session rather than to a tab-wide browser identifier.

| Signal | Individual level | Institutional/adaptive-learning use |
|---|---|---|
| BLS branch and arrest status | Shows pathway taken | Measures arrest recognition and pathway demand |
| Intervention and reassessment events | Builds the clinical timeline | Identifies delayed, incomplete, or repeatedly missed actions |
| Abnormal vital signs | Gives age-specific bedside interpretation | Supports recurring physiology and equipment needs |
| Resource unavailable/alternative used | Documents what was missing | Feeds IERS resource-gap and readiness action planning |
| CPR cycle, rhythm, shock and medication events | Provides a structured arrest record | Supports CPR competency and timer reliability review |
| IERS role report, arrival and debrief | Links staff to the activation | Supports team response and institutional learning |
| Fellowship completion | Offers optional credit pathway | Separates learning completion from emergency-care completion |

The remaining adaptive-learning product requirement is an institution-facing improvement loop: recurring signal → named action owner → corrective evidence → recheck → readiness trend. The underlying signals are now case-scoped and available, but the roll-up and action-management experience needs continued product work.

## 8. Mobile and desktop usability contract

The mobile layout prioritizes one action per row, minimum touch targets, readable text, and a persistent current-action area. CPR secondary controls are collapsed. Primary-survey vital inputs display units, age context, and abnormal labels. The active ResusGPS header is horizontally scrollable instead of allowing controls to overlap or disappear.

Desktop users receive wider cards and side panels, but the clinical order must not differ from mobile. Responsive styling may change density; it must not change sequence, dose, threshold, required fields, or terminal-state behavior.

## 9. What still needs human validation

The implementation is code- and CI-validated, not clinically signed off. Before production clinical use, the organization must run a labelled non-production simulation on at least two phones and one desktop browser. The test should include a one-month infant choking case, an adult arrest case, a neonatal delivery-room case, a non-arrest XABCDE case, and an IERS activation deep link.

The simulation must measure time to first correct action, time to verified age and weight, clarity of abnormal vitals, CPR timer visibility, rhythm/shock sequence, ROSC confirmation, post-ROSC checklist completion, resource-gap capture, targeted role reporting, debrief handoff, offline/reconnect behavior, browser notification/audio permissions, QR scanning, and new-case demographic reset. A clinical governance reviewer must approve the exact local guideline versions, concentrations, equipment assumptions, and adult/neonatal scope.

## 10. Collision-safe delivery protocol

This work is isolated from other Manus agents by branch and review boundary. Future work must begin with a fresh fetch of `origin/main`, a clean worktree check, and a new feature branch named for one bounded outcome. Agents must not edit another agent’s branch, reset shared files, or use a formatter that creates line-ending churn across unrelated files.

Before merge, the agent must list touched files, compare each touched file against current `origin/main`, run focused tests, run the relevant full gate, perform a fresh-main collision check, and open a protected PR. A PR must not be merged while required CI is queued, absent, or failed. Documentation should be committed separately when the repository workflow requires it. Production deployment and clinical simulation must remain separate decisions.

## References

[1]: https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/algorithms "American Heart Association — 2025 CPR & ECC Algorithm Index"

[2]: https://www.aap.org/en/pedialink/neonatal-resuscitation-program/neonatal-resuscitation-guidelines/ "American Academy of Pediatrics — Neonatal Resuscitation Guidelines"
