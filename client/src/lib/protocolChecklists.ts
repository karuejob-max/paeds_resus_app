/**
 * Protocol Checklist Templates
 * 
 * Structured checklists for complex multi-step emergency procedures.
 * Each checklist provides step-by-step guidance with critical step highlighting.
 */

import { ChecklistStep } from '@/components/clinical/ProtocolChecklist';

export interface ProtocolChecklistTemplate {
  id: string;
  title: string;
  steps: Omit<ChecklistStep, 'completed'>[];
}

/**
 * Shock Resuscitation Checklist
 * Based on PALS/AHA guidelines for fluid resuscitation in shock
 */
export const shockResuscitationChecklist: ProtocolChecklistTemplate = {
  id: 'shock_resuscitation',
  title: 'Shock Resuscitation Protocol',
  steps: [
    {
      id: 'shock_1',
      label: 'Establish IV/IO access (2 sites if possible)',
      critical: true,
      note: 'Largest bore possible, avoid femoral in abdominal trauma'
    },
    {
      id: 'shock_2',
      label: 'Give 1st fluid bolus 20 mL/kg over 5-10 minutes',
      critical: true,
      note: 'NS or LR, push rapidly with syringe or pressure bag'
    },
    {
      id: 'shock_3',
      label: 'Reassess perfusion (HR, BP, CRT, pulses, mental status)',
      critical: true,
      note: 'Reassess after EACH bolus'
    },
    {
      id: 'shock_4',
      label: 'If still in shock: Give 2nd bolus 20 mL/kg',
      note: 'Watch for fluid overload signs (crackles, hepatomegaly)'
    },
    {
      id: 'shock_5',
      label: 'Reassess perfusion again',
      critical: true
    },
    {
      id: 'shock_6',
      label: 'If still in shock after 60 mL/kg: Consider inotropes',
      note: 'Epinephrine 0.05-0.3 mcg/kg/min or dopamine 5-20 mcg/kg/min'
    },
    {
      id: 'shock_7',
      label: 'Identify and treat underlying cause',
      note: 'Sepsis, hemorrhage, cardiac, anaphylaxis, etc.'
    },
    {
      id: 'shock_8',
      label: 'Arrange ICU/HDU transfer',
      critical: true,
      note: 'All shock patients need intensive monitoring'
    }
  ]
};

/**
 * Sepsis Bundle Checklist
 * Based on Surviving Sepsis Campaign pediatric guidelines
 */
export const sepsisBundleChecklist: ProtocolChecklistTemplate = {
  id: 'sepsis_bundle',
  title: 'Sepsis Bundle (Hour-1)',
  steps: [
    {
      id: 'sepsis_1',
      label: 'Obtain blood cultures BEFORE antibiotics',
      critical: true,
      note: 'Also urine, CSF if indicated - do not delay antibiotics >45 min'
    },
    {
      id: 'sepsis_2',
      label: 'Measure lactate level',
      note: 'Elevated lactate (>2 mmol/L) indicates tissue hypoperfusion'
    },
    {
      id: 'sepsis_3',
      label: 'Give broad-spectrum IV antibiotics within 1 hour',
      critical: true,
      note: 'Ceftriaxone 50-100 mg/kg (max 2g) + vancomycin if severe'
    },
    {
      id: 'sepsis_4',
      label: 'Begin fluid resuscitation 20 mL/kg bolus',
      critical: true,
      note: 'May need up to 60 mL/kg in first hour'
    },
    {
      id: 'sepsis_5',
      label: 'Reassess after each bolus',
      critical: true,
      note: 'HR, BP, CRT, pulses, mental status, urine output'
    },
    {
      id: 'sepsis_6',
      label: 'If hypotensive after 40-60 mL/kg: Start vasopressors',
      note: 'Epinephrine or norepinephrine infusion'
    },
    {
      id: 'sepsis_7',
      label: 'Identify source and consider source control',
      note: 'Drain abscess, remove infected line, etc.'
    },
    {
      id: 'sepsis_8',
      label: 'Arrange ICU transfer',
      critical: true
    }
  ]
};

/**
 * DKA Management Checklist
 * Based on ISPAD 2022 guidelines
 */
