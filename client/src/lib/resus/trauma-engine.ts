/**
 * Pediatric Trauma Clinical Engine — ABCDE aligned with fellowship CST.
 */

import { SPO2_TARGET_MIN_PERCENT, SPO2_TARGET_RESUS_DETAIL } from '@shared/clinical-spo2-targets';

export interface TraumaAssessment {
  age: number; // years
  weightKg: number;
  mechanismOfInjury: string; // e.g., 'MVA', 'fall', 'penetrating', 'blunt'
  heightOfFall?: number; // meters
  vehicleSpeed?: number; // km/h
  
  // Primary Survey (A-B-C-D-E)
  airwayPatency: 'patent' | 'compromised' | 'obstructed';
  airwayThreats?: string[]; // e.g., 'foreign body', 'blood', 'secretions'
  
  respiratoryRate: number;
  oxygenSaturation: number; // %
  breathSounds: 'bilateral_equal' | 'unilateral_decreased' | 'absent' | 'asymmetric';
  chestWallIntegrity: 'intact' | 'flail_segment' | 'open_pneumothorax' | 'tension_pneumothorax';
  
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  capillaryRefillTime: number; // seconds
  skinPerfusion: 'warm_pink' | 'cool_pale' | 'cold_mottled' | 'cyanotic';
  pulseQuality: 'strong' | 'weak' | 'thready' | 'absent';
  
  consciousness: 'alert' | 'verbal' | 'pain' | 'unresponsive';
  pupilSize: 'normal' | 'dilated_unilateral' | 'dilated_bilateral' | 'pinpoint';
  pupilReactivity: 'reactive' | 'sluggish' | 'nonreactive';
  
  exposureFindings?: string[]; // e.g., 'abdominal distension', 'pelvic instability', 'limb deformity'
  
  // Secondary Survey
  headNeckFindings?: string[];
  chestFindings?: string[];
  abdominalFindings?: string[];
  pelvisFindings?: string[];
  extremityFindings?: string[];
  backFindings?: string[];
  
  // Mechanism Risk Factors
  highEnergyMechanism: boolean;
  penetratingInjury: boolean;
  suspectedSpinalInjury: boolean;
  estimatedBloodLoss?: number; // mL
}

export interface TraumaSeverity {
  level: 'minor' | 'moderate' | 'severe' | 'critical';
  classification: string;
  description: string;
  requiresICU: boolean;
  requiresOperatingRoom: boolean;
  requiresAirwayManagement: boolean;
  requiresAirwayIntervention?: boolean;
  requiresChestIntervention?: boolean;
  requiresFluidResuscitation: boolean;
  requiresBloodProducts: boolean;
  requiresSpinalPrecautions: boolean;
  traumaTeamActivation: boolean;
}

export interface TraumaIntervention {
  type: string;
  description: string;
  indication: string;
  dosing?: string;
  frequency?: string;
  monitoring?: string;
  priority: 'immediate' | 'urgent' | 'delayed' | 'minimal';
}

/**
 * Use a conservative age-aware systolic hypotension threshold for triage only.
 * Trauma decisions must still use perfusion, mental status, pulse quality, and haemorrhage findings.
 */
function getSystolicHypotensionThreshold(ageYears: number): number {
  return ageYears < 1 ? 70 : ageYears <= 10 ? 70 + (2 * ageYears) : 90;
}

/**
 * Assess trauma severity using ATLS principles
 */
