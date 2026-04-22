/**
 * SBAR Handover Summary Generator
 * 
 * Transforms real-time clinical data and audit trail into professional SBAR reports
 * for safe escalation to tertiary care facilities.
 * 
 * SBAR Format:
 * - Situation: Current patient status and chief complaint
 * - Background: Relevant clinical history and context
 * - Assessment: Clinical findings and current status
 * - Recommendation: Suggested next steps and escalation plan
 */

import type { EmergencyType } from '@/components/EmergencyTypeSelector';

export interface PatientDemographics {
  name: string;
  age: number;
  weightKg: number;
  gender: 'M' | 'F' | 'Unknown';
  medicalRecordNumber?: string;
}

export interface ClinicalEvent {
  timestamp: number;
  eventType: string;
  description: string;
  value?: string | number;
  unit?: string;
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
  }>;
  finalOutcome: 'ROSC' | 'Transferred' | 'Ongoing' | 'Terminated';
}

export interface SBARReport {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  generatedAt: string;
  generatedBy: string;
}

/**
 * Generate Situation section from session data
 */
export const generateSituation = (session: SessionData): string => {
  const durationMinutes = Math.round((session.endTime - session.startTime) / 60000);
  const ageText = session.patient.age < 1 ? `${Math.round(session.patient.age * 12)} months` : `${session.patient.age} years`;
  
  let situation = `${session.patient.name} is a ${ageText}-old (${session.patient.weightKg}kg) child presenting with ${session.emergencyType.replace('_', ' ').toUpperCase()}. `;
  
  // Add current status
  const lastEvent = session.events[session.events.length - 1];
  if (lastEvent) {
    situation += `Current status: ${lastEvent.description}. `;
  }
  
  situation += `Duration of event: ${durationMinutes} minutes. `;
  situation += `Current outcome status: ${session.finalOutcome}.`;
  
  return situation;
};

/**
 * Generate Background section from session data
 */
export const generateBackground = (session: SessionData): string => {
  let background = `Patient presented to our facility with ${session.emergencyType.replace('_', ' ')} emergency. `;
  
  // Summarize key clinical events
  const criticalEvents = session.events.filter(e => 
    e.eventType.includes('intervention') || 
    e.eventType.includes('medication') ||
    e.eventType.includes('shock')
  );
  
  if (criticalEvents.length > 0) {
    background += `Key interventions performed: `;
    background += criticalEvents
      .map(e => e.description)
      .slice(0, 5)
      .join('; ');
    background += `. `;
  }
  
  // Note any overrides
  if (session.overrides.length > 0) {
    background += `Protocol deviations documented: ${session.overrides.length} override(s) with clinical justification. `;
  }
  
  background += `Patient weight: ${session.patient.weightKg}kg (used for all weight-based calculations).`;
  
  return background;
};

/**
 * Generate Assessment section from session data
 */
export const generateAssessment = (session: SessionData): string => {
  let assessment = `Clinical Assessment:\n`;
  
  // Summarize by emergency type
  switch (session.emergencyType) {
    case 'cpr':
      assessment += generateCprAssessment(session);
      break;
    case 'respiratory':
      assessment += generateRespiratoryAssessment(session);
      break;
    case 'anaphylaxis':
      assessment += generateAnaphylaxisAssessment(session);
      break;
    case 'septic_shock':
      assessment += generateSepticShockAssessment(session);
      break;
    case 'dka':
      assessment += generateDkaAssessment(session);
      break;
    case 'status_epilepticus':
      assessment += generateSeizureAssessment(session);
      break;
    default:
      assessment += `Emergency type: ${session.emergencyType}. `;
  }
  
  // Add outcome
  assessment += `\nFinal Outcome: ${session.finalOutcome}`;
  
  return assessment;
};

/**
 * Generate CPR-specific assessment
 */
