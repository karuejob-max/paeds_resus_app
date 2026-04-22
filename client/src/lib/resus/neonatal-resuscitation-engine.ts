/**
 * Neonatal Resuscitation Clinical Engine
 * 
 * Provides sequential assessment and evidence-based management for newborn resuscitation
 * Based on NRP (Neonatal Resuscitation Program) 8th Edition guidelines
 * Applies to infants 0-28 days old
 */

export interface NeonatalAssessment {
  ageMinutes: number; // 0-28 days converted to minutes
  birthWeight: number; // grams
  gestationalAge: number; // weeks
  
  // Initial Assessment (First 30 seconds)
  term: boolean; // ≥35 weeks
  toneAtBirth: 'good' | 'poor';
  breathingEffort: 'spontaneous' | 'gasping' | 'absent';
  heartRate: number; // bpm
  
  // Meconium Status
  meconiumPresent: boolean;
  meconiumStained: 'clear' | 'thin' | 'thick';
  
  // Resuscitation Interventions
  dryingAndStimulation: boolean;
  positioningDone: boolean;
  suction: 'not_needed' | 'mouth_nose' | 'intubation';
  
  // Oxygen Saturation Targets (by age)
  oxygenSaturation: number; // %
  
  // Ventilation Assessment
  chestRise: 'adequate' | 'inadequate' | 'none';
  breathSounds: 'bilateral_equal' | 'unilateral' | 'absent';
  
  // Heart Rate Response
  heartRateAfterVentilation: number; // bpm
  
  // Skin Color
  color: 'pink' | 'acrocyanosis' | 'cyanotic' | 'pale';
  
  // Meconium Aspiration Risk
  meconiumAspiration: boolean;
  
  // Complications
  complications?: string[]; // e.g., 'birth defect', 'prematurity', 'infection'
}

export interface NeonatalSeverity {
  level: 'vigorous' | 'depressed' | 'severely_depressed';
  classification: string;
  description: string;
  requiresVentilation: boolean;
  requiresChestCompressions: boolean;
  requiresIntubation: boolean;
  requiresEpinephrine: boolean;
  requiresVolume: boolean;
  requiresICU: boolean;
}

export interface NeonatalIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
  priority: 'immediate' | 'urgent' | 'delayed';
  timeWindow?: string; // e.g., 'First 30 seconds'
}

/**
 * Get oxygen saturation target by age
 */
function getSpO2Target(ageMinutes: number): { min: number; max: number } {
  if (ageMinutes < 1) return { min: 60, max: 65 };
  if (ageMinutes < 5) return { min: 70, max: 80 };
  if (ageMinutes < 10) return { min: 80, max: 90 };
  return { min: 85, max: 95 }; // >10 minutes
}

/**
 * Assess neonatal resuscitation need
 */
export function assessNeonatalSeverity(assessment: NeonatalAssessment): NeonatalSeverity {
  let level: 'vigorous' | 'depressed' | 'severely_depressed';
  let requiresVentilation = false;
  let requiresChestCompressions = false;
  let requiresEpinephrine = false;
  let requiresVolume = false;

  // Vigorous infant: term, good tone, spontaneous breathing
  if (assessment.term && assessment.toneAtBirth === 'good' && assessment.breathingEffort === 'spontaneous') {
    level = 'vigorous';
  }
  // Depressed: term or preterm, poor tone or gasping/absent breathing
  else if (
    assessment.breathingEffort === 'gasping' ||
    assessment.breathingEffort === 'absent' ||
    assessment.toneAtBirth === 'poor'
  ) {
    // Severely depressed if no heart rate or HR <60
    if (assessment.heartRate < 60 || assessment.heartRate === 0) {
      level = 'severely_depressed';
      requiresChestCompressions = true;
      requiresEpinephrine = assessment.heartRate === 0 || assessment.heartRate < 60;
      requiresVolume = true;
    } else {
      level = 'depressed';
      requiresVentilation = true;
    }
  } else {
    level = 'depressed';
    requiresVentilation = true;
  }

  // Reassess after ventilation
  if (assessment.heartRateAfterVentilation < 100 && requiresVentilation) {
    requiresChestCompressions = true;
  }

  return {
    level,
    classification: `${level.toUpperCase()} NEONATE`,
    description: `${level.charAt(0).toUpperCase() + level.slice(1)} neonate - ${
      level === 'vigorous'
        ? 'Routine care with mother'
        : level === 'depressed'
          ? 'Requires ventilation support'
          : 'Requires advanced resuscitation'
    }`,
    requiresVentilation,
    requiresChestCompressions,
    requiresIntubation: level === 'severely_depressed' || assessment.meconiumAspiration,
    requiresEpinephrine,
    requiresVolume,
    requiresICU: level === 'severely_depressed' || assessment.complications?.length || false,
  };
}

