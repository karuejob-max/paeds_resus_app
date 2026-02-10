# ResusGPS Nuclear Rebuild Architecture

## Design Philosophy

**One question: "Will this save a life faster?"**
If the answer is no, it doesn't exist.

---

## What Gets Deleted

Everything in the current ClinicalAssessmentGPS.tsx (2000+ lines).
Everything in EmergencyLauncher.tsx.
All disconnected modules (AsthmaEscalation, FluidBolusTracker, etc. as separate overlays).
QuickStartPanel as a separate system.

## What Gets Built

ONE component. ONE flow. ONE state machine.

---

## The Architecture: A State Machine

The entire clinical decision support system is a **finite state machine**.

```
States:
  IDLE          → Provider opens app
  TRIAGE        → Is this patient alive? (breathing + pulse)
  IDENTIFY      → What's killing them? (pattern recognition)
  INTERVENE     → Do THIS now. (one action at a time)
  REASSESS      → Did it work? (loop back or escalate)
  STABILIZED    → Patient stable, handoff
```

### Why a state machine?
- No ambiguity about where you are
- No "jumping" between protocols
- Every state has exactly ONE set of valid transitions
- Easy to test: given state X and input Y, you ALWAYS go to state Z

---

## The Flow

### State: TRIAGE (Max 3 questions, <15 seconds)

**Question 1: "Is the patient breathing?"**
- YES → Question 2
- NO → INTERVENE: "Open airway. Give 5 rescue breaths. Check pulse."

**Question 2: "Can you feel a pulse?"**
- YES → Question 3
- NO → INTERVENE: "Start CPR. 15:2 ratio. Get defibrillator."

**Question 3: "Level of consciousness?"**
- Alert → IDENTIFY
- Responds to voice → IDENTIFY
- Responds to pain → IDENTIFY (flag: altered consciousness)
- Unresponsive → INTERVENE: "Secure airway. Recovery position if breathing. Call for help."

**Why only 3 questions?**
Because these are the ONLY questions that determine if someone is about to die RIGHT NOW.
Everything else can wait 30 seconds.

### State: IDENTIFY (Max 1 question)

**Question 4: "What do you see?"**

Options (with visual icons, big tap targets):
- 🫁 Breathing hard / noisy breathing
- 💧 Pale / cold / floppy (shock)
- 🧠 Seizure / not making sense
- 🩸 Bleeding / injury
- 🔴 Rash + swelling (allergic)
- 🤢 Vomiting + breathing fast (metabolic)
- 👶 Newborn problem

**Why "What do you see?" instead of "What is the main problem?"**
Because providers SEE symptoms, they don't diagnose. A nursing student sees "breathing hard" - they don't know it's bronchospasm vs pneumonia vs heart failure. The SYSTEM figures that out.

### State: INTERVENE

Based on the pathway selected, the system shows:

```
┌─────────────────────────────────┐
│  🔴 CRITICAL ACTION             │
│                                 │
│  [One clear instruction]        │
│  [With dose if medication]      │
│  [With rate if fluid]           │
│                                 │
│  WHY: [One line rationale]      │
│                                 │
│  ┌─────────┐  ┌──────────────┐  │
│  │  DONE ✓ │  │ NEED HELP  │  │
│  └─────────┘  └──────────────┘  │
└─────────────────────────────────┘
```

When provider taps DONE → system shows NEXT action.
When provider taps NEED HELP → system shows detailed guidance.

**Why one action at a time?**
Because in an emergency, cognitive load kills. Show ONE thing. They do it. Show the NEXT thing.

### State: REASSESS

After key interventions, the system asks:
- "Is the patient improving?" YES/NO
- If YES → next intervention in sequence
- If NO → escalate (increase dose, add second-line, call for help)

**Why reassess?**
Because protocols aren't linear. A child who doesn't respond to first-line needs escalation, not repetition.

---

## Pathway Definitions

Each pathway is a simple array of steps:

```typescript
interface Step {
  id: string;
  action: string;           // What to do
  detail?: string;          // How to do it (expandable)
  dose?: DoseCalc;          // Weight-based dose (auto-calculated)
  timer?: number;           // Seconds to wait before reassess
  reassess?: string;        // What to check after this step
  escalateIf?: string;      // When to move to next step
  critical?: boolean;       // Red highlight
}

interface Pathway {
  id: string;
  name: string;
  triggerPattern: string;   // What IDENTIFY answer triggers this
  steps: Step[];
  clarifyingQuestions?: ClarifyingQuestion[];  // 1-2 questions to narrow diagnosis
}
```

### Breathing Pathway
Triggered by: "Breathing hard / noisy breathing"

**Clarifying questions (max 2):**
1. "Is there wheezing?" YES/NO
2. "Is there stridor (harsh sound breathing in)?" YES/NO

**Routing:**
- Wheezing YES → Bronchospasm steps
- Stridor YES → Croup/Airway obstruction steps
- Both NO → General respiratory distress steps

**Bronchospasm Steps:**
1. Salbutamol nebulizer (dose by weight)
2. Reassess in 20 min → improving? Continue. Not improving?
3. Add ipratropium bromide
4. Reassess → still not improving?
5. IV magnesium sulfate
6. Reassess → still not improving?
7. IV salbutamol infusion
8. Consider intubation

### Shock Pathway
Triggered by: "Pale / cold / floppy"

