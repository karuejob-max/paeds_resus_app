/**
 * ResusGPS ABCDE Engine v3
 * 
 * CHANGES FROM v2:
 * 1. AVPU MOVED TO AIRWAY (A) — AVPU ≤ P = airway at risk, triggers age-appropriate
 *    airway maneuvers (neutral position for infants, sniffing for older children/adults,
 *    OPA if U, NPA if P, advanced airway escalation).
 * 2. CHOKING PATHWAY — added to A assessment.
 * 3. OBJECTIVE PERFUSION — CRT (seconds), skin temperature, pulse character asked
 *    separately. Engine derives perfusion state (no anchoring bias from option ordering).
 * 4. BALANCED CRYSTALLOIDS — Ringer's Lactate as default fluid. NS only for neonates.
 *    Rationale: no hyperchloremic acidosis, lactate buffered to bicarb by liver.
 * 5. FLUID TRACKER — first-class citizen. Total mL/kg, bolus count, running status.
 *    Auto-detects fluid-refractory shock at ≥60 mL/kg → triggers vasopressor ladder.
 * 6. SHOCK ESCALATION LADDER — protocol, not suggestion:
 *    Epi → Norepi → Hydrocortisone → Check Ca²⁺ → Milrinone (cold) / Vasopressin (warm)
 * 7. METABOLIC ACIDOSIS (not DKA tunnel vision) — deep laboured breathing moved from
 *    auscultation to inspection. Differentials: DKA, sepsis, lactic acidosis, renal
 *    failure, poisoning, starvation ketones.
 * 8. INTERVENTION LIFECYCLE — SUGGESTED → ONGOING (timer) → COMPLETED → REASSESS →
 *    Problem Resolved / Persists / New Problem / Escalate.
 * 9. LACTATE ASSESSMENT — added to D assessment.
 * 10. HEART FAILURE SIGNS — gallop, hepatomegaly, JVP checked before bolusing.
 * 
 * Flow: IDLE → QUICK ASSESSMENT → PRIMARY SURVEY (XABCDE) → INTERVENTIONS → SECONDARY SURVEY → DEFINITIVE CARE
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
  value?: string | number;
  unit?: string;
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
  findings: string[];
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

export type InterventionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface ReassessmentCheck {
  id: string;
  question: string;
  type: 'complication' | 'therapeutic_endpoint' | 'next_step';
  options: {
    label: string;
    value: string;
    action: 'repeat' | 'escalate' | 'stop' | 'continue' | 'resolved';
    recommendation?: string;
    rationale?: string;
    dose?: DoseInfo;
  }[];
}

export interface Intervention {
  id: string;
  action: string;
  detail?: string;
  dose?: DoseInfo;
  timerSeconds?: number;
  reassessAfter?: string;
  reassessmentChecks?: ReassessmentCheck[];
  critical?: boolean;
  status: InterventionStatus;
  completedAt?: number;
  startedAt?: number;
  repeatCount?: number;
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
    | 'diagnosis' | 'note' | 'cardiac_arrest_start' | 'rosc' | 'patient_info_updated';
  letter?: ABCDELetter;
  detail: string;
  data?: Record<string, unknown>;
}

export interface VitalSigns {
  hr?: number;
  rr?: number;
  spo2?: number;
  sbp?: number;
  dbp?: number;
  temp?: number;
  glucose?: number;
  glucoseMgDl?: number;
  crt?: number;        // Capillary Refill Time (seconds)
  lactate?: number;    // Lactate (mmol/L)
}

export interface FluidTracker {
  bolusCount: number;
  totalVolumeMl: number;    // absolute mL given
  totalVolumePerKg: number; // mL/kg given (auto-calculated)
  fluidType: string;        // "Ringer's Lactate" or "Normal Saline 0.9%"
  isFluidRefractory: boolean; // true when ≥60 mL/kg
  bolusHistory: { timestamp: number; volumeMl: number; fluidType: string }[];
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
  bolusCount: number;
  totalBolusVolume: number;
  insulinRunning: boolean;
  potassiumAdded: boolean;
  vitalSigns: VitalSigns;
  fluidTracker: FluidTracker;
  derivedPerfusion: string | null; // engine-derived perfusion state
}

// ─── ABCDE Assessment Questions ─────────────────────────────

export type QuestionInputType = 'select' | 'number' | 'number_pair';

export interface AssessmentQuestion {
  id: string;
  letter: ABCDELetter;
  text: string;
  inputType: QuestionInputType;
  options?: { label: string; value: string; severity?: Severity; icon?: string }[];
  numberConfig?: {
    unit: string;
    min: number;
    max: number;
    step: number;
    placeholder: string;
    quickPicks?: { label: string; value: number }[];
    interpret: (value: number, session: ResusSession) => { severity: Severity; label: string };
  };
  numberPairConfig?: {
    unit: string;
    label1: string;
    label2: string;
    min1: number; max1: number;
    min2: number; max2: number;
    placeholder1: string;
    placeholder2: string;
    interpret: (v1: number, v2: number, session: ResusSession) => { severity: Severity; label: string };
  };
}

// ─── Age Category ──────────────────────────────────────────

export function getAgeCategory(ageStr: string | null): 'neonate' | 'infant' | 'child' | 'adolescent' | 'adult' {
  if (!ageStr) return 'child';
  const lower = ageStr.toLowerCase();
  const nums = lower.match(/\d+(\.\d+)?/g);
  if (!nums) return 'child';
  const val = parseFloat(nums[0]);
  
  if (lower.includes('day') || lower.includes('d')) return 'neonate';
  if (lower.includes('week') || lower.includes('wk')) return val <= 4 ? 'neonate' : 'infant';
  if (lower.includes('month') || lower.includes('mo') || lower.includes('m')) {
    return val <= 1 ? 'neonate' : val <= 12 ? 'infant' : 'child';
  }
  if (lower.includes('year') || lower.includes('yr') || lower.includes('y') || !lower.match(/[a-z]/)) {
    if (val < 1) return 'infant';
    if (val < 6) return 'child';
    if (val < 13) return 'child';
    if (val < 18) return 'adolescent';
    return 'adult';
  }
  return 'child';
}

// ─── Vital Sign Interpretation (age-aware) ──────────────────

function interpretHR(hr: number, session: ResusSession): { severity: Severity; label: string } {
  const age = getAgeCategory(session.patientAge);
  const ranges: Record<string, { low: number; high: number; critLow: number; critHigh: number }> = {
    neonate:    { low: 100, high: 160, critLow: 60, critHigh: 200 },
    infant:     { low: 100, high: 160, critLow: 60, critHigh: 200 },
    child:      { low: 70,  high: 140, critLow: 50, critHigh: 180 },
    adolescent: { low: 60,  high: 120, critLow: 40, critHigh: 170 },
    adult:      { low: 60,  high: 100, critLow: 40, critHigh: 150 },
  };
  const r = ranges[age];
  if (hr <= r.critLow) return { severity: 'critical', label: `Severe Bradycardia (${hr} bpm)` };
  if (hr < r.low) return { severity: 'urgent', label: `Bradycardia (${hr} bpm)` };
  if (hr >= r.critHigh) return { severity: 'critical', label: `Severe Tachycardia (${hr} bpm)` };
  if (hr > r.high) return { severity: 'urgent', label: `Tachycardia (${hr} bpm)` };
  return { severity: 'monitor', label: `Normal (${hr} bpm)` };
}

function interpretRR(rr: number, session: ResusSession): { severity: Severity; label: string } {
  const age = getAgeCategory(session.patientAge);
  const ranges: Record<string, { low: number; high: number; critLow: number; critHigh: number }> = {
    neonate:    { low: 30, high: 60, critLow: 10, critHigh: 80 },
    infant:     { low: 25, high: 50, critLow: 10, critHigh: 70 },
    child:      { low: 18, high: 30, critLow: 8,  critHigh: 50 },
    adolescent: { low: 12, high: 20, critLow: 6,  critHigh: 40 },
    adult:      { low: 12, high: 20, critLow: 6,  critHigh: 35 },
  };
  const r = ranges[age];
  if (rr <= r.critLow) return { severity: 'critical', label: `Bradypnea (${rr}/min) — near apnea` };
  if (rr < r.low) return { severity: 'urgent', label: `Low RR (${rr}/min)` };
  if (rr >= r.critHigh) return { severity: 'critical', label: `Severe Tachypnea (${rr}/min)` };
  if (rr > r.high) return { severity: 'urgent', label: `Tachypnea (${rr}/min)` };
  return { severity: 'monitor', label: `Normal (${rr}/min)` };
}

function interpretSpO2(spo2: number, _session: ResusSession): { severity: Severity; label: string } {
  if (spo2 < 85) return { severity: 'critical', label: `Severe Hypoxia (SpO2 ${spo2}%)` };
  if (spo2 < 90) return { severity: 'critical', label: `Hypoxia (SpO2 ${spo2}%)` };
  if (spo2 < 94) return { severity: 'urgent', label: `Low SpO2 (${spo2}%)` };
  return { severity: 'monitor', label: `Normal (SpO2 ${spo2}%)` };
}

function interpretBP(sbp: number, dbp: number, session: ResusSession): { severity: Severity; label: string } {
  const age = getAgeCategory(session.patientAge);
  const lowSBP: Record<string, number> = { neonate: 60, infant: 70, child: 70, adolescent: 90, adult: 90 };
  const critLowSBP: Record<string, number> = { neonate: 50, infant: 55, child: 60, adolescent: 70, adult: 70 };
  const low = lowSBP[age];
  const critLow = critLowSBP[age];
  
  if (sbp <= critLow) return { severity: 'critical', label: `Severe Hypotension (${sbp}/${dbp} mmHg)` };
  if (sbp < low) return { severity: 'urgent', label: `Hypotension (${sbp}/${dbp} mmHg)` };
  if (sbp > 180 || dbp > 120) return { severity: 'critical', label: `Hypertensive Crisis (${sbp}/${dbp} mmHg)` };
  if (sbp > 140 || dbp > 90) return { severity: 'urgent', label: `Hypertension (${sbp}/${dbp} mmHg)` };
  return { severity: 'monitor', label: `Normal (${sbp}/${dbp} mmHg)` };
}

function interpretTemp(temp: number, _session: ResusSession): { severity: Severity; label: string } {
  if (temp < 35) return { severity: 'critical', label: `Severe Hypothermia (${temp}°C)` };
  if (temp < 36) return { severity: 'urgent', label: `Hypothermia (${temp}°C)` };
  if (temp > 40) return { severity: 'critical', label: `Hyperpyrexia (${temp}°C)` };
  if (temp > 39.5) return { severity: 'urgent', label: `High Fever (${temp}°C)` };
  if (temp > 38) return { severity: 'urgent', label: `Fever (${temp}°C)` };
  return { severity: 'monitor', label: `Normal (${temp}°C)` };
}

function interpretGlucose(glucose: number, _session: ResusSession): { severity: Severity; label: string } {
  const mgdl = Math.round(glucose * 18);
  if (glucose < 2.5) return { severity: 'critical', label: `Severe Hypoglycemia (${glucose} mmol/L | ${mgdl} mg/dL)` };
  if (glucose < 3.5) return { severity: 'critical', label: `Hypoglycemia (${glucose} mmol/L | ${mgdl} mg/dL)` };
  if (glucose > 20) return { severity: 'critical', label: `Severe Hyperglycemia (${glucose} mmol/L | ${mgdl} mg/dL)` };
  if (glucose > 14) return { severity: 'urgent', label: `Hyperglycemia (${glucose} mmol/L | ${mgdl} mg/dL)` };
  if (glucose > 11) return { severity: 'monitor', label: `Mildly Elevated (${glucose} mmol/L | ${mgdl} mg/dL)` };
  return { severity: 'monitor', label: `Normal (${glucose} mmol/L | ${mgdl} mg/dL)` };
}

function interpretCRT(crt: number, _session: ResusSession): { severity: Severity; label: string } {
  if (crt > 4) return { severity: 'critical', label: `Severely Prolonged CRT (${crt}s) — Very poor perfusion` };
  if (crt > 2) return { severity: 'urgent', label: `Prolonged CRT (${crt}s) — Reduced perfusion` };
  return { severity: 'monitor', label: `Normal CRT (${crt}s)` };
}

function interpretLactate(lactate: number, _session: ResusSession): { severity: Severity; label: string } {
  if (lactate > 4) return { severity: 'critical', label: `Severe Hyperlactatemia (${lactate} mmol/L) — Tissue hypoperfusion` };
  if (lactate > 2) return { severity: 'urgent', label: `Elevated Lactate (${lactate} mmol/L) — Possible hypoperfusion` };
  return { severity: 'monitor', label: `Normal Lactate (${lactate} mmol/L)` };
}

// ─── Perfusion State Derivation ─────────────────────────────
// Engine derives perfusion from objective findings — no anchoring bias

export function derivePerfusionState(session: ResusSession): string | null {
  const f: Record<string, string> = {};
  session.findings.forEach(finding => { f[finding.id] = finding.description; });
  
  const crt = session.vitalSigns.crt;
  const skinTemp = f.skin_temperature;
  const pulseChar = f.pulse_quality;
  
  // Need at least CRT + one other to derive
  if (crt === undefined) return null;
  
  // COLD SHOCK: CRT > 2s + cool/cold skin + weak pulses
  if (crt > 4 && (skinTemp === 'cold' || skinTemp === 'cool') && (pulseChar === 'weak' || pulseChar === 'absent')) {
    return 'severe_cold_shock';
  }
  if (crt > 2 && (skinTemp === 'cold' || skinTemp === 'cool')) {
    return 'cold_shock';
  }
  
  // WARM SHOCK: CRT ≤ 2s + warm/hot skin + bounding pulses
  if (crt <= 2 && (skinTemp === 'warm_flushed' || skinTemp === 'hot') && pulseChar === 'bounding') {
    return 'warm_shock';
  }
  
  // POOR PERFUSION (undifferentiated): CRT > 2s without clear cold/warm pattern
  if (crt > 4) return 'very_poor';
  if (crt > 2) return 'poor';
  
  // NORMAL
  return 'normal';
}

// ─── Primary Survey Questions ───────────────────────────────

export const primarySurveyQuestions: Record<ABCDELetter, AssessmentQuestion[]> = {
  X: [
    {
      id: 'catastrophic_hemorrhage',
      letter: 'X',
      text: 'Is there catastrophic / life-threatening external bleeding?',
      inputType: 'select',
      options: [
        { label: 'YES — Massive bleeding', value: 'yes', severity: 'critical', icon: '🩸' },
        { label: 'NO', value: 'no', icon: '✓' },
      ]
    }
  ],
  A: [
    // AVPU is now at Airway — AVPU ≤ P = airway at risk
    {
      id: 'avpu',
      letter: 'A',
      text: 'Level of consciousness (AVPU)? This determines airway protection.',
      inputType: 'select',
      options: [
        { label: 'A — Alert, oriented, protecting airway', value: 'alert', icon: '✓' },
        { label: 'V — Responds to Voice (airway may be at risk)', value: 'voice', severity: 'monitor', icon: '⚠️' },
        { label: 'P — Responds to Pain only (AIRWAY AT RISK — cannot protect)', value: 'pain', severity: 'urgent', icon: '🚨' },
        { label: 'U — Unresponsive (AIRWAY NOT PROTECTED — immediate action)', value: 'unresponsive', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'airway_status',
      letter: 'A',
      text: 'Airway patency?',
      inputType: 'select',
      options: [
        { label: 'PATENT — Speaking / Crying / Talking clearly', value: 'patent', icon: '✓' },
        { label: 'AT RISK — Vomiting / Secretions / Drooling / Gurgling', value: 'at_risk', severity: 'urgent', icon: '⚠️' },
        { label: 'OBSTRUCTED — Stridor / Snoring / No air movement', value: 'obstructed', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'choking',
      letter: 'A',
      text: 'Is the patient choking on a foreign body?',
      inputType: 'select',
      options: [
        { label: 'NO — Not choking', value: 'no', icon: '✓' },
        { label: 'YES — Effective cough (can still cough, cry, speak)', value: 'effective_cough', severity: 'urgent', icon: '⚠️' },
        { label: 'YES — Ineffective cough (silent, cannot breathe)', value: 'ineffective_cough', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'airway_sounds',
      letter: 'A',
      text: 'Airway auscultation — any abnormal sounds?',
      inputType: 'select',
      options: [
        { label: 'CLEAR — No abnormal sounds', value: 'clear', icon: '✓' },
        { label: 'STRIDOR (inspiratory) — upper airway narrowing', value: 'stridor', severity: 'critical', icon: '🚨' },
        { label: 'SNORING — tongue/soft tissue obstruction', value: 'snoring', severity: 'urgent', icon: '⚠️' },
        { label: 'GURGLING — fluid in airway', value: 'gurgling', severity: 'urgent', icon: '⚠️' },
      ]
    },
  ],
  B: [
    {
      id: 'breathing_effort',
      letter: 'B',
      text: 'Breathing effort on INSPECTION?',
      inputType: 'select',
      options: [
        { label: 'NORMAL — Comfortable, no distress', value: 'normal', icon: '✓' },
        { label: 'LABORED — Retractions / Accessory muscles / Nasal flaring', value: 'labored', severity: 'urgent', icon: '⚠️' },
        { label: 'DEEP & LABORED — Suggests METABOLIC ACIDOSIS (Kussmaul pattern)', value: 'deep_labored', severity: 'urgent', icon: '⚠️' },
        { label: 'ABSENT / AGONAL', value: 'absent', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'respiratory_rate',
      letter: 'B',
      text: 'Respiratory Rate (breaths/min)?',
      inputType: 'number',
      numberConfig: {
        unit: '/min',
        min: 0,
        max: 120,
        step: 1,
        placeholder: 'e.g., 42',
        quickPicks: [
          { label: '12', value: 12 },
          { label: '20', value: 20 },
          { label: '30', value: 30 },
          { label: '40', value: 40 },
          { label: '50', value: 50 },
          { label: '60', value: 60 },
          { label: '70', value: 70 },
        ],
        interpret: interpretRR,
      }
    },
    {
      id: 'breathing_sounds',
      letter: 'B',
      text: 'Chest auscultation — What do you hear?',
      inputType: 'select',
      options: [
        { label: 'CLEAR bilateral air entry', value: 'clear', icon: '✓' },
        { label: 'WHEEZING (expiratory)', value: 'wheezing', severity: 'urgent', icon: '🫁' },
        { label: 'CRACKLES / RALES', value: 'crackles', severity: 'urgent', icon: '💧' },
        { label: 'STRIDOR (inspiratory)', value: 'stridor', severity: 'critical', icon: '🚨' },
        { label: 'ABSENT / REDUCED breath sounds', value: 'absent', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'spo2',
      letter: 'B',
      text: 'SpO2 reading (%)?',
      inputType: 'number',
      numberConfig: {
        unit: '%',
        min: 30,
        max: 100,
        step: 1,
        placeholder: 'e.g., 92',
        quickPicks: [
          { label: '100', value: 100 },
          { label: '97', value: 97 },
          { label: '94', value: 94 },
          { label: '90', value: 90 },
          { label: '85', value: 85 },
          { label: '80', value: 80 },
        ],
        interpret: interpretSpO2,
      }
    },
  ],
  C: [
    {
      id: 'heart_rate',
      letter: 'C',
      text: 'Heart Rate (bpm)?',
      inputType: 'number',
      numberConfig: {
        unit: 'bpm',
        min: 0,
        max: 300,
        step: 1,
        placeholder: 'e.g., 140',
        quickPicks: [
          { label: '60', value: 60 },
          { label: '80', value: 80 },
          { label: '100', value: 100 },
          { label: '120', value: 120 },
          { label: '150', value: 150 },
          { label: '180', value: 180 },
          { label: '200', value: 200 },
        ],
        interpret: interpretHR,
      }
    },
    {
      id: 'pulse_quality',
      letter: 'C',
      text: 'Pulse character — compare central vs peripheral?',
      inputType: 'select',
      options: [
        { label: 'STRONG, regular — central = peripheral', value: 'strong', icon: '✓' },
        { label: 'WEAK / THREADY peripherals (central still palpable)', value: 'weak', severity: 'urgent', icon: '⚠️' },
        { label: 'BOUNDING (wide pulse pressure — flash CRT)', value: 'bounding', severity: 'urgent', icon: '🔥' },
        { label: 'IRREGULAR rhythm', value: 'irregular', severity: 'urgent', icon: '⚠️' },
        { label: 'ABSENT — No pulse palpable', value: 'absent', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'crt',
      letter: 'C',
      text: 'Capillary Refill Time (seconds)? Press on sternum or fingertip for 5 seconds, count refill.',
      inputType: 'number',
      numberConfig: {
        unit: 'seconds',
        min: 0,
        max: 15,
        step: 0.5,
        placeholder: 'e.g., 3',
        quickPicks: [
          { label: '1', value: 1 },
          { label: '2', value: 2 },
          { label: '3', value: 3 },
          { label: '4', value: 4 },
          { label: '5', value: 5 },
          { label: '6+', value: 6 },
        ],
        interpret: interpretCRT,
      }
    },
    {
      id: 'skin_temperature',
      letter: 'C',
      text: 'Skin temperature — feel peripheries (hands, feet)?',
      inputType: 'select',
      options: [
        { label: 'WARM — Normal temperature, well-perfused', value: 'warm', icon: '✓' },
        { label: 'COOL peripheries — Hands/feet cooler than trunk', value: 'cool', severity: 'urgent', icon: '⚠️' },
        { label: 'COLD & MOTTLED — Significant vasoconstriction', value: 'cold', severity: 'critical', icon: '🚨' },
        { label: 'WARM & FLUSHED — Vasodilated, hot peripheries', value: 'warm_flushed', severity: 'urgent', icon: '🔥' },
        { label: 'HOT — Febrile / Hyperdynamic', value: 'hot', severity: 'urgent', icon: '🔥' },
      ]
    },
    {
      id: 'blood_pressure',
      letter: 'C',
      text: 'Blood Pressure (mmHg)?',
      inputType: 'number_pair',
      numberPairConfig: {
        unit: 'mmHg',
        label1: 'Systolic',
        label2: 'Diastolic',
        min1: 30, max1: 250,
        min2: 10, max2: 180,
        placeholder1: 'e.g., 90',
        placeholder2: 'e.g., 60',
        interpret: interpretBP,
      }
    },
    {
      id: 'heart_sounds',
      letter: 'C',
      text: 'Heart auscultation?',
      inputType: 'select',
      options: [
        { label: 'NORMAL heart sounds (S1, S2)', value: 'normal', icon: '✓' },
        { label: 'MURMUR present', value: 'murmur', severity: 'urgent', icon: '⚠️' },
        { label: 'GALLOP rhythm (S3/S4) — suggests heart failure', value: 'gallop', severity: 'urgent', icon: '⚠️' },
        { label: 'MUFFLED / DISTANT heart sounds', value: 'muffled', severity: 'critical', icon: '🚨' },
        { label: 'NOT ASSESSED', value: 'not_assessed', icon: '❓' },
      ]
    },
    {
      id: 'bleeding',
      letter: 'C',
      text: 'Any ongoing bleeding or fluid loss?',
      inputType: 'select',
      options: [
        { label: 'NO', value: 'no', icon: '✓' },
        { label: 'YES — Active bleeding', value: 'bleeding', severity: 'urgent', icon: '🩸' },
        { label: 'YES — Significant fluid loss (vomiting/diarrhea)', value: 'fluid_loss', severity: 'urgent', icon: '💧' },
      ]
    },
    {
      id: 'heart_failure_signs',
      letter: 'C',
      text: 'Signs of heart failure? (Check BEFORE giving fluid boluses)',
      inputType: 'select',
      options: [
        { label: 'NONE — No signs of heart failure', value: 'none', icon: '✓' },
        { label: 'HEPATOMEGALY (liver edge > 2cm below costal margin)', value: 'hepatomegaly', severity: 'urgent', icon: '⚠️' },
        { label: 'RAISED JVP / Distended neck veins', value: 'raised_jvp', severity: 'urgent', icon: '⚠️' },
        { label: 'PERIPHERAL EDEMA', value: 'edema', severity: 'urgent', icon: '⚠️' },
        { label: 'MULTIPLE SIGNS (hepatomegaly + JVP + edema)', value: 'multiple', severity: 'critical', icon: '🚨' },
      ]
    },
  ],
  D: [
    // AVPU moved to Airway — D now focuses on neurological detail
    {
      id: 'gcs_motor',
      letter: 'D',
      text: 'Best motor response (GCS Motor component)?',
      inputType: 'select',
      options: [
        { label: '6 — Obeys commands / Normal spontaneous movement', value: '6', icon: '✓' },
        { label: '5 — Localizes pain', value: '5', severity: 'monitor', icon: '⚠️' },
        { label: '4 — Withdraws from pain', value: '4', severity: 'urgent', icon: '⚠️' },
        { label: '3 — Abnormal flexion (decorticate)', value: '3', severity: 'critical', icon: '🚨' },
        { label: '2 — Extension (decerebrate)', value: '2', severity: 'critical', icon: '🚨' },
        { label: '1 — None', value: '1', severity: 'critical', icon: '🚨' },
      ]
    },
    {
      id: 'glucose',
      letter: 'D',
      text: 'Blood Glucose (mmol/L)? Enter value in mmol/L. For mg/dL, divide by 18.',
      inputType: 'number',
      numberConfig: {
        unit: 'mmol/L',
        min: 0.5,
        max: 50,
        step: 0.1,
        placeholder: 'e.g., 5.5',
        quickPicks: [
          { label: '2.0', value: 2.0 },
          { label: '3.5', value: 3.5 },
          { label: '5.5', value: 5.5 },
          { label: '11', value: 11 },
          { label: '17', value: 17 },
          { label: '25', value: 25 },
          { label: '33', value: 33 },
        ],
        interpret: interpretGlucose,
      }
    },
    {
      id: 'pupils',
      letter: 'D',
      text: 'Pupils?',
      inputType: 'select',
      options: [
        { label: 'EQUAL & REACTIVE (PERRL)', value: 'normal', icon: '✓' },
        { label: 'UNEQUAL (anisocoria)', value: 'unequal', severity: 'critical', icon: '🚨' },
        { label: 'FIXED & DILATED bilateral', value: 'fixed', severity: 'critical', icon: '🚨' },
        { label: 'PINPOINT (miosis)', value: 'pinpoint', severity: 'urgent', icon: '⚠️' },
      ]
    },
    {
      id: 'seizure_activity',
      letter: 'D',
      text: 'Seizure activity?',
      inputType: 'select',
      options: [
        { label: 'NO seizure activity', value: 'no', icon: '✓' },
        { label: 'YES — Currently seizing', value: 'active', severity: 'critical', icon: '🚨' },
        { label: 'POST-ICTAL (seizure just ended)', value: 'postictal', severity: 'urgent', icon: '⚠️' },
      ]
    },
    {
      id: 'lactate',
      letter: 'D',
      text: 'Lactate level (mmol/L)? If available — helps assess tissue perfusion.',
      inputType: 'number',
      numberConfig: {
        unit: 'mmol/L',
        min: 0,
        max: 20,
        step: 0.1,
        placeholder: 'e.g., 2.5 (skip if unavailable)',
        quickPicks: [
          { label: '1.0', value: 1.0 },
          { label: '2.0', value: 2.0 },
          { label: '3.0', value: 3.0 },
          { label: '4.0', value: 4.0 },
          { label: '6.0', value: 6.0 },
          { label: '8.0', value: 8.0 },
        ],
        interpret: interpretLactate,
      }
    },
  ],
  E: [
    {
      id: 'temperature',
      letter: 'E',
      text: 'Temperature (°C)?',
      inputType: 'number',
      numberConfig: {
        unit: '°C',
        min: 28,
        max: 44,
        step: 0.1,
        placeholder: 'e.g., 38.5',
        quickPicks: [
          { label: '35.0', value: 35.0 },
          { label: '36.5', value: 36.5 },
          { label: '37.0', value: 37.0 },
          { label: '38.0', value: 38.0 },
          { label: '39.0', value: 39.0 },
          { label: '39.5', value: 39.5 },
          { label: '40.0', value: 40.0 },
        ],
        interpret: interpretTemp,
      }
    },
    {
      id: 'rash',
      letter: 'E',
      text: 'Skin findings?',
      inputType: 'select',
      options: [
        { label: 'NONE', value: 'none', icon: '✓' },
        { label: 'URTICARIA / HIVES', value: 'urticaria', severity: 'urgent', icon: '⚠️' },
        { label: 'PETECHIAE / PURPURA (non-blanching)', value: 'petechiae', severity: 'critical', icon: '🚨' },
        { label: 'SWELLING / ANGIOEDEMA', value: 'angioedema', severity: 'critical', icon: '🚨' },
        { label: 'BURNS', value: 'burns', severity: 'urgent', icon: '🔥' },
        { label: 'BRUISING (unexplained pattern)', value: 'nai_bruising', severity: 'urgent', icon: '⚠️' },
      ]
    },
    {
      id: 'other_exposure',
      letter: 'E',
      text: 'Any other findings?',
      inputType: 'select',
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

/**
 * Calculate dose — ALWAYS shows drug name first.
 */
