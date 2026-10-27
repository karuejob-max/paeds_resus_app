# ACLS case definitions for clinical review

_Generated from `shared/adult-acls-case-definitions.ts` (engine 1.4.0). Do not edit by hand; run `npx tsx scripts/export-acls-case-review.ts`._

Basis: 2025 AHA Guidelines for CPR and ECC. Every row is enforced by the scorer and a generated test harness.

## VF / pulseless VT (`vf-pulseless-vt`, shockable_arrest)

A pulseless, unresponsive shockable arrest.

**Guideline basis**
- Part 9 Adult ALS 2025: defibrillation and high-quality CPR are the highest-value actions in VF/pVT.
- 2025: in shockable rhythms, epinephrine 1 mg is reasonable after initial defibrillation attempts fail (COR 2a).
- 2025: amiodarone or lidocaine may be considered for refractory VF/pVT (COR 2b).

**Required (all)**: cpr, defibrillation; rhythm assessed before treatment; post-ROSC care (oxygen, ventilation, perfusion support, reassessment; SpO2 >= 90 and SBP >= 90)

**Poor choices (score capped below pass, not critical)**
- In a shockable rhythm, 2025 AHA guidance is to defibrillate first and give epinephrine after initial shocks fail.

**Reference honest path**: assess(rhythm) -> start_cpr -> defibrillate -> support_perfusion -> give_oxygen x6 -> assist_ventilation x5 -> reassess -> end_rehearsal

**Must not pass**
- epinephrine before any shock: assess(rhythm) -> start_cpr -> give_epinephrine -> defibrillate -> support_perfusion -> give_oxygen x6 -> assist_ventilation x5 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## PEA (`pea`, non_shockable_arrest)

Organised electrical activity without effective circulation.

**Guideline basis**
- 2025: in non-shockable rhythms, give epinephrine as soon as feasible (COR 2a); 1 mg every 3 to 5 min.
- Identify and treat reversible causes; routine calcium is not recommended (2025).

**Required (all)**: cpr, medication, cause_assessment, cause_treatment; rhythm assessed before treatment; post-ROSC care (oxygen, ventilation, perfusion support, reassessment; SpO2 >= 90 and SBP >= 90)

**Reference honest path**: assess(rhythm) -> start_cpr -> assess(airway_history) -> give_epinephrine -> treat_reversible_cause(hypovolaemia) -> reassess -> support_perfusion -> give_oxygen x6 -> assist_ventilation x5 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## Asystole (`asystole`, non_shockable_arrest)

True non-shockable arrest requiring continued resuscitation and cause management.

**Guideline basis**
- 2025: epinephrine as soon as feasible in non-shockable rhythms; treat reversible causes; defibrillation is not indicated.

**Required (all)**: cpr, medication, cause_assessment, cause_treatment; rhythm assessed before treatment; post-ROSC care (oxygen, ventilation, perfusion support, reassessment; SpO2 >= 90 and SBP >= 90)

**Reference honest path**: assess(rhythm) -> start_cpr -> assess(airway_history) -> give_epinephrine -> treat_reversible_cause(prolonged_hypoxia) -> reassess -> support_perfusion -> give_oxygen x6 -> assist_ventilation x5 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## Reversible-cause arrest (`reversible-cause-arrest`, non_shockable_arrest)

Arrest with evidence that must guide cause-specific treatment.

**Guideline basis**
- 2025: identify and treat reversible causes during arrest; epinephrine as soon as feasible in non-shockable rhythms.

**Required (all)**: cpr, medication, cause_assessment, cause_treatment; rhythm assessed before treatment; post-ROSC care (oxygen, ventilation, perfusion support, reassessment; SpO2 >= 90 and SBP >= 90)

**Reference honest path**: assess(rhythm) -> start_cpr -> assess(breath_sounds) -> give_epinephrine -> treat_reversible_cause(tension_pneumothorax) -> reassess -> support_perfusion -> give_oxygen x6 -> assist_ventilation x5 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## Unstable sinus bradycardia (`unstable-bradycardia`, bradycardia)

A slow sinus rhythm with hypotension and altered mental status; atropine is first-line before pacing escalation.