**Clarifying questions:**
1. "Is there a rash or fever?" YES/NO
2. "Is there bleeding or fluid loss (vomiting/diarrhea)?" YES/NO

**Routing:**
- Fever + rash → Septic shock steps
- Bleeding/fluid loss → Hypovolemic shock steps
- Neither → Cardiogenic shock steps (be cautious with fluids)

### Seizure Pathway
Triggered by: "Seizure / not making sense"

**Clarifying question:**
1. "Is the patient actively seizing NOW?" YES/NO

**Routing:**
- Actively seizing → Status epilepticus steps
- Post-ictal/altered → Check glucose → assess

### Allergic Pathway
Triggered by: "Rash + swelling"

**No clarifying questions needed.**
→ Anaphylaxis protocol (epinephrine first, always)

### Metabolic Pathway
Triggered by: "Vomiting + breathing fast"

**Clarifying question:**
1. "Blood glucose level?" (number input)

**Routing:**
- Glucose > 250 → DKA steps
- Glucose < 60 → Hypoglycemia steps
- Normal glucose → Assess for other causes

### Bleeding/Trauma Pathway
Triggered by: "Bleeding / injury"

**Clarifying question:**
1. "Is there active, uncontrolled bleeding?" YES/NO

**Routing:**
- Active bleeding → Hemorrhage control steps
- No active bleeding → Trauma assessment steps

### Newborn Pathway
Triggered by: "Newborn problem"

**Clarifying question:**
1. "Age of baby?" (<1 hour / 1-24 hours / 1-28 days)

**Routing:**
- <1 hour → Neonatal resuscitation steps
- 1-28 days → Neonatal emergency steps

---

## Weight-Based Dosing

Every medication dose is calculated from patient weight.

```typescript
interface DoseCalc {
  drug: string;
  dosePerKg: number;
  unit: string;
  maxDose?: number;
  route: string;
  concentration?: string;
  preparation?: string;
}
```

Weight source (in priority order):
1. Actual weight entered by provider
2. Age-based estimation (if age entered but no weight)
3. "Unknown" → show Broselow-style weight bands

**Why not ask for weight during triage?**
Because if the child is dying, you don't weigh them first. You start interventions. The system uses estimated weight and adjusts when actual weight is available.

---

## What Does NOT Exist in This Rebuild

1. **No Expert Mode** - Why? Because the GPS should work for experts AND novices. An expert doesn't need a different interface - they need the same interface that moves faster.

2. **No separate Quick Launch** - Why? Because if you know the diagnosis, you tap IDENTIFY → select the pathway → you're there in 2 taps.

3. **No 25-question physical exam** - Why? Because you don't need to auscultate heart sounds to start CPR.

4. **No protocol checklists as separate overlays** - Why? Because the step-by-step intervention IS the checklist.

5. **No separate modules** - Why? Because AsthmaEscalation IS the breathing pathway bronchospasm steps. FluidBolusTracker IS the shock pathway step 1.

---

## File Structure

```
client/src/
  pages/
    Home.tsx                    → Single entry point
    ResusGPS.tsx                → THE clinical engine (replaces ClinicalAssessmentGPS)
  components/
    resus/
      TriageScreen.tsx          → Breathing/Pulse/Consciousness
      IdentifyScreen.tsx        → "What do you see?"
      InterventionScreen.tsx    → One action at a time
      ReassessScreen.tsx        → Did it work?
      StabilizedScreen.tsx      → Handoff
      DoseCalculator.tsx        → Weight-based dose display
      Timer.tsx                 → Countdown for reassessment
  lib/
    pathways/
      index.ts                  → Pathway registry
      breathing.ts              → Bronchospasm, Croup, General resp
      shock.ts                  → Septic, Hypovolemic, Cardiogenic
      seizure.ts                → Status epilepticus
      allergic.ts               → Anaphylaxis
      metabolic.ts              → DKA, Hypoglycemia
      trauma.ts                 → Hemorrhage, Trauma assessment
      newborn.ts                → Neonatal resuscitation
      cardiac-arrest.ts         → CPR protocol
    stateMachine.ts             → State transitions
    doseCalculations.ts         → All drug dose calculations
    weightEstimation.ts         → Age-to-weight estimation
```

**Why this structure?**
- Each pathway is a separate file → easy to audit, easy to update
- State machine is separate from UI → testable
- Dose calculations are centralized → one source of truth
- Components map 1:1 to states → no confusion

---

## Validation Scenarios

Before shipping, these MUST work:

1. **Cardiac arrest:** Open app → START → "Not breathing" → "No pulse" → CPR instructions in <10 seconds
2. **Severe asthma:** Open app → START → "Breathing" → "Pulse" → "Alert" → "Breathing hard" → "Wheezing YES" → Salbutamol dose in <30 seconds
3. **Septic shock:** Open app → START → "Breathing" → "Pulse" → "Responds to voice" → "Pale/cold/floppy" → "Fever YES" → Fluid bolus + antibiotics in <30 seconds
4. **DKA:** Open app → START → "Breathing" → "Pulse" → "Alert" → "Vomiting + breathing fast" → "Glucose 450" → DKA protocol in <30 seconds
5. **Anaphylaxis:** Open app → START → "Breathing" → "Pulse" → "Alert" → "Rash + swelling" → Epinephrine dose in <20 seconds
6. **Status epilepticus:** Open app → START → "Breathing" → "Pulse" → "Unresponsive" → "Seizure" → "Actively seizing YES" → Benzodiazepine dose in <25 seconds
