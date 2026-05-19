/**
 * Predictive SBAR Context Generator
 * 
 * Generates proactive SBAR summaries based on predictive alerts
 */

import type { PredictiveAlert } from './predictive-integration';
import type { PEWSScore, TrendAnalysis } from './predictive-engine';

export interface PredictiveSBARContext {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  timeframe: string;
}

export class PredictiveSBARGenerator {
  /**
   * Generate SBAR context from predictive alert
   */
  public generateSBARFromAlert(
    alert: PredictiveAlert,
    patientAge: number,
    patientWeight: number,
    emergencyType: string,
    currentInterventions: string[]
  ): PredictiveSBARContext {
    const situation = this.generateSituation(alert, emergencyType);
    const background = this.generateBackground(patientAge, patientWeight, emergencyType);
    const assessment = this.generateAssessment(alert);
    const recommendation = this.generateRecommendation(alert, currentInterventions);
    const urgency = this.determineUrgency(alert);
    const timeframe = this.generateTimeframe(alert);

    return {
      situation,
      background,
      assessment,
      recommendation,
      urgency,
      timeframe,
    };
  }

  /**
   * Generate Situation component
   */
  private generateSituation(alert: PredictiveAlert, emergencyType: string): string {
    let situation = `Patient presenting with ${emergencyType}. `;

    if (alert.shouldEscalate) {
      situation += `ALERT: ${alert.escalationReason}. `;
    }

    situation += `Current PEWS score: ${alert.pewsScore}/18 (${alert.severity.toUpperCase()}).`;

    return situation;
  }

  /**
   * Generate Background component
   */
  private generateBackground(patientAge: number, patientWeight: number, emergencyType: string): string {
    const ageYears = Math.floor(patientAge / 12);
    const ageMonths = patientAge % 12;

    let background = `${ageYears}y ${ageMonths}m old child weighing ${patientWeight}kg. `;
    background += `Presenting with ${emergencyType}. `;
    background += `Patient has been under observation and treatment per ResusGPS protocol.`;

    return background;
  }

  /**
   * Generate Assessment component
   */
  private generateAssessment(alert: PredictiveAlert): string {
    let assessment = `Clinical status: ${alert.severity.toUpperCase()} alert. `;
    assessment += `Trend: ${alert.trendDirection}. `;

    if (alert.riskFactors.length > 0) {
      assessment += `Key risk factors: ${alert.riskFactors.join(', ')}. `;
    }

    if (alert.timeToEscalation !== undefined && alert.timeToEscalation > 0) {
      assessment += `Predicted time to escalation: ${alert.timeToEscalation} minutes. `;
    }

    assessment += `Immediate intervention required to prevent further deterioration.`;

    return assessment;
  }

  /**
   * Generate Recommendation component
   */
  private generateRecommendation(alert: PredictiveAlert, currentInterventions: string[]): string {
    let recommendation = '';

    if (alert.severity === 'red') {
      recommendation = 'IMMEDIATE escalation to ICU/High Dependency Unit. ';
      recommendation += 'Activate rapid response team. ';
      recommendation += 'Prepare for advanced airway management and intensive support. ';
    } else if (alert.severity === 'orange') {
      recommendation = 'Urgent escalation within 15 minutes. ';
      recommendation += 'Increase monitoring frequency to every 5 minutes. ';
      recommendation += 'Prepare for potential transfer to higher level of care. ';
    } else if (alert.severity === 'yellow') {
      recommendation = 'Close monitoring recommended. ';
      recommendation += 'Reassess in 15 minutes. ';
      recommendation += 'Escalate if condition deteriorates. ';
    }

    // Add specific recommendations
    if (alert.recommendations.length > 0) {
      recommendation += `Additional actions: ${alert.recommendations.join('; ')}. `;
    }

    return recommendation;
  }

  /**
   * Determine urgency
   */
  private determineUrgency(alert: PredictiveAlert): 'routine' | 'urgent' | 'emergent' {
    if (alert.severity === 'red' || alert.shouldEscalate) {
      return 'emergent';
    }

    if (alert.severity === 'orange') {
      return 'urgent';
    }

    return 'routine';
  }

