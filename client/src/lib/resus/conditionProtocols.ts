/**
 * conditionProtocols.ts
 *
 * Modular Emergency Engines — Phase 5.1
 *
 * Full step-by-step condition protocols for the three most common life-threatening
 * paediatric emergencies after cardiac arrest:
 *   1. Septic Shock (Surviving Sepsis Campaign / AHA PALS 2020)
 *   2. Status Epilepticus (ILAE / APLS / WHO)
 *   3. Diabetic Ketoacidosis (ISPAD 2022 / BSPED)
 *
 * Each protocol is a pure function of patient weight and age category.
 * No network calls. Offline-safe.
 *
 * Design principles:
 *   - Sequential steps mirroring bedside cognitive flow
 *   - Weight-based doses calculated at runtime (never hardcoded)
 *   - Reassessment checkpoints after every major intervention
 *   - Safety alerts baked into the step text
 *   - Age-specific nuances (e.g., no benzos in neonates for SE)
 */

// ─── Types ──────────────────────────────────────────────────

export type ConditionId = 'septic_shock' | 'status_epilepticus' | 'dka';

export type StepStatus = 'pending' | 'done' | 'skipped' | 'reassess';

export interface ProtocolDose {
  drug: string;
  dose: string;           // human-readable, e.g. "0.1 mg/kg IV"
  calculated: string;     // weight-applied, e.g. "1.5 mg IV"
  route: string;
  notes?: string;
  maxDose?: string;
}

export interface ProtocolStep {
  id: string;
  phase: string;          // e.g. "Immediate (0–5 min)", "Escalation (5–20 min)"
  action: string;         // What to DO
  rationale?: string;     // Why (shown on expand)
  doses?: ProtocolDose[];
  isReassessment?: boolean;
  safetyWarning?: string;
  status: StepStatus;
}

export interface ConditionProtocol {
  id: ConditionId;
  name: string;
  shortName: string;
  icon: string;
  color: string;           // Tailwind text color
  bgColor: string;         // Tailwind bg color
  triggerFindings: string[]; // Finding IDs that suggest this protocol
  steps: ProtocolStep[];
  monitoringTargets: string[];
  keyPitfalls: string[];
  references: string[];
}

export interface ActiveConditionState {
  conditionId: ConditionId;
  startedAt: number;
  stepStatuses: Record<string, StepStatus>;
}

// ─── Helpers ────────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundDose(n: number, maxDose?: number): number {
  const val = Math.round(n * 10) / 10;
  return maxDose ? Math.min(val, maxDose) : val;
}

function mgKg(dose: number, weight: number, maxDose?: number): string {
  return `${roundDose(dose * weight, maxDose)} mg`;
}

function mlKg(dose: number, weight: number, maxDose?: number): string {
  return `${roundDose(dose * weight, maxDose)} mL`;
}

function mcgKg(dose: number, weight: number, maxDose?: number): string {
  return `${roundDose(dose * weight, maxDose)} mcg`;
}

// ─── Protocol Factories ─────────────────────────────────────

/**
 * SEPTIC SHOCK PROTOCOL
 * Based on: Surviving Sepsis Campaign 2020, AHA PALS 2020, WHO ETAT+
 * Key principles:
 *   - Cultures BEFORE antibiotics (but do NOT delay antibiotics for cultures)
 *   - 10 mL/kg balanced crystalloid boluses (not 20 mL/kg in resource-limited settings)
 *   - Reassess after EVERY bolus for fluid overload signs
 *   - Vasopressors if fluid-refractory (≥40 mL/kg without improvement)
 */
export function buildSepticShockProtocol(weight: number, ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const isNeonate = ageCategory === 'neonate';

  const steps: ProtocolStep[] = [
    // ── Phase 1: Immediate (0–5 min) ──
    {
      id: 'ss_01_call_team',
      phase: 'Immediate (0–5 min)',
      action: 'Call for help — activate sepsis team / senior clinician. Assign roles: airway, IV access, documentation.',
      status: 'pending',
    },
    {
      id: 'ss_02_o2',
      phase: 'Immediate (0–5 min)',
      action: 'High-flow O₂ via non-rebreather mask (15 L/min) or bag-mask ventilation if inadequate respiratory effort.',
      rationale: 'Optimise oxygen delivery before fluid resuscitation.',
      status: 'pending',
    },
    {
      id: 'ss_03_access',
      phase: 'Immediate (0–5 min)',
      action: 'Obtain IV or IO access. Two large-bore peripheral IVs preferred. IO if IV fails after 2 attempts.',
      safetyWarning: 'Do NOT delay fluid resuscitation for central line placement.',
      status: 'pending',
    },
    {
      id: 'ss_04_cultures',
      phase: 'Immediate (0–5 min)',
      action: 'Draw blood cultures (2 sets if possible) BEFORE antibiotics. Also: FBC, CRP, lactate, glucose, electrolytes, renal function, coagulation.',
      rationale: 'Cultures before antibiotics improves pathogen identification. Do NOT delay antibiotics >1 hour.',
      status: 'pending',
    },
    {
      id: 'ss_05_glucose',
      phase: 'Immediate (0–5 min)',
      action: 'Check bedside glucose. If hypoglycaemic (<3.0 mmol/L), give dextrose immediately.',
      doses: [
        {
          drug: '10% Dextrose',
          dose: '2–5 mL/kg IV bolus',
          calculated: `${mlKg(2, w)} – ${mlKg(5, w)} IV bolus`,
          route: 'IV/IO',
          notes: 'Use 10% dextrose in children. Recheck glucose in 15 min.',
          maxDose: '250 mL',
        },
      ],
      status: 'pending',
    },
    // ── Phase 2: Fluid Resuscitation (0–15 min) ──
    {
      id: 'ss_06_bolus1',
      phase: 'Fluid Resuscitation (0–15 min)',
      action: 'Give first fluid bolus: 10 mL/kg balanced crystalloid (Ringer\'s Lactate preferred) over 5–10 min.',
      doses: [
        {
          drug: 'Ringer\'s Lactate (or 0.9% NaCl)',
          dose: '10 mL/kg IV bolus',
          calculated: `${mlKg(10, w, 500)} mL IV over 5–10 min`,
          route: 'IV/IO',
          notes: 'Ringer\'s Lactate preferred over 0.9% NaCl to reduce hyperchloraemic acidosis.',
          maxDose: '500 mL',
        },
      ],
      safetyWarning: 'Do NOT give fluid boluses if signs of fluid overload: hepatomegaly, gallop rhythm, new crackles, worsening SpO₂.',
      status: 'pending',
    },
    {
      id: 'ss_07_reassess1',
      phase: 'Fluid Resuscitation (0–15 min)',
      action: '⟳ REASSESS after bolus 1: HR, BP, CRT, mental status, urine output, liver size, lung sounds.',
      isReassessment: true,
      rationale: 'Reassessment after every bolus is mandatory to detect fluid overload early.',
      status: 'pending',
    },
    {
      id: 'ss_08_antibiotics',
      phase: 'Fluid Resuscitation (0–15 min)',
      action: 'Give broad-spectrum antibiotics within 1 hour of recognition. Empiric regimen:',
      doses: [
        {
          drug: 'Ceftriaxone',
          dose: '100 mg/kg IV (max 4 g)',
          calculated: `${mgKg(100, w, 4000)} IV over 30 min`,
          route: 'IV',
          notes: 'First-line for community-acquired sepsis. Avoid if meningitis suspected (use Cefotaxime).',
          maxDose: '4000 mg',
        },
        {
          drug: 'Ampicillin (if neonatal sepsis)',
          dose: isNeonate ? '50 mg/kg IV q6h' : 'N/A — not indicated',
          calculated: isNeonate ? `${mgKg(50, w, 2000)} IV q6h` : 'N/A',
          route: 'IV',
          notes: isNeonate ? 'Add Gentamicin for neonatal sepsis: 5 mg/kg IV q24h.' : '',
        },
        {
          drug: 'Metronidazole (if abdominal source)',
          dose: '7.5 mg/kg IV (max 500 mg)',
          calculated: `${mgKg(7.5, w, 500)} IV q8h`,
          route: 'IV',
          maxDose: '500 mg',
        },
      ],
      status: 'pending',
    },
    {
      id: 'ss_09_bolus2',
      phase: 'Fluid Resuscitation (0–15 min)',
      action: 'If still shocked after bolus 1 and NO signs of fluid overload: give bolus 2 (10 mL/kg).',
      doses: [
        {
          drug: 'Ringer\'s Lactate',
          dose: '10 mL/kg IV',
          calculated: `${mlKg(10, w, 500)} mL IV over 5–10 min`,
          route: 'IV/IO',
          maxDose: '500 mL',
        },
      ],
      safetyWarning: 'STOP fluids if: hepatomegaly, gallop rhythm, SpO₂ falling, worsening respiratory distress.',
      status: 'pending',
    },
    {
      id: 'ss_10_reassess2',
      phase: 'Fluid Resuscitation (0–15 min)',
      action: '⟳ REASSESS after bolus 2: HR, BP, CRT, mental status, liver size, lung sounds.',
      isReassessment: true,
      status: 'pending',
    },
    // ── Phase 3: Escalation (15–60 min) ──
    {
      id: 'ss_11_bolus3',
      phase: 'Escalation (15–60 min)',
      action: 'If still shocked after 20 mL/kg and NO fluid overload: give bolus 3. Total cumulative: 30 mL/kg.',
      doses: [
        {
          drug: 'Ringer\'s Lactate',
          dose: '10 mL/kg IV',
          calculated: `${mlKg(10, w, 500)} mL IV`,
          route: 'IV/IO',
          maxDose: '500 mL',
        },
      ],
      status: 'pending',
    },
    {
      id: 'ss_12_vasopressor',
      phase: 'Escalation (15–60 min)',
      action: 'If fluid-refractory shock (≥40 mL/kg without improvement OR fluid overload): start vasopressor.',
      doses: [
        {
          drug: 'Adrenaline (Epinephrine) — COLD shock (cold extremities, high CRT)',
          dose: '0.05–0.3 mcg/kg/min IV infusion',
          calculated: `Start at ${mcgKg(0.05, w)} mcg/min, titrate to ${mcgKg(0.3, w)} mcg/min`,
          route: 'IV/IO infusion',
          notes: 'Preferred for cold shock. Titrate every 5–10 min to effect.',
        },
        {
          drug: 'Noradrenaline (Norepinephrine) — WARM shock (warm extremities, bounding pulses)',
          dose: '0.05–0.3 mcg/kg/min IV infusion',
          calculated: `Start at ${mcgKg(0.05, w)} mcg/min, titrate to ${mcgKg(0.3, w)} mcg/min`,
          route: 'IV/IO infusion',
          notes: 'Preferred for warm/distributive shock.',
        },
        {
          drug: 'Dopamine (if adrenaline/noradrenaline unavailable)',
          dose: '5–20 mcg/kg/min IV infusion',
          calculated: `Start at ${mcgKg(5, w)} mcg/min`,
          route: 'IV/IO infusion',
          notes: 'Second-line. Titrate to effect.',
        },
      ],
      safetyWarning: 'Vasopressors via peripheral IV is acceptable in emergency. Move to central access as soon as possible.',
      status: 'pending',
    },
    {
      id: 'ss_13_hydrocortisone',
      phase: 'Escalation (15–60 min)',
      action: 'If vasopressor-refractory shock (not responding to adrenaline ≥0.3 mcg/kg/min): give hydrocortisone.',
      doses: [
        {
          drug: 'Hydrocortisone',
          dose: '2 mg/kg IV bolus (max 100 mg)',
          calculated: `${mgKg(2, w, 100)} IV bolus`,
          route: 'IV',
          notes: 'Stress-dose steroid for catecholamine-refractory shock. Then 1 mg/kg q6h.',
          maxDose: '100 mg',
        },
      ],
      status: 'pending',
    },
    {
      id: 'ss_14_icu',
      phase: 'Escalation (15–60 min)',
      action: 'Arrange ICU/HDU admission. If transferring: stabilise airway, secure IV/IO, document all interventions given.',
      status: 'pending',
    },
    {
      id: 'ss_15_reassess3',
      phase: 'Escalation (15–60 min)',
      action: '⟳ REASSESS every 15 min: HR, BP, CRT, mental status, urine output (target >1 mL/kg/h), lactate trend.',
      isReassessment: true,
      status: 'pending',
    },
  ];

  return {
    id: 'septic_shock',
    name: 'Septic Shock',
    shortName: 'Septic Shock',
    icon: '🦠',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    triggerFindings: ['perfusion_cold_shock', 'perfusion_warm_shock', 'temp_fever'],
    steps,
    monitoringTargets: [
      'HR: age-appropriate normal range',
      'CRT: <2 sec (peripheral), <1 sec (central)',
      'MAP: >50 mmHg (infant), >60 mmHg (child)',
      'SpO₂: ≥94%',
      'Urine output: >1 mL/kg/h',
      'Glucose: 4–10 mmol/L',
      'Lactate: <2 mmol/L (target)',
      'Temperature: trending toward normal',
    ],
    keyPitfalls: [
      'Delaying antibiotics >1 hour — every hour of delay increases mortality',
      'Over-resuscitation in resource-limited settings — reassess after EVERY bolus',
      'Missing fluid overload signs (hepatomegaly, gallop) before next bolus',
      'Using 0.9% NaCl in large volumes — causes hyperchloraemic acidosis',
      'Not checking glucose — hypoglycaemia is common and treatable',
      'Neonatal sepsis: add Ampicillin + Gentamicin (Ceftriaxone alone is insufficient)',
    ],
    references: [
      'Surviving Sepsis Campaign International Guidelines 2020',
      'AHA PALS Provider Manual 2020',
      'WHO ETAT+ Guidelines',
      'FEAST Trial (NEJM 2011) — fluid bolus harm in resource-limited settings',
    ],
  };
}