const generateCprAssessment = (session: SessionData): string => {
  const rhythmEvents = session.events.filter(e => e.eventType.includes('rhythm'));
  const epiEvents = session.events.filter(e => e.eventType.includes('epinephrine'));
  const shockEvents = session.events.filter(e => e.eventType.includes('shock'));
  
  let assessment = `Cardiac Arrest Management:\n`;
  assessment += `- Rhythm checks performed: ${rhythmEvents.length}\n`;
  assessment += `- Epinephrine doses administered: ${epiEvents.length}\n`;
  assessment += `- Shocks delivered: ${shockEvents.length}\n`;
  
  if (rhythmEvents.length > 0) {
    assessment += `- Initial rhythm: ${rhythmEvents[0].description}\n`;
  }
  
  if (epiEvents.length > 0) {
    assessment += `- First epinephrine at: ${Math.round((epiEvents[0].timestamp - session.startTime) / 1000)}s\n`;
  }
  
  return assessment;
};

/**
 * Generate Respiratory-specific assessment
 */
const generateRespiratoryAssessment = (session: SessionData): string => {
  const oxygenEvents = session.events.filter(e => e.eventType.includes('oxygen'));
  const medicationEvents = session.events.filter(e => e.eventType.includes('medication'));
  
  let assessment = `Respiratory Emergency Management:\n`;
  assessment += `- Oxygen therapy initiated: ${oxygenEvents.length > 0 ? 'Yes' : 'No'}\n`;
  assessment += `- Medications administered: ${medicationEvents.length}\n`;
  
  if (medicationEvents.length > 0) {
    assessment += `- Medications: ${medicationEvents.map(e => e.description).join(', ')}\n`;
  }
  
  return assessment;
};

/**
 * Generate Anaphylaxis-specific assessment
 */
const generateAnaphylaxisAssessment = (session: SessionData): string => {
  const epiEvents = session.events.filter(e => e.eventType.includes('epinephrine'));
  const ivAccessEvents = session.events.filter(e => e.eventType.includes('IV'));
  
  let assessment = `Anaphylaxis Management:\n`;
  assessment += `- Epinephrine IM administered: ${epiEvents.length > 0 ? 'Yes' : 'No'}\n`;
  assessment += `- IV access established: ${ivAccessEvents.length > 0 ? 'Yes' : 'No'}\n`;
  
  if (epiEvents.length > 0) {
    assessment += `- First epinephrine at: ${Math.round((epiEvents[0].timestamp - session.startTime) / 1000)}s\n`;
  }
  
  return assessment;
};

/**
 * Generate Septic Shock-specific assessment
 */
const generateSepticShockAssessment = (session: SessionData): string => {
  const fluidEvents = session.events.filter(e => e.eventType.includes('fluid'));
  const antibioticEvents = session.events.filter(e => e.eventType.includes('antibiotic'));
  
  let assessment = `Septic Shock Management:\n`;
  assessment += `- IV fluids initiated: ${fluidEvents.length > 0 ? 'Yes' : 'No'}\n`;
  assessment += `- Antibiotics administered: ${antibioticEvents.length > 0 ? 'Yes' : 'No'}\n`;
  
  return assessment;
};

/**
 * Generate DKA-specific assessment
 */
const generateDkaAssessment = (session: SessionData): string => {
  const fluidEvents = session.events.filter(e => e.eventType.includes('fluid'));
  const insulinEvents = session.events.filter(e => e.eventType.includes('insulin'));
  
  let assessment = `DKA Management:\n`;
  assessment += `- IV fluids initiated: ${fluidEvents.length > 0 ? 'Yes' : 'No'}\n`;
  assessment += `- Insulin therapy started: ${insulinEvents.length > 0 ? 'Yes' : 'No'}\n`;
  
  return assessment;
};

/**
 * Generate Seizure-specific assessment
 */
const generateSeizureAssessment = (session: SessionData): string => {
  const benzoEvents = session.events.filter(e => e.eventType.includes('benzodiazepine'));
  const secondLineEvents = session.events.filter(e => e.eventType.includes('second_line'));
  
  let assessment = `Status Epilepticus Management:\n`;
  assessment += `- Benzodiazepine administered: ${benzoEvents.length > 0 ? 'Yes' : 'No'}\n`;
  assessment += `- Second-line agents used: ${secondLineEvents.length > 0 ? 'Yes' : 'No'}\n`;
  
  return assessment;
};

