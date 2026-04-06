# ResusGPS v4 Clinical Features Implementation

## Overview
ResusGPS v4 adds critical clinical safety features that directly reduce preventable child mortality:
1. **Undo functionality** — Revert last finding, threat, or intervention
2. **Medication deduplication** — Prevent duplicate drug orders
3. **Multi-diagnosis support** — Manage >1 condition simultaneously
4. **Structured age input** — Years/months/weeks for neonates
5. **Countdown timers** — Time-critical intervention tracking
6. **Dose rationale** — Explain why this dose, based on what

## Feature 1: Undo Functionality

### Clinical Rationale
In high-stress resuscitations, providers may:
- Enter a finding incorrectly (e.g., HR 60 instead of 160)
- Trigger a threat unintentionally (e.g., click shock when child is compensated)
- Start an intervention prematurely, then need to backtrack

**Undo must be instant and reversible** — no "are you sure?" dialogs.

### Implementation

#### State Management
Add `undoStack` and `redoStack` to ResusSession:
```typescript
export interface ResusSession {
  // ... existing fields
  undoStack: ResusSession[]; // Previous states
  redoStack: ResusSession[]; // States after undo
  lastActionId: string; // Track what was undone for UI feedback
}
```

#### Actions that Support Undo
1. **Answer question** — Undo reverts finding + all dependent threats
2. **Start intervention** — Undo removes intervention + reverts threat status
3. **Complete intervention** — Undo reverts to "in_progress" state
4. **Set diagnosis** — Undo clears diagnosis + reverts to previous state

#### UI Implementation
- **Undo button** — Top bar, disabled if stack empty
- **Toast feedback** — "Undid: Added HR 160" or "Undid: Started epinephrine"
- **Keyboard shortcut** — Cmd+Z / Ctrl+Z
- **Redo button** — Cmd+Shift+Z / Ctrl+Shift+Z

#### Code Changes
1. Create `server/lib/undo-manager.ts` — Stack management
2. Add `pushToUndoStack()` in abcdeEngine.ts before any state mutation
3. Add `undo()` and `redo()` procedures to ResusGPS component
4. Wire UI buttons to undo/redo handlers

---

## Feature 2: Medication Deduplication

### Clinical Rationale
In chaotic resuscitations, providers may:
- Order epinephrine twice (once in shock escalation, once as reminder)
- Order bolus twice if reassessment prompts are unclear
- Forget they already gave a drug

**Deduplication prevents overdosing and wasted time**.

### Implementation

#### Detection Logic
When adding an intervention with a drug:
```typescript
function isDuplicateDrug(newIntervention: Intervention, activeInterventions: Intervention[]): boolean {
  const newDrug = newIntervention.dose?.drug;
  const newRoute = newIntervention.dose?.route;
  
  // Check if same drug + route is already:
  // 1. In progress (pending or in_progress status)
  // 2. Completed in last 5 minutes (for continuous infusions)
  
  return activeInterventions.some(iv => 
    iv.dose?.drug === newDrug &&
    iv.dose?.route === newRoute &&
    (iv.status === 'in_progress' || 
     (iv.status === 'completed' && Date.now() - iv.completedAt < 5 * 60 * 1000))
  );
}
```

#### UI Response
When duplicate detected:
```
⚠️ Epinephrine IV already in progress (started 2 min ago)
[Continue anyway] [Cancel] [View active intervention]
```

#### Exceptions
- **Boluses** — Allow repeat boluses (shock escalation requires multiple)
- **Continuous infusions** — Allow restart after 5+ minutes
- **Different routes** — Allow (e.g., IV + PR diazepam both valid)

#### Code Changes
1. Add `isDuplicateDrug()` to abcdeEngine.ts
2. Add `checkMedicationDuplicate()` tRPC procedure
3. Show warning dialog before adding intervention
4. Log deduplication events to analytics

---

## Feature 3: Multi-Diagnosis Support

### Clinical Rationale
Children often have **multiple concurrent diagnoses**:
- Sepsis + DKA (stress hyperglycemia)
- Asthma + pneumonia
- Trauma + shock