/**
 * STATUS EPILEPTICUS PROTOCOL
 * Based on: ILAE 2015, APLS, AHA PALS 2020, WHO
 * Key principles:
 *   - Benzodiazepine first-line (NOT in neonates — use phenobarbitone)
 *   - Time-based escalation: 5 min → 10 min → 20 min → RSI
 *   - Check and correct glucose, electrolytes, temperature
 *   - Identify and treat underlying cause
 */
export function buildStatusEpilepticusProtocol(weight: number, ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const isNeonate = ageCategory === 'neonate';

  const steps: ProtocolStep[] = [
    // ── Phase 1: Immediate (0–5 min) ──
    {
      id: 'se_01_time',
      phase: 'Immediate (0–5 min)',
      action: 'Note seizure start time. Status epilepticus = seizure >5 min OR 2+ seizures without recovery. Start clock NOW.',
      status: 'pending',
    },
    {
      id: 'se_02_position',
      phase: 'Immediate (0–5 min)',
      action: 'Position: lateral (recovery position) if not intubated. Do NOT restrain. Protect from injury.',
      status: 'pending',
    },
    {
      id: 'se_03_o2',
      phase: 'Immediate (0–5 min)',
      action: 'High-flow O₂ via non-rebreather mask. Suction airway if secretions. Jaw thrust if airway obstructed.',
      status: 'pending',
    },
    {
      id: 'se_04_glucose',
      phase: 'Immediate (0–5 min)',
      action: 'Check bedside glucose IMMEDIATELY. Treat hypoglycaemia (<3.0 mmol/L) before anticonvulsants.',
      doses: [
        {
          drug: '10% Dextrose',
          dose: '2–5 mL/kg IV',
          calculated: `${mlKg(2, w)} – ${mlKg(5, w)} IV bolus`,
          route: 'IV/IO',
          notes: 'Recheck glucose in 15 min. Hypoglycaemia is a common reversible cause.',
          maxDose: '250 mL',
        },
      ],
      status: 'pending',
    },
    {
      id: 'se_05_access',
      phase: 'Immediate (0–5 min)',
      action: 'Obtain IV or IO access. If IV access unavailable, use buccal midazolam or rectal diazepam.',
      status: 'pending',
    },
    // ── Phase 2: First-Line (5–10 min) ──
    {
      id: 'se_06_benzo',
      phase: 'First-Line Anticonvulsant (5–10 min)',
      action: isNeonate
        ? '⚠️ NEONATE: Do NOT use benzodiazepines as first-line. Give Phenobarbitone first-line.'
        : 'Give first-line benzodiazepine. Choose route based on access:',
      doses: isNeonate
        ? [
            {
              drug: 'Phenobarbitone (NEONATE — first-line)',
              dose: '20 mg/kg IV slow push over 10–15 min',
              calculated: `${mgKg(20, w, 400)} IV over 10–15 min`,
              route: 'IV/IO',
              notes: 'Monitor for respiratory depression. Have bag-mask ready.',
              maxDose: '400 mg',
            },
          ]
        : [
            {
              drug: 'Midazolam IV/IO (preferred if access)',
              dose: '0.1–0.2 mg/kg IV/IO (max 10 mg)',
              calculated: `${mgKg(0.1, w, 10)} – ${mgKg(0.2, w, 10)} IV/IO`,
              route: 'IV/IO',
              notes: 'Give slowly over 2–5 min. Monitor respiratory rate and SpO₂.',
              maxDose: '10 mg',
            },
            {
              drug: 'Midazolam buccal (if no IV access)',
              dose: '0.3–0.5 mg/kg buccal (max 10 mg)',
              calculated: `${mgKg(0.3, w, 10)} – ${mgKg(0.5, w, 10)} mg buccal`,
              route: 'Buccal',
              notes: 'Squirt between cheek and gum. Onset 5–10 min.',
              maxDose: '10 mg',
            },
            {
              drug: 'Diazepam rectal (if no IV/buccal)',
              dose: '0.5 mg/kg PR (max 20 mg)',
              calculated: `${mgKg(0.5, w, 20)} mg PR`,
              route: 'Rectal',
              maxDose: '20 mg',
            },
            {
              drug: 'Lorazepam IV (if available)',
              dose: '0.1 mg/kg IV (max 4 mg)',
              calculated: `${mgKg(0.1, w, 4)} mg IV over 2 min`,
              route: 'IV/IO',
              maxDose: '4 mg',
            },
          ],
      safetyWarning: isNeonate
        ? 'Benzodiazepines cause respiratory depression in neonates. Use Phenobarbitone first-line in neonates.'
        : 'Have bag-mask ventilation ready. Benzodiazepines can cause respiratory depression.',
      status: 'pending',
    },
    {
      id: 'se_07_reassess1',
      phase: 'First-Line Anticonvulsant (5–10 min)',
      action: '⟳ REASSESS at 5 min: Is seizure stopping? Check SpO₂, HR, RR, glucose.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'se_08_benzo2',
      phase: 'Second Benzodiazepine (10–20 min)',
      action: isNeonate
        ? 'If seizure continues after Phenobarbitone: give Phenytoin or Levetiracetam.'
        : 'If seizure continues at 10 min: give SECOND dose of benzodiazepine (same drug, same dose).',
      doses: isNeonate
        ? [
            {
              drug: 'Phenytoin (NEONATE — second-line)',
              dose: '20 mg/kg IV over 20 min',
              calculated: `${mgKg(20, w, 1000)} IV over 20 min`,
              route: 'IV',
              notes: 'Monitor ECG during infusion. Do NOT give faster than 1 mg/kg/min.',
              maxDose: '1000 mg',
            },
          ]
        : [
            {
              drug: 'Midazolam (repeat dose)',
              dose: '0.1–0.2 mg/kg IV/IO (max 10 mg)',
              calculated: `${mgKg(0.1, w, 10)} – ${mgKg(0.2, w, 10)} IV/IO`,
              route: 'IV/IO',
              notes: 'Only ONE repeat dose of benzodiazepine. If still seizing → second-line agent.',
              maxDose: '10 mg',
            },
          ],
      safetyWarning: 'Maximum 2 doses of benzodiazepine total. More doses increase respiratory depression risk without additional benefit.',
      status: 'pending',
    },
    // ── Phase 3: Second-Line (20–40 min) ──
    {
      id: 'se_09_secondline',
      phase: 'Second-Line Agent (20–40 min)',
      action: isNeonate
        ? 'If seizure continues: give Pyridoxine (consider vitamin B6-dependent epilepsy in neonates).'
        : 'If seizure continues after 2 benzodiazepine doses: give second-line anticonvulsant.',
      doses: isNeonate
        ? [
            {
              drug: 'Pyridoxine (Vitamin B6)',
              dose: '100 mg IV',
              calculated: '100 mg IV (fixed dose)',
              route: 'IV',
              notes: 'Trial dose for pyridoxine-dependent epilepsy. Give over 5 min.',
            },
          ]
        : [
            {
              drug: 'Levetiracetam (preferred — fewer interactions)',
              dose: '40–60 mg/kg IV (max 3000 mg)',
              calculated: `${mgKg(40, w, 3000)} – ${mgKg(60, w, 3000)} IV over 15 min`,
              route: 'IV',
              notes: 'Preferred second-line. Fewer drug interactions than phenytoin. Safe in liver disease.',
              maxDose: '3000 mg',
            },
            {
              drug: 'Phenytoin (if Levetiracetam unavailable)',
              dose: '20 mg/kg IV (max 1000 mg)',
              calculated: `${mgKg(20, w, 1000)} IV over 20 min`,
              route: 'IV',
              notes: 'Infuse at ≤1 mg/kg/min. Monitor ECG — risk of arrhythmia and hypotension.',
              maxDose: '1000 mg',
            },
            {
              drug: 'Phenobarbitone (if Levetiracetam + Phenytoin unavailable)',
              dose: '20 mg/kg IV (max 1000 mg)',
              calculated: `${mgKg(20, w, 1000)} IV over 20–30 min`,
              route: 'IV',
              notes: 'Monitor for respiratory depression. Have airway equipment ready.',
              maxDose: '1000 mg',
            },
          ],
      status: 'pending',
    },
    {
      id: 'se_10_cause',
      phase: 'Second-Line Agent (20–40 min)',
      action: 'Identify and treat underlying cause: check electrolytes (Na, Ca, Mg), temperature, meningitis signs, toxins, trauma.',
      doses: [
        {
          drug: 'Calcium Gluconate 10% (if hypocalcaemia)',
          dose: '0.5 mL/kg IV slow push (max 20 mL)',
          calculated: `${mlKg(0.5, w, 20)} mL IV over 5–10 min`,
          route: 'IV',
          notes: 'Monitor ECG during infusion. Extravasation causes tissue necrosis.',
          maxDose: '20 mL',
        },
        {
          drug: 'Magnesium Sulphate 50% (if hypomagnesaemia)',
          dose: '0.1–0.2 mL/kg IV (max 8 mL)',
          calculated: `${mlKg(0.1, w, 8)} – ${mlKg(0.2, w, 8)} mL IV over 20 min`,
          route: 'IV',
          notes: 'Dilute to 10–20% before infusion. Monitor for respiratory depression.',
          maxDose: '8 mL (50%)',
        },
      ],
      status: 'pending',
    },
    // ── Phase 4: Refractory (>40 min) ──
    {
      id: 'se_11_rsi',
      phase: 'Refractory Status Epilepticus (>40 min)',
      action: 'REFRACTORY SE: Intubate and ventilate. Call anaesthesia/ICU. Prepare for RSI.',
      doses: [
        {
          drug: 'Thiopentone (RSI induction)',
          dose: '3–5 mg/kg IV',
          calculated: `${mgKg(3, w)} – ${mgKg(5, w)} IV`,
          route: 'IV',
          notes: 'Causes hypotension — have fluid bolus ready.',
        },
        {
          drug: 'Midazolam infusion (post-intubation)',
          dose: '0.1–0.4 mg/kg/h IV infusion',
          calculated: `${round1(0.1 * w)} – ${round1(0.4 * w)} mg/h IV infusion`,
          route: 'IV infusion',
          notes: 'Titrate to EEG burst suppression if available.',
        },
      ],
      safetyWarning: 'Refractory SE has high mortality. ICU admission mandatory. Continuous EEG monitoring if available.',
      status: 'pending',
    },
    {
      id: 'se_12_reassess2',
      phase: 'Refractory Status Epilepticus (>40 min)',
      action: '⟳ REASSESS: Is seizure clinically stopped? Check for subtle signs (eye deviation, lip smacking). Check glucose, electrolytes, temperature.',
      isReassessment: true,
      status: 'pending',
    },
  ];

  return {
    id: 'status_epilepticus',
    name: 'Status Epilepticus',
    shortName: 'Status Epilepticus',
    icon: '⚡',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    triggerFindings: ['seizure_activity', 'avpu_unresponsive'],
    steps,
    monitoringTargets: [
      'Seizure activity: clinically stopped?',
      'SpO₂: ≥94% (hypoxia prolongs seizures)',
      'Glucose: 4–10 mmol/L',
      'Temperature: normothermia',
      'Electrolytes: Na, Ca, Mg',
      'RR and respiratory effort (benzodiazepine effect)',
    ],
    keyPitfalls: [
      'Using benzodiazepines in neonates — use Phenobarbitone first-line in neonates',
      'Giving >2 doses of benzodiazepine — increases respiratory depression without benefit',
      'Not checking glucose — hypoglycaemia is a common reversible cause',
      'Delaying second-line agent — every minute of seizure causes neuronal injury',
      'Missing subtle seizures post-benzodiazepine (eye deviation, lip smacking)',
      'Not treating the underlying cause (electrolytes, meningitis, toxins)',
    ],
    references: [
      'ILAE Operational Classification of Seizure Types 2017',
      'APLS Advanced Paediatric Life Support 6th Edition',
      'AHA PALS Provider Manual 2020',
      'Epilepsy Foundation Status Epilepticus Guidelines 2016',
    ],
  };
}

