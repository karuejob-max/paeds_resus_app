/**
 * Extended SBAR Handover Summary Generator
 * 
 * Supports all emergency types including new respiratory modules:
 * - Bronchiolitis
 * - Pneumonia
 * - ARDS
 * - Upper Airway Obstruction
 */

import type { EmergencyType } from '@/lib/resus/unified-session-manager-extended';

export interface PatientDemographics {
  name: string;
  age: number;
  weightKg: number;
  gender: 'M' | 'F' | 'Unknown';
  medicalRecordNumber?: string;
  allergies?: string[];
}

export interface ClinicalEvent {
  timestamp: number;
  eventType: string;
  description: string;
  value?: string | number;
  unit?: string;
  provider?: string;
}

export interface SessionData {
  sessionId: string;
  emergencyType: EmergencyType;
  patient: PatientDemographics;
  startTime: number;
  endTime: number;
  events: ClinicalEvent[];
  overrides: Array<{
    timestamp: number;
    overrideType: string;
    justification: string;
    provider: string;
    severity?: 'low' | 'medium' | 'high';
  }>;
  finalOutcome: string;
  notes?: string;
}

export interface SBARReport {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  generatedAt: string;
  generatedBy: string;
  emergencyType: EmergencyType;
}

/**
 * Get emergency-type-specific context
 */
