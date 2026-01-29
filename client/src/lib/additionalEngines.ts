/**
 * Additional Modular Emergency Engines
 * Hypovolemic Shock, Cardiogenic Shock, Severe Malnutrition, Meningitis
 */

import { Action } from '@/components/ActionCard';
import { EmergencyEngine, AssessmentFindings } from './emergencyEngines';

/**
 * HYPOVOLEMIC SHOCK ENGINE
 * Recognition: Hemorrhage/dehydration + perfusion abnormality
 * Management: Hemorrhage control, fluid resuscitation
 */
export const createHypovolemicShockEngine = (weight: number, age: { years: number; months: number }): EmergencyEngine => {
  const ageYears = age.years + age.months / 12;

  return {
    id: 'hypovolemic-shock',
    name: 'Hypovolemic Shock Engine',
    description: 'Recognition and management of hypovolemic shock (hemorrhage/dehydration) in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const perfusionAbnormality =
        !!(assessment.capillaryRefill && assessment.capillaryRefill > 2) ||
        assessment.skinColor === 'mottled' ||
        assessment.skinColor === 'pale' ||
        !!(assessment.systolicBP && assessment.systolicBP < 90 + 2 * ageYears);

      const volumeLoss = assessment.rash === false && (assessment.urinOutput === 0 || !assessment.urinOutput);

      return perfusionAbnormality && volumeLoss;
    },
    severity: 'critical',
    actions: [
      {
        id: 'hypo-1-hemorrhage-control',
        sequence: 1,
        title: 'Control External Hemorrhage',
        description: 'Apply direct pressure with sterile gauze. Do NOT remove embedded objects.',
        rationale: 'Hemorrhage control is first priority in hypovolemic shock',
        expectedOutcome: 'Bleeding controlled, blood loss minimized',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Immediate',
        monitoring: ['Bleeding status', 'Vital signs'],
      },
      {
        id: 'hypo-2-iv-access',
        sequence: 2,
        title: 'Establish Large-Bore IV Access',
        description: 'Place 2 large-bore IVs (18G or larger) or IO if unable',
        rationale: 'Large-bore access needed for rapid fluid resuscitation',
        expectedOutcome: 'Rapid IV/IO access established',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Immediate',
        monitoring: ['IV patency', 'Fluid flow rate'],
      },
      {
        id: 'hypo-3-fluid-bolus',
        sequence: 3,
        title: 'Administer Rapid Fluid Bolus',
        description: `Give RL 20 mL/kg IV over 15 minutes. Reassess after each 10 mL/kg.`,
        rationale: 'Rapid fluid resuscitation restores circulating volume and perfusion',
        expectedOutcome: 'Improved perfusion: CRT <2 sec, HR normalizing, BP improving',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: '15 minutes',
        dosing: {
          weight,
          calculation: '20 mL/kg bolus over 15 min',
          dose: `${weight * 20} mL RL`,
          route: 'IV or IO',
        },
        monitoring: ['Perfusion signs', 'Heart rate', 'Blood pressure', 'Urine output'],
      },
      {
        id: 'hypo-4-type-cross',
        sequence: 4,
        title: 'Type & Cross, Prepare for Transfusion',
        description: 'If hemorrhage significant, order type & cross. Have O-negative available.',
        rationale: 'Blood products may be needed for ongoing hemorrhage',
        expectedOutcome: 'Blood products available if needed',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: 'Ongoing',
        monitoring: ['Hemoglobin/hematocrit', 'Continued bleeding'],
      },
    ],
    monitoring: [
      'Bleeding status (controlled vs. ongoing)',
      'Heart rate (should decrease with fluids)',
      'Blood pressure (target age-appropriate)',
      'Capillary refill (target <2 sec)',
      'Urine output (target 0.5-1 mL/kg/hr)',
      'Skin perfusion (target pink, warm)',
      'Mental status (target alert)',
      'Hemoglobin/hematocrit',
    ],
  };
};

/**
 * CARDIOGENIC SHOCK ENGINE
 * Recognition: Heart failure + perfusion abnormality
 * Management: Inotropes, afterload reduction, arrhythmia management
 */