/**
 * DIABETIC KETOACIDOSIS PROTOCOL
 * Based on: ISPAD Clinical Practice Consensus Guidelines 2022, BSPED 2021
 * Key principles:
 *   - CONFIRM DKA before treating (glucose + ketones + pH/HCO3)
 *   - Do NOT bolus fluids unless haemodynamically compromised
 *   - Fluid deficit replaced over 48 hours (not rapidly)
 *   - Insulin infusion ONLY after 1 hour of fluid resuscitation
 *   - Cerebral oedema is the leading cause of death — monitor closely
 */
export function buildDKAProtocol(weight: number, ageCategory: string): ConditionProtocol {
  const w = weight || 10;

  // Fluid calculations
  const maintenanceMlHr = round1(w <= 10 ? 100 * w / 24 : w <= 20 ? (1000 + 50 * (w - 10)) / 24 : (1500 + 20 * (w - 20)) / 24);
  const deficitMild = round1(w * 50); // 5% deficit
  const deficitModerate = round1(w * 70); // 7% deficit
  const deficitSevere = round1(w * 100); // 10% deficit
  const replacementRateMild = round1((deficitMild + maintenanceMlHr * 48) / 48);
  const replacementRateModerate = round1((deficitModerate + maintenanceMlHr * 48) / 48);

  const steps: ProtocolStep[] = [
    // ── Phase 1: Confirm & Stabilise (0–30 min) ──
    {
      id: 'dka_01_confirm',
      phase: 'Confirm DKA (0–30 min)',
      action: 'CONFIRM DKA before treating. All 3 criteria required: (1) Glucose >11 mmol/L, (2) Ketonaemia ≥3 mmol/L or ketonuria ≥2+, (3) Acidosis: pH <7.3 or HCO₃ <15 mmol/L.',
      safetyWarning: 'Do NOT treat as DKA based on glucose alone. Stress hyperglycaemia is common in critically ill children.',
      status: 'pending',
    },
    {
      id: 'dka_02_severity',
      phase: 'Confirm DKA (0–30 min)',
      action: 'Classify severity: Mild (pH 7.2–7.3, HCO₃ 10–15), Moderate (pH 7.1–7.2, HCO₃ 5–10), Severe (pH <7.1, HCO₃ <5).',
      status: 'pending',
    },
    {
      id: 'dka_03_bloods',
      phase: 'Confirm DKA (0–30 min)',
      action: 'Send: VBG (pH, HCO₃, BE, K⁺), glucose, ketones, FBC, U&E, creatinine, phosphate, calcium, HbA1c, blood culture if febrile.',
      status: 'pending',
    },
    {
      id: 'dka_04_monitoring',
      phase: 'Confirm DKA (0–30 min)',
      action: 'Continuous monitoring: ECG (for hyperkalaemia/hypokalaemia), SpO₂, hourly urine output (catheterise if needed), hourly glucose, 2-hourly VBG.',
      status: 'pending',
    },
    {
      id: 'dka_05_npo',
      phase: 'Confirm DKA (0–30 min)',
      action: 'Nil by mouth. NG tube if vomiting or reduced consciousness (risk of aspiration).',
      status: 'pending',
    },
    // ── Phase 2: Fluid Resuscitation (0–60 min) ──
    {
      id: 'dka_06_fluid_shock',
      phase: 'Fluid Resuscitation (0–60 min)',
      action: 'ONLY give fluid bolus if haemodynamically compromised (poor perfusion, hypotension, prolonged CRT >3 sec).',
      doses: [
        {
          drug: '0.9% NaCl (ONLY if shocked)',
          dose: '10 mL/kg IV over 30–60 min',
          calculated: `${mlKg(10, w, 500)} mL IV over 30–60 min`,
          route: 'IV',
          notes: 'Repeat if still shocked. Maximum 20 mL/kg total before reassessing. Do NOT use Ringer\'s Lactate in DKA.',
          maxDose: '500 mL',
        },
      ],
      safetyWarning: 'Do NOT give routine fluid boluses in DKA — rapid fluid shifts increase cerebral oedema risk.',
      status: 'pending',
    },
    {
      id: 'dka_07_rehydration',
      phase: 'Fluid Resuscitation (0–60 min)',
      action: 'Calculate rehydration fluid rate. Replace deficit over 48 hours + maintenance. Use 0.9% NaCl + 20 mmol/L KCl (if K⁺ >3.5 mmol/L).',
      doses: [
        {
          drug: '0.9% NaCl + 20 mmol/L KCl (mild DKA, 5% deficit)',
          dose: `${replacementRateMild} mL/hr IV (48-hour replacement)`,
          calculated: `${replacementRateMild} mL/hr (deficit ${deficitMild} mL + maintenance over 48h)`,
          route: 'IV infusion',
          notes: 'Adjust rate based on clinical response. Do NOT add KCl if K⁺ >5.5 mmol/L.',
        },
        {
          drug: '0.9% NaCl + 20 mmol/L KCl (moderate DKA, 7% deficit)',
          dose: `${replacementRateModerate} mL/hr IV (48-hour replacement)`,
          calculated: `${replacementRateModerate} mL/hr (deficit ${deficitModerate} mL + maintenance over 48h)`,
          route: 'IV infusion',
          notes: 'Adjust rate based on clinical response.',
        },
      ],
      status: 'pending',
    },
    {
      id: 'dka_08_potassium',
      phase: 'Fluid Resuscitation (0–60 min)',
      action: 'Potassium management: ALL DKA patients are total body K⁺ depleted. Add K⁺ to fluids based on serum level.',
      doses: [
        {
          drug: 'KCl in IV fluids',
          dose: 'K⁺ 3.5–5.5: add 40 mmol/L KCl | K⁺ <3.5: add 60 mmol/L KCl | K⁺ >5.5: no KCl until <5.5',
          calculated: 'Adjust KCl concentration per serum K⁺ result',
          route: 'IV (in fluids)',
          notes: 'NEVER give KCl as IV bolus. Monitor K⁺ 2-hourly.',
        },
      ],
      safetyWarning: 'Hypokalaemia during insulin therapy causes fatal arrhythmias. Do NOT start insulin if K⁺ <3.5 mmol/L.',
      status: 'pending',
    },
    // ── Phase 3: Insulin (after 1 hour of fluids) ──
    {
      id: 'dka_09_insulin',
      phase: 'Insulin Infusion (after 1 hour of fluids)',
      action: 'Start insulin infusion ONLY after 1 hour of IV fluid resuscitation AND K⁺ ≥3.5 mmol/L.',
      doses: [
        {
          drug: 'Soluble Insulin (Actrapid / Regular Insulin)',
          dose: '0.05–0.1 units/kg/hour IV infusion',
          calculated: `${round1(0.05 * w)} – ${round1(0.1 * w)} units/hour IV infusion`,
          route: 'IV infusion',
          notes: 'Start at 0.05 units/kg/h in mild/moderate DKA. Use 0.1 units/kg/h in severe DKA. Do NOT give IV bolus insulin.',
        },
      ],
      safetyWarning: 'Do NOT start insulin if K⁺ <3.5 mmol/L — fatal hypokalaemia risk. Do NOT give insulin bolus.',
      status: 'pending',
    },
    {
      id: 'dka_10_glucose_target',
      phase: 'Insulin Infusion (after 1 hour of fluids)',
      action: 'Target glucose fall: 2–5 mmol/L per hour. If glucose falls >5 mmol/L/h or reaches 14 mmol/L: add 5–10% dextrose to IV fluids (do NOT stop insulin).',
      doses: [
        {
          drug: '5% or 10% Dextrose (add to IV fluids when glucose <14 mmol/L)',
          dose: 'Add to existing IV fluid at same rate',
          calculated: 'Adjust dextrose concentration to maintain glucose 8–12 mmol/L',
          route: 'IV (in fluids)',
          notes: 'Continue insulin until ketones cleared (pH >7.3, HCO₃ >15, ketones <0.6 mmol/L).',
        },
      ],
      status: 'pending',
    },
    // ── Phase 4: Monitoring & Complications ──
    {
      id: 'dka_11_cerebral_oedema',
      phase: 'Monitoring & Complications',
      action: '⚠️ CEREBRAL OEDEMA — highest risk 4–12 hours after treatment starts. Watch for: headache, deteriorating GCS, bradycardia, hypertension, pupil changes.',
      safetyWarning: 'Cerebral oedema is the leading cause of death in DKA. Act IMMEDIATELY if suspected.',
      doses: [
        {
          drug: 'Mannitol 20% (if cerebral oedema)',
          dose: '0.5–1 g/kg IV over 20 min',
          calculated: `${mgKg(500, w, 50000)} mg (${mlKg(2.5, w, 250)} mL of 20%) IV over 20 min`,
          route: 'IV',
          notes: 'Give immediately — do NOT wait for CT scan. Repeat in 2 hours if no improvement.',
          maxDose: '50000 mg (250 mL of 20%)',
        },
        {
          drug: 'Hypertonic Saline 3% (alternative to mannitol)',
          dose: '2.5–5 mL/kg IV over 15–30 min',
          calculated: `${mlKg(2.5, w, 250)} – ${mlKg(5, w, 250)} mL IV over 15–30 min`,
          route: 'IV',
          maxDose: '250 mL',
        },
      ],
      status: 'pending',
    },
    {
      id: 'dka_12_reassess',
      phase: 'Monitoring & Complications',
      action: '⟳ REASSESS hourly: glucose, clinical status, urine output. VBG every 2 hours. Electrolytes every 4 hours. Adjust insulin and fluids based on results.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'dka_13_transition',
      phase: 'Transition to Subcutaneous',
      action: 'Transition to subcutaneous insulin when: pH >7.3, HCO₃ >15, ketones <0.6 mmol/L, tolerating oral fluids. Give SC insulin 30 min BEFORE stopping IV insulin.',
      status: 'pending',
    },
  ];

  return {
    id: 'dka',
    name: 'Diabetic Ketoacidosis (DKA)',
    shortName: 'DKA',
    icon: '🩸',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    triggerFindings: ['glucose_high', 'breathing_deep_labored'],
    steps,
    monitoringTargets: [
      'Glucose: target fall 2–5 mmol/L/hour; maintain 8–12 mmol/L during insulin',
      'K⁺: 3.5–5.5 mmol/L (check 2-hourly)',
      'pH: target >7.3',
      'HCO₃: target >15 mmol/L',
      'Ketones: target <0.6 mmol/L',
      'GCS: any deterioration = suspect cerebral oedema',
      'Urine output: >1 mL/kg/h',
      'ECG: monitor for hyperkalaemia (peaked T waves) and hypokalaemia (flat T waves)',
    ],
    keyPitfalls: [
      'Treating stress hyperglycaemia as DKA — always confirm with ketones + pH',
      'Rapid fluid resuscitation — increases cerebral oedema risk',
      'Starting insulin before correcting hypokalaemia (K⁺ <3.5) — fatal arrhythmia',
      'Stopping insulin when glucose normalises — continue until ketones cleared',
      'Missing cerebral oedema — headache + GCS drop = act immediately',
      'Using Ringer\'s Lactate in DKA — use 0.9% NaCl',
      'Giving IV insulin bolus — use infusion only',
    ],
    references: [
      'ISPAD Clinical Practice Consensus Guidelines 2022 — DKA',
      'BSPED Interim Guideline for the Management of Children with DKA 2021',
      'AHA PALS Provider Manual 2020',
      'Wolfsdorf JI et al. Diabetic ketoacidosis and hyperglycaemic hyperosmolar state. Pediatr Diabetes 2022',
    ],
  };
}

