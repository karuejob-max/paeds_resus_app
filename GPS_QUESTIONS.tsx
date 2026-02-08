/**
 * GPS-Style Clinical Questions
 * 
 * Simplified flow: 3 critical triage → 1 main problem → 2-3 pathway questions → IMMEDIATE ACTION
 * Maximum 6 questions to life-saving intervention (30 seconds)
 */

// This will replace lines 313-1223 in ClinicalAssessmentGPS.tsx

const clinicalQuestions: ClinicalQuestion[] = [
  // ========================================
  // PHASE 1: CRITICAL TRIAGE (Questions 1-3)
  // ========================================
  
  {
    id: 'breathing',
    phase: 'triage',
    question: 'Is the patient breathing?',
    subtext: 'Look for chest movement, listen for breath sounds',
    type: 'boolean',
    criticalTrigger: (answer) => {
      if (answer === false) {
        return {
          id: 'start-bvm',
          severity: 'critical',
          title: 'START BAG-VALVE-MASK VENTILATION NOW',
          instruction: 'Open airway (head tilt-chin lift). Apply mask with good seal. Squeeze bag to see chest rise. Give 1 breath every 3 seconds.',
          rationale: 'Not breathing = immediate ventilation needed to prevent cardiac arrest.',
          timer: 30,
          reassessAfter: 'After 5 breaths, check for chest rise and SpO2',
          interventionTemplate: 'bvmVentilation'
        };
      }
      return null;
    }
  },
  
  {
    id: 'pulse',
    phase: 'triage',
    question: 'Can you feel a pulse?',
    subtext: 'Check brachial (infant) or carotid (child/adult) for 10 seconds max',
    type: 'boolean',
    criticalTrigger: (answer) => {
      if (answer === false) {
        return {
          id: 'start-cpr',
          severity: 'critical',
          title: 'START CPR IMMEDIATELY',
          instruction: 'Begin chest compressions: 100-120/min, depth 1/3 chest (peds) or 2 inches (adult). 15:2 ratio with BVM (peds) or 30:2 (adult). Minimize interruptions.',
          rationale: 'No pulse = cardiac arrest. Every minute without CPR decreases survival by 10%.',
          timer: 120,
          reassessAfter: 'Rhythm check at 2 minutes',
          interventionTemplate: 'cpr'
        };
      }
      return null;
    }
  },
  
  {
    id: 'responsiveness',
    phase: 'triage',
    question: 'Are they responsive?',
    subtext: 'Do they respond to voice or pain?',
    type: 'select',
    options: [
      { value: 'alert', label: 'Alert - eyes open, responds normally', severity: 'normal' },
      { value: 'responds', label: 'Responds to voice or pain', severity: 'abnormal' },
      { value: 'unresponsive', label: 'Unresponsive - no response at all', severity: 'critical' }
    ],
    criticalTrigger: (answer) => {
      if (answer === 'unresponsive') {
        return {
          id: 'protect-airway',
          severity: 'critical',
          title: 'PROTECT AIRWAY - UNRESPONSIVE PATIENT',
          instruction: 'Position in recovery position if breathing. Prepare for intubation if not protecting airway. Call for help.',
          rationale: 'Unresponsive patient cannot protect airway. Risk of aspiration and respiratory failure.',
          relatedModule: 'airway'
        };
      }
      return null;
    }
  },

  // ========================================
  // PHASE 2: MAIN PROBLEM IDENTIFICATION (Question 4)
  // ========================================
  
  {
    id: 'main_problem',
    phase: 'problem_identification',
    question: 'What is the MAIN problem?',
    subtext: 'Choose the most urgent issue',
    type: 'select',
    options: [
      { value: 'breathing', label: 'Breathing difficulty', severity: 'urgent' },
      { value: 'shock', label: 'Shock / Poor perfusion', severity: 'urgent' },
      { value: 'seizure', label: 'Seizure / Altered mental status', severity: 'urgent' },
      { value: 'trauma', label: 'Severe bleeding / Trauma', severity: 'urgent' },
      { value: 'poisoning', label: 'Poisoning / Overdose', severity: 'urgent' },
      { value: 'allergic', label: 'Allergic reaction', severity: 'urgent' }
    ]
  },

  // ========================================
  // BREATHING PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'breathing_signs',
    phase: 'breathing_pathway',
    question: 'What breathing signs do you see?',
    subtext: 'Select all that apply',
    type: 'multi-select',
    options: [
      { value: 'wheezing', label: 'Wheezing', severity: 'abnormal' },
      { value: 'stridor', label: 'Stridor (high-pitched sound)', severity: 'critical' },
      { value: 'grunting', label: 'Grunting / Severe retractions', severity: 'critical' },
      { value: 'cyanosis', label: 'Cyanosis (blue lips/skin)', severity: 'critical' }
    ],
    criticalTrigger: (answer: string[]) => {
      if (answer.includes('stridor')) {
        return {
          id: 'stridor-management',
          severity: 'critical',
          title: 'STRIDOR - AIRWAY EMERGENCY',
          instruction: 'Keep child calm. Give oxygen. Consider: croup (dexamethasone + nebulized epinephrine), foreign body (do NOT examine throat), anaphylaxis (IM epinephrine). Call for airway help.',
          rationale: 'Stridor = upper airway obstruction. Can progress to complete obstruction rapidly.',
          relatedModule: 'airway'
        };
      }
      if (answer.includes('wheezing')) {
        return {
          id: 'bronchospasm',
          severity: 'urgent',
          title: 'BRONCHOSPASM - START BRONCHODILATORS',
          instruction: 'Give salbutamol nebulizer. Assess severity. Consider asthma, bronchiolitis, anaphylaxis.',
          rationale: 'Wheezing = bronchospasm. Early bronchodilator improves outcomes.',
          interventionTemplate: 'salbutamolNeb',
          relatedModule: 'AsthmaEscalation'
        };
      }
      return null;
    }
  },
  
  {
    id: 'spo2',
    phase: 'breathing_pathway',
    question: 'What is the SpO2?',
    subtext: 'Oxygen saturation level',
    type: 'number',
    unit: '%',
    min: 50,
    max: 100,
    criticalTrigger: (answer: number) => {
      if (answer < 90) {
        return {
          id: 'severe-hypoxia',
          severity: 'critical',
          title: 'SEVERE HYPOXIA - HIGH-FLOW OXYGEN NOW',
          instruction: 'Give 100% oxygen via non-rebreather mask or bag-valve-mask. Target SpO2 >94%. Prepare for intubation if not improving.',
          rationale: 'SpO2 <90% = severe hypoxia. Immediate oxygen required.',
          timer: 60,
          reassessAfter: 'Recheck SpO2 after 1 minute'
        };
      }
      return null;
    }
  },

  // ========================================
  // SHOCK PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'perfusion_signs',
    phase: 'shock_pathway',
    question: 'What perfusion signs do you see?',
    subtext: 'Select all that apply',
    type: 'multi-select',
    options: [
      { value: 'weak_pulse', label: 'Weak or absent pulses', severity: 'critical' },
      { value: 'delayed_crt', label: 'CRT >3 seconds', severity: 'critical' },
      { value: 'cold_extremities', label: 'Cold hands/feet', severity: 'abnormal' },
      { value: 'mottled_skin', label: 'Mottled or pale skin', severity: 'abnormal' }
    ],
    criticalTrigger: (answer: string[]) => {
      if (answer.length >= 2) {
        return {
          id: 'shock-resuscitation',
          severity: 'critical',
          title: 'SHOCK - START FLUID RESUSCITATION',
          instruction: 'Get IV/IO access NOW. Give 20 mL/kg fluid bolus over 5-10 minutes. Reassess after each bolus.',
          rationale: 'Multiple perfusion signs = shock. Immediate fluid resuscitation needed.',
          interventionTemplate: 'fluidBolus',
          relatedModule: 'FluidBolusTracker'
        };
      }
      return null;
    }
  },
  
  {
    id: 'bleeding_visible',
    phase: 'shock_pathway',
    question: 'Is there visible bleeding?',
    type: 'boolean',
    criticalTrigger: (answer) => {
      if (answer === true) {
        return {
          id: 'hemorrhagic-shock',
          severity: 'critical',
          title: 'HEMORRHAGIC SHOCK - STOP BLEEDING',
          instruction: 'Apply direct pressure. Elevate if possible. Get IV access. Give blood products if massive bleeding. Consider tourniquet for limb hemorrhage.',
          rationale: 'Visible bleeding + shock = hemorrhagic shock. Stop bleeding AND restore volume.',
          timer: 120
        };
      }
      return null;
    }
  },

  // ========================================
  // SEIZURE/NEURO PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'seizure_activity',
    phase: 'neuro_pathway',
    question: 'Is there seizure activity?',
    type: 'select',
    options: [
      { value: 'active_now', label: 'Seizing RIGHT NOW', severity: 'critical' },
      { value: 'recent', label: 'Seizure stopped recently', severity: 'abnormal' },
      { value: 'no_seizure', label: 'No seizure', severity: 'normal' }
    ],
    criticalTrigger: (answer) => {
      if (answer === 'active_now') {
        return {
          id: 'status-epilepticus',
          severity: 'critical',
          title: 'ACTIVE SEIZURE - GIVE BENZODIAZEPINE',
          instruction: 'Protect airway. Give lorazepam 0.1 mg/kg IV or midazolam 0.2 mg/kg IM. If still seizing at 5 min, repeat dose.',
          rationale: 'Ongoing seizure requires immediate benzodiazepine. Status epilepticus if >5 minutes.',
          interventionTemplate: 'statusEpilepticus',
          timer: 300
        };
      }
      return null;
    }
  },
  
  {
    id: 'glucose_level',
    phase: 'neuro_pathway',
    question: 'What is the blood glucose?',
    subtext: 'If available - skip if unknown',
    type: 'number',
    unit: 'mg/dL',
    min: 20,
    max: 600,
    criticalTrigger: (answer: number) => {
      if (answer < 60) {
        return {
          id: 'hypoglycemia',
          severity: 'critical',
          title: 'HYPOGLYCEMIA - GIVE GLUCOSE NOW',
          instruction: 'Give dextrose 0.5-1 g/kg IV (2-4 mL/kg of D25 or 5-10 mL/kg of D10). Recheck glucose in 15 minutes.',
          rationale: 'Glucose <60 mg/dL can cause seizures, altered mental status, brain damage.',
          timer: 60,
          doseCard: {
            medication: 'Dextrose',
            indication: 'Hypoglycemia (glucose <60 mg/dL)',
            route: 'IV push',
            timing: 'Immediate',
            notes: 'Recheck glucose in 15 minutes. May need repeat dose or dextrose infusion.'
          }
        };
      }
      if (answer > 250) {
        return {
          id: 'hyperglycemia-dka',
          severity: 'urgent',
          title: 'HYPERGLYCEMIA - ASSESS FOR DKA',
          instruction: 'Check for DKA signs: vomiting, abdominal pain, Kussmaul breathing. Get VBG, ketones, electrolytes. Start fluid resuscitation.',
          rationale: 'High glucose + altered mental status may be DKA.',
          interventionTemplate: 'dkaManagement',
          relatedModule: 'DKAManagement'
        };
      }
      return null;
    }
  },

  // ========================================
  // TRAUMA PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'trauma_mechanism',
    phase: 'trauma_pathway',
    question: 'What type of trauma?',
    type: 'select',
    options: [
      { value: 'fall', label: 'Fall / Blunt trauma', severity: 'abnormal' },
      { value: 'penetrating', label: 'Penetrating injury (stab/gunshot)', severity: 'critical' },
      { value: 'burns', label: 'Burns', severity: 'abnormal' },
      { value: 'multiple', label: 'Multiple injuries', severity: 'critical' }
    ],
    criticalTrigger: (answer) => {
      if (answer === 'penetrating' || answer === 'multiple') {
        return {
          id: 'major-trauma',
          severity: 'critical',
          title: 'MAJOR TRAUMA - ACTIVATE TRAUMA PROTOCOL',
          instruction: 'C-spine immobilization. Control bleeding. Two large-bore IVs. Trauma series imaging. Call trauma team.',
          rationale: 'Penetrating or multi-system trauma requires full trauma activation.',
          relatedModule: 'TraumaProtocol'
        };
      }
      return null;
    }
  },
  
  {
    id: 'trauma_location',
    phase: 'trauma_pathway',
    question: 'Where is the injury?',
    type: 'multi-select',
    options: [
      { value: 'head', label: 'Head / Neck', severity: 'critical' },
      { value: 'chest', label: 'Chest', severity: 'critical' },
      { value: 'abdomen', label: 'Abdomen', severity: 'critical' },
      { value: 'extremity', label: 'Arms / Legs', severity: 'abnormal' }
    ],
    criticalTrigger: (answer: string[]) => {
      if (answer.includes('head')) {
        return {
          id: 'head-trauma',
          severity: 'critical',
          title: 'HEAD TRAUMA - PROTECT C-SPINE',
          instruction: 'Immobilize C-spine. Assess GCS. Prevent secondary injury: maintain BP, avoid hypoxia. CT head if GCS <15.',
          rationale: 'Head trauma can cause intracranial bleeding, increased ICP.',
          timer: 300
        };
      }
      if (answer.includes('chest')) {
        return {
          id: 'chest-trauma',
          severity: 'critical',
          title: 'CHEST TRAUMA - ASSESS FOR PNEUMOTHORAX',
          instruction: 'Listen for breath sounds. Check for tracheal deviation. Prepare for needle decompression if tension pneumothorax.',
          rationale: 'Chest trauma can cause pneumothorax, hemothorax, cardiac injury.',
          timer: 180
        };
      }
      return null;
    }
  },

  // ========================================
  // POISONING PATHWAY (Questions 5-6)
  // ========================================
  
  {
    id: 'substance_type',
    phase: 'poisoning_pathway',
    question: 'What was ingested/exposed?',
    type: 'select',
    options: [
      { value: 'medication', label: 'Medication overdose', severity: 'urgent' },
      { value: 'household', label: 'Household chemical', severity: 'urgent' },
      { value: 'unknown', label: 'Unknown substance', severity: 'abnormal' }
    ]
  },
  
  {
    id: 'ingestion_time',
    phase: 'poisoning_pathway',
    question: 'When did this happen?',
    type: 'select',
    options: [
      { value: 'recent', label: 'Less than 1 hour ago', severity: 'urgent' },
      { value: 'delayed', label: 'More than 1 hour ago', severity: 'abnormal' }
    ],
    criticalTrigger: (answer, patientData, weight) => {
      if (answer === 'recent') {
        return {
          id: 'recent-ingestion',
          severity: 'urgent',
          title: 'RECENT INGESTION - CONSIDER DECONTAMINATION',
          instruction: 'Call poison control. Consider activated charcoal if <1 hour and appropriate substance. Monitor for deterioration.',
          rationale: 'Recent ingestion may benefit from decontamination. Time-sensitive.',
          timer: 600
        };
      }
      return null;
    }
  },

  // ========================================
  // ALLERGIC REACTION PATHWAY (Question 5)
  // ========================================
  
  {
    id: 'anaphylaxis_signs',
    phase: 'allergic_pathway',
    question: 'What allergic signs do you see?',
    subtext: 'Select all that apply',
    type: 'multi-select',
    options: [
      { value: 'airway_swelling', label: 'Airway swelling / Stridor', severity: 'critical' },
      { value: 'breathing_difficulty', label: 'Wheezing / Breathing difficulty', severity: 'critical' },
      { value: 'hypotension', label: 'Low blood pressure / Weak pulse', severity: 'critical' },
      { value: 'rash', label: 'Rash / Hives only', severity: 'abnormal' }
    ],
    criticalTrigger: (answer: string[]) => {
      const criticalSigns = ['airway_swelling', 'breathing_difficulty', 'hypotension'];
      const hasCriticalSign = answer.some(sign => criticalSigns.includes(sign));
      
      if (hasCriticalSign) {
        return {
          id: 'anaphylaxis',
          severity: 'critical',
          title: 'ANAPHYLAXIS - GIVE IM EPINEPHRINE NOW',
          instruction: 'IM epinephrine 0.01 mg/kg (max 0.5 mg) in anterolateral thigh. Can repeat every 5-15 minutes. Give oxygen, fluids, antihistamines.',
          rationale: 'Anaphylaxis is life-threatening. IM epinephrine is first-line treatment.',
          interventionTemplate: 'anaphylaxisProtocol',
          timer: 300
        };
      }
      return null;
    }
  }
];
