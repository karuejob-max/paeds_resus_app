// Clinical Reasoning Engine - Type Definitions

export type PatientType = 'neonate' | 'child' | 'pregnant_postpartum' | 'adult';

export type PhysiologicState =
  | 'cardiac_arrest'
  | 'respiratory_arrest'
  | 'severe_bleeding'
  | 'unresponsive'
  | 'seizure'
  | 'shock'
  | 'severe_respiratory_distress'
  | 'stroke_symptoms'
  | 'sepsis_suspected'
  | 'poisoning'
  | 'severe_pain'
  | 'other_emergency';

export interface AirwayAssessment {
  status: 'patent' | 'obstructed' | 'secured';
  observations: {
    vomiting?: boolean;
    blood_secretions?: boolean;
    foreign_body?: boolean;
    stridor?: boolean;
    snoring?: boolean;
    gurgling?: boolean;
  };
  interventions: {
    suctioning?: boolean;
    head_positioning?: boolean;
    oropharyngeal_airway?: boolean;
    nasopharyngeal_airway?: boolean;
    lma_igel?: boolean;
    ett?: boolean;
  };
  notes?: string;
}

export interface BreathingAssessment {
  rate: number; // breaths per minute
  pattern: 'normal' | 'deep_kussmaul' | 'shallow' | 'irregular' | 'apneic';
  effort: 'normal' | 'increased' | 'minimal';
  effortSigns: {
    retractions?: boolean;
    nasal_flaring?: boolean;
    grunting?: boolean;
    head_bobbing?: boolean;
  };
  spO2: number; // percentage
  oxygenTherapy?: {
    type: 'room_air' | 'nasal_cannula' | 'simple_mask' | 'non_rebreather' | 'bvm' | 'ventilator';
    flow?: number; // L/min
    fiO2?: number; // percentage
  };
  auscultation?: {
    wheezing?: boolean;
    crackles?: boolean;
    decreased_air_entry?: boolean;
    stridor?: boolean;
    silent_chest?: boolean;
  };
  notes?: string;
}

export interface CirculationAssessment {
  heartRate: number; // bpm
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  perfusion: {
    capillary_refill: 'normal' | 'delayed' | 'very_delayed'; // <2s, 2-4s, >4s
    peripheral_pulses: 'strong' | 'weak' | 'absent';
    central_pulses: 'strong' | 'weak' | 'absent';
    skin_temperature: 'warm' | 'cool' | 'cold';
    skin_color: 'pink' | 'pale' | 'mottled' | 'cyanotic';
  };
  rhythm?: 'regular' | 'irregular' | 'svt' | 'bradycardia';
  murmur?: boolean;
  signs_of_heart_failure?: {
    hepatomegaly?: boolean;
    jugular_venous_distension?: boolean;
    peripheral_edema?: boolean;
    pulmonary_edema?: boolean;
  };
  history?: {
    polyuria?: boolean;
    oliguria?: boolean;
    diarrhea?: boolean;
    vomiting?: boolean;
    bleeding?: boolean;
    poor_feeding?: boolean;
  };
  notes?: string;
}

export interface DisabilityAssessment {
  avpu: 'alert' | 'voice' | 'pain' | 'unresponsive';
  gcs?: {
    eye: number; // 1-4
    verbal: number; // 1-5
    motor: number; // 1-6
    total: number; // 3-15
  };
  pupils: {
    size_left: number; // mm
    size_right: number; // mm
    reactive_left: boolean;
    reactive_right: boolean;
  };
  blood_glucose?: number; // mmol/L
  seizure?: {
    active?: boolean;
    just_stopped?: boolean;
    duration_minutes?: number;
  };
  posturing?: 'none' | 'decorticate' | 'decerebrate';
  notes?: string;
}

export interface ExposureAssessment {
  temperature: number; // Celsius
  weight: number; // kg
  age_years?: number;
  age_months?: number;
  age_days?: number;
  visible_injuries?: {
    bruising?: boolean;
    burns?: boolean;
    bleeding?: boolean;
    deformities?: boolean;
    rash?: boolean;
  };
  pregnancy_related?: {
    currently_pregnant?: boolean;
    gestational_age_weeks?: number;
    postpartum?: boolean;
    days_postpartum?: number;
  };
  notes?: string;
}

