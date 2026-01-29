/**
 * Action Sequencing Engine
 * Generates sequential, single-action recommendations based on assessment phase and findings
 * Implements: One action at a time, confirmation required, then next action
 */

import { Action } from '@/components/ActionCard';

export interface PhaseAssessment {
  phase: 'airway' | 'breathing' | 'circulation' | 'disability' | 'exposure';
  findings: Record<string, any>;
  weight: number;
  age: { years: number; months: number };
}

/**
 * Generate sequential actions for Airway phase
 */
export const generateAirwayActions = (assessment: PhaseAssessment): Action[] => {
  const actions: Action[] = [];
  const { findings, weight } = assessment;

  // Action 1: Assess airway patency
  if (findings.airwayPatency !== 'patent') {
    actions.push({
      id: 'airway-1-position',
      sequence: 1,
      title: 'Position for Airway Access',
      description: 'Place child in sniffing position (head extension, neck flexion for infants; neutral for older children). Remove any foreign objects.',
      rationale: 'Optimal positioning maximizes airway diameter and allows visualization for intervention.',
      expectedOutcome: 'Airway more patent, easier visualization and intervention',
      urgency: findings.airwayPatency === 'obstructed' ? 'critical' : 'urgent',
      phase: 'airway',
      timeframe: 'Immediate',
      monitoring: ['Stridor presence', 'Drooling', 'Ability to swallow', 'Respiratory effort'],
    });

    // Action 2: Suction if secretions present
    if (findings.secretions) {
      actions.push({
        id: 'airway-2-suction',
        sequence: 2,
        title: 'Suction Airway',
        description: 'Gently suction mouth and pharynx to clear secretions. Use appropriate catheter size.',
        rationale: 'Secretions obstruct airway. Suctioning clears visualization and improves patency.',
        expectedOutcome: 'Airway cleared of secretions, improved patency',
        urgency: 'urgent',
        phase: 'airway',
        timeframe: '30 seconds',
        dosing: {
          weight,
          calculation: 'Suction catheter size = age/4 + 4 Fr',
          dose: `${Math.round(assessment.age.years / 4 + 4)} Fr`,
          route: 'Oropharyngeal/nasopharyngeal',
        },
        monitoring: ['Airway patency', 'Oxygen saturation', 'Respiratory effort'],
      });
    }

    // Action 3: Airway adjunct if still at risk
    if (findings.airwayPatency === 'at-risk') {
      actions.push({
        id: 'airway-3-adjunct',
        sequence: actions.length + 1,
        title: 'Insert Airway Adjunct',
        description: 'Insert oropharyngeal or nasopharyngeal airway to maintain patency.',
        rationale: 'Airway adjuncts prevent collapse and maintain patent airway without intubation.',
        expectedOutcome: 'Airway maintained patent, improved air exchange',
        urgency: 'urgent',
        phase: 'airway',
        timeframe: '1-2 minutes',
        dosing: {
          weight,
          calculation: 'OPA size = age/2 + 4 cm; NPA size = age/4 + 4 Fr',
          dose: `OPA ${Math.round(assessment.age.years / 2 + 4)} cm or NPA ${Math.round(assessment.age.years / 4 + 4)} Fr`,
          route: 'Oropharyngeal or nasopharyngeal',
        },
        prerequisites: [
          'Airway positioned',
          'Secretions cleared',
          'Appropriate size adjunct available',
        ],
        monitoring: ['Airway patency', 'Oxygen saturation', 'Respiratory effort', 'Gag reflex'],
      });
    }
  }

  return actions;
};

/**
 * Generate sequential actions for Breathing phase
 */