export const createCardiogenicShockEngine = (weight: number): EmergencyEngine => {
  return {
    id: 'cardiogenic-shock',
    name: 'Cardiogenic Shock Engine',
    description: 'Recognition and management of cardiogenic shock in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const perfusionAbnormality =
        !!(assessment.capillaryRefill && assessment.capillaryRefill > 2) ||
        assessment.skinColor === 'mottled' ||
        assessment.skinColor === 'pale';

      const heartFailureSign =
        !!(assessment.heartRate && assessment.heartRate > 150) ||
        assessment.workOfBreathing === 'severe' ||
        assessment.retractions === true;

      return perfusionAbnormality && heartFailureSign;
    },
    severity: 'critical',
    actions: [
      {
        id: 'cardio-1-recognize',
        sequence: 1,
        title: 'Recognize Cardiogenic Shock',
        description: 'Confirm heart failure signs: tachycardia, respiratory distress, poor perfusion, possible murmur/gallop',
        rationale: 'Early recognition guides appropriate inotropic support',
        expectedOutcome: 'Cardiogenic shock confirmed, cardiology consulted',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Immediate',
        monitoring: ['Heart rate', 'Respiratory effort', 'Perfusion signs', 'Cardiac sounds'],
      },
      {
        id: 'cardio-2-oxygen',
        sequence: 2,
        title: 'Apply Oxygen and Position',
        description: 'Apply high-flow oxygen. Position upright (semi-Fowler) to reduce pulmonary edema.',
        rationale: 'Oxygen improves oxygenation; upright position reduces pulmonary congestion',
        expectedOutcome: 'SpO2 >94%, easier breathing',
        urgency: 'critical',
        phase: 'breathing',
        timeframe: 'Immediate',
        monitoring: ['SpO2', 'Respiratory effort', 'Crackles/edema'],
      },
      {
        id: 'cardio-3-iv-access',
        sequence: 3,
        title: 'Establish IV Access',
        description: 'Place IV for medication administration. Limit fluid boluses (risk of pulmonary edema).',
        rationale: 'IV access needed for inotropes. Fluid restriction prevents worsening heart failure.',
        expectedOutcome: 'IV access established, fluids limited',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: 'Immediate',
        monitoring: ['IV patency', 'Fluid balance'],
      },
      {
        id: 'cardio-4-inotropes',
        sequence: 4,
        title: 'Start Inotropic Support',
        description: 'Start dobutamine 5-10 mcg/kg/min IV to improve cardiac contractility',
        rationale: 'Inotropes improve cardiac output without excessive vasoconstriction',
        expectedOutcome: 'Improved perfusion, decreased tachycardia',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'After IV access',
        dosing: {
          weight,
          calculation: 'Dobutamine 5-10 mcg/kg/min IV infusion',
          dose: `${(weight * 5).toFixed(1)}-${(weight * 10).toFixed(1)} mcg/min`,
          route: 'IV infusion',
        },
        monitoring: ['Heart rate', 'Blood pressure', 'Perfusion', 'Urine output'],
      },
      {
        id: 'cardio-5-diuretics',
        sequence: 5,
        title: 'Consider Diuretics if Pulmonary Edema',
        description: 'If crackles/pulmonary edema present, give furosemide 1 mg/kg IV',
        rationale: 'Diuretics reduce pulmonary congestion and improve breathing',
        expectedOutcome: 'Reduced crackles, improved breathing',
        urgency: 'urgent',
        phase: 'breathing',
        timeframe: 'After inotropes started',
        dosing: {
          weight,
          calculation: 'Furosemide 1 mg/kg IV',
          dose: `${weight} mg IV`,
          route: 'IV',
        },
        prerequisites: ['Inotropes started', 'Pulmonary edema present'],
        monitoring: ['Urine output', 'Crackles', 'Respiratory effort'],
      },
    ],
    monitoring: [
      'Heart rate (should decrease with treatment)',
      'Blood pressure (maintain age-appropriate)',
      'Perfusion signs (CRT, skin color)',
      'Respiratory effort (should improve)',
      'SpO2 (target >94%)',
      'Urine output (target 0.5-1 mL/kg/hr)',
      'Cardiac sounds (murmur, gallop)',
      'Crackles/pulmonary edema',
    ],
  };
};

/**
 * SEVERE MALNUTRITION ENGINE
 * Recognition: Weight <60% expected, signs of wasting/edema
 * Management: WHO guidelines, careful refeeding, micronutrient supplementation
 */
