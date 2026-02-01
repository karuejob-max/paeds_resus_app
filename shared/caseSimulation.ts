/**
 * Case Simulation Mode
 * 
 * Practice scenarios for providers to build muscle memory and confidence
 * before actual emergencies. Includes timed events, scoring, and feedback.
 */

export type SimulationDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SimulationCategory = 
  | 'cardiac_arrest'
  | 'respiratory_failure'
  | 'anaphylaxis'
  | 'septic_shock'
  | 'status_epilepticus'
  | 'trauma'
  | 'neonatal'
  | 'dka';

export interface SimulationEvent {
  id: string;
  timeOffset: number; // seconds from start
  type: 'vital_change' | 'symptom' | 'deterioration' | 'improvement' | 'prompt' | 'critical';
  description: string;
  vitals?: Partial<PatientVitals>;
  expectedAction?: string;
  criticalWindow?: number; // seconds to respond
  points: number;
}

export interface PatientVitals {
  heartRate: number;
  respiratoryRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  oxygenSaturation: number;
  temperature: number;
  capillaryRefill: number;
  consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive';
  pupils: 'normal' | 'dilated' | 'constricted' | 'unequal';
}

export interface SimulationAction {
  id: string;
  name: string;
  category: 'assessment' | 'airway' | 'breathing' | 'circulation' | 'medication' | 'procedure' | 'communication' | 'monitoring';
  points: number;
  isCorrect: boolean;
  feedback: string;
  timeBonus?: number; // bonus points for quick action
}

export interface SimulationCase {
  id: string;
  title: string;
  category: SimulationCategory;
  difficulty: SimulationDifficulty;
  durationMinutes: number;
  description: string;
  learningObjectives: string[];
  patientProfile: {
    age: { years: number; months: number };
    weight: number;
    gender: 'male' | 'female';
    chiefComplaint: string;
    history: string;
    allergies: string[];
    medications: string[];
  };
  initialVitals: PatientVitals;
  events: SimulationEvent[];
  correctActions: SimulationAction[];
  incorrectActions: SimulationAction[];
  debriefingPoints: string[];
  passingScore: number;
  translations: {
    sw?: { title: string; description: string };
    fr?: { title: string; description: string };
    ar?: { title: string; description: string };
  };
}

export interface SimulationResult {
  caseId: string;
  startTime: Date;
  endTime: Date;
  totalScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  actionsPerformed: {
    actionId: string;
    timestamp: Date;
    pointsEarned: number;
    feedback: string;
  }[];
  missedActions: string[];
  criticalErrors: string[];
  timeToFirstAction: number;
  averageResponseTime: number;
}

/**
 * Simulation Cases Library
 */
