# CPR-GPS Competitor Benchmark and Redesign Requirements

**Date:** 26 August 2026
**Author:** Manus AI
**Product:** ResusGPS / CPR-GPS
**Status:** Research and implementation brief; clinical content remains subject to source-owner approval and local governance.

## Executive conclusion

The current CPR-GPS is losing the bedside decision because it behaves primarily like a clock. A clinician may reasonably choose another tool when that tool provides a clearer current action, an official guideline identity, physical compression feedback, defibrillator integration, better dose preparation support, stronger offline behavior, or a cleaner documentation/debrief workflow.

The correct response is not to add more buttons to the existing screen. CPR-GPS should become a **bedside arrest command console**: one low-input, offline-first, age/context-aware cognitive aid that keeps the team oriented to the next critical action, timestamps what happened, clearly shows what the software cannot measure, and connects the arrest to IERS roles, resources, reporting, and adaptive learning. It must complement—not replace—a trained team, defibrillator, compression feedback sensor, clinical judgment, or local policy.

## What other technologies do better

| Technology category | What users value | Why a user could choose it instead of current CPR-GPS | What CPR-GPS should borrow | What CPR-GPS should not copy blindly |
|---|---|---|---|---|
| Sensor-enabled manikins and compression-feedback devices | Rate, depth, recoil/release, hand position, leaning, and objective debrief data | The user can see whether compressions are mechanically adequate; a clock cannot measure this | Clear measurement state, pediatric mode, signal-quality indication, objective post-event review | Do not imply that a phone measures depth, recoil, perfusion, or rhythm without validated hardware |
| AED/defibrillator-integrated systems | Prompts beside ECG, shock controls, compression feedback, and event records | The clinician does not have to look away from the monitor or manually reconcile two clocks | Device-agnostic event timeline, visible rhythm/shock state, pre-charge reminder, export interface | Do not make the app dependent on one vendor, proprietary electrode, network, or unvalidated sensor |
| Official AHA/PALS/NRP references | Trust, recognizable source, explicit algorithms, guideline updates, and offline access | The clinician knows what authority the tool represents and may distrust an unfamiliar generic app | Visible source/version/effective date, explicit pack/context gate, offline content bundle | Do not claim endorsement or current compliance until Paeds Resus content is reviewed and versioned |
| Interactive pediatric cognitive aids | Current-step highlighting, color-coded stages, illustrations, countdown timers, and action logging | The user can follow the sequence with fewer omissions and less memory burden | One current-action card, current-step highlight, next-action preview, large action buttons, automatic timestamps | Do not create a long branching questionnaire that delays compressions or shock preparation |
| Medication calculators and pediatric CDSS | Dose, concentration, route, volume, maximum dose, and equipment sizing | The user gets an actionable preparation value instead of a bare mg/kg formula | Verified weight, dose basis, final unit/volume, concentration context, read-back/second-check, offline calculation | Do not silently default weight, concentration, route, or adult-versus-pediatric pathway |
| Team performance/debrief systems | Structured record, no-flow time, pauses, shocks, drugs, airway, role review, and action plans | The user gets useful learning and QI evidence after the event | One-tap event capture, append-only correction history, structured debrief handoff, role-linked reports | Do not let documentation compete with hands-on care or create punitive individual rankings |
| Dispatch/AED-location tools | Immediate responder alerting and AED location | The user gets a team and equipment response layer rather than only a clinical algorithm | IERS activation link, resource claim/arrival, QR case-linking, response acknowledgement | Do not imply that notification guarantees a responder, AED, connectivity, or patient outcome |
| Official offline algorithm apps | Core algorithm remains available without network | The user can start care in a poor-connectivity hospital | Local-first clinical state machine, cached content, sync status, paper fallback | Do not treat offline caching as evidence that content is current or clinically validated |

