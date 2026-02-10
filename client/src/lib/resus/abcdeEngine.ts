/**
 * ResusGPS ABCDE Engine
 * 
 * This is the clinical brain. It follows how real resuscitations work:
 * 
 * 1. QUICK ASSESSMENT (PAT) → Sick or Not Sick? (5 seconds)
 * 2. PRIMARY SURVEY (XABCDE) → Find threats, treat each immediately
 *    - Multiple threats can coexist
 *    - Each threat gets an immediate intervention
 *    - System guides through X→A→B→C→D→E in order
 * 3. SECONDARY SURVEY → SAMPLE history, narrow differentials, definitive diagnosis
 * 4. DEFINITIVE CARE → Protocol-specific management (DKA, Sepsis, etc.)
 * 5. ONGOING → Monitor, reassess, manage complications
 * 
 * The system is ADDITIVE: findings accumulate, threats stack, interventions layer.
 * The system THINKS AHEAD: safety checks flag risks before they become emergencies.
 */

// ─── Types ──────────────────────────────────────────────────

export type Phase =
  | 'IDLE'
  | 'QUICK_ASSESSMENT'
  | 'PRIMARY_SURVEY'
  | 'INTERVENTION'
  | 'SECONDARY_SURVEY'
  | 'DEFINITIVE_CARE'
  | 'ONGOING'
  | 'CARDIAC_ARREST';

export type ABCDELetter = 'X' | 'A' | 'B' | 'C' | 'D' | 'E';

export type Severity = 'critical' | 'urgent' | 'monitor';

export interface Finding {
  id: string;
  letter: ABCDELetter;
  description: string;
  severity: Severity;
  timestamp: number;
}

export interface Threat {
  id: string;
  letter: ABCDELetter;
  name: string;
  severity: Severity;
  interventions: Intervention[];
  resolved: boolean;
  findings: string[]; // finding IDs that contributed to this threat
}

export interface DoseInfo {
  drug: string;
  dosePerKg: number;
  unit: string;
  route: string;
  maxDose?: number;
  concentration?: string;
  preparation?: string;
  frequency?: string;
  notes?: string;
}

export interface Intervention {
  id: string;
  action: string;
  detail?: string;
  dose?: DoseInfo;
  timerSeconds?: number;
  reassessAfter?: string;
  critical?: boolean;
  completed: boolean;
  completedAt?: number;
  skipped?: boolean;
}

export interface SafetyAlert {
  id: string;
  message: string;
  severity: 'warning' | 'danger';
  timestamp: number;
  acknowledged: boolean;
  relatedThreatId?: string;
}

export interface SAMPLEHistory {
  signs: string;
  allergies: string;
  medications: string;
  pastHistory: string;
  lastMeal: string;
  events: string;
}

export interface ClinicalEvent {
  timestamp: number;
  type: 'phase_change' | 'finding' | 'threat_identified' | 'intervention_started'
    | 'intervention_completed' | 'safety_alert' | 'reassessment' | 'vital_sign'
    | 'diagnosis' | 'note' | 'cardiac_arrest_start' | 'rosc';
  letter?: ABCDELetter;
  detail: string;
  data?: Record<string, unknown>;
}

export interface ResusSession {
  phase: Phase;
  currentLetter: ABCDELetter;
  quickAssessment: 'sick' | 'not_sick' | null;
  findings: Finding[];
  threats: Threat[];
  safetyAlerts: SafetyAlert[];
  sampleHistory: Partial<SAMPLEHistory>;
  definitiveDiagnosis: string | null;
  patientWeight: number | null;
  patientAge: string | null;
  isTrauma: boolean;
  events: ClinicalEvent[];
  startTime: number;
  activeTimers: { interventionId: string; endsAt: number }[];
  bolusCount: number; // track fluid boluses for safety checks
  insulinRunning: boolean;
  potassiumAdded: boolean;
}

// ─── ABCDE Assessment Questions ─────────────────────────────
// Each letter has focused questions. Provider reports what they FIND.
// System identifies threats from findings.

export interface AssessmentQuestion {
  id: string;
  letter: ABCDELetter;
  text: string;
  options: { label: string; value: string; severity?: Severity; icon?: string }[];
}