Current system forces single diagnosis → forces provider to choose → misses concurrent conditions.

### Implementation

#### Data Structure
Change from single diagnosis to array:
```typescript
export interface ResusSession {
  // OLD: diagnosis?: string;
  // NEW:
  diagnoses: {
    condition: string; // 'sepsis', 'dka', 'asthma', etc.
    confidence: 'definite' | 'likely' | 'consider'; // Based on findings
    findings: string[]; // Which findings support this
    interventions: string[]; // Which interventions target this
    timestamp: number;
  }[];
}
```

#### Diagnosis Suggestion Engine
Modify `getSuggestedDiagnoses()` to:
1. Return **all** conditions that match findings (not just top 1)
2. Rank by confidence (definite > likely > consider)
3. Show rationale for each (which findings triggered it)

#### UI Changes
- **Diagnosis cards** — Show all diagnoses with confidence badges
- **Intervention mapping** — Show which diagnosis each intervention targets
- **Reassessment** — Ask "Is [diagnosis] resolved?" for each active diagnosis

#### Code Changes
1. Update ResusSession type to support array
2. Modify `getSuggestedDiagnoses()` to return all matches
3. Update UI to render diagnosis cards (not single diagnosis)
4. Add diagnosis-to-intervention mapping display

---

## Feature 4: Structured Age Input

### Clinical Rationale
Neonates require **precise age** for dosing:
- Epinephrine: 0.1 mL/kg of 1:10,000 for neonate vs 0.01 mL/kg for older child
- Fluid bolus: 10 mL/kg for term infant, 20 mL/kg for older child
- Drug selection changes by age (e.g., no ibuprofen <6 months)

Current system asks "age" as single number → ambiguous (is it years? months?).

### Implementation

#### Age Input Component
```typescript
interface StructuredAge {
  years: number;
  months: number;
  weeks: number; // For neonates <4 weeks
  estimatedKg: number; // Auto-calculated
}
```

#### UI
- **Age picker** — Three spinners (years / months / weeks)
- **Quick presets** — "Newborn", "3 months", "1 year", "5 years"
- **Weight auto-calc** — Show "~3.5 kg" below age picker
- **Manual weight override** — "Actual weight: [input]"

#### Dosing Impact
- Recalculate **all** doses when age changes
- Show dose rationale: "Epinephrine 0.1 mL/kg for age <1 year"
- Flag age-inappropriate drugs: "Ibuprofen not recommended <6 months"

#### Code Changes
1. Create `AgeInput.tsx` component
2. Add `calculateWeightFromAge()` helper
3. Update `calcDose()` to use structured age
4. Add age-based drug restrictions to threat detection

---

## Feature 5: Countdown Timers

### Clinical Rationale
Resuscitation is **time-critical**:
- CPR quality degrades after 2 minutes without reassessment
- Medications need 3-5 minutes to work before next dose
- Seizures need intervention within seconds

Current system has timers but **no visual urgency** when time is running out.

### Implementation

#### Timer Types
1. **CPR timer** — Counts up, prompts reassessment every 2 min
2. **Medication timer** — Counts down from 3-5 min, prompts "reassess for response"
3. **Intervention timer** — Custom duration (e.g., "reassess after 10 min")

#### Visual Feedback
- **Active timer** — Large, animated countdown (red when <30 sec)
- **Audio alert** — Beep when time expires
- **Notification** — "Time to reassess epinephrine response"
- **Intervention card** — Shows timer status inline

#### Code Changes
1. Add `TimerCard.tsx` component
2. Add timer state to Intervention type
3. Implement `useTimer()` hook with audio alerts
4. Wire reassessment prompts to timer expiry

---

## Feature 6: Dose Rationale Display

### Clinical Rationale
Providers need to **understand why** a dose is recommended:
- "Why 0.1 mL/kg and not 0.15 mL/kg?"
- "Is this dose for this age?"
- "What if weight is wrong?"

### Implementation

