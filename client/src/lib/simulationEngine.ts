/**
 * Simulation Engine for CPR Training
 * 
 * Generates realistic cardiac arrest scenarios with:
 * - Random initial rhythms (VF, pVT, PEA, asystole)
 * - Realistic rhythm changes based on interventions
 * - Complications (reversible causes)
 * - Performance tracking
 */

export type ArrestRhythm = 'VF' | 'pVT' | 'PEA' | 'asystole' | 'ROSC';

export type ReversibleCause = 
  | 'hyperkalemia'
  | 'hypokalemia'
  | 'hypothermia'
  | 'hypoxia'
  | 'hypovolemia'
  | 'h_plus' // acidosis
  | 'tension_pneumothorax'
  | 'cardiac_tamponade'
  | 'toxins'
  | 'thrombosis_pulmonary'
  | 'thrombosis_coronary';

export interface SimulationScenario {
  id: string;
  name: string;
  initialRhythm: ArrestRhythm;
  complications: ReversibleCause[];
  ageMonths: number;
  weight: number;
  backstory: string;
  learningObjectives: string[];
}

export interface SimulationState {
  scenario: SimulationScenario;
  currentRhythm: ArrestRhythm;
  timeElapsed: number; // seconds
  shocksDelivered: number;
  epiDoses: number;
  compressionQuality: number; // 0-100
  cprStarted: boolean;
  defibAttached: boolean;
  rhythmAssessed: boolean;
  complications: ReversibleCause[];
  resolvedComplications: ReversibleCause[];
  events: SimulationEvent[];
}

export interface SimulationEvent {
  timestamp: number;
  type: 'action' | 'rhythm_change' | 'complication' | 'feedback';
  description: string;
  correct?: boolean;
}

export interface PerformanceMetrics {
  timeToFirstCompression: number;
  timeToFirstShock: number;
  timeToFirstEpinephrine: number;
  compressionFraction: number; // percentage
  shocksDelivered: number;
  epiDosesGiven: number;
  guidelineAdherence: number; // 0-100
  complicationsIdentified: number;
  complicationsResolved: number;
  overallScore: number; // 0-100
  feedback: string[];
}

// Predefined scenarios
const scenarios: SimulationScenario[] = [
  {
    id: 'vf_witnessed',
    name: 'Witnessed VF Arrest',
    initialRhythm: 'VF',
    complications: [],
    ageMonths: 84, // 7 years
    weight: 25,
    backstory: 'A 7-year-old child collapsed during soccer practice. Bystander CPR started immediately.',
    learningObjectives: [
      'Immediate defibrillation for witnessed VF',
      'High-quality CPR with minimal interruptions',
      'Epinephrine timing after 2nd shock'
    ]
  },
  {
    id: 'pea_hypovolemia',
    name: 'PEA from Hypovolemia',
    initialRhythm: 'PEA',
    complications: ['hypovolemia'],
    ageMonths: 36, // 3 years
    weight: 14,
    backstory: 'A 3-year-old with severe diarrhea for 3 days. Found unresponsive at home.',
    learningObjectives: [
      'Recognize PEA and avoid defibrillation',
      'Identify hypovolemia as reversible cause',
      'Aggressive fluid resuscitation during CPR'
    ]
  },
  {
    id: 'asystole_hypoxia',
    name: 'Asystole from Respiratory Failure',
    initialRhythm: 'asystole',
    complications: ['hypoxia'],
    ageMonths: 18, // 1.5 years
    weight: 11,
    backstory: 'An 18-month-old with severe bronchiolitis. Progressive respiratory distress led to arrest.',
    learningObjectives: [
      'Recognize hypoxic arrest (asystole)',
      'Prioritize airway and ventilation',
      'Early epinephrine in asystole'
    ]
  },
  {
    id: 'vf_hyperkalemia',
    name: 'VF with Hyperkalemia',
    initialRhythm: 'VF',
    complications: ['hyperkalemia'],
    ageMonths: 120, // 10 years
    weight: 32,
    backstory: 'A 10-year-old with chronic kidney disease missed dialysis for 3 days. Collapsed at home.',
    learningObjectives: [
      'Recognize hyperkalemia as reversible cause',
      'Administer calcium chloride during CPR',
      'Consider sodium bicarbonate and insulin/glucose'
    ]
  },
  {
    id: 'pea_tension_pneumo',
    name: 'PEA from Tension Pneumothorax',
    initialRhythm: 'PEA',
    complications: ['tension_pneumothorax'],
    ageMonths: 96, // 8 years
    weight: 28,
    backstory: 'An 8-year-old involved in motor vehicle collision. Chest trauma with respiratory distress progressing to arrest.',
    learningObjectives: [
      'Recognize tension pneumothorax clinically',
      'Perform needle decompression during CPR',
      'Reassess after decompression'
    ]
  },
  {
    id: 'refractory_vf',
    name: 'Refractory VF',
    initialRhythm: 'VF',
    complications: ['hypothermia', 'toxins'],
    ageMonths: 60, // 5 years
    weight: 20,
    backstory: 'A 5-year-old found in cold water after 10 minutes. Core temperature 28°C. Possible ingestion.',
    learningObjectives: [
      'Recognize refractory VF',
      'Consider double sequential defibrillation',
      'Manage hypothermia and toxins',
      'Know when to consider ECPR'
    ]
  }
];