function calcDose(dose: DoseInfo, weightKg: number | null): string {
  if (!weightKg || weightKg <= 0) {
    return `${dose.drug}: ${dose.dosePerKg} ${dose.unit}/kg ${dose.route}`;
  }
  let amount = dose.dosePerKg * weightKg;
  if (dose.maxDose && amount > dose.maxDose) amount = dose.maxDose;
  const rounded = amount < 1 ? amount.toFixed(2) : amount < 10 ? amount.toFixed(1) : Math.round(amount).toString();
  const maxNote = dose.maxDose && dose.dosePerKg * weightKg >= dose.maxDose ? ' (MAX DOSE)' : '';
  return `${dose.drug}: ${rounded} ${dose.unit} ${dose.route}${maxNote}`;
}

export { calcDose };

// ─── Get default fluid for patient ──────────────────────────

function getDefaultFluid(session: ResusSession): { name: string; rationale: string } {
  const age = getAgeCategory(session.patientAge);
  if (age === 'neonate') {
    return {
      name: 'Normal Saline 0.9%',
      rationale: 'NS preferred in neonates: RL contains lactate which neonatal liver may not metabolize efficiently, and potassium content may be risky in renal immaturity.',
    };
  }
  return {
    name: "Ringer's Lactate (Hartmann's)",
    rationale: "Balanced crystalloid: avoids hyperchloremic metabolic acidosis from NS. Lactate is buffered to bicarbonate by the liver. Balanced electrolyte composition closer to plasma.",
  };
}