export const generateBreathingActions = (assessment: PhaseAssessment): Action[] => {
  const actions: Action[] = [];
  const { findings, weight, age } = assessment;

  // Action 1: High-flow oxygen
  if (!findings.oxygenApplied || findings.spO2 < 94) {
    actions.push({
      id: 'breathing-1-oxygen',
      sequence: 1,
      title: 'Apply High-Flow Oxygen',
      description: 'Apply high-flow oxygen via non-rebreather mask (10-15 L/min) to achieve SpO2 >94%.',
      rationale: 'Hypoxemia is immediately life-threatening. High-flow oxygen is first-line intervention.',
      expectedOutcome: 'SpO2 >94%, improved oxygenation and perfusion',
      urgency: 'critical',
      phase: 'breathing',
      timeframe: 'Immediate',
      monitoring: ['SpO2 (target >94%)', 'Respiratory rate', 'Work of breathing', 'Color'],
      prerequisites: ['Airway patent'],
      contraindications: ['None - oxygen always first-line in emergency'],
    });
  }

  // Action 2: Assess breathing adequacy
  if (findings.breathingAdequate === false) {
    actions.push({
      id: 'breathing-2-assess',
      sequence: actions.length + 1,
      title: 'Assess Breathing Adequacy',
      description: 'Check: respiratory rate, work of breathing, air movement, breath sounds, chest rise.',
      rationale: 'Determines if breathing is adequate or inadequate, guiding need for ventilation support.',
      expectedOutcome: 'Clear assessment of breathing status and need for intervention',
      urgency: 'urgent',
      phase: 'breathing',
      timeframe: '30 seconds',
      monitoring: [
        'Respiratory rate (normal: <1yr 30-40, 1-5yr 25-30, >5yr 20-25)',
        'Work of breathing (retractions, nasal flare, grunting)',
        'Air movement (bilateral, equal)',
        'Breath sounds (clear, equal)',
      ],
    });

    // Action 3: Bag-valve-mask ventilation if inadequate
    if (findings.breathingAdequate === false) {
      const ageYears = age.years + age.months / 12;
      const maskSize = ageYears < 1 ? 'newborn' : ageYears < 5 ? 'pediatric' : 'adult';
      const bagSize = ageYears < 1 ? '450 mL' : ageYears < 5 ? '500-700 mL' : '1000-1500 mL';

      actions.push({
        id: 'breathing-3-bvm',
        sequence: actions.length + 1,
        title: 'Provide Bag-Valve-Mask Ventilation',
        description: `Use ${maskSize} mask with ${bagSize} bag. Ventilate at 20 breaths/min with 100% oxygen.`,
        rationale: 'Inadequate breathing requires ventilation support to prevent hypoxemia and hypercarbia.',
        expectedOutcome: 'Adequate ventilation, SpO2 >94%, improved respiratory status',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: '1-2 minutes',
        dosing: {
          weight,
          calculation: `Mask size: ${maskSize}, Bag: ${bagSize}, Rate: 20/min, Tidal volume: 6-8 mL/kg`,
          dose: `${(weight * 6).toFixed(0)}-${(weight * 8).toFixed(0)} mL per breath`,
          route: 'Bag-valve-mask',
        },
        prerequisites: [
          'Airway patent',
          'High-flow oxygen applied',
          'Appropriate mask and bag size',
          'Assistant available',
        ],
        monitoring: [
          'Chest rise (adequate tidal volume)',
          'SpO2 (target >94%)',
          'Respiratory rate',
          'Breath sounds (bilateral, equal)',
          'Gastric distension',
        ],
      });
    }
  }

  return actions;
};

/**
 * Generate sequential actions for Circulation phase
 */
export const generateCirculationActions = (assessment: PhaseAssessment): Action[] => {
  const actions: Action[] = [];
  const { findings, weight } = assessment;

  // Action 1: Assess perfusion
  actions.push({
    id: 'circulation-1-assess',
    sequence: 1,
    title: 'Assess Perfusion Status',
    description: 'Check: heart rate, blood pressure, capillary refill, temperature gradient, urine output, lactate.',
    rationale: 'Perfusion assessment determines if child is in shock and guides fluid/medication strategy.',
    expectedOutcome: 'Clear classification of perfusion status (compensated, decompensated, or shock)',
    urgency: 'urgent',
    phase: 'circulation',
    timeframe: '1 minute',
    monitoring: [
      'Heart rate (age-appropriate)',
      'Capillary refill (<2 sec = adequate)',
      'Temperature gradient (central-peripheral)',
      'Urine output (0.5-1 mL/kg/hr)',
      'Lactate (normal <2 mmol/L)',
    ],
  });

  // Action 2: Establish IV access
  if (!findings.ivAccess) {
    actions.push({
      id: 'circulation-2-iv',
      sequence: actions.length + 1,
      title: 'Establish IV Access',
      description: 'Insert peripheral IV (2 large-bore if possible). If failed after 2 attempts, use IO.',
      rationale: 'IV access required for fluid and medication administration.',
      expectedOutcome: 'Secure IV or IO access for resuscitation',
      urgency: findings.perfusionStatus === 'shock' ? 'critical' : 'urgent',
      phase: 'circulation',
      timeframe: '2-3 minutes',
      dosing: {
        weight,
        calculation: 'Peripheral IV: 18-20G; IO: 15-18G',
        dose: 'Largest available',
        route: 'Peripheral IV or intraosseous',
      },
      prerequisites: ['Airway patent', 'Breathing adequate'],
      monitoring: ['IV patency', 'Infiltration', 'Blood return'],
    });
  }

  // Action 3: Fluid bolus if in shock
  if (findings.perfusionStatus === 'shock') {
    actions.push({
      id: 'circulation-3-fluid',
      sequence: actions.length + 1,
      title: 'Administer Fluid Bolus',
      description: 'Give RL (or NS if RL unavailable) 10 mL/kg IV over 10-15 minutes. Reassess after each 10 mL/kg.',
      rationale: 'Fluid resuscitation restores circulating volume and improves perfusion in shock.',
      expectedOutcome: 'Improved perfusion: HR normalizes, CRT <2 sec, BP adequate, urine output increases',
      urgency: 'critical',
      phase: 'circulation',
      timeframe: '10-15 minutes',
      dosing: {
        weight,
        calculation: '10 mL/kg bolus over 10-15 min',
        dose: `${weight * 10} mL RL (or NS)`,
        route: 'IV or IO',
      },
      prerequisites: ['IV or IO access established', 'Airway patent', 'Breathing adequate'],
      monitoring: [
        'Heart rate (should decrease)',
        'Capillary refill (should improve)',
        'Blood pressure (should improve)',
        'Urine output (should increase)',
        'Signs of fluid overload (edema, crackles, hepatomegaly)',
      ],
    });
  }

  return actions;
};

