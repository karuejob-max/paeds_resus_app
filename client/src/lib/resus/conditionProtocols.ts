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
