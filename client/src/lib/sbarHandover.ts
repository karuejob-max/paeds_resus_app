/**
 * SBAR Handover Summary Generator
 * Creates structured clinical handover (Situation, Background, Assessment, Recommendation)
 * for escalation to higher level of care
 */

export interface SBARHandover {
  // Metadata
  generatedAt: number;
  clinicianName: string;
  clinicianRole: string;
  receivingClinician?: string;
  receivingFacility?: string;

  // SBAR Components
  situation: SituationComponent;
  background: BackgroundComponent;
  assessment: AssessmentComponent;
  recommendation: RecommendationComponent;

  // Critical flags
  criticalityLevel: 'routine' | 'urgent' | 'emergent' | 'critical';
  requiresImmediateTransfer: boolean;
  estimatedTransferTime?: number;
}

export interface SituationComponent {
  patientIdentification: {
    name: string;
    age: number;
    weight: number;
    gender: string;
  };
  chiefComplaint: string;
  timelineOfPresentation: string;
  currentStatus: {
    consciousness: string;
    breathing: string;
    circulation: string;
    temperature: number;
  };
  immediateThreats: string[];
}

export interface BackgroundComponent {
  relevantHistory: string[];
  allergies: string[];
  medications: string[];
  previousMedicalConditions: string[];
  socialContext: string;
  parentalConcerns: string;
}

export interface AssessmentComponent {
  primaryDiagnosis: string;
  differentialDiagnoses: string[];
  activeEngines: string[];
  criticalFindings: {
    finding: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionTaken: string;
  }[];
  currentVitalSigns: {
    hr: number;
    rr: number;
    bp: string;
    temp: number;
    spo2: number;
    glucose?: number;
    lactate?: number;
  };
  interventionsCompleted: string[];
  interventionsPending: string[];
  responseToIntervention: 'improved' | 'stable' | 'deteriorated' | 'unknown';
}

export interface RecommendationComponent {
  immediateActions: string[];
  continuingManagement: string[];
  monitoringParameters: string[];
  escalationCriteria: string[];
  transportRequirements: string;
  staffingRequirements: string;
  equipmentNeeded: string[];
  estimatedTimeToStability: string;
}

/**
 * Generate SBAR handover from clinical assessment data
 */