export const SIMULATION_CASES: SimulationCase[] = [
  // CARDIAC ARREST - BEGINNER
  {
    id: 'cardiac_arrest_beginner',
    title: 'Pediatric Cardiac Arrest - Basic Response',
    category: 'cardiac_arrest',
    difficulty: 'beginner',
    durationMinutes: 10,
    description: 'A 5-year-old child collapses at school. You are the first responder. Practice the initial assessment and CPR sequence.',
    learningObjectives: [
      'Recognize cardiac arrest',
      'Perform high-quality CPR',
      'Use AED appropriately',
      'Coordinate team response'
    ],
    patientProfile: {
      age: { years: 5, months: 0 },
      weight: 18,
      gender: 'male',
      chiefComplaint: 'Sudden collapse, unresponsive',
      history: 'Previously healthy, playing soccer when collapsed',
      allergies: ['None known'],
      medications: []
    },
    initialVitals: {
      heartRate: 0,
      respiratoryRate: 0,
      bloodPressure: { systolic: 0, diastolic: 0 },
      oxygenSaturation: 0,
      temperature: 37.0,
      capillaryRefill: 5,
      consciousness: 'unresponsive',
      pupils: 'dilated'
    },
    events: [
      {
        id: 'e1',
        timeOffset: 0,
        type: 'prompt',
        description: 'Child is found unresponsive on the ground. What do you do first?',
        expectedAction: 'Check responsiveness and call for help',
        criticalWindow: 10,
        points: 10
      },
      {
        id: 'e2',
        timeOffset: 15,
        type: 'prompt',
        description: 'No pulse detected. What is your next action?',
        expectedAction: 'Start chest compressions',
        criticalWindow: 10,
        points: 20
      },
      {
        id: 'e3',
        timeOffset: 120,
        type: 'prompt',
        description: 'AED arrives. What do you do?',
        expectedAction: 'Apply AED pads and analyze rhythm',
        criticalWindow: 15,
        points: 15
      },
      {
        id: 'e4',
        timeOffset: 135,
        type: 'vital_change',
        description: 'AED advises shock. VF detected.',
        vitals: { heartRate: 0 },
        expectedAction: 'Deliver shock, resume CPR immediately',
        criticalWindow: 10,
        points: 20
      },
      {
        id: 'e5',
        timeOffset: 300,
        type: 'improvement',
        description: 'After 2nd shock, ROSC achieved.',
        vitals: {
          heartRate: 110,
          respiratoryRate: 8,
          bloodPressure: { systolic: 85, diastolic: 55 },
          oxygenSaturation: 88,
          consciousness: 'unresponsive'
        },
        points: 0
      }
    ],
    correctActions: [
      { id: 'a1', name: 'Check responsiveness', category: 'assessment', points: 10, isCorrect: true, feedback: 'Correct! Always check responsiveness first.' },
      { id: 'a2', name: 'Call for help/activate EMS', category: 'communication', points: 10, isCorrect: true, feedback: 'Good! Early activation improves outcomes.' },
      { id: 'a3', name: 'Check pulse (carotid/femoral)', category: 'assessment', points: 10, isCorrect: true, feedback: 'Correct! Pulse check should take <10 seconds.' },
      { id: 'a4', name: 'Start chest compressions', category: 'circulation', points: 20, isCorrect: true, feedback: 'Excellent! High-quality CPR is critical.', timeBonus: 5 },
      { id: 'a5', name: 'Open airway (head-tilt chin-lift)', category: 'airway', points: 10, isCorrect: true, feedback: 'Good airway management.' },
      { id: 'a6', name: 'Give rescue breaths', category: 'breathing', points: 10, isCorrect: true, feedback: 'Correct! 15:2 ratio with two rescuers.' },
      { id: 'a7', name: 'Apply AED pads', category: 'circulation', points: 10, isCorrect: true, feedback: 'Good! Use pediatric pads if available.' },
      { id: 'a8', name: 'Deliver shock when advised', category: 'circulation', points: 15, isCorrect: true, feedback: 'Correct! Resume CPR immediately after shock.' },
      { id: 'a9', name: 'Continue CPR after shock', category: 'circulation', points: 15, isCorrect: true, feedback: 'Excellent! Minimize interruptions.' }
    ],
    incorrectActions: [
      { id: 'i1', name: 'Give medications without IV/IO access', category: 'medication', points: -10, isCorrect: false, feedback: 'Cannot give IV medications without access.' },
      { id: 'i2', name: 'Delay CPR to get equipment', category: 'circulation', points: -20, isCorrect: false, feedback: 'Never delay CPR! Start compressions immediately.' },
      { id: 'i3', name: 'Shock asystole', category: 'circulation', points: -15, isCorrect: false, feedback: 'Asystole is not a shockable rhythm.' }
    ],
    debriefingPoints: [
      'Early recognition and CPR initiation are critical',
      'High-quality CPR: Rate 100-120, depth 1/3 AP diameter, full recoil',
      'Minimize interruptions to chest compressions',
      'AED use in children: Use pediatric pads/attenuator if <8 years or <25kg',
      'Team communication and role assignment improve efficiency'
    ],
    passingScore: 70,
    translations: {
      sw: {
        title: 'Kukamatwa kwa Moyo kwa Watoto - Jibu la Msingi',
        description: 'Mtoto wa miaka 5 anaanguka shuleni. Wewe ndiye mwokozi wa kwanza.'
      },
      fr: {
        title: 'Arrêt Cardiaque Pédiatrique - Réponse de Base',
        description: 'Un enfant de 5 ans s\'effondre à l\'école. Vous êtes le premier intervenant.'
      },
      ar: {
        title: 'السكتة القلبية للأطفال - الاستجابة الأساسية',
        description: 'طفل يبلغ من العمر 5 سنوات ينهار في المدرسة. أنت المستجيب الأول.'
      }
    }
  },

  // ANAPHYLAXIS - INTERMEDIATE
  {
    id: 'anaphylaxis_intermediate',
    title: 'Severe Anaphylaxis - Rapid Response',
    category: 'anaphylaxis',
    difficulty: 'intermediate',
    durationMinutes: 8,
    description: 'A 7-year-old develops severe allergic reaction after eating peanuts at a birthday party. Practice rapid recognition and epinephrine administration.',
    learningObjectives: [
      'Recognize anaphylaxis signs',
      'Administer epinephrine correctly',
      'Manage airway compromise',
      'Provide supportive care'
    ],
    patientProfile: {
      age: { years: 7, months: 0 },
      weight: 25,
      gender: 'female',
      chiefComplaint: 'Difficulty breathing, hives, swelling after eating peanuts',
      history: 'Known peanut allergy, has EpiPen but not available',
      allergies: ['Peanuts - severe'],
      medications: []
    },
    initialVitals: {
      heartRate: 140,
      respiratoryRate: 32,
      bloodPressure: { systolic: 75, diastolic: 45 },
      oxygenSaturation: 88,
      temperature: 37.2,
      capillaryRefill: 4,
      consciousness: 'alert',
      pupils: 'normal'
    },
    events: [
      {
        id: 'e1',
        timeOffset: 0,
        type: 'symptom',
        description: 'Child has widespread urticaria, facial swelling, audible wheeze, and is anxious.',
        expectedAction: 'Recognize anaphylaxis, prepare epinephrine',
        criticalWindow: 30,
        points: 15
      },
      {
        id: 'e2',
        timeOffset: 60,
        type: 'deterioration',
        description: 'Stridor developing, voice becoming hoarse.',
        vitals: {
          heartRate: 155,
          respiratoryRate: 40,
          oxygenSaturation: 82
        },
        expectedAction: 'Give epinephrine IM immediately',
        criticalWindow: 30,
        points: 25
      },
      {
        id: 'e3',
        timeOffset: 180,
        type: 'improvement',
        description: 'After epinephrine, symptoms improving.',
        vitals: {
          heartRate: 120,
          respiratoryRate: 24,
          bloodPressure: { systolic: 95, diastolic: 60 },
          oxygenSaturation: 94
        },
        points: 0
      },
      {
        id: 'e4',
        timeOffset: 300,
        type: 'prompt',
        description: 'Symptoms returning (biphasic reaction). What do you do?',
        expectedAction: 'Give second dose of epinephrine',
        criticalWindow: 60,
        points: 20
      }
    ],
    correctActions: [
      { id: 'a1', name: 'Remove allergen/stop exposure', category: 'assessment', points: 5, isCorrect: true, feedback: 'Good first step!' },
      { id: 'a2', name: 'Call for help', category: 'communication', points: 10, isCorrect: true, feedback: 'Early help is critical.' },
      { id: 'a3', name: 'Position patient (legs elevated if hypotensive)', category: 'circulation', points: 10, isCorrect: true, feedback: 'Correct positioning helps perfusion.' },
      { id: 'a4', name: 'Give epinephrine IM (0.01 mg/kg)', category: 'medication', points: 25, isCorrect: true, feedback: 'Excellent! Epinephrine is first-line treatment.', timeBonus: 10 },
      { id: 'a5', name: 'Give oxygen', category: 'breathing', points: 10, isCorrect: true, feedback: 'Good supportive care.' },
      { id: 'a6', name: 'Establish IV access', category: 'circulation', points: 10, isCorrect: true, feedback: 'Important for fluids and medications.' },
      { id: 'a7', name: 'Give IV fluids (20 mL/kg bolus)', category: 'circulation', points: 10, isCorrect: true, feedback: 'Correct! Anaphylaxis causes distributive shock.' },
      { id: 'a8', name: 'Give antihistamine (diphenhydramine)', category: 'medication', points: 5, isCorrect: true, feedback: 'Adjunct therapy, not first-line.' },
      { id: 'a9', name: 'Give corticosteroids', category: 'medication', points: 5, isCorrect: true, feedback: 'May help prevent biphasic reaction.' },
      { id: 'a10', name: 'Repeat epinephrine if needed', category: 'medication', points: 15, isCorrect: true, feedback: 'Can repeat every 5-15 minutes.' }
    ],
    incorrectActions: [
      { id: 'i1', name: 'Give antihistamine before epinephrine', category: 'medication', points: -10, isCorrect: false, feedback: 'Epinephrine is ALWAYS first-line in anaphylaxis!' },
      { id: 'i2', name: 'Give epinephrine IV push', category: 'medication', points: -15, isCorrect: false, feedback: 'IM is preferred route. IV epinephrine requires dilution and careful monitoring.' },
      { id: 'i3', name: 'Delay epinephrine for IV access', category: 'medication', points: -20, isCorrect: false, feedback: 'Never delay epinephrine! IM works quickly.' }
    ],
    debriefingPoints: [
      'Epinephrine is the ONLY first-line treatment for anaphylaxis',
      'IM injection in lateral thigh (vastus lateralis) is preferred',
      'Dose: 0.01 mg/kg of 1:1000 (1 mg/mL), max 0.5 mg',
      'Can repeat every 5-15 minutes if symptoms persist',
      'Biphasic reactions can occur 4-12 hours later - observe patient',
      'Antihistamines and steroids are adjuncts, not replacements for epinephrine'
    ],
    passingScore: 75,
    translations: {
      sw: {
        title: 'Anaphylaxis Kali - Jibu la Haraka',
        description: 'Mtoto wa miaka 7 anapata mzio mkali baada ya kula karanga.'
      },
      fr: {
        title: 'Anaphylaxie Sévère - Réponse Rapide',
        description: 'Une enfant de 7 ans développe une réaction allergique sévère après avoir mangé des arachides.'
      },
      ar: {
        title: 'الحساسية المفرطة الشديدة - الاستجابة السريعة',
        description: 'طفلة تبلغ من العمر 7 سنوات تصاب برد فعل تحسسي شديد بعد تناول الفول السوداني.'
      }
    }
  },

  // SEPTIC SHOCK - ADVANCED
  {
    id: 'septic_shock_advanced',
    title: 'Pediatric Septic Shock - Golden Hour',
    category: 'septic_shock',
    difficulty: 'advanced',
    durationMinutes: 15,
    description: 'A 3-year-old presents with fever, lethargy, and mottled skin. Practice the Surviving Sepsis Campaign bundle within the first hour.',
    learningObjectives: [
      'Recognize septic shock early',
      'Complete sepsis bundle within 1 hour',
      'Titrate fluid resuscitation',
      'Initiate vasopressors appropriately'
    ],
    patientProfile: {
      age: { years: 3, months: 0 },
      weight: 14,
      gender: 'male',
      chiefComplaint: 'Fever x2 days, not eating, very sleepy, cold hands/feet',
      history: 'URI symptoms 3 days ago, immunizations up to date',
      allergies: ['None known'],
      medications: ['Acetaminophen at home']
    },
    initialVitals: {
      heartRate: 175,
      respiratoryRate: 45,
      bloodPressure: { systolic: 70, diastolic: 40 },
      oxygenSaturation: 92,
      temperature: 39.5,
      capillaryRefill: 5,
      consciousness: 'voice',
      pupils: 'normal'
    },
    events: [
      {
        id: 'e1',
        timeOffset: 0,
        type: 'critical',
        description: 'Child is lethargic with mottled extremities, weak pulses, and prolonged cap refill.',
        expectedAction: 'Recognize septic shock, start sepsis bundle',
        criticalWindow: 60,
        points: 20
      },
      {
        id: 'e2',
        timeOffset: 300,
        type: 'vital_change',
        description: 'After 40 mL/kg fluids, still hypotensive.',
        vitals: {
          heartRate: 165,
          bloodPressure: { systolic: 72, diastolic: 42 },
          capillaryRefill: 4
        },
        expectedAction: 'Start vasopressor (epinephrine or norepinephrine)',
        criticalWindow: 120,
        points: 20
      },
      {
        id: 'e3',
        timeOffset: 600,
        type: 'improvement',
        description: 'With vasopressors and continued fluids, perfusion improving.',
        vitals: {
          heartRate: 145,
          bloodPressure: { systolic: 85, diastolic: 55 },
          capillaryRefill: 3,
          consciousness: 'alert'
        },
        points: 0
      }
    ],
    correctActions: [
      { id: 'a1', name: 'Recognize septic shock', category: 'assessment', points: 15, isCorrect: true, feedback: 'Early recognition is critical!' },
      { id: 'a2', name: 'Establish IV/IO access', category: 'circulation', points: 15, isCorrect: true, feedback: 'Access within 5 minutes is the goal.', timeBonus: 5 },
      { id: 'a3', name: 'Draw blood cultures', category: 'assessment', points: 10, isCorrect: true, feedback: 'Before antibiotics if possible, but don\'t delay antibiotics.' },
      { id: 'a4', name: 'Give antibiotics within 1 hour', category: 'medication', points: 20, isCorrect: true, feedback: 'Each hour delay increases mortality!', timeBonus: 10 },
      { id: 'a5', name: 'Give fluid bolus (20 mL/kg)', category: 'circulation', points: 15, isCorrect: true, feedback: 'Correct! Reassess after each bolus.' },
      { id: 'a6', name: 'Reassess perfusion after fluids', category: 'assessment', points: 10, isCorrect: true, feedback: 'Good! Titrate to clinical response.' },
      { id: 'a7', name: 'Give additional fluid boluses (up to 60 mL/kg)', category: 'circulation', points: 10, isCorrect: true, feedback: 'May need up to 60 mL/kg in first hour.' },
      { id: 'a8', name: 'Start vasopressor for fluid-refractory shock', category: 'medication', points: 20, isCorrect: true, feedback: 'Correct! Epinephrine or norepinephrine.' },
      { id: 'a9', name: 'Check lactate', category: 'assessment', points: 5, isCorrect: true, feedback: 'Lactate helps guide resuscitation.' },
      { id: 'a10', name: 'Check glucose and correct hypoglycemia', category: 'medication', points: 10, isCorrect: true, feedback: 'Important! Children are prone to hypoglycemia.' }
    ],
    incorrectActions: [
      { id: 'i1', name: 'Delay antibiotics for cultures', category: 'medication', points: -20, isCorrect: false, feedback: 'Never delay antibiotics! Draw cultures but give antibiotics immediately.' },
      { id: 'i2', name: 'Give only 10 mL/kg fluid bolus', category: 'circulation', points: -10, isCorrect: false, feedback: 'Standard bolus is 20 mL/kg. Reassess and repeat.' },
      { id: 'i3', name: 'Use dopamine as first-line vasopressor', category: 'medication', points: -5, isCorrect: false, feedback: 'Epinephrine or norepinephrine preferred over dopamine.' }
    ],
    debriefingPoints: [
      'Sepsis bundle: IV access, cultures, antibiotics, fluids - all within 1 hour',
      'Fluid resuscitation: 20 mL/kg boluses, reassess, may need up to 60 mL/kg',
      'Fluid-refractory shock: Start vasopressors (epinephrine or norepinephrine)',
      'Antibiotic delay increases mortality - give within 1 hour',
      'Monitor for fluid overload (hepatomegaly, rales, worsening oxygenation)',
      'Check and correct hypoglycemia and hypocalcemia'
    ],
    passingScore: 80,
    translations: {
      sw: {
        title: 'Mshtuko wa Septic kwa Watoto - Saa ya Dhahabu',
        description: 'Mtoto wa miaka 3 ana homa, uchovu, na ngozi iliyochanganyika.'
      },
      fr: {
        title: 'Choc Septique Pédiatrique - L\'Heure Dorée',
        description: 'Un enfant de 3 ans présente de la fièvre, une léthargie et une peau marbrée.'
      },
      ar: {
        title: 'الصدمة الإنتانية للأطفال - الساعة الذهبية',
        description: 'طفل يبلغ من العمر 3 سنوات يعاني من الحمى والخمول والجلد المرقط.'
      }
    }
  },

  // NEONATAL RESUSCITATION - INTERMEDIATE
  {
    id: 'neonatal_resus_intermediate',
    title: 'Neonatal Resuscitation - Delivery Room',
    category: 'neonatal',
    difficulty: 'intermediate',
    durationMinutes: 10,
    description: 'A term newborn is delivered with poor tone and no cry. Practice the NRP algorithm including initial steps, PPV, and chest compressions.',
    learningObjectives: [
      'Perform initial newborn assessment',
      'Provide effective PPV',
      'Recognize need for chest compressions',
      'Follow NRP algorithm'
    ],
    patientProfile: {
      age: { years: 0, months: 0 },
      weight: 3.2,
      gender: 'female',
      chiefComplaint: 'Term newborn, meconium-stained fluid, poor tone, no cry',
      history: 'Prolonged second stage of labor, fetal heart rate decelerations',
      allergies: [],
      medications: []
    },
    initialVitals: {
      heartRate: 70,
      respiratoryRate: 0,
      bloodPressure: { systolic: 0, diastolic: 0 },
      oxygenSaturation: 0,
      temperature: 36.0,
      capillaryRefill: 4,
      consciousness: 'unresponsive',
      pupils: 'normal'
    },
    events: [
      {
        id: 'e1',
        timeOffset: 0,
        type: 'prompt',
        description: 'Baby is delivered, floppy, not breathing. What are your initial steps?',
        expectedAction: 'Warm, dry, stimulate, position airway',
        criticalWindow: 30,
        points: 15
      },
      {
        id: 'e2',
        timeOffset: 30,
        type: 'vital_change',
        description: 'After initial steps: HR 80, still apneic, cyanotic.',
        vitals: { heartRate: 80, respiratoryRate: 0 },
        expectedAction: 'Start PPV with room air',
        criticalWindow: 30,
        points: 20
      },
      {
        id: 'e3',
        timeOffset: 60,
        type: 'vital_change',
        description: 'After 30 seconds PPV: HR 50, no improvement.',
        vitals: { heartRate: 50 },
        expectedAction: 'MR SOPA corrective steps, increase oxygen',
        criticalWindow: 30,
        points: 15
      },
      {
        id: 'e4',
        timeOffset: 90,
        type: 'critical',
        description: 'HR still <60 despite effective PPV.',
        vitals: { heartRate: 55 },
        expectedAction: 'Start chest compressions (3:1 ratio)',
        criticalWindow: 15,
        points: 25
      },
      {
        id: 'e5',
        timeOffset: 150,
        type: 'improvement',
        description: 'After 60 seconds of compressions + PPV: HR 110, gasping.',
        vitals: {
          heartRate: 110,
          respiratoryRate: 20,
          oxygenSaturation: 85
        },
        points: 0
      }
    ],
    correctActions: [
      { id: 'a1', name: 'Warm (radiant warmer, dry)', category: 'assessment', points: 10, isCorrect: true, feedback: 'Correct! Prevent heat loss.' },
      { id: 'a2', name: 'Position airway (sniffing position)', category: 'airway', points: 10, isCorrect: true, feedback: 'Good! Neutral position for neonates.' },
      { id: 'a3', name: 'Clear airway if needed (suction)', category: 'airway', points: 5, isCorrect: true, feedback: 'Suction only if obstructed.' },
      { id: 'a4', name: 'Stimulate (flick feet, rub back)', category: 'assessment', points: 10, isCorrect: true, feedback: 'Correct stimulation technique.' },
      { id: 'a5', name: 'Start PPV with room air (21%)', category: 'breathing', points: 20, isCorrect: true, feedback: 'Excellent! Room air for term infants.', timeBonus: 5 },
      { id: 'a6', name: 'Apply pulse oximeter', category: 'monitoring', points: 5, isCorrect: true, feedback: 'Good! Right hand (preductal).' },
      { id: 'a7', name: 'MR SOPA corrective steps', category: 'breathing', points: 15, isCorrect: true, feedback: 'Correct! Troubleshoot ineffective PPV.' },
      { id: 'a8', name: 'Increase oxygen if needed', category: 'breathing', points: 5, isCorrect: true, feedback: 'Titrate to target SpO2.' },
      { id: 'a9', name: 'Start chest compressions (3:1)', category: 'circulation', points: 25, isCorrect: true, feedback: 'Correct! HR <60 despite effective PPV.' },
      { id: 'a10', name: 'Consider intubation', category: 'airway', points: 10, isCorrect: true, feedback: 'May be needed for prolonged PPV or compressions.' }
    ],
    incorrectActions: [
      { id: 'i1', name: 'Start with 100% oxygen', category: 'breathing', points: -10, isCorrect: false, feedback: 'Start with room air (21%) for term infants.' },
      { id: 'i2', name: 'Deep suctioning of meconium', category: 'airway', points: -10, isCorrect: false, feedback: 'Routine suctioning not recommended. Start PPV if not vigorous.' },
      { id: 'i3', name: 'Delay PPV to get equipment', category: 'breathing', points: -15, isCorrect: false, feedback: 'Never delay PPV! It\'s the most important intervention.' }
    ],
    debriefingPoints: [
      'Initial steps: Warm, dry, stimulate, position, clear airway (30 seconds)',
      'PPV is the most important intervention in neonatal resuscitation',
      'Start with room air (21%) for term infants, 21-30% for preterm',
      'MR SOPA: Mask adjust, Reposition, Suction, Open mouth, Pressure increase, Airway alternative',
      'Chest compressions if HR <60 despite 30 seconds of effective PPV',
      'Compression:ventilation ratio is 3:1 in neonates',
      'Target SpO2: 60-65% at 1 min, 80-85% at 5 min, 85-95% at 10 min'
    ],
    passingScore: 75,
    translations: {
      sw: {
        title: 'Ufufuaji wa Watoto Wachanga - Chumba cha Kujifungua',
        description: 'Mtoto mchanga anazaliwa na hali mbaya na hakuna kilio.'
      },
      fr: {
        title: 'Réanimation Néonatale - Salle d\'Accouchement',
        description: 'Un nouveau-né à terme est livré avec un tonus faible et sans cri.'
      },
      ar: {
        title: 'إنعاش حديثي الولادة - غرفة الولادة',
        description: 'يولد مولود جديد مكتمل النمو بتوتر ضعيف وبدون بكاء.'
      }
    }
  },

  // STATUS EPILEPTICUS - INTERMEDIATE
  {
    id: 'status_epilepticus_intermediate',
    title: 'Status Epilepticus - Seizure Management',
    category: 'status_epilepticus',
    difficulty: 'intermediate',
    durationMinutes: 12,
    description: 'A 4-year-old presents with ongoing generalized tonic-clonic seizure for 8 minutes. Practice the stepwise approach to status epilepticus.',
    learningObjectives: [
      'Recognize status epilepticus',
      'Administer benzodiazepines correctly',
      'Escalate therapy appropriately',
      'Manage airway during seizures'
    ],
    patientProfile: {
      age: { years: 4, months: 0 },
      weight: 16,
      gender: 'male',
      chiefComplaint: 'Ongoing seizure for 8 minutes, generalized tonic-clonic',
      history: 'Known epilepsy on levetiracetam, missed doses x2 days',
      allergies: ['None known'],
      medications: ['Levetiracetam 250mg BID (missed)']
    },
    initialVitals: {
      heartRate: 150,
      respiratoryRate: 8,
      bloodPressure: { systolic: 110, diastolic: 70 },
      oxygenSaturation: 88,
      temperature: 38.0,
      capillaryRefill: 2,
      consciousness: 'unresponsive',
      pupils: 'dilated'
    },
    events: [
      {
        id: 'e1',
        timeOffset: 0,
        type: 'critical',
        description: 'Child actively seizing, cyanotic, drooling.',
        expectedAction: 'Position safely, give oxygen, prepare benzodiazepine',
        criticalWindow: 60,
        points: 15
      },
      {
        id: 'e2',
        timeOffset: 60,
        type: 'prompt',
        description: 'Seizure continues after first benzodiazepine dose.',
        expectedAction: 'Give second dose of benzodiazepine',
        criticalWindow: 300,
        points: 15
      },
      {
        id: 'e3',
        timeOffset: 360,
        type: 'vital_change',
        description: 'Seizure continues after 2 doses of benzodiazepine.',
        vitals: { respiratoryRate: 6, oxygenSaturation: 85 },
        expectedAction: 'Give second-line agent (phenytoin/fosphenytoin or levetiracetam)',
        criticalWindow: 120,
        points: 20
      },
      {
        id: 'e4',
        timeOffset: 480,
        type: 'improvement',
        description: 'Seizure stops after second-line agent.',
        vitals: {
          heartRate: 110,
          respiratoryRate: 14,
          oxygenSaturation: 96,
          consciousness: 'voice'
        },
        points: 0
      }
    ],
    correctActions: [
      { id: 'a1', name: 'Position patient safely (recovery position)', category: 'assessment', points: 10, isCorrect: true, feedback: 'Protect from injury.' },
      { id: 'a2', name: 'Give oxygen', category: 'breathing', points: 10, isCorrect: true, feedback: 'Correct! Seizures increase oxygen demand.' },
      { id: 'a3', name: 'Check glucose', category: 'assessment', points: 10, isCorrect: true, feedback: 'Important! Hypoglycemia can cause seizures.' },
      { id: 'a4', name: 'Give benzodiazepine (midazolam IM/IN or lorazepam IV)', category: 'medication', points: 20, isCorrect: true, feedback: 'First-line treatment!', timeBonus: 5 },
      { id: 'a5', name: 'Establish IV access', category: 'circulation', points: 10, isCorrect: true, feedback: 'Important for medications and fluids.' },
      { id: 'a6', name: 'Give second benzodiazepine dose if seizure continues', category: 'medication', points: 15, isCorrect: true, feedback: 'Can repeat after 5 minutes.' },
      { id: 'a7', name: 'Give second-line agent (phenytoin/fosphenytoin or levetiracetam)', category: 'medication', points: 20, isCorrect: true, feedback: 'Correct! After 2 doses of benzodiazepine.' },
      { id: 'a8', name: 'Prepare for intubation if respiratory compromise', category: 'airway', points: 10, isCorrect: true, feedback: 'Be ready for airway management.' },
      { id: 'a9', name: 'Monitor for respiratory depression', category: 'monitoring', points: 5, isCorrect: true, feedback: 'Benzodiazepines can cause respiratory depression.' }
    ],
    incorrectActions: [
      { id: 'i1', name: 'Restrain patient during seizure', category: 'assessment', points: -10, isCorrect: false, feedback: 'Never restrain! Protect from injury only.' },
      { id: 'i2', name: 'Put something in mouth', category: 'airway', points: -15, isCorrect: false, feedback: 'Never put anything in the mouth during a seizure!' },
      { id: 'i3', name: 'Give phenytoin before benzodiazepine', category: 'medication', points: -10, isCorrect: false, feedback: 'Benzodiazepines are first-line treatment.' }
    ],
    debriefingPoints: [
      'Status epilepticus: Seizure >5 minutes or multiple seizures without recovery',
      'First-line: Benzodiazepine (midazolam IM/IN 0.2 mg/kg or lorazepam IV 0.1 mg/kg)',
      'Can repeat benzodiazepine after 5 minutes',
      'Second-line: Phenytoin/fosphenytoin (20 mg/kg) or levetiracetam (60 mg/kg)',
      'Third-line: Consider RSI and continuous infusion (midazolam, pentobarbital)',
      'Check glucose - treat hypoglycemia with dextrose',
      'Monitor for respiratory depression after benzodiazepines'
    ],
    passingScore: 75,
    translations: {
      sw: {
        title: 'Status Epilepticus - Usimamizi wa Kifafa',
        description: 'Mtoto wa miaka 4 ana kifafa kinachoendelea kwa dakika 8.'
      },
      fr: {
        title: 'État de Mal Épileptique - Gestion des Crises',
        description: 'Un enfant de 4 ans présente une crise tonico-clonique généralisée en cours depuis 8 minutes.'
      },
      ar: {
        title: 'حالة الصرع - إدارة النوبات',
        description: 'طفل يبلغ من العمر 4 سنوات يعاني من نوبة صرع مستمرة لمدة 8 دقائق.'
      }
    }
  }
];