  /**
   * Generate timeframe
   */
  private generateTimeframe(alert: PredictiveAlert): string {
    if (alert.severity === 'red') {
      return 'Immediate (within 5 minutes)';
    }

    if (alert.severity === 'orange') {
      if (alert.timeToEscalation !== undefined && alert.timeToEscalation > 0) {
        return `Within ${alert.timeToEscalation} minutes`;
      }
      return 'Within 15 minutes';
    }

    if (alert.severity === 'yellow') {
      return 'Within 30 minutes';
    }

    return 'Routine';
  }

  /**
   * Generate full SBAR document
   */
  public generateFullSBARDocument(
    context: PredictiveSBARContext,
    patientName: string,
    patientID: string,
    hospitalName: string
  ): string {
    const timestamp = new Date().toLocaleString();

    const document = `
PEDIATRIC RESUSCITATION HANDOVER SUMMARY
Generated: ${timestamp}

PATIENT INFORMATION
Name: ${patientName}
ID: ${patientID}
Hospital: ${hospitalName}

SITUATION
${context.situation}

BACKGROUND
${context.background}

ASSESSMENT
${context.assessment}

RECOMMENDATION
${context.recommendation}

URGENCY LEVEL: ${context.urgency.toUpperCase()}
TIMEFRAME: ${context.timeframe}

---
This summary was generated by ResusGPS predictive alert system.
For clinical decisions, refer to the complete ResusGPS session record.
`;

    return document;
  }

  /**
   * Generate HTML version for display
   */
  public generateHTMLSBAR(
    context: PredictiveSBARContext,
    patientName: string,
    patientID: string,
    hospitalName: string
  ): string {
    const urgencyColor = {
      routine: '#10b981',
      urgent: '#f59e0b',
      emergent: '#ef4444',
    }[context.urgency];

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #1f2937; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .section { margin: 15px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f9fafb; }
    .section-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; }
    .urgency-badge { background: ${urgencyColor}; color: white; padding: 8px 12px; border-radius: 5px; display: inline-block; margin: 10px 0; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Pediatric Resuscitation Handover Summary</h1>
    <p>Patient: ${patientName} | ID: ${patientID}</p>
    <p>Hospital: ${hospitalName}</p>
  </div>

  <div class="urgency-badge">${context.urgency.toUpperCase()} - ${context.timeframe}</div>

  <div class="section">
    <div class="section-title">SITUATION</div>
    <p>${context.situation}</p>
  </div>

  <div class="section">
    <div class="section-title">BACKGROUND</div>
    <p>${context.background}</p>
  </div>

  <div class="section">
    <div class="section-title">ASSESSMENT</div>
    <p>${context.assessment}</p>
  </div>

  <div class="section">
    <div class="section-title">RECOMMENDATION</div>
    <p>${context.recommendation}</p>
  </div>

  <div class="footer">
    <p>This summary was generated by ResusGPS predictive alert system.</p>
    <p>For clinical decisions, refer to the complete ResusGPS session record.</p>
  </div>
</body>
</html>
`;

    return html;
  }
}

/**
 * React hook for predictive SBAR
 */
export function usePredictiveSBAR() {
  const generator = new PredictiveSBARGenerator();

  return {
    generateSBARFromAlert: (
      alert: PredictiveAlert,
      age: number,
      weight: number,
      type: string,
      interventions: string[]
    ) => generator.generateSBARFromAlert(alert, age, weight, type, interventions),
    generateFullSBARDocument: (
      context: PredictiveSBARContext,
      name: string,
      id: string,
      hospital: string
    ) => generator.generateFullSBARDocument(context, name, id, hospital),
    generateHTMLSBAR: (
      context: PredictiveSBARContext,
      name: string,
      id: string,
      hospital: string
    ) => generator.generateHTMLSBAR(context, name, id, hospital),
  };
}