export function generateSBARHandover(assessmentData: any): SBARHandover {
  const now = Date.now();

  // Extract critical findings
  const criticalFindings = extractCriticalFindings(assessmentData);
  const activeEngines = assessmentData.activeEngines || [];
  const criticalityLevel = determineCriticality(criticalFindings, activeEngines);

  const handover: SBARHandover = {
    generatedAt: now,
    clinicianName: assessmentData.clinicianName || 'Unknown',
    clinicianRole: assessmentData.clinicianRole || 'Clinician',
    receivingClinician: assessmentData.receivingClinician,
    receivingFacility: assessmentData.receivingFacility,

    situation: {
      patientIdentification: {
        name: assessmentData.patientName || 'Patient',
        age: assessmentData.age || 0,
        weight: assessmentData.weight || 0,
        gender: assessmentData.gender || 'Unknown',
      },
      chiefComplaint: assessmentData.chiefComplaint || 'Emergency presentation',
      timelineOfPresentation: generateTimeline(assessmentData),
      currentStatus: {
        consciousness: assessmentData.consciousness || 'Alert',
        breathing: assessmentData.breathing || 'Spontaneous',
        circulation: assessmentData.circulation || 'Present',
        temperature: assessmentData.temperature || 37,
      },
      immediateThreats: identifyImmediateThreats(assessmentData),
    },

    background: {
      relevantHistory: extractRelevantHistory(assessmentData),
      allergies: assessmentData.allergies || [],
      medications: assessmentData.currentMedications || [],
      previousMedicalConditions: assessmentData.pastMedicalHistory || [],
      socialContext: assessmentData.socialContext || 'Not specified',
      parentalConcerns: assessmentData.parentalConcerns || 'None documented',
    },

    assessment: {
      primaryDiagnosis: assessmentData.primaryDiagnosis || 'Under evaluation',
      differentialDiagnoses: assessmentData.differentialDiagnoses || [],
      activeEngines: activeEngines,
      criticalFindings: criticalFindings,
      currentVitalSigns: {
        hr: assessmentData.heartRate || 0,
        rr: assessmentData.respiratoryRate || 0,
        bp: assessmentData.bloodPressure || 'Not recorded',
        temp: assessmentData.temperature || 37,
        spo2: assessmentData.oxygenSaturation || 0,
        glucose: assessmentData.glucose,
        lactate: assessmentData.lactate,
      },
      interventionsCompleted: assessmentData.interventionsCompleted || [],
      interventionsPending: assessmentData.interventionsPending || [],
      responseToIntervention: assessmentData.responseToIntervention || 'unknown',
    },

    recommendation: {
      immediateActions: generateImmediateActions(assessmentData, criticalFindings),
      continuingManagement: generateContinuingManagement(assessmentData),
      monitoringParameters: generateMonitoringParameters(assessmentData),
      escalationCriteria: generateEscalationCriteria(assessmentData),
      transportRequirements: generateTransportRequirements(assessmentData),
      staffingRequirements: generateStaffingRequirements(activeEngines),
      equipmentNeeded: generateEquipmentList(assessmentData),
      estimatedTimeToStability: estimateTimeToStability(assessmentData),
    },

    criticalityLevel: criticalityLevel,
    requiresImmediateTransfer: criticalityLevel === 'critical' || criticalityLevel === 'emergent',
    estimatedTransferTime: assessmentData.estimatedTransferTime,
  };

  return handover;
}

/**
 * Extract critical findings from assessment
 */
function extractCriticalFindings(
  assessmentData: any
): SBARHandover['assessment']['criticalFindings'] {
  const findings: SBARHandover['assessment']['criticalFindings'] = [];

  // Airway findings
  if (assessmentData.airwayPatency === 'compromised') {
    findings.push({
      finding: 'Airway compromise detected',
      severity: 'critical',
      actionTaken: assessmentData.airwayIntervention || 'Pending',
    });
  }

  // Breathing findings
  if (assessmentData.respiratoryRate < 12 || assessmentData.respiratoryRate > 40) {
    findings.push({
      finding: `Abnormal respiratory rate: ${assessmentData.respiratoryRate}/min`,
      severity: 'high',
      actionTaken: assessmentData.breathingIntervention || 'Pending',
    });
  }

  if (assessmentData.oxygenSaturation < 90) {
    findings.push({
      finding: `Hypoxemia: SpO2 ${assessmentData.oxygenSaturation}%`,
      severity: 'critical',
      actionTaken: assessmentData.oxygenIntervention || 'Pending',
    });
  }

  // Circulation findings
  if (assessmentData.perfusionStatus === 'poor') {
    findings.push({
      finding: 'Poor perfusion detected',
      severity: 'critical',
      actionTaken: assessmentData.circulationIntervention || 'Pending',
    });
  }

  if (assessmentData.shockStatus) {
    findings.push({
      finding: `${assessmentData.shockStatus} shock`,
      severity: 'critical',
      actionTaken: assessmentData.shockIntervention || 'Pending',
    });
  }

  // Disability findings
  if (assessmentData.consciousness === 'unconscious' || assessmentData.consciousness === 'altered') {
    findings.push({
      finding: `Altered consciousness: ${assessmentData.consciousness}`,
      severity: 'high',
      actionTaken: assessmentData.disabilityIntervention || 'Pending',
    });
  }

  if (assessmentData.glucose && assessmentData.glucose < 40) {
    findings.push({
      finding: `Severe hypoglycemia: ${assessmentData.glucose} mg/dL`,
      severity: 'critical',
      actionTaken: assessmentData.glucoseIntervention || 'Pending',
    });
  }

  // Active seizures
  if (assessmentData.seizureActivity === 'active') {
    findings.push({
      finding: 'Active seizure activity',
      severity: 'critical',
      actionTaken: assessmentData.seizureIntervention || 'Pending',
    });
  }

  return findings;
}