/**
 * Generate Recommendation section from session data
 */
export const generateRecommendation = (session: SessionData): string => {
  let recommendation = `Clinical Recommendations:\n\n`;
  
  // Primary recommendation based on outcome
  switch (session.finalOutcome) {
    case 'ROSC':
      recommendation += `1. Patient achieved Return of Spontaneous Circulation (ROSC). Recommend:\n`;
      recommendation += `   - Immediate transfer to Pediatric ICU for post-resuscitation care\n`;
      recommendation += `   - Continuous cardiac monitoring and vital sign assessment\n`;
      recommendation += `   - Consider targeted temperature management per institutional protocol\n`;
      break;
    case 'Transferred':
      recommendation += `1. Patient transferred to higher level of care. Recommend:\n`;
      recommendation += `   - Continued resuscitation efforts per PALS guidelines\n`;
      recommendation += `   - Maintain IV access and medication administration capability\n`;
      recommendation += `   - Provide this SBAR report to receiving facility\n`;
      break;
    case 'Ongoing':
      recommendation += `1. Resuscitation ongoing. Recommend:\n`;
      recommendation += `   - Continue current interventions\n`;
      recommendation += `   - Prepare for transfer to tertiary care facility\n`;
      recommendation += `   - Ensure all medications and equipment are available\n`;
      break;
    case 'Terminated':
      recommendation += `1. Resuscitation terminated. Recommend:\n`;
      recommendation += `   - Family notification and support\n`;
      recommendation += `   - Documentation of all interventions and times\n`;
      recommendation += `   - Debrief with clinical team\n`;
      break;
  }
  
  // Add specific clinical recommendations
  recommendation += `\n2. Specific Clinical Actions:\n`;
  
  if (session.overrides.length > 0) {
    recommendation += `   - Review ${session.overrides.length} documented protocol deviation(s) with clinical team\n`;
  }
  
  recommendation += `   - Ensure all weight-based calculations are verified (Patient weight: ${session.patient.weightKg}kg)\n`;
  recommendation += `   - Provide comprehensive handover to receiving facility\n`;
  
  return recommendation;
};

/**
 * Generate complete SBAR report
 */
export const generateSBARReport = (
  session: SessionData,
  generatedBy: string
): SBARReport => {
  return {
    situation: generateSituation(session),
    background: generateBackground(session),
    assessment: generateAssessment(session),
    recommendation: generateRecommendation(session),
    generatedAt: new Date().toISOString(),
    generatedBy,
  };
};

/**
 * Format SBAR report as plain text
 */
export const formatSBARAsText = (report: SBARReport): string => {
  return `
================================================================================
SBAR CLINICAL HANDOVER SUMMARY
================================================================================
Generated: ${report.generatedAt}
Generated by: ${report.generatedBy}
================================================================================

SITUATION
--------
${report.situation}

BACKGROUND
----------
${report.background}

ASSESSMENT
----------
${report.assessment}

RECOMMENDATION
---------------
${report.recommendation}

================================================================================
End of Report
================================================================================
`;
};

/**
 * Format SBAR report as HTML for display
 */
export const formatSBARAsHTML = (report: SBARReport): string => {
  return `
<div class="sbar-report">
  <h1>SBAR Clinical Handover Summary</h1>
  <p class="metadata">Generated: ${report.generatedAt} | By: ${report.generatedBy}</p>
  
  <section class="sbar-section">
    <h2>SITUATION</h2>
    <p>${report.situation}</p>
  </section>
  
  <section class="sbar-section">
    <h2>BACKGROUND</h2>
    <p>${report.background}</p>
  </section>
  
  <section class="sbar-section">
    <h2>ASSESSMENT</h2>
    <pre>${report.assessment}</pre>
  </section>
  
  <section class="sbar-section">
    <h2>RECOMMENDATION</h2>
    <pre>${report.recommendation}</pre>
  </section>
</div>
`;
};