**Guideline basis**
- 2025 Adult Bradycardia With a Pulse: atropine is first-line, 1 mg IV bolus, repeat every 3 to 5 min, maximum 3 mg.
- If atropine is ineffective: transcutaneous pacing and/or dopamine (5-20 mcg/kg/min) or epinephrine (2-10 mcg/min) infusion.

**Required (all)**: medication ("bradycardia response"); rhythm assessed before treatment

**Reference honest path**: assess(rhythm) -> give_atropine -> reassess -> end_rehearsal

**Must not pass**
- pacing first, skipping atropine: assess(rhythm) -> pace -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## High-grade AV block (`high-grade-av-block`, bradycardia)

Mobitz II / complete heart block with instability; pacing or an infusion is the escalation. Atropine is ineffective but not a critical failure.

**Guideline basis**
- 2025: atropine is first-line for symptomatic bradycardia, but it is unlikely to work in Mobitz II / third-degree (infranodal) block.
- Transcutaneous pacing, or dopamine/epinephrine infusion, is the escalation; do not delay pacing to give atropine.

**Required (all)**: pacing; rhythm assessed before treatment

**Poor choices (score capped below pass, not critical)**
- Atropine is unlikely to work in high-grade AV block and risks delaying pacing.

**Reference honest path**: assess(rhythm) -> pace -> reassess -> end_rehearsal

**Must not pass**
- atropine first, then pacing: assess(rhythm) -> give_atropine -> pace -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## Stable narrow-complex tachycardia (`stable-narrow-tachycardia`, tachycardia)

A regular narrow-complex tachycardia with currently adequate perfusion.

**Guideline basis**
- 2025 Adult Tachyarrhythmia With a Pulse: stable regular narrow-complex tachycardia: vagal maneuvers, then adenosine 6 mg rapid IV push (12 mg if required).

**Required (all)**: medication ("adenosine"); rhythm assessed before treatment

**Reference honest path**: assess(rhythm) -> give_adenosine -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## Unstable tachycardia (`unstable-tachycardia`, tachycardia)

A rapid rhythm with falling pressure and altered consciousness.

**Guideline basis**
- 2025: tachyarrhythmia causing hypotension, altered mental status, shock or ischaemic chest discomfort: synchronized cardioversion (device-specific energy; maximum if unknown).

**Required (all)**: synchronization, cardioversion; rhythm assessed before treatment

**Reference honest path**: assess(rhythm) -> prepare_synchronized_cardioversion -> synchronized_cardioversion -> give_oxygen x2 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## ACS to VF arrest (`acs-to-vf`, acs)

Chest discomfort progresses through ischaemia to ventricular arrest.

**Guideline basis**
- ACS pathway: 12-lead ECG, aspirin, and early reperfusion activation; untreated ischaemia can progress to VF arrest.

**Required (all)**: assessment, ecg, acs_medication, reperfusion, reassessment

**Conditional**: if `acs_escalation` occurs then cpr, defibrillation

**Reference honest path**: assess(pulse) -> obtain_ecg -> give_aspirin -> activate_reperfusion -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## Hypoxia to arrest (`hypoxia-to-arrest`, respiratory)

Respiratory failure progresses to bradycardia and arrest when untreated.

**Guideline basis**
- Respiratory failure: oxygenate and ventilate early; untreated hypoxia progresses to bradycardia and arrest.

**Required (all)**: oxygen, ventilation, assessment, reassessment

**Reference honest path**: assess(breathing) -> give_oxygen x8 -> assist_ventilation x8 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

## ROSC and post-arrest deterioration (`rosc-post-arrest`, post_arrest)

Pulse returns, but ventilation and perfusion remain unstable.

**Guideline basis**
- 2025 Post-Cardiac Arrest Care: support oxygenation, ventilation and perfusion; reassess; avoid hypotension and hypoxaemia.

**Required (all)**: assessment; post-ROSC care (oxygen, ventilation, perfusion support, reassessment; SpO2 >= 90 and SBP >= 90)

**Reference honest path**: assess(blood_pressure) -> support_perfusion -> give_oxygen x5 -> assist_ventilation x3 -> reassess -> end_rehearsal

**Clinical owner decision**: [ ] approved  [ ] changes requested

---