The evidence supports these observations without proving that a particular commercial product improves survival. A systematic review found improved CPR performance in most training/simulation studies of feedback devices, but real-life evidence was limited and further research was needed [1]. A randomized pediatric simulation study found that an interactive tablet cognitive aid was associated with faster first defibrillation, better tested algorithm adherence, better rhythm recognition, and fewer shock/dose errors than pocket cards; this remains simulation evidence rather than proof of patient-outcome benefit [2]. An in-hospital CPR-app requirements study highlighted rhythm reminders, drug reminders, clear adult-versus-child differentiation, automatic timing, a metronome, patient-journal access, and exportable history [3].

## Why clinicians would abandon CPR-GPS

A clinician will choose another platform when the alternative is more trustworthy, faster, clearer, or better integrated at the moment of arrest. The highest-risk abandonment triggers are:

1. **The first screen is a clock rather than a next action.** If the user must interpret several tiles, menus, timers, or overlays before starting compressions, the application creates helpful delay.
2. **The tool is not visibly authoritative.** If the user cannot see the guideline family, version, effective date, or scope, a familiar AHA/PALS/NRP reference will feel safer.
3. **The screen is too dense during the arrest.** Secondary tools, team controls, reversible causes, documentation, voice, QR, and summary compete with the current clinical action.
4. **The user cannot tell what is measured and what is assumed.** A timer must not look like a compression-quality monitor. An app must clearly state when no sensor, rhythm feed, ETCO₂, or defibrillator data are available.
5. **Wrong age/context routing is possible.** Newborn at birth, hospitalized neonate/infant, child, adolescent, and adult pathways must not be inferred from a vague age label. A familiar adult app may appear safer if CPR-GPS makes the pathway ambiguous.
6. **Medication output is incomplete or too easy to misuse.** Users need the verified weight, dose basis, concentration, route, final volume, maximum, and independent-check prompt—not only a number.
7. **The application depends on network, login, or battery-heavy interfaces.** In a county or subcounty hospital, a static algorithm card or offline app will win if CPR-GPS cannot open quickly.
8. **The event record is burdensome.** If the recorder must type instead of tapping a small number of high-value events, teams will use paper or a dedicated code recorder.
9. **The app does not fit team reality.** A team leader, compressor, airway clinician, medication clinician, and recorder need different information. One overloaded screen can be worse than no app.
10. **There is no safe fallback.** If the app fails, the team must know to use the defibrillator, printed algorithm, local protocol, and clinical judgment. A blank or frozen interface destroys trust.
11. **The product claims more than it can prove.** Claims of ACLS/PALS/NRP coverage, compression quality, or improved outcomes will be rejected if the actual content, source ownership, device integration, or validation is unclear.

## CPR-GPS redesign: the bedside arrest console

### Design principle

> **The team should never have to ask the screen what matters now. The screen should show one current action, one upcoming critical action, and the minimum evidence needed to act safely.**

CPR-GPS v2 should use a deterministic state machine with a single primary action surface. The clock is a supporting element, not the product identity.

### Core state flow

| State | Primary screen obligation | Required user input | Safe exit |
|---|---|---|---|
| Arrest declared | Start compressions and attach pads | One confirmation that arrest is being managed | Compression cycle begins immediately |
| Initial rhythm preparation | Continue compressions while pads are attached | Pads attached | Rhythm check window |
| Rhythm check | Identify shockable/non-shockable rhythm and preserve the <10-second interruption | Rhythm category and shock/no-shock action | Shock preparation or compressions |
| Shock preparation | Show device-setting context, clear-patient warning, and shock action | Device/team confirmation | Shock delivered or disarm |
| Compressions | Keep the next cycle visible, show compression timer, and prompt pre-charge before the cycle ends | One-tap event completion only when useful | Reassessment window |
| Reassessment | Show a bounded rhythm/pulse/ROSC decision window | Rhythm and action | Next cycle, shock path, or confirmed ROSC |
| Medication/reversible causes | Show only due or clinically relevant actions; place secondary details behind tools | Dose/route/confirmation where applicable | Return to compressions |
| ROSC confirmation | Require deliberate confirmation of sustained circulation | Two-step ROSC confirmation | Parent post-cardiac-arrest care |
| Post-cardiac-arrest care | Keep recovery checklist in the same case | Structured completion | Secondary survey/report/debrief |
| Termination/call-off | Preserve audit and require reason | Authorized operator + reason | Terminal case state |