// The questions for each ABCDE letter
export const primarySurveyQuestions: Record<ABCDELetter, AssessmentQuestion[]> = {
  X: [
    {
      id: 'catastrophic_hemorrhage',
      letter: 'X',
      text: 'Is there catastrophic / life-threatening external bleeding?',
      options: [
        { label: 'YES — Massive bleeding', value: 'yes', severity: 'critical', icon: '🩸' },
        { label: 'NO', value: 'no', icon: '✓' },
      ]
    }
  ],
  A: [
    {
      id: 'airway_status',
      letter: 'A',
      text: 'Airway status?',
      options: [
        { label: 'PATENT — Speaking / Crying', value: 'patent', icon: '✓' },
        { label: 'AT RISK — Vomiting / Secretions', value: 'at_risk', severity: 'urgent', icon: '⚠️' },
        { label: 'OBSTRUCTED — Stridor / No air movement', value: 'obstructed', severity: 'critical', icon: '🚨' },
      ]
    }
  ],
  B: [
    {
      id: 'breathing_effort',
      letter: 'B',
      text: 'Breathing effort?',
      options: [
        { label: 'NORMAL', value: 'normal', icon: '✓' },
        { label: 'LABORED — Retractions / Accessory muscles', value: 'labored', severity: 'urgent', icon: '⚠️' },
        { label: 'ABSENT / AGONAL', value: 'absent', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'breathing_sounds',
      letter: 'B',
      text: 'What do you hear?',
      options: [
        { label: 'CLEAR', value: 'clear', icon: '✓' },
        { label: 'WHEEZING', value: 'wheezing', severity: 'urgent', icon: '🫁' },
        { label: 'CRACKLES / RALES', value: 'crackles', severity: 'urgent', icon: '💧' },
        { label: 'STRIDOR', value: 'stridor', severity: 'critical', icon: '🚨' },
        { label: 'ABSENT BREATH SOUNDS', value: 'absent', severity: 'critical', icon: '🚨' },
        { label: 'DEEP & LABORED (Kussmaul)', value: 'kussmaul', severity: 'urgent', icon: '⚠️' },
      ]
    },
    {
      id: 'spo2',
      letter: 'B',
      text: 'SpO2 reading?',
      options: [
        { label: '≥ 94%', value: 'normal', icon: '✓' },
        { label: '90-93%', value: 'low', severity: 'urgent', icon: '⚠️' },
        { label: '< 90%', value: 'critical', severity: 'critical', icon: '🚨' },
        { label: 'NOT AVAILABLE', value: 'unknown', icon: '❓' },
      ]
    },
  ],
  C: [
    {
      id: 'pulse_status',
      letter: 'C',
      text: 'Pulse?',
      options: [
        { label: 'STRONG & REGULAR', value: 'strong', icon: '✓' },
        { label: 'WEAK / THREADY', value: 'weak', severity: 'urgent', icon: '⚠️' },
        { label: 'RAPID (Tachycardia)', value: 'rapid', severity: 'urgent', icon: '⚠️' },
        { label: 'SLOW (Bradycardia)', value: 'slow', severity: 'urgent', icon: '⚠️' },
        { label: 'IRREGULAR', value: 'irregular', severity: 'urgent', icon: '⚠️' },
        { label: 'ABSENT', value: 'absent', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'perfusion',
      letter: 'C',
      text: 'Perfusion / Skin?',
      options: [
        { label: 'WARM, PINK, CRT < 2s', value: 'normal', icon: '✓' },
        { label: 'COOL PERIPHERIES, CRT 2-4s', value: 'poor', severity: 'urgent', icon: '⚠️' },
        { label: 'COLD, MOTTLED, CRT > 4s', value: 'very_poor', severity: 'critical', icon: '🚨' },
        { label: 'WARM & FLUSHED (Warm shock)', value: 'warm_shock', severity: 'urgent', icon: '🔥' },
      ]
    },
    {
      id: 'bleeding',
      letter: 'C',
      text: 'Any ongoing bleeding or fluid loss?',
      options: [
        { label: 'NO', value: 'no', icon: '✓' },
        { label: 'YES — Active bleeding', value: 'bleeding', severity: 'urgent', icon: '🩸' },
        { label: 'YES — Significant fluid loss (vomiting/diarrhea)', value: 'fluid_loss', severity: 'urgent', icon: '💧' },
      ]
    },
  ],
  D: [
    {
      id: 'consciousness',
      letter: 'D',
      text: 'Level of consciousness (AVPU)?',
      options: [
        { label: 'A — Alert', value: 'alert', icon: '✓' },
        { label: 'V — Responds to Voice', value: 'voice', severity: 'monitor', icon: '⚠️' },
        { label: 'P — Responds to Pain', value: 'pain', severity: 'urgent', icon: '🚨' },
        { label: 'U — Unresponsive', value: 'unresponsive', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'glucose',
      letter: 'D',
      text: 'Blood glucose?',
      options: [
        { label: 'NORMAL (4-11 mmol/L)', value: 'normal', icon: '✓' },
        { label: 'LOW (< 3.5 mmol/L)', value: 'low', severity: 'critical', icon: '🚨' },
        { label: 'HIGH (> 14 mmol/L)', value: 'high', severity: 'urgent', icon: '⚠️' },
        { label: 'VERY HIGH (> 20 mmol/L)', value: 'very_high', severity: 'critical', icon: '🚨' },
        { label: 'NOT CHECKED YET', value: 'unknown', icon: '❓' },
      ]
    },
    {
      id: 'pupils',
      letter: 'D',
      text: 'Pupils?',
      options: [
        { label: 'EQUAL & REACTIVE', value: 'normal', icon: '✓' },
        { label: 'UNEQUAL', value: 'unequal', severity: 'critical', icon: '🚨' },
        { label: 'FIXED & DILATED', value: 'fixed', severity: 'critical', icon: '🚨' },
        { label: 'PINPOINT', value: 'pinpoint', severity: 'urgent', icon: '⚠️' },
      ]
    },
    {
      id: 'seizure_activity',
      letter: 'D',
      text: 'Seizure activity?',
      options: [
        { label: 'NO', value: 'no', icon: '✓' },
        { label: 'YES — Currently seizing', value: 'active', severity: 'critical', icon: '🚨' },
        { label: 'POST-ICTAL', value: 'postictal', severity: 'urgent', icon: '⚠️' },
      ]
    },
  ],
  E: [
    {
      id: 'temperature',
      letter: 'E',
      text: 'Temperature?',
      options: [
        { label: 'NORMAL', value: 'normal', icon: '✓' },
        { label: 'FEVER (> 38°C)', value: 'fever', severity: 'urgent', icon: '🔥' },
        { label: 'HIGH FEVER (> 39.5°C)', value: 'high_fever', severity: 'urgent', icon: '🔥' },
        { label: 'HYPOTHERMIA (< 36°C)', value: 'hypothermia', severity: 'urgent', icon: '❄️' },
        { label: 'NOT CHECKED', value: 'unknown', icon: '❓' },
      ]
    },
    {
      id: 'rash',
      letter: 'E',
      text: 'Skin findings?',
      options: [
        { label: 'NONE', value: 'none', icon: '✓' },
        { label: 'URTICARIA / HIVES', value: 'urticaria', severity: 'urgent', icon: '⚠️' },
        { label: 'PETECHIAE / PURPURA', value: 'petechiae', severity: 'critical', icon: '🚨' },
        { label: 'SWELLING / ANGIOEDEMA', value: 'angioedema', severity: 'critical', icon: '🚨' },
        { label: 'BURNS', value: 'burns', severity: 'urgent', icon: '🔥' },
        { label: 'BRUISING (suspicious pattern)', value: 'nai_bruising', severity: 'urgent', icon: '⚠️' },
      ]
    },
    {
      id: 'other_exposure',
      letter: 'E',
      text: 'Any other findings?',
      options: [
        { label: 'NONE', value: 'none', icon: '✓' },
        { label: 'SUSPECTED INGESTION / POISONING', value: 'poisoning', severity: 'urgent', icon: '☠️' },
        { label: 'SIGNS OF ABUSE / NAI', value: 'nai', severity: 'urgent', icon: '⚠️' },
        { label: 'ALLERGIC REACTION SIGNS', value: 'allergic', severity: 'critical', icon: '🚨' },
      ]
    },
  ],
};

// ─── Threat Detection Rules ─────────────────────────────────
// Given findings, what threats exist? Each rule maps findings → threat + interventions.

type ThreatRule = {
  id: string;
  name: string;
  letter: ABCDELetter;
  severity: Severity;
  condition: (findings: Record<string, string>, session: ResusSession) => boolean;
  interventions: (session: ResusSession) => Intervention[];
};

function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}

function makeDose(drug: string, dosePerKg: number, unit: string, route: string, opts?: Partial<DoseInfo>): DoseInfo {
  return { drug, dosePerKg, unit, route, ...opts };
}

function calcDose(dose: DoseInfo, weightKg: number | null): string {
  if (!weightKg) return `${dose.dosePerKg} ${dose.unit}/kg ${dose.route}`;
  let amount = dose.dosePerKg * weightKg;
  if (dose.maxDose && amount > dose.maxDose) amount = dose.maxDose;
  const rounded = amount < 1 ? amount.toFixed(2) : amount < 10 ? amount.toFixed(1) : Math.round(amount).toString();
  return `${dose.drug} ${rounded} ${dose.unit} ${dose.route}${dose.maxDose && amount >= dose.maxDose ? ' (MAX DOSE)' : ''}`;
}

export { calcDose };

const threatRules: ThreatRule[] = [
  // ─── X: Catastrophic Hemorrhage ───
  {
    id: 'catastrophic_bleed',
    name: 'Catastrophic Hemorrhage',
    letter: 'X',
    severity: 'critical',
    condition: (f) => f.catastrophic_hemorrhage === 'yes',
    interventions: (s) => [
      { id: uid(), action: 'APPLY DIRECT PRESSURE', detail: 'Apply firm, direct pressure to bleeding site. Use tourniquet if limb and pressure fails.', critical: true, completed: false },
      { id: uid(), action: 'ACTIVATE MASSIVE TRANSFUSION', detail: 'Call for O-negative blood / massive transfusion protocol if available.', critical: true, completed: false },
      { id: uid(), action: 'TRANEXAMIC ACID (TXA)', dose: makeDose('TXA', 15, 'mg', 'IV over 10 min', { maxDose: 1000, notes: 'Give within 3 hours of injury' }), critical: true, completed: false },
    ]
  },
  // ─── A: Airway Threats ───
  {
    id: 'airway_obstruction',
    name: 'Airway Obstruction',
    letter: 'A',
    severity: 'critical',
    condition: (f) => f.airway_status === 'obstructed',
    interventions: () => [
      { id: uid(), action: 'OPEN AIRWAY', detail: 'Head-tilt chin-lift (or jaw thrust if trauma suspected). Suction if needed.', critical: true, completed: false },
      { id: uid(), action: 'INSERT AIRWAY ADJUNCT', detail: 'OPA if unconscious, NPA if semi-conscious. Size: corner of mouth to angle of jaw (OPA).', critical: true, completed: false },
      { id: uid(), action: 'PREPARE FOR INTUBATION', detail: 'If airway cannot be maintained, prepare RSI. Call for help.', completed: false },
    ]
  },
  {
    id: 'airway_at_risk',
    name: 'Airway At Risk',
    letter: 'A',
    severity: 'urgent',
    condition: (f) => f.airway_status === 'at_risk',
    interventions: () => [
      { id: uid(), action: 'POSITION & SUCTION', detail: 'Recovery position if appropriate. Suction oropharynx. Keep suction at bedside.', critical: true, completed: false },
      { id: uid(), action: 'MONITOR AIRWAY', detail: 'Reassess airway every 2 minutes. Have airway equipment ready.', timerSeconds: 120, reassessAfter: 'Is airway still patent?', completed: false },
    ]
  },
  // ─── B: Breathing Threats ───
  {
    id: 'apnea',
    name: 'Apnea / Absent Breathing',
    letter: 'B',
    severity: 'critical',
    condition: (f) => f.breathing_effort === 'absent',
    interventions: () => [
      { id: uid(), action: 'BAG-VALVE-MASK VENTILATION', detail: 'Start BVM at 12-20 breaths/min. Ensure chest rise. Two-person technique preferred.', critical: true, completed: false },
      { id: uid(), action: 'CHECK PULSE', detail: 'If no pulse → START CPR immediately.', critical: true, completed: false },
    ]
  },
  {
    id: 'bronchospasm',
    name: 'Bronchospasm / Wheezing',
    letter: 'B',
    severity: 'urgent',
    condition: (f) => f.breathing_sounds === 'wheezing',
    interventions: (s) => [
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: 'Apply high-flow O2 via non-rebreather mask. Target SpO2 ≥ 94%.', critical: true, completed: false },
      { id: uid(), action: 'SALBUTAMOL NEBULIZER', dose: makeDose('Salbutamol', 0.15, 'mg', 'nebulized', { maxDose: 5, preparation: '2.5mg if <20kg, 5mg if ≥20kg. Can repeat every 20 min x3.', frequency: 'Every 20 min x 3' }), timerSeconds: 1200, reassessAfter: 'Reassess work of breathing and SpO2 after nebulizer', completed: false },
      { id: uid(), action: 'IPRATROPIUM BROMIDE', dose: makeDose('Ipratropium', 250, 'mcg', 'nebulized', { preparation: '250mcg if <20kg, 500mcg if ≥20kg. Add to salbutamol neb.' }), detail: 'Add to salbutamol nebulizer for moderate-severe wheeze.', completed: false },
      { id: uid(), action: 'SYSTEMIC STEROIDS', dose: makeDose('Prednisolone', 1, 'mg', 'PO', { maxDose: 60, preparation: 'Or Dexamethasone 0.6mg/kg PO (max 16mg), or Methylprednisolone 2mg/kg IV (max 60mg)' }), completed: false },
    ]
  },
  {
    id: 'stridor',
    name: 'Stridor / Upper Airway Obstruction',
    letter: 'B',
    severity: 'critical',
    condition: (f) => f.breathing_sounds === 'stridor',
    interventions: (s) => [
      { id: uid(), action: 'KEEP PATIENT CALM', detail: 'Do NOT agitate. Allow position of comfort. Keep parent at bedside.', critical: true, completed: false },
      { id: uid(), action: 'NEBULIZED EPINEPHRINE', dose: makeDose('Epinephrine 1:1000', 0.5, 'mL/kg', 'nebulized', { maxDose: 5, preparation: 'Use 1:1000 (1mg/mL). Max 5mL. Can repeat once after 15 min.' }), critical: true, completed: false },
      { id: uid(), action: 'DEXAMETHASONE', dose: makeDose('Dexamethasone', 0.6, 'mg', 'PO/IM/IV', { maxDose: 16 }), completed: false },
    ]
  },
  {
    id: 'kussmaul_breathing',
    name: 'Kussmaul Breathing (Deep & Labored)',
    letter: 'B',
    severity: 'urgent',
    condition: (f) => f.breathing_sounds === 'kussmaul',
    interventions: () => [
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: 'Apply O2 via non-rebreather. This breathing pattern suggests severe metabolic acidosis.', critical: true, completed: false },
      { id: uid(), action: 'DO NOT INTUBATE UNLESS FAILING', detail: '⚠️ Kussmaul breathing is compensatory. Intubation may worsen acidosis. Only intubate if respiratory failure imminent.', critical: true, completed: false },
      { id: uid(), action: 'CHECK GLUCOSE & KETONES', detail: 'Kussmaul breathing + hyperglycemia = suspect DKA. Check blood glucose and urine/serum ketones urgently.', completed: false },
    ]
  },
  {
    id: 'hypoxia',
    name: 'Hypoxia',
    letter: 'B',
    severity: 'critical',
    condition: (f) => f.spo2 === 'critical',
    interventions: () => [
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: '15L/min via non-rebreather mask. Target SpO2 ≥ 94%.', critical: true, completed: false },
      { id: uid(), action: 'ASSESS FOR TENSION PNEUMOTHORAX', detail: 'If unilateral absent breath sounds + tracheal deviation → needle decompression.', completed: false },
    ]
  },
  {
    id: 'mild_hypoxia',
    name: 'Low SpO2',
    letter: 'B',
    severity: 'urgent',
    condition: (f) => f.spo2 === 'low',
    interventions: () => [
      { id: uid(), action: 'SUPPLEMENTAL OXYGEN', detail: 'Start O2 via nasal cannula or simple face mask. Target SpO2 ≥ 94%.', completed: false },
    ]
  },
  // ─── C: Circulation Threats ───
  {
    id: 'cardiac_arrest',
    name: 'CARDIAC ARREST — No Pulse',
    letter: 'C',
    severity: 'critical',
    condition: (f) => f.pulse_status === 'absent',
    interventions: (s) => [
      { id: uid(), action: 'START CPR', detail: 'Push hard, push fast. 100-120/min. Minimize interruptions. 15:2 ratio (2-rescuer pediatric) or 30:2 (single rescuer).', critical: true, completed: false, timerSeconds: 120, reassessAfter: 'Check rhythm after 2-minute CPR cycle' },
      { id: uid(), action: 'EPINEPHRINE', dose: makeDose('Epinephrine 1:10,000', 0.01, 'mg', 'IV/IO', { maxDose: 1, preparation: '0.1 mL/kg of 1:10,000. Give every 3-5 minutes.', frequency: 'Every 3-5 min' }), critical: true, completed: false },
      { id: uid(), action: 'CHECK RHYTHM — Shockable?', detail: 'VF/pVT → Defibrillate 2J/kg (1st), 4J/kg (2nd+). Asystole/PEA → Continue CPR + Epi.', critical: true, completed: false },
      { id: uid(), action: 'AMIODARONE (if VF/pVT after 3rd shock)', dose: makeDose('Amiodarone', 5, 'mg', 'IV/IO bolus', { maxDose: 300, preparation: 'If amiodarone unavailable: Lidocaine 1mg/kg IV/IO' }), completed: false },
      { id: uid(), action: 'REVIEW Hs & Ts', detail: 'Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia, Tension pneumo, Tamponade, Toxins, Thrombosis (pulmonary/coronary)', completed: false },
    ]
  },
  {
    id: 'cold_shock',
    name: 'Cold Shock (Poor Perfusion)',
    letter: 'C',
    severity: 'critical',
    condition: (f) => f.perfusion === 'very_poor' || (f.perfusion === 'poor' && (f.pulse_status === 'weak' || f.pulse_status === 'rapid')),
    interventions: (s) => [
      { id: uid(), action: 'IV/IO ACCESS', detail: 'Establish IV access. If unable within 90 seconds → IO access.', critical: true, completed: false },
      { id: uid(), action: 'FLUID BOLUS', dose: makeDose('Normal Saline 0.9%', 10, 'mL', 'IV/IO bolus over 10-20 min', { preparation: 'Use 10 mL/kg for suspected cardiogenic. 20 mL/kg for hypovolemic. Reassess after EACH bolus.' }), critical: true, completed: false, timerSeconds: 600, reassessAfter: 'Reassess perfusion, HR, BP, urine output after bolus' },
      { id: uid(), action: 'REASSESS AFTER BOLUS', detail: 'Check: HR, CRT, BP, mental status, urine output. If still in shock → repeat bolus (max 40-60 mL/kg in first hour). Watch for fluid overload (crackles, hepatomegaly, worsening respiratory distress).', completed: false },
    ]
  },
  {
    id: 'warm_shock',
    name: 'Warm Shock (Distributive)',
    letter: 'C',
    severity: 'urgent',
    condition: (f) => f.perfusion === 'warm_shock',
    interventions: (s) => [
      { id: uid(), action: 'IV/IO ACCESS + FLUID BOLUS', dose: makeDose('Normal Saline 0.9%', 20, 'mL', 'IV/IO bolus', { preparation: '20 mL/kg. Reassess after each bolus.' }), critical: true, completed: false, timerSeconds: 600, reassessAfter: 'Reassess perfusion after bolus' },
      { id: uid(), action: 'CONSIDER NOREPINEPHRINE', detail: 'If fluid-refractory warm shock → start norepinephrine infusion. This is a vasodilatory state.', dose: makeDose('Norepinephrine', 0.1, 'mcg/kg', '/min IV infusion', { preparation: 'Start at 0.1 mcg/kg/min, titrate to MAP target.' }), completed: false },
    ]
  },
  {
    id: 'active_bleeding',
    name: 'Active Bleeding',
    letter: 'C',
    severity: 'urgent',
    condition: (f) => f.bleeding === 'bleeding',
    interventions: () => [
      { id: uid(), action: 'DIRECT PRESSURE', detail: 'Apply direct pressure to bleeding site. Elevate if limb.', critical: true, completed: false },
      { id: uid(), action: 'CONSIDER TXA', dose: makeDose('TXA', 15, 'mg', 'IV over 10 min', { maxDose: 1000 }), completed: false },
    ]
  },
  // ─── D: Disability Threats ───
  {
    id: 'hypoglycemia',
    name: 'Hypoglycemia',
    letter: 'D',
    severity: 'critical',
    condition: (f) => f.glucose === 'low',
    interventions: (s) => [
      { id: uid(), action: 'DEXTROSE IV', dose: makeDose('Dextrose 10%', 5, 'mL', 'IV over 5 min', { preparation: 'D10W: 5 mL/kg. If no IV: Glucagon 0.5mg IM (<25kg) or 1mg IM (≥25kg).' }), critical: true, completed: false },
      { id: uid(), action: 'RECHECK GLUCOSE IN 15 MIN', detail: 'Recheck blood glucose. If still low, repeat dextrose. Start maintenance dextrose infusion.', timerSeconds: 900, completed: false },
    ]
  },
  {
    id: 'hyperglycemia',
    name: 'Hyperglycemia — Suspect DKA',
    letter: 'D',
    severity: 'urgent',
    condition: (f) => f.glucose === 'high' || f.glucose === 'very_high',
    interventions: () => [
      { id: uid(), action: 'CHECK KETONES', detail: 'Urine ketones, serum ketones, or capillary ketones — whichever is available. If positive → DKA protocol in Secondary Survey.', critical: true, completed: false },
      { id: uid(), action: 'DO NOT GIVE INSULIN YET', detail: '⚠️ Insulin is part of definitive DKA management, NOT primary survey. Stabilize ABCDE first.', completed: false },
    ]
  },
  {
    id: 'raised_icp',
    name: 'Raised ICP — Unequal Pupils',
    letter: 'D',
    severity: 'critical',
    condition: (f) => f.pupils === 'unequal' || f.pupils === 'fixed',
    interventions: (s) => [
      { id: uid(), action: 'HEAD UP 30°', detail: 'Elevate head of bed 30°. Keep head midline. Avoid neck compression.', critical: true, completed: false },
      { id: uid(), action: 'HYPERTONIC SALINE', dose: makeDose('Hypertonic Saline 3%', 5, 'mL', 'IV over 10-15 min', { preparation: 'Or Mannitol 20%: 5 mL/kg (= 1g/kg) IV over 15-20 min' }), critical: true, completed: false },
      { id: uid(), action: 'URGENT NEUROSURGICAL CONSULT', detail: 'Call neurosurgery. Consider CT head if stable enough to transport.', completed: false },
    ]
  },
  {
    id: 'active_seizure',
    name: 'Active Seizure',
    letter: 'D',
    severity: 'critical',
    condition: (f) => f.seizure_activity === 'active',
    interventions: (s) => [
      { id: uid(), action: 'PROTECT PATIENT', detail: 'Place in recovery position. Clear surroundings. Do NOT restrain. Do NOT put anything in mouth. Note time.', critical: true, completed: false },
      { id: uid(), action: 'IF SEIZING > 5 MIN → BENZODIAZEPINE', dose: makeDose('Midazolam', 0.15, 'mg', 'IV/IO (or 0.2mg/kg buccal/IN)', { maxDose: 10, preparation: 'IV/IO: 0.15mg/kg. Buccal/IN: 0.2mg/kg. IM: 0.2mg/kg. Can repeat ONCE after 5 min.' }), critical: true, completed: false, timerSeconds: 300, reassessAfter: 'Has seizure stopped after 5 minutes?' },
      { id: uid(), action: 'IF STILL SEIZING → 2ND LINE', dose: makeDose('Phenytoin', 20, 'mg', 'IV over 20 min', { maxDose: 1500, preparation: 'Or Levetiracetam 40mg/kg IV over 15 min (max 3000mg). Or Phenobarbital 20mg/kg IV over 20 min.' }), completed: false },
    ]
  },
  // ─── E: Exposure Threats ───
  {
    id: 'fever_infection',
    name: 'Fever — Suspect Infection',
    letter: 'E',
    severity: 'urgent',
    condition: (f) => f.temperature === 'fever' || f.temperature === 'high_fever',
    interventions: (s) => {
      const isNeonate = s.patientAge && (s.patientAge.includes('day') || s.patientAge.includes('week') || (s.patientAge.includes('month') && parseInt(s.patientAge) <= 1));
      return [
        { id: uid(), action: 'BLOOD CULTURES BEFORE ANTIBIOTICS', detail: 'Draw blood cultures, CBC, CRP, lactate if possible. Do NOT delay antibiotics for cultures if critically ill.', completed: false },
        { id: uid(), action: isNeonate ? 'CEFOTAXIME (Neonate)' : 'CEFTRIAXONE (High Dose)',
          dose: isNeonate
            ? makeDose('Cefotaxime', 50, 'mg', 'IV', { preparation: 'Preferred in neonates: avoids hyperbilirubinemia and AKI risk. Crosses BBB.' })
            : makeDose('Ceftriaxone', 80, 'mg', 'IV', { maxDose: 4000, preparation: 'High dose for suspected meningitis. Reduce if AKI present.' }),
          critical: true, completed: false },
        { id: uid(), action: 'ANTIPYRETIC', dose: makeDose('Paracetamol', 15, 'mg', 'PO/IV/PR', { maxDose: 1000, frequency: 'Every 4-6 hours' }), completed: false },
      ];
    }
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    letter: 'E',
    severity: 'critical',
    condition: (f) => f.other_exposure === 'allergic' || (f.rash === 'urticaria' && (f.breathing_effort === 'labored' || f.perfusion === 'poor' || f.perfusion === 'very_poor')),
    interventions: (s) => [
      { id: uid(), action: 'EPINEPHRINE IM', dose: makeDose('Epinephrine 1:1000', 0.01, 'mL', 'IM (anterolateral thigh)', { maxDose: 0.5, preparation: '0.01 mg/kg = 0.01 mL/kg of 1:1000. Can repeat every 5-15 min.' }), critical: true, completed: false, timerSeconds: 300, reassessAfter: 'Reassess: Is anaphylaxis improving?' },
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: '15L/min via non-rebreather mask.', critical: true, completed: false },
      { id: uid(), action: 'FLUID BOLUS', dose: makeDose('Normal Saline 0.9%', 20, 'mL', 'IV/IO bolus', { preparation: 'Rapid bolus for hypotension.' }), completed: false },
      { id: uid(), action: 'REMOVE TRIGGER', detail: 'Stop infusion, remove allergen if identifiable.', completed: false },
    ]
  },
  {
    id: 'nai',
    name: 'Suspected Non-Accidental Injury',
    letter: 'E',
    severity: 'urgent',
    condition: (f) => f.rash === 'nai_bruising' || f.other_exposure === 'nai',
    interventions: () => [
      { id: uid(), action: 'DOCUMENT ALL FINDINGS', detail: 'Document location, size, shape, color of all injuries. Photograph if possible. Note inconsistencies between history and injuries.', critical: true, completed: false },
      { id: uid(), action: 'REPORT TO SAFEGUARDING', detail: 'Mandatory reporting. Contact hospital safeguarding team / child protection services.', completed: false },
    ]
  },
  {
    id: 'poisoning',
    name: 'Suspected Poisoning / Ingestion',
    letter: 'E',
    severity: 'urgent',
    condition: (f) => f.other_exposure === 'poisoning',
    interventions: () => [
      { id: uid(), action: 'IDENTIFY SUBSTANCE', detail: 'What was ingested? How much? When? Check containers, ask witnesses.', critical: true, completed: false },
      { id: uid(), action: 'CONTACT POISON CENTER', detail: 'Call poison control for substance-specific guidance. Do NOT induce vomiting unless specifically advised.', completed: false },
      { id: uid(), action: 'ACTIVATED CHARCOAL', detail: 'Consider if ingestion < 1 hour and substance is adsorbable. Dose: 1g/kg PO (max 50g). Contraindicated if reduced consciousness or caustic ingestion.', completed: false },
    ]
  },
];

// ─── Safety Check Rules ─────────────────────────────────────
// These fire DURING ongoing management to catch iatrogenic risks.

type SafetyRule = {
  id: string;
  condition: (session: ResusSession) => boolean;
  message: string;
  severity: 'warning' | 'danger';
};

const safetyRules: SafetyRule[] = [
  {
    id: 'insulin_without_potassium',
    condition: (s) => s.insulinRunning && !s.potassiumAdded,
    message: '⚠️ INSULIN RUNNING WITHOUT POTASSIUM — Risk of fatal hypokalemia and cardiac arrest. Add KCl 20-40 mmol/L to IV fluids.',
    severity: 'danger',
  },
  {
    id: 'excessive_boluses',
    condition: (s) => s.bolusCount >= 3 && !s.threats.some(t => t.name.includes('Inotrope')),
    message: '⚠️ 3+ FLUID BOLUSES — Reassess for fluid overload (crackles, hepatomegaly, worsening respiratory distress). Consider inotropes if still in shock.',
    severity: 'warning',
  },
  {
    id: 'bolus_in_hyperglycemia',
    condition: (s) => s.bolusCount >= 2 && s.findings.some(f => f.id === 'glucose' && (f.description === 'high' || f.description === 'very_high')),
    message: '⚠️ RAPID FLUID BOLUSING WITH HYPERGLYCEMIA — Risk of cerebral edema from sudden osmolality change. Use 10 mL/kg boluses, not 20 mL/kg.',
    severity: 'danger',
  },
];

// ─── Session Management ─────────────────────────────────────

export function createSession(weight?: number | null, age?: string | null, isTrauma?: boolean): ResusSession {
  return {
    phase: 'IDLE',
    currentLetter: isTrauma ? 'X' : 'A',
    quickAssessment: null,
    findings: [],
    threats: [],
    safetyAlerts: [],
    sampleHistory: {},
    definitiveDiagnosis: null,
    patientWeight: weight ?? null,
    patientAge: age ?? null,
    isTrauma: isTrauma ?? false,
    events: [],
    startTime: Date.now(),
    activeTimers: [],
    bolusCount: 0,
    insulinRunning: false,
    potassiumAdded: false,
  };
}

// ─── Core Transition Logic ──────────────────────────────────

export function startQuickAssessment(session: ResusSession): ResusSession {
  const next = deepCopy(session);
  next.phase = 'QUICK_ASSESSMENT';
  next.startTime = Date.now();
  log(next, 'phase_change', 'Session started → QUICK ASSESSMENT');
  return next;
}

export function answerQuickAssessment(session: ResusSession, answer: 'sick' | 'not_sick'): ResusSession {
  const next = deepCopy(session);
  next.quickAssessment = answer;
  log(next, 'phase_change', `Quick Assessment: ${answer === 'sick' ? 'SICK — Activate ERT' : 'NOT SICK'}`);

  if (answer === 'sick') {
    next.phase = 'PRIMARY_SURVEY';
    next.currentLetter = next.isTrauma ? 'X' : 'A';
    log(next, 'phase_change', `→ PRIMARY SURVEY starting at ${next.currentLetter}`);
  } else {
    // Not sick — still do a primary survey but less urgently
    next.phase = 'PRIMARY_SURVEY';
    next.currentLetter = 'A'; // Skip X for non-trauma, non-sick
    log(next, 'phase_change', '→ PRIMARY SURVEY (routine)');
  }
  return next;
}

export function getCurrentQuestions(session: ResusSession): AssessmentQuestion[] {
  if (session.phase !== 'PRIMARY_SURVEY') return [];
  return primarySurveyQuestions[session.currentLetter] || [];
}

export function getAnsweredQuestionIds(session: ResusSession): string[] {
  return session.findings.map(f => f.id);
}

export function answerPrimarySurvey(
  session: ResusSession,
  questionId: string,
  answer: string,
  question: AssessmentQuestion
): ResusSession {
  const next = deepCopy(session);

  // Record finding
  const option = question.options.find(o => o.value === answer);
  const severity: Severity = option?.severity || 'monitor';
  const finding: Finding = {
    id: questionId,
    letter: question.letter,
    description: answer,
    severity,
    timestamp: Date.now(),
  };
  next.findings.push(finding);
  log(next, 'finding', `${question.letter}: ${question.text} → ${option?.label || answer}`, question.letter);

  // Detect threats from accumulated findings
  const findingsMap: Record<string, string> = {};
  next.findings.forEach(f => { findingsMap[f.id] = f.description; });

  for (const rule of threatRules) {
    // Don't re-detect already identified threats
    if (next.threats.some(t => t.id === rule.id)) continue;
    if (rule.condition(findingsMap, next)) {
      const threat: Threat = {
        id: rule.id,
        letter: rule.letter,
        name: rule.name,
        severity: rule.severity,
        interventions: rule.interventions(next),
        resolved: false,
        findings: next.findings.filter(f => f.letter === rule.letter).map(f => f.id),
      };
      next.threats.push(threat);
      log(next, 'threat_identified', `🚨 THREAT: ${rule.name}`, rule.letter);

      // If critical threat at current letter → immediately show intervention
      if (rule.severity === 'critical') {
        next.phase = 'INTERVENTION';
        log(next, 'phase_change', `→ INTERVENTION for ${rule.name}`);
        return next;
      }
    }
  }

  // Check if all questions for current letter are answered
  const letterQuestions = primarySurveyQuestions[next.currentLetter];
  const answeredIds = next.findings.map(f => f.id);
  const allAnswered = letterQuestions.every(q => answeredIds.includes(q.id));

  if (allAnswered) {
    // Check if there are urgent (non-critical) threats at this letter that need intervention
    const urgentThreats = next.threats.filter(t => t.letter === next.currentLetter && !t.resolved && t.severity === 'urgent');
    if (urgentThreats.length > 0) {
      next.phase = 'INTERVENTION';
      log(next, 'phase_change', `→ INTERVENTION for urgent threats at ${next.currentLetter}`);
      return next;
    }

    // Move to next letter
    const nextLetter = getNextLetter(next.currentLetter, next.isTrauma);
    if (nextLetter) {
      next.currentLetter = nextLetter;
      log(next, 'phase_change', `→ PRIMARY SURVEY: ${nextLetter}`);
    } else {
      // Primary survey complete → Secondary Survey
      next.phase = 'SECONDARY_SURVEY';
      log(next, 'phase_change', '→ SECONDARY SURVEY');
    }
  }

  return next;
}

export function completeIntervention(session: ResusSession, interventionId: string): ResusSession {
  const next = deepCopy(session);

  for (const threat of next.threats) {
    const intervention = threat.interventions.find(i => i.id === interventionId);
    if (intervention) {
      intervention.completed = true;
      intervention.completedAt = Date.now();
      log(next, 'intervention_completed', `✓ ${intervention.action}`, threat.letter);

      // Track boluses for safety checks
      if (intervention.action.includes('FLUID BOLUS') || intervention.action.includes('BOLUS')) {
        next.bolusCount++;
      }
      if (intervention.action.includes('INSULIN')) {
        next.insulinRunning = true;
      }
      if (intervention.action.includes('POTASSIUM') || intervention.action.includes('KCl')) {
        next.potassiumAdded = true;
      }

      // Start timer if intervention has one
      if (intervention.timerSeconds) {
        next.activeTimers.push({
          interventionId: intervention.id,
          endsAt: Date.now() + intervention.timerSeconds * 1000,
        });
      }

      break;
    }
  }

  // Run safety checks
  runSafetyChecks(next);

  return next;
}

export function returnToPrimarySurvey(session: ResusSession): ResusSession {
  const next = deepCopy(session);

  // Check if all questions for current letter are answered
  const letterQuestions = primarySurveyQuestions[next.currentLetter];
  const answeredIds = next.findings.map(f => f.id);
  const allAnswered = letterQuestions.every(q => answeredIds.includes(q.id));

  if (allAnswered) {
    const nextLetter = getNextLetter(next.currentLetter, next.isTrauma);
    if (nextLetter) {
      next.currentLetter = nextLetter;
      next.phase = 'PRIMARY_SURVEY';
      log(next, 'phase_change', `→ PRIMARY SURVEY: ${nextLetter}`);
    } else {
      next.phase = 'SECONDARY_SURVEY';
      log(next, 'phase_change', '→ SECONDARY SURVEY');
    }
  } else {
    next.phase = 'PRIMARY_SURVEY';
    log(next, 'phase_change', `→ PRIMARY SURVEY: continue ${next.currentLetter}`);
  }

  return next;
}

export function updateSAMPLE(session: ResusSession, field: keyof SAMPLEHistory, value: string): ResusSession {
  const next = deepCopy(session);
  next.sampleHistory[field] = value;
  log(next, 'note', `SAMPLE - ${field}: ${value}`);
  return next;
}

export function setDefinitiveDiagnosis(session: ResusSession, diagnosis: string): ResusSession {
  const next = deepCopy(session);
  next.definitiveDiagnosis = diagnosis;
  next.phase = 'DEFINITIVE_CARE';
  log(next, 'diagnosis', `DEFINITIVE DIAGNOSIS: ${diagnosis}`);
  log(next, 'phase_change', `→ DEFINITIVE CARE: ${diagnosis}`);
  return next;
}

export function triggerCardiacArrest(session: ResusSession): ResusSession {
  const next = deepCopy(session);
  next.phase = 'CARDIAC_ARREST';

  // Add cardiac arrest threat if not already present
  if (!next.threats.some(t => t.id === 'cardiac_arrest')) {
    const rule = threatRules.find(r => r.id === 'cardiac_arrest')!;
    next.threats.push({
      id: 'cardiac_arrest',
      letter: 'C',
      name: 'CARDIAC ARREST',
      severity: 'critical',
      interventions: rule.interventions(next),
      resolved: false,
      findings: [],
    });
  }

  log(next, 'cardiac_arrest_start', '🚨 CARDIAC ARREST — CPR STARTED');
  return next;
}

export function achieveROSC(session: ResusSession): ResusSession {
  const next = deepCopy(session);
  next.phase = 'ONGOING';
  log(next, 'rosc', '✅ ROSC ACHIEVED — Post-resuscitation care');

  // Run safety checks after ROSC
  runSafetyChecks(next);

  return next;
}

// ─── Helper Functions ───────────────────────────────────────

function getNextLetter(current: ABCDELetter, isTrauma: boolean): ABCDELetter | null {
  const order: ABCDELetter[] = isTrauma ? ['X', 'A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E'];
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

function runSafetyChecks(session: ResusSession): void {
  for (const rule of safetyRules) {
    if (session.safetyAlerts.some(a => a.id === rule.id && !a.acknowledged)) continue;
    if (rule.condition(session)) {
      session.safetyAlerts.push({
        id: rule.id,
        message: rule.message,
        severity: rule.severity,
        timestamp: Date.now(),
        acknowledged: false,
      });
      log(session, 'safety_alert', rule.message);
    }
  }
}

export function acknowledgeSafetyAlert(session: ResusSession, alertId: string): ResusSession {
  const next = deepCopy(session);
  const alert = next.safetyAlerts.find(a => a.id === alertId);
  if (alert) alert.acknowledged = true;
  return next;
}

function log(session: ResusSession, type: ClinicalEvent['type'], detail: string, letter?: ABCDELetter): void {
  session.events.push({ timestamp: Date.now(), type, letter, detail });
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Get Active Threats (unresolved, sorted by priority) ────

export function getActiveThreats(session: ResusSession): Threat[] {
  const severityOrder: Record<Severity, number> = { critical: 0, urgent: 1, monitor: 2 };
  const letterOrder: Record<ABCDELetter, number> = { X: 0, A: 1, B: 2, C: 3, D: 4, E: 5 };

  return session.threats
    .filter(t => !t.resolved)
    .sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (sevDiff !== 0) return sevDiff;
      return letterOrder[a.letter] - letterOrder[b.letter];
    });
}

// ─── Get Pending Interventions for a Threat ─────────────────

export function getPendingInterventions(threat: Threat): Intervention[] {
  return threat.interventions.filter(i => !i.completed && !i.skipped);
}

// ─── Get All Pending Critical Interventions ─────────────────

export function getAllPendingCritical(session: ResusSession): { threat: Threat; intervention: Intervention }[] {
  const result: { threat: Threat; intervention: Intervention }[] = [];
  for (const threat of getActiveThreats(session)) {
    for (const intervention of threat.interventions) {
      if (!intervention.completed && !intervention.skipped && intervention.critical) {
        result.push({ threat, intervention });
      }
    }
  }
  return result;
}

// ─── Suggested Diagnoses based on findings ──────────────────

export interface DiagnosisSuggestion {
  diagnosis: string;
  confidence: 'high' | 'moderate' | 'low';
  supportingFindings: string[];
  protocol: string;
}

export function getSuggestedDiagnoses(session: ResusSession): DiagnosisSuggestion[] {
  const f: Record<string, string> = {};
  session.findings.forEach(finding => { f[finding.id] = finding.description; });
  const suggestions: DiagnosisSuggestion[] = [];

  // DKA
  if ((f.glucose === 'high' || f.glucose === 'very_high') && f.breathing_sounds === 'kussmaul') {
    suggestions.push({
      diagnosis: 'Diabetic Ketoacidosis (DKA)',
      confidence: 'high',
      supportingFindings: ['Hyperglycemia', 'Kussmaul breathing', ...(f.perfusion === 'poor' || f.perfusion === 'very_poor' ? ['Shock'] : [])],
      protocol: 'DKA Protocol: Fluids → Insulin infusion → Electrolyte monitoring → Cerebral edema watch',
    });
  } else if (f.glucose === 'high' || f.glucose === 'very_high') {
    suggestions.push({
      diagnosis: 'Diabetic Ketoacidosis (DKA)',
      confidence: 'moderate',
      supportingFindings: ['Hyperglycemia'],
      protocol: 'Check ketones to confirm. If positive → DKA Protocol.',
    });
  }

  // Sepsis
  if ((f.temperature === 'fever' || f.temperature === 'high_fever') && (f.perfusion === 'poor' || f.perfusion === 'very_poor' || f.perfusion === 'warm_shock')) {
    suggestions.push({
      diagnosis: 'Sepsis / Septic Shock',
      confidence: 'high',
      supportingFindings: ['Fever', 'Shock', ...(f.rash === 'petechiae' ? ['Petechiae/Purpura'] : [])],
      protocol: 'Sepsis Bundle: Cultures → Antibiotics → Fluids → Vasopressors if refractory',
    });
  }

  // Anaphylaxis
  if (f.rash === 'urticaria' && (f.breathing_effort === 'labored' || f.perfusion === 'poor')) {
    suggestions.push({
      diagnosis: 'Anaphylaxis',
      confidence: 'high',
      supportingFindings: ['Urticaria', ...(f.breathing_effort === 'labored' ? ['Respiratory distress'] : []), ...(f.perfusion === 'poor' ? ['Shock'] : [])],
      protocol: 'Anaphylaxis: Epinephrine IM → O2 → Fluids → Remove trigger',
    });
  }

  // Meningitis
  if ((f.temperature === 'fever' || f.temperature === 'high_fever') && (f.consciousness === 'pain' || f.consciousness === 'unresponsive') && f.rash === 'petechiae') {
    suggestions.push({
      diagnosis: 'Meningococcal Meningitis',
      confidence: 'high',
      supportingFindings: ['Fever', 'Reduced consciousness', 'Petechiae/Purpura'],
      protocol: 'Immediate antibiotics (Ceftriaxone). LP if safe. Dexamethasone before or with first dose of antibiotics.',
    });
  }

  // Status Epilepticus
  if (f.seizure_activity === 'active') {
    suggestions.push({
      diagnosis: 'Status Epilepticus',
      confidence: 'moderate',
      supportingFindings: ['Active seizure'],
      protocol: 'Benzodiazepine → 2nd line AED if refractory → Consider intubation if status persists',
    });
  }

  // Tension Pneumothorax
  if (f.breathing_sounds === 'absent' && (f.perfusion === 'poor' || f.perfusion === 'very_poor')) {
    suggestions.push({
      diagnosis: 'Tension Pneumothorax',
      confidence: 'moderate',
      supportingFindings: ['Absent breath sounds', 'Shock'],
      protocol: 'Needle decompression → Chest drain',
    });
  }

  return suggestions;
}

// ─── Export Event Log as Clinical Notes ──────────────────────

export function exportEventLog(session: ResusSession): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('RESUSCITATION RECORD');
  lines.push('═══════════════════════════════════════════');
  lines.push(`Start Time: ${new Date(session.startTime).toISOString()}`);
  if (session.patientAge) lines.push(`Patient Age: ${session.patientAge}`);
  if (session.patientWeight) lines.push(`Patient Weight: ${session.patientWeight} kg`);
  lines.push('');

  for (const evt of session.events) {
    const elapsed = Math.floor((evt.timestamp - session.startTime) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    const time = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    const letter = evt.letter ? `[${evt.letter}] ` : '';
    lines.push(`${time}  ${letter}${evt.detail}`);
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════');
  if (session.definitiveDiagnosis) {
    lines.push(`DIAGNOSIS: ${session.definitiveDiagnosis}`);
  }
  lines.push(`Total Events: ${session.events.length}`);
  lines.push(`Threats Identified: ${session.threats.length}`);
  lines.push(`Interventions Completed: ${session.threats.reduce((sum, t) => sum + t.interventions.filter(i => i.completed).length, 0)}`);
  if (session.safetyAlerts.length > 0) {
    lines.push(`Safety Alerts: ${session.safetyAlerts.length}`);
  }

  return lines.join('\n');
}
