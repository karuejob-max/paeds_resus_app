/**
 * Override with Accountability System
 * Allows senior clinicians to override system recommendations while maintaining
 * complete audit trails for quality improvement and governance
 */

export type OverrideReason = 
  | 'clinical_judgment'
  | 'patient_specific_factors'
  | 'resource_unavailable'
  | 'allergy_contraindication'
  | 'family_preference'
  | 'facility_protocol'
  | 'research_protocol'
  | 'other';

export type OverrideSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface OverrideRecord {
  id: string;
  timestamp: number; // Unix timestamp
  clinicianId: string;
  clinicianName: string;
  clinicianRole: 'senior_doctor' | 'consultant' | 'specialist';
  
  // What was overridden
  engineId: string;
  engineName: string;
  actionId: string;
  actionTitle: string;
  recommendedAction: string;
  
  // Override details
  overriddenAction: string;
  reason: OverrideReason;
  reasonDetails: string; // Free text explanation
  severity: OverrideSeverity;
  
  // Patient context
  patientAge: number;
  patientWeight: number;
  clinicalContext: string;
  
  // Outcome tracking
  patientOutcome?: 'improved' | 'stable' | 'deteriorated' | 'unknown';
  outcomeNotes?: string;
  followUpRequired: boolean;
  
  // Audit trail
  ipAddress?: string;
  deviceInfo?: string;
  sessionId: string;
}

export interface OverrideAuditTrail {
  totalOverrides: number;
  overridesByReason: Record<OverrideReason, number>;
  overrideBySeverity: Record<OverrideSeverity, number>;
  overridesByEngine: Record<string, number>;
  overridesByClinic: Record<string, number>;
  averageOutcomeImprovement: number; // % of overrides that led to improvement
  qualityScore: number; // 0-100, higher is better (fewer overrides, better outcomes)
}

export interface OverridePermissions {
  canOverride: boolean;
  maxSeverityLevel: OverrideSeverity;
  requiresApproval: boolean;
  approvalRequired: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
}

/**
 * Determine if a clinician can override based on role and severity
 */
export function canClinicianOverride(
  role: string,
  severity: OverrideSeverity
): OverridePermissions {
  const permissions: Record<string, OverridePermissions> = {
    'senior_doctor': {
      canOverride: true,
      maxSeverityLevel: 'high',
      requiresApproval: true,
      approvalRequired: {
        critical: true,
        high: true,
        medium: false,
        low: false,
      },
    },
    'consultant': {
      canOverride: true,
      maxSeverityLevel: 'critical',
      requiresApproval: false,
      approvalRequired: {
        critical: false,
        high: false,
        medium: false,
        low: false,
      },
    },
    'specialist': {
      canOverride: true,
      maxSeverityLevel: 'critical',
      requiresApproval: false,
      approvalRequired: {
        critical: false,
        high: false,
        medium: false,
        low: false,
      },
    },
    'junior_doctor': {
      canOverride: false,
      maxSeverityLevel: 'low',
      requiresApproval: true,
      approvalRequired: {
        critical: true,
        high: true,
        medium: true,
        low: true,
      },
    },
    'nurse': {
      canOverride: false,
      maxSeverityLevel: 'low',
      requiresApproval: true,
      approvalRequired: {
        critical: true,
        high: true,
        medium: true,
        low: true,
      },
    },
  };

  return permissions[role] || {
    canOverride: false,
    maxSeverityLevel: 'low',
    requiresApproval: true,
    approvalRequired: {
      critical: true,
      high: true,
      medium: true,
      low: true,
    },
  };
}

/**
 * Determine override severity based on action type
 */
export function calculateOverrideSeverity(
  engineId: string,
  actionId: string
): OverrideSeverity {
  // Critical engines/actions
  const criticalEngines = ['septic-shock', 'respiratory-failure', 'anaphylaxis'];
  const criticalActions = ['airway-intubation', 'fluid-bolus', 'epinephrine-iv'];

  if (criticalEngines.includes(engineId) || criticalActions.includes(actionId)) {
    return 'critical';
  }

  // High severity
  const highEngines = ['status-epilepticus', 'dka', 'meningitis'];
  const highActions = ['seizure-management', 'insulin-infusion', 'antibiotics'];

  if (highEngines.includes(engineId) || highActions.includes(actionId)) {
    return 'high';
  }

  // Medium severity
  const mediumEngines = ['cardiogenic-shock', 'hypovolemic-shock'];
  if (mediumEngines.includes(engineId)) {
    return 'medium';
  }

  return 'low';
}

/**
 * Validate override reason and details
 */
export function validateOverrideReason(
  reason: OverrideReason,
  details: string,
  severity: OverrideSeverity
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Require detailed explanation for high/critical overrides
  if ((severity === 'high' || severity === 'critical') && details.length < 50) {
    errors.push('High/critical overrides require detailed explanation (minimum 50 characters)');
  }

  // Validate reason-specific requirements
  if (reason === 'allergy_contraindication' && !details.includes('allergy')) {
    errors.push('Allergy/contraindication reason must specify the allergy or contraindication');
  }

  if (reason === 'resource_unavailable' && !details.includes('resource')) {
    errors.push('Resource unavailable reason must specify which resource is unavailable');
  }

  if (reason === 'facility_protocol' && !details.includes('protocol')) {
    errors.push('Facility protocol reason must reference the specific protocol');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate quality score based on override patterns
 */
export function calculateQualityScore(auditTrail: OverrideAuditTrail): number {
  // Base score: 100 points
  let score = 100;

  // Deduct for high number of overrides (more than 20% of actions)
  if (auditTrail.totalOverrides > 50) {
    score -= Math.min(20, (auditTrail.totalOverrides - 50) * 0.2);
  }

  // Deduct for critical overrides (most concerning)
  const criticalOverrides = auditTrail.overrideBySeverity['critical'] || 0;
  score -= criticalOverrides * 2;

  // Deduct for high overrides
  const highOverrides = auditTrail.overrideBySeverity['high'] || 0;
  score -= highOverrides * 1;

  // Add bonus for good outcomes (improvement rate > 70%)
  if (auditTrail.averageOutcomeImprovement > 70) {
    score += 10;
  }

  // Add bonus for good outcomes (improvement rate > 50%)
  if (auditTrail.averageOutcomeImprovement > 50) {
    score += 5;
  }

  // Ensure score stays within 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Generate override summary for handover
 */
export function generateOverrideSummary(overrides: OverrideRecord[]): string {
  if (overrides.length === 0) {
    return 'No clinical overrides recorded.';
  }

  const criticalOverrides = overrides.filter((o) => o.severity === 'critical');
  const improvedOutcomes = overrides.filter((o) => o.patientOutcome === 'improved').length;

  let summary = `Clinical Overrides Summary:\n`;
  summary += `- Total overrides: ${overrides.length}\n`;
  summary += `- Critical overrides: ${criticalOverrides.length}\n`;
  summary += `- Improved outcomes: ${improvedOutcomes}/${overrides.length}\n`;

  if (criticalOverrides.length > 0) {
    summary += `\nCritical Overrides:\n`;
    criticalOverrides.forEach((override) => {
      summary += `- ${override.actionTitle}: ${override.reasonDetails}\n`;
    });
  }

  return summary;
}