export function assessTraumaSeverity(assessment: TraumaAssessment): TraumaSeverity {
  if (!Number.isFinite(assessment.age) || assessment.age < 0) {
    throw new Error('A valid non-negative age is required for trauma guidance.');
  }
  if (!Number.isFinite(assessment.weightKg) || assessment.weightKg <= 0) {
    throw new Error('A valid positive dosing weight is required for trauma guidance.');
  }

  let level: 'minor' | 'moderate' | 'severe' | 'critical';
  let requiresOperatingRoom = false;
  let requiresBloodProducts = false;
  let traumaTeamActivation = false;

  // Assess shock status
  const isInShock =
    assessment.capillaryRefillTime > 2 ||
    assessment.skinPerfusion !== 'warm_pink' ||
    assessment.systolicBP < getSystolicHypotensionThreshold(assessment.age) ||
    assessment.pulseQuality === 'weak' ||
    assessment.pulseQuality === 'thready';

  // Assess airway/breathing compromise
  const hasAirwayCompromise =
    assessment.airwayPatency !== 'patent' ||
    assessment.oxygenSaturation < 90 ||
    assessment.breathSounds !== 'bilateral_equal';

  // Assess neurological compromise
  const hasNeuroCompromise =
    assessment.consciousness !== 'alert' ||
    assessment.pupilSize === 'dilated_unilateral' ||
    assessment.pupilReactivity === 'nonreactive';

  // Assess hemorrhage
  const estimatedBloodLoss = assessment.estimatedBloodLoss || 0;
  const isInHemorrhagicShock = isInShock && estimatedBloodLoss > 0;

  // Classification
  if (
    hasAirwayCompromise ||
    hasNeuroCompromise ||
    assessment.consciousness === 'unresponsive' ||
    (isInHemorrhagicShock && assessment.systolicBP < 70)
  ) {
    level = 'critical';
    requiresOperatingRoom = assessment.penetratingInjury || estimatedBloodLoss > 500;
    requiresBloodProducts = isInHemorrhagicShock || estimatedBloodLoss > 500;
    traumaTeamActivation = true;
  } else if (
    isInShock ||
    assessment.chestWallIntegrity !== 'intact' ||
    assessment.exposureFindings?.some(f => f.includes('distension') || f.includes('instability'))
  ) {
    level = 'severe';
    requiresOperatingRoom = estimatedBloodLoss > 500;
    requiresBloodProducts = estimatedBloodLoss > 500;
    traumaTeamActivation = true;
  } else if (
    assessment.highEnergyMechanism ||
    assessment.penetratingInjury ||
    estimatedBloodLoss > 200
  ) {
    level = 'moderate';
    traumaTeamActivation = false;
  } else {
    level = 'minor';
  }

  const requiresAirwayIntervention =
    hasAirwayCompromise || assessment.consciousness === 'unresponsive';
  const requiresChestIntervention = assessment.chestWallIntegrity !== 'intact';

  return {
    level,
    classification: `${level.toUpperCase()} TRAUMA`,
    description: `${level.charAt(0).toUpperCase() + level.slice(1)} trauma - ${
      traumaTeamActivation ? 'Trauma team activation required' : 'Standard evaluation'
    }`,
    requiresICU: level === 'severe' || level === 'critical',
    requiresOperatingRoom,
    requiresAirwayManagement: requiresAirwayIntervention,
    requiresAirwayIntervention,
    requiresChestIntervention,
    requiresFluidResuscitation: isInShock,
    requiresBloodProducts,
    requiresSpinalPrecautions: assessment.suspectedSpinalInjury,
    traumaTeamActivation,
  };
}

/**
 * Generate primary survey interventions (A-B-C-D-E)
 */
