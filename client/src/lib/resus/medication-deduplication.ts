/**
 * Medication Deduplication Engine for ResusGPS
 * 
 * Prevents duplicate drug orders during resuscitations by detecting:
 * 1. Same drug + route already in progress
 * 2. Same drug + route completed in last 5 minutes (for continuous infusions)
 * 3. Exceptions: boluses (allow repeats), different routes (allow both)
 * 
 * Clinical rationale: In chaotic resuscitations, providers may order epinephrine twice
 * or forget they already gave a bolus. This engine catches those errors.
 */

import { Intervention, Threat, ResusSession } from './abcdeEngine';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingIntervention?: Intervention;
  message?: string;
  severity: 'warning' | 'danger';
  allowOverride: boolean;
}

/**
 * Extract drug name and route from intervention
 */
function extractDrugInfo(intervention: Intervention): { drug?: string; route?: string } {
  return {
    drug: intervention.dose?.drug,
    route: intervention.dose?.route,
  };
}

/**
 * Check if intervention is a bolus (repeatable medication)
 */
function isBolus(intervention: Intervention): boolean {
  const action = intervention.action.toLowerCase();
  return (
    action.includes('bolus') ||
    action.includes('fluid') ||
    action.includes('crystalloid') ||
    action.includes('saline') ||
    action.includes('ringer')
  );
}

/**
 * Check if intervention is a continuous infusion (time-dependent)
 */
function isContinuousInfusion(intervention: Intervention): boolean {
  const action = intervention.action.toLowerCase();
  return (
    action.includes('infusion') ||
    action.includes('drip') ||
    action.includes('continuous') ||
    action.includes('running')
  );
}

/**
 * Check if enough time has passed since intervention was completed
 * (for continuous infusions that can be restarted)
 */
function hasTimePassedSinceCompletion(intervention: Intervention, minMinutes: number): boolean {
  if (!intervention.completedAt) return true;
  
  const timeSinceCompletion = Date.now() - intervention.completedAt;
  const minMilliseconds = minMinutes * 60 * 1000;
  
  return timeSinceCompletion >= minMilliseconds;
}

/**
 * Get all active interventions from a session
 */
function getActiveInterventions(session: ResusSession): Intervention[] {
  return session.threats.flatMap(threat => threat.interventions);
}

/**
 * Check for duplicate medication in session
 * 
 * Returns:
 * - isDuplicate: true if duplicate detected
 * - existingIntervention: the intervention that's already active
 * - message: user-friendly explanation
 * - severity: 'warning' (can override) or 'danger' (should not override)
 * - allowOverride: whether provider can force the duplicate
 */
export function checkMedicationDuplicate(
  newIntervention: Intervention,
  session: ResusSession
): DuplicateCheckResult {
  const { drug: newDrug, route: newRoute } = extractDrugInfo(newIntervention);
  
  // If no drug specified, no duplicate check needed
  if (!newDrug) {
    return { isDuplicate: false, allowOverride: true, severity: 'warning' };
  }
  
  const activeInterventions = getActiveInterventions(session);
  
  // Check each active intervention
  for (const existing of activeInterventions) {
    const { drug: existingDrug, route: existingRoute } = extractDrugInfo(existing);
    
    // Different drugs = no duplicate
    if (existingDrug !== newDrug) continue;
    
    // Different routes = allow both (e.g., IV + PR diazepam)
    if (existingRoute && newRoute && existingRoute !== newRoute) continue;
    
    // EXCEPTION 1: Boluses are repeatable
    if (isBolus(newIntervention) && isBolus(existing)) {
      // Allow multiple boluses (shock escalation requires them)
      continue;
    }
    
    // EXCEPTION 2: Continuous infusions can be restarted after 5+ minutes
    if (isContinuousInfusion(existing) && existing.status === 'completed') {
      if (hasTimePassedSinceCompletion(existing, 5)) {
        // Enough time has passed, allow restart
        continue;
      }
    }
    
    // DUPLICATE DETECTED
    if (existing.status === 'in_progress') {
      return {
        isDuplicate: true,
        existingIntervention: existing,
        message: `${newDrug} ${newRoute || ''} already in progress (started ${formatTimeAgo(existing.startedAt || Date.now())})`,
        severity: 'danger',
        allowOverride: true, // Provider can force if needed
      };
    }
    
    if (existing.status === 'pending') {
      return {
        isDuplicate: true,
        existingIntervention: existing,
        message: `${newDrug} ${newRoute || ''} already pending`,
        severity: 'warning',
        allowOverride: true,
      };
    }
    
    if (existing.status === 'completed' && !hasTimePassedSinceCompletion(existing, 5)) {
      return {
        isDuplicate: true,
        existingIntervention: existing,
        message: `${newDrug} ${newRoute || ''} was just given (${formatTimeAgo(existing.completedAt || Date.now())} ago)`,
        severity: 'warning',
        allowOverride: true,
      };
    }
  }
  
  // No duplicate found
  return { isDuplicate: false, allowOverride: true, severity: 'warning' };
}

/**
 * Format time ago (e.g., "2 min ago", "30 sec ago")
 */
function formatTimeAgo(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    return `${hours} hr`;
  }
}

/**
 * Get list of all drugs currently in session (for analytics/logging)
 */
export function getActiveDrugs(session: ResusSession): string[] {
  const drugs = new Set<string>();
  
  getActiveInterventions(session).forEach(intervention => {
    if (intervention.dose?.drug && intervention.status === 'in_progress') {
      drugs.add(intervention.dose.drug);
    }
  });
  
  return Array.from(drugs);
}

/**
 * Get drug administration history (for provider reference)
 */
export function getDrugHistory(session: ResusSession): Array<{
  drug: string;
  route: string;
  status: string;
  timestamp: number;
  timeAgo: string;
}> {
  const history: Array<{
    drug: string;
    route: string;
    status: string;
    timestamp: number;
    timeAgo: string;
  }> = [];
  
  getActiveInterventions(session).forEach(intervention => {
    const { drug, route } = extractDrugInfo(intervention);
    if (drug) {
      const timestamp = intervention.completedAt || intervention.startedAt || Date.now();
      history.push({
        drug,
        route: route || 'unknown',
        status: intervention.status,
        timestamp,
        timeAgo: formatTimeAgo(timestamp),
      });
    }
  });
  
  // Sort by most recent first
  return history.sort((a, b) => b.timestamp - a.timestamp);
}