// ─── Protocol Registry ───────────────────────────────────────

export function buildAllProtocols(weight: number, ageCategory: string): Record<ConditionId, ConditionProtocol> {
  return {
    septic_shock: buildSepticShockProtocol(weight, ageCategory),
    status_epilepticus: buildStatusEpilepticusProtocol(weight, ageCategory),
    dka: buildDKAProtocol(weight, ageCategory),
  };
}

export function buildProtocol(id: ConditionId, weight: number, ageCategory: string): ConditionProtocol {
  switch (id) {
    case 'septic_shock': return buildSepticShockProtocol(weight, ageCategory);
    case 'status_epilepticus': return buildStatusEpilepticusProtocol(weight, ageCategory);
    case 'dka': return buildDKAProtocol(weight, ageCategory);
  }
}

/**
 * Apply a step status update to an ActiveConditionState.
 * Pure function — returns new state.
 */
export function updateConditionStep(
  state: ActiveConditionState,
  stepId: string,
  status: StepStatus
): ActiveConditionState {
  return {
    ...state,
    stepStatuses: { ...state.stepStatuses, [stepId]: status },
  };
}

/**
 * Get the progress of a condition protocol (completed / total steps).
 */
export function getProtocolProgress(
  protocol: ConditionProtocol,
  state: ActiveConditionState
): { completed: number; total: number; percent: number } {
  const total = protocol.steps.filter(s => !s.isReassessment).length;
  const completed = protocol.steps.filter(
    s => !s.isReassessment && (state.stepStatuses[s.id] === 'done' || state.stepStatuses[s.id] === 'skipped')
  ).length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 7 PROTOCOLS
// ─────────────────────────────────────────────────────────────────────────────

// ─── 7.1  Neonatal Resuscitation Protocol (NRP 8th Ed / AHA 2020) ────────────

function buildNRPProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight > 0 ? weight : 3; // default 3 kg for neonate
  const epiDose = roundDose(0.01 * w * 1000, 1000); // 0.01 mg/kg = 0.1 mL/kg of 1:10000 → mcg
  const epiMl = round1(0.1 * w);                    // 0.1 mL/kg of 1:10000 epinephrine
  const volumeBolusML = round1(10 * w);              // 10 mL/kg NS for volume

  return {
    id: 'nrp',
    name: 'Neonatal Resuscitation (NRP)',
    shortName: 'NRP',
    icon: '👶',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50',
    triggerFindings: ['apnea', 'bradycardia', 'cyanosis', 'poor_tone'],
    monitoringTargets: [
      'SpO₂ target: 60–65% at 1 min → 80–85% at 5 min → ≥90% at 10 min',
      'HR > 100 bpm within 60 seconds of effective PPV',
      'Chest rise with each PPV breath',
      'Temperature: 36.5–37.5 °C (avoid hypothermia)',
      'Blood glucose ≥ 2.6 mmol/L after stabilisation',
    ],
    keyPitfalls: [
      'Do NOT delay PPV — it is the single most effective NRP intervention',
      'Avoid 100% O₂ at birth — start with 21% (room air) for term infants',
      'Chest compressions only if HR < 60 after 30 s of effective PPV',
      'Epinephrine is IV/IO preferred — ET route is less reliable',
      'Hypothermia worsens outcomes — keep warm throughout',
      'Meconium: do NOT routinely suction unless infant is non-vigorous',
    ],
    references: [
      'AHA/AAP NRP 8th Edition 2021',
      'ILCOR Neonatal Life Support 2020',
    ],
    steps: [
      // ── Initial Assessment (0–30 s) ──────────────────────────────────────
      {
        id: 'nrp_initial_assessment',
        phase: 'Initial Assessment (0–30 s)',
        action: 'Assess: Term gestation? Good tone? Breathing or crying?',
        rationale: 'If YES to all three → routine care (warm, dry, stimulate). If NO to any → proceed with NRP.',
        status: 'pending',
      },
      {
        id: 'nrp_warm_dry',
        phase: 'Initial Assessment (0–30 s)',
        action: 'Warm, dry, stimulate. Position airway (slight neck extension). Clear secretions if needed.',
        rationale: 'Hypothermia is a major cause of neonatal mortality. Drying and stimulation often trigger spontaneous breathing.',
        status: 'pending',
      },
      {
        id: 'nrp_assess_hr_breathing',
        phase: 'Initial Assessment (0–30 s)',
        action: 'Reassess HR and breathing at 30 seconds.',
        isReassessment: true,
        rationale: 'HR < 100 bpm or absent/inadequate breathing → begin PPV immediately.',
        status: 'pending',
      },
      // ── PPV (30 s – 60 s) ────────────────────────────────────────────────
      {
        id: 'nrp_ppv_start',
        phase: 'Positive Pressure Ventilation (30–60 s)',
        action: 'Begin PPV at 40–60 breaths/min. Start with 21% O₂ (term) or 21–30% O₂ (preterm < 35 wk).',
        rationale: 'PPV is the cornerstone of NRP. Room air is as effective as 100% O₂ for term infants and avoids oxidative injury.',
        safetyWarning: 'Use T-piece resuscitator or self-inflating bag. Confirm chest rise — if absent, reposition, suction, open mouth, increase pressure.',
        status: 'pending',
      },
      {
        id: 'nrp_ppv_mrsopa',
        phase: 'Positive Pressure Ventilation (30–60 s)',
        action: 'If no chest rise: apply MR SOPA — Mask adjustment → Reposition → Suction → Open mouth → Pressure increase → Airway alternative (LMA/ETT).',
        rationale: 'MR SOPA is the NRP corrective steps sequence. Work through each step before escalating.',
        status: 'pending',
      },
      {
        id: 'nrp_reassess_60s',
        phase: 'Positive Pressure Ventilation (30–60 s)',
        action: 'Reassess HR after 30 s of effective PPV.',
        isReassessment: true,
        rationale: 'If HR ≥ 100 and breathing → wean PPV. If HR 60–100 → continue PPV, consider intubation. If HR < 60 → begin chest compressions.',
        status: 'pending',
      },
      // ── Chest Compressions (60 s+) ───────────────────────────────────────
      {
        id: 'nrp_compressions',
        phase: 'Chest Compressions (if HR < 60 after effective PPV)',
        action: 'Begin chest compressions. Two-thumb encircling technique. Compress lower 1/3 sternum, depth 1/3 AP diameter. Ratio 3:1 (3 compressions : 1 breath) = 90 compressions + 30 breaths/min.',
        rationale: 'Neonatal cardiac arrest is almost always respiratory in origin. Compressions are only needed if PPV has failed to restore HR.',
        safetyWarning: 'Increase FiO₂ to 100% when starting compressions. Intubate if not already done.',
        status: 'pending',
      },
      {
        id: 'nrp_intubate',
        phase: 'Chest Compressions (if HR < 60 after effective PPV)',
        action: `Intubate for definitive airway. ETT size: ${w < 1 ? '2.5' : w < 2 ? '3.0' : '3.5'} mm. Depth: ${round1(w + 6)} cm at lip.`,
        rationale: 'ETT provides reliable airway for sustained PPV during compressions. Confirm with CO₂ detector and bilateral breath sounds.',
        status: 'pending',
      },
      {
        id: 'nrp_reassess_compressions',
        phase: 'Chest Compressions (if HR < 60 after effective PPV)',
        action: 'Reassess HR every 60 seconds during compressions.',
        isReassessment: true,
        rationale: 'If HR ≥ 60 → stop compressions, continue PPV. If HR < 60 after 60 s of compressions → give epinephrine.',
        status: 'pending',
      },
      // ── Medications ──────────────────────────────────────────────────────
      {
        id: 'nrp_epinephrine',
        phase: 'Medications (if HR < 60 after 60 s of compressions)',
        action: `Give Epinephrine IV/IO: 0.01–0.03 mg/kg (0.1–0.3 mL/kg of 1:10,000 solution).`,
        doses: [
          {
            drug: 'Epinephrine 1:10,000 (0.1 mg/mL)',
            dose: '0.01–0.03 mg/kg IV/IO',
            calculated: `${epiMl}–${round1(epiMl * 3)} mL IV/IO (for ${w} kg)`,
            route: 'IV/IO preferred; ET: 0.05–0.1 mg/kg if no IV/IO',
            maxDose: '1 mg per dose',
            notes: 'Repeat every 3–5 min if HR remains < 60. ET dose is 5–10× higher and less reliable.',
          },
        ],
        safetyWarning: 'Do NOT give epinephrine via ET tube unless IV/IO access is impossible. ET absorption is unpredictable.',
        status: 'pending',
      },
      {
        id: 'nrp_volume',
        phase: 'Medications (if HR < 60 after 60 s of compressions)',
        action: `If hypovolaemia suspected (pale, weak pulses, history of blood loss): give Normal Saline ${volumeBolusML} mL IV/IO over 5–10 min.`,
        doses: [
          {
            drug: 'Normal Saline 0.9%',
            dose: '10 mL/kg IV/IO',
            calculated: `${volumeBolusML} mL IV/IO over 5–10 min`,
            route: 'IV/IO',
            notes: 'O-negative blood if haemorrhagic shock. Avoid albumin as first-line.',
          },
        ],
        status: 'pending',
      },
      {
        id: 'nrp_post_resus',
        phase: 'Post-Resuscitation',
        action: 'Stabilise: maintain normothermia (36.5–37.5 °C), normoglycaemia (BSL ≥ 2.6 mmol/L), avoid hyperoxia (SpO₂ 91–95%). Consider therapeutic hypothermia if ≥ 36 wk GA with moderate-severe HIE.',
        rationale: 'Post-resuscitation care is as critical as the resuscitation itself. Hyperoxia, hypoglycaemia, and hyperthermia all worsen neurological outcomes.',
        status: 'pending',
      },
    ],
  };
}