// ─── Fluid Bolus Reassessment Checks ────────────────────────

function makeBolusReassessmentChecks(session: ResusSession): ReassessmentCheck[] {
  const fluid = getDefaultFluid(session);
  return [
    {
      id: uid(),
      question: 'Check for COMPLICATIONS of fluid resuscitation:',
      type: 'complication',
      options: [
        {
          label: 'New crackles / rales on auscultation',
          value: 'crackles',
          action: 'stop',
          recommendation: `STOP further boluses. Consider Furosemide.`,
          rationale: 'Crackles suggest pulmonary edema from fluid overload.',
          dose: makeDose('Furosemide (Lasix)', 1, 'mg', 'IV', { maxDose: 40, preparation: 'Dose range: 1-2 mg/kg IV. Monitor urine output.' }),
        },
        {
          label: 'Hepatomegaly (new or worsening)',
          value: 'hepatomegaly',
          action: 'stop',
          recommendation: 'STOP further boluses. Liver congestion indicates right heart failure / fluid overload.',
          rationale: 'Hepatomegaly in the context of fluid resuscitation suggests the heart cannot handle the volume.',
        },
        {
          label: 'Worsening respiratory distress',
          value: 'resp_distress',
          action: 'stop',
          recommendation: 'STOP boluses. Start vasopressor support.',
          rationale: 'Worsening respiratory distress after fluids suggests fluid overload or cardiogenic component.',
          dose: makeDose('Epinephrine infusion', 0.1, 'mcg/kg', '/min IV', { preparation: 'Start at 0.1 mcg/kg/min. Titrate to effect. Range: 0.1-1 mcg/kg/min.' }),
        },
        {
          label: 'Raised JVP / distended neck veins',
          value: 'raised_jvp',
          action: 'stop',
          recommendation: 'STOP boluses. Elevated JVP indicates volume overload or cardiac tamponade.',
          rationale: 'Raised JVP in shock suggests cardiogenic or obstructive cause, not hypovolemia.',
        },
        {
          label: 'No complications detected',
          value: 'none',
          action: 'continue',
          recommendation: 'No signs of fluid overload. Proceed to assess therapeutic endpoints.',
        },
      ]
    },
    {
      id: uid(),
      question: 'Reassess THERAPEUTIC ENDPOINTS — are signs of shock still present?',
      type: 'therapeutic_endpoint',
      options: [
        {
          label: 'Heart rate still elevated',
          value: 'hr_elevated',
          action: 'repeat',
          recommendation: `Persistent tachycardia. Give another ${fluid.name} bolus at 10 mL/kg.`,
          rationale: 'Tachycardia is an early compensatory sign of shock. Persistent tachycardia after bolus suggests ongoing hypovolemia.',
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', { preparation: `10 mL/kg. ${fluid.rationale}` }),
        },
        {
          label: 'CRT still > 2 seconds',
          value: 'crt_prolonged',
          action: 'repeat',
          recommendation: `Prolonged CRT indicates ongoing poor perfusion. Give another 10 mL/kg ${fluid.name} bolus.`,
          rationale: 'CRT > 2s means tissues are still not receiving adequate blood flow.',
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', { preparation: `10 mL/kg. Reassess after EACH bolus.` }),
        },
        {
          label: 'Blood pressure still low',
          value: 'bp_low',
          action: 'repeat',
          recommendation: `Hypotension persists. Give another 10 mL/kg ${fluid.name} bolus. If 3+ boluses given → consider vasopressors.`,
          rationale: 'Hypotension in shock is a late sign indicating decompensation.',
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', { preparation: 'If fluid-refractory → start vasopressors.' }),
        },
        {
          label: 'Mental status still altered',
          value: 'altered_mental',
          action: 'repeat',
          recommendation: 'Altered consciousness suggests ongoing cerebral hypoperfusion. Continue resuscitation.',
          rationale: 'The brain is sensitive to hypoperfusion. Altered mental status = inadequate cardiac output.',
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', { preparation: '10 mL/kg.' }),
        },
        {
          label: 'Urine output still low / absent',
          value: 'low_uop',
          action: 'repeat',
          recommendation: 'Low urine output indicates inadequate renal perfusion. Continue fluid resuscitation.',
          rationale: 'Target urine output: > 1 mL/kg/hr in children, > 0.5 mL/kg/hr in adults.',
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', { preparation: '10 mL/kg.' }),
        },
        {
          label: 'ALL SIGNS IMPROVING — Shock resolving',
          value: 'improving',
          action: 'resolved',
          recommendation: 'Shock is resolving. Switch to maintenance fluids. Continue monitoring.',
          rationale: 'Improving HR, CRT, BP, mental status, and urine output indicate adequate resuscitation.',
        },
      ]
    },
  ];
}

// ─── Shock Escalation Ladder ────────────────────────────────
// Protocol: Epi → Norepi → Hydrocortisone → Check Ca²⁺ → Milrinone/Vasopressin