#### Rationale Format
```typescript
interface DoseRationale {
  drug: string;
  dose: number;
  unit: string;
  calculation: string; // "0.1 mL/kg × 3.5 kg = 0.35 mL"
  source: string; // "AHA 2020 Pediatric Advanced Life Support"
  ageApplicable: string; // "Recommended for ages 1 month - 12 years"
  notes: string; // "Use 1:10,000 concentration for IV"
  alternatives?: string[]; // "Alternative: 0.01 mL/kg of 1:1,000 IM"
}
```

#### UI
- **Dose card** — Shows drug + dose + unit
- **Expand button** — Reveals rationale, calculation, source
- **Confidence indicator** — Green (definite) / yellow (likely) / gray (consider)
- **Edit button** — Override dose if needed (logs to audit)

#### Code Changes
1. Add `DoseRationale` type to abcdeEngine.ts
2. Enhance `calcDose()` to return rationale
3. Create `DoseCard.tsx` component with expand/collapse
4. Add rationale database (JSON) with AHA guidelines

---

## Implementation Order (Priority)

### Phase 2a: Undo (Highest Impact, Lowest Risk)
- **Why first**: Improves UX immediately, no clinical logic changes
- **Time**: 2-3 hours
- **Risk**: Low — pure state management

### Phase 2b: Medication Deduplication (High Impact, Medium Risk)
- **Why second**: Prevents overdosing, critical safety feature
- **Time**: 2-3 hours
- **Risk**: Medium — must validate drug detection logic

### Phase 2c: Countdown Timers (High Impact, Medium Risk)
- **Why third**: Improves reassessment compliance
- **Time**: 2-3 hours
- **Risk**: Medium — audio alerts must be tested

### Phase 2d: Structured Age Input (High Impact, Medium Risk)
- **Why fourth**: Improves dosing accuracy for neonates
- **Time**: 3-4 hours
- **Risk**: Medium — must recalculate all doses

### Phase 2e: Multi-Diagnosis Support (Medium Impact, High Risk)
- **Why fifth**: Enables concurrent diagnoses, but requires UI refactor
- **Time**: 4-5 hours
- **Risk**: High — major state structure change

### Phase 2f: Dose Rationale (Low Impact, Low Risk)
- **Why last**: Nice-to-have for transparency
- **Time**: 2-3 hours
- **Risk**: Low — display only

---

## Testing Strategy

### Unit Tests
- Undo/redo stack operations
- Medication deduplication logic
- Age-to-weight calculations
- Dose calculations with new age structure

### Integration Tests
- Full resuscitation flow with undo
- Multi-diagnosis reassessment
- Timer expiry triggers reassessment prompt

### Clinical Validation
- Test with 3-5 providers in low-stress setting
- Verify undo doesn't break clinical flow
- Confirm deduplication catches real duplicates
- Validate dose calculations for edge cases (neonates, obese children)

---

## Deployment Strategy

### Staging
1. Deploy v4 features to staging branch
2. Run full test suite
3. Manual testing by clinical team

### Production Rollout
1. Feature flag: `RESUS_GPS_V4_ENABLED`
2. Gradual rollout: 10% → 50% → 100%
3. Monitor for errors, undo usage, timer compliance

### Rollback Plan
- If critical bug: disable feature flag
- If undo breaks state: revert to v3
- If deduplication too aggressive: adjust thresholds

---

## Success Metrics

1. **Undo usage** — >50% of sessions use undo at least once
2. **Deduplication** — Prevents 90%+ of duplicate medications
3. **Timer compliance** — 80%+ of providers reassess on timer prompt
4. **Age accuracy** — 95%+ of doses calculated correctly for structured age
5. **Diagnosis accuracy** — Multi-diagnosis correctly identifies concurrent conditions
6. **Provider satisfaction** — >4/5 rating on usability survey

---

## Notes for Implementation

- All changes must be **backward compatible** with existing sessions
- Undo stack should be **capped at 50 states** to prevent memory issues
- Timers should **persist across page reloads** (save to localStorage)
- Dose rationale should be **sourced from AHA 2020 PALS guidelines**
- All features must be **tested with neonates, children, and adolescents**