// ─── 7.2a  Anaphylaxis (WAO / RCUK / AHA PALS 2020) ─────────────────────────

function buildAnaphylaxisProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight > 0 ? weight : 20;
  const epiIMDose = roundDose(0.01 * w, 0.5);       // 0.01 mg/kg IM, max 0.5 mg
  const epiIVDose = roundDose(0.001 * w * 1000, 500); // 1 mcg/kg IV, max 500 mcg
  const epiIVMl = round1(0.001 * w);                 // mL of 1:1000 for IV (diluted)
  const chlorphenamineDose = w < 6 ? 2.5 : w < 12 ? 5 : w < 18 ? 10 : 10;
  const hydrocortisoneDose = w < 6 ? 25 : w < 12 ? 50 : w < 18 ? 100 : 200;
  const salineBolus = round1(10 * w);
  const salbutamolPuffs = w < 20 ? 4 : 8;

  return {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    shortName: 'Anaphylaxis',
    icon: '⚡',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    triggerFindings: ['urticaria', 'angioedema', 'stridor', 'wheeze', 'hypotension', 'collapse'],
    monitoringTargets: [
      'HR, BP, SpO₂ every 5 min until stable',
      'Observe minimum 4–6 hours after epinephrine (12 h if severe/biphasic risk)',
      'SpO₂ ≥ 95% on supplemental O₂',
      'Systolic BP > 70 + (2 × age in years) mmHg',
      'Resolution of urticaria, angioedema, and bronchospasm',
    ],
    keyPitfalls: [
      'Epinephrine IM is ALWAYS first-line — do not delay for antihistamines or steroids',
      'Antihistamines and steroids do NOT treat airway compromise or cardiovascular collapse',
      'Biphasic reaction occurs in 5–20% — observe for minimum 4–6 hours',
      'Supine position with legs elevated improves venous return in shock',
      'If patient is upright and has respiratory compromise, do NOT force to lie down',
      'IV epinephrine is for refractory anaphylaxis only — use with extreme caution',
    ],
    references: [
      'WAO Anaphylaxis Guidelines 2020',
      'RCUK Emergency Treatment of Anaphylactic Reactions 2021',
      'AHA PALS 2020',
    ],
    steps: [
      // ── Immediate ────────────────────────────────────────────────────────
      {
        id: 'ana_remove_trigger',
        phase: 'Immediate (0–2 min)',
        action: 'Remove/stop the trigger (stop IV infusion, remove sting if visible). Call for help. Activate emergency response.',
        status: 'pending',
      },
      {
        id: 'ana_epi_im',
        phase: 'Immediate (0–2 min)',
        action: `Give Epinephrine IM (anterolateral mid-thigh): 0.01 mg/kg, max 0.5 mg. Repeat every 5–15 min if no improvement.`,
        doses: [
          {
            drug: 'Epinephrine 1:1,000 (1 mg/mL)',
            dose: '0.01 mg/kg IM',
            calculated: `${epiIMDose} mg IM (${round1(epiIMDose)} mL of 1:1,000) for ${w} kg`,
            route: 'IM anterolateral thigh',
            maxDose: '0.5 mg',
            notes: 'Auto-injector: < 15 kg → 0.15 mg; ≥ 15 kg → 0.3 mg. Repeat every 5–15 min PRN.',
          },
        ],
        safetyWarning: 'IM thigh is preferred over deltoid — faster absorption. NEVER give undiluted epinephrine IV bolus.',
        status: 'pending',
      },
      {
        id: 'ana_position',
        phase: 'Immediate (0–2 min)',
        action: 'Position: supine with legs elevated (shock). Sitting up if respiratory distress. Recovery position if unconscious.',
        rationale: 'Positional change can cause fatal cardiovascular collapse in anaphylaxis — do not allow patient to stand or sit up suddenly.',
        status: 'pending',
      },
      {
        id: 'ana_o2_airway',
        phase: 'Immediate (0–2 min)',
        action: 'Give high-flow O₂ (15 L/min via non-rebreather mask). Prepare for airway management — angioedema can progress rapidly.',
        safetyWarning: 'Early intubation if stridor, hoarse voice, or progressive angioedema. Airway can close within minutes.',
        status: 'pending',
      },
      // ── IV Access & Fluids ───────────────────────────────────────────────
      {
        id: 'ana_iv_fluids',
        phase: 'IV Access & Fluids (2–5 min)',
        action: `Establish IV/IO access. If hypotensive or shocked: give Normal Saline ${salineBolus} mL (10 mL/kg) IV over 5–10 min. Repeat PRN.`,
        doses: [
          {
            drug: 'Normal Saline 0.9%',
            dose: '10 mL/kg IV bolus',
            calculated: `${salineBolus} mL IV over 5–10 min`,
            route: 'IV/IO',
            notes: 'Repeat bolus if still hypotensive. Large volumes may be needed in distributive shock.',
          },
        ],
        status: 'pending',
      },
      // ── Adjuncts ─────────────────────────────────────────────────────────
      {
        id: 'ana_antihistamine',
        phase: 'Adjunct Medications (after epinephrine)',
        action: `Give Chlorphenamine (H1 blocker) IV/IM: ${chlorphenamineDose} mg. Adjunct only — does NOT treat airway or haemodynamic compromise.`,
        doses: [
          {
            drug: 'Chlorphenamine (Chlorpheniramine)',
            dose: w < 6 ? '2.5 mg' : w < 12 ? '5 mg' : '10 mg',
            calculated: `${chlorphenamineDose} mg IV/IM`,
            route: 'IV slow push or IM',
            notes: 'H1 blocker for urticaria/pruritus. Not life-saving. Give after epinephrine.',
          },
        ],
        status: 'pending',
      },
      {
        id: 'ana_steroid',
        phase: 'Adjunct Medications (after epinephrine)',
        action: `Give Hydrocortisone IV: ${hydrocortisoneDose} mg. Prevents/reduces biphasic reaction. Not immediate-acting.`,
        doses: [
          {
            drug: 'Hydrocortisone',
            dose: w < 6 ? '25 mg' : w < 12 ? '50 mg' : w < 18 ? '100 mg' : '200 mg',
            calculated: `${hydrocortisoneDose} mg IV`,
            route: 'IV slow push',
            notes: 'Takes 4–6 hours to work. Does NOT replace epinephrine. Reduces risk of biphasic reaction.',
          },
        ],
        status: 'pending',
      },
      {
        id: 'ana_bronchospasm',
        phase: 'Adjunct Medications (after epinephrine)',
        action: `If bronchospasm persists after epinephrine: give Salbutamol ${salbutamolPuffs} puffs via spacer (or 2.5 mg nebulised).`,
        doses: [
          {
            drug: 'Salbutamol MDI + spacer',
            dose: `${salbutamolPuffs} puffs (100 mcg/puff)`,
            calculated: `${salbutamolPuffs} puffs via spacer OR 2.5 mg nebulised`,
            route: 'Inhaled',
            notes: 'Adjunct for bronchospasm only. Epinephrine is still primary treatment.',
          },
        ],
        status: 'pending',
      },
      // ── Refractory ───────────────────────────────────────────────────────
      {
        id: 'ana_refractory_epi_iv',
        phase: 'Refractory Anaphylaxis (no response to 2× IM epinephrine)',
        action: `Refractory: give Epinephrine IV infusion 0.1–1 mcg/kg/min. Start at 0.1 mcg/kg/min and titrate.`,
        doses: [
          {
            drug: 'Epinephrine IV infusion',
            dose: '0.1–1 mcg/kg/min',
            calculated: `Start: ${round1(0.1 * w)} mcg/min IV infusion`,
            route: 'IV infusion (diluted)',
            maxDose: '10 mcg/kg/min',
            notes: 'Dilute: 0.3 mg/kg in 50 mL NS → 1 mL/hr = 0.1 mcg/kg/min. Requires cardiac monitoring.',
          },
        ],
        safetyWarning: 'IV epinephrine infusion requires cardiac monitoring. Risk of arrhythmia and hypertensive crisis.',
        status: 'pending',
      },
      {
        id: 'ana_glucagon',
        phase: 'Refractory Anaphylaxis (no response to 2× IM epinephrine)',
        action: `If on beta-blockers (epinephrine-resistant): give Glucagon 20–30 mcg/kg IV over 5 min (max 1 mg).`,
        doses: [
          {
            drug: 'Glucagon',
            dose: '20–30 mcg/kg IV',
            calculated: `${roundDose(0.025 * w, 1)} mg IV over 5 min`,
            route: 'IV slow push',
            maxDose: '1 mg',
            notes: 'Bypasses beta-blockade. Causes vomiting — have suction ready.',
          },
        ],
        status: 'pending',
      },
      // ── Reassessment & Discharge ─────────────────────────────────────────
      {
        id: 'ana_reassess',
        phase: 'Reassessment',
        action: 'Reassess HR, BP, SpO₂, skin, and airway every 5 min. Observe minimum 4–6 hours after last epinephrine dose.',
        isReassessment: true,
        rationale: 'Biphasic anaphylaxis occurs in 5–20% of cases, typically within 8 hours. High-risk patients (severe initial reaction, unknown trigger) observe 12–24 hours.',
        status: 'pending',
      },
      {
        id: 'ana_discharge_plan',
        phase: 'Discharge Planning',
        action: 'Prescribe epinephrine auto-injector × 2. Refer to allergy specialist. Provide written anaphylaxis action plan. Educate on trigger avoidance.',
        status: 'pending',
      },
    ],
  };
}

