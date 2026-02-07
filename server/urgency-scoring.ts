// Time-to-Death Urgency Scoring System
// Prioritizes conditions by how quickly they kill without intervention

import type { Differential } from '../shared/clinical-types';

export type UrgencyTier = 'tier_1_minutes' | 'tier_2_hours' | 'tier_3_days';

export interface UrgencyScore {
  tier: UrgencyTier;
  timeToDeathMinutes: number; // Estimated time to death without intervention
  interventionWindow: string; // Human-readable treatment window
  priority: number; // 1-10 (10 = most urgent)
}

/**
 * Assigns urgency tier based on condition
 * TIER 1: Minutes to death (foreign body, tension pneumothorax, cardiac arrest)
 * TIER 2: Hours to death (MI, stroke, meningitis, DKA)
 * TIER 3: Days to death (pneumonia, cellulitis)
 */
export function scoreUrgency(differential: Differential): UrgencyScore {
  const conditionUrgency: Record<string, UrgencyScore> = {
    // ============================================================================
    // TIER 1: MINUTES TO DEATH (Priority 9-10)
    // ============================================================================
    foreign_body_aspiration: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 4,
      interventionWindow: '4 minutes (brain death from hypoxia)',
      priority: 10,
    },
    tension_pneumothorax: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 5,
      interventionWindow: '5-10 minutes (cardiovascular collapse)',
      priority: 10,
    },
    cardiac_tamponade: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 10,
      interventionWindow: '10-20 minutes (obstructive shock)',
      priority: 10,
    },
    opioid_overdose: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 5,
      interventionWindow: '5-10 minutes (respiratory arrest)',
      priority: 10,
    },
    shock_hypovolemic: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 15,
      interventionWindow: '15-30 minutes (hemorrhagic shock)',
      priority: 9,
    },
    shock_cardiogenic: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 20,
      interventionWindow: '20-60 minutes (cardiogenic shock)',
      priority: 9,
    },
    shock_obstructive: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 10,
      interventionWindow: '10-20 minutes (obstructive shock)',
      priority: 10,
    },
    shock_distributive_anaphylactic: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 10,
      interventionWindow: '10-30 minutes (anaphylactic shock)',
      priority: 10,
    },
    shock_distributive_septic: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 30,
      interventionWindow: '30-60 minutes (septic shock)',
      priority: 9,
    },
    shock_neurogenic: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 30,
      interventionWindow: '30-60 minutes (neurogenic shock)',
      priority: 9,
    },
    anaphylaxis: {
      tier: 'tier_1_minutes',
      timeToDeathMinutes: 10,
      interventionWindow: '10-30 minutes (airway obstruction/shock)',
      priority: 10,
    },

    // ============================================================================
    // TIER 2: HOURS TO DEATH (Priority 6-8)
    // ============================================================================
    myocardial_infarction: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 120,
      interventionWindow: '90 minutes for PCI, 12 hours for thrombolysis',
      priority: 8,
    },
    stroke: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 180,
      interventionWindow: '4.5 hours for tPA (ischemic), 6 hours for thrombectomy',
      priority: 8,
    },
    bacterial_meningitis: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 120,
      interventionWindow: '1 hour for antibiotics (every hour delay increases mortality)',
      priority: 8,
    },
    dka: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 240,
      interventionWindow: '4-6 hours (cerebral edema risk)',
      priority: 7,
    },
    septic_shock: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 60,
      interventionWindow: '1 hour for antibiotics (every hour delay increases mortality 7.6%)',
      priority: 9,
    },
    severe_burns: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 180,
      interventionWindow: '3-6 hours (fluid resuscitation window)',
      priority: 7,
    },
    eclampsia: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 120,
      interventionWindow: '2-4 hours (seizure control + delivery)',
      priority: 8,
    },
    status_epilepticus: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 60,
      interventionWindow: '30-60 minutes (refractory status)',
      priority: 8,
    },
    pulmonary_embolism: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 180,
      interventionWindow: '3-6 hours (massive PE)',
      priority: 7,
    },
    hyperkalemia: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 60,
      interventionWindow: '30-60 minutes (cardiac arrest risk)',
      priority: 8,
    },
    hypoglycemia: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 60,
      interventionWindow: '30-60 minutes (seizures/coma)',
      priority: 7,
    },
    postpartum_hemorrhage: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 120,
      interventionWindow: '2-4 hours (hypovolemic shock)',
      priority: 8,
    },
    status_asthmaticus: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 180,
      interventionWindow: '3-6 hours (respiratory failure)',
      priority: 7,
    },
    neonatal_sepsis: {
      tier: 'tier_2_hours',
      timeToDeathMinutes: 60,
      interventionWindow: '1 hour for antibiotics',
      priority: 9,
    },

    // ============================================================================
    // TIER 3: DAYS TO DEATH (Priority 3-5) - Not yet implemented
    // ============================================================================
    // pneumonia, cellulitis, UTI, etc.
  };

  // Return urgency score for known condition
  if (conditionUrgency[differential.id]) {
    return conditionUrgency[differential.id];
  }

  // Default for unknown conditions (assume Tier 2)
  return {
    tier: 'tier_2_hours',
    timeToDeathMinutes: 180,
    interventionWindow: '3-6 hours (unknown urgency)',
    priority: 6,
  };
}

/**
 * Sorts differentials by urgency (most urgent first)
 */
export function sortByUrgency(differentials: Differential[]): Differential[] {
  return differentials.sort((a, b) => {
    const urgencyA = scoreUrgency(a);
    const urgencyB = scoreUrgency(b);

    // First sort by priority (higher = more urgent)
    if (urgencyA.priority !== urgencyB.priority) {
      return urgencyB.priority - urgencyA.priority;
    }

    // Then by probability (if same priority)
    return b.probability - a.probability;
  });
}

/**
 * Adds urgency metadata to differential
 */
export function enrichWithUrgency(differential: Differential): Differential & { urgency: UrgencyScore } {
  return {
    ...differential,
    urgency: scoreUrgency(differential),
  };
}
