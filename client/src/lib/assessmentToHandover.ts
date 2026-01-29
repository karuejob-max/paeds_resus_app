/**
 * Convert ClinicalAssessment data to handover-compatible format
 */

export interface AssessmentState {
  // Patient data
  patientName?: string;
  age?: number;
  ageMonths?: number;
  weight?: number;
  gender?: string;

  // Chief complaint
  chiefComplaint?: string;

  // Vital signs
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenSaturation?: number;
  glucose?: number;
  lactate?: number;

  // Assessment findings
  consciousness?: string;
  breathing?: string;
  circulation?: string;
  airwayPatency?: string;
  perfusionStatus?: string;
  shockStatus?: string;
  seizureActivity?: string;

  // Interventions
  interventionsCompleted?: string[];
  interventionsPending?: string[];

  // Active engines
  activeEngines?: string[];
  primaryDiagnosis?: string;
  differentialDiagnoses?: string[];

  // Response to intervention
  responseToIntervention?: 'improved' | 'stable' | 'deteriorated' | 'unknown';

  // History
  allergies?: string[];
  currentMedications?: string[];
  pastMedicalHistory?: string[];
  socialContext?: string;
  parentalConcerns?: string;

  // Timeline
  onsetTime?: string;
  symptomDuration?: string;
  progression?: string;

  // Management plans
  fluidManagement?: string;
  medicationManagement?: string;
  oxygenManagement?: string;
  temperatureManagement?: string;

  // Equipment needs
  requiresOxygen?: boolean;
  requiresIVAccess?: boolean;
  requiresIntubation?: boolean;
  requiresMonitoring?: boolean;

  // Clinician info
  clinicianName?: string;
  clinicianRole?: string;
  receivingClinician?: string;
  receivingFacility?: string;

  // Audit trail
  auditTrail?: AuditEntry[];
}

export interface AuditEntry {
  timestamp: number;
  action: string;
  phase: string;
  details?: string;
  status?: 'completed' | 'pending' | 'skipped';
}

/**
 * Extract handover data from ClinicalAssessment state
 */