/**
 * Generate initial assessment interventions (First 30 seconds)
 */
export function generateInitialAssessmentInterventions(
  assessment: NeonatalAssessment
): NeonatalIntervention[] {
  const interventions: NeonatalIntervention[] = [];

  interventions.push({
    type: 'initial_assessment',
    description: 'Initial Assessment (First 30 seconds)',
    indication: 'All newborns',
    dosing: `Assess three questions:
1. Is the infant term? (≥35 weeks)
2. Is muscle tone good?
3. Is the infant breathing or crying?

If YES to all three → Routine care (skin-to-skin with mother)
If NO to any → Proceed to resuscitation`,
    timeWindow: 'First 30 seconds',
    priority: 'immediate',
    monitoring: 'Tone, breathing effort, heart rate',
  });

  if (assessment.meconiumPresent) {
    interventions.push({
      type: 'meconium_management',
      description: 'Meconium Management',
      indication: `Meconium-stained amniotic fluid (${assessment.meconiumStained})`,
      dosing: `Vigorous infant: Routine care (NO routine suctioning)
Depressed infant: Intubate and suction under direct visualization`,
      priority: 'immediate',
      monitoring: 'Airway patency, meconium aspiration signs',
    });
  }

  return interventions;
}

/**
 * Generate drying and stimulation interventions
 */
export function generateDryingAndStimulationInterventions(
  assessment: NeonatalAssessment
): NeonatalIntervention[] {
  const interventions: NeonatalIntervention[] = [];

  if (!assessment.dryingAndStimulation) {
    interventions.push({
      type: 'drying_stimulation',
      description: 'Drying and Stimulation',
      indication: 'Depressed neonate',
      dosing: `1. Dry the infant completely with warm towels
2. Remove wet towels
3. Place on warm surface (radiant warmer)
4. Position: Neutral head position (sniffing position)
5. Stimulation: Rub back, tap soles of feet
6. Reassess after 15 seconds`,
      timeWindow: 'First 15 seconds',
      priority: 'immediate',
      monitoring: 'Heart rate, breathing effort, tone',
    });
  }

  return interventions;
}

/**
 * Generate ventilation interventions
 */
export function generateVentilationInterventions(
  assessment: NeonatalAssessment,
  severity: NeonatalSeverity
): NeonatalIntervention[] {
  const interventions: NeonatalIntervention[] = [];

  if (severity.requiresVentilation) {
    // Positive Pressure Ventilation (PPV)
    interventions.push({
      type: 'positive_pressure_ventilation',
      description: 'Positive Pressure Ventilation (PPV)',
      indication: `Apnea or gasping, or HR <100 bpm after stimulation`,
      dosing: `Starting rate: 40-60 breaths/minute
- Use 21% oxygen initially (term)
- Use higher oxygen if preterm or no response
- Target SpO2: ${getSpO2Target(assessment.ageMinutes).min}-${getSpO2Target(assessment.ageMinutes).max}%
- Adequate ventilation: Chest rise visible

Ventilation devices:
- Self-inflating bag with mask
- Flow-inflating bag
- T-piece resuscitator`,
      frequency: 'Continuous until spontaneous breathing',
      timeWindow: 'Start within 1 minute of birth',
      priority: 'immediate',
      monitoring: 'Chest rise, heart rate, oxygen saturation, color',
    });

    // Oxygen Management
    if (assessment.oxygenSaturation < getSpO2Target(assessment.ageMinutes).min) {
      interventions.push({
        type: 'oxygen_management',
        description: 'Oxygen Titration',
        indication: `SpO2 ${assessment.oxygenSaturation}% below target`,
        dosing: `Term infant: Start 21% O2, increase if SpO2 <70% at 5 min
Preterm infant: Start 21-30% O2, titrate to target
Use pulse oximetry to guide oxygen delivery`,
        priority: 'urgent',
        monitoring: 'Oxygen saturation, chest rise, heart rate',
      });
    }

    // Intubation if needed
    if (severity.requiresIntubation) {
      const birthWeightKg = assessment.birthWeight / 1000;
      const tubeSizeETT = birthWeightKg < 1.5 ? '2.5' : birthWeightKg < 2.5 ? '3.0' : '3.5';
      const depthETT = birthWeightKg * 3 + 6;

      interventions.push({
        type: 'endotracheal_intubation',
        description: 'Endotracheal Intubation',
        indication: `Severe depression, meconium aspiration, need for prolonged ventilation`,
        dosing: `ETT Size: ${tubeSizeETT} mm (uncuffed)
Depth: ${depthETT} cm at teeth/gums
Confirm with chest rise and breath sounds
Secure with tape after confirmation`,
        priority: 'immediate',
        monitoring: 'Chest rise, breath sounds, heart rate, SpO2',
      });
    }
  }

  return interventions;
}