export const createSevereMalnutritionEngine = (weight: number): EmergencyEngine => {
  return {
    id: 'severe-malnutrition',
    name: 'Severe Malnutrition Engine',
    description: 'Recognition and management of severe acute malnutrition (SAM) in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      // In real implementation, would compare to expected weight for age
      // For now, simplified trigger
      return weight < 10; // Placeholder - would need age-based expected weight
    },
    severity: 'urgent',
    actions: [
      {
        id: 'sam-1-recognize',
        sequence: 1,
        title: 'Recognize Severe Acute Malnutrition',
        description: 'Confirm: weight <60% expected for age OR MUAC <11.5 cm OR bilateral pitting edema',
        rationale: 'SAM requires specialized management per WHO guidelines to prevent refeeding syndrome',
        expectedOutcome: 'SAM confirmed, nutritionist consulted',
        urgency: 'urgent',
        phase: 'exposure',
        timeframe: 'Immediate',
        monitoring: ['Weight', 'MUAC', 'Edema', 'Vital signs'],
      },
      {
        id: 'sam-2-stabilization',
        sequence: 2,
        title: 'Stabilization Phase (First 24-48 hours)',
        description: 'Treat infections, correct electrolytes, provide modest calories (50-100 kcal/kg/day)',
        rationale: 'Aggressive feeding in SAM causes refeeding syndrome and death. Start slowly.',
        expectedOutcome: 'Stable vital signs, no refeeding syndrome',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: '24-48 hours',
        dosing: {
          weight,
          calculation: '50-100 kcal/kg/day divided into frequent meals',
          dose: `${weight * 50}-${weight * 100} kcal/day`,
          route: 'Oral or NG tube',
        },
        monitoring: ['Vital signs', 'Electrolytes', 'Urine output', 'Respiratory status'],
      },
      {
        id: 'sam-3-micronutrients',
        sequence: 3,
        title: 'Provide Micronutrient Supplementation',
        description: 'Give vitamin A, zinc, iron, folic acid per WHO guidelines',
        rationale: 'Micronutrient deficiencies are universal in SAM and impair recovery',
        expectedOutcome: 'Micronutrient repletion started',
        urgency: 'urgent',
        phase: 'exposure',
        timeframe: 'Within 24 hours',
        monitoring: ['Micronutrient levels (if available)', 'Recovery progress'],
      },
      {
        id: 'sam-4-rehabilitation',
        sequence: 4,
        title: 'Rehabilitation Phase (After Stabilization)',
        description: 'Gradually increase calories to 150-200 kcal/kg/day. Provide therapeutic food.',
        rationale: 'Gradual increase in nutrition supports recovery without complications',
        expectedOutcome: 'Weight gain, improved nutritional status',
        urgency: 'urgent',
        phase: 'exposure',
        timeframe: 'Days 3-7 and beyond',
        dosing: {
          weight,
          calculation: '150-200 kcal/kg/day divided into frequent meals',
          dose: `${weight * 150}-${weight * 200} kcal/day`,
          route: 'Oral or NG tube',
        },
        monitoring: ['Weight gain', 'Edema resolution', 'Appetite', 'Stool output'],
      },
    ],
    monitoring: [
      'Weight (daily)',
      'MUAC (weekly)',
      'Edema (daily)',
      'Vital signs (stable)',
      'Electrolytes (K+, Mg2+, PO4)',
      'Appetite (improving)',
      'Stool output (normal)',
      'Infection signs',
    ],
  };
};

/**
 * MENINGITIS ENGINE
 * Recognition: Fever + neck stiffness/Kernig/Brudzinski + altered mental status
 * Management: Antibiotics, supportive care, complications management
 */