export interface PrimarySurveyData {
  patientType: PatientType;
  physiologicState: PhysiologicState;
  airway: AirwayAssessment;
  breathing: BreathingAssessment;
  circulation: CirculationAssessment;
  disability: DisabilityAssessment;
  exposure: ExposureAssessment;
  timestamp: Date;
}

export interface Differential {
  id: string;
  diagnosis: string;
  probability: number; // 0-1
  evidence: string[]; // List of supporting findings
  missing: string[]; // List of missing data points
  nextQuestions: string[]; // Questions to confirm/exclude
  category: 'immediate_threat' | 'critical' | 'urgent' | 'non_urgent';
}

export interface ClinicalQuestion {
  id: string;
  type: 'confirmatory' | 'exclusionary';
  text: string;
  differential_id: string; // Which differential this helps with
  impact: string; // What happens if positive/negative
  options?: string[]; // For multiple choice
}

export interface Intervention {
  id: string;
  name: string;
  category: 'immediate' | 'urgent' | 'confirmatory' | 'diagnostic';
  indication: string;
  contraindications: string[];
  requiredTests: RequiredTest[];
  riskIfWrong: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  benefitIfRight: 'low' | 'moderate' | 'high' | 'life_saving';
  timeWindow: 'minutes' | 'hours' | 'days';
  dosing?: {
    calculation: string; // e.g., "0.1 mg/kg"
    max_dose?: number;
    min_dose?: number;
    route: string; // IV, IM, PO, etc.
  };
  monitoring?: string[]; // What to monitor after giving
}

export interface RequiredTest {
  name: string;
  threshold?: string; // e.g., "pH <7.3", "K+ >6.5"
  priority: 'stat' | 'urgent' | 'routine';
}

export interface ClinicalReasoningResult {
  differentials: Differential[];
  topDifferential: Differential;
  smartQuestions: ClinicalQuestion[];
  immediateInterventions: Intervention[];
  urgentInterventions: Intervention[];
  confirmatoryInterventions: Intervention[];
  requiredTests: RequiredTest[];
  protocolRecommendation?: string; // Which protocol to launch
}

// Age-appropriate normal ranges
export interface VitalSignRanges {
  age_group: string;
  heart_rate: { min: number; max: number };
  respiratory_rate: { min: number; max: number };
  systolic_bp: { min: number; max: number };
  temperature: { min: number; max: number };
}

export const VITAL_SIGN_RANGES: VitalSignRanges[] = [
  {
    age_group: 'neonate_0_28_days',
    heart_rate: { min: 100, max: 180 },
    respiratory_rate: { min: 30, max: 60 },
    systolic_bp: { min: 60, max: 90 },
    temperature: { min: 36.5, max: 37.5 },
  },
  {
    age_group: 'infant_1_12_months',
    heart_rate: { min: 100, max: 160 },
    respiratory_rate: { min: 25, max: 50 },
    systolic_bp: { min: 70, max: 100 },
    temperature: { min: 36.5, max: 37.5 },
  },
  {
    age_group: 'toddler_1_3_years',
    heart_rate: { min: 90, max: 150 },
    respiratory_rate: { min: 20, max: 40 },
    systolic_bp: { min: 80, max: 110 },
    temperature: { min: 36.5, max: 37.5 },
  },
  {
    age_group: 'preschool_3_6_years',
    heart_rate: { min: 80, max: 140 },
    respiratory_rate: { min: 20, max: 30 },
    systolic_bp: { min: 85, max: 115 },
    temperature: { min: 36.5, max: 37.5 },
  },
  {
    age_group: 'school_age_6_12_years',
    heart_rate: { min: 70, max: 120 },
    respiratory_rate: { min: 18, max: 25 },
    systolic_bp: { min: 90, max: 120 },
    temperature: { min: 36.5, max: 37.5 },
  },
  {
    age_group: 'adolescent_12_18_years',
    heart_rate: { min: 60, max: 100 },
    respiratory_rate: { min: 12, max: 20 },
    systolic_bp: { min: 100, max: 130 },
    temperature: { min: 36.5, max: 37.5 },
  },
  {
    age_group: 'adult_18_plus',
    heart_rate: { min: 60, max: 100 },
    respiratory_rate: { min: 12, max: 20 },
    systolic_bp: { min: 90, max: 140 },
    temperature: { min: 36.5, max: 37.5 },
  },
];
