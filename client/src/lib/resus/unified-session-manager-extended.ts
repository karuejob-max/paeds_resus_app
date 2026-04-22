/**
 * Extended Unified Session Manager
 * 
 * Manages session data for all emergency types including new respiratory modules
 */

export type EmergencyType = 
  | 'cpr' 
  | 'status_asthmaticus' 
  | 'bronchiolitis' 
  | 'pneumonia' 
  | 'ards' 
  | 'upper_airway' 
  | 'anaphylaxis' 
  | 'septic_shock' 
  | 'dka' 
  | 'status_epilepticus';

export interface SessionEvent {
  timestamp: number;
  eventType: string;
  description: string;
  provider?: string;
  metadata?: Record<string, any>;
}

export interface SessionOverride {
  timestamp: number;
  overrideType: string;
  justification: string;
  provider: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface PatientData {
  name: string;
  age: number;
  weightKg: number;
  gender?: string;
  medicalRecordNumber?: string;
  allergies?: string[];
  medicalHistory?: string[];
}

export interface SessionData {
  sessionId: string;
  emergencyType: EmergencyType;
  patient: PatientData;
  startTime: number;
  endTime?: number;
  events: SessionEvent[];
  overrides: SessionOverride[];
  finalOutcome?: string;
  notes?: string;
}

/**
 * Create a new session
 */
export function createSession(
  emergencyType: EmergencyType,
  patient: PatientData
): SessionData {
  return {
    sessionId: generateSessionId(),
    emergencyType,
    patient,
    startTime: Date.now(),
    events: [],
    overrides: [],
  };
}

/**
 * Add event to session
 */
export function addEvent(
  session: SessionData,
  eventType: string,
  description: string,
  provider?: string
): SessionData {
  const event: SessionEvent = {
    timestamp: Date.now(),
    eventType,
    description,
    provider,
  };

  return {
    ...session,
    events: [...session.events, event],
  };
}

/**
 * Add override to session
 */
export function addOverride(
  session: SessionData,
  overrideType: string,
  justification: string,
  provider: string,
  severity?: 'low' | 'medium' | 'high'
): SessionData {
  const override: SessionOverride = {
    timestamp: Date.now(),
    overrideType,
    justification,
    provider,
    severity,
  };

  return {
    ...session,
    overrides: [...session.overrides, override],
  };
}

/**
 * Complete session
 */
export function completeSession(
  session: SessionData,
  finalOutcome: string,
  notes?: string
): SessionData {
  return {
    ...session,
    endTime: Date.now(),
    finalOutcome,
    notes,
  };
}

/**
 * Get session duration in minutes
 */
export function getSessionDuration(session: SessionData): number {
  const endTime = session.endTime || Date.now();
  return Math.round((endTime - session.startTime) / 60000);
}

/**
 * Get event count by type
 */
export function getEventCountByType(session: SessionData, eventType: string): number {
  return session.events.filter(e => e.eventType === eventType).length;
}

/**
 * Get all events of a specific type
 */
export function getEventsByType(session: SessionData, eventType: string): SessionEvent[] {
  return session.events.filter(e => e.eventType === eventType);
}

/**
 * Get high-severity overrides
 */
export function getHighSeverityOverrides(session: SessionData): SessionOverride[] {
  return session.overrides.filter(o => o.severity === 'high');
}

/**
 * Generate session summary
 */
export function generateSessionSummary(session: SessionData): string {
  const duration = getSessionDuration(session);
  const eventCount = session.events.length;
  const overrideCount = session.overrides.length;

  return `
SESSION SUMMARY

Emergency Type: ${session.emergencyType.replace(/_/g, ' ').toUpperCase()}
Patient: ${session.patient.name} (${session.patient.age} years, ${session.patient.weightKg}kg)
Duration: ${duration} minutes
Final Outcome: ${session.finalOutcome || 'Ongoing'}

Events Logged: ${eventCount}
Protocol Overrides: ${overrideCount}
High-Severity Overrides: ${getHighSeverityOverrides(session).length}

${session.notes ? `Notes: ${session.notes}` : ''}
  `.trim();
}

/**
 * Export session to JSON
 */
export function exportSessionJSON(session: SessionData): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate session data
 */
export function validateSession(session: SessionData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!session.sessionId) errors.push('Session ID is required');
  if (!session.emergencyType) errors.push('Emergency type is required');
  if (!session.patient) errors.push('Patient data is required');
  if (!session.patient.name) errors.push('Patient name is required');
  if (!session.patient.age || session.patient.age <= 0) errors.push('Valid patient age is required');
  if (!session.patient.weightKg || session.patient.weightKg <= 0) errors.push('Valid patient weight is required');
  if (!session.startTime) errors.push('Start time is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get emergency type display name
 */
export function getEmergencyTypeDisplayName(type: EmergencyType): string {
  const displayNames: Record<EmergencyType, string> = {
    cpr: 'Cardiac Arrest (CPR)',
    status_asthmaticus: 'Status Asthmaticus',
    bronchiolitis: 'Bronchiolitis',
    pneumonia: 'Pneumonia',
    ards: 'Acute Respiratory Distress Syndrome (ARDS)',
    upper_airway: 'Upper Airway Obstruction',
    anaphylaxis: 'Anaphylaxis',
    septic_shock: 'Septic Shock',
    dka: 'Diabetic Ketoacidosis',
    status_epilepticus: 'Status Epilepticus',
  };

  return displayNames[type] || type;
}

/**
 * Get emergency type color
 */
export function getEmergencyTypeColor(type: EmergencyType): string {
  const colors: Record<EmergencyType, string> = {
    cpr: 'red',
    status_asthmaticus: 'orange',
    bronchiolitis: 'blue',
    pneumonia: 'cyan',
    ards: 'red',
    upper_airway: 'red',
    anaphylaxis: 'red',
    septic_shock: 'purple',
    dka: 'yellow',
    status_epilepticus: 'indigo',
  };

  return colors[type] || 'gray';
}

/**
 * Get emergency type priority
 */
export function getEmergencyTypePriority(type: EmergencyType): 'CRITICAL' | 'HIGH' | 'MEDIUM' {
  const priorities: Record<EmergencyType, 'CRITICAL' | 'HIGH' | 'MEDIUM'> = {
    cpr: 'CRITICAL',
    status_asthmaticus: 'HIGH',
    bronchiolitis: 'HIGH',
    pneumonia: 'HIGH',
    ards: 'CRITICAL',
    upper_airway: 'CRITICAL',
    anaphylaxis: 'CRITICAL',
    septic_shock: 'CRITICAL',
    dka: 'HIGH',
    status_epilepticus: 'HIGH',
  };

  return priorities[type] || 'MEDIUM';
}