function makeShockEscalationLadder(session: ResusSession): ReassessmentCheck {
  return {
    id: uid(),
    question: 'FLUID-REFRACTORY SHOCK — Escalation Ladder. What type of shock?',
    type: 'next_step',
    options: [
      {
        label: 'COLD SHOCK — Cold extremities, weak pulses, prolonged CRT, narrow pulse pressure',
        value: 'cold_shock',
        action: 'escalate',
        recommendation: 'Step 1: Start Epinephrine infusion. Epinephrine provides both inotropic and chronotropic support for myocardial dysfunction.',
        rationale: 'Cold shock = low cardiac output state. Epinephrine increases contractility (β1) and heart rate. If still refractory → Step 2: Add Milrinone (inodilator for catecholamine-refractory cold shock). Step 3: Hydrocortisone for adrenal insufficiency. Step 4: Check ionized calcium.',
        dose: makeDose('Epinephrine infusion', 0.1, 'mcg/kg', '/min IV', { preparation: 'Start at 0.1 mcg/kg/min. Titrate to MAP target. Range: 0.1-1 mcg/kg/min. If refractory → add Milrinone 0.25-0.75 mcg/kg/min.' }),
      },
      {
        label: 'WARM SHOCK — Warm/flushed extremities, bounding pulses, flash CRT, wide pulse pressure',
        value: 'warm_shock',
        action: 'escalate',
        recommendation: 'Step 1: Start Norepinephrine infusion. Norepinephrine provides vasoconstriction for vasodilatory shock.',
        rationale: 'Warm shock = vasodilatory state with preserved cardiac output. Norepinephrine (α1 > β1) provides vasoconstriction. If refractory → Step 2: Add Vasopressin 0.0003-0.002 units/kg/min. Step 3: Hydrocortisone. Step 4: Check ionized calcium.',
        dose: makeDose('Norepinephrine infusion', 0.1, 'mcg/kg', '/min IV', { preparation: 'Start at 0.1 mcg/kg/min. Titrate to MAP target. Range: 0.05-2 mcg/kg/min. If refractory → add Vasopressin.' }),
      },
      {
        label: 'UNCERTAIN — Cannot differentiate shock type',
        value: 'uncertain',
        action: 'escalate',
        recommendation: 'Start Epinephrine as first-line vasopressor. It works for both cardiac dysfunction AND has some vasopressor effect. Reassess shock type after initiation.',
        rationale: 'When shock type is unclear, Epinephrine is a reasonable first choice — universally available, provides both inotropic and vasopressor effects. Reassess after starting: if warm shock features emerge → add Norepinephrine.',
        dose: makeDose('Epinephrine infusion', 0.1, 'mcg/kg', '/min IV', { preparation: 'Start at 0.1 mcg/kg/min. Reassess shock type. Add Norepinephrine if warm shock features emerge.' }),
      },
    ]
  };
}