/**
 * Generate chest compression interventions
 */
export function generateChestCompressionInterventions(
  assessment: NeonatalAssessment,
  severity: NeonatalSeverity
): NeonatalIntervention[] {
  const interventions: NeonatalIntervention[] = [];

  if (severity.requiresChestCompressions) {
    const birthWeightKg = assessment.birthWeight / 1000;
    const compressionDepth = birthWeightKg < 1.5 ? 1.0 : 1.5; // cm

    interventions.push({
      type: 'chest_compressions',
      description: 'Chest Compressions',
      indication: `Heart rate <60 bpm despite 15 seconds of adequate ventilation with 100% oxygen`,
      dosing: `Compression rate: 120 compressions/minute (3:1 compression-to-ventilation ratio)
Depth: ${compressionDepth} cm (1/3 of chest diameter)
Technique: Two-thumb encircling hands method
Hand position: Just below nipple line
Reassess heart rate every 60 seconds`,
      frequency: 'Continuous with 3:1 compression-to-ventilation ratio',
      timeWindow: 'After 15 seconds of adequate ventilation',
      priority: 'immediate',
      monitoring: 'Heart rate, perfusion, chest rise',
    });
  }

  return interventions;
}

/**
 * Generate medication interventions
 */
export function generateMedicationInterventions(
  assessment: NeonatalAssessment,
  severity: NeonatalSeverity
): NeonatalIntervention[] {
  const interventions: NeonatalIntervention[] = [];
  const birthWeightKg = assessment.birthWeight / 1000;

  // Epinephrine
  if (severity.requiresEpinephrine) {
    const epiDoseIV = birthWeightKg * 0.01; // 0.01-0.03 mg/kg
    const epiDoseET = birthWeightKg * 0.05; // 0.05-0.1 mg/kg (if IV not available)

    interventions.push({
      type: 'epinephrine',
      description: 'Epinephrine',
      indication: `Heart rate remains <60 bpm after 10 minutes of resuscitation`,
      dosing: `IV Route (preferred): ${epiDoseIV.toFixed(3)} mg (1:10,000 concentration)
Endotracheal Route: ${epiDoseET.toFixed(3)} mg (1:1,000 concentration)
Repeat every 3-5 minutes if HR remains <60`,
      frequency: 'Every 3-5 minutes',
      priority: 'urgent',
      monitoring: 'Heart rate, perfusion, blood pressure',
    });
  }

  // Volume Expansion
  if (severity.requiresVolume) {
    const volumeDose = birthWeightKg * 10; // 10 mL/kg

    interventions.push({
      type: 'volume_expansion',
      description: 'Volume Expansion',
      indication: `Hypovolemia (pale, poor perfusion) despite resuscitation`,
      dosing: `Normal saline or O-negative blood: ${volumeDose.toFixed(1)} mL IV
Infuse over 5-10 minutes
Reassess perfusion after infusion`,
      frequency: 'Single dose, repeat if needed',
      priority: 'urgent',
      monitoring: 'Perfusion, heart rate, blood pressure',
    });
  }

  // Sodium Bicarbonate (only after prolonged resuscitation)
  if (assessment.ageMinutes > 10) {
    interventions.push({
      type: 'sodium_bicarbonate',
      description: 'Sodium Bicarbonate (if prolonged resuscitation)',
      indication: `Prolonged resuscitation (>10 minutes) with metabolic acidosis`,
      dosing: `0.5-1 mEq/kg IV (4.2% solution)
Consider only after 10 minutes of resuscitation`,
      priority: 'delayed',
      monitoring: 'pH, base deficit, heart rate',
    });
  }

  return interventions;
}