// ─── 7.2b  Severe Asthma / Status Asthmaticus (GINA 2023 / BTS / AHA PALS) ──

function buildSevereAsthmaProtocol(weight: number, ageCategory: string): ConditionProtocol {
  const w = weight > 0 ? weight : 20;
  const isInfant = ageCategory === 'infant' || ageCategory === 'neonate';
  const salbutamolNebDose = w < 20 ? 2.5 : 5;
  const salbutamolPuffs = w < 20 ? 4 : 8;
  const ipratropiumNebDose = w < 20 ? 0.25 : 0.5;
  const prednisoloneDose = roundDose(1 * w, 40);
  const hydrocortisoneDose = roundDose(4 * w, 200);
  const mgSO4Dose = roundDose(40 * w, 2000);         // 40 mg/kg, max 2 g
  const mgSO4Vol = round1(mgSO4Dose / 500);           // 500 mg/mL = 50% solution → dilute to 20 mg/mL
  const aminophyllineDose = roundDose(5 * w, 500);    // 5 mg/kg loading
  const salbutamolIVDose = round1(0.001 * w);         // 1 mcg/kg/min start → mL/hr calculation

  return {
    id: 'severe_asthma',
    name: 'Severe Asthma / Status Asthmaticus',
    shortName: 'Severe Asthma',
    icon: '🫁',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    triggerFindings: ['wheeze', 'increased_wob', 'tachypnoea', 'hypoxia', 'silent_chest'],
    monitoringTargets: [
      'SpO₂ ≥ 94% on supplemental O₂',
      'RR trending down toward normal for age',
      'Wheeze improving (note: silent chest = severe obstruction)',
      'PEFR ≥ 50% predicted after treatment (if measurable)',
      'HR normalising (salbutamol causes tachycardia — distinguish from deterioration)',
      'Avoid hypercapnia — rising CO₂ in asthma = impending respiratory failure',
    ],
    keyPitfalls: [
      'Silent chest = no air movement = life-threatening — do NOT be reassured',
      'Salbutamol causes tachycardia — do not reduce dose for HR alone',
      'Avoid sedation unless intubating — it causes respiratory depression',
      'Heliox (70:30) reduces airway resistance — consider if available',
      'MgSO₄ is safe and effective — do not delay in severe/life-threatening asthma',
      'Intubation in asthma is high-risk — use ketamine for RSI, avoid succinylcholine if possible',
      'Post-intubation: use long expiratory time (I:E 1:3–1:4) to avoid air-trapping',
    ],
    references: [
      'GINA 2023 Severe Asthma Guidelines',
      'BTS/SIGN British Guideline on the Management of Asthma 2022',
      'AHA PALS 2020',
    ],
    steps: [
      // ── Immediate ────────────────────────────────────────────────────────
      {
        id: 'asthma_o2',
        phase: 'Immediate (0–5 min)',
        action: 'Give supplemental O₂ to maintain SpO₂ ≥ 94%. High-flow via NRB mask if SpO₂ < 90%.',
        status: 'pending',
      },
      {
        id: 'asthma_salbutamol_neb',
        phase: 'Immediate (0–5 min)',
        action: `Give Salbutamol nebulised: ${salbutamolNebDose} mg (2.5 mg if < 20 kg). Drive with O₂ at 6–8 L/min. Repeat every 20 min × 3 in first hour if severe.`,
        doses: [
          {
            drug: 'Salbutamol (Albuterol) nebulised',
            dose: `${salbutamolNebDose} mg nebulised`,
            calculated: `${salbutamolNebDose} mg in 3 mL NS via nebuliser (O₂-driven)`,
            route: 'Nebulised',
            notes: `Alternatively: ${salbutamolPuffs} puffs via MDI + spacer (equivalent efficacy in mild-moderate). Repeat every 20 min × 3 if severe.`,
          },
        ],
        status: 'pending',
      },
      {
        id: 'asthma_ipratropium',
        phase: 'Immediate (0–5 min)',
        action: `Add Ipratropium bromide nebulised: ${ipratropiumNebDose} mg. Give with first 3 salbutamol doses in severe/life-threatening asthma.`,
        doses: [
          {
            drug: 'Ipratropium bromide',
            dose: `${ipratropiumNebDose} mg nebulised`,
            calculated: `${ipratropiumNebDose} mg (${ipratropiumNebDose === 0.25 ? '1 mL' : '2 mL'} of 0.25 mg/mL) in 3 mL NS`,
            route: 'Nebulised with salbutamol',
            notes: 'Add to first 3 salbutamol doses. Reduces hospitalisation in severe asthma. Not for maintenance.',
          },
        ],
        status: 'pending',
      },
      // ── Steroids ─────────────────────────────────────────────────────────
      {
        id: 'asthma_steroid',
        phase: 'Steroids (give within 1 hour)',
        action: `Give systemic corticosteroid: Prednisolone oral ${prednisoloneDose} mg (1 mg/kg, max 40 mg) OR Hydrocortisone IV ${hydrocortisoneDose} mg (4 mg/kg, max 200 mg) if unable to swallow.`,
        doses: [
          {
            drug: 'Prednisolone oral',
            dose: '1–2 mg/kg/day',
            calculated: `${prednisoloneDose} mg oral (1 mg/kg, max 40 mg)`,
            route: 'Oral (preferred)',
            notes: 'Continue for 3–5 days. No taper needed for short courses.',
          },
          {
            drug: 'Hydrocortisone IV',
            dose: '4 mg/kg IV',
            calculated: `${hydrocortisoneDose} mg IV (if oral not possible)`,
            route: 'IV slow push',
            maxDose: '200 mg',
          },
        ],
        status: 'pending',
      },
      // ── Reassessment ─────────────────────────────────────────────────────
      {
        id: 'asthma_reassess_20min',
        phase: 'Reassessment (20 min)',
        action: 'Reassess: SpO₂, RR, WOB, wheeze, HR. Classify response: Good (SpO₂ ≥ 94%, improving) → continue. Incomplete → escalate. Poor/Life-threatening → immediate escalation.',
        isReassessment: true,
        status: 'pending',
      },
      // ── Escalation ───────────────────────────────────────────────────────
      {
        id: 'asthma_mgso4',
        phase: 'Escalation — Severe/Life-Threatening (no response to initial treatment)',
        action: `Give IV Magnesium Sulphate: 40 mg/kg (max 2 g) over 20 min.`,
        doses: [
          {
            drug: 'Magnesium Sulphate 50% (500 mg/mL)',
            dose: '40 mg/kg IV over 20 min',
            calculated: `${mgSO4Dose} mg (${round1(mgSO4Dose / 500)} mL of 50% solution) diluted to 20 mg/mL → give over 20 min`,
            route: 'IV infusion',
            maxDose: '2 g (2000 mg)',
            notes: 'Dilute 50% MgSO₄ with NS before giving. Monitor for hypotension and loss of deep tendon reflexes.',
          },
        ],
        safetyWarning: 'Monitor BP during infusion. Stop if hypotension or loss of patellar reflex (signs of toxicity). Calcium gluconate is antidote.',
        status: 'pending',
      },
      {
        id: 'asthma_salbutamol_iv',
        phase: 'Escalation — Severe/Life-Threatening (no response to initial treatment)',
        action: `If nebulised salbutamol failing: give IV Salbutamol infusion. Loading: 5 mcg/kg over 10 min, then 1–5 mcg/kg/min infusion.`,
        doses: [
          {
            drug: 'Salbutamol IV infusion',
            dose: 'Loading: 5 mcg/kg over 10 min; Maintenance: 1–5 mcg/kg/min',
            calculated: `Loading: ${roundDose(5 * w, 250)} mcg over 10 min. Start infusion at ${round1(1 * w)} mcg/min (1 mcg/kg/min).`,
            route: 'IV infusion',
            notes: 'Dilute: 5 mg (5 mL of 1 mg/mL) in 45 mL NS = 100 mcg/mL. Requires cardiac monitoring — causes tachycardia and hypokalaemia.',
          },
        ],
        safetyWarning: 'Monitor potassium — salbutamol causes hypokalaemia. Replace K⁺ if < 3.5 mmol/L.',
        status: 'pending',
      },
      {
        id: 'asthma_aminophylline',
        phase: 'Escalation — Severe/Life-Threatening (no response to initial treatment)',
        action: `Consider IV Aminophylline if not on theophylline: loading dose ${aminophyllineDose} mg over 20–30 min, then infusion.`,
        doses: [
          {
            drug: 'Aminophylline IV',
            dose: '5 mg/kg loading over 20–30 min',
            calculated: `${aminophyllineDose} mg IV over 20–30 min (omit loading if on theophylline)`,
            route: 'IV infusion',
            maxDose: '500 mg loading',
            notes: 'Maintenance: 0.5–1 mg/kg/hr. Monitor levels — narrow therapeutic index. Risk of arrhythmia.',
          },
        ],
        safetyWarning: 'Do NOT give loading dose if patient is already on theophylline/aminophylline — risk of toxicity and fatal arrhythmia.',
        status: 'pending',
      },
      // ── Intubation ───────────────────────────────────────────────────────
      {
        id: 'asthma_intubation',
        phase: 'Intubation (life-threatening, impending respiratory failure)',
        action: 'Indications: exhaustion, rising CO₂ (> 45 mmHg), SpO₂ < 90% despite max O₂, altered consciousness, respiratory arrest.',
        safetyWarning: `RSI: Ketamine ${roundDose(1.5 * w, 200)} mg IV (1.5 mg/kg — bronchodilator) + Rocuronium ${roundDose(1.2 * w, 200)} mg IV (1.2 mg/kg). Avoid succinylcholine if possible. Post-intubation: long expiratory time (I:E 1:3), low RR (10–12/min), permissive hypercapnia (CO₂ 45–55 acceptable).`,
        status: 'pending',
      },
      // ── Final Reassessment ───────────────────────────────────────────────
      {
        id: 'asthma_final_reassess',
        phase: 'Reassessment',
        action: 'Reassess every 30 min. Criteria for ICU admission: SpO₂ < 92% on O₂, rising CO₂, poor response to treatment, need for IV bronchodilators.',
        isReassessment: true,
        status: 'pending',
      },
    ],
  };
}

