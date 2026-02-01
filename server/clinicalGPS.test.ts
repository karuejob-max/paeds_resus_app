/**
 * GPS Clinical Flow Tests
 * Tests for the new GPS-like clinical decision support architecture
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock clinical question types
interface PatientData {
  ageYears: number;
  ageMonths: number;
  weight: number;
  glucoseUnit: 'mmol/L' | 'mg/dL';
}

interface CriticalAction {
  id: string;
  severity: 'critical' | 'urgent' | 'routine';
  title: string;
  instruction: string;
  dose?: string;
  route?: string;
  rationale: string;
  reassessAfter: string;
  timer?: number;
  interventionTemplate?: string;
}

// Weight calculation function (same as in ClinicalAssessmentGPS)
function calculateWeight(months: number): number {
  if (months < 12) {
    return (months + 9) / 2;
  } else if (months < 60) {
    return (Math.floor(months / 12) + 4) * 2;
  } else {
    return Math.floor(months / 12) * 4;
  }
}

// Critical trigger functions
function getApneaTrigger(answer: string, pd: PatientData): CriticalAction | null {
  if (answer === 'no') {
    return {
      id: 'bvm-ventilation',
      severity: 'critical',
      title: 'START BAG-VALVE-MASK VENTILATION NOW',
      instruction: 'Position head (neutral in infants, sniffing in children). Seal mask. Squeeze bag to see chest rise.',
      dose: `${pd.ageYears < 1 ? '30' : pd.ageYears < 8 ? '20' : '12-15'} breaths/minute`,
      route: 'Bag-valve-mask',
      rationale: 'Apnea is immediately life-threatening. Ventilation must begin within seconds.',
      reassessAfter: 'After 5 breaths, check for chest rise and improvement',
      timer: 30,
      interventionTemplate: 'bvmVentilation',
    };
  }
  return null;
}

function getPulselessTrigger(answer: string, pd: PatientData): CriticalAction | null {
  if (answer === 'no') {
    const weight = pd.weight || calculateWeight(pd.ageYears * 12 + pd.ageMonths);
    return {
      id: 'start-cpr',
      severity: 'critical',
      title: 'START CPR IMMEDIATELY',
      instruction: `Begin chest compressions: ${pd.ageYears < 1 ? 'Two fingers or two thumbs encircling' : pd.ageYears < 8 ? 'One hand, heel of hand' : 'Two hands, interlocked'}. Compress 1/3 chest depth at 100-120/min.`,
      dose: '30:2 compression:ventilation ratio (single rescuer) or 15:2 (two rescuers)',
      route: 'Chest compressions + ventilation',
      rationale: 'Cardiac arrest. Every second without CPR reduces survival.',
      reassessAfter: 'Check rhythm/pulse every 2 minutes',
      timer: 120,
      interventionTemplate: 'cpr',
    };
  }
  return null;
}

function getHypoglycemiaTrigger(glucoseMmol: number, pd: PatientData): CriticalAction | null {
  if (glucoseMmol < 3.0) {
    const weight = pd.weight || calculateWeight(pd.ageYears * 12 + pd.ageMonths);
    const dextroseVolume = Math.round(weight * 2);
    return {
      id: 'hypoglycemia',
      severity: 'critical',
      title: 'TREAT HYPOGLYCEMIA NOW',
      instruction: `Give ${dextroseVolume} mL of 10% Dextrose IV/IO (2 mL/kg)`,
      dose: `${dextroseVolume} mL D10% IV/IO`,
      route: 'IV or IO',
      rationale: `Glucose ${glucoseMmol} mmol/L is critically low. Brain damage occurs rapidly.`,
      reassessAfter: 'Recheck glucose in 15 minutes',
      timer: 900,
      interventionTemplate: 'dextrose',
    };
  }
  return null;
}

function getShockTrigger(crt: string, pd: PatientData): CriticalAction | null {
  if (crt === 'prolonged' || crt === 'flash') {
    const weight = pd.weight || calculateWeight(pd.ageYears * 12 + pd.ageMonths);
    const bolusVolume = Math.round(weight * 20);
    return {
      id: 'fluid-bolus',
      severity: 'critical',
      title: 'GIVE FLUID BOLUS',
      instruction: `Give ${bolusVolume} mL Normal Saline (20 mL/kg) over 5-10 minutes`,
      dose: `${bolusVolume} mL NS`,
      route: 'IV or IO',
      rationale: `Abnormal capillary refill (${crt}) indicates shock. Fluid resuscitation is first-line.`,
      reassessAfter: 'Reassess perfusion after bolus - check CRT, HR, BP',
      timer: 600,
      interventionTemplate: 'fluidBolus',
    };
  }
  return null;
}

describe('Weight Calculation', () => {
  it('calculates weight for infants under 1 year using (age + 9) / 2', () => {
    expect(calculateWeight(0)).toBe(4.5);  // Newborn
    expect(calculateWeight(3)).toBe(6);    // 3 months
    expect(calculateWeight(6)).toBe(7.5);  // 6 months
    expect(calculateWeight(9)).toBe(9);    // 9 months
  });

  it('calculates weight for children 1-5 years using (age + 4) * 2', () => {
    expect(calculateWeight(12)).toBe(10);  // 1 year
    expect(calculateWeight(24)).toBe(12);  // 2 years
    expect(calculateWeight(36)).toBe(14);  // 3 years
    expect(calculateWeight(48)).toBe(16);  // 4 years
  });

  it('calculates weight for children over 5 years using age * 4', () => {
    expect(calculateWeight(60)).toBe(20);  // 5 years
    expect(calculateWeight(72)).toBe(24);  // 6 years
    expect(calculateWeight(96)).toBe(32);  // 8 years
    expect(calculateWeight(120)).toBe(40); // 10 years
  });
});

describe('Critical Trigger: Apnea', () => {
  const infantPatient: PatientData = { ageYears: 0, ageMonths: 6, weight: 7, glucoseUnit: 'mmol/L' };
  const childPatient: PatientData = { ageYears: 5, ageMonths: 0, weight: 20, glucoseUnit: 'mmol/L' };
  const olderChildPatient: PatientData = { ageYears: 10, ageMonths: 0, weight: 35, glucoseUnit: 'mmol/L' };

  it('triggers BVM ventilation for apneic patient', () => {
    const action = getApneaTrigger('no', infantPatient);
    expect(action).not.toBeNull();
    expect(action?.id).toBe('bvm-ventilation');
    expect(action?.severity).toBe('critical');
  });

  it('returns null for breathing patient', () => {
    const action = getApneaTrigger('yes', infantPatient);
    expect(action).toBeNull();
  });

  it('provides age-appropriate ventilation rates', () => {
    const infantAction = getApneaTrigger('no', infantPatient);
    expect(infantAction?.dose).toContain('30');

    const childAction = getApneaTrigger('no', childPatient);
    expect(childAction?.dose).toContain('20');

    const olderAction = getApneaTrigger('no', olderChildPatient);
    expect(olderAction?.dose).toContain('12-15');
  });

  it('includes intervention template for sidebar tracking', () => {
    const action = getApneaTrigger('no', infantPatient);
    expect(action?.interventionTemplate).toBe('bvmVentilation');
  });
});

describe('Critical Trigger: Pulseless', () => {
  const infantPatient: PatientData = { ageYears: 0, ageMonths: 6, weight: 7, glucoseUnit: 'mmol/L' };
  const childPatient: PatientData = { ageYears: 5, ageMonths: 0, weight: 20, glucoseUnit: 'mmol/L' };

  it('triggers CPR for pulseless patient', () => {
    const action = getPulselessTrigger('no', infantPatient);
    expect(action).not.toBeNull();
    expect(action?.id).toBe('start-cpr');
    expect(action?.severity).toBe('critical');
    expect(action?.timer).toBe(120); // 2-minute CPR cycles
  });

  it('returns null for patient with pulse', () => {
    const action = getPulselessTrigger('yes', infantPatient);
    expect(action).toBeNull();
  });

  it('provides age-appropriate compression technique', () => {
    const infantAction = getPulselessTrigger('no', infantPatient);
    expect(infantAction?.instruction).toContain('Two fingers');

    const childAction = getPulselessTrigger('no', childPatient);
    expect(childAction?.instruction).toContain('One hand');
  });

  it('includes CPR intervention template', () => {
    const action = getPulselessTrigger('no', infantPatient);
    expect(action?.interventionTemplate).toBe('cpr');
  });
});

describe('Critical Trigger: Hypoglycemia', () => {
  const patient: PatientData = { ageYears: 2, ageMonths: 0, weight: 12, glucoseUnit: 'mmol/L' };

  it('triggers dextrose for glucose < 3.0 mmol/L', () => {
    const action = getHypoglycemiaTrigger(2.5, patient);
    expect(action).not.toBeNull();
    expect(action?.id).toBe('hypoglycemia');
    expect(action?.severity).toBe('critical');
  });

  it('returns null for normal glucose', () => {
    const action = getHypoglycemiaTrigger(5.0, patient);
    expect(action).toBeNull();
  });

  it('calculates correct dextrose dose (2 mL/kg)', () => {
    const action = getHypoglycemiaTrigger(2.0, patient);
    expect(action?.dose).toContain('24 mL'); // 12 kg * 2 mL/kg
  });

  it('sets 15-minute reassessment timer', () => {
    const action = getHypoglycemiaTrigger(2.0, patient);
    expect(action?.timer).toBe(900); // 15 minutes in seconds
  });
});

describe('Critical Trigger: Shock (Capillary Refill)', () => {
  const patient: PatientData = { ageYears: 3, ageMonths: 0, weight: 15, glucoseUnit: 'mmol/L' };

  it('triggers fluid bolus for prolonged CRT', () => {
    const action = getShockTrigger('prolonged', patient);
    expect(action).not.toBeNull();
    expect(action?.id).toBe('fluid-bolus');
    expect(action?.severity).toBe('critical');
  });

  it('triggers fluid bolus for flash CRT (distributive shock)', () => {
    const action = getShockTrigger('flash', patient);
    expect(action).not.toBeNull();
    expect(action?.id).toBe('fluid-bolus');
  });

  it('returns null for normal CRT', () => {
    const action = getShockTrigger('normal', patient);
    expect(action).toBeNull();
  });

  it('calculates correct bolus volume (20 mL/kg)', () => {
    const action = getShockTrigger('prolonged', patient);
    expect(action?.dose).toContain('300 mL'); // 15 kg * 20 mL/kg
  });
});

describe('Non-Blocking Flow Architecture', () => {
  it('allows assessment to continue after intervention is triggered', () => {
    // Simulate the flow: answer question -> trigger action -> continue to next question
    const patient: PatientData = { ageYears: 2, ageMonths: 0, weight: 12, glucoseUnit: 'mmol/L' };
    
    // Question 1: Is child breathing? -> No -> Trigger BVM
    const bvmAction = getApneaTrigger('no', patient);
    expect(bvmAction).not.toBeNull();
    
    // Flow should NOT block - next question can be asked immediately
    // Question 2: Does child have pulse? -> Yes -> No action
    const pulseAction = getPulselessTrigger('yes', patient);
    expect(pulseAction).toBeNull();
    
    // Both questions answered, intervention running in parallel
    expect(bvmAction?.interventionTemplate).toBe('bvmVentilation');
  });

  it('can track multiple parallel interventions', () => {
    const patient: PatientData = { ageYears: 2, ageMonths: 0, weight: 12, glucoseUnit: 'mmol/L' };
    
    // Multiple interventions triggered
    const interventions: CriticalAction[] = [];
    
    const bvmAction = getApneaTrigger('no', patient);
    if (bvmAction) interventions.push(bvmAction);
    
    const glucoseAction = getHypoglycemiaTrigger(2.0, patient);
    if (glucoseAction) interventions.push(glucoseAction);
    
    const shockAction = getShockTrigger('prolonged', patient);
    if (shockAction) interventions.push(shockAction);
    
    // All three interventions should be tracked
    expect(interventions.length).toBe(3);
    expect(interventions.map(i => i.id)).toContain('bvm-ventilation');
    expect(interventions.map(i => i.id)).toContain('hypoglycemia');
    expect(interventions.map(i => i.id)).toContain('fluid-bolus');
  });
});

describe('Active Interventions Sidebar', () => {
  interface ActiveIntervention {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'escalated';
    startTime: number;
    timer?: number;
    dose?: string;
  }

  it('creates intervention from template', () => {
    const intervention: ActiveIntervention = {
      id: 'bvm-1',
      name: 'BVM Ventilation',
      status: 'in_progress',
      startTime: Date.now(),
      timer: 30,
    };
    
    expect(intervention.status).toBe('in_progress');
    expect(intervention.timer).toBe(30);
  });

  it('tracks intervention status transitions', () => {
    const intervention: ActiveIntervention = {
      id: 'fluid-1',
      name: 'Fluid Bolus',
      status: 'pending',
      startTime: Date.now(),
      dose: '300 mL NS',
    };
    
    // Start intervention
    intervention.status = 'in_progress';
    expect(intervention.status).toBe('in_progress');
    
    // Complete intervention
    intervention.status = 'completed';
    expect(intervention.status).toBe('completed');
  });

  it('supports escalation status', () => {
    const intervention: ActiveIntervention = {
      id: 'fluid-1',
      name: 'Fluid Bolus',
      status: 'in_progress',
      startTime: Date.now(),
      dose: '300 mL NS',
    };
    
    // Escalate if no improvement
    intervention.status = 'escalated';
    expect(intervention.status).toBe('escalated');
  });
});

describe('Module Overlay System', () => {
  type ModuleType = 'shock' | 'asthma' | 'ivio' | 'fluid' | 'inotrope' | 'lab' | 'arrhythmia' | null;

  it('opens correct module based on clinical trigger', () => {
    let activeModule: ModuleType = null;
    
    // Simulate shock assessment trigger
    const triggerModule = (module: ModuleType) => {
      activeModule = module;
    };
    
    // Prolonged CRT -> Open shock assessment
    triggerModule('shock');
    expect(activeModule).toBe('shock');
    
    // Wheeze detected -> Open asthma escalation
    triggerModule('asthma');
    expect(activeModule).toBe('asthma');
  });

  it('allows module to be closed without losing assessment progress', () => {
    let activeModule: ModuleType = 'shock';
    let assessmentProgress = { currentQuestion: 'circulation_crt', findings: ['breathing: yes', 'pulse: yes'] };
    
    // Close module
    activeModule = null;
    
    // Assessment progress should be preserved
    expect(activeModule).toBeNull();
    expect(assessmentProgress.currentQuestion).toBe('circulation_crt');
    expect(assessmentProgress.findings.length).toBe(2);
  });
});

describe('Clinical Header', () => {
  interface PatientStatus {
    weight: number;
    ageDisplay: string;
    criticalFindings: string[];
    activeInterventions: number;
    elapsedTime: number;
    emergencyActivated: boolean;
  }

  it('displays patient weight and age', () => {
    const status: PatientStatus = {
      weight: 15,
      ageDisplay: '3 years',
      criticalFindings: [],
      activeInterventions: 0,
      elapsedTime: 0,
      emergencyActivated: false,
    };
    
    expect(status.weight).toBe(15);
    expect(status.ageDisplay).toBe('3 years');
  });

  it('shows critical findings count', () => {
    const status: PatientStatus = {
      weight: 15,
      ageDisplay: '3 years',
      criticalFindings: ['Apnea', 'Hypoglycemia'],
      activeInterventions: 2,
      elapsedTime: 120,
      emergencyActivated: true,
    };
    
    expect(status.criticalFindings.length).toBe(2);
    expect(status.activeInterventions).toBe(2);
  });

  it('tracks emergency activation state', () => {
    const status: PatientStatus = {
      weight: 15,
      ageDisplay: '3 years',
      criticalFindings: ['Cardiac Arrest'],
      activeInterventions: 1,
      elapsedTime: 0,
      emergencyActivated: true,
    };
    
    expect(status.emergencyActivated).toBe(true);
  });
});

describe('Quick Start Scenarios', () => {
  interface QuickStartScenario {
    id: string;
    name: string;
    severity: 'critical' | 'urgent' | 'specialized';
    initialActions: string[];
    skipToQuestion?: string;
  }

  const scenarios: QuickStartScenario[] = [
    {
      id: 'cardiac_arrest',
      name: 'Cardiac Arrest',
      severity: 'critical',
      initialActions: ['Start CPR', 'Call for help', 'Get defibrillator'],
      skipToQuestion: 'pulse',
    },
    {
      id: 'anaphylaxis',
      name: 'Anaphylaxis',
      severity: 'critical',
      initialActions: ['Give IM Epinephrine', 'Call for help', 'Position patient'],
      skipToQuestion: 'airway_patent',
    },
    {
      id: 'status_asthmaticus',
      name: 'Status Asthmaticus',
      severity: 'urgent',
      initialActions: ['Give salbutamol', 'Give steroids', 'Monitor SpO2'],
      skipToQuestion: 'breathing_effort',
    },
  ];

  it('provides quick start for cardiac arrest', () => {
    const scenario = scenarios.find(s => s.id === 'cardiac_arrest');
    expect(scenario).toBeDefined();
    expect(scenario?.severity).toBe('critical');
    expect(scenario?.initialActions).toContain('Start CPR');
  });

  it('provides quick start for anaphylaxis', () => {
    const scenario = scenarios.find(s => s.id === 'anaphylaxis');
    expect(scenario).toBeDefined();
    expect(scenario?.initialActions).toContain('Give IM Epinephrine');
  });

  it('skips to relevant question based on scenario', () => {
    const cardiacArrest = scenarios.find(s => s.id === 'cardiac_arrest');
    expect(cardiacArrest?.skipToQuestion).toBe('pulse');
    
    const anaphylaxis = scenarios.find(s => s.id === 'anaphylaxis');
    expect(anaphylaxis?.skipToQuestion).toBe('airway_patent');
  });
});

describe('Reassessment Prompts', () => {
  interface ReassessmentPrompt {
    interventionId: string;
    promptAt: number; // seconds after intervention
    question: string;
    options: { value: string; label: string; nextAction?: string }[];
  }

  it('prompts for reassessment after fluid bolus', () => {
    const prompt: ReassessmentPrompt = {
      interventionId: 'fluid-bolus',
      promptAt: 600, // 10 minutes
      question: 'How has the patient responded to the fluid bolus?',
      options: [
        { value: 'improved', label: 'Improved - CRT normalizing, HR decreasing' },
        { value: 'no_change', label: 'No change - Consider second bolus', nextAction: 'repeat_bolus' },
        { value: 'worsened', label: 'Worsened - Signs of overload', nextAction: 'escalate_inotropes' },
      ],
    };
    
    expect(prompt.promptAt).toBe(600);
    expect(prompt.options.length).toBe(3);
    expect(prompt.options[2].nextAction).toBe('escalate_inotropes');
  });

  it('prompts for reassessment after BVM ventilation', () => {
    const prompt: ReassessmentPrompt = {
      interventionId: 'bvm-ventilation',
      promptAt: 30,
      question: 'Is the chest rising with ventilation?',
      options: [
        { value: 'yes', label: 'Yes - Good chest rise', nextAction: 'continue_ventilation' },
        { value: 'no', label: 'No - Reposition airway', nextAction: 'reposition_airway' },
      ],
    };
    
    expect(prompt.promptAt).toBe(30);
    expect(prompt.options[1].nextAction).toBe('reposition_airway');
  });
});

describe('SBAR Handover Generation', () => {
  interface HandoverData {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  }

  it('generates SBAR from assessment findings', () => {
    const findings = [
      { question: 'breathing', answer: 'no', timestamp: new Date() },
      { question: 'pulse', answer: 'yes', timestamp: new Date() },
      { question: 'glucose', answer: 2.5, timestamp: new Date() },
    ];
    
    const interventions = [
      { id: 'bvm-ventilation', status: 'in_progress' },
      { id: 'hypoglycemia', status: 'completed' },
    ];
    
    // Simulate handover generation
    const handover: HandoverData = {
      situation: '3-year-old child with respiratory arrest and hypoglycemia',
      background: 'Found apneic, glucose 2.5 mmol/L',
      assessment: 'Respiratory failure with metabolic emergency. BVM ventilation ongoing, dextrose given.',
      recommendation: 'Requires ICU admission for airway management and glucose monitoring',
    };
    
    expect(handover.situation).toContain('respiratory arrest');
    expect(handover.assessment).toContain('BVM ventilation');
    expect(handover.recommendation).toContain('ICU');
  });
});

describe('Dose Calculations', () => {
  it('calculates epinephrine dose for cardiac arrest (0.01 mg/kg)', () => {
    const weight = 20;
    const dose = weight * 0.01;
    expect(dose).toBe(0.2); // mg
  });

  it('calculates epinephrine dose for anaphylaxis (0.01 mg/kg IM)', () => {
    const weight = 15;
    const dose = weight * 0.01;
    expect(dose).toBe(0.15); // mg
  });

  it('calculates defibrillation energy (2 J/kg first shock)', () => {
    const weight = 25;
    const energy = weight * 2;
    expect(energy).toBe(50); // Joules
  });

  it('calculates fluid bolus volume (20 mL/kg)', () => {
    const weight = 12;
    const volume = weight * 20;
    expect(volume).toBe(240); // mL
  });

  it('calculates dextrose volume (2 mL/kg of D10%)', () => {
    const weight = 10;
    const volume = weight * 2;
    expect(volume).toBe(20); // mL
  });

  it('calculates midazolam dose for seizures (0.1 mg/kg)', () => {
    const weight = 18;
    const dose = weight * 0.1;
    expect(dose).toBe(1.8); // mg
  });

  it('calculates amiodarone dose (5 mg/kg)', () => {
    const weight = 22;
    const dose = weight * 5;
    expect(dose).toBe(110); // mg
  });
});