export function generatePrimarySurveyInterventions(
  assessment: TraumaAssessment,
  severity: TraumaSeverity
): TraumaIntervention[] {
  const interventions: TraumaIntervention[] = [];

  // Airway Management (A)
  if (assessment.airwayPatency !== 'patent') {
    interventions.push({
      type: 'airway_management',
      description: 'Airway Management',
      indication: `Airway ${assessment.airwayPatency}`,
      dosing: `- Use jaw thrust when cervical-spine injury is suspected; otherwise use the age-appropriate airway manoeuvre
- Clear visible blood/secretions
- Insert an appropriate airway adjunct if trained and indicated
- Prepare for advanced airway management if protective reflexes or ventilation fail; do not infer this from a simplified score`,
      priority: 'immediate',
      monitoring: 'Airway patency, oxygen saturation',
    });
  }

  // Breathing Management (B)
  if (assessment.oxygenSaturation < 90 || assessment.breathSounds !== 'bilateral_equal') {
    interventions.push({
      type: 'breathing_management',
      description: 'Breathing Support',
      indication: `SpO2 ${assessment.oxygenSaturation}%, breath sounds ${assessment.breathSounds}`,
      dosing: `- Give the age- and device-appropriate oxygen or ventilation support and titrate to the selected target — ${SPO2_TARGET_RESUS_DETAIL}
- Use bag-valve-mask ventilation when indicated and ensure visible chest rise
- Treat suspected tension pneumothorax immediately according to local trauma capability
- Obtain expert chest intervention/transfer support when required; do not delay life-saving decompression`,
      priority: 'immediate',
      monitoring: 'Oxygen saturation, breath sounds, chest rise',
    });
  }

  // Circulation Management (C)
  if (assessment.systolicBP < getSystolicHypotensionThreshold(assessment.age) || assessment.capillaryRefillTime > 2) {
    const fluidBolus = assessment.weightKg * (assessment.age < 18 ? 10 : 20);

    interventions.push({
      type: 'fluid_resuscitation',
      description: 'Fluid Resuscitation (Hemorrhagic Shock)',
      indication: `Hypotension (SBP ${assessment.systolicBP}), CRT ${assessment.capillaryRefillTime}s`,
      dosing: `Initial controlled aliquot: approximately ${fluidBolus} mL warmed isotonic fluid (${assessment.age < 18 ? '10 mL/kg in paediatric haemorrhagic shock when blood is unavailable' : 'adult trauma protocol aliquot'}) with immediate reassessment.
Prioritise haemorrhage control and blood products when indicated; avoid repeated crystalloid boluses without reassessment.`,
      frequency: 'Repeat bolus if no improvement',
      priority: 'immediate',
      monitoring: 'Blood pressure, heart rate, perfusion, urine output',
    });

    if (severity.requiresBloodProducts) {
      interventions.push({
        type: 'blood_products',
        description: 'Blood Product Preparation',
        indication: 'Hemorrhagic shock with estimated significant blood loss',
        dosing: `- Type & cross for blood products
- Prepare for transfusion if no response to fluids
- Consider massive transfusion protocol if ongoing bleeding`,
        priority: 'urgent',
        monitoring: 'Hemoglobin, coagulation studies, vital signs',
      });
    }
  }

  // Disability Assessment (D)
  if (assessment.consciousness !== 'alert' || assessment.pupilSize === 'dilated_unilateral') {
    interventions.push({
      type: 'disability_assessment',
      description: 'Neurological Assessment',
      indication: `Altered consciousness ${assessment.consciousness}, pupils ${assessment.pupilSize}`,
      dosing: `- Complete and document a full age-appropriate GCS and neurological exam; do not infer GCS from consciousness alone
- Document baseline findings and serial changes
- Prepare for imaging when indicated after stabilisation
- Elevate head 30° only if safe and consistent with spinal/neurological management`,
      priority: 'urgent',
      monitoring: 'GCS, pupil size/reactivity, focal deficits',
    });
  }

  // Exposure & Environment (E)
  interventions.push({
    type: 'exposure_environment',
    description: 'Exposure & Environmental Control',
    indication: 'Complete trauma assessment',
    dosing: `- Remove all clothing for full examination
- Log-roll with c-spine precautions
- Examine back and buttocks
- Prevent hypothermia (warm blankets, warm fluids)`,
    priority: 'urgent',
    monitoring: 'Core temperature, hidden injuries',
  });

  return interventions;
}

/**
 * Generate secondary survey interventions
 */
export function generateSecondarySurveyInterventions(
  assessment: TraumaAssessment
): TraumaIntervention[] {
  const interventions: TraumaIntervention[] = [];

  interventions.push({
    type: 'secondary_survey_head_neck',
    description: 'Head & Neck Examination',
    indication: 'Complete secondary survey',
    dosing: `- Inspect for lacerations, contusions, deformity
- Palpate skull for fractures
- Check for Battle sign, raccoon eyes
- Assess jaw/teeth integrity
- Examine neck (maintain c-spine precautions)`,
    priority: 'urgent',
    monitoring: 'Neurological status, airway compromise signs',
  });

  interventions.push({
    type: 'secondary_survey_chest',
    description: 'Chest Examination',
    indication: 'Complete secondary survey',
    dosing: `- Inspect for penetrating wounds, flail segments
- Palpate for rib fractures, crepitus
- Auscultate breath sounds bilaterally
- Check for subcutaneous emphysema
- Assess for cardiac tamponade signs`,
    priority: 'urgent',
    monitoring: 'Breath sounds, vital signs, JVD',
  });

  interventions.push({
    type: 'secondary_survey_abdomen',
    description: 'Abdominal Examination',
    indication: 'Complete secondary survey',
    dosing: `- Inspect for distension, lacerations, bruising
- Auscultate for bowel sounds
- Palpate all quadrants for tenderness/rigidity
- Assess for peritoneal signs
- Check for Cullen/Grey Turner signs`,
    priority: 'urgent',
    monitoring: 'Abdominal distension, peritoneal signs',
  });

  interventions.push({
    type: 'secondary_survey_pelvis_extremities',
    description: 'Pelvis & Extremity Examination',
    indication: 'Complete secondary survey',
    dosing: `- Palpate pelvis for instability
- Assess all extremities for deformity/swelling
- Check distal pulses, motor/sensory function
- Assess for compartment syndrome signs
- Apply splints as needed`,
    priority: 'urgent',
    monitoring: 'Neurovascular status, compartment pressures',
  });

  return interventions;
}