// ─── Update ConditionId type and registry ────────────────────────────────────
// NOTE: The ConditionId type is extended below by declaration merging is not
// possible in TypeScript. Instead we re-export an extended union and updated
// functions. The original type in the file header is kept for backward compat;
// consumers should use ExtendedConditionId for Phase 7+ protocols.

export type ExtendedConditionId =
  | 'septic_shock'
  | 'status_epilepticus'
  | 'dka'
  | 'nrp'
  | 'anaphylaxis'
  | 'severe_asthma';

export function buildExtendedProtocol(
  id: ExtendedConditionId,
  weight: number,
  ageCategory: string
): ConditionProtocol {
  switch (id) {
    case 'septic_shock':      return buildSepticShockProtocol(weight, ageCategory);
    case 'status_epilepticus': return buildStatusEpilepticusProtocol(weight, ageCategory);
    case 'dka':               return buildDKAProtocol(weight, ageCategory);
    case 'nrp':               return buildNRPProtocol(weight, ageCategory);
    case 'anaphylaxis':       return buildAnaphylaxisProtocol(weight, ageCategory);
    case 'severe_asthma':     return buildSevereAsthmaProtocol(weight, ageCategory);
  }
}

export function buildAllExtendedProtocols(
  weight: number,
  ageCategory: string
): Record<ExtendedConditionId, ConditionProtocol> {
  return {
    septic_shock:       buildSepticShockProtocol(weight, ageCategory),
    status_epilepticus: buildStatusEpilepticusProtocol(weight, ageCategory),
    dka:                buildDKAProtocol(weight, ageCategory),
    nrp:                buildNRPProtocol(weight, ageCategory),
    anaphylaxis:        buildAnaphylaxisProtocol(weight, ageCategory),
    severe_asthma:      buildSevereAsthmaProtocol(weight, ageCategory),
  };
}