export const dkaManagementChecklist: ProtocolChecklistTemplate = {
  id: 'dka_management',
  title: 'DKA Management Protocol',
  steps: [
    {
      id: 'dka_1',
      label: 'Establish IV access and begin fluid resuscitation',
      critical: true,
      note: '10-20 mL/kg NS over 1 hour (do NOT give bolus if mild DKA)'
    },
    {
      id: 'dka_2',
      label: 'Send labs: glucose, electrolytes, VBG, ketones, HbA1c',
      critical: true
    },
    {
      id: 'dka_3',
      label: 'Start maintenance fluids + deficit replacement',
      note: 'NS or 0.45% NaCl with 20-40 mEq/L KCl, replace deficit over 48h'
    },
    {
      id: 'dka_4',
      label: 'Start insulin infusion 0.05-0.1 units/kg/hr',
      critical: true,
      note: 'Start 1-2 hours AFTER fluid resuscitation begins'
    },
    {
      id: 'dka_5',
      label: 'Monitor glucose hourly, aim for decrease 50-100 mg/dL/hr',
      critical: true,
      note: 'Too rapid correction increases cerebral edema risk'
    },
    {
      id: 'dka_6',
      label: 'When glucose <250 mg/dL: Add dextrose to fluids',
      note: 'Continue insulin to clear ketones, adjust dextrose to maintain glucose 150-250'
    },
    {
      id: 'dka_7',
      label: 'Monitor for cerebral edema signs every hour',
      critical: true,
      note: 'Headache, vomiting, altered mental status, bradycardia, hypertension'
    },
    {
      id: 'dka_8',
      label: 'Check electrolytes every 2-4 hours',
      note: 'Watch for hypokalemia (give K+ before starting insulin if <3.3)'
    },
    {
      id: 'dka_9',
      label: 'Continue until pH >7.3 and ketones cleared',
      note: 'Transition to subcutaneous insulin when eating/drinking'
    }
  ]
};

/**
 * Rapid Sequence Intubation Checklist
 * Based on PALS airway management guidelines
 */
export const intubationChecklist: ProtocolChecklistTemplate = {
  id: 'intubation',
  title: 'Rapid Sequence Intubation',
  steps: [
    {
      id: 'intub_1',
      label: 'Pre-oxygenate with 100% O2 for 3-5 minutes',
      critical: true,
      note: 'Bag-mask ventilation, aim SpO2 >95%'
    },
    {
      id: 'intub_2',
      label: 'Prepare equipment: ETT, laryngoscope, suction, BVM',
      critical: true,
      note: 'ETT size = (age/4) + 4, have 0.5 sizes above/below ready'
    },
    {
      id: 'intub_3',
      label: 'Attach monitors: SpO2, ETCO2, ECG, BP',
      critical: true
    },
    {
      id: 'intub_4',
      label: 'Give premedication: Atropine if age <1 year',
      note: '0.02 mg/kg (min 0.1 mg) to prevent bradycardia'
    },
    {
      id: 'intub_5',
      label: 'Give sedative: Ketamine 1-2 mg/kg IV',
      critical: true,
      note: 'Or etomidate 0.3 mg/kg, or propofol 2-3 mg/kg'
    },
    {
      id: 'intub_6',
      label: 'Give paralytic: Rocuronium 1 mg/kg IV',
      critical: true,
      note: 'Or succinylcholine 2 mg/kg IV (avoid if hyperkalemia risk)'
    },
    {
      id: 'intub_7',
      label: 'Wait 45-60 seconds for paralysis',
      note: 'Continue pre-oxygenation, avoid bagging if possible'
    },
    {
      id: 'intub_8',
      label: 'Perform laryngoscopy and intubate',
      critical: true,
      note: 'Attempt <30 seconds, abort if SpO2 drops'
    },
    {
      id: 'intub_9',
      label: 'Confirm placement: ETCO2 waveform + bilateral breath sounds',
      critical: true,
      note: 'If no ETCO2: REMOVE tube immediately'
    },
    {
      id: 'intub_10',
      label: 'Secure tube and obtain chest X-ray',
      note: 'Tip should be 2-3 cm above carina'
    }
  ]
};

/**
 * Anaphylaxis Management Checklist
 * Based on EAACI/WAO guidelines
 */
