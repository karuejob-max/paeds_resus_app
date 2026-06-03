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
function normalizeDrugName(drug: string): string {
  return drug.toLowerCase().replace(/\(.*?\)/g, '').trim();
}

function isSameDrug(a: string, b: string): boolean {
  const na = normalizeDrugName(a);
  const nb = normalizeDrugName(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

export interface DuplicateCheckOptions {
  /** Exclude the intervention being acted on (prevents self-match). */
  excludeInterventionId?: string;
}

export function checkMedicationDuplicate(
  newIntervention: Intervention,
  session: ResusSession,
  options?: DuplicateCheckOptions
): DuplicateCheckResult {
  const { drug: newDrug, route: newRoute } = extractDrugInfo(newIntervention);

  if (!newDrug) {
    return { isDuplicate: false, allowOverride: true, severity: 'warning' };
  }

  const activeInterventions = getActiveInterventions(session);

  for (const existing of activeInterventions) {
    if (options?.excludeInterventionId && existing.id === options.excludeInterventionId) {
      continue;
    }

    const { drug: existingDrug, route: existingRoute } = extractDrugInfo(existing);
    if (!existingDrug || !isSameDrug(existingDrug, newDrug)) continue;

    if (existingRoute && newRoute && existingRoute !== newRoute) continue;

    // Same drug listed on multiple threat cards (e.g. fever + sepsis) — not a duplicate dose
    if (existing.status === 'pending') continue;

    if (isBolus(newIntervention) && isBolus(existing)) continue;

    if (isContinuousInfusion(existing) && existing.status === 'completed') {
      if (hasTimePassedSinceCompletion(existing, 5)) continue;
    }

    if (existing.status === 'in_progress') {
      return {
        isDuplicate: true,
        existingIntervention: existing,
        message: `${newDrug} ${newRoute || ''} is already in progress (started ${formatTimeAgo(existing.startedAt || Date.now())} ago). Confirm you intend a repeat dose.`,
        severity: 'danger',
        allowOverride: true,
      };
    }

    if (existing.status === 'completed' && !hasTimePassedSinceCompletion(existing, 5)) {
      return {
        isDuplicate: true,
        existingIntervention: existing,
        message: `You already logged this ${newDrug} dose (${formatTimeAgo(existing.completedAt || Date.now())} ago) — tap to confirm repeat dose or cancel.`,
        severity: 'warning',
        allowOverride: true,
      };
    }
  }

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