export function extractHandoverData(assessmentState: AssessmentState, auditTrail: AuditEntry[] = []): any {
  // Calculate derived parameters
  const estimatedWeight = estimateWeight(assessmentState.age || 0, assessmentState.ageMonths || 0);
  const weight = assessmentState.weight || estimatedWeight;

  // Extract interventions from audit trail
  const completedInterventions = extractCompletedInterventions(auditTrail);
  const pendingInterventions = extractPendingInterventions(auditTrail);

  // Determine critical findings
  const criticalFindings = identifyCriticalFindings(assessmentState);

  // Determine active engines
  const activeEngines = determineActiveEngines(assessmentState, criticalFindings);

  // Build handover data object
  const handoverData = {
    // Patient identification
    patientName: assessmentState.patientName || 'Patient',
    age: assessmentState.age || 0,
    weight: weight,
    gender: assessmentState.gender || 'Unknown',

    // Chief complaint
    chiefComplaint: assessmentState.chiefComplaint || 'Emergency presentation',

    // Timeline
    onsetTime: assessmentState.onsetTime || 'Unknown',
    symptomDuration: assessmentState.symptomDuration || 'Unknown',
    progression: assessmentState.progression || 'Progressive',

    // Vital signs
    heartRate: assessmentState.heartRate || 0,
    respiratoryRate: assessmentState.respiratoryRate || 0,
    bloodPressure: assessmentState.bloodPressure || 'Not recorded',
    temperature: assessmentState.temperature || 37,
    oxygenSaturation: assessmentState.oxygenSaturation || 0,
    glucose: assessmentState.glucose,
    lactate: assessmentState.lactate,

    // Assessment findings
    consciousness: assessmentState.consciousness || 'Alert',
    breathing: assessmentState.breathing || 'Spontaneous',
    circulation: assessmentState.circulation || 'Present',
    airwayPatency: assessmentState.airwayPatency || 'patent',
    perfusionStatus: assessmentState.perfusionStatus || 'normal',
    shockStatus: assessmentState.shockStatus,
    seizureActivity: assessmentState.seizureActivity,

    // Interventions
    interventionsCompleted: completedInterventions,
    interventionsPending: pendingInterventions,

    // Active engines
    activeEngines: activeEngines,
    primaryDiagnosis: assessmentState.primaryDiagnosis || 'Under evaluation',
    differentialDiagnoses: assessmentState.differentialDiagnoses || [],

    // Response to intervention
    responseToIntervention: assessmentState.responseToIntervention || 'unknown',

    // History
    allergies: assessmentState.allergies || [],
    currentMedications: assessmentState.currentMedications || [],
    pastMedicalHistory: assessmentState.pastMedicalHistory || [],
    socialContext: assessmentState.socialContext || 'Not specified',
    parentalConcerns: assessmentState.parentalConcerns || 'None documented',

    // Management plans
    fluidManagement: assessmentState.fluidManagement,
    medicationManagement: assessmentState.medicationManagement,
    oxygenManagement: assessmentState.oxygenManagement,
    temperatureManagement: assessmentState.temperatureManagement,

    // Equipment needs
    requiresOxygen: assessmentState.requiresOxygen || false,
    requiresIVAccess: assessmentState.requiresIVAccess || false,
    requiresIntubation: assessmentState.requiresIntubation || false,
    requiresMonitoring: assessmentState.requiresMonitoring || false,

    // Clinician info
    clinicianName: assessmentState.clinicianName || 'Unknown',
    clinicianRole: assessmentState.clinicianRole || 'Clinician',
    receivingClinician: assessmentState.receivingClinician,
    receivingFacility: assessmentState.receivingFacility,

    // Critical findings
    criticalFindings: criticalFindings,
  };

  return handoverData;
}

/**
 * Estimate weight from age
 */
function estimateWeight(ageYears: number, ageMonths: number = 0): number {
  const totalMonths = ageYears * 12 + ageMonths;

  if (totalMonths < 3) return 3.5; // newborn
  if (totalMonths < 6) return 5;
  if (totalMonths < 12) return 7;
  if (totalMonths < 24) return 10;
  if (totalMonths < 36) return 13;
  if (totalMonths < 48) return 15;
  if (totalMonths < 60) return 17;
  if (ageYears < 7) return 18 + (ageYears - 5) * 2;
  if (ageYears < 10) return 23 + (ageYears - 7) * 3;
  if (ageYears < 13) return 32 + (ageYears - 10) * 4;

  return 40 + (ageYears - 12) * 5;
}

/**
 * Extract completed interventions from audit trail
 */
function extractCompletedInterventions(auditTrail: AuditEntry[]): string[] {
  return auditTrail
    .filter((entry) => entry.status === 'completed')
    .map((entry) => entry.action)
    .filter((action, index, self) => self.indexOf(action) === index); // unique
}

/**
 * Extract pending interventions from audit trail
 */
function extractPendingInterventions(auditTrail: AuditEntry[]): string[] {
  return auditTrail
    .filter((entry) => entry.status === 'pending')
    .map((entry) => entry.action)
    .filter((action, index, self) => self.indexOf(action) === index); // unique
}

/**
 * Identify critical findings from assessment
 */