/**
 * Determine criticality level
 */
function determineCriticality(
  criticalFindings: SBARHandover['assessment']['criticalFindings'],
  activeEngines: string[]
): 'routine' | 'urgent' | 'emergent' | 'critical' {
  const criticalCount = criticalFindings.filter((f) => f.severity === 'critical').length;
  const highCount = criticalFindings.filter((f) => f.severity === 'high').length;

  // Critical engines
  const criticalEngines = [
    'septic-shock',
    'respiratory-failure',
    'anaphylaxis',
    'status-epilepticus',
  ];
  const hasCriticalEngine = activeEngines.some((e) => criticalEngines.includes(e));

  if (criticalCount >= 2 || hasCriticalEngine) {
    return 'critical';
  }

  if (criticalCount === 1 || highCount >= 2) {
    return 'emergent';
  }

  if (highCount === 1) {
    return 'urgent';
  }

  return 'routine';
}

/**
 * Generate timeline of presentation
 */
function generateTimeline(assessmentData: any): string {
  const onsetTime = assessmentData.onsetTime || 'Unknown';
  const duration = assessmentData.symptomDuration || 'Unknown';
  const progression = assessmentData.progression || 'Progressive';

  return `Onset: ${onsetTime}, Duration: ${duration}, Progression: ${progression}`;
}

/**
 * Identify immediate threats
 */
function identifyImmediateThreats(assessmentData: any): string[] {
  const threats: string[] = [];

  if (assessmentData.airwayPatency === 'compromised') threats.push('Airway compromise');
  if (assessmentData.oxygenSaturation < 90) threats.push('Hypoxemia');
  if (assessmentData.perfusionStatus === 'poor') threats.push('Poor perfusion');
  if (assessmentData.consciousness === 'unconscious') threats.push('Altered consciousness');
  if (assessmentData.seizureActivity === 'active') threats.push('Active seizures');
  if (assessmentData.temperature > 40 || assessmentData.temperature < 35) threats.push('Abnormal temperature');

  return threats.length > 0 ? threats : ['None identified'];
}

/**
 * Extract relevant history
 */
function extractRelevantHistory(assessmentData: any): string[] {
  const history: string[] = [];

  if (assessmentData.recentIllness) history.push(`Recent illness: ${assessmentData.recentIllness}`);
  if (assessmentData.recentTrauma) history.push(`Recent trauma: ${assessmentData.recentTrauma}`);
  if (assessmentData.recentMedication) history.push(`Recent medication: ${assessmentData.recentMedication}`);
  if (assessmentData.immunizationStatus) history.push(`Immunization status: ${assessmentData.immunizationStatus}`);

  return history.length > 0 ? history : ['No significant recent history'];
}

/**
 * Generate immediate actions
 */
function generateImmediateActions(
  assessmentData: any,
  criticalFindings: SBARHandover['assessment']['criticalFindings']
): string[] {
  const actions: string[] = [];

  criticalFindings.forEach((finding) => {
    if (finding.severity === 'critical') {
      actions.push(`${finding.finding}: ${finding.actionTaken}`);
    }
  });

  // Add engine-specific actions
  const activeEngines = assessmentData.activeEngines || [];
  if (activeEngines.includes('septic-shock')) {
    actions.push('Initiate septic shock protocol: fluid resuscitation, antibiotics, vasopressors');
  }
  if (activeEngines.includes('respiratory-failure')) {
    actions.push('Prepare for airway management: oxygen, BVM, intubation equipment');
  }
  if (activeEngines.includes('anaphylaxis')) {
    actions.push('Administer IM epinephrine, oxygen, IV access, antihistamines');
  }

  return actions.length > 0 ? actions : ['Continue current management'];
}