export const EXTENDED_PROTOCOL_LIST: ExtendedConditionId[] = [
  'septic_shock',
  'status_epilepticus',
  'dka',
  'nrp',
  'anaphylaxis',
  'severe_asthma',
];

export const PROTOCOL_META: Record<ExtendedConditionId, { name: string; shortName: string; icon: string; color: string; bgColor: string }> = {
  septic_shock:       { name: 'Septic Shock',                    shortName: 'Septic Shock',   icon: '🦠', color: 'text-orange-700', bgColor: 'bg-orange-50' },
  status_epilepticus: { name: 'Status Epilepticus',              shortName: 'Status Epi',     icon: '⚡', color: 'text-purple-700', bgColor: 'bg-purple-50' },
  dka:                { name: 'Diabetic Ketoacidosis (DKA)',      shortName: 'DKA',            icon: '🩸', color: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  nrp:                { name: 'Neonatal Resuscitation (NRP)',     shortName: 'NRP',            icon: '👶', color: 'text-pink-700',   bgColor: 'bg-pink-50'   },
  anaphylaxis:        { name: 'Anaphylaxis',                     shortName: 'Anaphylaxis',    icon: '⚡', color: 'text-red-700',    bgColor: 'bg-red-50'    },
  severe_asthma:      { name: 'Severe Asthma / Status Asthmaticus', shortName: 'Severe Asthma', icon: '🫁', color: 'text-blue-700',   bgColor: 'bg-blue-50'   },
};