export const createMeningitisEngine = (weight: number): EmergencyEngine => {
  return {
    id: 'meningitis',
    name: 'Meningitis Engine',
    description: 'Recognition and management of meningitis in pediatric patients',
    triggerCriteria: (assessment: AssessmentFindings): boolean => {
      const fever = !!(assessment.fever || (assessment.temperature && assessment.temperature > 38.5));
      const menyngealSigns = assessment.rash === true; // Petechial rash
      const alteredMentalStatus = assessment.avpu !== 'alert';

      return !!(fever && (menyngealSigns || alteredMentalStatus));
    },
    severity: 'critical',
    actions: [
      {
        id: 'mening-1-recognize',
        sequence: 1,
        title: 'Recognize Meningitis',
        description: 'Confirm: fever + neck stiffness/Kernig/Brudzinski signs + altered mental status',
        rationale: 'Early recognition and treatment of meningitis improves survival and reduces sequelae',
        expectedOutcome: 'Meningitis suspected, antibiotics initiated',
        urgency: 'critical',
        phase: 'disability',
        timeframe: 'Immediate',
        monitoring: ['Temperature', 'Neck stiffness', 'Mental status', 'Rash'],
      },
      {
        id: 'mening-2-antibiotics',
        sequence: 2,
        title: 'Administer Empiric Antibiotics',
        description: 'Give ceftriaxone 50-80 mg/kg IV (max 2g) + vancomycin 15-20 mg/kg IV IMMEDIATELY',
        rationale: 'Antibiotics must be given within 1 hour. Do NOT wait for LP or imaging.',
        expectedOutcome: 'Bacterial load reduced, survival improved',
        urgency: 'critical',
        phase: 'circulation',
        timeframe: 'Within 1 hour of recognition',
        dosing: {
          weight,
          calculation: 'Ceftriaxone 50-80 mg/kg IV + Vancomycin 15-20 mg/kg IV',
          dose: `Ceftriaxone ${(weight * 50).toFixed(0)}-${(weight * 80).toFixed(0)} mg + Vancomycin ${(weight * 15).toFixed(0)}-${(weight * 20).toFixed(0)} mg`,
          route: 'IV',
        },
        monitoring: ['Temperature', 'Mental status', 'Vital signs'],
      },
      {
        id: 'mening-3-fluids',
        sequence: 3,
        title: 'Fluid Management',
        description: 'Give maintenance fluids only (NOT bolus). Monitor for SIADH (hyponatremia).',
        rationale: 'Meningitis causes cerebral edema. Fluid restriction prevents worsening.',
        expectedOutcome: 'Appropriate fluid balance, normal sodium',
        urgency: 'urgent',
        phase: 'circulation',
        timeframe: 'Ongoing',
        monitoring: ['Urine output', 'Sodium level', 'Fluid balance'],
      },
      {
        id: 'mening-4-dexamethasone',
        sequence: 4,
        title: 'Consider Dexamethasone',
        description: 'Give dexamethasone 0.15 mg/kg IV (max 10 mg) with first antibiotic dose',
        rationale: 'Dexamethasone reduces neurological sequelae in meningitis',
        expectedOutcome: 'Reduced inflammation, improved neurological outcomes',
        urgency: 'urgent',
        phase: 'disability',
        timeframe: 'With first antibiotic',
        dosing: {
          weight,
          calculation: 'Dexamethasone 0.15 mg/kg IV',
          dose: `${(weight * 0.15).toFixed(1)} mg IV`,
          route: 'IV',
        },
        monitoring: ['Mental status', 'Neurological signs'],
      },
      {
        id: 'mening-5-lp',
        sequence: 5,
        title: 'Lumbar Puncture (After Antibiotics)',
        description: 'Perform LP for CSF analysis. Do NOT delay antibiotics for LP.',
        rationale: 'CSF analysis confirms meningitis and guides antibiotic de-escalation',
        expectedOutcome: 'CSF results guide therapy',
        urgency: 'urgent',
        phase: 'disability',
        timeframe: 'After antibiotics started',
        prerequisites: ['Antibiotics given', 'No papilledema'],
        monitoring: ['CSF results', 'Organism identification'],
      },
    ],
    monitoring: [
      'Temperature (target normothermia)',
      'Mental status (should improve)',
      'Neck stiffness (should decrease)',
      'Rash (petechial/purpuric)',
      'Vital signs (stable)',
      'Sodium level (watch for hyponatremia)',
      'Urine output (decreased in SIADH)',
      'CSF results (organism, antibiotic susceptibility)',
    ],
  };
};

/**
 * Get all additional emergency engines
 */
export const getAllAdditionalEngines = (
  weight: number,
  age: { years: number; months: number }
): EmergencyEngine[] => {
  return [
    createHypovolemicShockEngine(weight, age),
    createCardiogenicShockEngine(weight),
    createSevereMalnutritionEngine(weight),
    createMeningitisEngine(weight),
  ];
};