### Information hierarchy

The screen should display the following in order:

1. **Current action:** large text, high contrast, one sentence, one primary control.
2. **Critical countdown:** CPR cycle or rhythm-window timer, not a collection of competing timers.
3. **Next critical action:** for example, “Continue compressions; rhythm check in 01:12” or “Prepare to charge before the cycle ends.”
4. **Context strip:** patient age band, verified weight, clinical setting, selected pathway, and visible guideline version.
5. **Two compact counters:** cycle number and shocks/epinephrine as appropriate.
6. **Tools drawer:** reversible causes, advanced airway, team, QR, event summary, and optional voice controls.
7. **Event log:** available to the recorder without taking over the team-leader view.

The integrated arrest view should not expose a solo/team mode switch, disconnected patient editor, or full event history in the first glance. These remain available as deliberate tools or post-event review.

### Device and sensor honesty

CPR-GPS should use explicit telemetry states:

- **Software timing only:** rate/depth/recoil/rhythm/ETCO₂ are not being measured by the app.
- **External sensor connected:** display the sensor identity, patient-size mode, signal quality, last update, and limitations.
- **Defibrillator feed connected:** display the source device, connection state, event timestamps, and whether the value is advisory or device-generated.
- **Signal unavailable or uncertain:** show a visible warning and return to the governed algorithm and clinical assessment.

This creates a future integration path for ZOLL/Philips/Laerdal or local devices without making current software-only users believe that CPR-GPS is a compression sensor.

## Age and guideline routing

The clinical context gate must be explicit and persistent. Age alone is insufficient for NRP selection.

| Context | CPR-GPS treatment | Release rule |
|---|---|---|
| Newborn at birth / delivery-room resuscitation | Embedded NRP pathway | Requires explicit delivery-room selection and NRP-governed content |
| Hospitalized neonate or infant | Paediatric arrest pathway unless local governance specifies otherwise | Must not silently route to delivery-room NRP |
| Child/adolescent under 18 | PALS pathway | Use age/weight validation and paediatric-specific targets |
| Adult | ACLS pathway only when adult content is separately governed and released | Do not advertise adult support based on labels or partial calculations |

AHA/AAP 2025 PALS guidance covers infants and children up to 18 years excluding newborn infants, and includes prearrest, intra-arrest, and post-cardiac-arrest care [4]. AHA/AAP 2025 neonatal guidance is a distinct pathway covering initial steps, heart-rate assessment, ventilation/CPAP, oxygen, compressions, vascular access, epinephrine, volume expansion, and post-resuscitation care [5]. CPR-GPS must preserve this distinction visibly.

## Team and IERS integration

The competitive advantage is not a prettier timer. It is the combination of bedside cognitive support and institutional response learning.

### During the event

- IERS activation opens the exact ResusGPS case with location, optional bed, needed resources, responder acknowledgement, and resource claim/arrival state.
- The CPR-GPS console displays only role-relevant context: team role, current action, patient age band, verified weight, and active case identifier.
- The team leader can see team status without managing every team member.
- The recorder receives one-tap high-value event capture and can correct entries through an auditable history.
- Resource shortages are captured as **recommended, available, unavailable, or unknown** without blocking care.
- QR/witnessed-arrival events remain tied to the immutable activation event and must not be replaced by a second CPR case identity.

### After the event

- ROSC leads directly to the parent-owned post-cardiac-arrest checklist.
- Role-specific ERT reports and the institutional debrief are offered before optional fellowship definitive care.
- Care Signal and ResusGPS events use the exact clinical case identifier.
- The normalized learning record should support the loop: **observed gap → institutional action → evidence → recheck → readiness trend**.
- Adaptive-learning outputs must be aggregate and improvement-oriented. The system should not rank or punish individual clinicians from incomplete emergency records.

## Low-resource and 3am requirements