/**
 * Generate a random simulation scenario
 */
export function generateRandomScenario(): SimulationScenario {
  const randomIndex = Math.floor(Math.random() * scenarios.length);
  return scenarios[randomIndex];
}

/**
 * Get all available scenarios
 */
export function getAllScenarios(): SimulationScenario[] {
  return scenarios;
}

/**
 * Initialize simulation state from scenario
 */
export function initializeSimulation(scenario: SimulationScenario): SimulationState {
  return {
    scenario,
    currentRhythm: scenario.initialRhythm,
    timeElapsed: 0,
    shocksDelivered: 0,
    epiDoses: 0,
    compressionQuality: 0,
    cprStarted: false,
    defibAttached: false,
    rhythmAssessed: false,
    complications: [...scenario.complications],
    resolvedComplications: [],
    events: []
  };
}

/**
 * Simulate rhythm change based on interventions and time
 */
export function simulateRhythmChange(state: SimulationState): ArrestRhythm {
  const { currentRhythm, shocksDelivered, epiDoses, timeElapsed, resolvedComplications, complications } = state;

  // Check if all complications resolved
  const allComplicationsResolved = complications.every(c => resolvedComplications.includes(c));

  // VF/pVT logic
  if (currentRhythm === 'VF' || currentRhythm === 'pVT') {
    // After 3+ shocks with good CPR and epi, 40% chance of ROSC if complications resolved
    if (shocksDelivered >= 3 && epiDoses >= 2 && allComplicationsResolved) {
      if (Math.random() < 0.4) {
        return 'ROSC';
      }
    }

    // After 5+ shocks without resolving complications, 30% chance of deteriorating to PEA
    if (shocksDelivered >= 5 && !allComplicationsResolved) {
      if (Math.random() < 0.3) {
        return 'PEA';
      }
    }

    // After 8+ shocks, 20% chance of asystole (poor prognosis)
    if (shocksDelivered >= 8) {
      if (Math.random() < 0.2) {
        return 'asystole';
      }
    }

    return currentRhythm; // Stay in VF/pVT
  }

  // PEA logic
  if (currentRhythm === 'PEA') {
    // If complications resolved with good CPR and epi, 50% chance of ROSC
    if (epiDoses >= 2 && allComplicationsResolved && timeElapsed >= 240) {
      if (Math.random() < 0.5) {
        return 'ROSC';
      }
    }

    // If unresolved complications after 6+ minutes, 40% chance of asystole
    if (timeElapsed >= 360 && !allComplicationsResolved) {
      if (Math.random() < 0.4) {
        return 'asystole';
      }
    }

    return 'PEA';
  }

  // Asystole logic
  if (currentRhythm === 'asystole') {
    // Very poor prognosis - only 10% chance of ROSC if complications resolved and aggressive treatment
    if (epiDoses >= 3 && allComplicationsResolved && timeElapsed >= 300) {
      if (Math.random() < 0.1) {
        return 'ROSC';
      }
    }

    return 'asystole';
  }

  return currentRhythm;
}

/**
 * Calculate performance metrics from simulation state
 */