const threatRules: ThreatRule[] = [
  // ─── X: Catastrophic Hemorrhage ───
  {
    id: 'catastrophic_bleed',
    name: 'Catastrophic Hemorrhage',
    letter: 'X',
    severity: 'critical',
    condition: (f) => f.catastrophic_hemorrhage === 'yes',
    interventions: (s) => [
      { id: uid(), action: 'APPLY DIRECT PRESSURE', detail: 'Apply firm, direct pressure to bleeding site. Use tourniquet if limb and pressure fails.', critical: true, status: 'pending' },
      { id: uid(), action: 'ACTIVATE MASSIVE TRANSFUSION', detail: 'Call for O-negative blood / massive transfusion protocol if available.', critical: true, status: 'pending' },
      { id: uid(), action: 'TRANEXAMIC ACID (TXA)', dose: makeDose('Tranexamic Acid (TXA)', 15, 'mg', 'IV over 10 min', { maxDose: 1000, notes: 'Give within 3 hours of injury' }), critical: true, status: 'pending' },
    ]
  },

  // ─── A: Airway Threats ───
  {
    id: 'unresponsive_airway',
    name: 'Unresponsive — Airway Not Protected',
    letter: 'A',
    severity: 'critical',
    condition: (f) => f.avpu === 'unresponsive',
    interventions: (s) => {
      const age = getAgeCategory(s.patientAge);
      const headPosition = age === 'neonate' || age === 'infant'
        ? 'NEUTRAL position (do NOT hyperextend — risk of airway collapse in infants)'
        : 'SNIFFING position (head-tilt chin-lift, or jaw thrust if trauma)';
      return [
        { id: uid(), action: `OPEN AIRWAY — ${headPosition}`, detail: `Age-appropriate positioning: ${headPosition}. Suction oropharynx if secretions present.`, critical: true, status: 'pending' },
        { id: uid(), action: 'INSERT OPA (Oropharyngeal Airway)', detail: 'Patient is UNRESPONSIVE — OPA is safe (no gag reflex). Size: corner of mouth to angle of jaw.', critical: true, status: 'pending' },
        { id: uid(), action: 'CHECK PULSE — If no pulse → START CPR', detail: 'Unresponsive patient: check for pulse (carotid in >1yr, brachial in infant). If no pulse within 10 seconds → CPR.', critical: true, status: 'pending' },
        { id: uid(), action: 'PREPARE FOR ADVANCED AIRWAY', detail: 'If basic airway maneuvers fail: consider supraglottic (iGel/LMA) or endotracheal intubation (RSI). Call for help.', status: 'pending' },
      ];
    }
  },
  {
    id: 'pain_responsive_airway',
    name: 'Pain-Responsive — Airway At Risk',
    letter: 'A',
    severity: 'urgent',
    condition: (f) => f.avpu === 'pain',
    interventions: (s) => {
      const age = getAgeCategory(s.patientAge);
      const headPosition = age === 'neonate' || age === 'infant'
        ? 'NEUTRAL position'
        : 'SNIFFING position (head-tilt chin-lift)';
      return [
        { id: uid(), action: `POSITION AIRWAY — ${headPosition}`, detail: `Patient responds to PAIN only — cannot protect own airway. ${headPosition}. Suction if needed.`, critical: true, status: 'pending' },
        { id: uid(), action: 'INSERT NPA (Nasopharyngeal Airway)', detail: 'Patient has some reflexes — NPA is safer than OPA. Size: tip of nose to tragus of ear. Contraindicated if base of skull fracture suspected.', critical: true, status: 'pending' },
        { id: uid(), action: 'CONTINUOUS AIRWAY MONITORING', detail: 'Reassess airway every 2 minutes. Have advanced airway equipment ready. If deteriorates to U → insert OPA.', timerSeconds: 120, reassessAfter: 'Is airway still maintained?', status: 'pending' },
      ];
    }
  },
  {
    id: 'airway_obstruction',
    name: 'Airway Obstruction',
    letter: 'A',
    severity: 'critical',
    condition: (f) => f.airway_status === 'obstructed',
    interventions: (s) => {
      const age = getAgeCategory(s.patientAge);
      const headPosition = age === 'neonate' || age === 'infant'
        ? 'NEUTRAL position'
        : 'SNIFFING position (head-tilt chin-lift, or jaw thrust if trauma)';
      return [
        { id: uid(), action: `OPEN AIRWAY — ${headPosition}`, detail: `${headPosition}. Suction oropharynx. Remove visible foreign body only if easily accessible.`, critical: true, status: 'pending' },
        { id: uid(), action: 'INSERT AIRWAY ADJUNCT', detail: 'OPA if unconscious (AVPU = U), NPA if semi-conscious (AVPU = P). Size OPA: corner of mouth to angle of jaw.', critical: true, status: 'pending' },
        { id: uid(), action: 'PREPARE FOR ADVANCED AIRWAY', detail: 'If airway cannot be maintained with basic maneuvers → supraglottic airway (iGel/LMA) or endotracheal intubation (RSI). Call for help.', status: 'pending' },
      ];
    }
  },
  {
    id: 'airway_at_risk',
    name: 'Airway At Risk',
    letter: 'A',
    severity: 'urgent',
    condition: (f) => f.airway_status === 'at_risk',
    interventions: () => [
      { id: uid(), action: 'POSITION & SUCTION', detail: 'Recovery position if appropriate. Suction oropharynx. Keep suction at bedside.', critical: true, status: 'pending' },
      { id: uid(), action: 'MONITOR AIRWAY', detail: 'Reassess airway every 2 minutes. Have airway equipment ready.', timerSeconds: 120, reassessAfter: 'Is airway still patent?', status: 'pending' },
    ]
  },
  {
    id: 'choking_ineffective',
    name: 'CHOKING — Ineffective Cough (Complete Obstruction)',
    letter: 'A',
    severity: 'critical',
    condition: (f) => f.choking === 'ineffective_cough',
    interventions: (s) => {
      const age = getAgeCategory(s.patientAge);
      const isInfant = age === 'neonate' || age === 'infant';
      if (isInfant) {
        return [
          { id: uid(), action: '5 BACK BLOWS', detail: 'Place infant face-down on your forearm, head lower than chest. Support head. Deliver 5 firm back blows between shoulder blades with heel of hand.', critical: true, status: 'pending' },
          { id: uid(), action: '5 CHEST THRUSTS', detail: 'Turn infant face-up. Deliver 5 chest thrusts using 2 fingers on lower sternum (same position as CPR). Check mouth after each cycle.', critical: true, status: 'pending' },
          { id: uid(), action: 'REPEAT CYCLE', detail: 'Alternate 5 back blows and 5 chest thrusts until object expelled or infant becomes unresponsive. If unresponsive → START CPR.', status: 'pending' },
        ];
      }
      return [
        { id: uid(), action: '5 BACK BLOWS', detail: 'Lean patient forward. Deliver 5 firm back blows between shoulder blades with heel of hand.', critical: true, status: 'pending' },
        { id: uid(), action: '5 ABDOMINAL THRUSTS (Heimlich)', detail: 'Stand behind patient. Place fist above navel, below xiphoid. Pull sharply inward and upward. Check mouth after each cycle.', critical: true, status: 'pending' },
        { id: uid(), action: 'REPEAT CYCLE', detail: 'Alternate 5 back blows and 5 abdominal thrusts until object expelled or patient becomes unresponsive. If unresponsive → START CPR (look for foreign body during ventilation).', status: 'pending' },
      ];
    }
  },
  {
    id: 'choking_effective',
    name: 'Choking — Effective Cough (Partial Obstruction)',
    letter: 'A',
    severity: 'urgent',
    condition: (f) => f.choking === 'effective_cough',
    interventions: () => [
      { id: uid(), action: 'ENCOURAGE COUGHING', detail: 'Do NOT intervene physically — let the patient cough. Coughing is the most effective way to clear a partial obstruction. Stay with patient.', critical: true, status: 'pending' },
      { id: uid(), action: 'MONITOR FOR DETERIORATION', detail: 'Watch for: inability to cough, silent cough, cyanosis, loss of consciousness. If cough becomes ineffective → switch to back blows + thrusts.', timerSeconds: 60, reassessAfter: 'Is cough still effective?', status: 'pending' },
    ]
  },
  {
    id: 'stridor_airway',
    name: 'Stridor — Upper Airway Narrowing',
    letter: 'A',
    severity: 'critical',
    condition: (f) => f.airway_sounds === 'stridor',
    interventions: () => [
      { id: uid(), action: 'KEEP PATIENT CALM', detail: 'Do NOT agitate. Allow position of comfort. Keep caregiver at bedside. Agitation worsens dynamic airway obstruction.', critical: true, status: 'pending' },
      { id: uid(), action: 'NEBULIZED EPINEPHRINE', dose: makeDose('Epinephrine (1:1000)', 0.5, 'mL/kg', 'nebulized', { maxDose: 5, preparation: 'Use 1:1000 (1mg/mL). Max 5mL. Can repeat once after 15 min. Monitor for rebound.' }), critical: true, status: 'pending' },
      { id: uid(), action: 'DEXAMETHASONE', dose: makeDose('Dexamethasone', 0.6, 'mg', 'PO/IM/IV', { maxDose: 16, preparation: 'Single dose. Onset 2-4 hours. Reduces airway edema.' }), status: 'pending' },
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
      { id: uid(), action: 'BAG-VALVE-MASK VENTILATION', detail: 'Start BVM at 12-20 breaths/min. Ensure chest rise. Two-person technique preferred. E-C grip on mask.', critical: true, status: 'pending' },
      { id: uid(), action: 'CHECK PULSE', detail: 'If no pulse → START CPR immediately. If pulse present → continue assisted ventilation.', critical: true, status: 'pending' },
    ]
  },
  {
    id: 'metabolic_acidosis_breathing',
    name: 'Deep & Labored Breathing — Metabolic Acidosis',
    letter: 'B',
    severity: 'urgent',
    condition: (f) => f.breathing_effort === 'deep_labored',
    interventions: () => [
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: 'Apply O2 via non-rebreather. This breathing pattern is COMPENSATORY for metabolic acidosis — the body is blowing off CO2.', critical: true, status: 'pending' },
      { id: uid(), action: 'DO NOT INTUBATE UNLESS FAILING', detail: '⚠️ CRITICAL: Deep labored breathing is compensatory. Intubation may WORSEN acidosis if ventilation rate drops below the patient\'s compensatory rate. Only intubate if respiratory failure is imminent.', critical: true, status: 'pending' },
      { id: uid(), action: 'IDENTIFY CAUSE — Differential Diagnosis', detail: 'Deep labored breathing = metabolic acidosis. DIFFERENTIALS:\n• DKA (check glucose + ketones)\n• Sepsis with lactic acidosis\n• Starvation ketones (poor feeding + ketones but normal/mildly elevated glucose)\n• Renal failure (check urea/creatinine)\n• Poisoning (salicylates, methanol, ethylene glycol)\n• Severe dehydration with lactic acidosis\n\n⚠️ Do NOT assume DKA — a septic child with poor feeding can have ketones + stress hyperglycemia.', status: 'pending' },
      { id: uid(), action: 'CHECK GLUCOSE, KETONES, LACTATE, VBG', detail: 'Urgent labs: blood glucose, urine/serum ketones, lactate, venous blood gas (pH, HCO3, BE). These differentiate the cause of metabolic acidosis.', status: 'pending' },
    ]
  },
  {
    id: 'bronchospasm',
    name: 'Bronchospasm / Wheezing',
    letter: 'B',
    severity: 'urgent',
    condition: (f) => f.breathing_sounds === 'wheezing',
    interventions: (s) => [
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: 'Apply high-flow O2 via non-rebreather mask. Target SpO2 ≥ 94%.', critical: true, status: 'pending' },
      { id: uid(), action: 'SALBUTAMOL NEBULIZER', dose: makeDose('Salbutamol', 2.5, 'mg', 'nebulized', { preparation: '2.5mg if <20kg, 5mg if ≥20kg. Can repeat every 20 min x3, then hourly.' }), critical: true, status: 'pending' },
      { id: uid(), action: 'IPRATROPIUM BROMIDE', dose: makeDose('Ipratropium Bromide', 250, 'mcg', 'nebulized', { preparation: '250mcg if <20kg, 500mcg if ≥20kg. Add to salbutamol neb.' }), detail: 'Add to salbutamol nebulizer for moderate-severe wheeze.', status: 'pending' },
      { id: uid(), action: 'SYSTEMIC STEROIDS', dose: makeDose('Prednisolone', 1, 'mg', 'PO', { maxDose: 60, preparation: 'Or Dexamethasone 0.6mg/kg PO (max 16mg), or Methylprednisolone 2mg/kg IV (max 60mg)' }), status: 'pending' },
    ]
  },
  {
    id: 'stridor_breathing',
    name: 'Stridor / Upper Airway Obstruction (on chest auscultation)',
    letter: 'B',
    severity: 'critical',
    condition: (f) => f.breathing_sounds === 'stridor',
    interventions: () => [
      { id: uid(), action: 'KEEP PATIENT CALM', detail: 'Do NOT agitate. Allow position of comfort. Keep caregiver at bedside.', critical: true, status: 'pending' },
      { id: uid(), action: 'NEBULIZED EPINEPHRINE', dose: makeDose('Epinephrine (1:1000)', 0.5, 'mL/kg', 'nebulized', { maxDose: 5, preparation: 'Use 1:1000 (1mg/mL). Max 5mL. Can repeat once after 15 min.' }), critical: true, status: 'pending' },
      { id: uid(), action: 'DEXAMETHASONE', dose: makeDose('Dexamethasone', 0.6, 'mg', 'PO/IM/IV', { maxDose: 16 }), status: 'pending' },
    ]
  },
  {
    id: 'hypoxia',
    name: 'Hypoxia',
    letter: 'B',
    severity: 'critical',
    condition: (f, s) => {
      const spo2 = s.vitalSigns.spo2;
      return spo2 !== undefined && spo2 < 90;
    },
    interventions: () => [
      { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: '15L/min via non-rebreather mask. Target SpO2 ≥ 94%.', critical: true, status: 'pending' },
      { id: uid(), action: 'ASSESS FOR TENSION PNEUMOTHORAX', detail: 'If unilateral absent breath sounds + tracheal deviation → needle decompression at 2nd intercostal space, midclavicular line.', status: 'pending' },
    ]
  },
  {
    id: 'mild_hypoxia',
    name: 'Low SpO2',
    letter: 'B',
    severity: 'urgent',
    condition: (f, s) => {
      const spo2 = s.vitalSigns.spo2;
      return spo2 !== undefined && spo2 >= 90 && spo2 < 94;
    },
    interventions: () => [
      { id: uid(), action: 'SUPPLEMENTAL OXYGEN', detail: 'Start O2 via nasal cannula or simple face mask. Target SpO2 ≥ 94%.', status: 'pending' },
    ]
  },

  // ─── C: Circulation Threats ───
  {
    id: 'cardiac_arrest',
    name: 'CARDIAC ARREST — No Pulse',
    letter: 'C',
    severity: 'critical',
    condition: (f) => f.pulse_quality === 'absent',
    interventions: (s) => [
      { id: uid(), action: 'START CPR', detail: 'Push hard, push fast. 100-120/min. Minimize interruptions. 15:2 ratio (2-rescuer) or 30:2 (single rescuer).', critical: true, status: 'pending', timerSeconds: 120, reassessAfter: 'Check rhythm after 2-minute CPR cycle' },
      { id: uid(), action: 'EPINEPHRINE', dose: makeDose('Epinephrine (1:10,000)', 0.01, 'mg', 'IV/IO', { maxDose: 1, preparation: '0.1 mL/kg of 1:10,000 solution. Give every 3-5 minutes.', frequency: 'Every 3-5 min' }), critical: true, status: 'pending' },
      { id: uid(), action: 'CHECK RHYTHM — Shockable?', detail: 'VF/pVT → Defibrillate 2J/kg (1st), 4J/kg (2nd+). Asystole/PEA → Continue CPR + Epinephrine.', critical: true, status: 'pending' },
      { id: uid(), action: 'AMIODARONE (if VF/pVT after 3rd shock)', dose: makeDose('Amiodarone', 5, 'mg', 'IV/IO bolus', { maxDose: 300, preparation: 'If amiodarone unavailable: Lidocaine 1mg/kg IV/IO' }), status: 'pending' },
      { id: uid(), action: 'REVIEW Hs & Ts', detail: 'Hypovolemia, Hypoxia, Hydrogen ion (acidosis), Hypo/Hyperkalemia, Hypothermia | Tension pneumo, Tamponade, Toxins, Thrombosis (pulmonary/coronary)', status: 'pending' },
    ]
  },
  {
    id: 'cold_shock',
    name: 'Cold Shock — Poor Perfusion',
    letter: 'C',
    severity: 'critical',
    condition: (f, s) => {
      const crt = s.vitalSigns.crt;
      const perfusion = derivePerfusionState(s);
      return (perfusion === 'severe_cold_shock' || perfusion === 'very_poor') ||
        (crt !== undefined && crt > 4 && f.pulse_quality !== 'absent') ||
        (f.skin_temperature === 'cold' && f.pulse_quality === 'weak');
    },
    interventions: (s) => {
      const fluid = getDefaultFluid(s);
      const hasHFSigns = s.findings.some(f => f.id === 'heart_failure_signs' && f.description !== 'none');
      
      const interventions: Intervention[] = [
        { id: uid(), action: 'IV/IO ACCESS', detail: 'Establish IV access. If unable within 90 seconds → IO access (proximal tibia, distal femur).', critical: true, status: 'pending' },
      ];

      if (hasHFSigns) {
        interventions.push({
          id: uid(),
          action: '⚠️ HEART FAILURE SIGNS PRESENT — CAUTIOUS FLUID',
          detail: `Signs of heart failure detected. Give CAUTIOUS 5 mL/kg ${fluid.name} over 20-30 min. Reassess frequently. Consider early vasopressor support instead of aggressive fluid resuscitation.`,
          dose: makeDose(fluid.name, 5, 'mL', 'IV/IO over 20-30 min', {
            preparation: `CAUTIOUS: 5 mL/kg only due to heart failure signs. ${fluid.rationale}`
          }),
          critical: true,
          status: 'pending',
          timerSeconds: 1200,
          reassessAfter: 'Reassess for worsening heart failure signs',
          reassessmentChecks: makeBolusReassessmentChecks(s),
        });
      } else {
        interventions.push({
          id: uid(),
          action: `FLUID BOLUS — ${fluid.name}`,
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', {
            preparation: `10 mL/kg for ALL initial boluses. Reassess after EACH bolus before repeating. ${fluid.rationale}`
          }),
          critical: true,
          status: 'pending',
          timerSeconds: 600,
          reassessAfter: 'Reassess perfusion, HR, BP, mental status, urine output after bolus',
          reassessmentChecks: makeBolusReassessmentChecks(s),
        });
      }

      return interventions;
    }
  },
  {
    id: 'warm_shock',
    name: 'Warm Shock (Distributive)',
    letter: 'C',
    severity: 'urgent',
    condition: (f, s) => {
      const perfusion = derivePerfusionState(s);
      return perfusion === 'warm_shock' ||
        (f.skin_temperature === 'warm_flushed' && f.pulse_quality === 'bounding');
    },
    interventions: (s) => {
      const fluid = getDefaultFluid(s);
      return [
        { id: uid(), action: 'IV/IO ACCESS + BLOOD CULTURES', detail: 'Establish IV access. Draw blood cultures BEFORE antibiotics if possible. Do not delay antibiotics for cultures if critically ill.', critical: true, status: 'pending' },
        {
          id: uid(),
          action: `FLUID BOLUS — ${fluid.name}`,
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', {
            preparation: `10 mL/kg. Warm shock may need vasopressors early — reassess after EACH bolus. ${fluid.rationale}`
          }),
          critical: true,
          status: 'pending',
          timerSeconds: 600,
          reassessAfter: 'Reassess perfusion after bolus',
          reassessmentChecks: makeBolusReassessmentChecks(s),
        },
      ];
    }
  },
  {
    id: 'undifferentiated_poor_perfusion',
    name: 'Poor Perfusion (Undifferentiated)',
    letter: 'C',
    severity: 'urgent',
    condition: (f, s) => {
      const crt = s.vitalSigns.crt;
      const perfusion = derivePerfusionState(s);
      return (perfusion === 'poor' || perfusion === 'cold_shock') ||
        (crt !== undefined && crt > 2 && crt <= 4 && f.pulse_quality !== 'absent');
    },
    interventions: (s) => {
      const fluid = getDefaultFluid(s);
      return [
        { id: uid(), action: 'IV/IO ACCESS', detail: 'Establish IV access. If unable within 90 seconds → IO access.', critical: true, status: 'pending' },
        {
          id: uid(),
          action: `FLUID BOLUS — ${fluid.name}`,
          dose: makeDose(fluid.name, 10, 'mL', 'IV/IO over 10-20 min', {
            preparation: `10 mL/kg. Reassess after EACH bolus. ${fluid.rationale}`
          }),
          critical: true,
          status: 'pending',
          timerSeconds: 600,
          reassessAfter: 'Reassess perfusion, HR, CRT, BP after bolus',
          reassessmentChecks: makeBolusReassessmentChecks(s),
        },
      ];
    }
  },
  {
    id: 'severe_bradycardia',
    name: 'Severe Bradycardia',
    letter: 'C',
    severity: 'critical',
    condition: (f, s) => {
      const hr = s.vitalSigns.hr;
      if (hr === undefined) return false;
      const age = getAgeCategory(s.patientAge);
      const critLow: Record<string, number> = { neonate: 60, infant: 60, child: 50, adolescent: 40, adult: 40 };
      return hr <= critLow[age] && f.pulse_quality !== 'absent';
    },
    interventions: () => [
      { id: uid(), action: 'ASSESS FOR POOR PERFUSION', detail: 'If bradycardia with poor perfusion → treat immediately. If well-perfused → monitor closely.', critical: true, status: 'pending' },
      { id: uid(), action: 'ATROPINE', dose: makeDose('Atropine', 0.02, 'mg', 'IV/IO', { maxDose: 0.5, preparation: 'Minimum dose 0.1mg. Can repeat once. For vagal-mediated bradycardia.' }), status: 'pending' },
      { id: uid(), action: 'EPINEPHRINE (if atropine fails)', dose: makeDose('Epinephrine infusion', 0.1, 'mcg/kg', '/min IV', { preparation: 'Start at 0.1 mcg/kg/min. Titrate to heart rate and perfusion.' }), status: 'pending' },
    ]
  },
  {
    id: 'cardiac_tamponade',
    name: 'Suspected Cardiac Tamponade',
    letter: 'C',
    severity: 'critical',
    condition: (f) => f.heart_sounds === 'muffled' && (f.skin_temperature === 'cold' || f.skin_temperature === 'cool' || f.pulse_quality === 'weak'),
    interventions: () => [
      { id: uid(), action: 'URGENT CARDIOLOGY / SURGICAL CONSULT', detail: "Muffled heart sounds + shock = Beck's triad (add JVD). Needs pericardiocentesis.", critical: true, status: 'pending' },
      { id: uid(), action: 'CAUTIOUS FLUID BOLUS', dose: makeDose('Normal Saline 0.9%', 10, 'mL', 'IV/IO', { preparation: '10 mL/kg. May temporarily improve preload in tamponade.' }), status: 'pending' },
    ]
  },
  {
    id: 'heart_failure_detected',
    name: 'Heart Failure Signs — Avoid Aggressive Bolusing',
    letter: 'C',
    severity: 'urgent',
    condition: (f) => f.heart_failure_signs === 'multiple' || f.heart_sounds === 'gallop',
    interventions: () => [
      { id: uid(), action: '⚠️ DO NOT BOLUS AGGRESSIVELY', detail: 'Heart failure signs present (gallop rhythm / hepatomegaly / JVP / edema). Aggressive fluid bolusing will worsen pulmonary edema and cardiac output.', critical: true, status: 'pending' },
      { id: uid(), action: 'CONSIDER DIURETIC', dose: makeDose('Furosemide (Lasix)', 1, 'mg', 'IV', { maxDose: 40, preparation: 'Dose range: 1-2 mg/kg IV. Monitor urine output. Consider inotrope support.' }), status: 'pending' },
      { id: uid(), action: 'CONSIDER INOTROPE', dose: makeDose('Dobutamine infusion', 5, 'mcg/kg', '/min IV', { preparation: 'Start at 5 mcg/kg/min. Range: 2-20 mcg/kg/min. For cardiogenic shock with heart failure.' }), status: 'pending' },
    ]
  },
  {
    id: 'active_bleeding',
    name: 'Active Bleeding',
    letter: 'C',
    severity: 'urgent',
    condition: (f) => f.bleeding === 'bleeding',
    interventions: () => [
      { id: uid(), action: 'DIRECT PRESSURE', detail: 'Apply direct pressure to bleeding site. Elevate if limb.', critical: true, status: 'pending' },
      { id: uid(), action: 'TRANEXAMIC ACID (TXA)', dose: makeDose('Tranexamic Acid (TXA)', 15, 'mg', 'IV over 10 min', { maxDose: 1000 }), status: 'pending' },
    ]
  },

  // ─── D: Disability Threats ───
  {
    id: 'hypoglycemia',
    name: 'Hypoglycemia',
    letter: 'D',
    severity: 'critical',
    condition: (f, s) => {
      const glucose = s.vitalSigns.glucose;
      return glucose !== undefined && glucose < 3.5;
    },
    interventions: () => [
      { id: uid(), action: 'DEXTROSE 10% IV', dose: makeDose('Dextrose 10% (D10W)', 5, 'mL', 'IV over 5 min', { preparation: '2-5 mL/kg of D10W. If no IV: Glucagon 0.5mg IM (<25kg) or 1mg IM (≥25kg).' }), critical: true, status: 'pending' },
      { id: uid(), action: 'RECHECK GLUCOSE IN 15 MIN', detail: 'Recheck blood glucose. If still low, repeat dextrose. Start maintenance dextrose infusion (D10W at maintenance rate).', timerSeconds: 900, status: 'pending' },
    ]
  },
  {
    id: 'hyperglycemia',
    name: 'Hyperglycemia — Consider Metabolic Acidosis Differentials',
    letter: 'D',
    severity: 'urgent',
    condition: (f, s) => {
      const glucose = s.vitalSigns.glucose;
      return glucose !== undefined && glucose > 14;
    },
    interventions: () => [
      { id: uid(), action: 'CHECK KETONES + LACTATE + VBG', detail: 'Urine ketones, serum ketones, lactate, and venous blood gas (pH, HCO3, BE). These differentiate DKA from other causes of hyperglycemia.', critical: true, status: 'pending' },
      { id: uid(), action: 'DIFFERENTIAL DIAGNOSIS', detail: '⚠️ Hyperglycemia does NOT automatically mean DKA. Consider:\n• DKA: Glucose >14 + ketones + acidosis (pH <7.3, HCO3 <15)\n• Stress hyperglycemia: Sepsis, trauma, or critical illness can cause hyperglycemia WITHOUT ketoacidosis\n• Starvation ketones + stress hyperglycemia: Septic child with poor feeding may have ketones + elevated glucose\n\nConfirm with ketones AND blood gas before starting DKA protocol.', status: 'pending' },
      { id: uid(), action: 'DO NOT GIVE INSULIN YET', detail: '⚠️ Insulin is part of definitive DKA management, NOT primary survey. Stabilize ABCDE first. Use 10 mL/kg boluses only (NOT 20 mL/kg — risk of cerebral edema in DKA).', status: 'pending' },
    ]
  },
  {
    id: 'raised_icp',
    name: 'Raised ICP — Unequal/Fixed Pupils',
    letter: 'D',
    severity: 'critical',
    condition: (f) => f.pupils === 'unequal' || f.pupils === 'fixed',
    interventions: () => [
      { id: uid(), action: 'HEAD UP 30°', detail: 'Elevate head of bed 30°. Keep head midline. Avoid neck compression (loosen collar).', critical: true, status: 'pending' },
      { id: uid(), action: 'HYPERTONIC SALINE 3%', dose: makeDose('Hypertonic Saline 3%', 5, 'mL', 'IV over 10-15 min', { preparation: 'Or Mannitol 20%: 5 mL/kg (= 1g/kg) IV over 15-20 min' }), critical: true, status: 'pending' },
      { id: uid(), action: 'URGENT NEUROSURGICAL CONSULT', detail: 'Call neurosurgery. Consider CT head if stable enough to transport.', status: 'pending' },
    ]
  },
  {
    id: 'active_seizure',
    name: 'Active Seizure',
    letter: 'D',
    severity: 'critical',
    condition: (f) => f.seizure_activity === 'active',
    interventions: () => [
      { id: uid(), action: 'PROTECT PATIENT', detail: 'Place in recovery position. Clear surroundings. Do NOT restrain. Do NOT put anything in mouth. Note time of seizure onset.', critical: true, status: 'pending' },
      { id: uid(), action: 'BENZODIAZEPINE (1st line)', dose: makeDose('Diazepam', 0.3, 'mg', 'IV/IO (or 0.5 mg/kg PR if no IV)', { maxDose: 10, preparation: 'IV: 0.3 mg/kg (max 10mg). PR: 0.5 mg/kg (max 20mg). Or Midazolam 0.15mg/kg IV / 0.2mg/kg IN / 0.3mg/kg buccal.' }), critical: true, status: 'pending', timerSeconds: 300, reassessAfter: 'Has seizure stopped after 5 minutes?' },
      { id: uid(), action: 'REPEAT BENZODIAZEPINE (if still seizing at 5 min)', dose: makeDose('Diazepam', 0.3, 'mg', 'IV/IO', { maxDose: 10, preparation: 'Repeat once if seizure continues after 5 min. Max 2 doses of benzodiazepine.' }), status: 'pending' },
      { id: uid(), action: 'PHENYTOIN (2nd line if still seizing)', dose: makeDose('Phenytoin', 20, 'mg', 'IV over 20 min', { maxDose: 1500, preparation: 'Or Levetiracetam 40mg/kg IV over 15 min (max 3000mg). Or Phenobarbital 20mg/kg IV over 20 min.' }), status: 'pending' },
    ]
  },
  {
    id: 'elevated_lactate',
    name: 'Elevated Lactate — Tissue Hypoperfusion',
    letter: 'D',
    severity: 'urgent',
    condition: (f, s) => {
      const lactate = s.vitalSigns.lactate;
      return lactate !== undefined && lactate > 2;
    },
    interventions: () => [
      { id: uid(), action: 'IDENTIFY CAUSE OF ELEVATED LACTATE', detail: 'Elevated lactate indicates tissue hypoperfusion or anaerobic metabolism. Causes:\n• Shock (any type) — most common\n• Severe anemia\n• Seizures (transient elevation)\n• Liver failure (impaired clearance)\n• Medications (metformin, epinephrine)\n• Mesenteric ischemia', critical: true, status: 'pending' },
      { id: uid(), action: 'OPTIMIZE PERFUSION', detail: 'Treat the underlying cause. If shock → fluid resuscitation + vasopressors as indicated. Recheck lactate in 2-4 hours to assess trend.', status: 'pending' },
    ]
  },

  // ─── E: Exposure Threats ───
  {
    id: 'fever_infection',
    name: 'Fever — Suspect Infection',
    letter: 'E',
    severity: 'urgent',
    condition: (f, s) => {
      const temp = s.vitalSigns.temp;
      return temp !== undefined && temp > 38;
    },
    interventions: (s) => {
      const isNeonate = getAgeCategory(s.patientAge) === 'neonate';
      return [
        { id: uid(), action: 'BLOOD CULTURES BEFORE ANTIBIOTICS', detail: 'Draw blood cultures, CBC, CRP, lactate if possible. Do NOT delay antibiotics for cultures if critically ill.', status: 'pending' },
        {
          id: uid(),
          action: isNeonate ? 'CEFOTAXIME (Neonate-safe)' : 'CEFTRIAXONE (High Dose)',
          dose: isNeonate
            ? makeDose('Cefotaxime', 50, 'mg', 'IV', { preparation: 'Preferred in neonates: avoids bilirubin displacement and renal toxicity risk.' })
            : makeDose('Ceftriaxone', 80, 'mg', 'IV', { maxDose: 4000, preparation: 'High dose for suspected meningitis coverage.' }),
          critical: true, status: 'pending'
        },
        { id: uid(), action: 'ANTIPYRETIC', dose: makeDose('Paracetamol (Acetaminophen)', 15, 'mg', 'PO/IV/PR', { maxDose: 1000, frequency: 'Every 4-6 hours' }), status: 'pending' },
      ];
    }
  },
  {
    id: 'anaphylaxis',
    name: 'Anaphylaxis',
    letter: 'E',
    severity: 'critical',
    condition: (f) => f.other_exposure === 'allergic' || (f.rash === 'urticaria' && (f.breathing_effort === 'labored' || f.skin_temperature === 'cold' || f.skin_temperature === 'cool')),
    interventions: (s) => {
      const fluid = getDefaultFluid(s);
      return [
        { id: uid(), action: 'EPINEPHRINE IM (FIRST LINE)', dose: makeDose('Epinephrine (1:1000)', 0.01, 'mL', 'IM anterolateral thigh', { maxDose: 0.5, preparation: '0.01 mg/kg = 0.01 mL/kg of 1:1000. Can repeat every 5-15 min.', frequency: 'Every 5-15 min if needed' }), critical: true, status: 'pending', timerSeconds: 300, reassessAfter: 'Reassess: Is anaphylaxis improving?' },
        { id: uid(), action: 'HIGH-FLOW OXYGEN', detail: '15L/min via non-rebreather mask.', critical: true, status: 'pending' },
        { id: uid(), action: 'FLUID BOLUS', dose: makeDose(fluid.name, 10, 'mL', 'IV/IO rapid bolus', { preparation: `For hypotension in anaphylaxis. ${fluid.rationale}` }), status: 'pending' },
        { id: uid(), action: 'REMOVE TRIGGER', detail: 'Stop infusion, remove allergen if identifiable.', status: 'pending' },
      ];
    }
  },
  {
    id: 'meningitis_signs',
    name: 'Suspected Meningitis',
    letter: 'E',
    severity: 'critical',
    condition: (f, s) => {
      const temp = s.vitalSigns.temp;
      const hasFever = temp !== undefined && temp > 38;
      return hasFever && f.rash === 'petechiae' && (f.avpu === 'pain' || f.avpu === 'unresponsive');
    },
    interventions: (s) => {
      const isNeonate = getAgeCategory(s.patientAge) === 'neonate';
      return [
        {
          id: uid(),
          action: 'IMMEDIATE ANTIBIOTICS',
          dose: isNeonate
            ? makeDose('Cefotaxime', 50, 'mg', 'IV', { preparation: 'Neonate: Cefotaxime preferred. Add Ampicillin 50mg/kg for Listeria coverage.' })
            : makeDose('Ceftriaxone', 100, 'mg', 'IV', { maxDose: 4000, preparation: 'Meningitis dose. Give IMMEDIATELY. Do not delay for LP.' }),
          critical: true, status: 'pending'
        },
        { id: uid(), action: 'DEXAMETHASONE (before or with 1st antibiotic dose)', dose: makeDose('Dexamethasone', 0.15, 'mg', 'IV', { maxDose: 10, preparation: 'Give before or with first dose of antibiotics. Reduces neurological sequelae.' }), status: 'pending' },
      ];
    }
  },
  {
    id: 'nai',
    name: 'Suspected Non-Accidental Injury',
    letter: 'E',
    severity: 'urgent',
    condition: (f) => f.rash === 'nai_bruising' || f.other_exposure === 'nai',
    interventions: () => [
      { id: uid(), action: 'DOCUMENT ALL FINDINGS', detail: 'Document location, size, shape, color of all injuries. Photograph if possible. Note inconsistencies between history and injuries.', critical: true, status: 'pending' },
      { id: uid(), action: 'REPORT TO SAFEGUARDING', detail: 'Mandatory reporting. Contact hospital safeguarding team / child protection services.', status: 'pending' },
    ]
  },
  {
    id: 'poisoning',
    name: 'Suspected Poisoning / Ingestion',
    letter: 'E',
    severity: 'urgent',
    condition: (f) => f.other_exposure === 'poisoning',
    interventions: () => [
      { id: uid(), action: 'IDENTIFY SUBSTANCE', detail: 'What was ingested? How much? When? Check containers, ask witnesses.', critical: true, status: 'pending' },
      { id: uid(), action: 'CONTACT POISON CENTER', detail: 'Call poison control for substance-specific guidance. Do NOT induce vomiting unless specifically advised.', status: 'pending' },
      { id: uid(), action: 'ACTIVATED CHARCOAL (if indicated)', dose: makeDose('Activated Charcoal', 1, 'g', 'PO', { maxDose: 50, preparation: 'Only if ingestion < 1 hour and substance is adsorbable. Contraindicated if reduced consciousness or caustic ingestion.' }), status: 'pending' },
    ]
  },
];