export const anaphylaxisChecklist: ProtocolChecklistTemplate = {
  id: 'anaphylaxis',
  title: 'Anaphylaxis Protocol',
  steps: [
    {
      id: 'anaph_1',
      label: 'Give IM epinephrine 0.01 mg/kg (max 0.5 mg) IMMEDIATELY',
      critical: true,
      note: 'Anterolateral thigh, can repeat every 5-15 min'
    },
    {
      id: 'anaph_2',
      label: 'Call for help and activate emergency response',
      critical: true
    },
    {
      id: 'anaph_3',
      label: 'Position patient supine with legs elevated',
      note: 'Unless vomiting or respiratory distress'
    },
    {
      id: 'anaph_4',
      label: 'Give high-flow oxygen, target SpO2 >94%',
      critical: true
    },
    {
      id: 'anaph_5',
      label: 'Establish IV access',
      critical: true
    },
    {
      id: 'anaph_6',
      label: 'Give fluid bolus 20 mL/kg if hypotensive',
      critical: true,
      note: 'May need large volumes (40-60 mL/kg)'
    },
    {
      id: 'anaph_7',
      label: 'If no improvement: Repeat IM epinephrine',
      critical: true,
      note: 'Can give every 5-15 minutes'
    },
    {
      id: 'anaph_8',
      label: 'If refractory: Start IV epinephrine infusion',
      note: '0.1-1 mcg/kg/min, titrate to effect'
    },
    {
      id: 'anaph_9',
      label: 'Give H1 blocker: Diphenhydramine 1 mg/kg IV (max 50 mg)',
      note: 'Adjunct only, NOT first-line'
    },
    {
      id: 'anaph_10',
      label: 'Give H2 blocker: Ranitidine 1 mg/kg IV (max 50 mg)',
      note: 'Adjunct therapy'
    },
    {
      id: 'anaph_11',
      label: 'Give corticosteroid: Methylprednisolone 1-2 mg/kg IV',
      note: 'May prevent biphasic reaction'
    },
    {
      id: 'anaph_12',
      label: 'Observe for minimum 4-6 hours',
      critical: true,
      note: 'Biphasic reactions can occur up to 72 hours later'
    }
  ]
};

/**
 * Status Epilepticus Management Checklist
 * Based on AES/ACEP guidelines
 */
export const statusEpilepticusChecklist: ProtocolChecklistTemplate = {
  id: 'status_epilepticus',
  title: 'Status Epilepticus Protocol',
  steps: [
    {
      id: 'seizure_1',
      label: 'Protect airway, give oxygen, position on side',
      critical: true
    },
    {
      id: 'seizure_2',
      label: 'Check glucose (treat if <60 mg/dL)',
      critical: true,
      note: 'Dextrose 0.5-1 g/kg IV'
    },
    {
      id: 'seizure_3',
      label: '0-5 min: Give benzodiazepine',
      critical: true,
      note: 'Lorazepam 0.1 mg/kg IV or midazolam 0.2 mg/kg IM'
    },
    {
      id: 'seizure_4',
      label: 'If still seizing at 5 min: Repeat benzodiazepine',
      critical: true
    },
    {
      id: 'seizure_5',
      label: 'If still seizing at 10 min: Give second-line AED',
      critical: true,
      note: 'Fosphenytoin 20 mg PE/kg IV or levetiracetam 60 mg/kg IV'
    },
    {
      id: 'seizure_6',
      label: 'If still seizing at 20 min: Prepare for intubation',
      critical: true,
      note: 'Refractory status epilepticus'
    },
    {
      id: 'seizure_7',
      label: 'Give third-line agent: Midazolam or propofol infusion',
      critical: true,
      note: 'Requires intubation and ICU monitoring'
    },
    {
      id: 'seizure_8',
      label: 'Arrange ICU transfer and continuous EEG monitoring',
      critical: true
    }
  ]
};

/**
 * Get checklist template by ID
 */
export const getChecklistTemplate = (id: string): ProtocolChecklistTemplate | undefined => {
  const templates: Record<string, ProtocolChecklistTemplate> = {
    shock_resuscitation: shockResuscitationChecklist,
    sepsis_bundle: sepsisBundleChecklist,
    dka_management: dkaManagementChecklist,
    intubation: intubationChecklist,
    anaphylaxis: anaphylaxisChecklist,
    status_epilepticus: statusEpilepticusChecklist
  };
  
  return templates[id];
};

/**
 * Initialize checklist from template (sets all steps to not completed)
 */
export const initializeChecklist = (template: ProtocolChecklistTemplate) => {
  return {
    title: template.title,
    steps: template.steps.map(step => ({
      ...step,
      completed: false
    }))
  };
};