/**
 * Generate post-resuscitation care interventions
 */
export function generatePostResuscitationCareInterventions(
  assessment: NeonatalAssessment,
  severity: NeonatalSeverity
): NeonatalIntervention[] {
  const interventions: NeonatalIntervention[] = [];

  if (severity.requiresICU) {
    interventions.push({
      type: 'post_resuscitation_care',
      description: 'Post-Resuscitation Care',
      indication: `Neonate required resuscitation`,
      dosing: `1. Maintain normothermia (36.5-37.5°C)
2. Continue monitoring: HR, SpO2, BP, temperature
3. Obtain blood gas, glucose, lactate
4. Chest X-ray if intubated
5. Consider therapeutic hypothermia if moderate-severe HIE
6. Prepare for NICU transfer`,
      priority: 'urgent',
      monitoring: 'Vital signs, oxygen saturation, perfusion, neurological status',
    });
  }

  return interventions;
}

/**
 * Generate neonatal resuscitation summary
 */
export function generateNeonatalResuscitationSummary(
  assessment: NeonatalAssessment,
  severity: NeonatalSeverity
): string {
  const spO2Target = getSpO2Target(assessment.ageMinutes);
  const birthWeightKg = assessment.birthWeight / 1000;

  const summary = `
NEONATAL RESUSCITATION CLINICAL ASSESSMENT

Patient: Birth weight ${assessment.birthWeight}g, Gestational age ${assessment.gestationalAge} weeks
Age: ${assessment.ageMinutes} minutes

INITIAL ASSESSMENT:
- Term (≥35 weeks): ${assessment.term ? 'YES' : 'NO'}
- Tone at birth: ${assessment.toneAtBirth}
- Breathing effort: ${assessment.breathingEffort}
- Heart rate: ${assessment.heartRate} bpm

SEVERITY: ${severity.classification}
${severity.description}

RESUSCITATION STATUS:
- Requires Ventilation: ${severity.requiresVentilation ? 'YES' : 'NO'}
- Requires Chest Compressions: ${severity.requiresChestCompressions ? 'YES' : 'NO'}
- Requires Intubation: ${severity.requiresIntubation ? 'YES' : 'NO'}
- Requires Epinephrine: ${severity.requiresEpinephrine ? 'YES' : 'NO'}
- Requires Volume: ${severity.requiresVolume ? 'YES' : 'NO'}
- Requires ICU: ${severity.requiresICU ? 'YES' : 'NO'}

OXYGEN SATURATION TARGET:
${spO2Target.min}-${spO2Target.max}% (Age: ${assessment.ageMinutes} minutes)
Current SpO2: ${assessment.oxygenSaturation}%

MECONIUM STATUS:
- Present: ${assessment.meconiumPresent ? 'YES' : 'NO'}
${assessment.meconiumPresent ? `- Staining: ${assessment.meconiumStained}` : ''}
- Aspiration Risk: ${assessment.meconiumAspiration ? 'HIGH' : 'LOW'}

VITAL SIGNS:
- Heart rate: ${assessment.heartRate} bpm (after intervention: ${assessment.heartRateAfterVentilation} bpm)
- Skin color: ${assessment.color}
- Chest rise: ${assessment.chestRise}
- Breath sounds: ${assessment.breathSounds}

NEXT STEPS:
${severity.level === 'vigorous' ? `1. Routine care with mother (skin-to-skin)
2. Delayed cord clamping (30-60 seconds)
3. Routine newborn screening` : severity.level === 'depressed' ? `1. Continue positive pressure ventilation
2. Reassess heart rate every 15 seconds
3. Prepare for intubation if no improvement
4. Prepare for NICU transfer` : `1. Continue chest compressions and ventilation
2. Establish IV access
3. Prepare epinephrine if HR remains <60
4. Prepare for NICU transfer with intensive support`}

COMPLICATIONS:
${assessment.complications?.length ? assessment.complications.join(', ') : 'None documented'}
  `.trim();

  return summary;
}