function getEmergencyContext(emergencyType: EmergencyType): {
  displayName: string;
  criticalParameters: string[];
  assessmentFocus: string;
} {
  const contexts: Record<EmergencyType, any> = {
    cpr: {
      displayName: 'Cardiac Arrest',
      criticalParameters: ['ROSC', 'Rhythm', 'Medication', 'Shock Energy'],
      assessmentFocus: 'Resuscitation outcome and perfusion status',
    },
    status_asthmaticus: {
      displayName: 'Status Asthmaticus',
      criticalParameters: ['Peak Flow', 'Oxygen Saturation', 'Bronchodilators', 'Steroids'],
      assessmentFocus: 'Airway obstruction severity and response to therapy',
    },
    bronchiolitis: {
      displayName: 'Bronchiolitis',
      criticalParameters: ['Respiratory Rate', 'Oxygen Saturation', 'Retractions', 'Feeding'],
      assessmentFocus: 'Respiratory distress severity and oxygenation status',
    },
    pneumonia: {
      displayName: 'Community-Acquired Pneumonia',
      criticalParameters: ['Classification', 'Antibiotic Regimen', 'Oxygen Support', 'Feeding Status'],
      assessmentFocus: 'Pneumonia severity and response to antibiotics',
    },
    ards: {
      displayName: 'Acute Respiratory Distress Syndrome',
      criticalParameters: ['P/F Ratio', 'Ventilation Mode', 'PEEP', 'Plateau Pressure'],
      assessmentFocus: 'Lung mechanics and oxygenation trajectory',
    },
    upper_airway: {
      displayName: 'Upper Airway Obstruction',
      criticalParameters: ['Stridor Type', 'Diagnosis', 'Airway Patency', 'Intervention Urgency'],
      assessmentFocus: 'Airway obstruction severity and emergency intervention needs',
    },
    anaphylaxis: {
      displayName: 'Anaphylaxis',
      criticalParameters: ['Epinephrine Dose', 'Trigger Identified', 'Cardiovascular Status', 'Airway Patency'],
      assessmentFocus: 'Anaphylactic reaction severity and response to epinephrine',
    },
    septic_shock: {
      displayName: 'Septic Shock',
      criticalParameters: ['Shock Type', 'Lactate', 'Fluid Resuscitation', 'Vasopressors', 'Antibiotics'],
      assessmentFocus: 'Shock severity, perfusion status, and response to resuscitation',
    },
    dka: {
      displayName: 'Diabetic Ketoacidosis',
      criticalParameters: ['pH', 'HCO3', 'Glucose', 'Insulin Infusion', 'Fluid Phase', 'Potassium'],
      assessmentFocus: 'Metabolic acidosis severity, cerebral edema risk, and electrolyte management',
    },
    status_epilepticus: {
      displayName: 'Status Epilepticus',
      criticalParameters: ['Seizure Duration', 'Benzodiazepine Dose', 'Second-Line Agent', 'Airway Status', 'Intubation'],
      assessmentFocus: 'Seizure escalation level and response to pharmacotherapy',
      assessmentFocus: 'Anaphylaxis severity and response to epinephrine',

  return contexts[emergencyType] || contexts.cpr;
}

/**
 * Generate Situation section
 */
export function generateSituation(session: SessionData): string {
  const context = getEmergencyContext(session.emergencyType);
  const durationMinutes = Math.round((session.endTime - session.startTime) / 60000);
  const ageText = session.patient.age < 1 ? `${Math.round(session.patient.age * 12)} months` : `${session.patient.age} years`;

  let situation = `${session.patient.name} is a ${ageText}-old (${session.patient.weightKg}kg) child presenting with ${context.displayName}. `;

  // Add current status
  const lastEvent = session.events[session.events.length - 1];
  if (lastEvent) {
    situation += `Current status: ${lastEvent.description}. `;
  }

  situation += `Duration of event: ${durationMinutes} minutes. Final outcome: ${session.finalOutcome}.`;

  return situation;
}

/**
 * Generate Background section
 */
export function generateBackground(session: SessionData): string {
  const context = getEmergencyContext(session.emergencyType);
  let background = `Patient presented with ${context.displayName}. `;

  // Add allergies if present
  if (session.patient.allergies && session.patient.allergies.length > 0) {
    background += `Known allergies: ${session.patient.allergies.join(', ')}. `;
  }

  // Summarize key clinical events
  const criticalEvents = session.events.filter(e =>
    e.eventType.includes('intervention') ||
    e.eventType.includes('medication') ||
    e.eventType.includes('assessment') ||
    e.eventType.includes('severity')
  );

  if (criticalEvents.length > 0) {
    background += `Key clinical events: `;
    background += criticalEvents
      .map(e => e.description)
      .slice(0, 5)
      .join('; ');
    background += `. `;
  }

  // Note any protocol overrides
  if (session.overrides.length > 0) {
    const highSeverityOverrides = session.overrides.filter(o => o.severity === 'high');
    if (highSeverityOverrides.length > 0) {
      background += `Protocol overrides noted (${highSeverityOverrides.length} high-severity). `;
    }
  }

  return background;
}

/**
 * Generate Assessment section
 */
export function generateAssessment(session: SessionData): string {
  const context = getEmergencyContext(session.emergencyType);
  let assessment = `Assessment: ${context.assessmentFocus}. `;

  // Add critical parameters from events
  const criticalEvents = session.events.filter(e =>
    context.criticalParameters.some(param => e.description.includes(param))
  );

  if (criticalEvents.length > 0) {
    assessment += `Critical parameters documented: `;
    assessment += criticalEvents
      .map(e => e.description)
      .slice(0, 3)
      .join('; ');
    assessment += `. `;
  }

  // Add outcome status
  assessment += `Current outcome status: ${session.finalOutcome}. `;

  // Add provider notes if available
  if (session.notes) {
    assessment += `Provider notes: ${session.notes}. `;
  }

  return assessment;
}

/**
 * Generate Recommendation section
 */
export function generateRecommendation(session: SessionData): string {
  const context = getEmergencyContext(session.emergencyType);
  let recommendation = '';

  // Determine next steps based on emergency type and outcome
  if (session.finalOutcome === 'Ongoing') {
    recommendation = `Continue current management protocol for ${context.displayName}. `;
    recommendation += `Reassess every 30-60 minutes. `;
    recommendation += `Escalate to higher level of care if deterioration occurs. `;
  } else if (session.finalOutcome === 'Transferred') {
    recommendation = `Patient is being transferred to tertiary care facility. `;
    recommendation += `Ensure continuity of current therapy during transfer. `;
    recommendation += `Provide this SBAR report to receiving facility. `;
  } else if (session.finalOutcome === 'ROSC') {
    recommendation = `Patient has achieved return of spontaneous circulation. `;
    recommendation += `Continue post-resuscitation care and monitoring. `;
    recommendation += `Consider ICU admission for ongoing care. `;
  } else {
    recommendation = `Review outcome and consider escalation options. `;
  }

  // Add any high-severity overrides to recommendation
  const highSeverityOverrides = session.overrides.filter(o => o.severity === 'high');
  if (highSeverityOverrides.length > 0) {
    recommendation += `Note: ${highSeverityOverrides.length} high-severity protocol override(s) documented. Review justifications. `;
  }

  recommendation += `Ensure appropriate follow-up and quality improvement review.`;

  return recommendation;
}

/**
 * Generate complete SBAR report
 */
export function generateSBARReport(session: SessionData, generatedBy: string = 'PaedsResusGPS'): SBARReport {
  return {
    situation: generateSituation(session),
    background: generateBackground(session),
    assessment: generateAssessment(session),
    recommendation: generateRecommendation(session),
    generatedAt: new Date().toISOString(),
    generatedBy,
    emergencyType: session.emergencyType,
  };
}

/**
 * Format SBAR report as text
 */
export function formatSBARAsText(report: SBARReport): string {
  return `
SBAR HANDOVER REPORT
Generated: ${report.generatedAt}
Generated by: ${report.generatedBy}
Emergency Type: ${report.emergencyType.replace(/_/g, ' ').toUpperCase()}

SITUATION:
${report.situation}

BACKGROUND:
${report.background}

ASSESSMENT:
${report.assessment}

RECOMMENDATION:
${report.recommendation}

---
This report was automatically generated by PaedsResusGPS.
Please review all clinical details before handover.
  `.trim();
}

/**
 * Format SBAR report as HTML
 */
export function formatSBARAsHTML(report: SBARReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
    .header { background-color: #2c3e50; color: white; padding: 15px; border-radius: 5px; }
    .section { margin: 20px 0; }
    .section-title { background-color: #3498db; color: white; padding: 10px; font-weight: bold; }
    .section-content { padding: 15px; background-color: #ecf0f1; border-left: 4px solid #3498db; }
    .footer { font-size: 0.9em; color: #7f8c8d; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SBAR Handover Report</h1>
    <p>Generated: ${report.generatedAt}</p>
    <p>Emergency Type: ${report.emergencyType.replace(/_/g, ' ').toUpperCase()}</p>
  </div>

  <div class="section">
    <div class="section-title">SITUATION</div>
    <div class="section-content">${report.situation}</div>
  </div>

  <div class="section">
    <div class="section-title">BACKGROUND</div>
    <div class="section-content">${report.background}</div>
  </div>

  <div class="section">
    <div class="section-title">ASSESSMENT</div>
    <div class="section-content">${report.assessment}</div>
  </div>

  <div class="section">
    <div class="section-title">RECOMMENDATION</div>
    <div class="section-content">${report.recommendation}</div>
  </div>

  <div class="footer">
    <p>This report was automatically generated by PaedsResusGPS.</p>
    <p>Please review all clinical details before handover.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Export SBAR report to JSON
 */
export function exportSBARAsJSON(report: SBARReport): string {
  return JSON.stringify(report, null, 2);
}