// ─── Safety Check Rules ─────────────────────────────────────

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
    message: '⚠️ INSULIN RUNNING WITHOUT POTASSIUM — Risk of fatal hypokalemia. Add KCl 20-40 mmol/L to IV fluids BEFORE or WITH insulin.',
    severity: 'danger',
  },
  {
    id: 'excessive_boluses',
    condition: (s) => s.bolusCount >= 3,
    message: '⚠️ 3+ FLUID BOLUSES GIVEN — Reassess for fluid overload. Consider vasopressors if still in shock. Check: crackles, hepatomegaly, JVP, respiratory distress.',
    severity: 'warning',
  },
  {
    id: 'bolus_in_hyperglycemia',
    condition: (s) => {
      const glucose = s.vitalSigns.glucose;
      return s.bolusCount >= 1 && glucose !== undefined && glucose > 14;
    },
    message: '⚠️ FLUID BOLUSING WITH HYPERGLYCEMIA — Use 10 mL/kg boluses ONLY (not 20 mL/kg). Risk of cerebral edema from rapid osmolality changes.',
    severity: 'danger',
  },
  {
    id: 'fluid_refractory',
    condition: (s) => s.fluidTracker.isFluidRefractory,
    message: '🚨 FLUID-REFRACTORY SHOCK (≥60 mL/kg given) — START VASOPRESSOR SUPPORT. Follow shock escalation ladder: Epinephrine (cold shock) or Norepinephrine (warm shock).',
    severity: 'danger',
  },
  {
    id: 'large_total_volume',
    condition: (s) => s.patientWeight !== null && s.fluidTracker.totalVolumePerKg >= 40 && !s.fluidTracker.isFluidRefractory,
    message: '⚠️ TOTAL BOLUS VOLUME ≥ 40 mL/kg — High risk of fluid overload. Strongly consider vasopressor support.',
    severity: 'danger',
  },
  {
    id: 'bolus_with_heart_failure',
    condition: (s) => {
      const hasHF = s.findings.some(f => f.id === 'heart_failure_signs' && (f.description === 'multiple' || f.description === 'hepatomegaly' || f.description === 'raised_jvp'));
      return hasHF && s.bolusCount >= 1;
    },
    message: '⚠️ BOLUSING WITH HEART FAILURE SIGNS — Risk of worsening pulmonary edema. Consider diuretics and inotropes instead of further fluid.',
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
    totalBolusVolume: 0,
    insulinRunning: false,
    potassiumAdded: false,
    vitalSigns: {},
    fluidTracker: {
      bolusCount: 0,
      totalVolumeMl: 0,
      totalVolumePerKg: 0,
      fluidType: getDefaultFluid({ patientAge: age ?? null } as ResusSession).name,
      isFluidRefractory: false,
      bolusHistory: [],
    },
    derivedPerfusion: null,
  };
}