/**
 * Get simulation case by ID
 */
export function getSimulationById(id: string): SimulationCase | undefined {
  return SIMULATION_CASES.find(c => c.id === id);
}

/**
 * Get simulations by category
 */
export function getSimulationsByCategory(category: SimulationCategory): SimulationCase[] {
  return SIMULATION_CASES.filter(c => c.category === category);
}

/**
 * Get simulations by difficulty
 */
export function getSimulationsByDifficulty(difficulty: SimulationDifficulty): SimulationCase[] {
  return SIMULATION_CASES.filter(c => c.difficulty === difficulty);
}

/**
 * Calculate simulation score
 */
export function calculateScore(
  caseData: SimulationCase,
  actionsPerformed: { actionId: string; timestamp: Date }[],
  startTime: Date
): SimulationResult {
  const endTime = new Date();
  let totalScore = 0;
  const maxScore = caseData.correctActions.reduce((sum, a) => sum + a.points + (a.timeBonus || 0), 0);
  const performedActionIds = actionsPerformed.map(a => a.actionId);
  const actionsWithScores: SimulationResult['actionsPerformed'] = [];
  const missedActions: string[] = [];
  const criticalErrors: string[] = [];

  // Score correct actions
  caseData.correctActions.forEach(action => {
    const performed = actionsPerformed.find(a => a.actionId === action.id);
    if (performed) {
      const timeTaken = (performed.timestamp.getTime() - startTime.getTime()) / 1000;
      let points = action.points;
      
      // Add time bonus if applicable
      if (action.timeBonus && timeTaken < 60) {
        points += action.timeBonus;
      }
      
      totalScore += points;
      actionsWithScores.push({
        actionId: action.id,
        timestamp: performed.timestamp,
        pointsEarned: points,
        feedback: action.feedback
      });
    } else {
      missedActions.push(action.name);
    }
  });

  // Deduct for incorrect actions
  caseData.incorrectActions.forEach(action => {
    const performed = actionsPerformed.find(a => a.actionId === action.id);
    if (performed) {
      totalScore += action.points; // Negative points
      criticalErrors.push(action.name);
      actionsWithScores.push({
        actionId: action.id,
        timestamp: performed.timestamp,
        pointsEarned: action.points,
        feedback: action.feedback
      });
    }
  });

  // Calculate response times
  const responseTimes = actionsPerformed.map(a => 
    (a.timestamp.getTime() - startTime.getTime()) / 1000
  );
  const timeToFirstAction = responseTimes.length > 0 ? responseTimes[0] : 0;
  const averageResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;

  const percentageScore = Math.max(0, Math.min(100, (totalScore / maxScore) * 100));

  return {
    caseId: caseData.id,
    startTime,
    endTime,
    totalScore: Math.max(0, totalScore),
    maxScore,
    percentageScore,
    passed: percentageScore >= caseData.passingScore,
    actionsPerformed: actionsWithScores,
    missedActions,
    criticalErrors,
    timeToFirstAction,
    averageResponseTime
  };
}

/**
 * Get all categories with counts
 */
export function getSimulationCategories(): { category: SimulationCategory; count: number; label: string }[] {
  const categoryLabels: Record<SimulationCategory, string> = {
    cardiac_arrest: 'Cardiac Arrest',
    respiratory_failure: 'Respiratory Failure',
    anaphylaxis: 'Anaphylaxis',
    septic_shock: 'Septic Shock',
    status_epilepticus: 'Status Epilepticus',
    trauma: 'Trauma',
    neonatal: 'Neonatal',
    dka: 'DKA'
  };

  const categories = Array.from(new Set(SIMULATION_CASES.map(c => c.category))) as SimulationCategory[];
  return categories.map(category => ({
    category,
    count: SIMULATION_CASES.filter(c => c.category === category).length,
    label: categoryLabels[category]
  }));
}