| Requirement | Acceptance test |
|---|---|
| Fast start | From an already authenticated provider session, the arrest console reaches the first current action with no network-dependent clinical content fetch |
| Offline core | Algorithm, timers, age/context pack, and local event log remain usable without connectivity; sync status is visible |
| No stale patient data | New case clears age/weight/context and requires deliberate reconfirmation |
| Glove-friendly | Primary actions are large, high-contrast, separated, and usable with one hand; no drag gestures for critical actions |
| No scroll for arrest action | Current action, countdown, next action, and primary controls fit the first viewport on a common phone |
| Audio safety | Audio begins only after a user gesture/permission; silence is visible and does not hide visual prompts |
| Failure recovery | Refresh/reopen does not erase the local event log; a paper/defibrillator fallback is clearly stated |
| Input safety | Weight, units, age band, concentration, dose, and route are visible before any calculation is accepted |
| Time integrity | Timers use a monotonic local clock where possible; event timestamps record source and sync state |
| Team handoff | A second authorized team member can understand current state without replaying the whole event log |
| Documentation discipline | One-tap events dominate; free text is deferred until post-event review |
| Clinical honesty | The UI never represents software timing as measured compression quality or an app recommendation as autonomous diagnosis |

## Build priorities

### P0: replace the chaotic arrest surface

Implement the current-action console, single primary control, bounded rhythm/shock windows, CPR-cycle countdown, next-action preview, high-contrast mobile layout, deliberate ROSC confirmation, and clear software-only telemetry state.

### P0: protect age/context and medication calculation

Keep NRP explicit for delivery-room newborns, PALS explicit for paediatric arrests, and adult ACLS behind governed content release. Show verified weight, dose basis, concentration, route, maximum, and second-check context. Never silently default weight or concentration.

### P1: improve team documentation

Add recorder mode, one-tap high-value events, append-only correction history, synchronized timestamps, offline queue status, and structured post-event export. Keep the team leader view minimal.

### P1: connect to IERS and adaptive learning

Complete role-aware CPR views, resource-gap capture, activation-linked case identity, targeted ERT reporting, debrief actions, and aggregate readiness feedback.

### P2: device integration

Define a normalized adapter boundary for CPR sensors and defibrillator feeds. Pilot only with supported hardware, explicit patient-size modes, signal-quality states, and a raw-data export. Do not make this a release blocker for software-only use.

### P2: hands-free and accessibility

Add carefully bounded voice commands, large-button accessibility, language support, hearing-safe visual equivalents, and haptic cues. Voice must never be the only path for a critical action.

## Measures of success

The first evaluation should use labelled in-situ simulation, not live clinical events. Track time to first compression, time to first rhythm assessment, time to first shock where indicated, dose/route/weight errors, no-flow time, interruptions, correct age/context selection, ROSC transition accuracy, resource-gap capture, event-log completeness, perceived workload, and failure recovery. Compare CPR-GPS against the locally approved paper/AHA algorithm and the current CPR-GPS version.

Do not claim improved survival or universal guideline compliance until prospective, independently governed evaluation supports those claims. The immediate product claim should be narrower and defensible: **CPR-GPS helps a trained team stay oriented to the next governed resuscitation action, records what happened, and connects the arrest to institutional learning.**

## References

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8244494/ "Gugelmin-Almeida et al., Real-time feedback devices and CPR performance systematic review"
[2]: https://www.jmir.org/2020/5/e17792/ "Siebert et al., Guiding Pad interactive pediatric CPR cognitive aid randomized simulation trial"
[3]: https://mhealth.jmir.org/2021/1/e16114/ "Müller et al., User requirements for an in-hospital CPR app"
[4]: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001368 "AHA/AAP 2025 Pediatric Advanced Life Support guideline"
[5]: https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/neonatal-resuscitation "AHA/AAP 2025 Neonatal Resuscitation guidance"
[6]: https://www.zoll.com/en-us/about/medical-technology/real-cpr-help "ZOLL Real CPR Help product information"
[7]: https://laerdal.com/us/products/simulation-training/resuscitation-training/little-baby-qcpr/ "Laerdal Little Baby QCPR product information"
[8]: https://www.resus.org.uk/professional-library/iresus "Resuscitation Council UK iResus offline algorithm reference"
[9]: https://cpr.heart.org/en/resources/cpr-first-aid-apps-portal "American Heart Association CPR and first-aid apps portal"
