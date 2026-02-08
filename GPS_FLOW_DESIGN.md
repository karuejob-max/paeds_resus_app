# ResusGPS - True GPS Flow Design

## Philosophy
**One patient, one moment, one best next step.**

Provider should reach life-saving intervention within 30 seconds, not 5 minutes.

## Current Problem
- 25 questions in textbook order (ABCDE physical exam)
- Takes 5+ minutes to reach critical intervention
- Provider overwhelmed with details during emergency
- Can only save dead people

## New GPS Flow

### Phase 1: CRITICAL TRIAGE (Questions 1-3, <30 seconds)

**Q1: "Is the patient breathing?"**
- YES → Continue
- NO → **IMMEDIATE ACTION: Start CPR** (show CPR card, activate CPR clock)

**Q2: "Can you feel a pulse?"**
- YES → Continue  
- NO → **IMMEDIATE ACTION: Start CPR** (show CPR card, activate CPR clock)

**Q3: "Are they responsive to voice or pain?"**
- Alert/responds → Continue to Q4
- Unresponsive → **IMMEDIATE ACTION: Secure airway + BVM ventilation**

### Phase 2: PRIMARY PROBLEM (Question 4, identify main issue)

**Q4: "What is the MAIN problem?"**
Options:
1. **Breathing difficulty** → Respiratory pathway
2. **Shock/poor perfusion** → Circulation pathway  
3. **Seizure/altered mental status** → Neuro pathway
4. **Severe bleeding/trauma** → Trauma pathway
5. **Poisoning/overdose** → Toxicology pathway
6. **Allergic reaction** → Anaphylaxis pathway

### Phase 3: PATHWAY-SPECIFIC TRIAGE (2-3 questions max)

Each pathway has 2-3 targeted questions to identify the specific emergency:

#### BREATHING PATHWAY
Q5: "What breathing signs?" (multi-select)
- Wheezing → Asthma/bronchospasm
- Stridor → Croup/foreign body/anaphylaxis
- Grunting/retractions → Respiratory failure
- Cyanosis → Severe hypoxia

Q6: "SpO2 level?" → Determines oxygen/intervention urgency

**→ IMMEDIATE ACTION based on answers**

#### CIRCULATION PATHWAY  
Q5: "Perfusion signs?" (multi-select)
- Weak/absent pulses
- CRT >3 seconds
- Cold extremities
- Mottled skin

Q6: "Any bleeding visible?"
- YES → Hemorrhagic shock
- NO → Other shock types

**→ IMMEDIATE ACTION: IV access + fluid bolus**

#### NEURO PATHWAY
Q5: "Seizure activity?"
- Active seizure NOW → Status epilepticus
- Recent seizure → Post-ictal
- No seizure → Altered mental status

Q6: "Glucose level?" (if available)
- <60 mg/dL → Hypoglycemia
- >250 mg/dL → DKA possible

**→ IMMEDIATE ACTION based on answers**

#### TRAUMA PATHWAY
Q5: "Mechanism?"
- Fall/blunt trauma
- Penetrating injury
- Burns
- Multiple injuries

Q6: "Where is injury?"
- Head/neck
- Chest/abdomen  
- Extremities
- Multiple sites

**→ IMMEDIATE ACTION: C-spine + ABCDE trauma protocol**

#### TOXICOLOGY PATHWAY
Q5: "What was ingested/exposed?"
- Medication overdose
- Household chemical
- Unknown substance

Q6: "When?" 
- <1 hour → Decontamination possible
- >1 hour → Supportive care

**→ IMMEDIATE ACTION based on substance**

#### ANAPHYLAXIS PATHWAY
Q5: "Anaphylaxis signs?" (multi-select)
- Airway swelling
- Breathing difficulty
- Hypotension
- Skin rash/hives

**→ IMMEDIATE ACTION: IM Epinephrine NOW**

## Maximum Question Count by Scenario

| Scenario | Questions to Action | Time to Action |
|----------|-------------------|----------------|
| Cardiac arrest | 2 questions | 10 seconds |
| Unresponsive | 3 questions | 15 seconds |
| Breathing difficulty | 6 questions | 30 seconds |
| Shock | 6 questions | 30 seconds |
| Seizure | 6 questions | 30 seconds |
| Trauma | 6 questions | 30 seconds |
| Anaphylaxis | 5 questions | 25 seconds |

## After Immediate Action

Once critical intervention shown:
1. Provider performs intervention
2. Marks "Done" in sidebar
3. GPS shows NEXT critical step
4. Repeat until stable

## What We're Removing

- All detailed physical exam questions (JVP, hepatomegaly, heart sounds, etc.)
- All non-critical vital signs upfront
- All "nice to know" information
- All textbook completeness

## What We're Keeping

- Critical triage (breathing, pulse, responsiveness)
- Problem identification (what's wrong)
- Targeted questions (only what's needed for THIS emergency)
- Immediate interventions
- Step-by-step guidance

## Implementation Notes

- Default to "Unknown" for optional data (age, weight can be estimated)
- Skip button always available
- Voice commands for hands-free
- Intervention sidebar shows ALL active interventions
- Provider can add interventions manually if needed
- Advanced modules available but not required
