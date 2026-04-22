/**
 * Unified Session Manager
 * 
 * Manages clinical sessions across all emergency types (CPR, Respiratory, Anaphylaxis, etc.).
 * Provides consistent session tracking, data persistence, and override logging.
 */

import type { EmergencyType } from '@/components/EmergencyTypeSelector';

export interface UnifiedSessionData {
  sessionId: string;
  emergencyType: EmergencyType;
  patientWeight: number;
  patientAgeMonths: number;
  startTime: number; // seconds from epoch
  endTime?: number;
  status: 'active' | 'completed' | 'abandoned';
  outcome?: string;
  
  // Generic clinical data
  findings: Record<string, any>;
  interventions: Array<{
    type: string;
    timestamp: number;
    details: Record<string, any>;
  }>;
  overrides: Array<{
    type: string;
    timestamp: number;
    justification: string;
    isHighRisk: boolean;
  }>;
  
  // Emergency-specific data
  cprData?: {
    rhythmType?: string;
    shockCount?: number;
    epiDoses?: number;
    totalDuration?: number;
  };
  respiratoryData?: {
    severity?: string;
    salbutamolDoses?: number;
    responseToTherapy?: string;
  };
  anaphylaxisData?: {
    severity?: string;
    epinephrineDoses?: number;
    triggers?: string[];
  };
}

/**
 * Initialize a new unified session
 */
export const initializeSession = ({
  emergencyType,
  patientWeight,
  patientAgeMonths,
}: {
  emergencyType: EmergencyType;
  patientWeight: number;
  patientAgeMonths: number;
}): UnifiedSessionData => {
  const sessionId = `${emergencyType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    sessionId,
    emergencyType,
    patientWeight,
    patientAgeMonths,
    startTime: Math.floor(Date.now() / 1000),
    status: 'active',
    findings: {},
    interventions: [],
    overrides: [],
  };
};

/**
 * Add intervention to session
 */
export const addIntervention = (
  session: UnifiedSessionData,
  intervention: {
    type: string;
    details: Record<string, any>;
  }
): UnifiedSessionData => {
  return {
    ...session,
    interventions: [
      ...session.interventions,
      {
        type: intervention.type,
        timestamp: Math.floor(Date.now() / 1000),
        details: intervention.details,
      },
    ],
  };
};

/**
 * Log an override
 */
export const logOverride = (
  session: UnifiedSessionData,
  override: {
    type: string;
    justification: string;
    isHighRisk: boolean;
  }
): UnifiedSessionData => {
  return {
    ...session,
    overrides: [
      ...session.overrides,
      {
        type: override.type,
        timestamp: Math.floor(Date.now() / 1000),
        justification: override.justification,
        isHighRisk: override.isHighRisk,
      },
    ],
  };
};

/**
 * Update clinical findings
 */
export const updateFindings = (
  session: UnifiedSessionData,
  findings: Record<string, any>
): UnifiedSessionData => {
  return {
    ...session,
    findings: {
      ...session.findings,
      ...findings,
    },
  };
};

/**
 * Complete session
 */
export const completeSession = (
  session: UnifiedSessionData,
  outcome: string
): UnifiedSessionData => {
  return {
    ...session,
    status: 'completed',
    endTime: Math.floor(Date.now() / 1000),
    outcome,
  };
};

/**
 * Get session duration in seconds
 */
export const getSessionDuration = (session: UnifiedSessionData): number => {
  const endTime = session.endTime || Math.floor(Date.now() / 1000);
  return endTime - session.startTime;
};

/**
 * Get intervention count by type
 */
export const getInterventionCount = (session: UnifiedSessionData, type: string): number => {
  return session.interventions.filter((i) => i.type === type).length;
};

/**
 * Get override count
 */
export const getOverrideCount = (session: UnifiedSessionData): number => {
  return session.overrides.length;
};

/**
 * Get high-risk override count
 */
export const getHighRiskOverrideCount = (session: UnifiedSessionData): number => {
  return session.overrides.filter((o) => o.isHighRisk).length;
};

/**
 * Generate session summary for admin dashboard
 */
export const generateSessionSummary = (session: UnifiedSessionData): Record<string, any> => {
  const duration = getSessionDuration(session);
  const durationMinutes = Math.floor(duration / 60);
  const durationSeconds = duration % 60;

  return {
    sessionId: session.sessionId,
    emergencyType: session.emergencyType,
    patientWeight: session.patientWeight,
    patientAgeMonths: session.patientAgeMonths,
    status: session.status,
    outcome: session.outcome,
    duration: `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`,
    interventionCount: session.interventions.length,
    overrideCount: session.overrides.length,
    highRiskOverrideCount: getHighRiskOverrideCount(session),
    startTime: new Date(session.startTime * 1000).toISOString(),
    endTime: session.endTime ? new Date(session.endTime * 1000).toISOString() : null,
  };
};

/**
 * Validate session data before saving
 */
export const validateSession = (session: UnifiedSessionData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!session.sessionId) errors.push('Session ID is required');
  if (!session.emergencyType) errors.push('Emergency type is required');
  if (session.patientWeight <= 0) errors.push('Patient weight must be positive');
  if (session.patientAgeMonths < 0) errors.push('Patient age cannot be negative');
  if (session.startTime <= 0) errors.push('Start time is invalid');
  if (session.endTime && session.endTime < session.startTime) errors.push('End time cannot be before start time');

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Serialize session for storage
 */
export const serializeSession = (session: UnifiedSessionData): string => {
  return JSON.stringify(session);
};

/**
 * Deserialize session from storage
 */
export const deserializeSession = (data: string): UnifiedSessionData => {
  return JSON.parse(data);
};