/**
 * Generate sequential actions for Disability phase
 */
export const generateDisabilityActions = (assessment: PhaseAssessment): Action[] => {
  const actions: Action[] = [];
  const { findings } = assessment;

  // Action 1: Check glucose
  actions.push({
    id: 'disability-1-glucose',
    sequence: 1,
    title: 'Check Blood Glucose',
    description: 'Measure glucose immediately (point-of-care test or lab).',
    rationale: 'Hypoglycemia can cause altered mental status, seizures, and shock. Must be corrected first.',
    expectedOutcome: 'Glucose level known; if <70 mg/dL, corrected immediately',
    urgency: findings.glucose && findings.glucose < 70 ? 'critical' : 'routine',
    phase: 'disability',
    timeframe: '1 minute',
    monitoring: ['Glucose level', 'Mental status after correction'],
  });

  // Action 2: Correct hypoglycemia if present
  if (findings.glucose && findings.glucose < 70) {
    actions.push({
      id: 'disability-2-glucose-correction',
      sequence: 2,
      title: 'Correct Hypoglycemia',
      description: 'Give IV dextrose 0.5 g/kg (2 mL/kg of 25% dextrose or 5 mL/kg of 10% dextrose).',
      rationale: 'Hypoglycemia causes altered mental status and shock. Immediate correction prevents deterioration.',
      expectedOutcome: 'Glucose >70 mg/dL, improved mental status',
      urgency: 'critical',
      phase: 'disability',
      timeframe: 'Immediate',
      dosing: {
        weight: assessment.weight,
        calculation: '0.5 g/kg = 2 mL/kg of 25% dextrose or 5 mL/kg of 10%',
        dose: `${(assessment.weight * 2).toFixed(0)} mL of 25% dextrose IV`,
        route: 'IV or IO',
      },
      prerequisites: ['IV or IO access established'],
      monitoring: ['Glucose level (repeat in 5 min)', 'Mental status', 'Seizure activity'],
    });
  }

  // Action 3: Assess AVPU
  actions.push({
    id: 'disability-3-avpu',
    sequence: actions.length + 1,
    title: 'Assess Level of Consciousness (AVPU)',
    description: 'Alert, Verbal, Pain, Unresponsive. Document baseline and any changes.',
    rationale: 'Determines if child needs airway protection and guides need for imaging/investigation.',
    expectedOutcome: 'Clear assessment of consciousness level',
    urgency: 'routine',
    phase: 'disability',
    timeframe: '1 minute',
    monitoring: ['AVPU status', 'Pupil size and reactivity', 'Seizure activity'],
  });

  return actions;
};

/**
 * Generate sequential actions for Exposure phase
 */
export const generateExposureActions = (assessment: PhaseAssessment): Action[] => {
  const actions: Action[] = [];
  const { findings } = assessment;

  actions.push({
    id: 'exposure-1-examine',
    sequence: 1,
    title: 'Perform Full Exposure Examination',
    description: 'Remove clothing, examine entire body for rashes, injuries, signs of abuse. Maintain temperature.',
    rationale: 'Identifies hidden injuries, infections, or abuse. Prevents hypothermia with blankets.',
    expectedOutcome: 'All injuries/findings identified, child kept warm',
    urgency: 'routine',
    phase: 'exposure',
    timeframe: '2-3 minutes',
    monitoring: ['Temperature', 'Rashes', 'Injuries', 'Signs of abuse'],
  });

  return actions;
};

/**
 * Get all actions for current phase
 */
export const getPhaseActions = (assessment: PhaseAssessment): Action[] => {
  switch (assessment.phase) {
    case 'airway':
      return generateAirwayActions(assessment);
    case 'breathing':
      return generateBreathingActions(assessment);
    case 'circulation':
      return generateCirculationActions(assessment);
    case 'disability':
      return generateDisabilityActions(assessment);
    case 'exposure':
      return generateExposureActions(assessment);
    default:
      return [];
  }
};

/**
 * Get next action in sequence
 */
export const getNextAction = (
  actions: Action[],
  completedActionIds: string[]
): Action | null => {
  const nextAction = actions.find((a) => !completedActionIds.includes(a.id));
  return nextAction || null;
};