export function calculatePerformanceMetrics(state: SimulationState): PerformanceMetrics {
  const { events, timeElapsed, shocksDelivered, epiDoses, complications, resolvedComplications, currentRhythm } = state;

  // Find key timing events
  const firstCompressionEvent = events.find(e => e.description.includes('CPR started'));
  const firstShockEvent = events.find(e => e.description.includes('Shock delivered'));
  const firstEpiEvent = events.find(e => e.description.includes('Epinephrine given'));

  const timeToFirstCompression = firstCompressionEvent ? firstCompressionEvent.timestamp : timeElapsed;
  const timeToFirstShock = firstShockEvent ? firstShockEvent.timestamp : (state.scenario.initialRhythm === 'VF' || state.scenario.initialRhythm === 'pVT' ? timeElapsed : 0);
  const timeToFirstEpinephrine = firstEpiEvent ? firstEpiEvent.timestamp : timeElapsed;

  // Calculate compression fraction (assume 80% if CPR started, 0% otherwise)
  const cprEvents = events.filter(e => e.description.includes('CPR') || e.description.includes('compressions'));
  const compressionFraction = cprEvents.length > 0 ? 80 : 0;

  // Calculate guideline adherence
  let adherenceScore = 100;
  const feedback: string[] = [];

  // Penalty for delayed CPR (should start within 10 seconds)
  if (timeToFirstCompression > 10) {
    adherenceScore -= 20;
    feedback.push(`⚠️ CPR started late (${timeToFirstCompression}s). Should start within 10 seconds.`);
  } else {
    feedback.push(`✅ Excellent CPR initiation (${timeToFirstCompression}s)`);
  }

  // Penalty for delayed shock in shockable rhythm
  if ((state.scenario.initialRhythm === 'VF' || state.scenario.initialRhythm === 'pVT') && timeToFirstShock > 60) {
    adherenceScore -= 15;
    feedback.push(`⚠️ First shock delayed (${timeToFirstShock}s). Should shock within 60 seconds for witnessed VF.`);
  }

  // Penalty for delayed epinephrine
  if (timeToFirstEpinephrine > 180) {
    adherenceScore -= 10;
    feedback.push(`⚠️ Epinephrine delayed (${Math.floor(timeToFirstEpinephrine / 60)} min). Should give within 3 minutes.`);
  }

  // Bonus for identifying complications
  const complicationsIdentified = resolvedComplications.length;
  if (complications.length > 0) {
    const identificationRate = complicationsIdentified / complications.length;
    if (identificationRate === 1) {
      feedback.push(`✅ All reversible causes identified and treated`);
    } else if (identificationRate > 0) {
      adherenceScore -= 15;
      feedback.push(`⚠️ Only ${complicationsIdentified}/${complications.length} reversible causes identified`);
    } else {
      adherenceScore -= 25;
      feedback.push(`❌ Failed to identify reversible causes: ${complications.join(', ')}`);
    }
  }

  // Outcome feedback
  if (currentRhythm === 'ROSC') {
    feedback.push(`🎉 ROSC achieved! Excellent resuscitation.`);
  } else {
    feedback.push(`Continue resuscitation. Consider ECPR if available.`);
  }

  // Overall score calculation
  const outcomeScore = currentRhythm === 'ROSC' ? 30 : 0;
  const timingScore = Math.max(0, 30 - (timeToFirstCompression / 10) - (timeToFirstShock / 60) - (timeToFirstEpinephrine / 180));
  const complicationScore = complications.length > 0 ? (complicationsIdentified / complications.length) * 20 : 20;
  const overallScore = Math.min(100, Math.max(0, adherenceScore * 0.5 + outcomeScore + timingScore + complicationScore));

  return {
    timeToFirstCompression,
    timeToFirstShock,
    timeToFirstEpinephrine,
    compressionFraction,
    shocksDelivered,
    epiDosesGiven: epiDoses,
    guidelineAdherence: Math.max(0, adherenceScore),
    complicationsIdentified,
    complicationsResolved: resolvedComplications.length,
    overallScore: Math.round(overallScore),
    feedback
  };
}

/**
 * Get hint for current simulation state
 */
export function getSimulationHint(state: SimulationState): string | null {
  const { currentRhythm, cprStarted, defibAttached, rhythmAssessed, shocksDelivered, epiDoses, timeElapsed, complications, resolvedComplications } = state;

  // Priority hints
  if (!cprStarted && timeElapsed > 5) {
    return "💡 Hint: Start CPR immediately! Every second counts.";
  }

  if ((currentRhythm === 'VF' || currentRhythm === 'pVT') && !defibAttached && timeElapsed > 20) {
    return "💡 Hint: Attach defibrillator pads for shockable rhythm.";
  }

  if ((currentRhythm === 'VF' || currentRhythm === 'pVT') && defibAttached && !rhythmAssessed && timeElapsed > 30) {
    return "💡 Hint: Assess rhythm and prepare to shock.";
  }

  if ((currentRhythm === 'VF' || currentRhythm === 'pVT') && shocksDelivered === 0 && timeElapsed > 60) {
    return "💡 Hint: Deliver first shock for VF/pVT.";
  }

  if (epiDoses === 0 && timeElapsed > 180) {
    return "💡 Hint: Consider epinephrine - it's been 3 minutes.";
  }

  if (complications.length > 0 && resolvedComplications.length === 0 && timeElapsed > 120) {
    const unresolvedComplication = complications[0];
    return `💡 Hint: Check for reversible causes. Consider: ${unresolvedComplication.replace('_', ' ')}`;
  }

  if (shocksDelivered >= 5 && complications.some(c => !resolvedComplications.includes(c))) {
    return "💡 Hint: Refractory arrest - aggressively treat reversible causes!";
  }

  return null;
}
