# ResusGPS TODO

## Nuclear Rebuild (Phase 126+) — COMPLETE
- [x] Replace fragmented multi-page system with single unified state machine
- [x] Build 8 clinical pathways (cardiac arrest, breathing, shock, seizure, metabolic/DKA, anaphylaxis, trauma, newborn)
- [x] Single ResusGPS page with START button and quick launch shortcuts
- [x] Patient demographics capture (age/weight)
- [x] PWA install button
- [x] 32 tests validating all clinical scenarios

## ABCDE Primary Survey Rebuild — COMPLETE
- [x] Build ABCDE Engine (abcdeEngine.ts) - clinical state machine with XABCDE flow
- [x] Primary Survey questions for all 6 letters (X, A, B, C, D, E)
- [x] Threat detection rules (18 threat types from findings)
- [x] Multi-threat management (accumulate and manage simultaneously)
- [x] Weight-based dose calculations on every intervention
- [x] Safety check rules (insulin without potassium, excessive boluses, bolus in hyperglycemia)
- [x] Diagnosis suggestion engine (DKA, Sepsis, Anaphylaxis, Meningitis, Status Epilepticus, Tension Pneumothorax)
- [x] Structured event logging (every finding, threat, intervention timestamped)
- [x] Event log export as text file
- [x] Build ResusGPS UI (renders all ABCDE engine states)
- [x] IDLE screen with patient info, trauma toggle, START button, cardiac arrest quick launch
- [x] Quick Assessment screen (PAT - Sick/Not Sick)
- [x] Primary Survey screen with ABCDE progress bar, letter-by-letter questions
- [x] Intervention screen with threat cards, dose cards, timer indicators
- [x] Secondary Survey screen with findings summary and diagnosis suggestions
- [x] Cardiac Arrest screen with CPR timer and intervention checklist
- [x] Definitive Care / Ongoing screen with event log and export
- [x] Audio alert system (critical, timer, safety)
- [x] Countdown timer system for time-critical interventions
- [x] Safety alert banner (insulin without potassium, etc.)
- [x] Active threats sidebar
- [x] 43 comprehensive tests passing (including full DKA scenario)
- [x] Update App.tsx routing for new system

## Future Features
- [ ] SAMPLE history input in Secondary Survey
- [ ] DKA definitive care protocol (insulin infusion, electrolyte monitoring)
- [ ] Sepsis bundle definitive care protocol
- [ ] Clinical notes generation from event log
- [ ] Post-resuscitation ML feedback
- [ ] Voice command integration
- [ ] Freemium credits model
- [ ] Payment integration (Stripe)

## Critical Fixes (User Feedback - Feb 10)
- [x] FIX: Clinical consistency — single source of truth for dosing (10ml/kg for ALL initial boluses)
- [x] FIX: Drug name always shown with dose (calcDose always prefixes drug name)
- [x] FIX: Remove "Pediatric Assessment Triangle" — Quick Assessment is universal for ALL ages
- [x] FIX: Objective vital signs input (actual numbers: HR, RR, SpO2, BP, Temp, Glucose with interpretation)
- [x] FIX: Mid-case patient info entry — updatePatientInfo() + Edit dialog accessible from top bar
- [x] BUILD: Intervention Tracking Side Panel (swipeable/collapsible)
  - [x] Tracks live intervention status (pending/in_progress/completed)
  - [x] Reassessment prompts after each intervention
  - [x] Reassess for complications (crackles, hepatomegaly, JVP, respiratory distress)
  - [x] Reassess for therapeutic endpoints (HR, CRT, mental status, urine output)
  - [x] Clinical recommendation based on reassessment (repeat bolus, stop + furosemide, start epi)
  - [x] Dose + rationale on every recommendation
  - [x] Thorough assessment guides shock type recognition (cold vs warm shock differentiation)

## Clinical Architecture Upgrade (Feb 11 - Kolb Cycle)
### Airway Restructure
- [x] Add CHOKING pathway to X/A assessment
- [x] Move AVPU to Airway (A) — AVPU ≤ P = airway at risk
- [x] Age-appropriate head positioning (neutral for infants, sniffing for older children/adults)
- [x] Airway adjuncts: OPA if AVPU @ U, NPA if AVPU @ P
- [x] Consider advanced airways (supraglottic/ETT) as escalation option

### Breathing Restructure
- [x] Move "Deep laboured breathing" from auscultation to inspection (next to RR)
- [x] Deep laboured breathing = compensatory sign of METABOLIC ACIDOSIS (not DKA-specific)
- [x] Remove DKA tunnel vision — present differential: DKA, sepsis with starvation ketones, lactic acidosis, renal failure, poisoning

### Circulation & Shock Escalation
- [x] Objective perfusion assessment: ask CRT (seconds), skin temp, pulse character separately — engine determines perfusion state (no anchoring bias from option ordering)
- [x] Balanced crystalloids (Ringer's Lactate) as default fluid, NS only for neonates
- [x] Rationale for RL: no hyperchloremic acidosis, lactate buffered to bicarb by liver, balanced electrolytes
- [x] Fluid tracker as first-class citizen: total mL/kg given, bolus count, running status
- [x] Shock escalation ladder (protocol, not suggestion):
  - [x] Epinephrine first (myocardial dysfunction, vasoplegia, universally available)
  - [x] Norepinephrine (persistent vasoplegia)
  - [x] Hydrocortisone (adrenal insufficiency)
  - [x] Check calcium levels
  - [x] Milrinone (catecholamine-refractory cold/reduced CO shock)
  - [x] Vasopressin (catecholamine-refractory warm/hyperdynamic shock)
- [x] Fluid-refractory shock auto-detection at ≥60mL/kg → trigger vasopressor ladder

### Intervention Lifecycle (System-Wide)
- [x] Intervention states: SUGGESTED → ONGOING (timer) → COMPLETED → REASSESS
- [x] Completed intervention triggers clinical decision point (not just "move on")
- [x] Reassessment outcomes: Problem Resolved / Problem Persists / New Problem / Escalate
- [x] Escalation examples:
  - [x] Shock: Resolved → stop / Still present → next bolus / Fluid overload → furosemide / Fluid-refractory → epi
  - [x] Airway: Patent → continue / Still obstructed → escalate (MgSO4, advanced airway)
  - [x] Seizure: Stopped → continue / Still convulsing → next dose diazepam 0.3mg/kg IV or 0.5mg/kg PR
- [x] Clear visual distinction: suggested vs ongoing vs completed interventions

### Anti-Tunnel-Vision (Differential Thinking)
- [x] Metabolic acidosis differentials (not just DKA): sepsis, starvation ketones, lactic acidosis, renal failure, poisoning
- [x] Stress hyperglycemia awareness (septic child with poor feeding can have ketones + high glucose)
- [x] Engine presents findings and differentials, not premature diagnoses
- [x] Lactate assessment option (added to D letter)