function identifyCriticalFindings(assessment: AssessmentState): string[] {
  const findings: string[] = [];

  // Airway findings
  if (assessment.airwayPatency === 'compromised') {
    findings.push('Airway compromise');
  }

  // Breathing findings
  if (assessment.respiratoryRate && (assessment.respiratoryRate < 12 || assessment.respiratoryRate > 40)) {
    findings.push(`Abnormal respiratory rate: ${assessment.respiratoryRate}/min`);
  }

  if (assessment.oxygenSaturation && assessment.oxygenSaturation < 90) {
    findings.push(`Hypoxemia: SpO2 ${assessment.oxygenSaturation}%`);
  }

  // Circulation findings
  if (assessment.perfusionStatus === 'poor') {
    findings.push('Poor perfusion');
  }

  if (assessment.shockStatus) {
    findings.push(`${assessment.shockStatus} shock`);
  }

  // Disability findings
  if (assessment.consciousness === 'unconscious' || assessment.consciousness === 'altered') {
    findings.push(`Altered consciousness: ${assessment.consciousness}`);
  }

  if (assessment.glucose && assessment.glucose < 40) {
    findings.push(`Severe hypoglycemia: ${assessment.glucose} mg/dL`);
  }

  // Seizure activity
  if (assessment.seizureActivity === 'active') {
    findings.push('Active seizure activity');
  }

  // Temperature abnormality
  if (assessment.temperature && (assessment.temperature > 40 || assessment.temperature < 35)) {
    findings.push(`Abnormal temperature: ${assessment.temperature}°C`);
  }

  return findings;
}

/**
 * Determine active engines based on assessment findings
 */
function determineActiveEngines(assessment: AssessmentState, criticalFindings: string[]): string[] {
  const engines: string[] = [];

  // Septic shock
  if (assessment.temperature && assessment.temperature > 38 && assessment.perfusionStatus === 'poor') {
    engines.push('septic-shock');
  }

  // Respiratory failure
  if (
    (assessment.oxygenSaturation && assessment.oxygenSaturation < 90) ||
    (assessment.respiratoryRate && (assessment.respiratoryRate < 12 || assessment.respiratoryRate > 40))
  ) {
    engines.push('respiratory-failure');
  }

  // Status epilepticus
  if (assessment.seizureActivity === 'active') {
    engines.push('status-epilepticus');
  }

  // Anaphylaxis (multi-system involvement)
  if (
    assessment.breathing === 'labored' &&
    assessment.perfusionStatus === 'poor' &&
    assessment.consciousness === 'altered'
  ) {
    engines.push('anaphylaxis');
  }

  // Shock (general)
  if (assessment.shockStatus) {
    if (assessment.shockStatus.includes('hypovolemic')) {
      engines.push('hypovolemic-shock');
    } else if (assessment.shockStatus.includes('cardiogenic')) {
      engines.push('cardiogenic-shock');
    }
  }

  // DKA
  if (assessment.glucose && assessment.glucose > 200 && assessment.lactate && assessment.lactate > 2) {
    engines.push('dka');
  }

  // Remove duplicates
  return Array.from(new Set(engines));
}

/**
 * Format assessment data for display
 */
export function formatAssessmentSummary(assessmentState: AssessmentState): string {
  const lines: string[] = [];

  lines.push(`Patient: ${assessmentState.patientName || 'Unknown'}`);
  lines.push(`Age: ${assessmentState.age} years${assessmentState.ageMonths ? `, ${assessmentState.ageMonths} months` : ''}`);
  lines.push(`Weight: ${assessmentState.weight} kg`);
  lines.push('');

  lines.push('Vital Signs:');
  lines.push(`  HR: ${assessmentState.heartRate} bpm`);
  lines.push(`  RR: ${assessmentState.respiratoryRate}/min`);
  lines.push(`  BP: ${assessmentState.bloodPressure}`);
  lines.push(`  Temp: ${assessmentState.temperature}°C`);
  lines.push(`  SpO2: ${assessmentState.oxygenSaturation}%`);
  lines.push('');

  lines.push('Assessment:');
  lines.push(`  Consciousness: ${assessmentState.consciousness}`);
  lines.push(`  Breathing: ${assessmentState.breathing}`);
  lines.push(`  Circulation: ${assessmentState.circulation}`);
  lines.push('');

  if (assessmentState.activeEngines && assessmentState.activeEngines.length > 0) {
    lines.push(`Active Engines: ${assessmentState.activeEngines.join(', ')}`);
  }

  return lines.join('\n');
}