/**
 * Generate continuing management
 */
function generateContinuingManagement(assessmentData: any): string[] {
  const management: string[] = [];

  if (assessmentData.fluidManagement) management.push(`Fluid management: ${assessmentData.fluidManagement}`);
  if (assessmentData.medicationManagement) management.push(`Medications: ${assessmentData.medicationManagement}`);
  if (assessmentData.oxygenManagement) management.push(`Oxygen management: ${assessmentData.oxygenManagement}`);
  if (assessmentData.temperatureManagement) management.push(`Temperature management: ${assessmentData.temperatureManagement}`);

  return management.length > 0 ? management : ['Continue supportive care'];
}

/**
 * Generate monitoring parameters
 */
function generateMonitoringParameters(assessmentData: any): string[] {
  return [
    'Continuous pulse oximetry',
    'Continuous cardiac monitoring',
    'Frequent vital signs (every 15 minutes)',
    'Hourly urine output',
    'Neurological checks (every 30 minutes)',
    'Reassess perfusion status',
    'Monitor for deterioration',
  ];
}

/**
 * Generate escalation criteria
 */
function generateEscalationCriteria(assessmentData: any): string[] {
  return [
    'SpO2 <90% despite oxygen',
    'Respiratory rate <10 or >40',
    'Systolic BP <5th percentile for age',
    'Heart rate <5th or >95th percentile for age',
    'Altered consciousness or seizures',
    'Signs of shock progression',
    'Failure to respond to interventions',
    'New critical findings',
  ];
}

/**
 * Generate transport requirements
 */
function generateTransportRequirements(assessmentData: any): string {
  const criticality = assessmentData.criticality || 'routine';

  if (criticality === 'critical') {
    return 'Immediate transfer by ambulance with advanced life support, physician accompaniment recommended';
  }

  if (criticality === 'emergent') {
    return 'Urgent transfer by ambulance with paramedic accompaniment';
  }

  return 'Standard transport by ambulance';
}

/**
 * Generate staffing requirements
 */
function generateStaffingRequirements(activeEngines: string[]): string {
  const criticalEngines = [
    'septic-shock',
    'respiratory-failure',
    'anaphylaxis',
    'status-epilepticus',
  ];
  const hasCritical = activeEngines.some((e) => criticalEngines.includes(e));

  if (hasCritical) {
    return 'Senior physician, ICU nurse, respiratory therapist';
  }

  return 'Physician, experienced nurse';
}

/**
 * Generate equipment list
 */
function generateEquipmentList(assessmentData: any): string[] {
  const equipment: string[] = ['Continuous pulse oximeter', 'Cardiac monitor', 'Blood pressure monitor'];

  if (assessmentData.requiresOxygen) equipment.push('Oxygen delivery system');
  if (assessmentData.requiresIVAccess) equipment.push('IV access supplies');
  if (assessmentData.requiresIntubation) equipment.push('Intubation equipment', 'Ventilator');
  if (assessmentData.requiresMonitoring) equipment.push('Arterial line supplies', 'Central line supplies');

  return equipment;
}

/**
 * Estimate time to stability
 */
function estimateTimeToStability(assessmentData: any): string {
  const activeEngines = assessmentData.activeEngines || [];

  if (activeEngines.includes('septic-shock')) {
    return '2-4 hours (fluid resuscitation and antibiotic response)';
  }

  if (activeEngines.includes('respiratory-failure')) {
    return '1-2 hours (post-intubation stabilization)';
  }

  if (activeEngines.includes('anaphylaxis')) {
    return '30-60 minutes (post-epinephrine response)';
  }

  if (activeEngines.includes('status-epilepticus')) {
    return '30-60 minutes (post-seizure management)';
  }

  return 'Variable based on response to intervention';
}

/**
 * Format SBAR for text output
 */