/**
 * Generate spinal precaution interventions
 */
export function generateSpinalPrecautionInterventions(
  assessment: TraumaAssessment
): TraumaIntervention[] {
  const interventions: TraumaIntervention[] = [];

  if (assessment.suspectedSpinalInjury) {
    interventions.push({
      type: 'spinal_precautions',
      description: 'Spinal Immobilization',
      indication: 'Suspected spinal injury',
      dosing: `- Use age- and mechanism-appropriate spinal motion restriction per local trauma protocol
- Maintain neutral alignment and minimise unnecessary movement
- Use a collar or other device only when indicated and available
- Reassess airway, breathing, perfusion, skin pressure, and neurological status`,
      priority: 'immediate',
      monitoring: 'Spine alignment, neurological status',
    });

    interventions.push({
      type: 'spinal_imaging',
      description: 'Spinal Imaging',
      indication: 'Suspected spinal injury',
      dosing: `- C-spine X-ray (AP, lateral, odontoid views)
- Consider CT c-spine if high-risk mechanism
- Full spine imaging if neurological deficit`,
      priority: 'urgent',
      monitoring: 'Imaging results, neurological changes',
    });
  }

  return interventions;
}

/**
 * Generate trauma clinical summary
 */
export function generateTraumaSummary(
  assessment: TraumaAssessment,
  severity: TraumaSeverity
): string {
  const summary = `
PEDIATRIC TRAUMA CLINICAL ASSESSMENT

Patient: ${assessment.age} years old, ${assessment.weightKg}kg

Mechanism of Injury: ${assessment.mechanismOfInjury}
${assessment.heightOfFall ? `Height of Fall: ${assessment.heightOfFall}m` : ''}
${assessment.vehicleSpeed ? `Vehicle Speed: ${assessment.vehicleSpeed} km/h` : ''}

Severity: ${severity.classification}
${severity.description}

PRIMARY SURVEY (A-B-C-D-E):

Airway: ${assessment.airwayPatency}
${assessment.airwayThreats ? `Threats: ${assessment.airwayThreats.join(', ')}` : ''}

Breathing:
- RR: ${assessment.respiratoryRate} breaths/min
- SpO2: ${assessment.oxygenSaturation}%
- Breath Sounds: ${assessment.breathSounds}
- Chest Wall: ${assessment.chestWallIntegrity}

Circulation:
- HR: ${assessment.heartRate} bpm
- BP: ${assessment.systolicBP}/${assessment.diastolicBP} mmHg
- CRT: ${assessment.capillaryRefillTime}s
- Perfusion: ${assessment.skinPerfusion}
- Pulse Quality: ${assessment.pulseQuality}

Disability:
- Consciousness: ${assessment.consciousness}
- GCS: Not calculated here — complete a full age-appropriate GCS
- Pupils: ${assessment.pupilSize} (${assessment.pupilReactivity})

Exposure:
${assessment.exposureFindings ? `Findings: ${assessment.exposureFindings.join(', ')}` : 'No obvious injuries'}

RESOURCE REQUIREMENTS:
- ICU Admission: ${severity.requiresICU ? 'REQUIRED' : 'Not indicated'}
- Operating Room: ${severity.requiresOperatingRoom ? 'REQUIRED' : 'Not indicated'}
- Airway Management: ${severity.requiresAirwayManagement ? 'REQUIRED' : 'Not indicated'}
- Blood Products: ${severity.requiresBloodProducts ? 'REQUIRED' : 'Not indicated'}
- Spinal Precautions: ${severity.requiresSpinalPrecautions ? 'REQUIRED' : 'Not indicated'}
- Trauma Team Activation: ${severity.traumaTeamActivation ? 'ACTIVATE' : 'Not indicated'}

NEXT STEPS:
1. Complete primary survey and stabilization
2. Initiate secondary survey
3. Arrange imaging as indicated
4. Prepare for transfer to definitive care
5. Maintain spinal precautions if indicated
  `.trim();

  return summary;
}