// ─── Mid-Case Patient Info Update ───────────────────────────

export function updatePatientInfo(session: ResusSession, weight: number | null, age: string | null): ResusSession {
  const next = deepCopy(session);
  const changes: string[] = [];
  if (weight !== null && weight !== next.patientWeight) {
    changes.push(`Weight: ${weight}kg`);
    next.patientWeight = weight;
    // Recalculate fluid tracker per-kg
    if (weight > 0) {
      next.fluidTracker.totalVolumePerKg = next.fluidTracker.totalVolumeMl / weight;
      next.fluidTracker.isFluidRefractory = next.fluidTracker.totalVolumePerKg >= 60;
    }
  }
  if (age !== null && age !== next.patientAge) {
    changes.push(`Age: ${age}`);
    next.patientAge = age;
    // Update default fluid type based on new age
    next.fluidTracker.fluidType = getDefaultFluid(next).name;
  }
  if (changes.length > 0) {
    log(next, 'patient_info_updated', `Patient info updated: ${changes.join(', ')}`);
  }
  return next;
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
  log(next, 'phase_change', `Quick Assessment: ${answer === 'sick' ? 'SICK — Activate Emergency Response' : 'NOT SICK — Routine assessment'}`);

  next.phase = 'PRIMARY_SURVEY';
  if (answer === 'sick') {
    next.currentLetter = next.isTrauma ? 'X' : 'A';
    log(next, 'phase_change', `→ PRIMARY SURVEY starting at ${next.currentLetter}`);
  } else {
    next.currentLetter = 'A';
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
  question: AssessmentQuestion,
  numericValue?: number,
  numericValue2?: number,
): ResusSession {
  const next = deepCopy(session);

  let severity: Severity = 'monitor';
  let label = answer;
  let value: string | number | undefined;
  let unit: string | undefined;

  if (question.inputType === 'number' && question.numberConfig && numericValue !== undefined) {
    const interp = question.numberConfig.interpret(numericValue, next);
    severity = interp.severity;
    label = interp.label;
    value = numericValue;
    unit = question.numberConfig.unit;
    
    // Store in vitalSigns
    if (questionId === 'heart_rate') next.vitalSigns.hr = numericValue;
    else if (questionId === 'respiratory_rate') next.vitalSigns.rr = numericValue;
    else if (questionId === 'spo2') next.vitalSigns.spo2 = numericValue;
    else if (questionId === 'temperature') next.vitalSigns.temp = numericValue;
    else if (questionId === 'crt') next.vitalSigns.crt = numericValue;
    else if (questionId === 'lactate') next.vitalSigns.lactate = numericValue;
    else if (questionId === 'glucose') {
      next.vitalSigns.glucose = numericValue;
      next.vitalSigns.glucoseMgDl = Math.round(numericValue * 18);
    }
  } else if (question.inputType === 'number_pair' && question.numberPairConfig && numericValue !== undefined && numericValue2 !== undefined) {
    const interp = question.numberPairConfig.interpret(numericValue, numericValue2, next);
    severity = interp.severity;
    label = interp.label;
    value = numericValue;
    unit = question.numberPairConfig.unit;
    
    if (questionId === 'blood_pressure') {
      next.vitalSigns.sbp = numericValue;
      next.vitalSigns.dbp = numericValue2;
    }
  } else if (question.inputType === 'select' && question.options) {
    const option = question.options.find(o => o.value === answer);
    severity = option?.severity || 'monitor';
    label = option?.label || answer;
  }

  // Record finding with objective value
  const finding: Finding = {
    id: questionId,
    letter: question.letter,
    description: answer,
    value,
    unit,
    severity,
    timestamp: Date.now(),
  };

  next.findings.push(finding);
  log(next, 'finding', `${question.letter}: ${question.text} → ${label}`, question.letter, { value, unit });

  // Derive perfusion state after C questions
  if (question.letter === 'C') {
    next.derivedPerfusion = derivePerfusionState(next);
  }

  // Detect threats from accumulated findings
  const findingsMap: Record<string, string> = {};
  next.findings.forEach(f => { findingsMap[f.id] = f.description; });

  for (const rule of threatRules) {
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
    const urgentThreats = next.threats.filter(t => t.letter === next.currentLetter && !t.resolved && t.severity === 'urgent');
    if (urgentThreats.length > 0) {
      next.phase = 'INTERVENTION';
      log(next, 'phase_change', `→ INTERVENTION for urgent threats at ${next.currentLetter}`);
      return next;
    }

    const nextLetter = getNextLetter(next.currentLetter, next.isTrauma);
    if (nextLetter) {
      next.currentLetter = nextLetter;
      log(next, 'phase_change', `→ PRIMARY SURVEY: ${nextLetter}`);
    } else {
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
      intervention.status = 'completed';
      intervention.completedAt = Date.now();
      log(next, 'intervention_completed', `✓ ${intervention.action}`, threat.letter);

      // Track boluses with fluid tracker
      if (intervention.action.includes('FLUID BOLUS') || intervention.action.includes('BOLUS')) {
        next.bolusCount++;
        next.fluidTracker.bolusCount++;
        if (next.patientWeight && intervention.dose) {
          const volumeMl = intervention.dose.dosePerKg * next.patientWeight;
          next.totalBolusVolume += volumeMl;
          next.fluidTracker.totalVolumeMl += volumeMl;
          next.fluidTracker.totalVolumePerKg = next.fluidTracker.totalVolumeMl / next.patientWeight;
          next.fluidTracker.isFluidRefractory = next.fluidTracker.totalVolumePerKg >= 60;
          next.fluidTracker.bolusHistory.push({
            timestamp: Date.now(),
            volumeMl,
            fluidType: intervention.dose.drug,
          });
          log(next, 'note', `Fluid tracker: ${Math.round(next.fluidTracker.totalVolumePerKg)} mL/kg total (${next.fluidTracker.bolusCount} boluses)`);
        }
      }
      if (intervention.action.includes('INSULIN')) {
        next.insulinRunning = true;
      }
      if (intervention.action.includes('POTASSIUM') || intervention.action.includes('KCl')) {
        next.potassiumAdded = true;
      }

      // Start timer
      if (intervention.timerSeconds) {
        next.activeTimers.push({
          interventionId: intervention.id,
          endsAt: Date.now() + intervention.timerSeconds * 1000,
        });
      }

      break;
    }
  }

  runSafetyChecks(next);
  return next;
}

export function startIntervention(session: ResusSession, interventionId: string): ResusSession {
  const next = deepCopy(session);
  for (const threat of next.threats) {
    const intervention = threat.interventions.find(i => i.id === interventionId);
    if (intervention) {
      intervention.status = 'in_progress';
      intervention.startedAt = Date.now();
      log(next, 'intervention_started', `▶ Started: ${intervention.action}`, threat.letter);
      break;
    }
  }
  return next;
}

export function returnToPrimarySurvey(session: ResusSession): ResusSession {
  const next = deepCopy(session);

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

function log(session: ResusSession, type: ClinicalEvent['type'], detail: string, letter?: ABCDELetter, data?: Record<string, unknown>): void {
  session.events.push({ timestamp: Date.now(), type, letter, detail, data });
}

function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Get Active Threats ─────────────────────────────────────

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

export function getPendingInterventions(threat: Threat): Intervention[] {
  return threat.interventions.filter(i => i.status === 'pending' || i.status === 'in_progress');
}

export function getAllPendingCritical(session: ResusSession): { threat: Threat; intervention: Intervention }[] {
  const result: { threat: Threat; intervention: Intervention }[] = [];
  for (const threat of getActiveThreats(session)) {
    for (const intervention of threat.interventions) {
      if ((intervention.status === 'pending' || intervention.status === 'in_progress') && intervention.critical) {
        result.push({ threat, intervention });
      }
    }
  }
  return result;
}

// ─── Suggested Diagnoses ────────────────────────────────────

export interface DiagnosisSuggestion {
  diagnosis: string;
  confidence: 'high' | 'moderate' | 'low';
  supportingFindings: string[];
  differentials?: string[];
  protocol: string;
}

export function getSuggestedDiagnoses(session: ResusSession): DiagnosisSuggestion[] {
  const f: Record<string, string> = {};
  session.findings.forEach(finding => { f[finding.id] = finding.description; });
  const suggestions: DiagnosisSuggestion[] = [];
  const vs = session.vitalSigns;

  // Metabolic Acidosis Differentials (not DKA tunnel vision)
  if (f.breathing_effort === 'deep_labored') {
    if (vs.glucose !== undefined && vs.glucose > 14) {
      suggestions.push({
        diagnosis: 'Metabolic Acidosis — Possible DKA',
        confidence: 'moderate',
        supportingFindings: [`Glucose ${vs.glucose} mmol/L`, 'Deep labored breathing (Kussmaul)'],
        differentials: [
          'DKA (confirm with ketones + pH <7.3 + HCO3 <15)',
          'Stress hyperglycemia + sepsis with lactic acidosis',
          'Starvation ketones + stress hyperglycemia (poor feeding + critical illness)',
        ],
        protocol: 'Check ketones + VBG (pH, HCO3, BE) + lactate to differentiate. Do NOT assume DKA without confirmation.',
      });
    } else {
      suggestions.push({
        diagnosis: 'Metabolic Acidosis — Identify Cause',
        confidence: 'moderate',
        supportingFindings: ['Deep labored breathing (Kussmaul)', ...(vs.lactate && vs.lactate > 2 ? [`Lactate ${vs.lactate} mmol/L`] : [])],
        differentials: [
          'Lactic acidosis from shock/sepsis',
          'Renal failure (check urea/creatinine)',
          'Poisoning (salicylates, methanol, ethylene glycol)',
          'Severe dehydration',
          'DKA (check glucose + ketones)',
        ],
        protocol: 'Urgent: VBG (pH, HCO3, BE), lactate, glucose, ketones, urea/creatinine. Treat underlying cause.',
      });
    }
  }

  // DKA (only if glucose high AND deep labored breathing)
  if (vs.glucose !== undefined && vs.glucose > 14 && f.breathing_effort === 'deep_labored') {
    // Already covered above as metabolic acidosis differential
  } else if (vs.glucose !== undefined && vs.glucose > 14) {
    suggestions.push({
      diagnosis: 'Hyperglycemia — Rule Out DKA',
      confidence: 'low',
      supportingFindings: [`Glucose ${vs.glucose} mmol/L`],
      differentials: [
        'DKA (needs ketones + acidosis to confirm)',
        'Stress hyperglycemia (common in critical illness)',
        'New-onset diabetes without ketoacidosis',
      ],
      protocol: 'Check ketones to differentiate. If positive ketones + acidosis → DKA Protocol.',
    });
  }

  // Sepsis
  const perfusion = session.derivedPerfusion;
  if (vs.temp !== undefined && vs.temp > 38 && (perfusion === 'cold_shock' || perfusion === 'warm_shock' || perfusion === 'severe_cold_shock' || perfusion === 'poor' || perfusion === 'very_poor')) {
    suggestions.push({
      diagnosis: 'Sepsis / Septic Shock',
      confidence: 'high',
      supportingFindings: [`Temp ${vs.temp}°C`, `Perfusion: ${perfusion}`, ...(f.rash === 'petechiae' ? ['Petechiae/Purpura'] : []), ...(vs.lactate && vs.lactate > 2 ? [`Lactate ${vs.lactate} mmol/L`] : [])],
      protocol: 'Sepsis Bundle: Cultures → Antibiotics → 10 mL/kg balanced crystalloid boluses → Vasopressors if refractory',
    });
  }

  // Anaphylaxis
  if (f.rash === 'urticaria' && (f.breathing_effort === 'labored' || perfusion === 'poor' || perfusion === 'cold_shock')) {
    suggestions.push({
      diagnosis: 'Anaphylaxis',
      confidence: 'high',
      supportingFindings: ['Urticaria', ...(f.breathing_effort === 'labored' ? ['Respiratory distress'] : []), ...(perfusion && perfusion !== 'normal' ? ['Shock'] : [])],
      protocol: 'Anaphylaxis: Epinephrine IM → O2 → Fluids → Remove trigger',
    });
  }

  // Meningitis
  if (vs.temp !== undefined && vs.temp > 38 && (f.avpu === 'pain' || f.avpu === 'unresponsive') && f.rash === 'petechiae') {
    suggestions.push({
      diagnosis: 'Meningitis / Meningococcal Sepsis',
      confidence: 'high',
      supportingFindings: [`Temp ${vs.temp}°C`, 'Altered consciousness', 'Petechiae/Purpura'],
      protocol: 'IMMEDIATE: Ceftriaxone 100mg/kg IV + Dexamethasone 0.15mg/kg IV. Do NOT delay for LP.',
    });
  }

  // Status Epilepticus
  if (f.seizure_activity === 'active') {
    suggestions.push({
      diagnosis: 'Status Epilepticus',
      confidence: 'high',
      supportingFindings: ['Active seizure'],
      protocol: 'Benzodiazepine → Repeat at 5 min → Phenytoin/Levetiracetam if refractory',
    });
  }

  // Raised ICP
  if (f.pupils === 'unequal' || f.pupils === 'fixed') {
    suggestions.push({
      diagnosis: 'Raised Intracranial Pressure',
      confidence: 'moderate',
      supportingFindings: [f.pupils === 'unequal' ? 'Unequal pupils' : 'Fixed dilated pupils'],
      protocol: 'Head up 30° + Hypertonic saline 3% 5mL/kg IV + Urgent neurosurgery consult',
    });
  }

  return suggestions;
}

// ─── Export Clinical Record ─────────────────────────────────

export function exportClinicalRecord(session: ResusSession): string {
  const lines: string[] = [];
  lines.push('═══════════════════════════════════════════');
  lines.push('  ResusGPS — CLINICAL RECORD');
  lines.push('═══════════════════════════════════════════');
  lines.push(`Date: ${new Date(session.startTime).toLocaleString()}`);
  if (session.patientWeight) lines.push(`Weight: ${session.patientWeight} kg`);
  if (session.patientAge) lines.push(`Age: ${session.patientAge}`);
  lines.push(`Quick Assessment: ${session.quickAssessment || 'N/A'}`);
  if (session.definitiveDiagnosis) lines.push(`Diagnosis: ${session.definitiveDiagnosis}`);
  lines.push('');

  // Vital Signs
  const vs = session.vitalSigns;
  lines.push('── VITAL SIGNS ──');
  if (vs.hr !== undefined) lines.push(`HR: ${vs.hr} bpm`);
  if (vs.rr !== undefined) lines.push(`RR: ${vs.rr} /min`);
  if (vs.spo2 !== undefined) lines.push(`SpO2: ${vs.spo2}%`);
  if (vs.sbp !== undefined && vs.dbp !== undefined) lines.push(`BP: ${vs.sbp}/${vs.dbp} mmHg`);
  if (vs.temp !== undefined) lines.push(`Temp: ${vs.temp}°C`);
  if (vs.glucose !== undefined) lines.push(`Glucose: ${vs.glucose} mmol/L (${Math.round(vs.glucose * 18)} mg/dL)`);
  if (vs.crt !== undefined) lines.push(`CRT: ${vs.crt} seconds`);
  if (vs.lactate !== undefined) lines.push(`Lactate: ${vs.lactate} mmol/L`);
  lines.push('');

  // Fluid Tracker
  if (session.fluidTracker.bolusCount > 0) {
    lines.push('── FLUID RESUSCITATION ──');
    lines.push(`Boluses given: ${session.fluidTracker.bolusCount}`);
    lines.push(`Total volume: ${Math.round(session.fluidTracker.totalVolumeMl)} mL`);
    if (session.patientWeight) {
      lines.push(`Volume per kg: ${Math.round(session.fluidTracker.totalVolumePerKg)} mL/kg`);
    }
    lines.push(`Fluid type: ${session.fluidTracker.fluidType}`);
    if (session.fluidTracker.isFluidRefractory) lines.push('⚠️ FLUID-REFRACTORY SHOCK');
    lines.push('');
  }

  // Derived Perfusion
  if (session.derivedPerfusion) {
    lines.push(`Perfusion state (engine-derived): ${session.derivedPerfusion}`);
    lines.push('');
  }

  // Findings
  lines.push('── FINDINGS ──');
  for (const finding of session.findings) {
    const val = finding.value !== undefined ? ` = ${finding.value}${finding.unit ? ' ' + finding.unit : ''}` : '';
    lines.push(`[${finding.letter}] ${finding.id}: ${finding.description}${val}`);
  }
  lines.push('');

  // Threats
  lines.push('── THREATS IDENTIFIED ──');
  for (const threat of session.threats) {
    lines.push(`[${threat.letter}] ${threat.name} (${threat.severity})`);
    for (const intervention of threat.interventions) {
      const status = intervention.status === 'completed' ? '✓' : intervention.status === 'in_progress' ? '▶' : '○';
      lines.push(`  ${status} ${intervention.action}`);
    }
  }
  lines.push('');

  // Safety Alerts
  if (session.safetyAlerts.length > 0) {
    lines.push('── SAFETY ALERTS ──');
    for (const alert of session.safetyAlerts) {
      lines.push(`[${alert.severity.toUpperCase()}] ${alert.message}`);
    }
    lines.push('');
  }

  // SAMPLE History
  if (Object.values(session.sampleHistory).some(v => v)) {
    lines.push('── SAMPLE HISTORY ──');
    if (session.sampleHistory.signs) lines.push(`S: ${session.sampleHistory.signs}`);
    if (session.sampleHistory.allergies) lines.push(`A: ${session.sampleHistory.allergies}`);
    if (session.sampleHistory.medications) lines.push(`M: ${session.sampleHistory.medications}`);
    if (session.sampleHistory.pastHistory) lines.push(`P: ${session.sampleHistory.pastHistory}`);
    if (session.sampleHistory.lastMeal) lines.push(`L: ${session.sampleHistory.lastMeal}`);
    if (session.sampleHistory.events) lines.push(`E: ${session.sampleHistory.events}`);
    lines.push('');
  }

  // Event Log
  lines.push('── EVENT LOG ──');
  for (const event of session.events) {
    const time = new Date(event.timestamp).toLocaleTimeString();
    lines.push(`[${time}] ${event.detail}`);
  }

  return lines.join('\n');
}

// ─── LETTER_CONFIG for UI ───────────────────────────────────

export const LETTER_CONFIG: Record<ABCDELetter, { label: string; color: string; bgColor: string; icon: string }> = {
  X: { label: 'X — Exsanguination', color: 'text-red-400', bgColor: 'bg-red-500/10', icon: '🩸' },
  A: { label: 'A — Airway (+ AVPU)', color: 'text-blue-400', bgColor: 'bg-blue-500/10', icon: '🫁' },
  B: { label: 'B — Breathing', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', icon: '💨' },
  C: { label: 'C — Circulation', color: 'text-rose-400', bgColor: 'bg-rose-500/10', icon: '❤️' },
  D: { label: 'D — Disability', color: 'text-amber-400', bgColor: 'bg-amber-500/10', icon: '🧠' },
  E: { label: 'E — Exposure', color: 'text-purple-400', bgColor: 'bg-purple-500/10', icon: '👁️' },
};