export function formatSBARAsText(handover: SBARHandover): string {
  let text = '';

  text += `CLINICAL HANDOVER REPORT\n`;
  text += `Generated: ${new Date(handover.generatedAt).toISOString()}\n`;
  text += `Criticality: ${handover.criticalityLevel.toUpperCase()}\n`;
  text += `Requires Immediate Transfer: ${handover.requiresImmediateTransfer ? 'YES' : 'NO'}\n\n`;

  text += `FROM: ${handover.clinicianName} (${handover.clinicianRole})\n`;
  if (handover.receivingClinician) text += `TO: ${handover.receivingClinician}\n`;
  if (handover.receivingFacility) text += `FACILITY: ${handover.receivingFacility}\n\n`;

  text += `SITUATION\n`;
  text += `=========\n`;
  text += `Patient: ${handover.situation.patientIdentification.name}, `;
  text += `Age: ${handover.situation.patientIdentification.age} years, `;
  text += `Weight: ${handover.situation.patientIdentification.weight} kg\n`;
  text += `Chief Complaint: ${handover.situation.chiefComplaint}\n`;
  text += `Timeline: ${handover.situation.timelineOfPresentation}\n`;
  text += `Current Status: Consciousness=${handover.situation.currentStatus.consciousness}, `;
  text += `Breathing=${handover.situation.currentStatus.breathing}, `;
  text += `Circulation=${handover.situation.currentStatus.circulation}\n`;
  text += `Immediate Threats: ${handover.situation.immediateThreats.join(', ')}\n\n`;

  text += `BACKGROUND\n`;
  text += `===========\n`;
  text += `Allergies: ${handover.background.allergies.join(', ') || 'NKDA'}\n`;
  text += `Current Medications: ${handover.background.medications.join(', ') || 'None'}\n`;
  text += `Past Medical History: ${handover.background.previousMedicalConditions.join(', ') || 'None'}\n`;
  text += `Social Context: ${handover.background.socialContext}\n\n`;

  text += `ASSESSMENT\n`;
  text += `===========\n`;
  text += `Primary Diagnosis: ${handover.assessment.primaryDiagnosis}\n`;
  text += `Active Engines: ${handover.assessment.activeEngines.join(', ') || 'None'}\n`;
  text += `Vital Signs: HR=${handover.assessment.currentVitalSigns.hr}, `;
  text += `RR=${handover.assessment.currentVitalSigns.rr}, `;
  text += `BP=${handover.assessment.currentVitalSigns.bp}, `;
  text += `Temp=${handover.assessment.currentVitalSigns.temp}°C, `;
  text += `SpO2=${handover.assessment.currentVitalSigns.spo2}%\n`;
  text += `Response to Intervention: ${handover.assessment.responseToIntervention}\n\n`;

  text += `Critical Findings:\n`;
  handover.assessment.criticalFindings.forEach((finding) => {
    text += `- [${finding.severity.toUpperCase()}] ${finding.finding}: ${finding.actionTaken}\n`;
  });

  text += `\nRECOMMENDATION\n`;
  text += `===============\n`;
  text += `Immediate Actions:\n`;
  handover.recommendation.immediateActions.forEach((action) => {
    text += `- ${action}\n`;
  });

  text += `\nContinuing Management:\n`;
  handover.recommendation.continuingManagement.forEach((mgmt) => {
    text += `- ${mgmt}\n`;
  });

  text += `\nMonitoring Parameters:\n`;
  handover.recommendation.monitoringParameters.forEach((param) => {
    text += `- ${param}\n`;
  });

  text += `\nEscalation Criteria:\n`;
  handover.recommendation.escalationCriteria.forEach((criteria) => {
    text += `- ${criteria}\n`;
  });

  text += `\nTransport: ${handover.recommendation.transportRequirements}\n`;
  text += `Staffing: ${handover.recommendation.staffingRequirements}\n`;
  text += `Equipment: ${handover.recommendation.equipmentNeeded.join(', ')}\n`;
  text += `Estimated Time to Stability: ${handover.recommendation.estimatedTimeToStability}\n`;

  return text;
}
